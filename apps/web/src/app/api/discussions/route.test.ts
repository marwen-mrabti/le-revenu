// @vitest-environment node
// Route handlers and guards read Cookie, Origin and Sec-Fetch-Site: a browser-like Request drops those headers.
import { NextRequest } from 'next/server';
import type * as NextServer from 'next/server';
import { describe, expect, it, vi } from 'vitest';

import { StrapiError } from '@/lib/strapi/base';

vi.mock('@/features/discussions/data', () => ({ getDiscussions: vi.fn() }));
// `connection()` only resolves inside a Next request scope; the handler is called directly here.
vi.mock('next/server', async (importOriginal) => ({
  ...(await importOriginal<typeof NextServer>()),
  connection: vi.fn().mockResolvedValue(undefined),
}));
vi.mock('@/config/env', () => ({
  env: { AUTH_COOKIE_NAME: 'lr_session', STRAPI_URL: 'http://strapi.test' },
}));
vi.mock('@/lib/strapi/private', () => ({ strapiAuth: vi.fn() }));

import { getDiscussions } from '@/features/discussions/data';
import { strapiAuth } from '@/lib/strapi/private';

import { GET, POST } from './route';

const page = {
  items: [],
  pagination: { page: 1, pageSize: 10, pageCount: 0, total: 0 },
};

describe('GET /api/discussions', () => {
  it('answers 422 with the field name on an invalid sort', async () => {
    const response = await GET(new NextRequest('http://web.test/api/discussions?sort=hot'));
    expect(response.status).toBe(422);
    const body = await response.json();
    expect(body.code).toBe('VALIDATION');
    expect(Object.keys(body.fieldErrors)).toEqual(['sort']);
  });

  it('parses the query, passes the locale and returns the page without caching', async () => {
    vi.mocked(getDiscussions).mockResolvedValueOnce(page);
    const response = await GET(
      new NextRequest('http://web.test/api/discussions?category=bourse&page=2&locale=en'),
    );
    expect(response.status).toBe(200);
    expect(response.headers.get('cache-control')).toBe('no-store');
    expect(getDiscussions).toHaveBeenCalledWith(
      { category: 'bourse', sort: 'newest', q: undefined, page: 2, pageSize: 10 },
      'en',
    );
    expect(await response.json()).toEqual(page);
  });

  it('maps an unreachable Strapi to 503 without echoing its message', async () => {
    vi.mocked(getDiscussions).mockRejectedValueOnce(
      new StrapiError(503, 'UNAVAILABLE', 'ECONNREFUSED 127.0.0.1:1337'),
    );
    const response = await GET(new NextRequest('http://web.test/api/discussions'));
    expect(response.status).toBe(503);
    const body = await response.json();
    expect(body.code).toBe('UNAVAILABLE');
    expect(body.message).not.toContain('1337');
  });
});

const valid = {
  type: 'question',
  title: 'Faut-il ouvrir un PER à 45 ans ?',
  content: 'Contexte.',
  category: 'c1',
};
const post = (body: unknown, cookie = 'lr_session=good.jwt') =>
  POST(
    new NextRequest('http://web.test/api/discussions', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'sec-fetch-site': 'same-origin', cookie },
      body: JSON.stringify(body),
    }),
  );

describe('POST /api/discussions', () => {
  it('needs a session and applies the brief rules before calling Strapi', async () => {
    expect((await post(valid, '')).status).toBe(401);
    const short = await post({ ...valid, title: 'Court' });
    expect(short.status).toBe(422);
    expect((await short.json()).fieldErrors).toEqual({ title: ['titleMin'] });
    const noSpace = await post({ ...valid, category: '' });
    expect((await noSpace.json()).fieldErrors).toEqual({ category: ['categoryRequired'] });
    expect(strapiAuth).not.toHaveBeenCalled();
  });

  it('creates with the session token and answers the item', async () => {
    vi.mocked(strapiAuth).mockResolvedValueOnce({
      data: {
        documentId: 'd9',
        title: valid.title,
        slug: 'faut-il-ouvrir-un-per',
        content: 'Contexte.',
        type: 'question',
        createdAt: '',
        updatedAt: '',
        author: null,
        category: null,
        replies: { count: 0 },
      },
    });
    const response = await post(valid);
    expect(response.status).toBe(201);
    expect((await response.json()).discussion.slug).toBe('faut-il-ouvrir-un-per');
    expect(vi.mocked(strapiAuth).mock.calls[0]).toEqual([
      '/discussions',
      expect.objectContaining({ jwt: 'good.jwt', body: { data: valid } }),
    ]);
  });

  it('turns an unknown space into a field error', async () => {
    vi.mocked(strapiAuth).mockRejectedValueOnce(new StrapiError(404, 'NotFoundError', 'Not Found'));
    const response = await post(valid);
    expect(response.status).toBe(422);
    expect((await response.json()).fieldErrors).toEqual({ category: ['categoryUnknown'] });
  });
});
