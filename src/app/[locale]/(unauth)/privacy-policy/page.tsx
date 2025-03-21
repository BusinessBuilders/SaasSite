import Link from 'next/link';

export default function PrivacyPolicyPage() {
  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      <h1 className="mb-6 text-3xl font-bold">Privacy Policy</h1>

      <div className="prose max-w-none">
        <p>
          <strong>Effective Date:</strong>
        </p>
        <p>{new Date().toLocaleDateString()}</p>

        <h2>1. Consent to Receive Communications</h2>
        <p>
          By providing your phone number, you consent to receive SMS notifications, alerts, and occasional marketing
          communications from
          {' '}
          <strong>Business Builders</strong>
          .
        </p>
        <ul>
          <li>Message frequency varies</li>
          <li>Message &amp; data rates may apply</li>
          <li>
            Text
            {' '}
            <strong>HELP</strong>
            {' '}
            to
            {' '}
            <strong>978-790-1002</strong>
            {' '}
            for assistance
          </li>
          <li>
            Reply
            {' '}
            <strong>STOP</strong>
            {' '}
            to unsubscribe at any time
          </li>
        </ul>

        <h2>2. Information We Collect</h2>
        <h3>A. Personal Information</h3>
        <p>
          We collect information like your name, email, and phone number when you create an account or fill out a form.
          Payment details (such as credit card numbers) are securely processed by third-party processors.
        </p>
        <h3>B. Automatically Collected Information</h3>
        <p>
          We may collect data such as IP address, browser type, and activity on our site. We also use cookies to improve
          your experience.
        </p>

        <h2>3. How We Use Your Information</h2>
        <ul>
          <li>To provide and manage requested services</li>
          <li>To personalize and improve site functionality</li>
          <li>To send updates, alerts, and promotional content</li>
          <li>To process secure transactions</li>
          <li>To analyze usage trends and optimize our service</li>
        </ul>

        <h2>4. Disclosure of Your Information</h2>
        <ul>
          <li>With trusted service providers (e.g., payment processors)</li>
          <li>To comply with legal obligations</li>
          <li>To protect our rights, safety, or that of others</li>
          <li>In the event of a merger, acquisition, or asset transfer</li>
        </ul>
        <p>
          <strong>We do not sell or rent your personal information to third parties.</strong>
        </p>

        <h2>5. Security of Your Information</h2>
        <p>
          We take reasonable precautions to safeguard your data, but no online transmission is 100% secure. While we strive
          to protect your personal data, we cannot guarantee absolute security.
        </p>

        <h2>6. Your Rights and Choices</h2>
        <ul>
          <li>Access, update, or delete your personal data</li>
          <li>Unsubscribe from marketing emails at any time</li>
          <li>Disable cookies via your browser settings</li>
        </ul>
        <p>
          For privacy-related requests, please contact us at
          {' '}
          <strong>support@businessbuilders.com</strong>
          .
        </p>

        <h2>7. Cookies &amp; Tracking Technologies</h2>
        <p>
          We use cookies to remember user preferences and analyze traffic. You may disable cookies in your browser
          settings, but this may affect site functionality.
        </p>

        <h2>8. Third-Party Links</h2>
        <p>
          Our website may contain links to external sites that have their own privacy policies. We are not responsible
          for their content or practices.
        </p>

        <h2>9. Changes to This Privacy Policy</h2>
        <p>
          We may update this policy periodically. Any changes will be posted on this page, and your continued use of the
          site indicates acceptance of the updated policy.
        </p>

        <h2>10. Children's Privacy</h2>
        <p>
          Our services are not intended for children under 13, and we do not knowingly collect personal information from
          them. If you believe such information has been collected, please contact us immediately.
        </p>

        <h2>11. Contact Us</h2>
        <p>If you have any questions about this Privacy Policy, please contact us at:</p>
        <p>
          <strong>Business Builders</strong>
          <br />
          2 Beverly Hills Dr., Rutland, MA 01543
          <br />
          Phone: 978-790-1002
          <br />
          Email: support@businessbuilders.com
        </p>
      </div>

      <div className="mt-8">
        <Link href="/" className="text-blue-600 hover:underline">
          Return to Home
        </Link>
      </div>
    </div>
  );
}
