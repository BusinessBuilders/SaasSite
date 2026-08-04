'use client';

import Link from 'next/link';
import { useState } from 'react';

import { SMS_CONSENT_TEXT } from './consent';

type Status = 'idle' | 'submitting' | 'success' | 'error';

const inputClasses
  = 'w-full rounded-md border border-bb-umber bg-bb-black-soft px-4 py-3 text-bb-cream '
  + 'placeholder:text-bb-dust focus:border-bb-orange focus:outline-none focus:ring-1 focus:ring-bb-orange';

export const SmsOptInForm = () => {
  const [status, setStatus] = useState<Status>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [smsConsent, setSmsConsent] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus('submitting');
    setErrorMessage('');

    const form = event.currentTarget;
    const data = new FormData(form);

    try {
      const response = await fetch('/api/sms-opt-in', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: data.get('name'),
          business: data.get('business') ?? '',
          email: data.get('email'),
          phone: data.get('phone') ?? '',
          message: data.get('message') ?? '',
          smsConsent,
          website: data.get('website') ?? '',
        }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(payload?.error ?? 'Something went wrong.');
      }

      setStatus('success');
      form.reset();
      setSmsConsent(false);
    } catch (error) {
      setStatus('error');
      setErrorMessage(
        error instanceof Error ? error.message : 'Something went wrong.',
      );
    }
  };

  if (status === 'success') {
    return (
      <div className="rounded-lg border border-bb-teal bg-bb-black-soft p-8 text-center">
        <p className="text-xl font-bold text-bb-cream">Got it — thank you!</p>
        <p className="mt-2 text-bb-taupe">
          Your message is in. We&apos;ll get back to you within one business
          day.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label
            htmlFor="name"
            className="mb-1 block text-sm font-medium text-bb-taupe"
          >
            Name *
          </label>
          <input
            id="name"
            name="name"
            required
            maxLength={200}
            className={inputClasses}
          />
        </div>
        <div>
          <label
            htmlFor="business"
            className="mb-1 block text-sm font-medium text-bb-taupe"
          >
            Business
          </label>
          <input
            id="business"
            name="business"
            maxLength={200}
            className={inputClasses}
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label
            htmlFor="email"
            className="mb-1 block text-sm font-medium text-bb-taupe"
          >
            Email *
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            maxLength={320}
            className={inputClasses}
          />
        </div>
        <div>
          <label
            htmlFor="phone"
            className="mb-1 block text-sm font-medium text-bb-taupe"
          >
            Mobile phone
            {smsConsent ? ' *' : ''}
          </label>
          <input
            id="phone"
            name="phone"
            type="tel"
            required={smsConsent}
            maxLength={40}
            className={inputClasses}
          />
        </div>
      </div>

      <div>
        <label
          htmlFor="message"
          className="mb-1 block text-sm font-medium text-bb-taupe"
        >
          What should we build or automate for you?
        </label>
        <textarea
          id="message"
          name="message"
          rows={4}
          maxLength={5000}
          className={inputClasses}
        />
      </div>

      {/* Honeypot — hidden from real users, catches bots that fill every field. */}
      <div className="hidden" aria-hidden="true">
        <label htmlFor="website">
          Website
          <input id="website" name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      <label className="flex cursor-pointer items-start gap-3 rounded-md border border-bb-umber bg-bb-black-soft p-4">
        <input
          type="checkbox"
          checked={smsConsent}
          onChange={event => setSmsConsent(event.target.checked)}
          className="mt-1 size-4 shrink-0 accent-[#c8551f]"
        />
        <span className="text-sm leading-relaxed text-bb-taupe">
          {SMS_CONSENT_TEXT}
          {' '}
          See our
          {' '}
          <Link
            href="/privacy-policy"
            className="underline hover:text-bb-cream"
          >
            Privacy Policy
          </Link>
          {' '}
          and
          {' '}
          <Link href="/terms" className="underline hover:text-bb-cream">
            Terms of Service
          </Link>
          .
        </span>
      </label>

      {status === 'error' && (
        <div
          role="alert"
          className="rounded-md border border-bb-brick bg-bb-black-soft p-4 text-sm text-bb-cream"
        >
          <p className="font-bold">Your message did not go through.</p>
          <p className="mt-1 text-bb-taupe">
            {errorMessage}
            {' '}
            You can also reach us directly at
            {' '}
            <a href="tel:+19787901002" className="underline">
              978-790-1002
            </a>
            {' '}
            or
            {' '}
            <a
              href="mailto:donovan@business-builder.online"
              className="underline"
            >
              donovan@business-builder.online
            </a>
            .
          </p>
        </div>
      )}

      <button
        type="submit"
        disabled={status === 'submitting'}
        className="bb-btn bb-btn-primary w-full disabled:opacity-60 sm:w-auto"
      >
        {status === 'submitting' ? 'Sending…' : 'Send Message'}
      </button>
    </form>
  );
};
