import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { renderWithIntl } from '@/test/render-with-intl';

import { UserMenu } from './user-menu';

const mutate = vi.fn();
vi.mock('@/i18n/navigation', () => ({
  // Base UI merges the menu-item props into the rendered element: the mock must forward them.
  Link: ({ href, children, ...props }: { href: unknown; children: React.ReactNode }) => (
    <a href={String(href)} {...props}>
      {children}
    </a>
  ),
}));
vi.mock('@/lib/toast', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock('../api/mutations', () => ({ useLogout: () => ({ mutate, isPending: false }) }));

const user = {
  documentId: 'u1',
  username: 'alice',
  email: 'alice@demo.lerevenu.test',
  displayName: null,
  avatarUrl: null,
  provider: 'local',
};

describe('UserMenu', () => {
  it('shows the username and signs out from the menu', async () => {
    renderWithIntl(<UserMenu user={user} />, { locale: 'fr' });
    const trigger = screen.getByRole('button', { name: 'Compte' });
    expect(trigger).toHaveTextContent('alice');
    await userEvent.click(trigger);
    expect(await screen.findByText(/alice@demo\.lerevenu\.test/)).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: 'Mon compte' })).toHaveAttribute(
      'href',
      '/account',
    );
    await userEvent.click(screen.getByRole('menuitem', { name: 'Se déconnecter' }));
    expect(mutate).toHaveBeenCalled();
  });

  it('prefers the display name and shows the Google picture', () => {
    renderWithIntl(
      <UserMenu
        user={{
          ...user,
          displayName: 'Claire Nantes',
          avatarUrl: 'https://lh3.googleusercontent.com/a/photo',
          provider: 'google',
        }}
      />,
      { locale: 'fr' },
    );
    const trigger = screen.getByRole('button', { name: 'Compte' });
    expect(trigger).toHaveTextContent('Claire Nantes');
    expect(trigger).not.toHaveTextContent('alice');
  });
});
