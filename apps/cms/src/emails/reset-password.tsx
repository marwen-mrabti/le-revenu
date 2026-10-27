import { MailLayout } from './layout';
import { PLACEHOLDER } from './placeholders';

/** Sent by "forgot password". Strapi fills URL (the web app's reset landing) and TOKEN. */
export function ResetPasswordMail() {
  return (
    <MailLayout
      preview="Choisissez un nouveau mot de passe. Le lien ne sert qu'une fois."
      title="Nouveau mot de passe"
      buttonLabel="Choisir un nouveau mot de passe"
      href={`${PLACEHOLDER.url}?code=${PLACEHOLDER.token}`}
      english="Click the button above to choose a new password. The link works once and expires in one hour."
      ignore="Vous n'êtes pas à l'origine de cette demande ? Ignorez ce message, votre mot de passe reste inchangé. · If you did not ask for this, ignore this email."
    >
      Bonjour {PLACEHOLDER.username}, cliquez sur le bouton pour choisir un nouveau mot de passe. Le
      lien ne sert qu'une fois et expire dans une heure.
    </MailLayout>
  );
}
