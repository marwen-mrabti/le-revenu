import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { renderWithIntl } from '@/test/render-with-intl';

import { DeleteAccountPanel } from './delete-account-panel';

const push = vi.fn();
const mutate = vi.fn();
vi.mock('@/i18n/navigation', () => ({ useRouter: () => ({ push }) }));
vi.mock('@/lib/toast', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock('../api/mutations', () => ({ useDeleteAccount: () => ({ mutate, isPending: false }) }));

describe('DeleteAccountPanel', () => {
  it('enables the final button only once the exact username is typed', async () => {
    mutate.mockImplementation((_input, options) => options.onSuccess());
    renderWithIntl(<DeleteAccountPanel username="alice" />, { locale: 'fr' });
    await userEvent.click(screen.getByRole('button', { name: 'Supprimer mon compte' }));
    const confirm = screen.getAllByRole('button', { name: 'Supprimer mon compte' }).at(-1)!;
    expect(confirm).toBeDisabled();
    const input = screen.getByLabelText("Nom d'utilisateur");
    await userEvent.type(input, 'alic');
    expect(confirm).toBeDisabled();
    await userEvent.type(input, 'e');
    expect(confirm).toBeEnabled();
    await userEvent.click(confirm);
    expect(mutate).toHaveBeenCalledWith({ username: 'alice' }, expect.anything());
    expect(push).toHaveBeenCalledWith('/discussions');
  });
});
