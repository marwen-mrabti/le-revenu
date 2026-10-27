import { expect, test, type Page } from '@playwright/test';

/**
 * The account lifecycle through real mails: Mailpit (docker compose up -d mailpit)
 * exposes every mail Strapi sends at http://localhost:8025, with a JSON API.
 * Skipped when Mailpit is not reachable, so the suite stays green without it.
 */
const MAILPIT = process.env.MAILPIT_URL ?? 'http://localhost:8025';

const L = {
  fr: {
    prefix: '',
    username: "Nom d'utilisateur",
    email: 'E-mail',
    identifier: "E-mail ou nom d'utilisateur",
    password: 'Mot de passe',
    register: 'Créer mon compte',
    verifyTitle: 'Encore une étape',
    resend: 'Renvoyer le lien',
    login: 'Se connecter',
    notConfirmed: "n'est pas encore confirmée",
    confirmed: 'Adresse confirmée',
    account: 'Compte',
    myAccount: 'Mon compte',
    displayName: 'Nom affiché',
    save: 'Enregistrer',
    saved: 'Profil enregistré.',
    signOut: 'Se déconnecter',
    forgot: 'Mot de passe oublié ?',
    sendLink: 'Envoyer le lien',
    sent: 'un lien vient de partir',
    newPassword: 'Nouveau mot de passe',
    confirmPassword: 'Confirmer le mot de passe',
    resetSubmit: 'Enregistrer et me connecter',
    invalidCode: 'Code de réinitialisation inconnu.',
    deleteButton: 'Supprimer mon compte',
    signIn: 'Se connecter',
  },
  en: {
    prefix: '/en',
    username: 'Username',
    email: 'Email',
    identifier: 'Email or username',
    password: 'Password',
    register: 'Create my account',
    verifyTitle: 'One more step',
    resend: 'Resend the link',
    login: 'Sign in',
    notConfirmed: 'not confirmed yet',
    confirmed: 'Address confirmed',
    account: 'Account',
    myAccount: 'My account',
    displayName: 'Display name',
    save: 'Save',
    saved: 'Profile saved.',
    signOut: 'Sign out',
    forgot: 'Forgot your password?',
    sendLink: 'Send the link',
    sent: 'a link is on its way',
    newPassword: 'New password',
    confirmPassword: 'Confirm password',
    resetSubmit: 'Save and sign me in',
    invalidCode: 'Unknown reset code.',
    deleteButton: 'Delete my account',
    signIn: 'Sign in',
  },
} as const;

interface MailpitMessage {
  ID: string;
  To: { Address: string }[];
}

/** Newest mail sent to `to` whose text matches `pattern`; polls because Strapi sends after answering. */
async function mailLink(to: string, pattern: RegExp): Promise<string> {
  for (let attempt = 0; attempt < 30; attempt++) {
    const list = (await (await fetch(`${MAILPIT}/api/v1/messages?limit=50`)).json()) as {
      messages: MailpitMessage[];
    };
    for (const message of list.messages.filter((m) => m.To.some((t) => t.Address === to))) {
      const full = (await (await fetch(`${MAILPIT}/api/v1/message/${message.ID}`)).json()) as {
        Text: string;
      };
      const match = full.Text.match(pattern);
      if (match) return match[0];
    }
    await new Promise((resolve) => setTimeout(resolve, 300));
  }
  throw new Error(`No mail matching ${pattern} for ${to}`);
}

/** Typing before hydration leaves the form state empty: the theme button proves React is up. */
async function open(page: Page, path: string) {
  await page.goto(path);
  await page.getByRole('button', { name: /thème|theme/ }).waitFor();
}

const field = (page: Page, name: string) => page.getByRole('textbox', { name, exact: true });

