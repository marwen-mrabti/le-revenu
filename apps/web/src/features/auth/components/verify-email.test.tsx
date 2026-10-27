import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { renderWithIntl } from '@/test/render-with-intl';

import { VerifyEmail } from './verify-email';

const mutate = vi.fn();
vi.mock('@/i18n/navigation', () => ({
  Link: ({ href, children }: { href: unknown; children: React.ReactNode }) => (
    <a href={String(href)}>{children}</a>
  ),
}));
vi.mock('../api/mutations', () => ({ useSendConfirmation: () => ({ mutate, isPending: false }) }));

describe('VerifyEmail', () => {
  it('names the address and resends once, then rests a minute', async () => {
    mutate.mockImplementation((_input, options) => options.onSuccess());
    renderWithIntl(<VerifyEmail email="claire@exemple.fr" />, { locale: 'fr' });
    expect(screen.getByText('claire@exemple.fr')).toBeInTheDocument();
    const button = screen.getByRole('button', { name: 'Renvoyer le lien' });
    await userEvent.click(button);
    expect(mutate).toHaveBeenCalledWith({ email: 'claire@exemple.fr' }, expect.anything());
    expect(await screen.findByRole('status')).toHaveTextContent('Lien renvoyé.');
    expect(screen.getByRole('button', { name: /Renvoyer le lien \(\d+ s\)/ })).toBeDisabled();
  });
});
