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

import { DELETE, PATCH } from './route';

const params = Promise.resolve({ documentId: 'r1' });
const headers = {
  'content-type': 'application/json',
  'sec-fetch-site': 'same-origin',
  cookie: 'lr_session=good.jwt',
};
const reply = { documentId: 'r1', content: 'Corrigé.', createdAt: '', updatedAt: '', author: null };

describe('PATCH and DELETE /api/replies/[documentId]', () => {
  it('edits with the session token and expires the discussion', async () => {
    vi.mocked(strapiAuth).mockResolvedValueOnce({ data: reply });
    const request = new NextRequest('http://web.test/api/replies/r1', {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ content: 'Corrigé.', discussion: 'd1' }),
    });
    const response = await PATCH(request, { params });
    expect(response.status).toBe(200);
    expect(vi.mocked(strapiAuth).mock.calls[0]).toEqual([
      '/replies/r1',
      expect.objectContaining({
        jwt: 'good.jwt',
        body: { data: { content: 'Corrigé.' } },
        init: { method: 'PUT' },
      }),
    ]);
    expect(revalidateTag).toHaveBeenCalledWith('strapi:discussions:d1', { expire: 0 });
  });

  it('passes Strapi 403 through as FORBIDDEN (not the author)', async () => {
    vi.mocked(strapiAuth).mockRejectedValueOnce(
      new StrapiError(403, 'ForbiddenError', 'Forbidden'),
    );
    const request = new NextRequest('http://web.test/api/replies/r1', {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ content: 'Corrigé.', discussion: 'd1' }),
    });
    const response = await PATCH(request, { params });
    expect(response.status).toBe(403);
    expect((await response.json()).code).toBe('FORBIDDEN');
    expect(revalidateTag).not.toHaveBeenCalled();
  });

  it('deletes with the discussion named in the query, and needs a session', async () => {
    vi.mocked(strapiAuth).mockResolvedValueOnce(undefined);
    const request = new NextRequest('http://web.test/api/replies/r1?discussion=d1', {
      method: 'DELETE',
      headers,
    });
    expect((await DELETE(request, { params })).status).toBe(204);
    expect(vi.mocked(strapiAuth).mock.calls[0]?.[1]).toMatchObject({ init: { method: 'DELETE' } });
    expect(revalidateTag).toHaveBeenCalledWith('strapi:discussions:d1', { expire: 0 });

    const anonymous = new NextRequest('http://web.test/api/replies/r1?discussion=d1', {
      method: 'DELETE',
      headers: { 'sec-fetch-site': 'same-origin' },
    });
    expect((await DELETE(anonymous, { params })).status).toBe(401);
  });
});
