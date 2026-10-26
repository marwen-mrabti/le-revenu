import { expect, test } from '@playwright/test';

test.describe('error pages', () => {
  test('an unknown URL gets the 404 page with the header and a way back', async ({ page }) => {
    const response = await page.goto('/this-page-does-not-exist');
    expect(response?.status()).toBe(404);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(
      "Cette page n'existe pas, ou plus.",
    );
    await expect(page.getByRole('link', { name: 'Voir les discussions' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Bourse & actions' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Langue' })).toBeVisible();
  });

  test('the English 404 is English', async ({ page }) => {
    await page.goto('/en/nothing-here');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(
      'This page does not exist, or not anymore.',
    );
  });

  test('a crashing page gets the 500 page with retry', async ({ page }) => {
    await page.goto('/dev/boom');
    const hero = page.getByRole('alert').filter({ hasText: 'Erreur 500' });
    await expect(hero).toBeVisible();
    await expect(hero.getByRole('button', { name: 'Réessayer' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Langue' })).toBeVisible();
  });
});
