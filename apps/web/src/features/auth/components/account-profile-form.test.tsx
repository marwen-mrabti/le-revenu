import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { ApiError } from '@/lib/api/client';
import { renderWithIntl } from '@/test/render-with-intl';

import { AccountProfileForm } from './account-profile-form';

const mutateAsync = vi.fn();
vi.mock('../api/mutations', () => ({ useUpdateAccount: () => ({ mutateAsync }) }));

const user = {
  documentId: 'u1',
  username: 'alice',
  email: 'alice@demo.lerevenu.test',
  displayName: null,
  avatarUrl: null,
  provider: 'local',
};

describe('AccountProfileForm', () => {
  it('starts from the current values and saves a display name', async () => {
    mutateAsync.mockResolvedValueOnce({ user: { ...user, displayName: 'Alice Martin' } });
    renderWithIntl(<AccountProfileForm user={user} />, { locale: 'fr' });
    expect(screen.getByLabelText("Nom d'utilisateur")).toHaveValue('alice');
    await userEvent.type(screen.getByLabelText('Nom affiché'), 'Alice Martin');
    await userEvent.click(screen.getByRole('button', { name: 'Enregistrer' }));
    await waitFor(() =>
      expect(mutateAsync).toHaveBeenCalledWith({ username: 'alice', displayName: 'Alice Martin' }),
    );
    expect(await screen.findByRole('status')).toHaveTextContent('Profil enregistré.');
  });

  it('refuses a one-letter display name', async () => {
    renderWithIntl(<AccountProfileForm user={user} />, { locale: 'fr' });
    await userEvent.type(screen.getByLabelText('Nom affiché'), 'A');
    await userEvent.tab();
    expect(await screen.findByText('2 à 60 caractères.')).toBeInTheDocument();
    expect(mutateAsync).not.toHaveBeenCalled();
  });

  it('puts a taken username on its field', async () => {
    mutateAsync.mockRejectedValueOnce(
      new ApiError(409, 'ALREADY_TAKEN', 'taken', { username: ['alreadyTaken'] }),
    );
    renderWithIntl(<AccountProfileForm user={user} />, { locale: 'en' });
    const username = screen.getByLabelText('Username');
    await userEvent.clear(username);
    await userEvent.type(username, 'bob');
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));
    await waitFor(() => expect(username).toHaveAttribute('aria-invalid', 'true'));
  });
});
