import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { ContentParagraphs } from './content-paragraphs';

describe('ContentParagraphs', () => {
  it('splits on blank lines and never injects HTML', () => {
    const { container } = render(
      <ContentParagraphs text={'Un.\n\n\nDeux <b>gras</b>\nsuite.\n\n'} />,
    );
    expect(container.querySelectorAll('p')).toHaveLength(2);
    expect(screen.getByText(/Deux <b>gras<\/b>/)).toBeInTheDocument();
    expect(container.querySelector('b')).toBeNull();
  });
});
