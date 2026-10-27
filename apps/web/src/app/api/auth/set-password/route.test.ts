// @vitest-environment node
import { NextRequest } from 'next/server';
import { describe, expect, it, vi } from 'vitest';

import { StrapiError } from '@/lib/strapi/base';

vi.mock('@/config/env', () => ({
  env: { AUTH_COOKIE_NAME: 'lr_session', STRAPI_URL: 'http://strapi.test' },
}));
vi.mock('@/lib/strapi/private', () => ({ strapiAuth: vi.fn() }));

import { strapiAuth } from '@/lib/strapi/private';

import { POST } from './route';

const call = (body: unknown, cookie = 'lr_session=good.jwt') =>
  POST(
    new NextRequest('http://web.test/api/auth/set-password', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'sec-fetch-site': 'same-origin', cookie },
      body: JSON.stringify(body),
    }),
  );

const valid = { password: 'GoogleThenLocal2026!', passwordConfirmation: 'GoogleThenLocal2026!' };

describe('POST /api/auth/set-password', () => {
  it('needs a session', async () => {
    const response = await call(valid, '');
    expect(response.status).toBe(401);
    expect(strapiAuth).not.toHaveBeenCalled();
  });

  it('refuses a mismatch before calling Strapi', async () => {
    const response = await call({ ...valid, passwordConfirmation: 'nope' });
    expect(response.status).toBe(422);
    expect((await response.json()).fieldErrors).toEqual({
      passwordConfirmation: ['passwordMismatch'],
    });
    expect(strapiAuth).not.toHaveBeenCalled();
  });

  it('forwards the password with the session token', async () => {
    vi.mocked(strapiAuth).mockResolvedValueOnce({ ok: true });
    const response = await call(valid);
    expect(response.status).toBe(200);
    expect(vi.mocked(strapiAuth).mock.calls[0]).toEqual([
      '/auth/set-password',
      expect.objectContaining({ jwt: 'good.jwt', body: valid }),
    ]);
  });

  it('maps a second attempt to 409 ALREADY_SET', async () => {
    vi.mocked(strapiAuth).mockRejectedValueOnce(
      new StrapiError(409, 'ConflictError', 'Password already set'),
    );
    const response = await call(valid);
    expect(response.status).toBe(409);
    expect((await response.json()).code).toBe('ALREADY_SET');
  });
});
