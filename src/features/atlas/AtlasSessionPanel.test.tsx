// The panel is what a visitor stares at for the whole call, so the things
// asserted here are the ones that are invisible until they are wrong: whether
// the box has a role to hang its name on, whether focus survives a retry, and
// whether a clock is shown for a call that never happened.
import { render, screen } from '@testing-library/react';
import type { MutableRefObject } from 'react';
import { describe, expect, it, vi } from 'vitest';

import { AtlasSessionPanel } from './AtlasSessionPanel';
import type { useAtlasSession } from './useAtlasSession';

type Session = ReturnType<typeof useAtlasSession>;

const panelProps = (overrides: Partial<Session> = {}) => {
  const audioElRef: MutableRefObject<HTMLAudioElement | null> = { current: null };

  return {
    status: 'live' as Session['status'],
    agentState: 'listening' as Session['agentState'],
    captions: [] as Session['captions'],
    error: null as Session['error'],
    elapsedSec: 0,
    leadCaptured: false,
    bookedSpoken: null as Session['bookedSpoken'],
    muted: false,
    cancelled: false,
    end: vi.fn(async () => {}),
    toggleMute: vi.fn(async () => {}),
    audioElRef,
    ...overrides,
  };
};

const panel = () => screen.getByRole('group', { name: 'Atlas call' });

describe('AtlasSessionPanel', () => {
  it('gives its accessible name something to attach to', () => {
    render(<AtlasSessionPanel {...panelProps()} />);

    // aria-label on a role-less <div> names nothing: assistive technology has
    // no element to announce. role="group" is what makes "Atlas call" audible.
    expect(panel()).toBeInTheDocument();
  });

  it('makes the scrolling transcript a tab stop of its own', () => {
    render(
      <AtlasSessionPanel
        {...panelProps({ captions: [{ id: 'c1', role: 'agent', text: 'Hello', final: true }] })}
      />,
    );

    // Without a tab stop a keyboard visitor cannot scroll back to anything that
    // has already left the top of the fixed-height box.
    expect(screen.getByRole('log', { name: 'Live transcript' })).toHaveAttribute('tabindex', '0');
  });

  it('takes focus when the call starts', () => {
    render(<AtlasSessionPanel {...panelProps({ status: 'requesting' })} />);

    expect(panel()).toHaveFocus();
  });

  it('takes focus back when a second call is dialled from "Try again"', () => {
    const { rerender } = render(
      <AtlasSessionPanel
        {...panelProps({ status: 'error', error: { reason: 'no_agent', message: 'Atlas is busy.' } })}
      />,
    );

    // Pressing "Try again" unmounts the button that held focus, which drops it
    // onto <body> — the visitor is dialling and nothing says so.
    panel().blur();

    expect(panel()).not.toHaveFocus();

    // 'requesting_mic' is the first status a retry reaches now: the microphone
    // is asked for before a session is spent.
    rerender(<AtlasSessionPanel {...panelProps({ status: 'requesting_mic' })} />);

    expect(panel()).toHaveFocus();
  });

  it('shows the clock for a call that ran', () => {
    render(<AtlasSessionPanel {...panelProps({ status: 'ended', elapsedSec: 74 })} />);

    expect(screen.getByText('1:14')).toBeInTheDocument();
  });

  it('shows no clock at all for a dial the visitor cancelled', () => {
    render(<AtlasSessionPanel {...panelProps({ status: 'ended', cancelled: true, elapsedSec: 0 })} />);

    // A stopwatch reading 0:00 beside "Ended" says a call happened and took no
    // time. Nothing happened: the visitor gave up while it was ringing.
    expect(screen.queryByText('0:00')).not.toBeInTheDocument();
  });
});
