// The orb's only job is to be honest about what Atlas is doing, and for most
// of its life it was not: the audio meter's `scale` setter was a silent no-op
// that warned once per animation frame, so the ring's opacity answered Atlas's
// voice and its size never moved. These tests pin the two halves of the fix —
// the meter really writes the ring's size, and leaving `speaking` puts it back.
import { render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { gsap } from '@/libs/gsap';

import { AtlasOrb } from './AtlasOrb';

// jsdom has no matchMedia, and GSAP's ScrollTrigger asks for one the moment
// '@/libs/gsap' is imported — hence vi.hoisted(), which runs before every
// import. It answers "no-preference", so the meter is ON: it is the thing
// under test, and it can only be watched while it is allowed to run.
vi.hoisted(() => {
  (globalThis as { matchMedia?: unknown }).matchMedia = (query: string) => ({
    matches: !/reduce/.test(query),
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

/** Every property name any tween on this element is currently writing. */
const propsDrivenOn = (ring: HTMLElement) =>
  new Set(gsap.getTweensOf(ring).flatMap(tween => Object.keys(tween.vars)));

const resetTweenOf = (ring: HTMLElement) =>
  gsap.getTweensOf(ring).find(tween => tween.vars.overwrite === 'auto');

describe('AtlasOrb', () => {
  afterEach(() => {
    gsap.globalTimeline.clear();
  });

  it('drives the ring from the audio level through scaleX and scaleY, silently', () => {
    // vitest-fail-on-console already fails this file on any console output, so
    // the spy is here to name what we are watching for rather than to enable
    // the check: gsap warns "scale not eligible for reset. Try splitting into
    // individual properties" once per frame when quickTo is given 'scale'.
    const warn = vi.spyOn(console, 'warn');
    const { container, rerender } = render(
      <AtlasOrb state="listening" level={0} label="Atlas: Listening" />,
    );
    const ring = innerRing(container);

    rerender(<AtlasOrb state="speaking" level={0.8} label="Atlas: Speaking" />);

    const driven = propsDrivenOn(ring);

    // CSSPlugin stores the transform as scaleX/scaleY and never as `scale`, so
    // a quickTo bound to 'scale' finds no PropTween, warns, and writes nothing.
    expect(driven.has('scaleX')).toBe(true);
    expect(driven.has('scaleY')).toBe(true);
    expect(driven.has('opacity')).toBe(true);
    expect(warn).not.toHaveBeenCalled();

    warn.mockRestore();
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

    // Back to a circle at rest — and written with the SAME property names the
    // meter uses, because `overwrite: 'auto'` matches on names: a reset that
    // wrote the `scale` shorthand would be fighting the meter's scaleX/scaleY
    // tweens rather than overwriting them.
    expect(reset).toBeDefined();
    expect(reset?.vars.scaleX).toBe(1);
    expect(reset?.vars.scaleY).toBe(1);
    expect(reset?.vars.opacity).toBe(0.6);
  });

  it('holds the ring still for a visitor who asked for reduced motion', () => {
    vi.stubGlobal('matchMedia', (query: string) => ({
      matches: /reduce/.test(query),
      media: query,
      onchange: null,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
    }));

    const { container, rerender } = render(
      <AtlasOrb state="listening" level={0} label="Atlas: Listening" />,
    );
    const ring = innerRing(container);

    gsap.globalTimeline.clear();
    rerender(<AtlasOrb state="speaking" level={0.9} label="Atlas: Speaking" />);

    // The meter is the loudest motion on the page; a reduced-motion visitor
    // reads the status line instead and the ring stays where it is.
    expect(propsDrivenOn(ring).has('scaleX')).toBe(false);

    vi.unstubAllGlobals();
  });
});
