import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { renderWithIntl } from '@/test/render-with-intl';

import LocaleError from './error';

vi.mock('@/i18n/navigation', () => ({
  Link: ({ href, children }: { href: string; children: React.ReactNode }) => (
    <a href={href}>{children}</a>
  ),
}));

describe('500 page', () => {
  it('shows the incident code, retries on click and keeps a way out', async () => {
    const reset = vi.fn();
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const error = Object.assign(new Error('db down'), { digest: '3f9c2a1b' });
    renderWithIntl(<LocaleError error={error} reset={reset} />, { locale: 'fr' });

    expect(screen.getByRole('alert')).toHaveTextContent(
      "Quelque chose s'est mal passé de notre côté.",
    );
    expect(screen.getByText('3f9c2a1b')).toBeInTheDocument();
    expect(screen.queryByText('db down')).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Voir les discussions' })).toHaveAttribute(
      'href',
      '/discussions',
    );
    await userEvent.click(screen.getByRole('button', { name: 'Réessayer' }));
    expect(reset).toHaveBeenCalledTimes(1);
  });
});
