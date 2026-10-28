import type { Core } from '@strapi/strapi';

import { renderMailTemplates, toPlainText } from '../emails';
import { discardNotice, mailsDiscarded } from '../emails/discard';

type Template = {
  display: string;
  icon: string;
  options: {
    from: { name: string; email: string };
    response_email: string;
    object: string;
    message: string;
  };
};

/**
 * Users & Permissions mail settings, set from the environment at boot so a
 * fresh database behaves like every other one:
 * - password reset link points at the web app's /api/auth/reset, which carries the
 *   code to the reset page in the reader's language;
 * - email confirmation is required for new accounts and lands on the web app's
 *   /api/auth/confirmed, which picks the reader's language for the login page,
 *   but only when a mailer is configured (SMTP_HOST): without one, a pending
 *   account could never be activated, so the zero-setup mode keeps instant sign-up;
 * - the two templates are React Email components (`src/emails/`) rendered to HTML here,
 *   with Strapi's placeholders (`<%= URL %>`, `<%= TOKEN %>`, `<%= CODE %>`) left for send time.
 * Strapi sends the stored message as both text and html; `withPlainText` derives a real
 * text version for clients that show no HTML, and warns for each mail that no relay
 * will carry.
 */
export async function ensureEmail(strapi: Core.Strapi): Promise<void> {
  // Required at boot (assert-env): never a hard-coded host in a mail link or a callback.
  const webUrl = String(process.env.WEB_URL).replace(/\/$/, '');
  const from = parseSender(
    process.env.EMAIL_FROM ?? 'Communauté Le Revenu <no-reply@lerevenu.test>',
  );
  const replyTo = process.env.EMAIL_REPLY_TO ?? from.email;
  const store = strapi.store({ type: 'plugin', name: 'users-permissions' });
  // Integration tests read the tokens from the database, so they keep confirmation on without a mailer.
  const hasMailer = Boolean(process.env.SMTP_HOST) || process.env.NODE_ENV === 'test';

  const advanced = ((await store.get({ key: 'advanced' })) ?? {}) as Record<string, unknown>;
  const wantedAdvanced = {
    email_confirmation: hasMailer,
    email_reset_password: `${webUrl}/api/auth/reset`,
    email_confirmation_redirection: `${webUrl}/api/auth/confirmed`,
  };
  if (!shallowEqual(advanced, wantedAdvanced)) {
    await store.set({ key: 'advanced', value: { ...advanced, ...wantedAdvanced } });
    strapi.log.info(
      `email: reset and confirmation links point at the web app, confirmation ${hasMailer ? 'on' : 'off'}`,
    );
  }

  const rendered = await renderMailTemplates();
  const templates = ((await store.get({ key: 'email' })) ?? {}) as Record<string, Template>;
  const wantedTemplates: Record<string, Template> = {
    reset_password: {
      display: 'Email.template.reset_password',
      icon: 'sync',
      options: {
        from,
        response_email: replyTo,
        object: 'Réinitialisez votre mot de passe · Reset your password',
        message: rendered.resetPassword.html,
      },
    },
    email_confirmation: {
      display: 'Email.template.email_confirmation',
      icon: 'check-square',
      options: {
        from,
        response_email: replyTo,
        object: 'Confirmez votre adresse e-mail · Confirm your email address',
        message: rendered.confirmation.html,
      },
    },
  };
  const changed = Object.entries(wantedTemplates).some(
    ([key, wanted]) => JSON.stringify(templates[key]?.options) !== JSON.stringify(wanted.options),
  );
  if (changed) {
    await store.set({ key: 'email', value: { ...templates, ...wantedTemplates } });
    strapi.log.info('email: templates set');
  }

  withPlainText(strapi);

  if (!hasMailer) {
    strapi.log.warn(
      'email: SMTP_HOST is empty, mails are discarded and sign-up needs no confirmation. Run `docker compose up -d mailpit` and set SMTP_HOST=localhost to read them at http://localhost:8025',
    );
  }
}

function parseSender(value: string): { name: string; email: string } {
  const match = /^(.*?)\s*<([^>]+)>\s*$/.exec(value);
  return match ? { name: match[1].trim(), email: match[2].trim() } : { name: '', email: value };
}

function shallowEqual(current: Record<string, unknown>, wanted: Record<string, unknown>): boolean {
  return Object.entries(wanted).every(([key, value]) => current[key] === value);
}

const PATCHED = Symbol.for('lerevenu.email.plainText');

type SendOptions = { text?: string; html?: string } & Record<string, unknown>;
type EmailService = { send: (options: SendOptions) => Promise<unknown>; [PATCHED]?: true };

/**
 * Users & Permissions passes its template as both `text` and `html`. When that
 * message is our rendered HTML, derive the text part from it so text-only clients
 * read sentences, not markup. Without `SMTP_HOST` the transport swallows the mail:
 * one warning per mail names the recipient and the subject. Wrapped once per process.
 */
function withPlainText(strapi: Core.Strapi): void {
  const service = strapi.plugin('email').service('email') as EmailService;
  if (service[PATCHED]) return;
  const send = service.send.bind(service);
  service.send = (options) => {
    if (mailsDiscarded()) strapi.log.warn(discardNotice(options));
    return send(
      typeof options.html === 'string' &&
        options.text === options.html &&
        /<html/i.test(options.html)
        ? { ...options, text: toPlainText(options.html) }
        : options,
    );
  };
  service[PATCHED] = true;
}
