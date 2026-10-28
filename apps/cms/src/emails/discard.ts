/**
 * Without `SMTP_HOST`, the mail plugin runs on nodemailer's `jsonTransport`,
 * which accepts every mail and delivers none. The boot warning says so once;
 * these helpers let the send wrapper say it again for each mail, with the
 * recipient and the subject, so a reader who tests "forgot password" sees
 * where the mail went.
 */
export const mailsDiscarded = (env: NodeJS.ProcessEnv = process.env): boolean => !env.SMTP_HOST;

export function discardNotice(mail: Record<string, unknown>): string {
  const subject = nonEmpty(mail.subject) ?? 'no subject';
  return `email: discarded "${subject}" to ${recipient(mail.to)} (SMTP_HOST is empty)`;
}

const nonEmpty = (value: unknown): string | undefined =>
  typeof value === 'string' && value ? value : undefined;

const recipient = (to: unknown): string =>
  Array.isArray(to) ? to.join(', ') : (nonEmpty(to) ?? 'unknown recipient');
