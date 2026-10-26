import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { renderWithIntl } from '@/test/render-with-intl';

import { UserMenu } from './user-menu';

const mutate = vi.fn();
vi.mock('@/lib/toast', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock('../api/mutations', () => ({ useLogout: () => ({ mutate, isPending: false }) }));

const user = { documentId: 'u1', username: 'alice', email: 'alice@demo.lerevenu.test' };

describe('UserMenu', () => {
  it('shows the username and signs out from the menu', async () => {
    renderWithIntl(<UserMenu user={user} />, { locale: 'fr' });
    const trigger = screen.getByRole('button', { name: 'Compte' });
    expect(trigger).toHaveTextContent('alice');
    await userEvent.click(trigger);
    expect(await screen.findByText('alice@demo.lerevenu.test')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('menuitem', { name: 'Se déconnecter' }));
    expect(mutate).toHaveBeenCalled();
  });
});
