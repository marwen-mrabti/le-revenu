import { MailLayout } from './layout';
import { PLACEHOLDER } from './placeholders';

/** Sent after sign-up. Strapi fills URL (its own confirmation endpoint) and CODE. */
export function ConfirmationMail() {
  return (
    <MailLayout
      preview="Confirmez votre adresse pour rejoindre la communauté des lecteurs du Revenu."
      title={`Bienvenue, ${PLACEHOLDER.username} !`}
      buttonLabel="Confirmer mon adresse"
      href={`${PLACEHOLDER.url}?confirmation=${PLACEHOLDER.code}`}
      english="Welcome! Confirm your email address to join the community: click the button above."
      ignore="Vous n'avez pas créé de compte ? Ignorez ce message. · Didn't sign up? Ignore this email."
    >
      Encore une étape : confirmez votre adresse e-mail pour rejoindre la communauté des lecteurs du
      Revenu.
    </MailLayout>
  );
}
