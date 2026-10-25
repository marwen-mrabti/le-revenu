import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { RelativeTime } from '@/components/shared/relative-time';
import { renderWithIntl } from '@/test/render-with-intl';

const THREE_HOURS_AGO = new Date('2026-10-25T09:00:00Z');

describe('RelativeTime', () => {
  it('renders French relative time with a machine-readable datetime', () => {
    renderWithIntl(<RelativeTime date={THREE_HOURS_AGO} />, { locale: 'fr' });
    const time = screen.getByText(/il y a 3 heures/);
    expect(time).toHaveAttribute('datetime', THREE_HOURS_AGO.toISOString());
  });

  it('renders English relative time', () => {
    renderWithIntl(<RelativeTime date={THREE_HOURS_AGO.toISOString()} />, { locale: 'en' });
    expect(screen.getByText(/3 hours ago/)).toBeInTheDocument();
  });
});
