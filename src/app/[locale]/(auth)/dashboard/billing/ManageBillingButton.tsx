'use client';

import { useState } from 'react';

import { Button } from '@/components/ui/button';

export const ManageBillingButton = ({
  text = 'Manage Billing',
  className = '',
}: {
  text?: string;
  className?: string;
}) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleClick = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/stripe/create-portal', {
        method: 'POST',
      });
      const data = await response.json();

      if (data.url) {
        window.location.href = data.url;
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      onClick={handleClick}
      disabled={isLoading}
      className={className}
    >
      {isLoading ? 'Loading...' : text}
    </Button>
  );
};
