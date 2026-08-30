import { describe, expect, it } from 'vitest';

import { smsOptInSubmissionSchema } from './schema';

const base = {
  name: 'Test Person',
  business: '',
  email: 'test@example.org',
  phone: '',
  message: '',
  smsConsent: false,
  marketingConsent: false,
  website: '',
};

describe('smsOptInSubmissionSchema — two separate consents', () => {
  it('accepts a submission with neither consent checked and no phone', () => {
    expect(smsOptInSubmissionSchema.safeParse(base).success).toBe(true);
  });

  it('accepts informational consent alone when a phone is given', () => {
    const result = smsOptInSubmissionSchema.safeParse({
      ...base,
      smsConsent: true,
      phone: '5085551234',
    });

    expect(result.success).toBe(true);
  });

  it('accepts marketing consent alone when a phone is given', () => {
    const result = smsOptInSubmissionSchema.safeParse({
      ...base,
      marketingConsent: true,
      phone: '5085551234',
    });

    expect(result.success).toBe(true);
  });

  it('requires a phone number when informational consent is checked', () => {
    const result = smsOptInSubmissionSchema.safeParse({
      ...base,
      smsConsent: true,
    });

    expect(result.success).toBe(false);
  });

  it('requires a phone number when only marketing consent is checked', () => {
    const result = smsOptInSubmissionSchema.safeParse({
      ...base,
      marketingConsent: true,
    });

    expect(result.success).toBe(false);
  });

  it('rejects a payload missing the marketingConsent field (old single-consent client)', () => {
    const { marketingConsent: _omit, ...legacy } = base;
    const result = smsOptInSubmissionSchema.safeParse(legacy);

    expect(result.success).toBe(false);
  });

  it('never infers marketing consent from informational consent', () => {
    const result = smsOptInSubmissionSchema.safeParse({
      ...base,
      smsConsent: true,
      phone: '5085551234',
    });

    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.data.marketingConsent).toBe(false);
    }
  });
});
