import type { Core } from '@strapi/strapi';

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
 * - the two templates carry our wording (French, one English line) and sender.
 * Templates are plain text with Strapi's placeholders: `<%= URL %>`, `<%= TOKEN %>`, `<%= CODE %>`.
 */
export async function ensureEmail(strapi: Core.Strapi): Promise<void> {
  const webUrl = (process.env.WEB_URL ?? 'http://localhost:3000').replace(/\/$/, '');
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

  const templates = ((await store.get({ key: 'email' })) ?? {}) as Record<string, Template>;
  const wantedTemplates: Record<string, Template> = {
    reset_password: {
      display: 'Email.template.reset_password',
      icon: 'sync',
      options: {
        from,
        response_email: replyTo,
        object: 'Réinitialisez votre mot de passe · Reset your password',
        message: `Bonjour <%= USER.username %>,

Cliquez sur ce lien pour choisir un nouveau mot de passe (il ne sert qu'une fois) :
<%= URL %>?code=<%= TOKEN %>

Si vous n'êtes pas à l'origine de cette demande, ignorez ce message.
If you did not ask for this, ignore this email.

Communauté Le Revenu`,
      },
    },
    email_confirmation: {
      display: 'Email.template.email_confirmation',
      icon: 'check-square',
      options: {
        from,
        response_email: replyTo,
        object: 'Confirmez votre adresse e-mail · Confirm your email address',
        message: `Bienvenue <%= USER.username %> !

Confirmez votre adresse pour rejoindre la communauté :
<%= URL %>?confirmation=<%= CODE %>

Confirm your email address to join the community.

Communauté Le Revenu`,
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
