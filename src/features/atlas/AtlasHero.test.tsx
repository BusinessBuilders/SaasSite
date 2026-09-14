// One thing is pinned here that nothing else can catch: after a call has
// ended, is there a way back to the persona picker? The panel replaces the
// picker and the Start button for the whole life of a session, so if "Talk
// again" does not restore `idle` the only way to hear Atlas answer for a
// different trade is to reload the page.
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';

import { AtlasHero } from './AtlasHero';
import type { useAtlasSession } from './useAtlasSession';

type Session = ReturnType<typeof useAtlasSession>;

// The orb pulls in GSAP, whose ScrollTrigger asks for matchMedia at import
// time; jsdom has none. Hoisted so it exists before any import runs.
vi.hoisted(() => {
  (globalThis as { matchMedia?: unknown }).matchMedia = (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  });
});

// next/link wants the App Router's context, which no unit test has. The hero
// uses it for one ordinary in-page link, so an <a> is a faithful stand-in.
vi.mock('next/link', () => ({
  default: ({ href, children, ...rest }: { href: string; children: ReactNode }) => (
    <a href={href} {...rest}>{children}</a>
  ),
}));

const mocked = vi.hoisted(() => ({ session: null as unknown as Session }));

vi.mock('./useAtlasSession', () => ({ useAtlasSession: () => mocked.session }));

const fakeSession = (overrides: Partial<Session>): Session => ({
  status: 'idle',
  agentState: 'idle',
  captions: [],
  level: 0,
  error: null,
  elapsedSec: 0,
  leadCaptured: false,
  bookedSpoken: null,
  muted: false,
  cancelled: false,
  start: vi.fn(async () => {}),
  end: vi.fn(async () => {}),
  reset: vi.fn(),
  toggleMute: vi.fn(async () => {}),
  audioElRef: { current: null },
  ...overrides,
});

describe('AtlasHero', () => {
  it('offers the picker and the Start button while idle', () => {
    mocked.session = fakeSession({ status: 'idle' });
    render(<AtlasHero />);

    expect(screen.getByRole('radiogroup', { name: /Which business/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Start talking to Atlas' })).toBeInTheDocument();
  });

  it('sends "Talk again" back to the picker rather than straight into a second call', async () => {
    mocked.session = fakeSession({ status: 'ended' });
    render(<AtlasHero />);

    await userEvent.click(screen.getByRole('button', { name: 'Talk again' }));

    expect(mocked.session.reset).toHaveBeenCalledTimes(1);
    expect(mocked.session.start).not.toHaveBeenCalled();
  });

  it('restores the picker and puts focus on Start when the session resets', () => {
    mocked.session = fakeSession({ status: 'ended' });

    const { rerender } = render(<AtlasHero />);

    expect(screen.queryByRole('button', { name: 'Start talking to Atlas' })).not.toBeInTheDocument();

    mocked.session = fakeSession({ status: 'idle' });
    rerender(<AtlasHero />);

    const start = screen.getByRole('button', { name: 'Start talking to Atlas' });

    expect(screen.getByRole('radiogroup', { name: /Which business/ })).toBeInTheDocument();
    // The panel that held focus has just unmounted; without this the visitor is
    // left on <body> in the middle of the page.
    expect(start).toHaveFocus();
  });

  it('retries the same call from "Try again" after a failure', async () => {
    mocked.session = fakeSession({
      status: 'error',
      error: { reason: 'no_agent', message: 'Atlas is on another call right now.' },
    });
    render(<AtlasHero />);

    await userEvent.click(screen.getByRole('button', { name: 'Try again' }));

    expect(mocked.session.start).toHaveBeenCalledWith('landscaping');
    expect(mocked.session.reset).not.toHaveBeenCalled();
  });

  it('also offers a way back to the picker after a failure, not just a retry', async () => {
    mocked.session = fakeSession({
      status: 'error',
      error: { reason: 'no_agent', message: 'Atlas is on another call right now.' },
    });
    render(<AtlasHero />);

    // "Try again" redials the SAME trade. Without this second door a failed
    // call was a dead end: the picker is unmounted for the life of a session,
    // so only a page reload got it back.
    await userEvent.click(screen.getByRole('button', { name: 'Choose another business' }));

    expect(mocked.session.reset).toHaveBeenCalledTimes(1);
    expect(mocked.session.start).not.toHaveBeenCalled();
  });
});
