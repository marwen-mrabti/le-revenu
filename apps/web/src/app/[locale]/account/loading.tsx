import { Skeleton } from '@/components/ui/skeleton';

/** Page-shaped skeleton: header line, then three cards, while the session is read. */
export default function AccountLoading() {
  return (
    <main className="mx-auto w-full max-w-[720px] px-4 py-8" aria-busy="true">
      <Skeleton className="h-8 w-40" />
      <div className="mt-4 flex items-center gap-3.5">
        <Skeleton className="size-14 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-4 w-72" />
        </div>
      </div>
      {[0, 1, 2].map((i) => (
        <div key={i} className="mt-5 rounded-xl border border-border bg-card p-6">
          <Skeleton className="h-5 w-24" />
          <Skeleton className="mt-4 h-10 w-full" />
          <Skeleton className="mt-3 h-10 w-full" />
        </div>
      ))}
    </main>
  );
}
