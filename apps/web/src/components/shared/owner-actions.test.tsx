import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { renderWithIntl } from '@/test/render-with-intl';

import { OwnerActions } from './owner-actions';

describe('OwnerActions', () => {
  it('edits at once, and deletes only after the dialog is confirmed', async () => {
    const onEdit = vi.fn();
    const onDelete = vi.fn().mockResolvedValue(undefined);
    renderWithIntl(
      <OwnerActions
        subject="Réponse de alice"
        onEdit={onEdit}
        onDelete={onDelete}
        deleteTitle="Supprimer cette réponse ?"
        deleteDescription="Irréversible."
      />,
      { locale: 'fr' },
    );
    await userEvent.click(screen.getByRole('button', { name: 'Modifier : Réponse de alice' }));
    expect(onEdit).toHaveBeenCalled();

    await userEvent.click(screen.getByRole('button', { name: 'Supprimer : Réponse de alice' }));
    const dialog = await screen.findByRole('alertdialog');
    expect(dialog).toHaveTextContent('Supprimer cette réponse ?');
    await userEvent.click(screen.getByRole('button', { name: 'Annuler' }));
    await waitFor(() => expect(screen.queryByRole('alertdialog')).toBeNull());
    expect(onDelete).not.toHaveBeenCalled();

    await userEvent.click(screen.getByRole('button', { name: 'Supprimer : Réponse de alice' }));
    await screen.findByRole('alertdialog');
    await userEvent.click(screen.getByRole('button', { name: 'Supprimer' }));
    await waitFor(() => expect(onDelete).toHaveBeenCalled());
  });
});
