import { describe, expect, it } from 'vitest';

import { collectionTag, entryTag, tagsForEvent } from './tags';

describe('cache tags', () => {
  it('names a collection and one entry', () => {
    expect(collectionTag('discussions')).toBe('strapi:discussions');
    expect(entryTag('discussions', 'abc')).toBe('strapi:discussions:abc');
  });

  it('maps a webhook event to its tags, and ignores unknown content types', () => {
    expect(tagsForEvent('api::reply.reply', 'r1')).toEqual(['strapi:replies', 'strapi:replies:r1']);
    expect(tagsForEvent('api::category.category', undefined)).toEqual(['strapi:categories']);
    expect(tagsForEvent('plugin::upload.file', 'x')).toBeNull();
  });
});
