import { Skeleton } from '@/components/ui/skeleton';

/** Ten rows with the card's grid and heights: the feed does not jump when data arrives. */
export function DiscussionListSkeleton({ rows = 10 }: { rows?: number }) {
  return (
    <div
      className="overflow-hidden rounded-xl border border-border bg-card"
      aria-busy="true"
      aria-hidden="true"
    >
      {Array.from({ length: rows }, (_, i) => (
        <div
          key={i}
          className="grid gap-2.5 border-t border-border p-4 first:border-t-0 md:grid-cols-[62px_minmax(0,1fr)] md:gap-4 md:px-[18px]"
        >
          <Skeleton className="h-7 w-20 rounded-lg md:h-[58px] md:w-[62px]" />
          <div>
            <Skeleton className="mb-2 h-3 w-36" />
            <Skeleton className={i % 2 ? 'h-5 w-3/5' : 'h-5 w-4/5'} />
            <Skeleton className="mt-2 h-3.5 w-full" />
            <Skeleton className="mt-1.5 h-3.5 w-2/3" />
            <Skeleton className="mt-3 h-3.5 w-32" />
          </div>
        </div>
      ))}
    </div>
  );
}
