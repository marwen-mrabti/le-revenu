import { expect, test, type Page } from '@playwright/test';

/** Labels per Playwright project (`fr`, `en`), so one spec covers both locales. */
const L = {
  fr: {
    prefix: '',
    identifier: "E-mail ou nom d'utilisateur",
    password: 'Mot de passe',
    submit: 'Se connecter',
    account: 'Compte',
    signOut: 'Se déconnecter',
    signIn: 'Se connecter',
    wrong: 'Identifiant ou mot de passe incorrect.',
  },
  en: {
    prefix: '/en',
    identifier: 'Email or username',
    password: 'Password',
    submit: 'Sign in',
    account: 'Account',
    signOut: 'Sign out',
    signIn: 'Sign in',
    wrong: 'Wrong identifier or password.',
  },
} as const;

/**
 * Typing before React has hydrated leaves the form state empty. The theme
 * button only renders after mount, so its presence proves hydration is done.
 */
async function open(page: Page, path: string) {
  await page.goto(path);
  await page.getByRole('button', { name: /thème|theme/ }).waitFor();
}

test.describe('authentication', () => {
  // One login per locale: Strapi allows 10 login attempts per minute per IP, the whole suite must stay under.
  test('logs alice in, keeps the session private, logs her out', async ({ page }, testInfo) => {
    const t = L[testInfo.project.name as keyof typeof L];
    await open(page, `${t.prefix}/login`);

    await page.getByLabel(t.identifier).fill('alice');
    await page.getByLabel(t.password, { exact: true }).fill('Password123!');
    await page.getByRole('button', { name: t.submit }).click();

    // Generous: in development the target page may still be compiling on first visit.
    await expect(page).toHaveURL(new RegExp(`${t.prefix}/discussions$`), { timeout: 15_000 });
    const account = page.getByRole('button', { name: t.account });
    await expect(account).toContainText('alice');

    // The session cookie is httpOnly: scripts cannot read it.
    expect(await page.evaluate(() => document.cookie)).not.toContain('lr_session');
    // Already logged in: the auth pages redirect, and a foreign `next` is ignored.
    await page.goto(`${t.prefix}/login?next=//evil.test`);
    await expect(page).toHaveURL(new RegExp(`${t.prefix}/discussions$`));
    await page.goto(`${t.prefix}/register?next=http://evil.test`);
    await expect(page).toHaveURL(new RegExp(`${t.prefix}/discussions$`));

    await account.click();
    await page.getByRole('menuitem', { name: t.signOut }).click();
    await expect(page.getByRole('link', { name: t.signIn })).toBeVisible();
    await expect(page.getByRole('button', { name: t.account })).toHaveCount(0);
  });

  test('refuses a wrong password without saying which field is wrong', async ({
    page,
  }, testInfo) => {
    const t = L[testInfo.project.name as keyof typeof L];
    await open(page, `${t.prefix}/login`);
    await page.getByLabel(t.identifier).fill('alice');
    await page.getByLabel(t.password, { exact: true }).fill('not-the-password');
    await page.getByRole('button', { name: t.submit }).click();
    await expect(page.getByRole('alert').filter({ hasText: t.wrong })).toBeVisible();
    await expect(page).toHaveURL(new RegExp(`${t.prefix}/login`));
  });
});
