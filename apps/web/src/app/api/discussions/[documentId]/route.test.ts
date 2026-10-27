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

const params = Promise.resolve({ documentId: 'd1' });
const headers = {
  'content-type': 'application/json',
  'sec-fetch-site': 'same-origin',
  cookie: 'lr_session=good.jwt',
};
const item = {
  documentId: 'd1',
  title: 'Un titre assez long',
  slug: 'un-titre',
  content: 'Contenu',
  type: 'question',
  createdAt: '',
  updatedAt: '',
  author: null,
  category: null,
  replies: { count: 2 },
};

describe('PATCH and DELETE /api/discussions/[documentId]', () => {
  it('refuses a short title before calling Strapi', async () => {
    const request = new NextRequest('http://web.test/api/discussions/d1', {
      method: 'PATCH',
      headers,
      body: JSON.stringify({
        type: 'question',
        title: 'Court',
        content: 'Contenu',
        category: 'c1',
      }),
    });
    const response = await PATCH(request, { params });
    expect(response.status).toBe(422);
    expect((await response.json()).fieldErrors).toEqual({ title: ['titleMin'] });
    expect(strapiAuth).not.toHaveBeenCalled();
  });

  it('edits the four fields, then expires the entry and the collection', async () => {
    vi.mocked(strapiAuth).mockResolvedValueOnce({ data: item });
    const request = new NextRequest('http://web.test/api/discussions/d1', {
      method: 'PATCH',
      headers,
      body: JSON.stringify({
        type: 'question',
        title: 'Un titre assez long',
        content: 'Contenu',
        category: 'c1',
      }),
    });
    expect((await PATCH(request, { params })).status).toBe(200);
    expect(vi.mocked(strapiAuth).mock.calls[0]?.[1]).toMatchObject({
      body: {
        data: {
          type: 'question',
          title: 'Un titre assez long',
          content: 'Contenu',
          category: 'c1',
        },
      },
      init: { method: 'PUT' },
    });
    expect(revalidateTag).toHaveBeenCalledWith('strapi:discussions:d1', { expire: 0 });
    expect(revalidateTag).toHaveBeenCalledWith('strapi:discussions', { expire: 0 });
  });

  it('deletes, and maps a gone discussion to 404', async () => {
    vi.mocked(strapiAuth).mockResolvedValueOnce(undefined);
    const request = new NextRequest('http://web.test/api/discussions/d1', {
      method: 'DELETE',
      headers,
    });
    expect((await DELETE(request, { params })).status).toBe(204);
    vi.mocked(strapiAuth).mockRejectedValueOnce(new StrapiError(404, 'NotFoundError', 'Not Found'));
    const gone = await DELETE(
      new NextRequest('http://web.test/api/discussions/d1', { method: 'DELETE', headers }),
      { params },
    );
    expect(gone.status).toBe(404);
  });
});
