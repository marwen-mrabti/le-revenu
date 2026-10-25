import { expect, test } from '@playwright/test';

test.describe('locale routing', () => {
  test('French is the default and has no prefix', async ({ page }) => {
    await page.goto('/discussions');
    await expect(page.locator('html')).toHaveAttribute('lang', 'fr');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(
      'La communauté des lecteurs du Revenu',
    );
  });

  test('English lives under /en', async ({ page }) => {
    await page.goto('/en/discussions');
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(
      "The Le Revenu readers' community",
    );
  });

  test('a superfluous /fr prefix redirects to the clean URL', async ({ page }) => {
    await page.goto('/fr/discussions');
    await expect(page).toHaveURL(/\/discussions$/);
  });

  test('an unknown locale is a 404', async ({ request }) => {
    const response = await request.get('/de/discussions');
    expect(response.status()).toBe(404);
  });

  test('the switcher changes locale and keeps the path', async ({ page }) => {
    await page.goto('/discussions');
    await page.getByRole('button', { name: 'English', exact: true }).click();
    await expect(page).toHaveURL(/\/en\/discussions$/);
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  });

  test('pages expose hreflang alternates and a localized title', async ({ page }) => {
    await page.goto('/en/discussions');
    await expect(page).toHaveTitle(/Discussions · Le Revenu Community/);
    await expect(page.locator('link[rel="alternate"][hreflang="fr"]')).toHaveCount(1);
    await expect(page.locator('link[rel="alternate"][hreflang="en"]')).toHaveCount(1);
  });

  test('sitemap and robots are served', async ({ request }) => {
    const sitemap = await request.get('/sitemap.xml');
    expect(sitemap.status()).toBe(200);
    expect(await sitemap.text()).toContain('/en/discussions');
    const robots = await request.get('/robots.txt');
    expect(await robots.text()).toContain('sitemap.xml');
  });
});
