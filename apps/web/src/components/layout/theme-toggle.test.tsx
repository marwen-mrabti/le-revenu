import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { ThemeToggle } from '@/components/layout/theme-toggle';
import { renderWithIntl } from '@/test/render-with-intl';

const setTheme = vi.fn();
let resolvedTheme = 'light';
vi.mock('@/components/theme/theme-provider', () => ({
  useTheme: () => ({ resolvedTheme, setTheme }),
}));

describe('ThemeToggle', () => {
  it('offers dark when the page is light, and asks for it on click', async () => {
    resolvedTheme = 'light';
    renderWithIntl(<ThemeToggle />, { locale: 'fr' });
    const button = screen.getByRole('button', { name: 'Passer en thème sombre' });
    await userEvent.click(button);
    expect(setTheme).toHaveBeenCalledWith('dark');
  });

  it('offers light when the page is dark', async () => {
    resolvedTheme = 'dark';
    renderWithIntl(<ThemeToggle />, { locale: 'en' });
    await userEvent.click(screen.getByRole('button', { name: 'Switch to light theme' }));
    expect(setTheme).toHaveBeenCalledWith('light');
  });
});
