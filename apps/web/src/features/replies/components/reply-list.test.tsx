import { screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import type { DiscussionDetail } from '@/features/discussions/schemas';
import { renderWithIntl } from '@/test/render-with-intl';

import { ReplyList } from './reply-list';

vi.mock('@/i18n/navigation', () => ({ useRouter: () => ({ refresh: vi.fn(), push: vi.fn() }) }));
vi.mock('@/lib/toast', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock('../api/mutations', () => ({
  useDeleteReply: () => ({ mutateAsync: vi.fn() }),
  useUpdateReply: () => ({ mutateAsync: vi.fn() }),
}));

const alice = { documentId: 'u1', username: 'alice', displayName: null, avatarUrl: null };
const bob = { documentId: 'u2', username: 'bob', displayName: 'Bob M.', avatarUrl: null };

const discussion: DiscussionDetail = {
  documentId: 'd1',
  title: 'PEA ou CTO ?',
  slug: 'pea-ou-cto',
  content: 'Je débute.',
  type: 'question',
  createdAt: '2026-10-25T10:00:00Z',
  updatedAt: '2026-10-25T10:00:00Z',
  author: alice,
  category: null,
  replies: [
    {
      documentId: 'r1',
      content: 'Le PEA.\n\nSans hésiter.',
      createdAt: '2026-10-25T11:00:00Z',
      updatedAt: '2026-10-25T11:00:00Z',
      author: bob,
    },
    {
      documentId: 'r2',
      content: 'Merci Bob.',
      createdAt: '2026-10-25T12:00:00Z',
      updatedAt: '2026-10-25T12:05:00Z',
      author: alice,
    },
  ],
};

describe('ReplyList', () => {
  it('counts the replies, shows paragraphs, the display name and the author chip', () => {
    renderWithIntl(<ReplyList discussion={discussion} authorName="alice" currentUserId="u1" />, {
      locale: 'fr',
    });
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('2 réponses');
    const first = screen.getByRole('article', { name: 'Réponse de Bob M.' });
    expect(first.querySelectorAll('p').length).toBeGreaterThanOrEqual(2);
    expect(first).not.toHaveTextContent('Auteur');
    const second = screen.getByRole('article', { name: 'Réponse de alice' });
    expect(second).toHaveTextContent('Auteur');
    expect(second).toHaveTextContent('modifié');
    // alice is the session reader: her reply has the actions, Bob's has none.
    expect(second.querySelectorAll('button').length).toBe(2);
    expect(first.querySelectorAll('button').length).toBe(0);
  });

  it('invites the first reply when there is none', () => {
    renderWithIntl(
      <ReplyList
        discussion={{ ...discussion, replies: [] }}
        authorName="alice"
        currentUserId={null}
      />,
      {
        locale: 'en',
      },
    );
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('No reply yet');
    expect(screen.getByText(/Be the first to help alice/)).toBeInTheDocument();
  });
});
