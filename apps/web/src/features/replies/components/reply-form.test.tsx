import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { ApiError } from '@/lib/api/client';
import { renderWithIntl } from '@/test/render-with-intl';

import { ReplyForm } from './reply-form';

const refresh = vi.fn();
const mutateAsync = vi.fn();
vi.mock('@/i18n/navigation', () => ({
  useRouter: () => ({ refresh, push: vi.fn() }),
  Link: ({
    href,
    children,
  }: {
    href: string | { pathname: string };
    children: React.ReactNode;
  }) => <a href={typeof href === 'string' ? href : href.pathname}>{children}</a>,
}));
vi.mock('../api/mutations', () => ({ useCreateReply: () => ({ mutateAsync }) }));

const user = {
  documentId: 'u1',
  username: 'alice',
  email: 'alice@demo.lerevenu.test',
  displayName: null,
  avatarUrl: null,
  provider: 'local',
};
const props = {
  discussionId: 'd1',
  discussionType: 'question' as const,
  authorName: 'bob',
  user,
  currentPath: '/discussions/pea',
};

describe('ReplyForm', () => {
  it('names the reader, counts the characters and refuses a one-letter reply', async () => {
    renderWithIntl(<ReplyForm {...props} />, { locale: 'fr' });
    expect(screen.getByText('alice')).toBeInTheDocument();
    const box = screen.getByLabelText('Votre réponse');
    expect(box).toHaveAttribute('placeholder', 'Partagez votre expérience pour aider bob…');
    await userEvent.type(box, 'M');
    expect(screen.getByRole('status')).toHaveTextContent('1 / 5000');
    await userEvent.tab();
    expect(await screen.findByText('2 caractères minimum.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Publier ma réponse' })).toBeDisabled();
    expect(mutateAsync).not.toHaveBeenCalled();
    // Typing a fix re-enables the button at once, without another blur.
    await userEvent.type(box, 'erci pour ces conseils.');
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Publier ma réponse' })).toBeEnabled(),
    );
    expect(screen.queryByText('2 caractères minimum.')).toBeNull();
  });

  it('posts, empties the box and refreshes the page', async () => {
    mutateAsync.mockResolvedValueOnce({
      reply: { documentId: 'r1', content: 'Le PEA.', createdAt: '', updatedAt: '', author: null },
    });
    renderWithIntl(<ReplyForm {...props} />, { locale: 'fr' });
    const box = screen.getByLabelText('Votre réponse');
    await userEvent.type(box, 'Le PEA, sans hésiter.');
    await userEvent.click(screen.getByRole('button', { name: 'Publier ma réponse' }));
    await waitFor(() =>
      expect(mutateAsync).toHaveBeenCalledWith({
        content: 'Le PEA, sans hésiter.',
        discussion: 'd1',
      }),
    );
    await waitFor(() => expect(refresh).toHaveBeenCalled());
    expect(box).toHaveValue('');
  });

  it('keeps the text and offers to sign in again when the session is gone', async () => {
    mutateAsync.mockRejectedValueOnce(new ApiError(401, 'UNAUTHENTICATED', 'expired'));
    renderWithIntl(<ReplyForm {...props} />, { locale: 'en' });
    const box = screen.getByLabelText('Your reply');
    await userEvent.type(box, 'Still here after the error.');
    await userEvent.click(screen.getByRole('button', { name: 'Post my reply' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Your session has expired');
    expect(screen.getByRole('link', { name: 'Sign in again' })).toHaveAttribute(
      'href',
      expect.stringContaining('/login'),
    );
    expect(box).toHaveValue('Still here after the error.');
  });
});
