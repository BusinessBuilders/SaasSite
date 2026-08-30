'use client';

import Link from 'next/link';
import { useState } from 'react';

import {
  SMS_INFO_CONSENT_TEXT,
  SMS_MARKETING_CONSENT_TEXT,
} from './consent';

type Status = 'idle' | 'submitting' | 'success' | 'error';

const inputClasses
  = 'w-full rounded-md border border-bb-umber bg-bb-black-soft px-4 py-3 text-bb-cream '
  + 'placeholder:text-bb-dust focus:border-bb-orange focus:outline-none focus:ring-1 focus:ring-bb-orange';

// One consent checkbox. Rendered twice — informational and marketing — as two
// independent, unchecked, optional boxes. Carriers require marketing consent
// to be collected separately (Twilio error 30913), so these must never be
// merged into one box or driven by a "select all".
const ConsentCheckbox = (props: {
  id: string;
  heading: string;
  text: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) => (
  <label
    htmlFor={props.id}
    className="flex cursor-pointer items-start gap-3 rounded-md border border-bb-umber bg-bb-black-soft p-4"
  >
    <input
      id={props.id}
      name={props.id}
      type="checkbox"
      checked={props.checked}
      onChange={event => props.onChange(event.target.checked)}
      className="mt-1 size-4 shrink-0 accent-[#c8551f]"
    />
    <span className="text-sm leading-relaxed text-bb-taupe">
      <span className="mb-1 block font-bold text-bb-cream">{props.heading}</span>
      {props.text}
      {' '}
      See our
      {' '}
      <Link href="/privacy-policy" className="underline hover:text-bb-cream">
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
);

export const SmsOptInForm = () => {
  const [status, setStatus] = useState<Status>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [infoConsent, setInfoConsent] = useState(false);
  const [marketingConsent, setMarketingConsent] = useState(false);
  const phoneRequired = infoConsent || marketingConsent;

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
          smsConsent: infoConsent,
          marketingConsent,
          website: data.get('website') ?? '',
        }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(payload?.error ?? 'Something went wrong.');
      }

      setStatus('success');
      form.reset();
      setInfoConsent(false);
      setMarketingConsent(false);
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
            {phoneRequired ? ' *' : ''}
          </label>
          <input
            id="phone"
            name="phone"
            type="tel"
            required={phoneRequired}
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

      <fieldset className="space-y-3">
        <legend className="mb-1 text-sm font-medium text-bb-taupe">
          Text messages (optional). Two separate choices — check only what you
          want to receive.
        </legend>
        <ConsentCheckbox
          id="sms-info-consent"
          heading="Service and appointment texts"
          text={SMS_INFO_CONSENT_TEXT}
          checked={infoConsent}
          onChange={setInfoConsent}
        />
        <ConsentCheckbox
          id="sms-marketing-consent"
          heading="Marketing texts (separate opt-in)"
          text={SMS_MARKETING_CONSENT_TEXT}
          checked={marketingConsent}
          onChange={setMarketingConsent}
        />
      </fieldset>

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
