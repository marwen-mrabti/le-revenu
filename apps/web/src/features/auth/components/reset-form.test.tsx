import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { ApiError } from '@/lib/api/client';
import { renderWithIntl } from '@/test/render-with-intl';

import { ResetForm } from './reset-form';

const push = vi.fn();
const mutateAsync = vi.fn();
vi.mock('@/i18n/navigation', () => ({
  useRouter: () => ({ push }),
  Link: ({ href, children }: { href: unknown; children: React.ReactNode }) => (
    <a href={String(href)}>{children}</a>
  ),
}));
vi.mock('@/lib/toast', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock('../api/mutations', () => ({ useResetPassword: () => ({ mutateAsync }) }));

const CODE = 'a'.repeat(40);

describe('ResetForm', () => {
  it('shows the invalid-link state without a code', () => {
    renderWithIntl(<ResetForm code={null} />, { locale: 'fr' });
    expect(screen.getByRole('alert')).toHaveTextContent('Code de réinitialisation inconnu.');
    expect(screen.getByRole('link', { name: 'Demander un nouveau lien' })).toHaveAttribute(
      'href',
      '/forgot-password',
    );
  });

  it('flags a mismatch on the confirmation field', async () => {
    renderWithIntl(<ResetForm code={CODE} />, { locale: 'fr' });
    await userEvent.type(screen.getByLabelText('Nouveau mot de passe'), 'NouveauMdp2026!');
    await userEvent.type(screen.getByLabelText('Confirmer le mot de passe'), 'NouveauMdp2026');
    await userEvent.click(screen.getByRole('button', { name: 'Enregistrer et me connecter' }));
    expect(
      await screen.findByText('Les deux mots de passe ne correspondent pas.'),
    ).toBeInTheDocument();
    expect(mutateAsync).not.toHaveBeenCalled();
  });

  it('sends the code with the password and goes to the discussions', async () => {
    mutateAsync.mockResolvedValueOnce({
      user: { documentId: 'u1', username: 'alice', email: 'a@b.fr' },
    });
    renderWithIntl(<ResetForm code={CODE} />, { locale: 'fr' });
    await userEvent.type(screen.getByLabelText('Nouveau mot de passe'), 'NouveauMdp2026!');
    await userEvent.type(screen.getByLabelText('Confirmer le mot de passe'), 'NouveauMdp2026!');
    await userEvent.click(screen.getByRole('button', { name: 'Enregistrer et me connecter' }));
    await waitFor(() =>
      expect(mutateAsync).toHaveBeenCalledWith({
        code: CODE,
        password: 'NouveauMdp2026!',
        passwordConfirmation: 'NouveauMdp2026!',
      }),
    );
    await waitFor(() => expect(push).toHaveBeenCalledWith('/discussions'));
  });

  it('switches to the invalid-link state when the server rejects the code', async () => {
    mutateAsync.mockRejectedValueOnce(new ApiError(400, 'INVALID_CODE', 'Incorrect code provided'));
    renderWithIntl(<ResetForm code={CODE} />, { locale: 'en' });
    await userEvent.type(screen.getByLabelText('New password'), 'NouveauMdp2026!');
    await userEvent.type(screen.getByLabelText('Confirm password'), 'NouveauMdp2026!');
    await userEvent.click(screen.getByRole('button', { name: 'Save and sign me in' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Unknown reset code.');
  });
});
