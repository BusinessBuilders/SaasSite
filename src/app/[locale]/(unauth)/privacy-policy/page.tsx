import Link from 'next/link';
import { unstable_setRequestLocale } from 'next-intl/server';

import {
  LegalCallout,
  LegalContactCard,
  LegalSection,
  LegalShell,
} from '@/features/legal/LegalPage';
import { pageAlternates } from '@/utils/Seo';

// English-only page: the /fr twin shows the same copy, so both canonicalize here.
export const metadata = {
  alternates: pageAlternates('/privacy-policy', 'en', { englishOnly: true }),
  title: 'Privacy Policy | Business Builder',
  description:
    'Privacy Policy for Business Builder, a DBA of Donovan Farms Inc. — how we collect, use, and protect your information, including our SMS text messaging program.',
};

export default function PrivacyPolicyPage(props: {
  params: { locale: string };
}) {
  // Required for static rendering — the shell's Navbar/Footer use next-intl.
  unstable_setRequestLocale(props.params.locale);

  // Effective date moved from August 3 to September 14, 2026 because Section 11
  // promises an updated date whenever this policy changes, and Section 12 now
  // names an overseas processor (Z.ai) that was not there before.
  return (
    <LegalShell
      eyebrow="/// The Fine Print ///"
      title="Privacy Policy"
      effectiveDate="September 14, 2026"
    >
      <LegalSection number="01" title="Who We Are">
        <p>
          <strong>Business Builder</strong>
          {' '}
          is a DBA (doing business as) of
          {' '}
          <strong>Donovan Farms Inc.</strong>
          , a Massachusetts corporation. This
          Privacy Policy explains how we collect, use, and protect your
          information when you visit business-builder.online, use our services,
          or communicate with us.
        </p>
        <LegalContactCard />
      </LegalSection>

      <LegalSection number="02" title="SMS & Text Messaging Program">
        <LegalCallout>
          We do not share, sell, or provide your mobile phone number or
          messaging consent data to third parties or affiliates for marketing or
          promotional purposes.
        </LegalCallout>
        <p>
          No mobile information will be shared with third parties or affiliates
          for marketing or promotional purposes. Text messaging originator
          opt-in data and consent will not be shared with any third parties.
          Our SMS delivery provider transmits messages on our behalf as a
          service provider only and does not receive your mobile information
          for its own use. Beyond that, mobile information is disclosed only
          where required by law.
        </p>
        <h3>How we collect mobile numbers</h3>
        <p>
          We collect mobile phone numbers when you submit them through the form
          on our
          {' '}
          <Link href="/contact">Contact page</Link>
          {' '}
          and check one or both of the SMS consent boxes, or when you text us
          first. We use this information solely to send the text messages you
          have consented to receive: service messages (replies to your
          inquiry, appointment reminders, and project, hosting or billing
          updates) and — only if you separately opted in — occasional
          promotional offers about our services.
        </p>
        <h3>Opt-in</h3>
        <p>
          Our form has two separate, optional consent checkboxes, and both are
          unchecked by default. Checking the first box consents to
          informational and service text messages (replies to your inquiry,
          appointment reminders, and project, hosting or billing updates).
          Checking the second box separately consents to marketing and
          promotional text messages. Checking one box never opts you in to
          the other, and marketing consent is never bundled with any other
          consent. By providing your phone number and checking a box, you
          expressly consent to receive that category of text messages from
          Business Builder.
          {' '}
          <strong>Consent is not a condition of purchase or service.</strong>
        </p>
        <h3>Message frequency &amp; rates</h3>
        <p>
          Message frequency varies. Message and data rates may apply depending
          on your mobile carrier plan. We do not send unsolicited bulk messages.
        </p>
        <h3>Opt-out</h3>
        <p>
          Reply
          {' '}
          <strong>STOP</strong>
          {' '}
          (or QUIT, END, CANCEL, UNSUBSCRIBE, OPT
          OUT) to any message we send to stop receiving texts. You may also
          contact us at donovan@business-builder.online to be removed. Once we
          receive your opt-out, we will immediately stop sending further
          messages to your number.
        </p>
        <h3>Help</h3>
        <p>
          Reply
          {' '}
          <strong>HELP</strong>
          {' '}
          to any message for assistance, or contact
          us at donovan@business-builder.online or 978-790-1002.
        </p>
      </LegalSection>

      <LegalSection number="03" title="Information We Collect">
        <h3>Personal information</h3>
        <p>
          We collect information like your name, email, business name, and phone
          number when you create an account, fill out a form, or book a
          consultation. Payment details (such as credit card numbers) are
          securely processed by third-party payment processors — we never store
          them ourselves.
        </p>
        <h3>Automatically collected information</h3>
        <p>
          We may collect data such as IP address, browser type, and activity on
          our site. We also use cookies to improve your experience (see Section
          07).
        </p>
      </LegalSection>

      <LegalSection number="04" title="How We Use Your Information">
        <ul>
          <li>To provide and manage requested services</li>
          <li>To respond to your inquiries and follow up on quotes</li>
          <li>To personalize and improve site functionality</li>
          <li>
            To send service updates and alerts you have opted in to, and —
            only if you have separately opted in — promotional content
          </li>
          <li>To process secure transactions</li>
          <li>To analyze usage trends and optimize our service</li>
        </ul>
      </LegalSection>

      <LegalSection number="05" title="Disclosure of Your Information">
        <p>We may disclose information only:</p>
        <ul>
          <li>
            To service providers that operate our platform (e.g., payment
            processing, website hosting, SMS delivery), strictly to perform
            services for us
          </li>
          <li>To comply with legal obligations</li>
          <li>To protect our rights, safety, or that of others</li>
          <li>In the event of a merger, acquisition, or asset transfer</li>
        </ul>
        <p>
          <strong>
            We do not sell, rent, or share your personal information with third
            parties for their marketing purposes.
          </strong>
          {' '}
          See Section 02 for the additional protections that apply to mobile
          phone numbers and SMS consent data.
        </p>
      </LegalSection>

      <LegalSection number="06" title="Security of Your Information">
        <p>
          We take reasonable precautions to safeguard your data, but no online
          transmission is 100% secure. While we strive to protect your personal
          data, we cannot guarantee absolute security.
        </p>
      </LegalSection>

      <LegalSection number="07" title="Cookies & Tracking Technologies">
        <p>
          We use essential cookies to run the site (sign-in sessions, security)
          and may use performance cookies to understand how the site is used. If
          we enable marketing cookies (such as advertising pixels), they run
          only with your consent via our cookie notice. You may disable cookies
          in your browser settings, but this may affect site functionality.
        </p>
      </LegalSection>

      <LegalSection number="08" title="Your Rights and Choices">
        <ul>
          <li>Access, update, or delete your personal data</li>
          <li>Unsubscribe from marketing emails at any time</li>
          <li>Opt out of text messages at any time (reply STOP)</li>
          <li>Disable cookies via your browser settings</li>
        </ul>
        <p>
          For privacy-related requests, please contact us at
          {' '}
          <strong>donovan@business-builder.online</strong>
          .
        </p>
      </LegalSection>

      <LegalSection number="09" title="Third-Party Links">
        <p>
          Our website may contain links to external sites that have their own
          privacy policies. We are not responsible for their content or
          practices. Client websites we host under preview paths or separate
          domains have their own privacy policies belonging to those businesses.
        </p>
      </LegalSection>

      <LegalSection number="10" title="Children's Privacy">
        <p>
          Our services are not intended for children under 13, and we do not
          knowingly collect personal information from them. If you believe such
          information has been collected, please contact us immediately.
        </p>
      </LegalSection>

      <LegalSection number="11" title="Changes to This Privacy Policy">
        <p>
          We may update this policy periodically. Any changes will be posted on
          this page with an updated Effective Date, and your continued use of
          the site indicates acceptance of the updated policy.
        </p>
      </LegalSection>

      <LegalSection
        number="12"
        title="Atlas Voice Demo"
        id="atlas-voice-demo"
      >
        <p>
          <strong>Atlas</strong>
          {' '}
          is the AI receptionist you can talk to on our
          {' '}
          <Link href="/atlas">Talk to Atlas</Link>
          {' '}
          page. Atlas is an AI, not a person. It says so in its first sentence,
          and it will tell you again if you ask.
        </p>
        <h3>What we collect</h3>
        <p>
          While a session is running we capture your voice, a written transcript
          of the conversation, and the details you give Atlas out loud — your
          name, your business, and your phone number or email. We also record
          your answer to the consent line shown on the start button, the page
          you started from, and any campaign tags in that page’s address.
          If — and only if — you accepted marketing cookies, we also receive the
          Meta browser identifiers stored by our advertising pixel. Those
          identifiers, together with a scrambled form of the email address or
          phone number you give Atlas, are what let us match your call back to
          the advertisement that brought you here — see “Who else processes it”
          below for exactly what goes to Meta and when.
        </p>
        <h3>Where it is processed and stored</h3>
        <p>
          Speech recognition — turning your voice into text — and Atlas’s voice
          both run on Business Builder’s own servers in Massachusetts. The live
          audio connection is relayed through a media server we operate. Your
          audio is not retained after it has been transcribed — the transcript
          and the details you gave are what we keep, and we keep them on our own
          servers in Massachusetts.
        </p>
        <p>
          Deciding what Atlas says back is done by GLM, a language model
          operated by Z.ai, a cloud provider outside the United States. The text
          of what you say is sent to Z.ai so that it can produce Atlas’s reply;
          your audio is never sent there. When Z.ai is not used, that same work
          runs on Business Builder’s own servers in Massachusetts instead.
        </p>
        <h3>Who else processes it</h3>
        <p>
          <strong>Z.ai</strong>
          {' '}
          (JINGSHENG HENGXING TECHNOLOGY PTE. LTD., Singapore) processes the
          text of your conversation on our instructions, for the sole purpose of
          generating Atlas’s replies. Their privacy policy is at
          {' '}
          <a
            href="https://docs.z.ai/legal-agreement/privacy-policy"
            target="_blank"
            rel="noreferrer"
          >
            docs.z.ai/legal-agreement/privacy-policy
          </a>
          . What reaches them is the conversation itself, which includes
          anything you say out loud — so if you give Atlas your name, your phone
          number or your email, those words go with it. Your audio, the page you
          started from, its campaign tags and the Meta browser identifiers are
          not sent to Z.ai.
        </p>
        <p>
          Our use of Z.ai is governed by the Data Processing Addendum for API
          Services set out further down that same page, under which Business
          Builder is the data controller and Z.ai is the data processor. Its
          Section 4(b) states:
          {' '}
          <em>
            “The Company do not store any of the content the Customer or its End
            Users provide or generate while using our Services. This includes
            any texts, or other data you input. This information is processed in
            real-time to provide the Customer and End Users with the API Service
            and is not saved on our servers.”
          </em>
          {' '}
          That is Z.ai’s statement about its own service, quoted as it is
          written; the transcript we keep is the copy on our servers in
          Massachusetts.
        </p>
        <p>
          <strong>Google</strong>
          {' '}
          receives your details when — and only when — Atlas books your setup
          call, because the appointment is created on William’s Google Calendar.
          That appointment carries your name, your business, your phone number,
          your email address and your answer about being contacted, which is
          what William needs in front of him when he calls you. The rest of the
          conversation is not put on the calendar.
        </p>
        <p>
          <strong>Contabo GmbH</strong>
          {' '}
          (Munich, Germany) rents us the machine that carries the live audio
          connection. While you are talking, your voice passes through a media
          server we run on that machine, which is outside the United States. It
          is not recorded or stored there — it is passed straight through to our
          own hardware in Massachusetts, transcribed, and the audio is dropped.
        </p>
        <p>
          <strong>Meta</strong>
          {' '}
          receives, when our Meta advertising connection is switched on, a
          scrambled form of the email address or phone number you gave Atlas,
          together with the Meta browser identifiers described above, so that we
          can tell which advertisement led to your call. Scrambled means the
          address or number is turned into a fixed string of characters that
          cannot be read back as your address or number. The words of your
          conversation are never sent to Meta.
        </p>
        <h3>Why we keep it</h3>
        <p>
          To follow up on what you asked for — a call back, a quote, or a setup
          appointment — and to measure how well our advertising works.
        </p>
        <h3>How long we keep it</h3>
        <p>
          For the same period as our phone messages, and no longer.
        </p>
        <h3>How to have it deleted</h3>
        <p>
          Email
          {' '}
          <strong>donovan@business-builder.online</strong>
          {' '}
          and we will delete the transcript and the details from your session.
        </p>
      </LegalSection>

      <LegalSection number="13" title="Contact Us">
        <p>
          If you have any questions about this Privacy Policy, please contact us
          at:
        </p>
        <LegalContactCard />
      </LegalSection>
    </LegalShell>
  );
}
