'use client';

import { useRef } from 'react';

import { gsap, useGSAP } from '@/libs/gsap';

type RevealProps = {
  children: React.ReactNode;
  /** Sibling stagger delay in seconds (e.g. 0, 0.1, 0.2). */
  delay?: number;
  className?: string;
};

/**
 * Scroll-triggered reveal for marketing sections: fades + rises once when the
 * element enters the viewport. Content is always present in the server HTML;
 * visitors who prefer reduced motion see it statically (no tween is created).
 */
export const Reveal = ({ children, delay = 0, className }: RevealProps) => {
  const ref = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add('(prefers-reduced-motion: no-preference)', () => {
        gsap.from(ref.current, {
          y: 24,
          opacity: 0,
          duration: 0.7,
          ease: 'power3.out',
          delay,
          scrollTrigger: {
            trigger: ref.current,
            start: 'top 85%',
            toggleActions: 'play none none none',
          },
        });
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
