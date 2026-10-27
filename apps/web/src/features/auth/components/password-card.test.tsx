import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { ApiError } from '@/lib/api/client';
import { renderWithIntl } from '@/test/render-with-intl';

import { PasswordCard } from './password-card';

const setPassword = vi.fn();
const changePassword = vi.fn();
vi.mock('../api/mutations', () => ({
  useSetPassword: () => ({ mutateAsync: setPassword }),
  useChangePassword: () => ({ mutateAsync: changePassword }),
}));

describe('PasswordCard', () => {
  it('shows the change form when a password exists', () => {
    renderWithIntl(<PasswordCard hasPassword />, { locale: 'fr' });
    expect(screen.getByLabelText('Mot de passe actuel')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Définir mon mot de passe' })).toBeNull();
  });

  it('lets a Google account set its first password, then switches to the change form', async () => {
    setPassword.mockResolvedValueOnce({ ok: true });
    renderWithIntl(<PasswordCard hasPassword={false} />, { locale: 'fr' });
    expect(screen.queryByLabelText('Mot de passe actuel')).toBeNull();
    await userEvent.type(screen.getByLabelText('Nouveau mot de passe'), 'GoogleThenLocal2026!');
    await userEvent.type(
      screen.getByLabelText('Confirmer le mot de passe'),
      'GoogleThenLocal2026!',
    );
    await userEvent.click(screen.getByRole('button', { name: 'Définir mon mot de passe' }));
    await waitFor(() =>
      expect(setPassword).toHaveBeenCalledWith({
        password: 'GoogleThenLocal2026!',
        passwordConfirmation: 'GoogleThenLocal2026!',
      }),
    );
    expect(await screen.findByRole('status')).toHaveTextContent('Mot de passe défini.');
    expect(screen.getByLabelText('Mot de passe actuel')).toBeInTheDocument();
  });

  it('flags a mismatch and shows a server error', async () => {
    renderWithIntl(<PasswordCard hasPassword={false} />, { locale: 'en' });
    await userEvent.type(screen.getByLabelText('New password'), 'GoogleThenLocal2026!');
    await userEvent.type(screen.getByLabelText('Confirm password'), 'GoogleThenLocal2026');
    await userEvent.click(screen.getByRole('button', { name: 'Set my password' }));
    expect(await screen.findByText('The two passwords do not match.')).toBeInTheDocument();
    expect(setPassword).not.toHaveBeenCalled();

    setPassword.mockRejectedValueOnce(new ApiError(409, 'ALREADY_SET', 'already'));
    await userEvent.clear(screen.getByLabelText('Confirm password'));
    await userEvent.type(screen.getByLabelText('Confirm password'), 'GoogleThenLocal2026!');
    await userEvent.click(screen.getByRole('button', { name: 'Set my password' }));
    expect(await screen.findByRole('alert')).toBeInTheDocument();
  });
});
