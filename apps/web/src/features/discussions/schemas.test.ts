import { discussionDetailSchema, describe, expect, it } from 'vitest';

import { discussionDetailSchema, discussionFiltersSchema, discussionQuerySchema } from './schemas';

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

describe('discussionDetailSchema', () => {
  it('accepts the detail populate: replies in place of the count', () => {
    const detail = discussionDetailSchema.parse({
      documentId: 'd1',
      title: 'Titre assez long',
      slug: 'titre-assez-long',
      content: 'Contenu',
      type: 'discussion',
      createdAt: '2026-10-25T10:00:00Z',
      updatedAt: '2026-10-25T10:00:00Z',
      author: { documentId: 'u1', username: 'alice' },
      category: { documentId: 'c1', name: 'Bourse', slug: 'bourse', color: '#eb0f0f' },
      replies: [
        {
          documentId: 'r1',
          content: 'Oui',
          createdAt: '2026-10-25T11:00:00Z',
          updatedAt: '2026-10-25T11:00:00Z',
          author: null,
        },
      ],
    });
    expect(detail.replies[0]?.author).toBeNull();
    expect(() => discussionDetailSchema.parse({ ...detail, replies: { count: 1 } })).toThrow();
  });
});
