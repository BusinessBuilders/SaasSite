'use client';
// src/features/atlas/AtlasOrb.tsx — the one visual that tells the visitor
// Atlas is listening / thinking / speaking. Three concentric rings on
// transforms only; `level` (0..1) drives the inner ring while Atlas speaks.
//
// The orb is decoration with a label: the panel's status line carries the same
// information in words, so a visitor who prefers reduced motion (rings held
// still) loses nothing.
import { useEffect, useRef, useState } from 'react';

import { gsap, useGSAP } from '@/libs/gsap';

export type AtlasOrbState = 'idle' | 'listening' | 'thinking' | 'speaking';

type Props = {
  state: AtlasOrbState;
  /** Loudness of the agent's audio, 0..1, sampled once per animation frame. */
  level: number;
  /**
   * Accessible name. Callers pass the visitor-facing status ("Connecting…",
   * "Listening"), never the internal state word — "Atlas is idle" while the
   * call is still connecting would be a lie told only to screen readers.
   */
  label: string;
  /** Any CSS length; a clamp() lets one orb size itself from phone to desktop. */
  size?: number | string;
};

const RESTING_SCALE = 1;
const RESTING_OPACITY = 0.6;

/**
 * Reduced-motion preference as a value, kept current with a change listener.
 * Read once per mount rather than per frame: the speaking meter below runs on
 * every audio frame and cannot afford a `matchMedia()` call each time.
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

type QuickTo = ReturnType<typeof gsap.quickTo>;

export const AtlasOrb = ({ state, level, label, size = 220 }: Props) => {
  const ref = useRef<HTMLDivElement>(null);
  const reducedMotion = useReducedMotion();
  // scaleX and scaleY, NOT 'scale' — see the meter below for why there are two.
  const setScaleX = useRef<QuickTo | null>(null);
  const setScaleY = useRef<QuickTo | null>(null);
  const setOpacity = useRef<QuickTo | null>(null);

  // Hand the inner ring back to rest whenever Atlas stops speaking. Declared
  // BEFORE the state tween on purpose — GSAP renders tweens in creation order,
  // so the state animation below is created second, renders last and keeps the
  // ring for itself while listening. This one only has to win against what the
  // audio meter left behind.
  //
  // It writes the SAME property names the meter does (scaleX/scaleY, not the
  // `scale` shorthand), because `overwrite: 'auto'` matches on property names:
  // a reset that wrote `scale` would leave the meter's scaleX/scaleY tweens
  // alive and be fighting them, not overwriting them.
  //
  // An earlier version of this comment claimed the overwrite was fixing a
  // scale wobble. It cannot have been: until this commit the meter's `scale`
  // setter was a silent no-op (see below), so the only property the two tweens
  // ever really contended over was `opacity` — which they did, and which the
  // overwrite did fix. Now that the meter genuinely drives the ring's size, the
  // overwrite earns the rest of its keep.
  useGSAP(
    () => {
      const inner = ref.current?.querySelector<HTMLElement>('[data-ring="0"]');
      if (!inner || state === 'speaking') {
        return undefined;
      }
      gsap.to(inner, {
        scaleX: RESTING_SCALE,
        scaleY: RESTING_SCALE,
        opacity: RESTING_OPACITY,
        duration: 0.3,
        ease: 'power2.out',
        overwrite: 'auto',
      });
      return undefined;
    },
    { dependencies: [state], scope: ref },
  );

  // The state tween. `revertOnUpdate` is what makes the cleanup below actually
  // run when `state` changes — without it useGSAP keeps the old context alive
  // and every state change stacks another infinite tween on the rings.
  useGSAP(
    () => {
      const rings = ref.current?.querySelectorAll<HTMLElement>('[data-ring]');
      if (!rings) {
        return undefined;
      }
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
          gsap.to(rings, {
            scale: RESTING_SCALE,
            opacity: RESTING_OPACITY,
            duration: 0.6,
            ease: 'power2.out',
          });
        }
      });
      return () => mm.revert();
    },
    { dependencies: [state], revertOnUpdate: true, scope: ref },
  );

  // The audio meter is built ONCE. gsap.quickTo hands back a setter backed by a
  // single reusable tween, so driving the ring from `level` costs one function
  // call per frame instead of a new gsap.to() — which at 60 fps was retaining
  // ~3,600 tweens in the context per minute of conversation.
  //
  // TWO scale setters, and they are not interchangeable with one `scale` one.
  // gsap.quickTo drives tween.resetTo(property, value), and resetTo looks the
  // property up among the tween's PropTweens by NAME. CSSPlugin never stores a
  // PropTween called `scale`: it decomposes the transform and stores `scaleX`
  // and `scaleY`. So quickTo(el, 'scale') finds nothing, warns
  // "scale not eligible for reset. Try splitting into individual properties"
  // (gsap-core.js:3059) and writes nothing at all — which is what it had been
  // doing since the orb was written: the ring's OPACITY answered Atlas's voice
  // and its size never moved, at the cost of one console warning per animation
  // frame (~640 a minute of conversation).
  useGSAP(
    () => {
      const inner = ref.current?.querySelector<HTMLElement>('[data-ring="0"]');
      if (!inner) {
        return undefined;
      }
      setScaleX.current = gsap.quickTo(inner, 'scaleX', { duration: 0.08, ease: 'none' });
      setScaleY.current = gsap.quickTo(inner, 'scaleY', { duration: 0.08, ease: 'none' });
      setOpacity.current = gsap.quickTo(inner, 'opacity', { duration: 0.08, ease: 'none' });
      return () => {
        setScaleX.current = null;
        setScaleY.current = null;
        setOpacity.current = null;
      };
    },
    { dependencies: [], scope: ref },
  );

  useEffect(() => {
    if (state !== 'speaking' || reducedMotion) {
      return;
    }
    // One number, both axes: the ring is a circle and has to stay one.
    const scale = 1 + level * 0.5;
    setScaleX.current?.(scale);
    setScaleY.current?.(scale);
    setOpacity.current?.(0.7 + level * 0.3);
  }, [level, state, reducedMotion]);

  return (
    <div
      ref={ref}
      className="relative grid place-items-center"
      style={{ width: size, height: size, maxWidth: '100%' }}
      role="img"
      aria-label={label}
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
            opacity: RESTING_OPACITY,
          }}
        />
      ))}
    </div>
  );
};
