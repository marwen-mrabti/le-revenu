import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { ApiError } from '@/lib/api/client';
import { renderWithIntl } from '@/test/render-with-intl';

import { DiscussionForm } from './discussion-form';

const push = vi.fn();
const mutateAsync = vi.fn();
vi.mock('@/i18n/navigation', () => ({
  useRouter: () => ({ push, refresh: vi.fn() }),
  Link: ({
    href,
    children,
  }: {
    href: string | { pathname: string };
    children: React.ReactNode;
  }) => <a href={typeof href === 'string' ? href : href.pathname}>{children}</a>,
}));
vi.mock('@/lib/toast', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock('../api/mutations', () => ({ useCreateDiscussion: () => ({ mutateAsync }) }));

const spaces = [
  { documentId: 'c1', name: 'Bourse & actions' },
  { documentId: 'c2', name: 'Retraite' },
];

describe('DiscussionForm', () => {
  it('starts with a question, a disabled button and no error shown', () => {
    renderWithIntl(<DiscussionForm spaces={spaces} initialCategory="" />, { locale: 'fr' });
    expect(screen.getByRole('radio', { name: /Poser une question/ })).toBeChecked();
    expect(screen.getByRole('button', { name: 'Publier' })).toBeDisabled();
    expect(screen.queryByText('10 caractères minimum.')).toBeNull();
    expect(screen.getByRole('combobox', { name: 'Espace' })).toHaveValue('');
  });

  it('preselects the space and shows each rule on blur', async () => {
    renderWithIntl(<DiscussionForm spaces={spaces} initialCategory="c2" />, { locale: 'fr' });
    expect(screen.getByRole('combobox', { name: 'Espace' })).toHaveValue('c2');
    await userEvent.type(screen.getByLabelText('Titre'), 'PEA ou CT');
    await userEvent.tab();
    expect(await screen.findByText('10 caractères minimum.')).toBeInTheDocument();
    await userEvent.click(screen.getByLabelText('Contenu'));
    await userEvent.tab();
    expect(await screen.findByText('Ce champ est obligatoire.')).toBeInTheDocument();
    expect(mutateAsync).not.toHaveBeenCalled();
  });

  it('publishes and goes to the new discussion', async () => {
    mutateAsync.mockResolvedValueOnce({ discussion: { slug: 'faut-il-ouvrir-un-per' } });
    renderWithIntl(<DiscussionForm spaces={spaces} initialCategory="" />, { locale: 'en' });
    await userEvent.click(screen.getByRole('radio', { name: /Start a discussion/ }));
    await userEvent.type(screen.getByLabelText('Title'), 'Should I open a PER at 45?');
    await userEvent.selectOptions(screen.getByRole('combobox', { name: 'Space' }), 'c1');
    await userEvent.type(screen.getByLabelText('Content'), 'Some context.');
    await waitFor(() => expect(screen.getByRole('button', { name: 'Publish' })).toBeEnabled());
    await userEvent.click(screen.getByRole('button', { name: 'Publish' }));
    await waitFor(() =>
      expect(mutateAsync).toHaveBeenCalledWith({
        type: 'discussion',
        title: 'Should I open a PER at 45?',
        content: 'Some context.',
        category: 'c1',
      }),
    );
    await waitFor(() => expect(push).toHaveBeenCalledWith('/discussions/faut-il-ouvrir-un-per'));
  });

  it('puts an unknown space on its field and keeps the text on an expired session', async () => {
    mutateAsync.mockRejectedValueOnce(
      new ApiError(422, 'VALIDATION', 'unknown', { category: ['categoryUnknown'] }),
    );
    renderWithIntl(<DiscussionForm spaces={spaces} initialCategory="c1" />, { locale: 'fr' });
    await userEvent.type(screen.getByLabelText('Titre'), 'Faut-il ouvrir un PER à 45 ans ?');
    await userEvent.type(screen.getByLabelText('Contenu'), 'Mon contexte.');
    await userEvent.click(screen.getByRole('button', { name: 'Publier' }));
    expect(
      await screen.findByText("Cet espace n'existe plus, choisissez-en un autre."),
    ).toBeInTheDocument();

    mutateAsync.mockRejectedValueOnce(new ApiError(401, 'UNAUTHENTICATED', 'expired'));
    await userEvent.selectOptions(screen.getByRole('combobox', { name: 'Espace' }), 'c2');
    await userEvent.click(screen.getByRole('button', { name: 'Publier' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Votre session a expiré');
    expect(screen.getByLabelText('Titre')).toHaveValue('Faut-il ouvrir un PER à 45 ans ?');
  });
});
