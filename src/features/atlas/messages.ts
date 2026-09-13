// src/features/atlas/messages.ts — the worker -> browser protocol on the
// LiveKit data topic "atlas", validated rather than trusted.
//
// This is a cross-repo contract: the Python worker on MagicCat builds exactly
// these shapes. Validating them here is not defensive padding — an unvalidated
// `lead_captured` missing its `event_id` would fire the Meta Pixel `Lead`
// WITHOUT the deduplication id, and Meta would count the same lead twice
// (once from the browser, once from the worker's Conversions API call).
import { z } from 'zod';

export const ATLAS_DATA_TOPIC = 'atlas';
// LiveKit's own built-in caption topic, published by the worker's STT and TTS.
export const ATLAS_CAPTION_TOPIC = 'lk.transcription';

export const ATLAS_AGENT_STATES = ['listening', 'thinking', 'speaking', 'idle'] as const;
export type AtlasAgentState = (typeof ATLAS_AGENT_STATES)[number];

export const atlasWorkerMessageSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('state'), state: z.enum(ATLAS_AGENT_STATES) }),
  z.object({ type: z.literal('lead_captured'), event_id: z.string().min(1) }),
  z.object({ type: z.literal('booked'), when: z.string().min(1), spoken: z.string().min(1) }),
  z.object({ type: z.literal('ended'), reason: z.string().min(1) }),
  z.object({ type: z.literal('error'), reason: z.string().min(1) }),
]);

export type AtlasWorkerMessage = z.infer<typeof atlasWorkerMessageSchema>;

/**
 * Decode one data-topic payload. Returns null for anything that is not a
 * message we can act on — non-JSON, an unknown `type`, or a known type with a
 * field missing. The caller logs and reports; this function never throws, so a
 * malformed payload cannot blow up inside LiveKit's event emitter.
 */
export const parseWorkerMessage = (raw: string): AtlasWorkerMessage | null => {
  let decoded: unknown;
  try {
    decoded = JSON.parse(raw);
  } catch {
    return null;
  }
  const result = atlasWorkerMessageSchema.safeParse(decoded);
  return result.success ? result.data : null;
};
