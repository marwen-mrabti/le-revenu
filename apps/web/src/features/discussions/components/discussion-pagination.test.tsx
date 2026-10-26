import { screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { renderWithIntl } from '@/test/render-with-intl';

import { DiscussionPagination, windowOf } from './discussion-pagination';

vi.mock('@/i18n/navigation', () => ({
  Link: ({ href, children, ...props }: React.ComponentProps<'a'>) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

const filters = {
  sort: 'oldest' as const,
  page: 2,
  pageSize: 10,
  category: 'bourse',
  q: undefined,
};

describe('windowOf', () => {
  it('keeps first, last and the neighbours, with gaps', () => {
    expect(windowOf(1, 1)).toEqual([1]);
    expect(windowOf(1, 3)).toEqual([1, 2, 3]);
    expect(windowOf(5, 9)).toEqual([1, 'gap', 4, 5, 6, 'gap', 9]);
    expect(windowOf(9, 9)).toEqual([1, 'gap', 8, 9]);
  });
});

describe('DiscussionPagination', () => {
  it('renders nothing for a single page', () => {
    const { container } = renderWithIntl(
      <DiscussionPagination
        filters={filters}
        pagination={{ page: 1, pageSize: 10, pageCount: 1, total: 4 }}
      />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('marks the current page and keeps the other filters in every link', () => {
    renderWithIntl(
      <DiscussionPagination
        filters={filters}
        pagination={{ page: 2, pageSize: 10, pageCount: 3, total: 25 }}
      />,
      { locale: 'fr' },
    );
    expect(screen.getByRole('link', { name: '2' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('link', { name: '3' })).toHaveAttribute(
      'href',
      '/discussions?category=bourse&sort=oldest&page=3',
    );
    expect(screen.getByRole('link', { name: 'Précédente' })).toHaveAttribute(
      'href',
      '/discussions?category=bourse&sort=oldest',
    );
  });

  it('disables previous on the first page and next on the last', () => {
    renderWithIntl(
      <DiscussionPagination
        filters={{ ...filters, page: 1 }}
        pagination={{ page: 1, pageSize: 10, pageCount: 2, total: 18 }}
      />,
      { locale: 'en' },
    );
    expect(screen.getByRole('link', { name: 'Previous' })).toHaveAttribute('aria-disabled', 'true');
    expect(screen.getByRole('link', { name: 'Next' })).not.toHaveAttribute('aria-disabled');
  });
});
