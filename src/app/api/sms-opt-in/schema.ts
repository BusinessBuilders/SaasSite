import { z } from 'zod';

// Two independent consents: `smsConsent` = informational/service texts,
// `marketingConsent` = promotional texts. Carriers require marketing consent
// to be collected on its own checkbox (Twilio error 30913), so the API never
// derives one from the other. Both fields are required — a client that omits
// marketingConsent is an out-of-date form, not an implicit "no".
export const smsOptInSubmissionSchema = z
  .object({
    name: z.string().trim().min(1).max(200),
    business: z.string().trim().max(200).optional().or(z.literal('')),
    email: z.string().trim().email().max(320),
    phone: z.string().trim().max(40).optional().or(z.literal('')),
    message: z.string().trim().max(5000).optional().or(z.literal('')),
    smsConsent: z.boolean(),
    marketingConsent: z.boolean(),
    // Honeypot — real users never see or fill this field. Accept any value
    // here so a filled honeypot reaches the fake-success branch in the route
    // instead of returning a validation error bots could learn from.
    website: z.string().max(500).optional().or(z.literal('')),
  })
  .refine(
    data =>
      (!data.smsConsent && !data.marketingConsent)
      || (!!data.phone && data.phone.length >= 10),
    {
      message: 'A phone number is required to opt in to text messages.',
      path: ['phone'],
    },
  );

export type SmsOptInSubmission = z.infer<typeof smsOptInSubmissionSchema>;
