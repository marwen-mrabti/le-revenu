/**
 * Fails the boot when a required variable is missing or still a placeholder.
 * Runs in `register()`, before the database is touched.
 */
const REQUIRED = [
  'APP_KEYS',
  'API_TOKEN_SALT',
  'ADMIN_JWT_SECRET',
  'TRANSFER_TOKEN_SALT',
  'JWT_SECRET',
  'ENCRYPTION_KEY',
  'DATABASE_CLIENT',
  'DATABASE_HOST',
  'DATABASE_NAME',
  'DATABASE_USERNAME',
  'DATABASE_PASSWORD',
  'WEB_URL',
  'REVALIDATE_SECRET',
] as const;

const PLACEHOLDERS = /change-?me|tobemodified|replace-?me/i;

export function assertEnv(env: NodeJS.ProcessEnv = process.env): void {
  const missing: string[] = [];
  const placeholder: string[] = [];

  for (const key of REQUIRED) {
    const value = env[key];
    if (!value || value.trim() === '') missing.push(key);
    else if (PLACEHOLDERS.test(value)) placeholder.push(key);
  }

  if (missing.length === 0 && placeholder.length === 0) return;

  const lines = [
    'Environment check failed.',
    missing.length ? `Missing: ${missing.join(', ')}` : null,
    placeholder.length ? `Still a placeholder: ${placeholder.join(', ')}` : null,
    'Copy .env.example to .env and generate secrets with: openssl rand -base64 32',
  ].filter(Boolean);

  throw new Error(lines.join('\n'));
}
