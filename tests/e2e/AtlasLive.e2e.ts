// tests/e2e/AtlasLive.e2e.ts — the one test in this repo that talks to the
// real thing. Nothing here is mocked: the browser gets a fake MICROPHONE (a
// wav of real synthesised speech, see fixtures/make-atlas-visitor.sh) and
// everything downstream of it is production —
//
//   this dev server -> POST /api/atlas/session (signs a token with the same
//   LiveKit key the worker registers with) -> wss://eve.center/atlas-voice on
//   the Contabo VPS -> the atlas-web-voice worker unit on MagicCat -> whisper,
//   the Qwen3.5 endpoint on Nova-Rig, and the Chatterbox voice on :8004.
//
// It therefore needs three things this repo does not own, and it refuses to
// pretend otherwise: ATLAS_E2E=1 says the operator meant it, .env.local
// carries LIVEKIT_URL / LIVEKIT_API_KEY / LIVEKIT_API_SECRET, and the worker
// unit is running. It is a project of its own (`atlas-live`) so `npm run
// test:e2e` never picks it up.
//
//   PORT=3477 ATLAS_E2E=1 npx playwright test --project=atlas-live
//   PORT=3477 ATLAS_E2E=1 ATLAS_E2E_WORKER_CONTROL=1 npx playwright test --project=atlas-live
//
// The second form also runs the worker-down test, which really does stop and
// start atlas-web-voice.service (ours; the phone units are never touched) and
// waits for its /health to come back before it lets go.
import { execFile } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { promisify } from 'node:util';

import type { Page } from '@playwright/test';
import { expect, test } from '@playwright/test';

const run = promisify(execFile);

const WORKER_UNIT = 'atlas-web-voice.service';
const WORKER_HEALTH_URL = 'http://127.0.0.1:8793/health';
const SHOTS_DIR = '.playwright-shots';

// Atlas's opening line is SPOKEN VERBATIM by the worker (worker.py,
// greeting_text() through session.say(..., allow_interruptions=False)) rather
// than generated, precisely so the AI disclosure cannot go missing on a turn
// where the model decides to be brief. That is what makes it fair to assert
// the exact sentence: if this ever stops matching, either the wording changed
// or Atlas stopped disclosing, and both need a human.
const GREETING_DISCLOSURE = 'Hi, I\'m Atlas, an AI receptionist built by Business Builder.';
const GREETING_SAMPLE = 'For this demo I\'m answering for Maple Street Landscaping, a sample landscaping business.';
const GREETING_INVITATION = 'Ask me something the way one of their customers would.';
const GREETING_SENTENCES = [GREETING_DISCLOSURE, GREETING_SAMPLE, GREETING_INVITATION];

// src/features/atlas/useAtlasSession.ts — fail('no_agent', …). This is the
// sentence a visitor reads when LiveKit admits them to a room that no agent
// ever joins, which is exactly what a stopped worker looks like from a browser.
const NO_AGENT_MESSAGE = 'Atlas is on another call right now. Please call the live line or try again in a minute.';

// src/components/analytics/consent.ts. Kept as a literal because Playwright
// serialises the init script below into the browser and it cannot close over
// an import; a drift is caught by the Meta Contact assertion, which only ever
// fires with marketing consent granted.
const CONSENT_KEY = 'bb-cookie-consent';

// ---------------------------------------------------------------------------
// The worker unit
// ---------------------------------------------------------------------------

type Probe = { status: number; body: string };

const probeWorker = async (): Promise<Probe> => {
  try {
    const res = await fetch(WORKER_HEALTH_URL, { signal: AbortSignal.timeout(5000) });
    return { status: res.status, body: (await res.text()).slice(0, 400) };
  } catch (e) {
    // Connection refused is the normal answer while the unit is stopped, so it
    // is a result here, not an exception — the caller decides what it means.
    return { status: 0, body: (e as Error).message };
  }
};

