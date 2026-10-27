/** A reader edits or deletes their own account only, and only the allowed fields. */
import { beforeAll, describe, expect, it } from 'vitest';

import {
  api,
  bearer,
  createDiscussion,
  errorOf,
  firstCategoryId,
  session,
  type Session,
} from './helpers/api';
import { execute } from './helpers/db';

async function idOf(who: Session): Promise<number> {
  const res = await api().get('/api/users/me').set(bearer(who)).expect(200);
  return res.body.id as number;
}

describe('is-self policy on PUT and DELETE /api/users/:id', () => {
  let aliceId: number;
  let bobId: number;

  beforeAll(async () => {
    [aliceId, bobId] = await Promise.all([idOf(session('alice')), idOf(session('bob'))]);
  });

  it('refuses touching another account', async () => {
    const res = await api()
      .put(`/api/users/${aliceId}`)
      .set(bearer(session('bob')))
      .send({ username: 'hacked' })
      .expect(403);
    expect(errorOf(res.body).name).toBe('PolicyError');
    await api()
      .delete(`/api/users/${aliceId}`)
      .set(bearer(session('bob')))
      .expect(403);
    await api().put(`/api/users/${aliceId}`).send({ username: 'anon' }).expect(403);
  });

  it('updates display name and username, ignores every other field', async () => {
    const res = await api()
      .put(`/api/users/${aliceId}`)
      .set(bearer(session('alice')))
      .send({
        displayName: 'Alice Durand',
        username: 'alice',
        email: 'stolen@evil.test',
        confirmed: false,
        blocked: true,
        role: 1,
        provider: 'google',
        password: 'Hijacked1!',
      })
      .expect(200);
    expect(res.body.displayName).toBe('Alice Durand');
    expect(res.body.email).toBe('alice@demo.lerevenu.test');
    expect(res.body.confirmed).toBe(true);
    expect(res.body.blocked).toBe(false);
    expect(res.body.provider).toBe('local');
    await api()
      .post('/api/auth/local')
      .send({ identifier: 'alice', password: 'Password123!' })
      .expect(200);
    await api()
      .put(`/api/users/${aliceId}`)
      .set(bearer(session('alice')))
      .send({ displayName: null })
      .expect(200);
  });

  it('refuses a username already taken', async () => {
    const res = await api()
      .put(`/api/users/${bobId}`)
      .set(bearer(session('bob')))
      .send({ username: 'alice' })
      .expect(400);
    expect(errorOf(res.body).message).toMatch(/already taken/i);
  });

  it('deletes the own account; discussions stay without an author', async () => {
    const account = {
      username: 'leaving',
      email: 'leaving@demo.lerevenu.test',
      password: 'Password123!',
    };
    await api().post('/api/auth/local/register').send(account).expect(200);
    await execute('update up_users set confirmed = true where email = $1', [account.email]);
    const login = await api()
      .post('/api/auth/local')
      .send({ identifier: account.username, password: account.password })
      .expect(200);
    const who: Session = {
      jwt: login.body.jwt,
      documentId: login.body.user.documentId,
      username: account.username,
    };
    const discussion = await createDiscussion(who, await firstCategoryId(), {
      title: 'Je pars mais mon sujet reste',
    });

    await api().delete(`/api/users/${login.body.user.id}`).set(bearer(who)).expect(200);
    await api().get('/api/users/me').set(bearer(who)).expect(401);
    const detail = await api().get(`/api/discussions/slug/${discussion.slug}`).expect(200);
    expect(detail.body.data.author).toBeNull();
  });
});
