'use client';

import { useTranslations } from 'next-intl';

import { Link } from '@/i18n/navigation';
import { cn } from '@/lib/utils';

import { useCategoryHref } from '../hooks/use-category-href';
import type { Category } from '../schemas';

/** Mobile replacement of the left nav: a horizontally scrolling row of chips. */
export function CategoryChips({ categories }: { categories: Category[] }) {
  const t = useTranslations('Categories');
  const { active, hrefFor } = useCategoryHref();
  const items = [{ slug: null, name: t('all') }, ...categories];

  return (
    <nav aria-label={t('navLabel')} className="-mx-4 overflow-x-auto px-4 md:hidden">
      <ul className="flex w-max gap-2 pb-1">
        {items.map((item) => {
          const isActive = active === item.slug;
          return (
            <li key={item.slug ?? 'all'}>
              <Link
                href={hrefFor(item.slug)}
                aria-current={isActive ? 'page' : undefined}
                className={cn(
                  'inline-flex h-8 items-center rounded-full border border-border bg-card px-3.5 text-[13.5px] font-medium whitespace-nowrap text-muted-foreground',
                  isActive && 'border-primary bg-primary text-primary-foreground',
                )}
              >
                {item.name}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
