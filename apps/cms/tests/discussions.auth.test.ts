/** Brief rule: only logged-in readers write. Sign-up is open but needs an email confirmation. */
import { describe, expect, it } from 'vitest';

import { api, errorOf, firstCategoryId, validDiscussion } from './helpers/api';

describe('POST /api/discussions without a valid session', () => {
  it('answers 403 ForbiddenError without a token', async () => {
    const res = await api()
      .post('/api/discussions')
      .send({ data: validDiscussion(await firstCategoryId()) })
      .expect(403);
    expect(errorOf(res.body).name).toBe('ForbiddenError');
  });

  it('answers 401 UnauthorizedError with a malformed token', async () => {
    const res = await api()
      .post('/api/discussions')
      .set('Authorization', 'Bearer not-a-jwt')
      .send({ data: validDiscussion(await firstCategoryId()) })
      .expect(401);
    expect(errorOf(res.body).name).toBe('UnauthorizedError');
  });
});

describe('POST /api/auth/local/register', () => {
  const account = {
    username: 'nouveau-lecteur',
    email: 'nouveau-lecteur@demo.lerevenu.test',
    password: 'Password123!',
  };

  it('creates an unconfirmed reader and gives no session until the email is confirmed', async () => {
    const res = await api().post('/api/auth/local/register').send(account).expect(200);
    expect(res.body.jwt).toBeUndefined();
    expect(res.body.user.username).toBe(account.username);
    expect(res.body.user.confirmed).toBe(false);
    expect(res.body.user).not.toHaveProperty('password');

    const login = await api()
      .post('/api/auth/local')
      .send({ identifier: account.email, password: account.password })
      .expect(400);
    expect(errorOf(login.body).message).toMatch(/not confirmed/i);
  });

  it('refuses the same email twice', async () => {
    const res = await api().post('/api/auth/local/register').send(account).expect(400);
    expect(errorOf(res.body).name).toBe('ApplicationError');
  });

  it('refuses an invalid email', async () => {
    const res = await api()
      .post('/api/auth/local/register')
      .send({ ...account, username: 'autre', email: 'not-an-email' })
      .expect(400);
    expect(errorOf(res.body).name).toBe('ValidationError');
  });
});
