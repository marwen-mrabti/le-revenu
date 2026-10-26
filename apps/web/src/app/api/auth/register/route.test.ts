// @vitest-environment node
// Route handlers and guards read Cookie, Origin and Sec-Fetch-Site: a browser-like Request drops those headers.
import { NextRequest } from 'next/server';
import { describe, expect, it, vi } from 'vitest';

import type * as StrapiBase from '@/lib/strapi/base';
import { StrapiError } from '@/lib/strapi/base';

vi.mock('@/config/env', () => ({
  env: { AUTH_COOKIE_NAME: 'lr_session', STRAPI_URL: 'http://strapi.test' },
}));
vi.mock('@/lib/strapi/base', async (importOriginal) => ({
  ...(await importOriginal<typeof StrapiBase>()),
  strapiFetch: vi.fn(),
}));

import { strapiFetch } from '@/lib/strapi/base';

import { POST } from './route';

const account = { username: 'claire', email: 'Claire@exemple.fr', password: 'Password123!' };
const register = (body: unknown) =>
  POST(
    new NextRequest('http://web.test/api/auth/register', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'sec-fetch-site': 'same-origin' },
      body: JSON.stringify(body),
    }),
  );

describe('POST /api/auth/register', () => {
  it('creates the account, logs it in and sends Strapi a lowercase email', async () => {
    vi.mocked(strapiFetch).mockResolvedValueOnce({
      jwt: 'new.jwt',
      user: { documentId: 'u9', username: 'claire', email: 'claire@exemple.fr' },
    });
    const response = await register(account);
    expect(response.status).toBe(201);
    expect(response.headers.get('set-cookie')).toContain('lr_session=new.jwt');
    expect(vi.mocked(strapiFetch).mock.calls[0]?.[1]).toMatchObject({
      body: { username: 'claire', email: 'claire@exemple.fr', password: 'Password123!' },
    });
  });

  it('maps a taken email or username to 409 on the email field', async () => {
    vi.mocked(strapiFetch).mockRejectedValueOnce(
      new StrapiError(400, 'ApplicationError', 'Email or Username are already taken'),
    );
    const response = await register(account);
    expect(response.status).toBe(409);
    const body = await response.json();
    expect(body.code).toBe('ALREADY_TAKEN');
    expect(body.fieldErrors).toEqual({ email: ['alreadyTaken'] });
  });

  it('refuses a weak password before calling Strapi', async () => {
    const response = await register({ ...account, password: 'short' });
    expect(response.status).toBe(422);
    expect(strapiFetch).not.toHaveBeenCalled();
  });
});
