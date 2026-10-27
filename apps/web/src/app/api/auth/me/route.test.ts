// @vitest-environment node
// Route handlers and guards read Cookie, Origin and Sec-Fetch-Site: a browser-like Request drops those headers.
import { NextRequest } from 'next/server';
import type * as NextServer from 'next/server';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@/config/env', () => ({
  env: { AUTH_COOKIE_NAME: 'lr_session', STRAPI_URL: 'http://strapi.test' },
}));
vi.mock('@/lib/strapi/private', () => ({ strapiAuth: vi.fn() }));
vi.mock('next/server', async (importOriginal) => ({
  ...(await importOriginal<typeof NextServer>()),
  connection: vi.fn().mockResolvedValue(undefined),
}));

import { strapiAuth } from '@/lib/strapi/private';

import { GET } from './route';

const me = (cookie?: string) =>
  GET(new NextRequest('http://web.test/api/auth/me', { headers: cookie ? { cookie } : {} }));

describe('GET /api/auth/me', () => {
  it('answers 401 without a cookie and never calls Strapi', async () => {
    const response = await me();
    expect(response.status).toBe(401);
    expect(strapiAuth).not.toHaveBeenCalled();
  });

  it('answers the reader for a valid cookie, email included, nothing else', async () => {
    vi.mocked(strapiAuth).mockResolvedValueOnce({
      id: 41,
      documentId: 'u1',
      username: 'alice',
      email: 'alice@demo.lerevenu.test',
      blocked: false,
    });
    const response = await me('lr_session=good.jwt');
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      user: {
        documentId: 'u1',
        username: 'alice',
        email: 'alice@demo.lerevenu.test',
        displayName: null,
        avatarUrl: null,
        provider: 'local',
      },
    });
    expect(vi.mocked(strapiAuth).mock.calls[0]?.[1]).toMatchObject({ jwt: 'good.jwt' });
  });

  it('clears a cookie Strapi rejects', async () => {
    vi.mocked(strapiAuth).mockRejectedValueOnce(new Error('401'));
    const response = await me('lr_session=stale.jwt');
    expect(response.status).toBe(401);
    expect(response.headers.get('set-cookie')).toContain('Max-Age=0');
  });
});
