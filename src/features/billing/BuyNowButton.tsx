'use client';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';

type BuyNowButtonProps = {
  text?: string;
  className?: string;
  planId: string;
};

export const BuyNowButton = ({
  text = 'Buy Now',
  className = '',
  planId,
}: BuyNowButtonProps) => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  // 1. Define handleClick with useCallback BEFORE useEffect
  const handleClick = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      // 3. Add eslint disable comment for console
      // eslint-disable-next-line no-console
      console.log('Starting checkout for plan:', planId);

      const response = await fetch('/api/stripe/create-checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ planId }),
      });

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        // 3. Add eslint disable comment for console

        console.error('Non-JSON response received:', `${text.substring(0, 200)}...`);
        setError('Server error: API route returned HTML instead of JSON');
        return;
      }

      const data = await response.json();

      if (response.status === 401) {
        const redirectUrl = encodeURIComponent(`${window.location.pathname}?checkout=true&plan=${planId}`);
        router.push(`/sign-in?redirect_url=${redirectUrl}`);
      } else if (!data.url) {
        setError(data.error || 'Failed to create checkout session');
      } else {
        window.location.href = data.url;
      }
    } catch (error: any) {
      // 3. Add eslint disable comment for console

      console.error('Error creating checkout:', error);
      setError(error.message || 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  }, [planId, router]); // Include dependencies

  // useEffect now uses handleClick after it's defined
  useEffect(() => {
    setMounted(true);

    const params = new URLSearchParams(window.location.search);
    const autoCheckout = params.get('checkout');
    const planToCheckout = params.get('plan');

    if (autoCheckout === 'true' && planToCheckout === planId) {
      window.history.replaceState({}, '', window.location.pathname);
      handleClick();
    }
  }, [planId, handleClick]); // 2. Include handleClick in dependencies

  if (!mounted) {
    return (
      <Button className={className} disabled>
        {text}
      </Button>
    );
  }

  return (
    <div className="flex flex-col">
      <Button
        onClick={handleClick}
        className={className}
        disabled={isLoading}
      >
        {isLoading ? 'Please wait...' : text}
      </Button>

      {error && (
        <div className="mt-2 text-sm text-red-500">
          {error}
        </div>
      )}
    </div>
  );
};