/**
 * Block until the worker's health page is (or is no longer) answering 200.
 * Throws with the last body it saw — a timeout here must name what it saw, or
 * the next person cannot tell "still loading whisper" from "crashed on boot".
 */
const waitForWorker = async (wanted: 'up' | 'down', timeoutMs: number): Promise<Probe> => {
  const deadline = Date.now() + timeoutMs;
  const reached = (probe: Probe) => (probe.status === 200) === (wanted === 'up');
  let last = await probeWorker();

  while (!reached(last) && Date.now() < deadline) {
    await new Promise((resolve) => {
      setTimeout(resolve, 2000);
    });
    last = await probeWorker();
  }

  if (!reached(last)) {
    throw new Error(
      `${WORKER_UNIT} never went ${wanted}: ${WORKER_HEALTH_URL} still answers HTTP ${last.status} — ${last.body}`,
    );
  }

  return last;
};

/**
 * `systemctl --user <action> atlas-web-voice.service`, and nothing else — the
 * phone agent's units are never named here.
 *
 * The budget is three minutes because `stop` BLOCKS until the unit is really
 * down, and a worker that has just held a conversation drains that session,
 * releases the GPU and unloads whisper on the way out (measured 2026-09-14:
 * 20.5 s straight after a live call; a 60 s budget was not enough on the first
 * attempt). A failure re-throws with everything systemd said and how long it
 * waited: "Command failed" on its own tells the next person nothing.
 */
const systemctl = async (action: 'start' | 'stop') => {
  const startedAt = Date.now();
  try {
    await run('systemctl', ['--user', action, WORKER_UNIT], { timeout: 180_000 });
  } catch (e) {
    const failure = e as Error & { code?: number; signal?: string; stdout?: string; stderr?: string };
    throw new Error(
      `systemctl --user ${action} ${WORKER_UNIT} failed after ${Date.now() - startedAt} ms `
      + `(exit ${failure.code ?? '-'}, signal ${failure.signal ?? '-'}): `
      + `${(failure.stderr ?? '').trim() || (failure.stdout ?? '').trim() || failure.message}`,
    );
  }
};

// ---------------------------------------------------------------------------
// The page
// ---------------------------------------------------------------------------

/**
 * Capture what the page reports to GA4 and to the Meta Pixel, and grant
 * marketing consent so the pixel branch of trackAtlas() actually runs.
 *
 * In dev neither tag id is configured, so neither real script loads and these
 * two functions are the only gtag/fbq the page will ever see. The real Meta
 * bootstrap also begins `if (f.fbq) return;`, so even with a pixel id set it
 * would leave this stub in place rather than replace it.
 */
const stubAnalytics = async (page: Page) => {
  await page.addInitScript((consentKey: string) => {
    const w = window as unknown as {
      dataLayer?: unknown[];
      gtag?: (...args: unknown[]) => void;
      fbq?: (...args: unknown[]) => void;
      __atlasGtag?: unknown[][];
      __atlasFbq?: unknown[][];
    };

    try {
      window.localStorage.setItem(consentKey, 'all');
    } catch {
      // Storage blocked. Nothing is silently patched up: the Meta Contact
      // assertion in the test will fail and say the dedupe id never arrived.
    }

    w.__atlasGtag = [];
    w.__atlasFbq = [];
    w.dataLayer = w.dataLayer ?? [];
    w.gtag = (...args: unknown[]) => {
      w.__atlasGtag?.push(args);
      w.dataLayer?.push(args);
    };
    w.fbq = (...args: unknown[]) => {
      w.__atlasFbq?.push(args);
    };
  }, CONSENT_KEY);
};

const gtagEventNames = (page: Page) =>
  page.evaluate(() => {
    const calls = (window as unknown as { __atlasGtag?: unknown[][] }).__atlasGtag ?? [];
    return calls.filter(args => args[0] === 'event').map(args => String(args[1]));
  });

const gtagEventParams = (page: Page, event: string) =>
  page.evaluate((name: string) => {
    const calls = (window as unknown as { __atlasGtag?: unknown[][] }).__atlasGtag ?? [];
    return calls
      .filter(args => args[0] === 'event' && args[1] === name)
      .map(args => JSON.stringify(args[2] ?? {}));
  }, event);

