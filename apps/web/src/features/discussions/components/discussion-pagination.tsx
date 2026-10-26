import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { buttonVariants } from '@/components/ui/button';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
} from '@/components/ui/pagination';
import { Link } from '@/i18n/navigation';
import type { Pagination as PaginationMeta } from '@/lib/strapi/schemas';
import { cn } from '@/lib/utils';

import type { DiscussionFilters } from '../schemas';
import { serializeFilters } from '../search-params';

/** 1 … p-1 p p+1 … n, from `meta.pagination` only. Real links: prefetchable, work without JavaScript. */
export function DiscussionPagination({
  pagination,
  filters,
}: {
  pagination: PaginationMeta;
  filters: DiscussionFilters;
}) {
  const t = useTranslations('Pagination');
  const { page, pageCount } = pagination;
  if (pageCount <= 1) return null;

  const hrefFor = (target: number) => {
    const query = serializeFilters({ ...filters, page: target });
    return query ? `/discussions?${query}` : '/discussions';
  };
  const edge = (disabled: boolean) =>
    cn(
      buttonVariants({ variant: 'ghost', size: 'sm' }),
      'gap-1',
      disabled && 'pointer-events-none opacity-40',
    );

  return (
    <Pagination aria-label={t('label')}>
      <PaginationContent>
        <PaginationItem>
          <Link
            href={hrefFor(Math.max(1, page - 1))}
            aria-disabled={page <= 1 || undefined}
            tabIndex={page <= 1 ? -1 : undefined}
            className={edge(page <= 1)}
          >
            <ChevronLeftIcon aria-hidden="true" />
            {t('previous')}
          </Link>
        </PaginationItem>
        {windowOf(page, pageCount).map((item, i) => (
          <PaginationItem key={item === 'gap' ? `gap-${i}` : item} className="max-md:hidden">
            {item === 'gap' ? (
              <PaginationEllipsis />
            ) : (
              <Link
                href={hrefFor(item)}
                aria-current={item === page ? 'page' : undefined}
                className={cn(
                  buttonVariants({ variant: item === page ? 'outline' : 'ghost', size: 'icon' }),
                  item === page && 'bg-foreground text-background hover:bg-foreground',
                )}
              >
                {item}
              </Link>
            )}
          </PaginationItem>
        ))}
        <PaginationItem className="px-2 text-sm text-muted-foreground md:hidden">
          {t('pageOf', { page, count: pageCount })}
        </PaginationItem>
        <PaginationItem>
          <Link
            href={hrefFor(Math.min(pageCount, page + 1))}
            aria-disabled={page >= pageCount || undefined}
            tabIndex={page >= pageCount ? -1 : undefined}
            className={edge(page >= pageCount)}
          >
            {t('next')}
            <ChevronRightIcon aria-hidden="true" />
          </Link>
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
}

/** Pages to show around the current one, with gaps. */
export function windowOf(page: number, pageCount: number): Array<number | 'gap'> {
  const pages = new Set<number>([1, pageCount, page - 1, page, page + 1]);
  const sorted = [...pages].filter((p) => p >= 1 && p <= pageCount).toSorted((a, b) => a - b);
  const result: Array<number | 'gap'> = [];
  for (const [i, p] of sorted.entries()) {
    const previous = sorted[i - 1];
    if (previous !== undefined && p - previous > 1) result.push('gap');
    result.push(p);
  }
  return result;
}
