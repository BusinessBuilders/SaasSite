'use client';
// src/features/atlas/AtlasHero.tsx — the whole offer above the fold: pick a
// trade, read the one-sentence disclosure, tap once, talk.
//
// One tap is the entire consent flow, so the disclosure sits directly under
// the button rather than behind a link, and the live phone line is always one
// tap away in case the demo cannot run.
//
// Layout note: the orb is placed by grid coordinates, not by DOM order, so the
// SAME element sits beside the copy on a phone and in the right-hand column on
// a desktop — and, because it lives outside the idle/live branch below, it is
// never remounted when the picker is swapped for the call panel. It is the one
// thing on the page that has to stay visually continuous.
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';

import type { AtlasPersona } from '@/app/api/atlas/session/schema';

import { AtlasOrb } from './AtlasOrb';
import { AtlasSessionPanel } from './AtlasSessionPanel';
import {
  ATLAS_CONSENT_TEXT,
  ATLAS_PHONE_DISPLAY,
  ATLAS_PHONE_TEL,
  atlasPriceMonthly,
} from './content';
import { Eyebrow } from './Eyebrow';
import { PersonaPicker } from './PersonaPicker';
import { atlasStatusText } from './statusText';
import { useAtlasSession } from './useAtlasSession';

const PRICE_MONTHLY = atlasPriceMonthly();