test.describe('account lifecycle', () => {
  test.beforeAll(async () => {
    const reachable = await fetch(`${MAILPIT}/api/v1/info`)
      .then((r) => r.ok)
      .catch(() => false);
    test.skip(!reachable, `Mailpit not reachable at ${MAILPIT}: docker compose up -d mailpit`);
  });

  // Two logins per locale (one refused, one accepted): with the auth spec the suite stays under Strapi's 10/min.
  test('signs up, confirms by mail, edits the profile, resets the password, deletes', async ({
    page,
  }, testInfo) => {
    test.setTimeout(120_000);
    const t = L[testInfo.project.name as keyof typeof L];
    const stamp = Date.now().toString(36);
    const username = `e2e${stamp}`;
    const email = `e2e-${stamp}@exemple.fr`;
    const password = 'Password123!';

    // Sign-up lands on the verify page; no session yet.
    await open(page, `${t.prefix}/register`);
    await field(page, t.username).fill(username);
    await field(page, t.email).fill(email);
    await field(page, t.password).fill(password);
    await page.getByRole('button', { name: t.register }).click();
    await expect(page).toHaveURL(/verify-email/);
    await expect(page.getByRole('heading', { name: t.verifyTitle })).toBeVisible();
    await expect(page.getByRole('button', { name: t.account })).toHaveCount(0);

    // Login before confirming is refused with a resend link.
    await open(page, `${t.prefix}/login`);
    await field(page, t.identifier).fill(email);
    await field(page, t.password).fill(password);
    await page.getByRole('button', { name: t.login }).click();
    await expect(page.getByRole('alert').filter({ hasText: t.notConfirmed })).toBeVisible();

    // The mail link confirms and lands on the login page with a banner.
    const confirmLink = await mailLink(email, /https?:\/\/\S+email-confirmation\S+/);
    await page.goto(confirmLink);
    await expect(page).toHaveURL(/login\?confirmed=1/);
    await expect(page.getByRole('status')).toContainText(t.confirmed);
    await page.getByRole('button', { name: /thème|theme/ }).waitFor();
    await field(page, t.identifier).fill(email);
    await field(page, t.password).fill(password);
    await page.getByRole('button', { name: t.login }).click();
    await expect(page).toHaveURL(new RegExp(`${t.prefix}/discussions$`), { timeout: 15_000 });

    // Account page: the display name replaces the username in the header.
    await page.getByRole('button', { name: t.account, exact: true }).click();
    await page.getByRole('menuitem', { name: t.myAccount }).click();
    await expect(page).toHaveURL(/account/);
    await field(page, t.displayName).fill('Claire Nantes');
    await page.getByRole('button', { name: t.save }).click();
    await expect(page.getByRole('status').filter({ hasText: t.saved })).toBeVisible();
    await expect(page.getByRole('button', { name: t.account, exact: true })).toContainText(
      'Claire Nantes',
    );

    // Logout, then forgot → mail → reset; the reset logs the reader in.
    await page.getByRole('button', { name: t.account, exact: true }).click();
    await page.getByRole('menuitem', { name: t.signOut }).click();
    await expect(page).toHaveURL(/login/);
    await page.getByRole('link', { name: t.forgot }).click();
    await expect(page).toHaveURL(/forgot-password/);
    await page.getByRole('button', { name: /thème|theme/ }).waitFor();
    await field(page, t.email).fill(email);
    await page.getByRole('button', { name: t.sendLink }).click();
    await expect(page.getByRole('status')).toContainText(t.sent);

    const resetLink = await mailLink(email, /https?:\/\/\S+auth\/reset\?code=\S+/);
    await open(page, resetLink);
    await field(page, t.newPassword).fill('Reset2026!!');
    await field(page, t.confirmPassword).fill('Reset2026!!');
    await page.getByRole('button', { name: t.resetSubmit }).click();
    await expect(page).toHaveURL(new RegExp(`${t.prefix}/discussions$`), { timeout: 15_000 });
    await expect(page.getByRole('button', { name: t.account, exact: true })).toContainText(
      'Claire Nantes',
    );

    // A used code is refused.
    await open(page, resetLink);
    await field(page, t.newPassword).fill('Reset2026!!');
    await field(page, t.confirmPassword).fill('Reset2026!!');
    await page.getByRole('button', { name: t.resetSubmit }).click();
    await expect(page.getByRole('alert').filter({ hasText: t.invalidCode })).toBeVisible();

    // Delete: the final button needs the exact username, then the session is gone.
    await open(page, `${t.prefix}/account`);
    await page.getByRole('button', { name: t.deleteButton }).click();
    const confirm = page.getByRole('button', { name: t.deleteButton }).last();
    await expect(confirm).toBeDisabled();
    await field(page, t.username).last().fill(username);
    await expect(confirm).toBeEnabled();
    await confirm.click();
    await expect(page).toHaveURL(new RegExp(`${t.prefix}/discussions$`), { timeout: 15_000 });
    await expect(page.getByRole('link', { name: t.signIn }).first()).toBeVisible();
    await expect(page.getByRole('button', { name: t.account, exact: true })).toHaveCount(0);
  });
});
