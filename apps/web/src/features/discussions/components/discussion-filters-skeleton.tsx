import { Skeleton } from '@/components/ui/skeleton';

/** Same chrome as the filters while the URL state hydrates. */
export function DiscussionFiltersSkeleton() {
  return (
    <div className="flex flex-wrap items-center gap-2.5" aria-hidden="true">
      <Skeleton className="h-9 min-w-0 flex-1 basis-56 rounded-lg" />
      <Skeleton className="h-9 w-40 rounded-lg" />
    </div>
  );
}
