'use client';
/* eslint-disable no-console */
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

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

  // Define handleClick before useEffect to fix the first error
  const handleClick = async () => {
    try {
      setIsLoading(true);
      setError(null);
      console.log('Starting checkout for plan:', planId);

      // Call the create-checkout API route
      const response = await fetch('/api/stripe/create-checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ planId }),
      });

      // Check if the response is JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        console.error('Non-JSON response received:', `${text.substring(0, 200)}...`);
        setError('Server error: API route returned HTML instead of JSON');
        return;
      }

      const data = await response.json();

      if (response.status === 401) {
        // Redirect to sign-in with the pricing page URL and checkout intent
        const redirectUrl = encodeURIComponent(`${window.location.pathname}?checkout=true&plan=${planId}`);
        router.push(`/sign-in?redirect_url=${redirectUrl}`);
      } else if (!data.url) {
        setError(data.error || 'Failed to create checkout session');
      } else {
        window.location.href = data.url;
      }
    } catch (error: any) {
      console.error('Error creating checkout:', error);
      setError(error.message || 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  // Only run client-side code after component mounts
  // Add eslint-disable comment for the missing dependency

  useEffect(() => {
    setMounted(true);

    // Check for auto-checkout params in URL
    const params = new URLSearchParams(window.location.search);
    const autoCheckout = params.get('checkout');
    const planToCheckout = params.get('plan');

    if (autoCheckout === 'true' && planToCheckout === planId) {
      // Remove params to prevent multiple checkouts
      window.history.replaceState({}, '', window.location.pathname);
      // Auto-trigger checkout
      handleClick();
    }
  }, [planId]); // Keep the original dependency array

  // Only render fully functional button on client
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