/**
 * The eventID the page attached to the Meta Pixel `Contact` it fires alongside
 * atlas_call_start. It is the same uuid /api/atlas/session minted and handed to
 * the worker in the room metadata, so Meta can deduplicate this browser event
 * against the worker's server-side Conversions API call. Empty means the
 * dedupe key never made it out of the page and Meta would double-count.
 */
const metaContactEventId = (page: Page) =>
  page.evaluate(() => {
    const calls = (window as unknown as { __atlasFbq?: unknown[][] }).__atlasFbq ?? [];
    const contact = calls.find(args => args[0] === 'track' && args[1] === 'Contact');
    return (contact?.[3] as { eventID?: string } | undefined)?.eventID ?? '';
  });

const captionsOf = (page: Page, role: 'agent' | 'visitor') =>
  page.locator(`[data-caption-role="${role}"]`).allTextContents();

const agentText = async (page: Page) => (await captionsOf(page, 'agent')).join(' ');

/** Everything Atlas said that is not part of its fixed greeting. */
const agentReplyText = async (page: Page) => {
  const spoken = await captionsOf(page, 'agent');
  return spoken.filter(text => !GREETING_SENTENCES.some(line => text.includes(line))).join(' ');
};

const transcriptOf = (page: Page) =>
  page.locator('[data-caption-role]').evaluateAll(nodes =>
    nodes.map(node => `${node.getAttribute('data-caption-role')}: ${(node.textContent ?? '').trim()}`));

/**
 * Evidence, not decoration: the latency write-up and every future "did it
 * really work" question are answered from these two files plus the worker's
 * journal. .playwright-shots/ is gitignored.
 */
const saveEvidence = (name: string, lines: string[]) => {
  mkdirSync(SHOTS_DIR, { recursive: true });
  writeFileSync(`${SHOTS_DIR}/${name}`, `${lines.join('\n')}\n`, 'utf8');
};

// ---------------------------------------------------------------------------

// The second lock. playwright.config.ts does not even define the `atlas-live`
// project without ATLAS_E2E, so a plain run cannot reach this file at all —
// this one keeps the requirement true of the FILE rather than of the wiring,
// so moving these tests into another project cannot quietly start dialling
// production.
test.skip(
  !process.env.ATLAS_E2E,
  'live conversation test — set ATLAS_E2E=1 with LiveKit, the worker and .env.local in place',
);

