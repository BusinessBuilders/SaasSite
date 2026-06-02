'use client';

import { useEffect, useState } from 'react';

type BuyNowButtonProps = {
  text?: string;
  className?: string;
  /** Kept for compatibility with existing callers; not used in the Calendly flow. */
  planId?: string;
};

// Pre-launch decision: until live-mode Stripe products exist for Starter/
// Growth/Pro, every Buy Now CTA routes to the existing Calendly consultation
// link. Same pattern as /ad-services. When real Stripe products are created
// and their price IDs are set in the prod env vars, swap this back to the
// previous fetch('/api/stripe/create-checkout') flow — one-line change.
const CALENDLY_URL = 'https://calendly.com/donovan-business-builder/15minute';

export const BuyNowButton = ({ text = 'Buy Now', className = '' }: BuyNowButtonProps) => {
  // Avoid hydration mismatch on the link's text while still rendering an
  // anchor (which is fine to SSR — only the text varies if a caller passes
  // a translated label later).
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  return (
    <a
      href={CALENDLY_URL}
      target="_blank"
      rel="noopener noreferrer"
      className={className}
    >
      {mounted ? text : 'Buy Now'}
    </a>
  );
};
