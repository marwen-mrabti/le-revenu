// @vitest-environment node
import { NextRequest } from 'next/server';
import { describe, expect, it, vi } from 'vitest';

import { StrapiError } from '@/lib/strapi/base';

vi.mock('@/config/env', () => ({
  env: { AUTH_COOKIE_NAME: 'lr_session', STRAPI_URL: 'http://strapi.test' },
}));
vi.mock('@/lib/strapi/private', () => ({ strapiAuth: vi.fn() }));

import { strapiAuth } from '@/lib/strapi/private';

import { DELETE, PATCH } from './route';
import { POST as changePassword } from '../auth/change-password/route';

const me = {
  id: 41,
  documentId: 'u1',
  username: 'alice',
  email: 'alice@demo.lerevenu.test',
  provider: 'local',
};
const call = (
  handler: typeof PATCH,
  method: string,
  body: unknown,
  cookie = 'lr_session=good.jwt',
) =>
  handler(
    new NextRequest('http://web.test/api/account', {
      method,
      headers: { 'content-type': 'application/json', 'sec-fetch-site': 'same-origin', cookie },
      body: JSON.stringify(body),
    }),
  );

describe('PATCH /api/account', () => {
  it('updates the own record through Strapi with the session id, nothing else', async () => {
    vi.mocked(strapiAuth).mockResolvedValueOnce(me);
    vi.mocked(strapiAuth).mockResolvedValueOnce({ ...me, displayName: 'Alice Durand' });
    const response = await call(PATCH, 'PATCH', {
      username: 'alice',
      displayName: 'Alice Durand',
      role: 1,
    });
    expect(response.status).toBe(200);
    expect((await response.json()).user.displayName).toBe('Alice Durand');
    const [path, options] = vi.mocked(strapiAuth).mock.calls[1] as [
      string,
      { body: unknown; init: unknown },
    ];
    expect(path).toBe('/users/41');
    expect(options.body).toEqual({ username: 'alice', displayName: 'Alice Durand' });
    expect(options.init).toEqual({ method: 'PUT' });
  });

  it('answers 401 without a session and 409 on a taken username', async () => {
    expect((await call(PATCH, 'PATCH', { username: 'x', displayName: '' }, '')).status).toBe(401);
    vi.mocked(strapiAuth).mockResolvedValueOnce(me);
    vi.mocked(strapiAuth).mockRejectedValueOnce(
      new StrapiError(400, 'ApplicationError', 'Username already taken'),
    );
    const taken = await call(PATCH, 'PATCH', { username: 'bob', displayName: '' });
    expect(taken.status).toBe(409);
    expect((await taken.json()).fieldErrors).toEqual({ username: ['alreadyTaken'] });
  });
});

describe('DELETE /api/account', () => {
  it('needs the exact username, then deletes and clears the cookie', async () => {
    vi.mocked(strapiAuth).mockResolvedValueOnce(me);
    const wrong = await call(DELETE, 'DELETE', { username: 'alicia' });
    expect(wrong.status).toBe(422);

    vi.mocked(strapiAuth).mockResolvedValueOnce(me);
    vi.mocked(strapiAuth).mockResolvedValueOnce(me);
    const response = await call(DELETE, 'DELETE', { username: 'alice' });
    expect(response.status).toBe(204);
    expect(response.headers.get('set-cookie')).toContain('Max-Age=0');
    expect(vi.mocked(strapiAuth).mock.calls.at(-1)?.[0]).toBe('/users/41');
  });
});

describe('POST /api/auth/change-password', () => {
  it('rotates the cookie on success and maps a wrong current password', async () => {
    vi.mocked(strapiAuth).mockResolvedValueOnce({ jwt: 'rotated.jwt', user: me });
    const ok = await call(changePassword, 'POST', {
      currentPassword: 'Password123!',
      password: 'NouveauMdp2026!',
      passwordConfirmation: 'NouveauMdp2026!',
    });
    expect(ok.status).toBe(200);
    expect(ok.headers.get('set-cookie')).toContain('lr_session=rotated.jwt');

    vi.mocked(strapiAuth).mockRejectedValueOnce(
      new StrapiError(400, 'ValidationError', 'The provided current password is invalid'),
    );
    const wrong = await call(changePassword, 'POST', {
      currentPassword: 'nope',
      password: 'NouveauMdp2026!',
      passwordConfirmation: 'NouveauMdp2026!',
    });
    expect(wrong.status).toBe(401);
    expect((await wrong.json()).fieldErrors).toEqual({ currentPassword: ['currentPasswordWrong'] });
  });
});
