import { z } from 'zod';

export const ATLAS_PERSONAS = ['landscaping', 'plumbing_hvac', 'restaurant', 'your_business'] as const;
export type AtlasPersona = (typeof ATLAS_PERSONAS)[number];

// `consent` must be literally true: the button the visitor tapped carries the
// AI disclosure and the transcription notice, and the token is the proof.
export const atlasSessionSchema = z.object({
  persona: z.enum(ATLAS_PERSONAS),
  consent: z.literal(true),
  page: z.string().min(1).max(2000),
  utm: z.record(z.string().max(200)).optional(),
  fbp: z.string().max(100).optional(),
  fbc: z.string().max(200).optional(),
  // Honeypot — real visitors never see or fill this field.
  website: z.string().max(500).optional().or(z.literal('')),
});
export type AtlasSessionRequest = z.infer<typeof atlasSessionSchema>;
