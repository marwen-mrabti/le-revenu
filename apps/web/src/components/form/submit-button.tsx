'use client';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Spinner } from '@/components/ui/spinner';
import { useFormContext } from '@/hooks/form-context';

/** Disabled while the form is invalid or submitting; shows a spinner and the pending label meanwhile. */
export function SubmitButton({
  children,
  pendingLabel,
  className,
}: {
  children: string;
  pendingLabel: string;
  /** Full width by default (auth cards); pass a width to right-align inside a wider form. */
  className?: string;
}) {
  const form = useFormContext();
  return (
    <form.Subscribe selector={(state) => [state.canSubmit, state.isSubmitting] as const}>
      {([canSubmit, isSubmitting]) => (
        <Button
          type="submit"
          size="lg"
          className={cn('h-10 w-full', className)}
          disabled={!canSubmit || isSubmitting}
          aria-busy={isSubmitting || undefined}
        >
          {isSubmitting ? <Spinner aria-hidden="true" /> : null}
          {isSubmitting ? pendingLabel : children}
        </Button>
      )}
    </form.Subscribe>
  );
}
