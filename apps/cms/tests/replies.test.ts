/** Brief rule: replies need a session, belong to the caller and to an existing discussion. */
import { beforeAll, describe, expect, it } from 'vitest';

import {
  api,
  bearer,
  createDiscussion,
  createReply,
  errorOf,
  firstCategoryId,
  invalidPaths,
  session,
  type DiscussionRow,
} from './helpers/api';

describe('POST /api/replies', () => {
  let discussion: DiscussionRow;

  beforeAll(async () => {
    discussion = await createDiscussion(session('alice'), await firstCategoryId(), {
      title: 'Discussion qui recoit des reponses',
    });
  });

  it('answers 403 without a token', async () => {
    await api()
      .post('/api/replies')
      .send({ data: { content: 'Sans session', discussion: discussion.documentId } })
      .expect(403);
  });

  it('ignores a spoofed author', async () => {
    const res = await api()
      .post('/api/replies')
      .set(bearer(session('bob')))
      .send({
        data: {
          content: 'Bob repond en se faisant passer pour Alice',
          discussion: discussion.documentId,
          author: session('alice').documentId,
        },
      })
      .expect(201);
    expect(res.body.data.author).toEqual({
      documentId: session('bob').documentId,
      username: 'bob',
    });
    expect(res.body.data).not.toHaveProperty('id');
  });

  it('answers 404 for an unknown discussion', async () => {
    const res = await api()
      .post('/api/replies')
      .set(bearer(session('bob')))
      .send({ data: { content: 'Vers nulle part', discussion: 'does-not-exist' } })
      .expect(404);
    expect(errorOf(res.body).name).toBe('NotFoundError');
  });

  it('rejects a one-character content', async () => {
    const res = await api()
      .post('/api/replies')
      .set(bearer(session('bob')))
      .send({ data: { content: 'x', discussion: discussion.documentId } })
      .expect(400);
    expect(invalidPaths(res.body)).toContain('content');
  });

  it('cannot move a reply to another discussion on update', async () => {
    const other = await createDiscussion(session('alice'), await firstCategoryId(), {
      title: 'Une autre discussion cible',
    });
    const reply = await createReply(session('bob'), discussion.documentId);
    await api()
      .put(`/api/replies/${reply.documentId}`)
      .set(bearer(session('bob')))
      .send({ data: { content: 'Contenu modifie', discussion: other.documentId } })
      .expect(200);

    const stillThere = await api()
      .get(`/api/replies?filters[discussion][documentId][$eq]=${discussion.documentId}`)
      .expect(200);
    const ids = (stillThere.body.data as Array<{ documentId: string }>).map((r) => r.documentId);
    expect(ids).toContain(reply.documentId);
  });
});
