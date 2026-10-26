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

/** Typing before React has hydrated leaves the form state empty: wait for the page to settle first. */
async function open(page: Page, path: string) {
  await page.goto(path);
  await page.waitForLoadState('networkidle');
}

test.describe('authentication', () => {
  test('logs alice in, shows her in the header, logs her out', async ({ page }, testInfo) => {
    const t = L[testInfo.project.name as keyof typeof L];
    await open(page, `${t.prefix}/login`);

    await page.getByLabel(t.identifier).fill('alice');
    await page.getByLabel(t.password, { exact: true }).fill('Password123!');
    await page.getByRole('button', { name: t.submit }).click();

    await expect(page).toHaveURL(new RegExp(`${t.prefix}/discussions$`));
    const account = page.getByRole('button', { name: t.account });
    await expect(account).toContainText('alice');

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
