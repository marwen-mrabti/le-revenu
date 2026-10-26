import { afterEach, describe, expect, it, vi } from 'vitest';
import { z } from 'zod';

vi.mock('@/config/env', () => ({ env: { STRAPI_URL: 'http://strapi.test' } }));

import type { StrapiError } from './base';
import { strapiFetch } from './base';

const itemSchema = z.object({ data: z.array(z.object({ documentId: z.string() })) });

function mockFetch(status: number, body: unknown) {
  const response = new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
  return vi.spyOn(globalThis, 'fetch').mockResolvedValue(response);
}

describe('strapiFetch', () => {
  afterEach(() => vi.restoreAllMocks());

  it('builds the URL with a Strapi-style query string and parses the answer', async () => {
    const spy = mockFetch(200, { data: [{ documentId: 'abc' }] });
    const result = await strapiFetch('/discussions', {
      schema: itemSchema,
      query: { filters: { category: { slug: { $eq: 'bourse' } } }, pagination: { pageSize: 2 } },
    });
    expect(result.data[0]?.documentId).toBe('abc');
    const [url] = spy.mock.calls[0] as [string];
    expect(url).toBe(
      'http://strapi.test/api/discussions?filters[category][slug][$eq]=bourse&pagination[pageSize]=2',
    );
  });

  it('turns a Strapi error envelope into a StrapiError', async () => {
    mockFetch(404, {
      data: null,
      error: { status: 404, name: 'NotFoundError', message: 'Discussion not found', details: {} },
    });
    await expect(
      strapiFetch('/discussions/slug/nope', { schema: itemSchema }),
    ).rejects.toMatchObject({ status: 404, code: 'NotFoundError' } satisfies Partial<StrapiError>);
  });

  it('refuses an answer that does not match the schema', async () => {
    mockFetch(200, { data: [{ id: 1 }] });
    await expect(strapiFetch('/discussions', { schema: itemSchema })).rejects.toMatchObject({
      status: 502,
      code: 'INVALID_RESPONSE',
    });
  });

  it('reports an unreachable Strapi as 503', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new TypeError('fetch failed'));
    await expect(strapiFetch('/discussions', { schema: itemSchema })).rejects.toMatchObject({
      status: 503,
      code: 'UNAVAILABLE',
    });
  });
});