test.describe('Atlas live — a real conversation end to end', () => {
  test('the visitor hears the disclosure, Atlas hears the visitor, and both are captioned', async ({
    page,
    request,
  }) => {
    // Distinguishes the two ways this can fail before a microphone is opened:
    // a red /api/atlas/health is LiveKit or our credentials, never the worker.
    const health = await request.get('/api/atlas/health');

    expect(health.status(), await health.text()).toBe(200);

    const worker = await waitForWorker('up', 60_000);

    expect(worker.status, worker.body).toBe(200);

    await stubAnalytics(page);
    await page.goto('/atlas');
    await page.getByRole('radio', { name: /Landscaping/ }).click();
    await page.getByRole('button', { name: 'Start talking to Atlas' }).click();

    // Dialling, then connected. The fake microphone starts running its 15 s of
    // leading silence at about this moment.
    await expect(page.locator('[aria-label="Atlas call"] [role="status"]').first()).toHaveText(
      /Connecting|Waiting for Atlas|Listening|Speaking|Thinking/,
      { timeout: 30_000 },
    );

    // Atlas's first words, word for word, including the AI disclosure.
    await expect
      .poll(async () => agentText(page), {
        timeout: 60_000,
        message: 'Atlas never captioned its verbatim AI disclosure',
      })
      .toContain(GREETING_DISCLOSURE);

    await expect
      .poll(async () => agentText(page), {
        timeout: 30_000,
        message: 'Atlas never named the sample business it is answering for',
      })
      .toContain('Maple Street Landscaping');

    // The fixture speaks at 15 s. Whisper then has to transcribe it, so this
    // caption lands somewhere around 20-25 s into the call.
    await expect(page.locator('[data-caption-role="visitor"]').first()).toContainText(/clean ?-?ups?/i, {
      timeout: 90_000,
    });

    // And Atlas answers the question that was actually asked.
    await expect
      .poll(async () => agentReplyText(page), {
        timeout: 90_000,
        message: 'Atlas never answered the question about fall cleanups',
      })
      .toMatch(/clean ?-?up|fall/i);

    await page.screenshot({ path: `${SHOTS_DIR}/atlas-live-second-agent-caption.png` });
    saveEvidence('atlas-live-transcript.txt', await transcriptOf(page));

    const duringCall = await gtagEventNames(page);

    expect(duringCall).toContain('atlas_persona_selected');
    expect(duringCall).toContain('atlas_call_start');
    expect(duringCall).not.toContain('atlas_error');
    expect(duringCall.indexOf('atlas_persona_selected')).toBeLessThan(duringCall.indexOf('atlas_call_start'));

    // The Meta dedupe key the worker's Conversions API `Contact` shares.
    expect(await metaContactEventId(page)).not.toBe('');

    await page.getByRole('button', { name: 'End' }).click();

    await expect(page.getByText('Thanks — William will be in touch.')).toBeVisible();
    await expect
      .poll(async () => gtagEventNames(page), { timeout: 20_000, message: 'the call never reported its end' })
      .toContain('atlas_call_end');

    const afterCall = await gtagEventNames(page);

    expect(afterCall.indexOf('atlas_call_start')).toBeLessThan(afterCall.indexOf('atlas_call_end'));

    saveEvidence('atlas-live-events.txt', [
      ...afterCall.map((name, at) => `${at + 1}. ${name}`),
      '',
      ...(await gtagEventParams(page, 'atlas_call_end')).map(params => `atlas_call_end ${params}`),
    ]);
  });
});

test.describe('Atlas live — LiveKit is up and the worker is stopped', () => {
  test.skip(
    !process.env.ATLAS_E2E_WORKER_CONTROL,
    `set ATLAS_E2E_WORKER_CONTROL=1 to let this test stop and start ${WORKER_UNIT}`,
  );

  test.beforeAll(async () => {
    await systemctl('stop');
    await waitForWorker('down', 60_000);
  });

  // Always, including after a failure: leaving the production worker stopped
  // because a test threw would take the live demo down for real.
  test.afterAll(async () => {
    await systemctl('start');
    await waitForWorker('up', 300_000);
  });

  test('a visitor admitted to a room no agent joins is told so, and offered the phone', async ({
    page,
    request,
  }) => {
    // LiveKit itself is healthy — this run is about the worker and nothing else.
    const health = await request.get('/api/atlas/health');

    expect(health.status(), await health.text()).toBe(200);

    await stubAnalytics(page);
    await page.goto('/atlas');
    await page.getByRole('radio', { name: /Landscaping/ }).click();
    await page.getByRole('button', { name: 'Start talking to Atlas' }).click();

    // useAtlasSession waits 8 s for an agent participant before giving up.
    await expect(page.getByText(NO_AGENT_MESSAGE)).toBeVisible({ timeout: 45_000 });
    await expect(page.getByRole('link', { name: '(508) 886-3046' }).first()).toBeVisible();

    await expect
      .poll(async () => gtagEventNames(page), { timeout: 20_000, message: 'the failure was never reported' })
      .toContain('atlas_error');

    expect((await gtagEventParams(page, 'atlas_error')).join(' ')).toContain('no_agent');

    saveEvidence('atlas-live-worker-down.txt', [
      `visitor message: ${NO_AGENT_MESSAGE}`,
      ...(await gtagEventParams(page, 'atlas_error')).map(params => `atlas_error ${params}`),
    ]);
  });
});
