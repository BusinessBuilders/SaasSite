import { describe, expect, it } from 'vitest';

import en from './en.json';

const BANNED = [
  /\bplatform\b/i,
  /\bsolution\b/i,
  /\bunlock\b/i,
  /\bleverage\b/i,
  /\btransform\b/i,
  /\bsynergy\b/i,
  /\bcutting[- ]edge\b/i,
  /\bempower\b/i,
  /\bautopilot\b/i,
  /\bAI tokens?\b/i,
  /🚀/,
  /✨/,
];

const ALLOW = [
  /AI operating layer/i,
];

const walk = (obj: unknown, path = ''): Array<[string, string]> => {
  if (typeof obj === 'string') {
    return [[path, obj]];
  }
  if (obj && typeof obj === 'object') {
    return Object.entries(obj as Record<string, unknown>).flatMap(([k, v]) =>
      walk(v, path ? `${path}.${k}` : k),
    );
  }
  return [];
};

describe('EN copy voice — no SaaS-speak', () => {
  const strings = walk(en);

  it.each(BANNED.map(rx => [rx.source]))('no string matches /%s/', (rxSource) => {
    const rx = new RegExp(rxSource, 'i');
    const offenders = strings
      .filter(([, v]) => rx.test(v))
      .filter(([, v]) => !ALLOW.some(a => a.test(v)));
    if (offenders.length) {
      const msg = offenders.map(([p, v]) => `  ${p}: ${v}`).join('\n');
      throw new Error(`Banned term in EN copy:\n${msg}`);
    }

    expect(offenders).toEqual([]);
  });
});
