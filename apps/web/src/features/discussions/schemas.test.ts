import { describe, expect, it } from 'vitest';

import { discussionFiltersSchema, discussionQuerySchema } from './schemas';

describe('discussionFiltersSchema', () => {
  it('applies the defaults', () => {
    expect(discussionFiltersSchema.parse({})).toEqual({ sort: 'newest', page: 1, pageSize: 10 });
  });

  it('refuses an unknown sort and a page under 1', () => {
    expect(discussionFiltersSchema.safeParse({ sort: 'hot' }).success).toBe(false);
    expect(discussionFiltersSchema.safeParse({ page: 0 }).success).toBe(false);
    expect(discussionFiltersSchema.safeParse({ page: 'abc' }).success).toBe(false);
  });

  it('coerces the page number from the query string and caps pageSize at 50', () => {
    expect(discussionFiltersSchema.parse({ page: '3' }).page).toBe(3);
    expect(discussionFiltersSchema.safeParse({ pageSize: '100' }).success).toBe(false);
    expect(discussionFiltersSchema.parse({ pageSize: '50' }).pageSize).toBe(50);
  });

  it('trims the search text and drops it when empty', () => {
    expect(discussionFiltersSchema.parse({ q: '  per  ' }).q).toBe('per');
    expect(discussionFiltersSchema.parse({ q: '   ' }).q).toBeUndefined();
    expect(discussionFiltersSchema.safeParse({ q: 'x'.repeat(81) }).success).toBe(false);
  });

  it('defaults the locale to French for the BFF', () => {
    expect(discussionQuerySchema.parse({}).locale).toBe('fr');
    expect(discussionQuerySchema.safeParse({ locale: 'de' }).success).toBe(false);
  });
});
