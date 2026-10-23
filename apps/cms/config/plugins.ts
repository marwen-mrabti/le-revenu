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

const config = ({ env }: Core.Config.Shared.ConfigParams): Core.Config.Plugin => ({
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
