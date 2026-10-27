import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { ApiError } from '@/lib/api/client';
import { renderWithIntl } from '@/test/render-with-intl';

import { LoginForm } from './login-form';

const push = vi.fn();
const mutateAsync = vi.fn();
vi.mock('@/i18n/navigation', () => ({
  useRouter: () => ({ push }),
  Link: ({ href, children }: { href: unknown; children: React.ReactNode }) => (
    <a href={String(href)}>{children}</a>
  ),
}));
vi.mock('@/lib/toast', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock('../api/mutations', () => ({ useLogin: () => ({ mutateAsync }) }));

describe('LoginForm', () => {
  it('shows a translated error on blur and keeps the button disabled', async () => {
    renderWithIntl(<LoginForm next="/discussions" />, { locale: 'fr' });
    const identifier = screen.getByLabelText("E-mail ou nom d'utilisateur");
    await userEvent.click(identifier);
    await userEvent.tab();
    expect(await screen.findByText('Ce champ est obligatoire.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Se connecter' })).toBeDisabled();
    expect(mutateAsync).not.toHaveBeenCalled();
  });

  it('submits, then navigates to next', async () => {
    mutateAsync.mockResolvedValueOnce({
      user: { documentId: 'u1', username: 'alice', email: 'a@b.fr' },
    });
    renderWithIntl(<LoginForm next="/discussions?category=bourse" />, { locale: 'fr' });
    await userEvent.type(screen.getByLabelText("E-mail ou nom d'utilisateur"), 'alice');
    await userEvent.type(screen.getByLabelText('Mot de passe'), 'Password123!');
    await userEvent.click(screen.getByRole('button', { name: 'Se connecter' }));
    await waitFor(() =>
      expect(mutateAsync).toHaveBeenCalledWith({ identifier: 'alice', password: 'Password123!' }),
    );
    await waitFor(() => expect(push).toHaveBeenCalledWith('/discussions?category=bourse'));
    // The page tree may be kept alive by the router: the credentials must not linger.
    expect(screen.getByLabelText("E-mail ou nom d'utilisateur")).toHaveValue('');
    expect(screen.getByLabelText('Mot de passe')).toHaveValue('');
  });

  it('shows the server verdict for a wrong password, without naming the field', async () => {
    mutateAsync.mockRejectedValueOnce(new ApiError(401, 'INVALID_CREDENTIALS', 'nope'));
    renderWithIntl(<LoginForm next="/discussions" />, { locale: 'en' });
    await userEvent.type(screen.getByLabelText('Email or username'), 'alice');
    await userEvent.type(screen.getByLabelText('Password'), 'wrong');
    await userEvent.click(screen.getByRole('button', { name: 'Sign in' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Wrong identifier or password.');
    expect(push).not.toHaveBeenCalledWith('/discussions');
  });

  it('shows the confirmation banner when arriving from the mail link', () => {
    renderWithIntl(<LoginForm next="/discussions" confirmed />, { locale: 'fr' });
    expect(screen.getByRole('status')).toHaveTextContent('Adresse confirmée.');
    expect(screen.getByRole('link', { name: 'Mot de passe oublié ?' })).toBeInTheDocument();
  });

  it('offers to resend the link when the address is not confirmed', async () => {
    mutateAsync.mockRejectedValueOnce(new ApiError(403, 'EMAIL_NOT_CONFIRMED', 'not confirmed'));
    renderWithIntl(<LoginForm next="/discussions" />, { locale: 'fr' });
    await userEvent.type(screen.getByLabelText("E-mail ou nom d'utilisateur"), 'claire@exemple.fr');
    await userEvent.type(screen.getByLabelText('Mot de passe'), 'Password123!');
    await userEvent.click(screen.getByRole('button', { name: 'Se connecter' }));
    expect(await screen.findByRole('alert')).toHaveTextContent("n'est pas encore confirmée");
    expect(screen.getByRole('link', { name: 'Renvoyer le lien' })).toBeInTheDocument();
  });
});
