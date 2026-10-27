import type { Core } from '@strapi/strapi';

const allowedMediaTypes = [
  'image/*',
  'video/*',
  'audio/*',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.*',
  'text/plain',
  'text/csv',
];

const deniedTypes = [
  'image/svg+xml',
  'application/vnd.microsoft.portable-executable',
  'application/x-msdownload',
  'application/x-msdos-program',
  'application/x-executable',
  'application/x-dosexec',
  'application/x-sh',
  'text/x-shellscript',
  'application/x-mach-binary',
];

/**
 * Mail transport. With SMTP_HOST set, nodemailer talks to that server
 * (Mailpit in development, any SMTP, Resend or Brevo in production).
 * Without it, mails are built and discarded (`jsonTransport`): the zero-setup
 * mode keeps working and ensure-email.ts logs one warning at boot.
 */
const mailTransport = (env: Core.Config.Shared.ConfigParams['env']) =>
  env('SMTP_HOST')
    ? {
        host: env('SMTP_HOST'),
        port: env.int('SMTP_PORT', 587),
        secure: env.bool('SMTP_SECURE', false),
        ...(env('SMTP_USER')
          ? { auth: { user: env('SMTP_USER'), pass: env('SMTP_PASS', '') } }
          : {}),
      }
    : { jsonTransport: true };

const config = ({ env }: Core.Config.Shared.ConfigParams): Core.Config.Plugin => ({
  email: {
    config: {
      provider: 'nodemailer',
      providerOptions: mailTransport(env),
      settings: {
        defaultFrom: env('EMAIL_FROM', 'Communauté Le Revenu <no-reply@lerevenu.test>'),
        defaultReplyTo: env('EMAIL_REPLY_TO', 'no-reply@lerevenu.test'),
      },
    },
  },
  'users-permissions': {
    config: {
      jwtSecret: env('JWT_SECRET'),
      // Single access token kept in the Next.js httpOnly cookie. Switching to
      // `jwtManagement: 'refresh'` (short access + refresh tokens) is the
      // documented evolution path, see docs/adr/0001.
      jwtManagement: 'legacy-support',
      jwt: {
        expiresIn: env('JWT_EXPIRES_IN', '7d'),
      },
      register: {
        // Public sign-up is disabled in bootstrap; no extra fields are accepted.
        allowedFields: [],
      },
      ratelimit: {
        interval: 60_000,
        max: 10,
      },
    },
  },
  upload: {
    config: {
      security: {
        allowedTypes: allowedMediaTypes,
        deniedTypes,
      },
    },
  },
});

export default config;
