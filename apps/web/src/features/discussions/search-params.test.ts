import { describe, expect, it } from 'vitest';

import { loadDiscussionFilters, serializeFilters, toFilters } from './search-params';

describe('loadDiscussionFilters', () => {
  it('reads the URL and falls back to defaults for anything unexpected', async () => {
    const filters = await loadDiscussionFilters(
      Promise.resolve({ category: 'bourse', sort: 'hot', q: 'etf', page: 'abc' }),
    );
    expect(filters).toEqual({
      category: 'bourse',
      sort: 'newest',
      q: 'etf',
      page: 1,
      pageSize: 10,
    });
  });

  it('treats page 0 and negative pages as page 1', async () => {
    expect((await loadDiscussionFilters(Promise.resolve({ page: '0' }))).page).toBe(1);
    expect((await loadDiscussionFilters(Promise.resolve({ page: '-4' }))).page).toBe(1);
  });
});

describe('serializeFilters', () => {
  it('omits the defaults so URLs stay clean (clearOnDefault)', () => {
    expect(serializeFilters({ sort: 'newest', page: 1, pageSize: 10, q: '' })).toBe('');
    expect(serializeFilters({ category: 'bourse', sort: 'oldest', q: 'etf', page: 2 })).toBe(
      'category=bourse&sort=oldest&q=etf&page=2',
    );
  });

  it('round-trips with the loader', async () => {
    const original = toFilters({ category: 'retraite', sort: 'oldest', q: 'per', page: 3 });
    const query = Object.fromEntries(new URLSearchParams(serializeFilters(original)));
    expect(await loadDiscussionFilters(Promise.resolve(query))).toEqual(original);
  });
});
