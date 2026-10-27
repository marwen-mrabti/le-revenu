import { expect, test } from '@playwright/test';

test.describe('islands', () => {
  test('a failing list leaves the page intact and recovers on retry', async ({ page }) => {
    await page.goto('/discussions');
    await page.getByRole('button', { name: /thème/ }).waitFor();
    await expect(page.locator('article').first()).toBeVisible();

    // The next client refetch (a filter change) hits a dead backend.
    await page.route('**/api/discussions**', (route) =>
      route.fulfill({
        status: 503,
        contentType: 'application/json',
        body: '{"code":"UNAVAILABLE","message":"x"}',
      }),
    );
    await page.getByRole('combobox').click();
    await page.getByRole('option', { name: 'Plus anciennes' }).click();

    const alert = page
      .getByRole('alert')
      .filter({ hasText: 'Le serveur de contenu est indisponible.' });
    await expect(alert).toBeVisible({ timeout: 15_000 });
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Discussions');
    await expect(page.getByRole('navigation', { name: 'Espaces' }).first()).toBeVisible();
    await expect(page.getByText('Cet espace')).toBeVisible();
    await expect(page.locator('article')).toHaveCount(0);

    await page.unroute('**/api/discussions**');
    await alert.getByRole('button', { name: 'Réessayer' }).click();
    await expect(page.locator('article').first()).toBeVisible({ timeout: 15_000 });
    await expect(alert).toHaveCount(0);
  });
});
