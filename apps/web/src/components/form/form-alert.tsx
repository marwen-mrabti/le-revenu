import { AlertTriangleIcon } from 'lucide-react';

/** A form-level error, announced to assistive tech. */
export function FormAlert({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <div
      role="alert"
      className="flex items-start gap-2.5 rounded-lg bg-destructive/10 px-3 py-2.5 text-sm font-medium text-destructive"
    >
      <AlertTriangleIcon aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
      <span>{message}</span>
    </div>
  );
}
