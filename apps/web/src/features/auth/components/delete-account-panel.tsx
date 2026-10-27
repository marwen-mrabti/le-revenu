'use client';

import { useTranslations } from 'next-intl';
import { useId, useState } from 'react';

import { FormAlert } from '@/components/form/form-alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useApiErrorMessage } from '@/hooks/use-api-error-message';
import { useRouter } from '@/i18n/navigation';
import { toast } from '@/lib/toast';

import { useDeleteAccount } from '../api/mutations';

/** Red zone: the button reveals a confirmation that needs the exact username before it enables. */
export function DeleteAccountPanel({ username }: { username: string }) {
  const t = useTranslations('Account');
  const errorMessage = useApiErrorMessage();
  const router = useRouter();
  const remove = useDeleteAccount();
  const id = useId();
  const [open, setOpen] = useState(false);
  const [typed, setTyped] = useState('');
  const [error, setError] = useState<string | null>(null);
  const confirmed = typed === username;

  function onDelete() {
    setError(null);
    remove.mutate(
      { username: typed },
      {
        onSuccess: () => {
          toast.success(t('deleted'));
          router.push('/discussions');
        },
        onError: (failure) => setError(errorMessage(failure)),
      },
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-secondary-foreground">{t('deleteIntro')}</p>
      {!open ? (
        <div>
          <Button variant="destructive" onClick={() => setOpen(true)}>
            {t('deleteButton')}
          </Button>
        </div>
      ) : (
        <div
          role="group"
          aria-labelledby={`${id}-title`}
          className="flex flex-col gap-3 rounded-lg border border-destructive/40 p-4"
        >
          <p id={`${id}-title`} className="font-semibold">
            {t('deleteConfirmTitle')}
          </p>
          <p className="text-sm text-muted-foreground">
            {t.rich('deleteConfirmHint', {
              username,
              b: (chunks) => <b className="text-foreground">{chunks}</b>,
            })}
          </p>
          <label htmlFor={`${id}-input`} className="text-sm font-medium">
            {t('deleteConfirmLabel')}
          </label>
          <Input
            id={`${id}-input`}
            value={typed}
            onChange={(event) => setTyped(event.target.value)}
            autoComplete="off"
            className="h-10"
          />
          <FormAlert message={error} />
          <div className="flex justify-end gap-2.5">
            <Button variant="secondary" onClick={() => setOpen(false)}>
              {t('cancel')}
            </Button>
            <Button
              variant="destructive"
              disabled={!confirmed || remove.isPending}
              onClick={onDelete}
            >
              {t('deleteButton')}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
