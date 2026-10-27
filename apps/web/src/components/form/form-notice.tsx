import { CheckCircle2Icon } from 'lucide-react';

/** A positive form-level message (confirmed, saved, sent). */
export function FormNotice({ message }: { message: React.ReactNode | null }) {
  if (!message) return null;
  return (
    <div
      role="status"
      className="flex items-start gap-2.5 rounded-lg bg-emerald-600/10 px-3 py-2.5 text-sm font-medium text-emerald-700 dark:text-emerald-400"
    >
      <CheckCircle2Icon aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
      <span>{message}</span>
    </div>
  );
}
