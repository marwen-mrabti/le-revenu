import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { LocaleSwitcher } from '@/components/layout/locale-switcher';
import { renderWithIntl } from '@/test/render-with-intl';

const replace = vi.fn();
vi.mock('@/i18n/navigation', () => ({
  usePathname: () => '/discussions',
  useRouter: () => ({ replace }),
}));

describe('LocaleSwitcher', () => {
  it('marks the current locale and switches to the other one keeping the path', async () => {
    window.history.replaceState({}, '', '/discussions?sort=newest');
    renderWithIntl(<LocaleSwitcher />, { locale: 'fr' });

    expect(screen.getByRole('button', { name: 'Français' })).toHaveAttribute(
      'aria-current',
      'true',
    );
    await userEvent.click(screen.getByRole('button', { name: 'English' }));

    expect(replace).toHaveBeenCalledWith('/discussions?sort=newest', { locale: 'en' });
  });

  it('does nothing when clicking the active locale', async () => {
    replace.mockClear();
    renderWithIntl(<LocaleSwitcher />, { locale: 'fr' });
    await userEvent.click(screen.getByRole('button', { name: 'Français' }));
    expect(replace).not.toHaveBeenCalled();
  });
});
