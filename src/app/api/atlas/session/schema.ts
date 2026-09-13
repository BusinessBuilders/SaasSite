import { z } from 'zod';

export const ATLAS_PERSONAS = ['landscaping', 'plumbing_hvac', 'restaurant', 'your_business'] as const;
export type AtlasPersona = (typeof ATLAS_PERSONAS)[number];

// `consent` must be literally true: the button the visitor tapped carries the
// AI disclosure and the transcription notice, and the token is the proof.
export const atlasSessionSchema = z.object({
  persona: z.enum(ATLAS_PERSONAS),
  consent: z.literal(true),
  page: z.string().min(1).max(2000),
  // Attribution only. Keys are capped so a caller cannot stuff the room
  // metadata (and therefore the JWT) with an unbounded map.
  utm: z.record(z.string().max(64), z.string().max(200))
    .refine(obj => Object.keys(obj).length <= 20, 'too many utm parameters')
    .optional(),
  fbp: z.string().max(100).optional(),
  fbc: z.string().max(200).optional(),
  // Honeypot — real visitors never see or fill this field. Kept deliberately
  // lenient (any string up to 5000 chars validates) so a bot NEVER gets a 400
  // that tells it this field is the decoy; the route decides what to do with a
  // non-empty value.
  website: z.string().max(5000).optional(),
});
export type AtlasSessionRequest = z.infer<typeof atlasSessionSchema>;
