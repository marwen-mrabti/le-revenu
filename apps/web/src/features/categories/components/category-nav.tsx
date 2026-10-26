'use client';

import { useTranslations } from 'next-intl';

import { Link } from '@/i18n/navigation';
import { cn } from '@/lib/utils';

import { useCategoryHref } from '../hooks/use-category-href';
import type { Category } from '../schemas';

/** Desktop left column: one link per space, the active one highlighted. */
export function CategoryNav({ categories }: { categories: Category[] }) {
  const t = useTranslations('Categories');
  const { active, hrefFor } = useCategoryHref();

  return (
    <nav aria-label={t('navLabel')} className="flex flex-col gap-0.5">
      <CategoryLink href={hrefFor(null)} active={active === null} color={null}>
        {t('all')}
      </CategoryLink>
      <p className="px-2.5 pt-3 pb-1 text-[11.5px] font-semibold tracking-wider text-muted-foreground uppercase">
        {t('spaces')}
      </p>
      {categories.map((category) => (
        <CategoryLink
          key={category.documentId}
          href={hrefFor(category.slug)}
          active={active === category.slug}
          color={category.color ?? null}
        >
          {category.name}
        </CategoryLink>
      ))}
    </nav>
  );
}

function CategoryLink({
  href,
  active,
  color,
  children,
}: {
  href: ReturnType<ReturnType<typeof useCategoryHref>['hrefFor']>;
  active: boolean;
  color: string | null;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? 'page' : undefined}
      className={cn(
        'flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-sm font-medium text-muted-foreground transition-colors',
        'hover:bg-accent hover:text-foreground',
        active && 'bg-accent font-semibold text-foreground',
      )}
    >
      <span
        aria-hidden="true"
        className="size-2 shrink-0 rounded-full bg-muted-foreground"
        style={color ? { backgroundColor: color } : undefined}
      />
      {children}
    </Link>
  );
}
