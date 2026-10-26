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
vi.mock('@/config/env', () => ({ env: { STRAPI_URL: 'http://strapi.test' } }));

import { getDiscussions } from '@/features/discussions/data';

import { GET } from './route';

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
