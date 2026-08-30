import { SmsOptInForm } from '@/features/contact/SmsOptInForm';
import { Section } from '@/features/landing/Section';

// Homepage opt-in block — same form (and consent record) as /contact, surfaced
// on the main page for lead capture. The A2P campaign's message_flow lists
// both locations.
export const SmsOptInSection = () => (
  <Section
    subtitle="/// Text Follow-Up ///"
    title="Want the fastest answer? Get a text."
    description="Tell us what you need and opt in below — we'll text you back about the website, automation, or AI build that fits your business."
  >
    <div className="mx-auto max-w-2xl rounded-lg border-2 border-bb-orange bg-bb-black-warm p-6 shadow-bb-card sm:p-10">
      <SmsOptInForm />
    </div>
  </Section>
);
