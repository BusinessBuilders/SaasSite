'use client';
// src/features/atlas/AtlasSessionPanel.tsx — what the visitor looks at while
// they are talking to Atlas: the orb, one honest status line, the running
// transcript, the clock, and the two controls (mute, hang up).
//
// Every field comes from useAtlasSession(); this component holds no state of
// its own, so what is on screen can never disagree with the live session.
import { useEffect, useRef } from 'react';

import { AtlasOrb } from './AtlasOrb';
import { ATLAS_PHONE_DISPLAY, ATLAS_PHONE_TEL } from './content';
import type { useAtlasSession } from './useAtlasSession';

type Session = ReturnType<typeof useAtlasSession>;
type Props = Pick<
  Session,
  | 'status'
  | 'agentState'
  | 'captions'
  | 'level'
  | 'error'
  | 'elapsedSec'
  | 'leadCaptured'
  | 'bookedSpoken'
  | 'muted'
  | 'end'
  | 'toggleMute'
  | 'audioElRef'
>;

const formatElapsed = (seconds: number) =>
  `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;

// What the status line says, in the visitor's words. `live` + agentState
// 'idle' is the gap between Atlas finishing a sentence and the worker
// reporting the next state — the microphone is open throughout, so
// "Listening" is the truthful label for it.
const statusLine = (status: Props['status'], agentState: Props['agentState']) => {
  if (status === 'requesting' || status === 'connecting') {
    return 'Connecting…';
  }
  if (status === 'waiting_agent') {
    return 'Waiting for Atlas…';
  }
  if (status === 'ended') {
    return 'Ended';
  }
  if (agentState === 'thinking') {
    return 'Thinking';
  }
  if (agentState === 'speaking') {
    return 'Speaking';
  }
  return 'Listening';
};

export const AtlasSessionPanel = (props: Props) => {
  const {
    status,
    agentState,
    captions,
    level,
    error,
    elapsedSec,
    leadCaptured,
    bookedSpoken,
    muted,
    end,
    toggleMute,
    audioElRef,
  } = props;
  const live = status === 'live';
  const transcriptRef = useRef<HTMLDivElement>(null);

  // Keep the newest line in view without stealing the page's scroll position.
  useEffect(() => {
    const box = transcriptRef.current;
    if (box) {
      box.scrollTop = box.scrollHeight;
    }
  }, [captions]);

  return (
    <div
      className="rounded-lg border p-5 sm:p-6"
      style={{ borderColor: 'var(--bb-border-hair)', background: 'var(--bb-bg-elevated)' }}
    >
      {/*
        The agent's audio plays here. useAtlasSession() ends the call loudly if
        this element is missing, so it must render for every status — never
        behind a conditional. The live transcript below is this audio's caption
        track, which is why the jsx-a11y rule is waived rather than satisfied
        with an empty <track>.
      */}
      {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
      <audio ref={audioElRef} autoPlay playsInline />

      <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-center sm:gap-6">
        <AtlasOrb state={live ? agentState : 'idle'} level={level} size={140} />

        <div className="min-w-0 flex-1 text-center sm:text-left">
          {status === 'error' && error
            ? (
                <p className="text-base font-bold" style={{ color: 'var(--bb-brick-soft)' }}>
                  {error.message}
                  {' '}
                  <a
                    href={`tel:${ATLAS_PHONE_TEL}`}
                    className="underline underline-offset-4"
                    style={{ color: 'var(--bb-link)' }}
                  >
                    {ATLAS_PHONE_DISPLAY}
                  </a>
                </p>
              )
            : (
                <p
                  className="text-xs font-bold uppercase tracking-[0.16em]"
                  style={{ color: 'var(--bb-orange)' }}
                >
                  {statusLine(status, agentState)}
                </p>
              )}

          {/* The clock only appears once a call has actually run: a 0:00 next
              to a failure message reads as a call that happened and did not. */}
          {(live || status === 'ended') && (
            <p className="mt-2 font-mono text-sm" style={{ color: 'var(--bb-fg-subtle)' }}>
              {formatElapsed(elapsedSec)}
            </p>
          )}

          {(leadCaptured || bookedSpoken) && (
            <div className="mt-3 flex flex-wrap justify-center gap-2 sm:justify-start">
              {leadCaptured && <span className="bb-tag bb-tag-teal">Details saved</span>}
              {bookedSpoken && (
                <span className="bb-tag bb-tag-gold">{`Booked: ${bookedSpoken}`}</span>
              )}
            </div>
          )}
        </div>
      </div>

      <div
        ref={transcriptRef}
        aria-live="polite"
        aria-label="Live transcript"
        className="mt-5 flex max-h-56 flex-col gap-2 overflow-y-auto"
      >
        {captions.length === 0
          ? (
              // Nothing was said yet. In the error state that promise would be
              // a lie — there is no conversation coming — so it is not made.
              status !== 'error' && (
                <p className="text-sm" style={{ color: 'var(--bb-fg-subtle)' }}>
                  The conversation appears here as it happens.
                </p>
              )
            )
          : (
              captions.map(caption => (
                <p
                  key={caption.id}
                  data-caption-role={caption.role}
                  className={
                    caption.role === 'visitor'
                      ? 'self-end text-right text-sm leading-snug'
                      : 'self-start text-left text-sm leading-snug'
                  }
                  style={{
                    maxWidth: '85%',
                    color: caption.role === 'visitor' ? 'var(--bb-taupe)' : 'var(--bb-cream)',
                  }}
                >
                  {caption.text}
                </p>
              ))
            )}
      </div>

      {(live || status === 'waiting_agent') && (
        <div className="mt-5 flex flex-wrap justify-center gap-3 sm:justify-start">
          <button
            type="button"
            onClick={toggleMute}
            disabled={!live}
            className="bb-btn bb-btn-ghost !px-5 !py-2 !text-sm disabled:cursor-not-allowed disabled:opacity-60"
          >
            {muted ? 'Unmute' : 'Mute'}
          </button>
          <button
            type="button"
            onClick={() => void end()}
            className="bb-btn bb-btn-primary !px-5 !py-2 !text-sm"
          >
            End
          </button>
        </div>
      )}
    </div>
  );
};
