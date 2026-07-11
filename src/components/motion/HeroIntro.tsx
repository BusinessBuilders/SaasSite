'use client';

import { useRef } from 'react';

import { gsap, useGSAP } from '@/libs/gsap';

/**
 * Homepage hero entrance: the headline drops in like a sign being hung —
 * slight overshoot, then settle — while the supporting lines stagger up.
 * Mark the headline with data-hero-sign and supporting rows with
 * data-hero-line. Reduced-motion visitors get the static server HTML.
 */
export const HeroIntro = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => {
  const ref = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add('(prefers-reduced-motion: no-preference)', () => {
        const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
        tl.from('[data-hero-sign]', {
          y: -36,
          opacity: 0,
          duration: 0.9,
          ease: 'back.out(1.4)',
        }).from(
          '[data-hero-line]',
          { y: 24, opacity: 0, duration: 0.6, stagger: 0.12 },
          '-=0.45',
        );
      });
    },
    { scope: ref },
  );

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
};
