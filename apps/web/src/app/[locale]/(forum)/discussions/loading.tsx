import { Skeleton } from '@/components/ui/skeleton';

export default function DiscussionsLoading() {
  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-10" aria-busy="true">
      <Skeleton className="h-9 w-2/3" />
      <Skeleton className="mt-3 h-5 w-1/2" />
      <div className="mt-8 space-y-2">
        <Skeleton className="h-4 w-48" />
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-4 w-40" />
      </div>
    </main>
  );
}
