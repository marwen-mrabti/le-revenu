import { expect, test, type Page } from '@playwright/test';

/**
 * The create page: a visitor is sent to login and comes back; alice publishes,
 * lands on the new discussion, finds it first in the list, then deletes it.
 * One login per locale (Strapi allows 10 per minute per IP across the suite).
 */
const L = {
  fr: {
    prefix: '',
    identifier: "E-mail ou nom d'utilisateur",
    password: 'Mot de passe',
    submit: 'Se connecter',
    publishLink: 'Publier',
    title: 'Titre',
    space: 'Espace',
    content: 'Contenu',
    publish: 'Publier',
    tooShort: '10 caractères minimum.',
    published: 'Discussion publiée.',
    deleteConfirm: 'Supprimer',
  },
  en: {
    prefix: '/en',
    identifier: 'Email or username',
    password: 'Password',
    submit: 'Sign in',
    publishLink: 'Post',
    title: 'Title',
    space: 'Space',
    content: 'Content',
    publish: 'Publish',
    tooShort: '10 characters minimum.',
    published: 'Discussion published.',
    deleteConfirm: 'Delete',
  },
} as const;

/** The theme button only renders after mount: its presence proves React has hydrated. */
async function open(page: Page, path: string) {
  await page.goto(path);
  await page.getByRole('button', { name: /thème|theme/ }).waitFor();
}

test.describe('create a discussion', () => {
  test('sends a visitor to login, then alice publishes, lands on it, sees it listed, deletes it', async ({
    page,
  }, testInfo) => {
    const t = L[testInfo.project.name as keyof typeof L];
    await page.goto(`${t.prefix}/discussions/new`);
    await expect(page).toHaveURL(/login\?next=%2Fdiscussions%2Fnew/);
    await page.getByRole('button', { name: /thème|theme/ }).waitFor();
    await page.getByLabel(t.identifier).fill('alice');
    await page.getByLabel(t.password, { exact: true }).fill('Password123!');
    await page.getByRole('button', { name: t.submit }).click();
    await expect(page).toHaveURL(new RegExp(`${t.prefix}/discussions/new$`), { timeout: 15_000 });
    await page.getByRole('button', { name: /thème|theme/ }).waitFor();
    await page.getByRole('radio').first().waitFor();

    const publish = page.getByRole('button', { name: t.publish, exact: true });
    await expect(publish).toBeDisabled();
    const title = page.getByRole('textbox', { name: t.title, exact: true });
    await title.fill('PEA ou CT');
    await title.blur();
    await expect(page.getByText(t.tooShort)).toBeVisible();

    const stamp = Date.now().toString(36);
    const text = `e2e ${stamp} : faut-il ouvrir un PER à 45 ans ?`;
    await title.fill(text);
    await page.getByRole('combobox', { name: t.space }).selectOption({ index: 1 });
    await page.getByRole('textbox', { name: t.content, exact: true }).fill('Contexte du test e2e.');
    await expect(publish).toBeEnabled();
    await publish.click();

    await expect(page).toHaveURL(/\/discussions\/e2e-[a-z0-9-]+$/, { timeout: 20_000 });
    await expect(page.getByText(t.published)).toBeVisible();
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(text);
    const slugPath = new URL(page.url()).pathname;

    // Both locales run in parallel: search by the stamp rather than reading the first card.
    await open(page, `${t.prefix}/discussions?q=${stamp}`);
    await expect(page.getByRole('main').getByRole('link', { name: text })).toBeVisible();

    // Cleanup from the page itself: the author deletes, lands on the list.
    await open(page, slugPath);
    await page.getByRole('heading', { level: 1 }).waitFor();
    await page
      .getByRole('button', { name: new RegExp(`^(Supprimer|Delete) ?: ${text.slice(0, 12)}`) })
      .click();
    await page.getByRole('alertdialog').getByRole('button', { name: t.deleteConfirm }).click();
    await expect(page).toHaveURL(new RegExp(`${t.prefix}/discussions$`), { timeout: 15_000 });
  });
});
