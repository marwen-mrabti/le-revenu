import { Skeleton } from '@/components/ui/skeleton';
import { DiscussionListSkeleton } from '@/features/discussions/components/discussion-list-skeleton';

/** Same grid cells as the page so nothing jumps when the data arrives. */
export default function DiscussionsLoading() {
  return (
    <>
      <main className="flex min-w-0 flex-col gap-4" aria-busy="true">
        <Skeleton className="h-9 w-2/3" />
        <Skeleton className="h-5 w-1/2" />
        <div className="flex gap-2.5">
          <Skeleton className="h-9 flex-1" />
          <Skeleton className="h-9 w-40" />
        </div>
        <DiscussionListSkeleton />
      </main>
      <aside className="md:col-start-2 xl:col-start-3">
        <Skeleton className="h-40 w-full rounded-xl" />
      </aside>
    </>
  );
}
