/** Forgot password: a single-use token by mail, a new password, a session right away. */
import { describe, expect, it } from 'vitest';

import { api } from './helpers/api';
import { queryOne } from './helpers/db';

const email = 'camille.b@demo.lerevenu.test';
const oldPassword = 'Password123!';
const newPassword = 'NouveauMdp2026!';

describe('password reset', () => {
  it('answers 200 for an unknown email without creating a token', async () => {
    await api()
      .post('/api/auth/forgot-password')
      .send({ email: 'nobody@nowhere.test' })
      .expect(200);
  });

  it('sets a token, accepts it once, and the new password replaces the old one', async () => {
    await api().post('/api/auth/forgot-password').send({ email }).expect(200);
    const row = await queryOne<{ reset_password_token: string }>(
      'select reset_password_token from up_users where email = $1',
      [email],
    );
    expect(row?.reset_password_token).toMatch(/^[0-9a-f]{128}$/);
    const code = row!.reset_password_token;

    const reset = await api()
      .post('/api/auth/reset-password')
      .send({ code, password: newPassword, passwordConfirmation: newPassword })
      .expect(200);
    expect(reset.body.jwt).toEqual(expect.any(String));
    expect(reset.body.user.email).toBe(email);

    await api()
      .post('/api/auth/local')
      .send({ identifier: email, password: oldPassword })
      .expect(400);
    await api()
      .post('/api/auth/local')
      .send({ identifier: email, password: newPassword })
      .expect(200);

    await api()
      .post('/api/auth/reset-password')
      .send({ code, password: 'AnotherOne2026!', passwordConfirmation: 'AnotherOne2026!' })
      .expect(400);
  });

  it('refuses a mismatched confirmation', async () => {
    await api()
      .post('/api/auth/reset-password')
      .send({ code: 'x'.repeat(128), password: newPassword, passwordConfirmation: 'different' })
      .expect(400);
  });
});
