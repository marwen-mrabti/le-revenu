import { Skeleton } from '@/components/ui/skeleton';

/** A heading line and two reply boxes. */
export function ReplyListSkeleton() {
  return (
    <div className="flex flex-col gap-3" aria-busy="true" aria-hidden="true">
      <Skeleton className="h-5 w-28" />
      {[0, 1].map((i) => (
        <div key={i} className="rounded-xl border border-border bg-card px-5 py-4">
          <div className="flex items-center gap-2.5">
            <Skeleton className="size-7 rounded-full" />
            <div>
              <Skeleton className="h-3.5 w-24" />
              <Skeleton className="mt-1.5 h-3 w-14" />
            </div>
          </div>
          <Skeleton className="mt-3 h-4 w-full" />
          <Skeleton className="mt-2 h-4 w-3/4" />
        </div>
      ))}
    </div>
  );
}
