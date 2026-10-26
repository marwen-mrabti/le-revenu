import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { LocaleMenu } from '@/components/layout/locale-menu';
import { renderWithIntl } from '@/test/render-with-intl';

const replace = vi.fn();
vi.mock('@/i18n/navigation', () => ({
  usePathname: () => '/discussions',
  useRouter: () => ({ replace }),
}));
vi.mock('next-themes', () => ({
  useTheme: () => ({ theme: 'system', setTheme: vi.fn() }),
}));

describe('LocaleMenu', () => {
  it('shows the current language and lists both locales with the current one checked', async () => {
    renderWithIntl(<LocaleMenu />, { locale: 'fr' });
    const trigger = screen.getByRole('button', { name: 'Langue' });
    expect(trigger).toHaveTextContent('Français');

    await userEvent.click(trigger);
    const french = await screen.findByRole('menuitemradio', { name: /Français/ });
    const english = screen.getByRole('menuitemradio', { name: /English/ });
    expect(french).toHaveAttribute('aria-checked', 'true');
    expect(english).toHaveAttribute('aria-checked', 'false');
  });

  it('switches locale keeping the path and search params', async () => {
    window.history.replaceState({}, '', '/discussions?sort=oldest');
    renderWithIntl(<LocaleMenu />, { locale: 'fr' });
    await userEvent.click(screen.getByRole('button', { name: 'Langue' }));
    await userEvent.click(await screen.findByRole('menuitemradio', { name: /English/ }));
    expect(replace).toHaveBeenCalledWith('/discussions?sort=oldest', { locale: 'en' });
  });

  it('offers the three theme choices', async () => {
    renderWithIntl(<LocaleMenu />, { locale: 'en' });
    await userEvent.click(screen.getByRole('button', { name: 'Language' }));
    for (const name of ['Light', 'Dark', 'System']) {
      expect(await screen.findByRole('menuitemradio', { name })).toBeInTheDocument();
    }
  });
});
