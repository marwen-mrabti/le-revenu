import { describe, expect, it } from 'vitest';

import { discardNotice, mailsDiscarded } from '../src/emails/discard';

/** Without SMTP_HOST every mail is swallowed: the log must say so per mail, not only at boot. */
describe('discarded mails', () => {
  it('discards only when SMTP_HOST is empty', () => {
    expect(mailsDiscarded({})).toBe(true);
    expect(mailsDiscarded({ SMTP_HOST: '' })).toBe(true);
    expect(mailsDiscarded({ SMTP_HOST: 'localhost' })).toBe(false);
  });

  it('names the recipient and the subject in the warning', () => {
    expect(discardNotice({ to: 'alice@demo.lerevenu.test', subject: 'Reset your password' })).toBe(
      'email: discarded "Reset your password" to alice@demo.lerevenu.test (SMTP_HOST is empty)',
    );
    expect(discardNotice({ to: ['a@x.test', 'b@x.test'] })).toContain('to a@x.test, b@x.test');
    expect(discardNotice({})).toBe(
      'email: discarded "no subject" to unknown recipient (SMTP_HOST is empty)',
    );
  });
});
