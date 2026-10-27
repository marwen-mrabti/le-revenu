import { render, toPlainText } from '@react-email/components';

import { ConfirmationMail } from './confirmation';
import { toStrapiPlaceholders } from './placeholders';
import { ResetPasswordMail } from './reset-password';

export interface RenderedMail {
  /** HTML with Strapi's placeholders, stored as the template `message`. */
  html: string;
}

/** Renders both templates to HTML once, at boot; Strapi fills the placeholders per mail. */
export async function renderMailTemplates(): Promise<{
  confirmation: RenderedMail;
  resetPassword: RenderedMail;
}> {
  const [confirmation, resetPassword] = await Promise.all([
    render(<ConfirmationMail />),
    render(<ResetPasswordMail />),
  ]);
  return {
    confirmation: { html: toStrapiPlaceholders(confirmation) },
    resetPassword: { html: toStrapiPlaceholders(resetPassword) },
  };
}

/** Text version of a sent HTML mail, for clients that show no HTML. */
export { toPlainText };
