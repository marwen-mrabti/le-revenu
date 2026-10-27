import { expect, test, type Page } from '@playwright/test';

/**
 * The detail page: reached from the list, read by a visitor, replied to by
 * alice who then edits and deletes her reply. One login per locale (Strapi
 * allows 10 logins per minute per IP across the whole suite).
 */
const L = {
  fr: {
    prefix: '',
    identifier: "E-mail ou nom d'utilisateur",
    password: 'Mot de passe',
    submit: 'Se connecter',
    cta: 'Se connecter pour répondre',
    yourReply: 'Votre réponse',
    post: 'Publier ma réponse',
    tooShort: '2 caractères minimum.',
    editing: 'Modification de votre réponse',
    save: 'Enregistrer',
    deleteConfirm: 'Supprimer',
    replies: /^\d+ réponses?$|^Aucune réponse pour l'instant$/,
    notFound: "Cette page n'existe pas, ou plus.",
    account: 'Compte',
  },
  en: {
    prefix: '/en',
    identifier: 'Email or username',
    password: 'Password',
    submit: 'Sign in',
    cta: 'Sign in to reply',
    yourReply: 'Your reply',
    post: 'Post my reply',
    tooShort: '2 characters minimum.',
    editing: 'Editing your reply',
    save: 'Save',
    deleteConfirm: 'Delete',
    replies: /^\d+ (reply|replies)$|^No reply yet$/,
    notFound: 'This page does not exist, or not anymore.',
    account: 'Account',
  },
} as const;

/** The theme button only renders after mount: its presence proves React has hydrated. */
async function open(page: Page, path: string) {
  await page.goto(path);
  await page.getByRole('button', { name: /thème|theme/ }).waitFor();
}

test.describe('discussion detail', () => {
  test('opens from the list, shows the discussion and its replies, and a 404 for an unknown slug', async ({
    page,
  }, testInfo) => {
    const t = L[testInfo.project.name as keyof typeof L];
    await open(page, `${t.prefix}/discussions`);
    const first = page.getByRole('main').getByRole('link').first();
    const title = (await first.textContent())?.trim() ?? '';
    await first.click();
    await expect(page).toHaveURL(new RegExp(`${t.prefix}/discussions/[a-z0-9-]+$`));
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(title);
    await expect(page.getByRole('heading', { level: 2 }).first()).toHaveText(t.replies);
    // A visitor is invited to sign in, and comes back here after.
    const cta = page.getByRole('link', { name: t.cta });
    await expect(cta).toHaveAttribute('href', /login\?next=%2Fdiscussions%2F/);

    await open(page, `${t.prefix}/discussions/this-slug-does-not-exist`);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(t.notFound);
  });

  test('alice replies, edits her reply, then deletes it', async ({ page }, testInfo) => {
    const t = L[testInfo.project.name as keyof typeof L];
    await open(page, `${t.prefix}/discussions`);
    await page.getByRole('main').getByRole('link').first().click();
    await expect(page).toHaveURL(/\/discussions\/[a-z0-9-]+$/);
    const slugPath = new URL(page.url()).pathname;

    await page.getByRole('link', { name: t.cta }).click();
    await page.getByRole('button', { name: /thème|theme/ }).waitFor();
    await page.getByLabel(t.identifier).fill('alice');
    await page.getByLabel(t.password, { exact: true }).fill('Password123!');
    await page.getByRole('button', { name: t.submit }).click();
    await expect(page).toHaveURL(new RegExp(`${slugPath}$`), { timeout: 15_000 });
    await page.getByRole('button', { name: /thème|theme/ }).waitFor();

    const box = page.getByRole('textbox', { name: t.yourReply, exact: true });
    await box.fill('M');
    await box.blur();
    await expect(page.getByText(t.tooShort)).toBeVisible();
    await expect(page.getByRole('button', { name: t.post })).toBeDisabled();

    const text = `e2e reply ${Date.now().toString(36)}`;
    await box.fill(text);
    await page.getByRole('button', { name: t.post }).click();
    const mine = page.getByRole('article').filter({ hasText: text });
    await expect(mine).toBeVisible({ timeout: 15_000 });
    await expect(box).toHaveValue('');

    // Edit: inline, same text box rules, saved text replaces the old one.
    await mine.getByRole('button').first().click();
    const edit = page.getByRole('form', { name: t.editing });
    await edit.getByRole('textbox').fill(`${text} edited`);
    await edit.getByRole('button', { name: t.save }).click();
    const edited = page.getByRole('article').filter({ hasText: `${text} edited` });
    await expect(edited).toBeVisible({ timeout: 15_000 });

    // Delete: confirmed in a dialog, the reply is gone after the refresh.
    await edited.getByRole('button').nth(1).click();
    await page.getByRole('alertdialog').getByRole('button', { name: t.deleteConfirm }).click();
    await expect(page.getByRole('article').filter({ hasText: text })).toHaveCount(0, {
      timeout: 15_000,
    });
  });
});
