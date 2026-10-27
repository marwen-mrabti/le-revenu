// @vitest-environment node
import { NextRequest } from 'next/server';
import { describe, expect, it, vi } from 'vitest';

import { StrapiError } from '@/lib/strapi/base';

vi.mock('@/config/env', () => ({
  env: { AUTH_COOKIE_NAME: 'lr_session', STRAPI_URL: 'http://strapi.test' },
}));
vi.mock('@/lib/strapi/private', () => ({ strapiAuth: vi.fn() }));
vi.mock('next/cache', () => ({ revalidateTag: vi.fn() }));

import { revalidateTag } from 'next/cache';

import { strapiAuth } from '@/lib/strapi/private';

import { POST } from './route';

const reply = {
  documentId: 'r9',
  content: 'Le PEA, sans hésiter.',
  createdAt: '2026-10-27T10:00:00Z',
  updatedAt: '2026-10-27T10:00:00Z',
  author: { documentId: 'u1', username: 'alice' },
};
const post = (body: unknown, cookie = 'lr_session=good.jwt') =>
  POST(
    new NextRequest('http://web.test/api/replies', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'sec-fetch-site': 'same-origin', cookie },
      body: JSON.stringify(body),
    }),
  );

describe('POST /api/replies', () => {
  it('needs a session', async () => {
    expect((await post({ content: 'Bonjour', discussion: 'd1' }, '')).status).toBe(401);
    expect(strapiAuth).not.toHaveBeenCalled();
  });

  it('refuses a one-character reply before calling Strapi', async () => {
    const response = await post({ content: ' M ', discussion: 'd1' });
    expect(response.status).toBe(422);
    expect((await response.json()).fieldErrors).toEqual({ content: ['replyMin'] });
    expect(strapiAuth).not.toHaveBeenCalled();
  });

  it('creates the reply with the session token and expires the discussion', async () => {
    vi.mocked(strapiAuth).mockResolvedValueOnce({ data: reply });
    const response = await post({ content: 'Le PEA, sans hésiter.', discussion: 'd1' });
    expect(response.status).toBe(201);
    expect((await response.json()).reply.documentId).toBe('r9');
    expect(vi.mocked(strapiAuth).mock.calls[0]).toEqual([
      '/replies',
      expect.objectContaining({
        jwt: 'good.jwt',
        body: { data: { content: 'Le PEA, sans hésiter.', discussion: 'd1' } },
      }),
    ]);
    expect(revalidateTag).toHaveBeenCalledWith('strapi:discussions:d1', { expire: 0 });
  });

  it('maps a stale token to 401 and a gone discussion to 404', async () => {
    vi.mocked(strapiAuth).mockRejectedValueOnce(
      new StrapiError(403, 'ForbiddenError', 'Forbidden'),
    );
    expect((await post({ content: 'Bonjour', discussion: 'd1' })).status).toBe(401);
    vi.mocked(strapiAuth).mockRejectedValueOnce(new StrapiError(404, 'NotFoundError', 'Not Found'));
    const gone = await post({ content: 'Bonjour', discussion: 'd1' });
    expect(gone.status).toBe(404);
    expect((await gone.json()).code).toBe('NOT_FOUND');
    expect(revalidateTag).not.toHaveBeenCalled();
  });
});
