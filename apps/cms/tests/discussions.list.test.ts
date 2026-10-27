/** Brief rule: list with title, author, category, reply count; filter, sort, paginate; read by slug. */
import { describe, expect, it } from 'vitest';

import { api, hasKeyDeep } from './helpers/api';

const LIST_ITEM_KEYS = [
  'documentId',
  'title',
  'slug',
  'content',
  'type',
  'createdAt',
  'updatedAt',
  'publishedAt',
  'author',
  'category',
  'replies',
].sort();

interface ListItem {
  createdAt: string;
  slug: string;
  author: Record<string, unknown>;
  category: Record<string, unknown>;
  replies: { count: number };
}

const list = (query = '') => api().get(`/api/discussions${query}`).expect(200);

describe('GET /api/discussions', () => {
  it('exposes exactly the list keys, a picked author, a picked category and a reply count', async () => {
    const res = await list('?pagination[pageSize]=3');
    const items = res.body.data as ListItem[];
    expect(items.length).toBe(3);
    for (const item of items) {
      expect(Object.keys(item).sort()).toEqual(LIST_ITEM_KEYS);
      expect(Object.keys(item.author).sort()).toEqual([
        'avatarUrl',
        'displayName',
        'documentId',
        'username',
      ]);
      expect(Object.keys(item.category).sort()).toEqual(['color', 'documentId', 'name', 'slug']);
      expect(item.replies).toEqual({ count: expect.any(Number) });
    }
  });

  it('never exposes a numeric id or an email', async () => {
    const res = await list('?pagination[pageSize]=50');
    expect(hasKeyDeep(res.body, 'id')).toBe(false);
    expect(hasKeyDeep(res.body, 'email')).toBe(false);
  });

  it('sorts newest first by default and oldest first on request', async () => {
    const newest = (await list()).body.data as ListItem[];
    const oldest = (await list('?sort=createdAt:asc')).body.data as ListItem[];
    expect(
      isSorted(
        newest.map((d) => d.createdAt),
        'desc',
      ),
    ).toBe(true);
    expect(
      isSorted(
        oldest.map((d) => d.createdAt),
        'asc',
      ),
    ).toBe(true);
  });

  it('paginates from the backend and caps pageSize at 50', async () => {
    const two = await list('?pagination[page]=2&pagination[pageSize]=2');
    expect(two.body.data).toHaveLength(2);
    expect(two.body.meta.pagination).toMatchObject({ page: 2, pageSize: 2 });
    expect(two.body.meta.pagination.total).toBeGreaterThanOrEqual(18);

    const capped = await list('?pagination[pageSize]=100');
    expect(capped.body.meta.pagination.pageSize).toBe(50);
  });

  it('filters by category slug', async () => {
    const res = await list('?filters[category][slug][$eq]=bourse');
    const items = res.body.data as ListItem[];
    expect(items.length).toBeGreaterThan(0);
    expect(items.every((d) => d.category.slug === 'bourse')).toBe(true);
  });

  it('refuses a filter on the author relation (readers cannot read users)', async () => {
    await api().get('/api/discussions?filters[author][username][$eq]=alice').expect(400);
  });
});

describe('GET /api/discussions/slug/:slug', () => {
  it('returns the discussion with its content and replies in chronological order', async () => {
    const items = (await list('?pagination[pageSize]=50')).body.data as ListItem[];
    const withReplies = items.find((d) => d.replies.count >= 2);
    expect(withReplies).toBeDefined();

    const res = await api().get(`/api/discussions/slug/${withReplies!.slug}`).expect(200);
    const detail = res.body.data;
    expect(detail.content).toEqual(expect.any(String));
    expect(detail.replies).toHaveLength(withReplies!.replies.count);
    expect(
      isSorted(
        detail.replies.map((r: { createdAt: string }) => r.createdAt),
        'asc',
      ),
    ).toBe(true);
    for (const reply of detail.replies) {
      expect(Object.keys(reply.author).sort()).toEqual([
        'avatarUrl',
        'displayName',
        'documentId',
        'username',
      ]);
    }
    expect(hasKeyDeep(res.body, 'id')).toBe(false);
    expect(hasKeyDeep(res.body, 'email')).toBe(false);
  });

  it('answers 404 for an unknown slug', async () => {
    await api().get('/api/discussions/slug/does-not-exist').expect(404);
  });
});

function isSorted(values: string[], direction: 'asc' | 'desc'): boolean {
  return values.every(
    (value, i) =>
      i === 0 || (direction === 'asc' ? values[i - 1] <= value : values[i - 1] >= value),
  );
}
