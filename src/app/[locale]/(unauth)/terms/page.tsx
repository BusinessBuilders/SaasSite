import Link from 'next/link';
import { unstable_setRequestLocale } from 'next-intl/server';

import {
  LegalContactCard,
  LegalSection,
  LegalShell,
} from '@/features/legal/LegalPage';
import { pageAlternates } from '@/utils/Seo';

// Static metadata — the previous generateMetadata read a next-intl key
// ("Terms.meta_title") that doesn't exist in the locale files, so the raw key
// leaked into the browser tab title.
// English-only page: the /fr twin shows the same copy, so both canonicalize here.
export const metadata = {
  alternates: pageAlternates('/terms', 'en', { englishOnly: true }),
  title: 'Terms and Conditions | Business Builders',
  description:
    'Terms and Conditions for Business Builder, a DBA of Donovan Farms Inc. — service usage, user responsibilities, payment, SMS consent, and legal terms.',
};

export default function TermsAndConditionsPage(props: {
  params: { locale: string };
}) {
  unstable_setRequestLocale(props.params.locale);

  return (
    <LegalShell
      eyebrow="/// The Fine Print ///"
      title="Terms and Conditions"
      effectiveDate="August 3, 2026"
    >
      <LegalSection number="01" title="Welcome to Business Builders">
        <p>
          These Terms and Conditions are between you and
          {' '}
          <strong>
            Donovan Farms Inc., doing business as Business Builder
          </strong>
          {' '}
          (&quot;Business Builders,&quot; &quot;we,&quot; &quot;us&quot;).
          Business Builders provides website design, website hosting, social
          media management, and AI automation services for small businesses (the
          &quot;Service&quot;). By accessing or using business-builder.online or
          our Services, you agree to these Terms and Conditions. If you do not
          agree with any part of these Terms, please discontinue using our
          Services immediately.
        </p>
      </LegalSection>

      <LegalSection number="02" title="Services Provided">
        <p>We offer services including but not limited to:</p>
        <ul>
          <li>Website design, development, and hosting</li>
          <li>Social media management and content creation</li>
          <li>
            AI integration and automation (chatbots, document automation,
            customer intake)
          </li>
          <li>Private AI deployments on dedicated infrastructure</li>
        </ul>
        <p>
          Specific details of each service are provided on the website and may
          be updated from time to time.
        </p>
      </LegalSection>

      <LegalSection number="03" title="SMS / Text Message Communications">
        <p>
          If you opt in through the form on our
          {' '}
          <Link href="/contact">Contact page</Link>
          , you consent to receive SMS
          notifications, alerts, and occasional marketing communications from
          Business Builder. Message frequency varies. Message and data rates may
          apply. Reply
          <strong>HELP</strong>
          {' '}
          to any message for assistance, and reply
          <strong>STOP</strong>
          {' '}
          to unsubscribe at any time. Consent to receive
          text messages is not a condition of purchase. See our
          {' '}
          <Link href="/privacy-policy">Privacy Policy</Link>
          {' '}
          for how mobile
          information is handled — it is never shared with third parties or
          affiliates for marketing purposes.
        </p>
      </LegalSection>

      <LegalSection number="04" title="User Accounts and Responsibilities">
        <p>
          To access certain features of our Services, you may be required to
          create an account. You agree to:
        </p>
        <ul>
          <li>
            Provide accurate, current, and complete information during
            registration.
          </li>
          <li>Maintain the confidentiality of your account and password.</li>
          <li>
            Notify us immediately of any unauthorized use of your account.
          </li>
        </ul>
        <p>
          You are solely responsible for all activities that occur under your
          account.
        </p>
      </LegalSection>

      <LegalSection number="05" title="Payment and Billing">
        <p>
          You agree to pay all applicable fees related to the services you
          select. Fees may include:
        </p>
        <ul>
          <li>Subscription fees</li>
          <li>One-time service fees</li>
          <li>Additional fees based on the usage of certain features</li>
        </ul>
        <p>
          All fees are due at the time of purchase or as outlined in the service
          agreement. We reserve the right to modify prices at any time, but will
          notify you in advance of any changes.
        </p>
      </LegalSection>

      <LegalSection number="06" title="Refund Policy">
        <p>
          No refunds will be provided except in circumstances determined on a
          case-by-case basis at the discretion of Business Builders.
        </p>
      </LegalSection>

      <LegalSection number="07" title="Intellectual Property">
        <p>
          All content, software, text, images, and other materials available
          through our website are the property of Donovan Farms Inc. or its
          licensors and are protected by copyright, trademark, and other
          intellectual property laws. You may not reproduce, distribute, modify,
          or create derivative works based on any materials provided without our
          express written consent.
        </p>
      </LegalSection>

      <LegalSection number="08" title="Limitation of Liability">
        <p>
          To the fullest extent permitted by law, Business Builders shall not be
          liable for any damages—including direct, indirect, incidental, or
          consequential damages—arising from:
        </p>
        <ul>
          <li>The use or inability to use the Service</li>
          <li>Unauthorized access to or alteration of your data</li>
          <li>Any other matter related to the Service</li>
        </ul>
        <p>
          Our total liability for any claims related to the Service will be
          limited to the amount paid by you for the service during the previous
          12 months.
        </p>
      </LegalSection>

      <LegalSection number="09" title="Disclaimer of Warranties">
        <p>
          We provide our Services on an &quot;as is&quot; and &quot;as
          available&quot; basis, without any warranties, express or implied,
          including warranties of merchantability, fitness for a particular
          purpose, and non-infringement. We do not guarantee that the Services
          will be uninterrupted or error-free, nor do we make any
          representations regarding the accuracy or reliability of any
          information provided.
        </p>
      </LegalSection>

      <LegalSection number="10" title="Termination">
        <p>
          We reserve the right to terminate your access to the Service at any
          time for any reason, including a breach of these Terms and Conditions.
          Upon termination, all provisions that by their nature should survive
          termination will remain in effect, including ownership provisions,
          disclaimers, and limitations of liability.
        </p>
      </LegalSection>

      <LegalSection number="11" title="Privacy Policy">
        <p>
          Your use of our Service is also governed by our
          {' '}
          <Link href="/privacy-policy">Privacy Policy</Link>
          . By using the
          Service, you agree to the collection and use of your data as outlined
          there.
        </p>
      </LegalSection>

      <LegalSection number="12" title="Modifications to Terms">
        <p>
          We may modify these Terms and Conditions at any time. Any changes will
          be posted on this page, and the &quot;Effective Date&quot; will be
          updated. Your continued use of the Service after changes have been
          made constitutes acceptance of the revised Terms and Conditions.
        </p>
      </LegalSection>

      <LegalSection number="13" title="Governing Law">
        <p>
          These Terms and Conditions are governed by the laws of the
          Commonwealth of Massachusetts, without regard to its conflict of law
          principles. Any disputes arising from these Terms or the use of the
          Service shall be brought in the state or federal courts located in
          Massachusetts, and you consent to the jurisdiction of such courts.
        </p>
      </LegalSection>

      <LegalSection number="14" title="Contact Information">
        <p>
          If you have any questions about these Terms and Conditions, please
          contact us at:
        </p>
        <LegalContactCard />
      </LegalSection>
    </LegalShell>
  );
}
