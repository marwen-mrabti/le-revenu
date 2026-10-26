/** Smoke test of Users & Permissions: login, session, and the user list stays closed. */
import { describe, expect, it } from 'vitest';

import { api, bearer, errorOf, session } from './helpers/api';

describe('POST /api/auth/local', () => {
  it('logs a demo reader in and never returns the password hash', async () => {
    const res = await api()
      .post('/api/auth/local')
      .send({ identifier: 'alice', password: 'Password123!' })
      .expect(200);
    expect(res.body.jwt).toEqual(expect.any(String));
    expect(res.body.user.username).toBe('alice');
    expect(res.body.user).not.toHaveProperty('password');
  });

  it('answers 400 for a wrong password', async () => {
    const res = await api()
      .post('/api/auth/local')
      .send({ identifier: 'alice', password: 'wrong' })
      .expect(400);
    expect(errorOf(res.body).name).toBe('ValidationError');
  });
});

describe('GET /api/users/me', () => {
  it('the Public role has at least one permission, so anonymous writes get 403 not 401', async () => {
    await api().get('/api/categories').expect(200);
  });

  it('returns the caller with a token, 403 without', async () => {
    const res = await api()
      .get('/api/users/me')
      .set(bearer(session('bob')))
      .expect(200);
    expect(res.body.username).toBe('bob');
    expect(res.body).not.toHaveProperty('password');
    await api().get('/api/users/me').expect(403);
  });
});

describe('GET /api/users', () => {
  it('is closed to readers, even logged in', async () => {
    await api()
      .get('/api/users')
      .set(bearer(session('alice')))
      .expect(403);
    await api().get('/api/users').expect(403);
  });
});
