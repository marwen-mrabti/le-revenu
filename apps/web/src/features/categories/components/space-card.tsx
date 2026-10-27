import { getTranslations } from 'next-intl/server';

import { PlusIcon } from 'lucide-react';

import { buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Link } from '@/i18n/navigation';
import { cn } from '@/lib/utils';

import type { Category } from '../schemas';

/** Right column: the selected space, or an introduction to all of them. */
export async function SpaceCard({ category }: { category?: Category }) {
  const t = await getTranslations('Space');
  return (
    <Card>
      <CardHeader>
        <CardDescription className="text-xs font-semibold tracking-wider uppercase">
          {t('label')}
        </CardDescription>
        <CardTitle className="font-heading text-xl">{category?.name ?? t('allTitle')}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3 text-sm text-muted-foreground">
        <p>{category?.description ?? t('allDescription')}</p>
        <Link
          href={
            category
              ? { pathname: '/discussions/new', query: { category: category.slug } }
              : '/discussions/new'
          }
          className={cn(buttonVariants({ size: 'sm' }), 'self-start')}
        >
          <PlusIcon aria-hidden="true" />
          {category ? t('publishHere') : t('publish')}
        </Link>
      </CardContent>
    </Card>
  );
}
