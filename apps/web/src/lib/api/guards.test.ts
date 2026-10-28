// @vitest-environment node
// Route handlers and guards read Cookie, Origin and Sec-Fetch-Site: a browser-like Request drops those headers.
import { NextRequest } from 'next/server';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@/config/env', () => ({
  env: { STRAPI_URL: 'http://strapi.test', NEXT_PUBLIC_APP_URL: 'https://app.example.test' },
}));

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

  it('accepts the Origin of the Host header or of the public app URL (container, proxy)', () => {
    // The request URL carries the bind address, the browser used localhost:3000.
    const inContainer = new NextRequest('http://0.0.0.0:3000/api/auth/login', {
      method: 'POST',
      headers: { host: 'localhost:3000', origin: 'http://localhost:3000' },
    });
    expect(() => assertSameOrigin(inContainer)).not.toThrow();
    expect(() => assertSameOrigin(post({ origin: 'https://app.example.test' }))).not.toThrow();
    const forwarded = new NextRequest('http://0.0.0.0:3000/api/auth/login', {
      method: 'POST',
      headers: {
        host: '0.0.0.0:3000',
        'x-forwarded-host': 'community.example.test',
        origin: 'https://community.example.test',
      },
    });
    expect(() => assertSameOrigin(forwarded)).not.toThrow();
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
