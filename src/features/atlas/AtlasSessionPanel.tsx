'use client';
// src/features/atlas/AtlasSessionPanel.tsx — what the visitor reads while they
// are talking to Atlas: one honest status line, the running transcript, the
// clock, and the controls (mute, hang up, or cancel while it is still dialling).
//
// Every field comes from useAtlasSession(); this component holds no state of
// its own, so what is on screen can never disagree with the live session. The
// orb belongs to the hero, not to this panel, so the same orb element survives
// the swap from the idle page into a live call.
import type { ReactNode } from 'react';
import { useEffect, useRef } from 'react';

import { ATLAS_PHONE_DISPLAY, ATLAS_PHONE_TEL } from './content';
import { atlasStatusText } from './statusText';
import type { useAtlasSession } from './useAtlasSession';

type Session = ReturnType<typeof useAtlasSession>;
type Props = Pick<
  Session,
  | 'status'
  | 'agentState'
  | 'captions'
  | 'error'
  | 'elapsedSec'
  | 'leadCaptured'
  | 'bookedSpoken'
  | 'muted'
  | 'cancelled'
  | 'end'
  | 'toggleMute'
  | 'audioElRef'
> & {
  /**
   * Rendered at the bottom of the panel — the hero's "Talk again" / "Try
   * again" actions. They live inside the panel rather than under it so the
   * fixed-height box always has content at both ends instead of reading as an
   * empty rectangle once a call has ended or failed.
   */
  children?: ReactNode;
};

const formatElapsed = (seconds: number) =>
  `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;

export const AtlasSessionPanel = (props: Props) => {
  const {
    status,
    agentState,
    captions,
    error,
    elapsedSec,
    leadCaptured,
    bookedSpoken,
    muted,
    cancelled,
    end,
    toggleMute,
    audioElRef,
    children,
  } = props;
  const live = status === 'live';
  const dialling = status === 'requesting_mic' || status === 'requesting'
    || status === 'connecting' || status === 'waiting_agent';
  const panelRef = useRef<HTMLDivElement>(null);
  const transcriptRef = useRef<HTMLDivElement>(null);
  const previousStatus = useRef(status);

  // The tap that starts a call unmounts the Start button, so without this the
  // keyboard visitor is left with focus on nothing and no idea the call began.
  // preventScroll: this panel takes the picker's place and is already in view.
  useEffect(() => {
    panelRef.current?.focus({ preventScroll: true });
  }, []);

  // "Try again" and "Talk again" unmount themselves the moment they are
  // pressed, which drops focus onto <body> — a keyboard or screen-reader
  // visitor is left with no idea that a second call is being dialled. The
  // panel survives that transition, so focus comes back to it, exactly as it
  // does for the first call above.
  useEffect(() => {
    const was = previousStatus.current;
    previousStatus.current = status;

    if ((was === 'ended' || was === 'error') && status === 'requesting_mic') {
      panelRef.current?.focus({ preventScroll: true });
    }
  }, [status]);

  // Keep the newest line in view without stealing the page's scroll position.
  useEffect(() => {
    const box = transcriptRef.current;
    if (box) {
      box.scrollTop = box.scrollHeight;
    }
  }, [captions]);

  return (
    <div
      ref={panelRef}
      tabIndex={-1}
      // A name needs something to name. Without the role this is an unlabelled
      // <div> as far as assistive technology is concerned, and "Atlas call" is
      // announced to nobody.
      role="group"
      aria-label="Atlas call"
      className="flex h-full flex-col rounded-lg border p-5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-bb-cream sm:p-6"
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

      {status === 'error' && error
        ? (
            <p role="status" className="text-base font-bold" style={{ color: 'var(--bb-brick-soft)' }}>
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
              role="status"
              className="text-xs font-bold uppercase tracking-[0.16em]"
              style={{ color: 'var(--bb-orange)' }}
            >
              {atlasStatusText(status, agentState)}
            </p>
          )}

      {/* The clock only appears once a call has actually run: a 0:00 next to a
          failure message — or next to a dial the visitor cancelled while it was
          still ringing — reads as a call that happened, and none did. */}
      {(live || (status === 'ended' && !cancelled)) && (
        <p className="mt-2 font-mono text-sm" style={{ color: 'var(--bb-fg-subtle)' }}>
          {formatElapsed(elapsedSec)}
        </p>
      )}

      {(leadCaptured || bookedSpoken) && (
        <div className="mt-3 flex flex-wrap gap-2">
          {leadCaptured && <span className="bb-tag bb-tag-teal">Details saved</span>}
          {bookedSpoken && <span className="bb-tag bb-tag-gold">{`Booked: ${bookedSpoken}`}</span>}
        </div>
      )}

      <div
        ref={transcriptRef}
        role="log"
        aria-label="Live transcript"
        // The transcript scrolls inside a fixed box, so it needs its own tab
        // stop: without one a keyboard visitor cannot read back anything that
        // has already scrolled off the top. WCAG 2.1.1 asks for exactly this on
        // a scrollable region, which is why the "non-interactive" rule is
        // waived rather than satisfied by making the log a button. The focus
        // ring comes from the token palette, like everything else on this page.
        // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex
        tabIndex={0}
        className="mt-4 flex max-h-40 min-h-0 flex-1 flex-col gap-2 overflow-y-auto focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-bb-cream lg:max-h-none"
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
                  // Interim speech is shown but not announced: a live region
                  // that re-reads every partial would repeat the same half
                  // sentence a dozen times before it settles.
                  aria-hidden={!caption.final}
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

      {(live || dialling) && (
        <div className="mt-4 flex flex-wrap gap-3">
          {live && (
            <>
              <button
                type="button"
                onClick={() => void toggleMute()}
                className="bb-btn bb-btn-ghost !px-5 !py-2 !text-sm"
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
            </>
          )}
          {dialling && (
            // A way out while Atlas is still being dialled, instead of waiting
            // out the 8-second agent timeout. end() cancels the in-flight
            // start() as well as hanging up, so the dial stops here for good:
            // the agent timeout can no longer fire afterwards and flip this
            // panel from Ended back to an error.
            <button
              type="button"
              onClick={() => void end()}
              className="bb-btn bb-btn-ghost !px-5 !py-2 !text-sm"
            >
              Cancel
            </button>
          )}
        </div>
      )}

      {children}
    </div>
  );
};
