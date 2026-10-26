// @vitest-environment node
// Route handlers and guards read Cookie, Origin and Sec-Fetch-Site: a browser-like Request drops those headers.
import { NextRequest } from 'next/server';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@/config/env', () => ({
  env: { AUTH_COOKIE_NAME: 'lr_session', STRAPI_URL: 'http://strapi.test' },
}));
vi.mock('@/lib/strapi/private', () => ({ strapiAuth: vi.fn() }));

import { strapiAuth } from '@/lib/strapi/private';

import { POST } from './route';

const exchange = (body: unknown) =>
  POST(
    new NextRequest('http://web.test/api/auth/session', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'sec-fetch-site': 'same-origin' },
      body: JSON.stringify(body),
    }),
  );

describe('POST /api/auth/session', () => {
  it('turns a token Strapi confirms into a session cookie', async () => {
    vi.mocked(strapiAuth).mockResolvedValueOnce({
      documentId: 'g1',
      username: 'claire',
      email: 'claire@gmail.com',
    });
    const response = await exchange({ jwt: 'a'.repeat(40) });
    expect(response.status).toBe(200);
    expect(response.headers.get('set-cookie')).toContain(`lr_session=${'a'.repeat(40)}`);
    expect((await response.json()).user.username).toBe('claire');
  });

  it('refuses a token Strapi rejects, no cookie set', async () => {
    vi.mocked(strapiAuth).mockRejectedValueOnce(new Error('401'));
    const response = await exchange({ jwt: 'b'.repeat(40) });
    expect(response.status).toBe(401);
    expect(response.headers.get('set-cookie')).toBeNull();
  });

  it('refuses a malformed body with 422', async () => {
    const response = await exchange({ jwt: 'short' });
    expect(response.status).toBe(422);
    expect(strapiAuth).not.toHaveBeenCalled();
  });
});
