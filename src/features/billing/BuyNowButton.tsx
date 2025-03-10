'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
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

  const handleClick = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      console.log('Starting checkout for plan:', planId);
      
      // Call the create-checkout API route with the plan ID
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
        // Not JSON - likely an error page
        const text = await response.text();
        console.error('Non-JSON response received:', text.substring(0, 200) + '...');
        setError('Server error: API route returned HTML instead of JSON');
        return;
      }
      
      const data = await response.json();
      
      if (response.status === 401) {
        router.push('/sign-in');
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
