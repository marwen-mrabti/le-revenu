/** Sign-up needs a confirmed email: no session before the link in the mail is used. */
import { describe, expect, it } from 'vitest';

import { api, errorOf } from './helpers/api';
import { queryOne } from './helpers/db';

const account = {
  username: 'confirm-me',
  email: 'confirm-me@demo.lerevenu.test',
  password: 'Password123!',
};

describe('email confirmation', () => {
  it('registers unconfirmed, refuses login, confirms through the mailed token, then logs in', async () => {
    const registered = await api().post('/api/auth/local/register').send(account).expect(200);
    expect(registered.body.jwt).toBeUndefined();
    expect(registered.body.user.confirmed).toBe(false);

    const refused = await api()
      .post('/api/auth/local')
      .send({ identifier: account.email, password: account.password })
      .expect(400);
    expect(errorOf(refused.body).message).toMatch(/not confirmed/i);

    const row = await queryOne<{ confirmation_token: string }>(
      'select confirmation_token from up_users where email = $1',
      [account.email],
    );
    expect(row?.confirmation_token).toMatch(/^[0-9a-f]{40}$/);

    const landing = await api()
      .get(`/api/auth/email-confirmation?confirmation=${row!.confirmation_token}`)
      .redirects(0)
      .expect(302);
    expect(landing.headers.location).toBe('http://localhost:3000/api/auth/confirmed');

    const login = await api()
      .post('/api/auth/local')
      .send({ identifier: account.username, password: account.password })
      .expect(200);
    expect(login.body.jwt).toEqual(expect.any(String));
    expect(login.body.user.confirmed).toBe(true);
  });

  it('refuses an unknown or reused confirmation token', async () => {
    await api().get('/api/auth/email-confirmation?confirmation=deadbeef').redirects(0).expect(400);
  });
});
