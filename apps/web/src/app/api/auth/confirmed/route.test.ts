// @vitest-environment node
import { NextRequest } from 'next/server';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@/config/env', () => ({ env: { NEXT_PUBLIC_APP_URL: 'http://web.test' } }));

import { GET } from './route';

const land = (headers: Record<string, string> = {}) =>
  GET(new NextRequest('http://web.test/api/auth/confirmed', { headers })).headers.get('location');

describe('GET /api/auth/confirmed', () => {
  it('lands on the login page with the banner, in the reader language', () => {
    expect(land()).toBe('http://web.test/login?confirmed=1');
    expect(land({ 'accept-language': 'en-GB,en;q=0.9' })).toBe(
      'http://web.test/en/login?confirmed=1',
    );
  });
});
