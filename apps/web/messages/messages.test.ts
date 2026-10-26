import { describe, expect, it } from 'vitest';

import en from './en.json';
import fr from './fr.json';

function keysOf(obj: Record<string, unknown>, prefix = ''): string[] {
  return Object.entries(obj).flatMap(([key, value]) =>
    typeof value === 'object' && value !== null
      ? keysOf(value as Record<string, unknown>, `${prefix}${key}.`)
      : [`${prefix}${key}`],
  );
}

describe('message catalogs', () => {
  it('have the same keys in every locale', () => {
    expect(keysOf(en).sort()).toEqual(keysOf(fr).sort());
  });

  it('have no empty strings', () => {
    for (const catalog of [fr, en]) {
      const empty = keysOf(catalog).filter((k) => {
        const value = k
          .split('.')
          .reduce<unknown>((acc, part) => (acc as Record<string, unknown>)[part], catalog);
        return typeof value === 'string' && value.trim() === '';
      });
      expect(empty).toEqual([]);
    }
  });
});
