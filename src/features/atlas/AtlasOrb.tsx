'use client';
// src/features/atlas/AtlasOrb.tsx — the one visual that tells the visitor
// Atlas is listening / thinking / speaking. Three concentric rings on
// transforms only; `level` (0..1) scales the inner ring while Atlas speaks.
//
// The orb is decoration with a label: the panel's status line carries the same
// information in words, so a visitor who prefers reduced motion (rings held
// still) loses nothing.
import { useEffect, useRef, useState } from 'react';

import { gsap, useGSAP } from '@/libs/gsap';

type Props = {
  state: 'idle' | 'listening' | 'thinking' | 'speaking';
  /** Loudness of the agent's audio, 0..1, sampled per animation frame. */
  level: number;
  size?: number;
};

/**
 * Reduced-motion preference as a value, kept current with a change listener.
 * The speaking meter below re-runs on every audio frame, so it cannot afford a
 * `gsap.matchMedia()` (or a `window.matchMedia()`) call each time.
 */
const useReducedMotion = () => {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduced(query.matches);
    const onChange = (event: MediaQueryListEvent) => setReduced(event.matches);
    query.addEventListener('change', onChange);
    return () => query.removeEventListener('change', onChange);
  }, []);

  return reduced;
};

export const AtlasOrb = ({ state, level, size = 220 }: Props) => {
  const ref = useRef<HTMLDivElement>(null);
  const reducedMotion = useReducedMotion();

  useGSAP(
    () => {
      const rings = ref.current?.querySelectorAll<HTMLElement>('[data-ring]');
      if (!rings) {
        return undefined;
      }
      gsap.killTweensOf(rings);
      const mm = gsap.matchMedia();
      mm.add('(prefers-reduced-motion: no-preference)', () => {
        if (state === 'listening') {
          gsap.to(rings, {
            scale: 1.06,
            opacity: 0.9,
            duration: 1.4,
            ease: 'sine.inOut',
            yoyo: true,
            repeat: -1,
            stagger: 0.15,
          });
        } else if (state === 'thinking') {
          gsap.to(rings, {
            rotate: 360,
            duration: 6,
            ease: 'none',
            repeat: -1,
            stagger: { each: 0.4, from: 'end' },
          });
        } else if (state === 'idle') {
          gsap.to(rings, { scale: 1, opacity: 0.6, duration: 0.6, ease: 'power2.out' });
        }
      });
      return () => mm.revert();
    },
    { dependencies: [state], scope: ref },
  );

  useGSAP(
    () => {
      if (state !== 'speaking' || reducedMotion) {
        return;
      }
      const inner = ref.current?.querySelector<HTMLElement>('[data-ring="0"]');
      if (inner) {
        gsap.to(inner, {
          scale: 1 + level * 0.5,
          opacity: 0.7 + level * 0.3,
          duration: 0.08,
          ease: 'none',
          overwrite: true,
        });
      }
    },
    { dependencies: [level, state, reducedMotion], scope: ref },
  );

  return (
    <div
      ref={ref}
      className="relative grid place-items-center"
      style={{ width: size, height: size, maxWidth: '100%' }}
      role="img"
      aria-label={`Atlas is ${state}`}
    >
      {[0, 1, 2].map(i => (
        <span
          key={i}
          data-ring={i}
          className="absolute rounded-full border will-change-transform"
          style={{
            width: `${60 + i * 20}%`,
            height: `${60 + i * 20}%`,
            borderColor: i === 0 ? 'var(--bb-orange)' : 'var(--bb-border-soft)',
            background:
              i === 0
                ? 'radial-gradient(circle, var(--bb-orange-soft) 0%, transparent 70%)'
                : 'transparent',
            opacity: 0.6,
          }}
        />
      ))}
    </div>
  );
};
