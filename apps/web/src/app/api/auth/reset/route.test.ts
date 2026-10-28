// @vitest-environment node
import { NextRequest } from 'next/server';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@/config/env', () => ({ env: { NEXT_PUBLIC_APP_URL: 'http://web.test' } }));

import { GET } from './route';

const land = (query: string, headers: Record<string, string> = {}) =>
  GET(new NextRequest(`http://web.test/api/auth/reset${query}`, { headers })).headers.get(
    'location',
  );

const CODE = 'c'.repeat(40);

describe('GET /api/auth/reset', () => {
  it('carries the code to the reset page in the reader language', () => {
    expect(land(`?code=${CODE}`)).toBe(`http://web.test/reset-password?code=${CODE}`);
    expect(land(`?code=${CODE}`, { 'accept-language': 'en-US' })).toBe(
      `http://web.test/en/reset-password?code=${CODE}`,
    );
  });

  it('sends a missing or malformed code to the forgot page', () => {
    expect(land('')).toBe('http://web.test/forgot-password');
    expect(land('?code=short')).toBe('http://web.test/forgot-password');
  });
});
