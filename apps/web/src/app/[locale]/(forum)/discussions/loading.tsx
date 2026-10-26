import { Skeleton } from '@/components/ui/skeleton';

/** Same grid cells as the page so nothing jumps when the data arrives. */
export default function DiscussionsLoading() {
  return (
    <>
      <main className="flex min-w-0 flex-col gap-4" aria-busy="true">
        <Skeleton className="h-9 w-2/3" />
        <Skeleton className="h-5 w-1/2" />
      </main>
      <aside className="md:col-start-2 xl:col-start-3">
        <Skeleton className="h-40 w-full rounded-xl" />
      </aside>
    </>
  );
}
