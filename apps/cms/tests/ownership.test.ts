/** Brief rule: only the author edits or deletes; deleting a discussion removes its replies. */
import { beforeAll, describe, expect, it } from 'vitest';

import {
  api,
  bearer,
  createDiscussion,
  createReply,
  errorOf,
  firstCategoryId,
  session,
  type DiscussionRow,
} from './helpers/api';

describe('is-owner policy', () => {
  let category: string;
  let aliceDiscussion: DiscussionRow;
  let bobReply: { documentId: string };

  beforeAll(async () => {
    category = await firstCategoryId();
    aliceDiscussion = await createDiscussion(session('alice'), category, {
      title: 'Discussion appartenant a Alice',
    });
    bobReply = await createReply(session('bob'), aliceDiscussion.documentId);
  });

  it('refuses bob editing alice’s discussion with a PolicyError', async () => {
    const res = await api()
      .put(`/api/discussions/${aliceDiscussion.documentId}`)
      .set(bearer(session('bob')))
      .send({ data: { title: 'Bob modifie la discussion' } })
      .expect(403);
    expect(errorOf(res.body).name).toBe('PolicyError');
    expect(errorOf(res.body).details).toEqual({ policy: 'is-owner' });
  });

  it('refuses alice deleting bob’s reply', async () => {
    await api()
      .delete(`/api/replies/${bobReply.documentId}`)
      .set(bearer(session('alice')))
      .expect(403);
  });

  it('refuses an anonymous update', async () => {
    await api()
      .put(`/api/discussions/${aliceDiscussion.documentId}`)
      .send({ data: { title: 'Anonyme modifie la discussion' } })
      .expect(403);
  });

  it('lets alice edit her own discussion', async () => {
    const res = await api()
      .put(`/api/discussions/${aliceDiscussion.documentId}`)
      .set(bearer(session('alice')))
      .send({ data: { title: 'Alice modifie sa discussion' } })
      .expect(200);
    expect(res.body.data.title).toBe('Alice modifie sa discussion');
  });

  it('lets bob delete his own reply', async () => {
    await api()
      .delete(`/api/replies/${bobReply.documentId}`)
      .set(bearer(session('bob')))
      .expect(204);
  });

  it('deletes the replies with the discussion', async () => {
    const row = await createDiscussion(session('alice'), category, {
      title: 'Discussion a supprimer avec ses reponses',
    });
    await createReply(session('bob'), row.documentId, 'Premiere reponse');
    await createReply(session('alice'), row.documentId, 'Seconde reponse');
    const repliesQuery = `/api/replies?filters[discussion][documentId][$eq]=${row.documentId}`;
    expect((await api().get(repliesQuery).expect(200)).body.meta.pagination.total).toBe(2);

    await api()
      .delete(`/api/discussions/${row.documentId}`)
      .set(bearer(session('alice')))
      .expect(204);

    await api().get(`/api/discussions/slug/${row.slug}`).expect(404);
    expect((await api().get(repliesQuery).expect(200)).body.meta.pagination.total).toBe(0);
  });

  it('answers 404 for an unknown document', async () => {
    await api()
      .put('/api/discussions/does-not-exist')
      .set(bearer(session('alice')))
      .send({ data: { title: 'Un titre suffisamment long' } })
      .expect(404);
    await api()
      .delete('/api/replies/does-not-exist')
      .set(bearer(session('alice')))
      .expect(404);
  });
});
