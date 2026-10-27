/** A reader without a password (Google sign-up) sets one from the account page; once only. */
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { api, bearer, errorOf, session } from './helpers/api';
import { execute, queryOne } from './helpers/db';

const NEW_PASSWORD = 'GoogleThenLocal2026!';
let originalHash: string;

/** Alice temporarily becomes a Google account without a password; restored after the file. */
beforeAll(async () => {
  const row = await queryOne<{ password: string }>(
    "select password from up_users where username = 'alice'",
  );
  originalHash = row!.password;
  await execute(
    "update up_users set password = null, provider = 'google' where username = 'alice'",
  );
});

afterAll(async () => {
  await execute("update up_users set password = $1, provider = 'local' where username = 'alice'", [
    originalHash,
  ]);
});

describe('password status and first password', () => {
  it('needs a session (Strapi answers 403 to the Public role)', async () => {
    await api().get('/api/auth/password-status').expect(403);
    await api()
      .post('/api/auth/set-password')
      .send({ password: NEW_PASSWORD, passwordConfirmation: NEW_PASSWORD })
      .expect(403);
  });

  it('reports no password, refuses a short or mismatched one', async () => {
    const status = await api()
      .get('/api/auth/password-status')
      .set(bearer(session('alice')))
      .expect(200);
    expect(status.body).toEqual({ hasPassword: false });

    const short = await api()
      .post('/api/auth/set-password')
      .set(bearer(session('alice')))
      .send({ password: 'short', passwordConfirmation: 'short' })
      .expect(400);
    expect(errorOf(short.body).message).toMatch(/between 8 and 72/);

    const mismatch = await api()
      .post('/api/auth/set-password')
      .set(bearer(session('alice')))
      .send({ password: NEW_PASSWORD, passwordConfirmation: 'Other2026!!' })
      .expect(400);
    expect(errorOf(mismatch.body).message).toMatch(/do not match/);
  });

  it('sets the password once; the account becomes local and the password logs it in', async () => {
    await api()
      .post('/api/auth/set-password')
      .set(bearer(session('alice')))
      .send({ password: NEW_PASSWORD, passwordConfirmation: NEW_PASSWORD })
      .expect(200, { ok: true });

    const status = await api()
      .get('/api/auth/password-status')
      .set(bearer(session('alice')))
      .expect(200);
    expect(status.body).toEqual({ hasPassword: true });

    const login = await api()
      .post('/api/auth/local')
      .send({ identifier: 'alice', password: NEW_PASSWORD })
      .expect(200);
    // Strapi's local login only looks at local accounts: the first password makes the account local.
    expect(login.body.user.provider).toBe('local');

    const again = await api()
      .post('/api/auth/set-password')
      .set(bearer(session('alice')))
      .send({ password: 'Another2026!!', passwordConfirmation: 'Another2026!!' })
      .expect(409);
    expect(errorOf(again.body).message).toMatch(/already set/);
  });

  it('keeps bob out of the picture: his own status is unchanged', async () => {
    const status = await api()
      .get('/api/auth/password-status')
      .set(bearer(session('bob')))
      .expect(200);
    expect(status.body).toEqual({ hasPassword: true });
  });
});
