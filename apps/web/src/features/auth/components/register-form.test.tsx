import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { ApiError } from '@/lib/api/client';
import { renderWithIntl } from '@/test/render-with-intl';

import { RegisterForm } from './register-form';

const push = vi.fn();
const mutateAsync = vi.fn();
vi.mock('@/i18n/navigation', () => ({
  useRouter: () => ({ push }),
  Link: ({ href, children }: { href: unknown; children: React.ReactNode }) => (
    <a href={String(href)}>{children}</a>
  ),
}));
vi.mock('@/lib/toast', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock('../api/mutations', () => ({ useRegister: () => ({ mutateAsync }) }));

async function fill(username = 'claire', email = 'claire@exemple.fr', password = 'Password123!') {
  await userEvent.type(screen.getByLabelText("Nom d'utilisateur"), username);
  await userEvent.type(screen.getByLabelText('E-mail'), email);
  await userEvent.type(screen.getByLabelText('Mot de passe'), password);
}

describe('RegisterForm', () => {
  it('enforces the password rule before any request', async () => {
    renderWithIntl(<RegisterForm next="/discussions" />, { locale: 'fr' });
    await fill('claire', 'claire@exemple.fr', '1234567');
    await userEvent.tab();
    expect(await screen.findByText('8 caractères minimum.')).toBeInTheDocument();
    expect(mutateAsync).not.toHaveBeenCalled();
  });

  it('puts a 409 from the server on the email field', async () => {
    mutateAsync.mockRejectedValueOnce(
      new ApiError(409, 'ALREADY_TAKEN', 'taken', { email: ['alreadyTaken'] }),
    );
    renderWithIntl(<RegisterForm next="/discussions" />, { locale: 'fr' });
    await fill();
    await userEvent.click(screen.getByRole('button', { name: 'Créer mon compte' }));
    expect(
      await screen.findByText("Cet e-mail ou ce nom d'utilisateur est déjà utilisé."),
    ).toBeInTheDocument();
    expect(screen.getByLabelText('E-mail')).toHaveAttribute('aria-invalid', 'true');
  });

  it('creates the account and navigates', async () => {
    mutateAsync.mockResolvedValueOnce({
      user: { documentId: 'u9', username: 'claire', email: 'claire@exemple.fr' },
    });
    renderWithIntl(<RegisterForm next="/discussions" />, { locale: 'fr' });
    await fill();
    await userEvent.click(screen.getByRole('button', { name: 'Créer mon compte' }));
    await waitFor(() => expect(push).toHaveBeenCalledWith('/discussions'));
  });
});
