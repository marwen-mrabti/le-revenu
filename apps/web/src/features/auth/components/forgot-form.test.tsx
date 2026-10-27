import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { ApiError } from '@/lib/api/client';
import { renderWithIntl } from '@/test/render-with-intl';

import { ForgotForm } from './forgot-form';

const mutateAsync = vi.fn();
vi.mock('../api/mutations', () => ({ useForgotPassword: () => ({ mutateAsync }) }));

describe('ForgotForm', () => {
  it('refuses an invalid address before calling the server', async () => {
    renderWithIntl(<ForgotForm />, { locale: 'fr' });
    await userEvent.type(screen.getByLabelText('E-mail'), 'not-an-email');
    await userEvent.tab();
    expect(await screen.findByText('Adresse e-mail invalide.')).toBeInTheDocument();
    expect(mutateAsync).not.toHaveBeenCalled();
  });

  it('replaces the form with the same sentence whatever the server knows', async () => {
    mutateAsync.mockResolvedValueOnce({ ok: true });
    renderWithIntl(<ForgotForm />, { locale: 'en' });
    await userEvent.type(screen.getByLabelText('Email'), 'alice@demo.lerevenu.test');
    await userEvent.click(screen.getByRole('button', { name: 'Send the link' }));
    await waitFor(() =>
      expect(mutateAsync).toHaveBeenCalledWith({ email: 'alice@demo.lerevenu.test' }),
    );
    expect(await screen.findByRole('status')).toHaveTextContent('alice@demo.lerevenu.test');
    expect(screen.queryByLabelText('Email')).not.toBeInTheDocument();
  });

  it('shows the rate-limit message as a form error', async () => {
    mutateAsync.mockRejectedValueOnce(new ApiError(429, 'RATE_LIMITED', 'slow down'));
    renderWithIntl(<ForgotForm />, { locale: 'fr' });
    await userEvent.type(screen.getByLabelText('E-mail'), 'alice@demo.lerevenu.test');
    await userEvent.click(screen.getByRole('button', { name: 'Envoyer le lien' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Trop de');
  });
});
