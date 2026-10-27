import { Skeleton } from '@/components/ui/skeleton';

/** Same box as the article: meta line, title, author line, three lines of text. */
export function DiscussionArticleSkeleton() {
  return (
    <div
      className="rounded-xl border border-border bg-card p-5 sm:p-6"
      aria-busy="true"
      aria-hidden="true"
    >
      <Skeleton className="h-3.5 w-40" />
      <Skeleton className="mt-3 h-7 w-4/5" />
      <div className="mt-4 flex items-center gap-2.5">
        <Skeleton className="size-9 rounded-full" />
        <div>
          <Skeleton className="h-3.5 w-24" />
          <Skeleton className="mt-1.5 h-3 w-16" />
        </div>
      </div>
      <Skeleton className="mt-5 h-4 w-full" />
      <Skeleton className="mt-2 h-4 w-11/12" />
      <Skeleton className="mt-2 h-4 w-2/3" />
    </div>
  );
}
