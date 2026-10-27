'use client';

import { PencilLineIcon, Trash2Icon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';

interface OwnerActionsProps {
  onEdit: () => void;
  onDelete: () => Promise<void>;
  deleteTitle: string;
  deleteDescription: string;
  /** Accessible context: "Modifier la réponse de alice". */
  subject: string;
}

/**
 * "Modifier · Supprimer" for the author of a post. The UI check is a
 * convenience; Strapi's is-owner policy is the authority.
 */
export function OwnerActions({
  onEdit,
  onDelete,
  deleteTitle,
  deleteDescription,
  subject,
}: OwnerActionsProps) {
  const t = useTranslations('Owner');
  const [open, setOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function confirm() {
    setDeleting(true);
    try {
      await onDelete();
      setOpen(false);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="ml-auto flex shrink-0 items-center gap-1">
      <Button variant="ghost" size="sm" onClick={onEdit} aria-label={t('editLabel', { subject })}>
        <PencilLineIcon aria-hidden="true" />
        {t('edit')}
      </Button>
      <Button
        variant="ghost"
        size="sm"
        className="text-destructive hover:text-destructive"
        onClick={() => setOpen(true)}
        aria-label={t('deleteLabel', { subject })}
      >
        <Trash2Icon aria-hidden="true" />
        {t('delete')}
      </Button>
      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{deleteTitle}</AlertDialogTitle>
            <AlertDialogDescription>{deleteDescription}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>{t('cancel')}</AlertDialogCancel>
            <AlertDialogAction variant="destructive" disabled={deleting} onClick={confirm}>
              {deleting ? t('deleting') : t('delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
