import { describe, expect, it } from 'vitest';

import { queryOne } from './helpers/db';

type Stored = {
  reset_password: { options: { object: string; message: string } };
  email_confirmation: { options: { object: string; message: string } };
};

/** The React Email templates are rendered at boot and stored where Users & Permissions reads them. */
describe('mail templates', () => {
  it('stores branded HTML with Strapi placeholders for both mails', async () => {
    const row = await queryOne<{ value: string }>(
      "select value from strapi_core_store_settings where key = 'plugin_users-permissions_email'",
    );
    const stored = JSON.parse(row!.value) as Stored;

    for (const [key, placeholder] of [
      ['email_confirmation', '?confirmation=<%= CODE %>'],
      ['reset_password', '?code=<%= TOKEN %>'],
    ] as const) {
      const { message } = stored[key].options;
      expect(message).toMatch(/^<!DOCTYPE html/i);
      expect(message).toContain('LE REVENU');
      expect(message).toContain(`href="<%= URL %>${placeholder}"`);
      expect(message).toContain('<%= USER.username %>');
      expect(message).not.toContain('__URL__');
      expect(message).toContain('English');
    }
    expect(stored.email_confirmation.options.object).toContain('Confirmez votre adresse');
    expect(stored.reset_password.options.object).toContain('Réinitialisez votre mot de passe');
  });
});
