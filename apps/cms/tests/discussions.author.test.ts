/** Brief rule: the author is the logged-in reader, whatever the body says. Same for the slug. */
import { beforeAll, describe, expect, it } from 'vitest';

import { api, bearer, createDiscussion, firstCategoryId, session } from './helpers/api';

describe('author and slug are owned by the server', () => {
  let category: string;

  beforeAll(async () => {
    category = await firstCategoryId();
  });

  it('ignores data.author and data.slug on create', async () => {
    const alice = session('alice');
    const row = await createDiscussion(alice, category, {
      title: 'Alice tente de poster au nom de Bob',
      author: session('bob').documentId,
      slug: 'hack',
    });
    expect(row.author).toEqual({ documentId: alice.documentId, username: 'alice' });
    expect(row.slug).toBe('alice-tente-de-poster-au-nom-de-bob');
  });

  it('keeps the author and the slug on update', async () => {
    const alice = session('alice');
    const row = await createDiscussion(alice, category, {
      title: 'Titre original de la discussion',
    });
    const res = await api()
      .put(`/api/discussions/${row.documentId}`)
      .set(bearer(alice))
      .send({
        data: { title: 'Titre modifie par Alice', author: session('bob').documentId, slug: 'x' },
      })
      .expect(200);
    expect(res.body.data.title).toBe('Titre modifie par Alice');
    expect(res.body.data.slug).toBe(row.slug);

    const detail = await api().get(`/api/discussions/slug/${row.slug}`).expect(200);
    expect(detail.body.data.author.username).toBe('alice');
  });

  it('suffixes the slug when the title is already used', async () => {
    const title = 'Deux discussions avec le meme titre';
    const first = await createDiscussion(session('alice'), category, { title });
    const second = await createDiscussion(session('bob'), category, { title });
    expect(second.slug).toBe(`${first.slug}-2`);
  });
});
