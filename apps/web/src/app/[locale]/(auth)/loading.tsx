import { Skeleton } from '@/components/ui/skeleton';

/** Card-shaped skeleton: the shell streams instantly while the session and `next` are read. */
export default function AuthLoading() {
  return (
    <main className="mx-auto w-full max-w-[420px] px-4 py-10" aria-busy="true">
      <div className="rounded-xl border border-border bg-card p-6 sm:p-7">
        <Skeleton className="h-8 w-2/3" />
        <Skeleton className="mt-2.5 h-4 w-5/6" />
        <Skeleton className="mt-6 h-10 w-full" />
        <div className="mt-4 space-y-4">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      </div>
    </main>
  );
}