export const AtlasHero = () => {
  const [persona, setPersona] = useState<AtlasPersona>('landscaping');
  const session = useAtlasSession();
  const { status, agentState, level } = session;
  const idle = status === 'idle';
  const startRef = useRef<HTMLButtonElement>(null);
  const wasIdle = useRef(idle);

  // Coming BACK to the picker (the panel's "Talk again") unmounts the panel
  // that held focus, which would drop a keyboard visitor onto <body> in the
  // middle of the page. The Start button is where they were heading.
  useEffect(() => {
    const returned = idle && !wasIdle.current;
    wasIdle.current = idle;

    if (returned) {
      startRef.current?.focus({ preventScroll: true });
    }
  }, [idle]);

  return (
    <section
      // The phone layout is tight on purpose. At 390x844 the cookie bar owns
      // the bottom 81 px of a first visit, and the AI disclosure plus its
      // privacy link are the last things above it: every pixel saved here is
      // clearance under the sentence a visitor is agreeing to. An e2e test at
      // 390 px holds that clearance.
      //
      // 2026-09-14: the consent sentence gained the clause about the text going
      // to our AI provider, which is one more line of text-xs — and that line
      // pushed the privacy link 3 px UNDER the bar (the e2e caught it). The
      // 20 px came back out of the phone-only rhythm above: pt-2, gap-y-1.5,
      // the h1's mt-1, the subhead's mt-2 and the Start button's mt-3, each
      // with its sm: value preserved so nothing above 640 px moved. Measured
      // after the change: privacy link bottom 744, bar top 763 — 19 px clear.
      // If the disclosure grows again, take the pixels from the picker, not
      // from this clearance.
      className="relative flex min-h-dvh flex-col justify-start px-4 pb-10 pt-2 sm:pt-3 md:justify-center md:pb-16 md:pt-0"
      aria-labelledby="atlas-hero-heading"
    >
      <div className="mx-auto w-full max-w-6xl">
        <div className="grid gap-y-1.5 sm:gap-y-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center lg:gap-x-12">
          <div className="lg:col-start-1 lg:row-start-1">
            <Eyebrow>Live AI receptionist</Eyebrow>
            <h1
              id="atlas-hero-heading"
              className="mt-1 font-bb-display-2 text-[1.65rem] font-extrabold leading-tight text-bb-cream-bright sm:mt-3 sm:text-4xl md:text-5xl"
            >
              Hear the receptionist you’d hire, before you hire it.
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-snug text-bb-taupe sm:mt-4 sm:text-base sm:leading-relaxed md:text-lg">
              Atlas answers your phone the way you would: every call, every hour,
              in your words. Try it right now, out loud.
            </p>
          </div>

          {/* The orb. Centred above the picker on a phone, the right-hand
              column on a desktop — one element placed two ways, so it is never
              remounted and never flickers when a call starts. */}
          <div className="size-14 justify-self-center sm:size-28 lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:size-56 lg:self-center xl:size-64">
            <AtlasOrb
              state={status === 'live' ? agentState : 'idle'}
              level={level}
              label={
                idle ? 'Atlas: ready to talk' : `Atlas: ${atlasStatusText(status, agentState)}`
              }
              size="100%"
            />
          </div>

          {/* The live area. A fixed height on desktop (the transcript scrolls
              inside it) so the headline above does not drift down the screen as
              Atlas talks; a floor on smaller screens, where the page stacks.
              The desktop height is MEASURED, not guessed: with the price line
              present (NEXT_PUBLIC_ATLAS_PRICE_MONTHLY=99) the idle column is
              exactly 320 px at 1280 wide, which the old h-80 matched with zero
              slack. 23rem leaves 48 px of headroom AND, because the hero is
              vertically centred on desktop, lifts the Start button 24 px — out
              from under the cookie card it used to sit behind. Two e2e tests
              hold both halves of that. */}
          <div
            data-atlas-live-area
            className="min-h-80 sm:min-h-96 lg:col-start-1 lg:row-start-2 lg:h-[23rem] lg:min-h-0"
          >
            {idle
              ? (
                  <>
                    <PersonaPicker value={persona} onChange={setPersona} />
                    <div className="mt-3 sm:mt-4">
                      <button
                        ref={startRef}
                        type="button"
                        onClick={() => void session.start(persona)}
                        className="bb-btn bb-btn-primary w-full !py-3 sm:w-auto sm:!py-3.5"
                      >
                        Start talking to Atlas
                      </button>
                    </div>
                    <p className="mt-2 max-w-xl text-xs leading-snug text-bb-dust sm:mt-3 sm:leading-relaxed">
                      {ATLAS_CONSENT_TEXT}
                      {' '}
                      {/* whitespace-nowrap: with the longer consent sentence
                          this link began breaking mid-phrase ("How we" at the
                          end of one line, "handle it" at the start of the
                          next), which splits the privacy promise into two 47 px
                          tap targets on a phone. Kept whole it wraps as one
                          unit instead. */}
                      <Link
                        href="/privacy-policy#atlas-voice-demo"
                        className="whitespace-nowrap text-bb-teal-soft underline underline-offset-4 transition-colors hover:text-bb-cream"
                      >
                        How we handle it
                      </Link>
                    </p>
                    <p className="mt-2.5 text-sm text-bb-taupe sm:mt-3">
                      <a
                        href={`tel:${ATLAS_PHONE_TEL}`}
                        className="underline underline-offset-4 transition-colors hover:text-bb-cream"
                      >
                        {`or call the live line ${ATLAS_PHONE_DISPLAY}`}
                      </a>
                    </p>
                    {PRICE_MONTHLY && (
                      <p className="mt-2 text-xs text-bb-dust">
                        {`USD ${PRICE_MONTHLY} per month per line. No contract.`}
                      </p>
                    )}
                  </>
                )
              : (
                  <AtlasSessionPanel {...session}>
                    {status === 'ended' && (
                      <div className="mt-4 flex flex-wrap items-center gap-4">
                        <p className="text-base font-bold text-bb-cream">
                          Thanks — William will be in touch.
                        </p>
                        {/* Back to the picker rather than straight into a
                            second call with the same trade: after hearing
                            Atlas answer for a landscaper, the next thing most
                            people want is to hear it answer for THEIRS, and
                            until now the only way back to that choice was to
                            reload the page. */}
                        <button
                          type="button"
                          onClick={() => void session.reset()}
                          className="bb-btn bb-btn-ghost !px-5 !py-2 !text-sm"
                        >
                          Talk again
                        </button>
                      </div>
                    )}
                    {status === 'error' && (
                      // Two ways out, because "Try again" redials the SAME
                      // trade — and if the reason it failed was the persona,
                      // or the visitor has simply had enough of hearing Atlas
                      // answer for a landscaper, retrying is the wrong door.
                      // Without the second button a failed call was a dead end:
                      // the picker and the Start button are unmounted for the
                      // whole life of a session, so only a page reload got them
                      // back.
                      <div className="mt-4 flex flex-wrap gap-3">
                        <button
                          type="button"
                          onClick={() => void session.start(persona)}
                          className="bb-btn bb-btn-ghost !px-5 !py-2 !text-sm"
                        >
                          Try again
                        </button>
                        <button
                          type="button"
                          onClick={() => void session.reset()}
                          className="bb-btn bb-btn-ghost !px-5 !py-2 !text-sm"
                        >
                          Choose another business
                        </button>
                      </div>
                    )}
                  </AtlasSessionPanel>
                )}
          </div>
        </div>
      </div>
    </section>
  );
};
