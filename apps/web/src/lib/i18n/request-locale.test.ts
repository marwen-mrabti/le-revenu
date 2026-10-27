// @vitest-environment node
import { NextRequest } from 'next/server';
import { describe, expect, it } from 'vitest';

import { localePrefix, requestLocale } from './request-locale';

const locale = (headers: Record<string, string> = {}) =>
  requestLocale(new NextRequest('http://web.test/x', { headers }));

describe('requestLocale', () => {
  it('defaults to French', () => {
    expect(locale()).toBe('fr');
    expect(locale({ 'accept-language': 'de-DE,it;q=0.5' })).toBe('fr');
  });

  it('follows the locale cookie first', () => {
    expect(locale({ cookie: 'NEXT_LOCALE=en', 'accept-language': 'fr-FR' })).toBe('en');
    expect(locale({ cookie: 'NEXT_LOCALE=de', 'accept-language': 'fr-FR' })).toBe('fr');
  });

  it('falls back to the browser languages', () => {
    expect(locale({ 'accept-language': 'en-GB,en;q=0.9,fr;q=0.8' })).toBe('en');
    expect(locale({ 'accept-language': 'fr-FR,fr;q=0.9,en;q=0.8' })).toBe('fr');
  });

  it('prefixes every locale but the default', () => {
    expect(localePrefix('fr')).toBe('');
    expect(localePrefix('en')).toBe('/en');
  });
});
