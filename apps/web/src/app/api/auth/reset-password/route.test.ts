// @vitest-environment node
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

import { POST as forgot } from '../forgot-password/route';
import { POST as reset } from './route';

const post = (handler: typeof reset, path: string, body: unknown) =>
  handler(
    new NextRequest(`http://web.test${path}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'sec-fetch-site': 'same-origin' },
      body: JSON.stringify(body),
    }),
  );
const code = 'a'.repeat(128);

describe('POST /api/auth/forgot-password', () => {
  it('answers 200 whatever Strapi finds, and refuses a malformed email', async () => {
    vi.mocked(strapiFetch).mockResolvedValueOnce({ ok: true });
    expect(
      (await post(forgot, '/api/auth/forgot-password', { email: 'alice@demo.lerevenu.test' }))
        .status,
    ).toBe(200);
    expect((await post(forgot, '/api/auth/forgot-password', { email: 'nope' })).status).toBe(422);
  });
});

describe('POST /api/auth/reset-password', () => {
  it('logs the reader in with the new password', async () => {
    vi.mocked(strapiFetch).mockResolvedValueOnce({
      jwt: 'fresh.jwt',
      user: { id: 3, documentId: 'u3', username: 'camille', email: 'camille.b@demo.lerevenu.test' },
    });
    const response = await post(reset, '/api/auth/reset-password', {
      code,
      password: 'NouveauMdp2026!',
      passwordConfirmation: 'NouveauMdp2026!',
    });
    expect(response.status).toBe(200);
    expect(response.headers.get('set-cookie')).toContain('lr_session=fresh.jwt');
    expect((await response.json()).user.username).toBe('camille');
  });

  it('refuses a mismatched confirmation before calling Strapi, and maps a bad code to INVALID_CODE', async () => {
    const mismatch = await post(reset, '/api/auth/reset-password', {
      code,
      password: 'NouveauMdp2026!',
      passwordConfirmation: 'other',
    });
    expect(mismatch.status).toBe(422);
    expect(Object.keys((await mismatch.json()).fieldErrors)).toEqual(['passwordConfirmation']);
    expect(strapiFetch).not.toHaveBeenCalled();

    vi.mocked(strapiFetch).mockRejectedValueOnce(
      new StrapiError(400, 'ValidationError', 'Incorrect code provided'),
    );
    const bad = await post(reset, '/api/auth/reset-password', {
      code,
      password: 'NouveauMdp2026!',
      passwordConfirmation: 'NouveauMdp2026!',
    });
    expect(bad.status).toBe(400);
    expect((await bad.json()).code).toBe('INVALID_CODE');
    expect(bad.headers.get('set-cookie')).toBeNull();
  });
});
