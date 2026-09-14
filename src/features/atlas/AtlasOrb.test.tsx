// The orb's only job is to be honest about what Atlas is doing, and the one
// way it misbehaved was on the way out of a sentence: the audio meter's tween
// and whatever came next both wrote the inner ring's `scale`, and the ring
// wobbled between them for a few frames. This pins the hand-off.
import { render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { gsap } from '@/libs/gsap';

import { AtlasOrb } from './AtlasOrb';

// jsdom has no matchMedia, and GSAP's ScrollTrigger asks for one the moment
// '@/libs/gsap' is imported — hence vi.hoisted(), which runs before every
// import. It answers "reduce", the quieter of the two branches: the audio meter
// is then switched off, which is what lets this test watch the reset tween on
// its own instead of racing the meter GSAP cannot drive in a layout-less DOM.
vi.hoisted(() => {
  (globalThis as { matchMedia?: unknown }).matchMedia = (query: string) => ({
    matches: /reduce/.test(query),
    media: query,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  });
});

const innerRing = (container: HTMLElement) => {
  const ring = container.querySelector<HTMLElement>('[data-ring="0"]');
  if (!ring) {
    throw new Error('the orb rendered no inner ring');
  }
  return ring;
};

const resetTweenOf = (ring: HTMLElement) =>
  gsap.getTweensOf(ring).find(tween => tween.vars.overwrite === 'auto');

describe('AtlasOrb', () => {
  afterEach(() => {
    gsap.globalTimeline.clear();
  });

  it('hands the inner ring back to rest with an overwriting tween when Atlas stops speaking', () => {
    const { container, rerender } = render(
      <AtlasOrb state="listening" level={0} label="Atlas: Listening" />,
    );
    const ring = innerRing(container);

    gsap.globalTimeline.clear();

    rerender(<AtlasOrb state="speaking" level={0.8} label="Atlas: Speaking" />);

    // While Atlas speaks the audio meter owns the ring; nothing else claims it.
    expect(resetTweenOf(ring)).toBeUndefined();

    rerender(<AtlasOrb state="thinking" level={0} label="Atlas: Thinking" />);

    const reset = resetTweenOf(ring);

    // `overwrite: 'auto'` is the fix: it kills the meter's still-running tween
    // instead of racing it frame by frame, which is what the wobble was. The
    // tween is created BEFORE the state animation (see AtlasOrb.tsx), so the
    // pulse that follows is younger, renders last and keeps the ring.
    expect(reset).toBeDefined();
    expect(reset?.vars.scale).toBe(1);
    expect(reset?.vars.opacity).toBe(0.6);
  });
});
