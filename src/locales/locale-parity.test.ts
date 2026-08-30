import { describe, expect, it } from 'vitest';

import en from './en.json';
import fr from './fr.json';

// Recursively collect all leaf paths in a nested object.
const collectPaths = (obj: unknown, prefix = ''): string[] => {
  if (obj === null || typeof obj !== 'object' || Array.isArray(obj)) {
    return [prefix];
  }
  return Object.entries(obj as Record<string, unknown>).flatMap(([k, v]) =>
    collectPaths(v, prefix ? `${prefix}.${k}` : k),
  );
};

describe('Locale parity (en ↔ fr)', () => {
  it('every EN translation key exists in FR', () => {
    const enPaths = new Set(collectPaths(en));
    const frPaths = new Set(collectPaths(fr));
    const missingInFr = [...enPaths].filter(p => !frPaths.has(p));

    expect(missingInFr).toEqual([]);
  });

  it('every FR translation key exists in EN (catches stale FR keys)', () => {
    const enPaths = new Set(collectPaths(en));
    const frPaths = new Set(collectPaths(fr));
    const missingInEn = [...frPaths].filter(p => !enPaths.has(p));

    expect(missingInEn).toEqual([]);
  });
});
