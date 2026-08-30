import type { ReactNode } from 'react';

import { CookieBanner } from '@/components/CookieBanner';

export default function UnauthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="bb-marketing min-h-screen bg-background text-foreground">
      {children}
      <CookieBanner />
    </div>
  );
}
