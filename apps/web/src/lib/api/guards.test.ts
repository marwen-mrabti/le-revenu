// @vitest-environment node
// Route handlers and guards read Cookie, Origin and Sec-Fetch-Site: a browser-like Request drops those headers.
import { NextRequest } from 'next/server';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@/config/env', () => ({ env: { STRAPI_URL: 'http://strapi.test' } }));

import { assertJson, assertSameOrigin } from './guards';

const post = (headers: Record<string, string>) =>
  new NextRequest('http://web.test/api/auth/login', { method: 'POST', headers });

describe('assertSameOrigin', () => {
  it('accepts a same-origin browser request and a header-less tool request', () => {
    expect(() =>
      assertSameOrigin(post({ 'sec-fetch-site': 'same-origin', origin: 'http://web.test' })),
    ).not.toThrow();
    expect(() => assertSameOrigin(post({}))).not.toThrow();
  });

  it('refuses cross-site requests, by Sec-Fetch-Site or by Origin', () => {
    expect(() => assertSameOrigin(post({ 'sec-fetch-site': 'cross-site' }))).toThrow(
      expect.objectContaining({ status: 403, code: 'CROSS_ORIGIN' }),
    );
    expect(() => assertSameOrigin(post({ origin: 'http://evil.test' }))).toThrow(
      expect.objectContaining({ status: 403 }),
    );
  });
});

describe('assertJson', () => {
  it('accepts JSON and refuses anything else with 415', () => {
    expect(() =>
      assertJson(post({ 'content-type': 'application/json; charset=utf-8' })),
    ).not.toThrow();
    expect(() => assertJson(post({ 'content-type': 'application/x-www-form-urlencoded' }))).toThrow(
      expect.objectContaining({ status: 415 }),
    );
    expect(() => assertJson(post({}))).toThrow(expect.objectContaining({ status: 415 }));
  });
});
