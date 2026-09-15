// src/features/atlas/content.ts — every word on /atlas, in one file, so the
// page, the FAQ JSON-LD and the persona picker cannot drift apart.
//
// The persona keys are checked against the API schema's enum at compile time
// (`satisfies` below): if a persona is added to personas.toml and the schema
// without a card here — or vice versa — the build fails instead of shipping a
// picker that mints tokens for a persona the worker does not know.
import type { AtlasPersona } from '@/app/api/atlas/session/schema';
import type { FaqItem } from '@/features/ai/content';

// The page's <title> and meta description, kept with the rest of the copy.
export const ATLAS_TITLE = 'Talk to Atlas, the AI Receptionist | Business Builder';
export const ATLAS_DESCRIPTION
  = 'Hear an AI receptionist answer for your business right now, out loud, in your browser. Built and hosted by Business Builder in Massachusetts.';

export const ATLAS_PHONE_DISPLAY = '(508) 886-3046';
export const ATLAS_PHONE_TEL = '+15088863046';

export type AtlasPersonaCard = {
  key: AtlasPersona;
  title: string;
  tagline: string;
  // The made-up business Atlas answers as, or null for "Your business", where
  // the visitor supplies the facts. Every sample name is labelled as a sample
  // on the page and in the FAQ — no visitor should think these are clients.
  sample: string | null;
};

export const ATLAS_PERSONAS = [
  {
    key: 'landscaping',
    title: 'Landscaping & lawn care',
    tagline: 'Estimates, seasonal cleanups, mowing schedules',
    sample: 'Maple Street Landscaping',
  },
  {
    key: 'plumbing_hvac',
    title: 'Plumbing & HVAC',
    tagline: 'Emergency calls, service windows, quotes',
    sample: 'Kessler Plumbing & Heating',
  },
  {
    key: 'restaurant',
    title: 'Restaurant & bakery',
    tagline: 'Reservations, catering requests, hours',
    sample: 'Harbor Lane Bakery & Cafe',
  },
  {
    key: 'your_business',
    title: 'Your business',
    tagline: 'Tell Atlas what you do and hear it answer for you',
    sample: null,
  },
] as const satisfies readonly AtlasPersonaCard[];

// The sentence under the call button. It is the disclosure the session token
// attests to, so it must stay plain English a visitor reads before tapping —
// not a link to a policy. The AI-provider clause is here because agreeing to
// be transcribed is not the same as agreeing to have that text leave the
// building, and since 2026-09-14 it does: the conversation is written by
// Z.ai's GLM first (see "Where Your Words Go" and privacy policy Section 12).
// Only the timestamp and a hashed IP are sent with the token — never this
// string — so rewording it here is a copy change, not a protocol change.
export const ATLAS_CONSENT_TEXT
  = 'Atlas is an AI, not a person. This conversation is transcribed and kept so Business Builder can follow up with you, and the text is sent to our AI provider to write Atlas’s replies. By starting, you agree to that.';

// The two session messages that are asserted OUTSIDE the hook that raises them
// — by the Playwright suites, which cannot import a 'use client' module's
// internals without dragging livekit-client into the test runner. They live
// here, in the copy file, so a reworded sentence updates the page and the tests
// from one place instead of drifting apart silently.
//
// NO_AGENT_MESSAGE is what a visitor reads when LiveKit admits them to a room
// that no agent ever joins — exactly what a stopped worker looks like from a
// browser. OFFLINE_MESSAGE is the unconfigured/refused case.
export const NO_AGENT_MESSAGE
  = 'Atlas can’t take your call right now. Please call the live line or try again in a minute.';
export const OFFLINE_MESSAGE = 'The voice demo is offline right now.';
// Said when the browser's microphone prompt is refused or dismissed. Nothing
// has been spent by then — no token, no room, no worker — so it invites the
// visitor to try again rather than apologising for a broken demo.
export const MIC_DENIED_MESSAGE
  = 'Microphone access was blocked. Allow the microphone and try again, or call the live line.';
// Different advice for a different problem: "allow the microphone and try
// again" is useless to someone whose machine has no microphone in it, and the
// live line is the only thing left that can help them.
export const NO_MICROPHONE_MESSAGE
  = `No microphone was found on this device. Please call the live line ${ATLAS_PHONE_DISPLAY}.`;
// Shown while the browser's own permission prompt is open. It names the thing
// the visitor is looking at, because "Connecting…" over an unanswered prompt is
// what let a real visitor sit for 100 seconds waiting for a demo that was
// waiting for them.
export const MIC_PROMPT_STATUS = 'Allow the microphone to talk to Atlas';

export const ATLAS_STEPS = [
  {
    title: 'You talk, Atlas answers',
    body: 'Pick a business type and tap once. Atlas answers the way it would answer your customers: questions, requests, messages.',
  },
  {
    title: 'Atlas takes your details',
    body: 'If you want it on your own line, Atlas takes your name and number and books a 15-minute setup call on William’s calendar.',
  },
  {
    title: 'Your line goes live',
    body: 'Business Builder sets Atlas up on your number with your services, hours and facts. Every missed call becomes a message you can act on.',
  },
] as const satisfies readonly { title: string; body: string }[];

export const ATLAS_FAQ: readonly FaqItem[] = [
  {
    question: 'Am I talking to a real person?',
    answer:
      'No. Atlas is an AI receptionist built by Business Builder. It says so in its first sentence, and it will tell you again if you ask.',
  },
  {
    question: 'What happens to what I say?',
    answer:
      'The conversation is transcribed and stored on Business Builder’s own hardware so William can follow up. It is kept for the same period as our phone messages and deleted after that. While you are talking, the text of what you say also goes to Z.ai, the cloud provider whose GLM model decides what Atlas says. Email donovan@business-builder.online to have it removed sooner.',
  },
  {
    question: 'Are the sample businesses real?',
    answer:
      'No. Maple Street Landscaping, Kessler Plumbing & Heating and Harbor Lane Bakery & Cafe are made-up businesses so you can hear Atlas work in your trade. Pick “Your business” and Atlas uses only what you tell it.',
  },
  {
    question: 'Can Atlas book me in?',
    answer:
      'Yes. Once you give your details, Atlas offers real open times on William’s calendar and books a 15-minute setup call. It only says a time is booked when the booking actually went through.',
  },
  {
    question: 'Will Atlas text me?',
    answer:
      'Not from this demo. If you agree to be contacted, William calls or texts you himself.',
  },
  {
    question: 'Where does Atlas run?',
    answer:
      'Speech recognition and Atlas’s voice run on Business Builder’s own hardware in Massachusetts. Deciding what Atlas says is handled by GLM, a language model from the cloud provider Z.ai, which receives the text of what you say; when Z.ai is not used, that work runs on our own hardware in Massachusetts instead. The live audio connection is relayed through a media server we operate on a machine we rent in Germany; your voice passes through it and is not recorded there.',
  },
];

// The monthly price is deliberately not hardcoded: until NEXT_PUBLIC_ATLAS_PRICE_MONTHLY
// is set the page says nothing about price rather than inventing one.
// Read straight off process.env so Next inlines the literal at build time and this
// stays a zero-dependency copy module; the validated twin is NEXT_PUBLIC_ATLAS_PRICE_MONTHLY
// in src/libs/Env.ts, which is where the variable is declared and typed.
export const atlasPriceMonthly = (): string | null => process.env.NEXT_PUBLIC_ATLAS_PRICE_MONTHLY?.trim() || null;
