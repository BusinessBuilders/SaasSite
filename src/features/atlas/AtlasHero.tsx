'use client';
// src/features/atlas/AtlasHero.tsx — the whole offer above the fold: pick a
// trade, read the one-sentence disclosure, tap once, talk.
//
// One tap is the entire consent flow, so the disclosure sits directly under
// the button rather than behind a link, and the live phone line is always one
// tap away in case the demo cannot run.
import Link from 'next/link';
import { useState } from 'react';

import type { AtlasPersona } from '@/app/api/atlas/session/schema';

import { AtlasSessionPanel } from './AtlasSessionPanel';
import {
  ATLAS_CONSENT_TEXT,
  ATLAS_PHONE_DISPLAY,
  ATLAS_PHONE_TEL,
  atlasPriceMonthly,
} from './content';
import { PersonaPicker } from './PersonaPicker';
import { useAtlasSession } from './useAtlasSession';

const PRICE_MONTHLY = atlasPriceMonthly();

export const AtlasHero = () => {
  const [persona, setPersona] = useState<AtlasPersona>('landscaping');
  const session = useAtlasSession();
  const { status } = session;
  const idle = status === 'idle';

  return (
    <section
      className="relative flex min-h-dvh flex-col justify-start px-4 pb-10 pt-4 md:justify-center md:pb-16 md:pt-0"
      aria-labelledby="atlas-hero-heading"
    >
      <div className="mx-auto w-full max-w-3xl">
        <p className="bb-eyebrow">/// Live AI Receptionist ///</p>
        <h1
          id="atlas-hero-heading"
          className="mt-2 font-bb-display-2 text-[1.65rem] font-extrabold leading-tight text-bb-cream-bright sm:mt-3 sm:text-4xl md:text-5xl"
        >
          Hear the receptionist you’d hire, before you hire it.
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-snug text-bb-taupe sm:mt-4 sm:text-base sm:leading-relaxed md:text-lg">
          Atlas answers your phone the way you would: every call, every hour, in
          your words. Try it right now, out loud.
        </p>

        {/* The live area. Reserved height so swapping the picker for the call
            panel does not shove the rest of the page around mid-tap. */}
        <div className="mt-4 min-h-96 sm:mt-6 sm:min-h-[26rem]">
          {idle
            ? (
                <>
                  <PersonaPicker value={persona} onChange={setPersona} />
                  <div className="mt-4">
                    <button
                      type="button"
                      onClick={() => void session.start(persona)}
                      className="bb-btn bb-btn-primary w-full !py-3 sm:w-auto sm:!py-3.5"
                    >
                      Start talking to Atlas
                    </button>
                  </div>
                  <p className="mt-2.5 max-w-xl text-xs leading-snug text-bb-dust sm:mt-3 sm:leading-relaxed">
                    {ATLAS_CONSENT_TEXT}
                    {' '}
                    <Link
                      href="/privacy-policy#atlas-voice-demo"
                      className="text-bb-teal-soft underline underline-offset-4 transition-colors hover:text-bb-cream"
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
                <>
                  <AtlasSessionPanel {...session} />
                  {status === 'ended' && (
                    <div className="mt-4 flex flex-wrap items-center gap-4">
                      <p className="text-base font-bold text-bb-cream">
                        Thanks — William will be in touch.
                      </p>
                      <button
                        type="button"
                        onClick={() => void session.start(persona)}
                        className="bb-btn bb-btn-ghost !px-5 !py-2 !text-sm"
                      >
                        Talk again
                      </button>
                    </div>
                  )}
                  {status === 'error' && (
                    <div className="mt-4">
                      <button
                        type="button"
                        onClick={() => void session.start(persona)}
                        className="bb-btn bb-btn-ghost !px-5 !py-2 !text-sm"
                      >
                        Try again
                      </button>
                    </div>
                  )}
                </>
              )}
        </div>
      </div>
    </section>
  );
};
