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

const strapiUser = {
  documentId: 'u1',
  username: 'alice',
  email: 'alice@demo.lerevenu.test',
  id: 41,
};
const login = (body: unknown, headers: Record<string, string> = {}) =>
  POST(
    new NextRequest('http://web.test/api/auth/login', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'sec-fetch-site': 'same-origin', ...headers },
      body: JSON.stringify(body),
    }),
  );

describe('POST /api/auth/login', () => {
  it('sets the session cookie and answers the user without the token', async () => {
    vi.mocked(strapiFetch).mockResolvedValueOnce({ jwt: 'secret.jwt', user: strapiUser });
    const response = await login({ identifier: 'alice', password: 'Password123!' });
    expect(response.status).toBe(200);
    expect(response.headers.get('set-cookie')).toMatch(
      /^lr_session=secret\.jwt; .*HttpOnly; SameSite=Lax/,
    );
    const body = await response.json();
    expect(body).toEqual({
      user: { documentId: 'u1', username: 'alice', email: 'alice@demo.lerevenu.test' },
    });
    expect(JSON.stringify(body)).not.toContain('secret.jwt');
  });

  it('maps a wrong password to 401 INVALID_CREDENTIALS', async () => {
    vi.mocked(strapiFetch).mockRejectedValueOnce(
      new StrapiError(400, 'ValidationError', 'Invalid identifier or password'),
    );
    const response = await login({ identifier: 'alice', password: 'nope' });
    expect(response.status).toBe(401);
    expect((await response.json()).code).toBe('INVALID_CREDENTIALS');
    expect(response.headers.get('set-cookie')).toBeNull();
  });

  it('relays the rate limit as 429', async () => {
    vi.mocked(strapiFetch).mockRejectedValueOnce(
      new StrapiError(429, 'RateLimitError', 'Too many requests'),
    );
    const response = await login({ identifier: 'alice', password: 'nope' });
    expect(response.status).toBe(429);
    expect((await response.json()).code).toBe('RATE_LIMITED');
  });

  it('refuses a cross-site request and a non-JSON body before calling Strapi', async () => {
    const cross = await login({}, { 'sec-fetch-site': 'cross-site' });
    expect(cross.status).toBe(403);
    const form = await login({}, { 'content-type': 'text/plain' });
    expect(form.status).toBe(415);
    expect(strapiFetch).not.toHaveBeenCalled();
  });

  it('answers 422 with the field on an empty password', async () => {
    const response = await login({ identifier: 'alice', password: '' });
    expect(response.status).toBe(422);
    expect(Object.keys((await response.json()).fieldErrors)).toEqual(['password']);
  });
});
