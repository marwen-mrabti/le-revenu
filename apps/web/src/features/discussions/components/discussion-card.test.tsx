import { screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { renderWithIntl } from '@/test/render-with-intl';

import type { DiscussionListItem } from '../schemas';
import { DiscussionCard } from './discussion-card';

vi.mock('@/i18n/navigation', () => ({
  Link: ({ href, children, ...props }: React.ComponentProps<'a'>) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

const discussion: DiscussionListItem = {
  documentId: 'k7q2m9x1c0d3e4f5g6h7i8j9',
  title: 'Faut-il ouvrir un PER à 45 ans ?',
  slug: 'faut-il-ouvrir-un-per-a-45-ans',
  content: 'Mon taux actuel est plus élevé que les offres du moment.',
  type: 'question',
  createdAt: '2026-10-25T09:00:00Z',
  updatedAt: '2026-10-25T09:00:00Z',
  author: { documentId: 'u1', username: 'alice' },
  category: { documentId: 'c1', name: 'Retraite', slug: 'retraite', color: '#ff2d55' },
  replies: { count: 3 },
};

describe('DiscussionCard', () => {
  it('shows the five fields the brief asks for and links to the detail page', () => {
    renderWithIntl(<DiscussionCard discussion={discussion} />, { locale: 'fr' });
    expect(screen.getByRole('link', { name: discussion.title })).toHaveAttribute(
      'href',
      '/discussions/faut-il-ouvrir-un-per-a-45-ans',
    );
    expect(screen.getByText('Retraite')).toBeInTheDocument();
    expect(screen.getByText('alice')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('réponses')).toBeInTheDocument();
    expect(screen.getByText('il y a 3 heures')).toBeInTheDocument();
    expect(screen.getByText('Question')).toBeInTheDocument();
  });

  it('shows no type tag for a plain discussion and singular for one reply', () => {
    renderWithIntl(
      <DiscussionCard discussion={{ ...discussion, type: 'discussion', replies: { count: 1 } }} />,
      { locale: 'en' },
    );
    expect(screen.queryByText('Question')).not.toBeInTheDocument();
    expect(screen.getByText('reply')).toBeInTheDocument();
  });

  it('never renders an email or a numeric id', () => {
    const { container } = renderWithIntl(<DiscussionCard discussion={discussion} />);
    expect(container.innerHTML).not.toMatch(/@|"id"/);
  });
});
