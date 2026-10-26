import { getTranslations } from 'next-intl/server';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

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
      <CardContent className="text-sm text-muted-foreground">
        {category?.description ?? t('allDescription')}
      </CardContent>
    </Card>
  );
}
