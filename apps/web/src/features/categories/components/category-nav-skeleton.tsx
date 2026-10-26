import { Skeleton } from '@/components/ui/skeleton';

/** Same heights as CategoryNav so the column does not jump. */
export function CategoryNavSkeleton() {
  return (
    <div className="flex flex-col gap-0.5" aria-hidden="true">
      <Skeleton className="h-8 w-full rounded-lg" />
      <Skeleton className="mx-2.5 mt-3 mb-1 h-3 w-16" />
      {Array.from({ length: 11 }, (_, i) => (
        <Skeleton key={i} className="h-8 w-full rounded-lg" />
      ))}
    </div>
  );
}
