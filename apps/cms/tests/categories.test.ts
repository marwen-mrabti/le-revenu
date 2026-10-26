/** Categories are localised: French by default, English on request, same identity in both. */
import { describe, expect, it } from 'vitest';

import { api, hasKeyDeep } from './helpers/api';

interface Category {
  documentId: string;
  name: string;
  slug: string;
  locale: string;
}

/** The default page holds 10 items and there are 11 categories: ask for the whole list. */
const categories = async (query = ''): Promise<Category[]> =>
  (await api().get(`/api/categories?pagination[pageSize]=50${query}`).expect(200)).body.data;

describe('GET /api/categories', () => {
  it('returns the 11 seeded categories in French by default', async () => {
    const fr = await categories();
    expect(fr).toHaveLength(11);
    expect(fr.every((c) => c.locale === 'fr')).toBe(true);
    expect(fr.find((c) => c.slug === 'bourse')?.name).toBe('Bourse & actions');
  });

  it('returns English names with ?locale=en, same documentId and slug as French', async () => {
    const fr = await categories();
    const en = await categories('&locale=en');
    expect(en).toHaveLength(fr.length);
    expect(en.find((c) => c.slug === 'bourse')?.name).toBe('Stocks & markets');
    for (const category of en) {
      const french = fr.find((c) => c.documentId === category.documentId);
      expect(french?.slug).toBe(category.slug);
    }
  });

  it('never exposes a numeric id', async () => {
    const res = await api().get('/api/categories?locale=en').expect(200);
    expect(hasKeyDeep(res.body, 'id')).toBe(false);
  });
});
