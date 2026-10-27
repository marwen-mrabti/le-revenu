import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { ApiError } from '@/lib/api/client';
import { renderWithIntl } from '@/test/render-with-intl';

import { ChangePasswordForm } from './change-password-form';

const mutateAsync = vi.fn();
vi.mock('../api/mutations', () => ({ useChangePassword: () => ({ mutateAsync }) }));

async function fill(current: string, next: string, confirm = next) {
  await userEvent.type(screen.getByLabelText('Mot de passe actuel'), current);
  await userEvent.type(screen.getByLabelText('Nouveau mot de passe'), next);
  await userEvent.type(screen.getByLabelText('Confirmer le mot de passe'), confirm);
  await userEvent.click(screen.getByRole('button', { name: 'Changer le mot de passe' }));
}

describe('ChangePasswordForm', () => {
  it('refuses the same password again, before calling the server', async () => {
    renderWithIntl(<ChangePasswordForm />, { locale: 'fr' });
    await fill('Password123!', 'Password123!');
    expect(
      await screen.findByText("Le nouveau mot de passe doit être différent de l'actuel."),
    ).toBeInTheDocument();
    expect(mutateAsync).not.toHaveBeenCalled();
  });

  it('shows the server verdict on the current-password field', async () => {
    mutateAsync.mockRejectedValueOnce(
      new ApiError(401, 'INVALID_CREDENTIALS', 'wrong', {
        currentPassword: ['currentPasswordWrong'],
      }),
    );
    renderWithIntl(<ChangePasswordForm />, { locale: 'fr' });
    await fill('Wrong123!', 'NouveauMdp2026!');
    expect(await screen.findByText('Mot de passe actuel incorrect.')).toBeInTheDocument();
  });

  it('clears the fields after a successful change', async () => {
    mutateAsync.mockResolvedValueOnce({ user: { documentId: 'u1', username: 'alice' } });
    renderWithIntl(<ChangePasswordForm />, { locale: 'fr' });
    await fill('Password123!', 'NouveauMdp2026!');
    await waitFor(() =>
      expect(mutateAsync).toHaveBeenCalledWith({
        currentPassword: 'Password123!',
        password: 'NouveauMdp2026!',
        passwordConfirmation: 'NouveauMdp2026!',
      }),
    );
    expect(await screen.findByRole('status')).toHaveTextContent('Mot de passe changé.');
    expect(screen.getByLabelText('Mot de passe actuel')).toHaveValue('');
  });
});
