// @vitest-environment node
import { NextRequest } from 'next/server';
import type * as NextServer from 'next/server';
import { describe, expect, it, vi } from 'vitest';

// `connection()` only resolves inside a Next request scope; the handler is called directly here.
vi.mock('next/server', async (importOriginal) => ({
  ...(await importOriginal<typeof NextServer>()),
  connection: vi.fn().mockResolvedValue(undefined),
}));
vi.mock('@/config/env', () => ({
  env: { AUTH_COOKIE_NAME: 'lr_session', STRAPI_URL: 'http://strapi.test' },
}));
vi.mock('@/lib/strapi/private', () => ({ strapiAuth: vi.fn() }));

import { strapiAuth } from '@/lib/strapi/private';

import { GET } from './route';

const call = (cookie = 'lr_session=good.jwt') =>
  GET(new NextRequest('http://web.test/api/account/password-status', { headers: { cookie } }));

describe('GET /api/account/password-status', () => {
  it('needs a session', async () => {
    expect((await call('')).status).toBe(401);
  });

  it('answers Strapi status for the session reader', async () => {
    vi.mocked(strapiAuth).mockResolvedValueOnce({ hasPassword: false });
    const response = await call();
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ hasPassword: false });
    expect(vi.mocked(strapiAuth).mock.calls[0]?.[0]).toBe('/auth/password-status');
  });
});
