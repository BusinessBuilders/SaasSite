import type { ReactNode } from 'react';

export default function UnauthLayout({ children }: { children: ReactNode }) {
  return <div className="bb-marketing min-h-screen bg-background text-foreground">{children}</div>;
}
