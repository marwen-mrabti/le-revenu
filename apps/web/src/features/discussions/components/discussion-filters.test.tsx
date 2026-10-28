import { screen } from '@testing-library/react';
import { NuqsTestingAdapter } from 'nuqs/adapters/testing';
import { describe, expect, it } from 'vitest';

import { renderWithIntl } from '@/test/render-with-intl';

import { DiscussionFilters } from './discussion-filters';

/** The sort select must show the translated label of the current value, never the raw value. */
describe('DiscussionFilters', () => {
  it('shows the French label of the default sort', () => {
    renderWithIntl(
      <NuqsTestingAdapter searchParams="">
        <DiscussionFilters />
      </NuqsTestingAdapter>,
    );
    const sort = screen.getByRole('combobox', { name: 'Trier' });
    expect(sort).toHaveTextContent('Plus récentes');
    expect(sort).not.toHaveTextContent('newest');
  });

  it('shows the English label of the sort read from the URL', () => {
    renderWithIntl(
      <NuqsTestingAdapter searchParams="?sort=oldest">
        <DiscussionFilters />
      </NuqsTestingAdapter>,
      { locale: 'en' },
    );
    expect(screen.getByRole('combobox', { name: 'Sort' })).toHaveTextContent('Oldest');
  });
});
