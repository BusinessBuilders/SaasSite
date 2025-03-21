import Link from 'next/link';
import { getTranslations, unstable_setRequestLocale } from 'next-intl/server';

export async function generateMetadata(props: { params: { locale: string } }) {
  const t = await getTranslations({
    locale: props.params.locale,
    namespace: 'Terms',
  });
  return {
    title: t('meta_title') || 'Terms and Conditions | Business Builders',
    description:
      t('meta_description')
      || 'Terms and Conditions for Business Builders detailing service usage, user responsibilities, payment, and legal obligations.',
  };
}

export default function TermsAndConditionsPage(props: { params: { locale: string } }) {
  unstable_setRequestLocale(props.params.locale);

  return (
    <main className="container mx-auto max-w-4xl px-4 py-8">
      <header>
        <h1 className="mb-6 text-3xl font-bold">Terms and Conditions</h1>
        <p className="mb-4">
          <strong>Effective Date:</strong>
          {' '}
          11/18/2024
        </p>
      </header>

      <article className="prose max-w-none">
        <section>
          <h2>Welcome to Business Builders</h2>
          <p>
            Business Builders is a website that provides reputation management and automation tools (the “Service”).
            These Terms and Conditions govern your use of our website and Services. By accessing or using the website,
            you agree to these Terms and Conditions.
          </p>
          <p>
            I consent to receive SMS notifications, alerts, and occasional marketing communications from Business Builders.
            Message frequency varies. Message and data rates may apply. Text
            {' '}
            <strong>HELP</strong>
            {' '}
            to
            {' '}
            <strong>978-790-1002</strong>
            {' '}
            for assistance. You can reply
            <strong>STOP</strong>
            {' '}
            to unsubscribe at any time.
          </p>
        </section>

        <section>
          <h2>1. Acceptance of Terms</h2>
          <p>
            By using this website, you acknowledge that you have read, understood, and agree to be bound by these Terms and
            Conditions. If you do not agree with any part of these Terms, please discontinue using our Services immediately.
          </p>
        </section>

        <section>
          <h2>2. Services Provided</h2>
          <p>We offer a variety of automation tools, including but not limited to:</p>
          <ul>
            <li>Reputation management and AI-powered review requests</li>
            <li>Review monitoring across platforms</li>
            <li>Centralized feedback dashboards</li>
          </ul>
          <p>
            These tools are designed to help you manage and improve your online reputation and automate other business
            processes. Specific details of each service are provided on the website and may be updated from time to time.
          </p>
        </section>

        <section>
          <h2>3. User Accounts and Responsibilities</h2>
          <p>
            To access certain features of our Services, you may be required to create an account. You agree to:
          </p>
          <ul>
            <li>Provide accurate, current, and complete information during registration.</li>
            <li>Maintain the confidentiality of your account and password.</li>
            <li>Notify us immediately of any unauthorized use of your account.</li>
          </ul>
          <p>You are solely responsible for all activities that occur under your account.</p>
        </section>

        <section>
          <h2>4. Payment and Billing</h2>
          <p>You agree to pay all applicable fees related to the services you select. Fees may include:</p>
          <ul>
            <li>Subscription fees</li>
            <li>One-time service fees</li>
            <li>Additional fees based on the usage of certain features</li>
          </ul>
          <p>
            All fees are due at the time of purchase or as outlined in the service agreement. We reserve the right to modify
            prices at any time, but will notify you in advance of any changes.
          </p>
        </section>

        <section>
          <h2>5. Refund Policy</h2>
          <p>
            No refunds will be provided except in circumstances determined on a case-by-case basis at the discretion of
            Business Builders.
          </p>
        </section>

        <section>
          <h2>6. Intellectual Property</h2>
          <p>
            All content, software, text, images, and other materials available through our website are the property of
            Business Builders or its licensors and are protected by copyright, trademark, and other intellectual property
            laws. You may not reproduce, distribute, modify, or create derivative works based on any materials provided
            without our express written consent.
          </p>
        </section>

        <section>
          <h2>7. Limitation of Liability</h2>
          <p>
            To the fullest extent permitted by law, Business Builders shall not be liable for any damages—including direct,
            indirect, incidental, or consequential damages—arising from:
          </p>
          <ul>
            <li>The use or inability to use the Service</li>
            <li>Unauthorized access to or alteration of your data</li>
            <li>Any other matter related to the Service</li>
          </ul>
          <p>
            Our total liability for any claims related to the Service will be limited to the amount paid by you for the service
            during the previous 12 months.
          </p>
        </section>

        <section>
          <h2>8. Disclaimer of Warranties</h2>
          <p>
            We provide our Services on an "as is" and "as available" basis, without any warranties, express or implied,
            including warranties of merchantability, fitness for a particular purpose, and non-infringement. We do not
            guarantee that the Services will be uninterrupted or error-free, nor do we make any representations regarding
            the accuracy or reliability of any information provided.
          </p>
        </section>

        <section>
          <h2>9. Termination</h2>
          <p>
            We reserve the right to terminate your access to the Service at any time for any reason, including a breach of
            these Terms and Conditions. Upon termination, all provisions that by their nature should survive termination will
            remain in effect, including ownership provisions, disclaimers, and limitations of liability.
          </p>
        </section>

        <section>
          <h2>10. Privacy Policy</h2>
          <p>
            Your use of our Service is also governed by our Privacy Policy, which can be found on this website. By using the
            Service, you agree to the collection and use of your data as outlined in the Privacy Policy.
          </p>
        </section>

        <section>
          <h2>11. Modifications to Terms</h2>
          <p>
            We may modify these Terms and Conditions at any time. Any changes will be posted on this page, and the
            "Effective Date" will be updated. Your continued use of the Service after changes have been made constitutes
            acceptance of the revised Terms and Conditions.
          </p>
        </section>

        <section>
          <h2>12. Governing Law</h2>
          <p>
            These Terms and Conditions are governed by the laws of the Commonwealth of Massachusetts, without regard to
            its conflict of law principles. Any disputes arising from these Terms or the use of the Service shall be brought
            in the state or federal courts located in Massachusetts, and you consent to the jurisdiction of such courts.
          </p>
        </section>

        <section>
          <h2>13. Contact Information</h2>
          <p>
            If you have any questions about these Terms and Conditions, please contact us at:
          </p>
          <p>
            <strong>Business Builders</strong>
            <br />
            2 Beverly Hills Dr., Rutland, MA 01543
            <br />
            Phone: 978-790-1002
            <br />
            Email: support@businessbuilders.com
          </p>
        </section>
      </article>

      <footer className="mt-8">
        <Link href={`/${props.params.locale}`} className="text-blue-600 hover:underline">
          Return to Home
        </Link>
      </footer>
    </main>
  );
}
