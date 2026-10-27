import { getTranslations } from 'next-intl/server';

import { IslandError } from '@/components/shared/island-error';
import { buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { findCategory } from '@/features/categories/data';
import { Link } from '@/i18n/navigation';
import type { AppLocale } from '@/i18n/routing';
import { errorCodeOfStrapi } from '@/lib/api/error-codes';
import { cn } from '@/lib/utils';

import { getDiscussion } from '../data';
import { DiscussionFactsCard } from './discussion-facts-card';

/** Right column: facts of the discussion and its space, from the same cached read as the article. */
export async function DiscussionAsideIsland({
  slug,
  locale,
}: {
  slug: Promise<string>;
  locale: AppLocale;
}) {
  const [t, tSpace] = await Promise.all([getTranslations('Discussion'), getTranslations('Space')]);
  const result = await getDiscussion(await slug, locale).then(
    (discussion) => ({ discussion, error: null }),
    (error: unknown) => ({ discussion: undefined, error }),
  );
  if (!result.discussion) {
    return result.discussion === null ? null : (
      <IslandError error={errorCodeOfStrapi(result.error)} variant="quiet" />
    );
  }
  const { discussion } = result;
  const category = discussion.category
    ? await findCategory(locale, discussion.category.slug).catch(() => undefined)
    : undefined;

  return (
    <div className="flex flex-col gap-4">
      <DiscussionFactsCard discussion={discussion} />
      {category ? (
        <Card>
          <CardHeader>
            <CardDescription className="text-xs font-semibold tracking-wider uppercase">
              {tSpace('label')}
            </CardDescription>
            <CardTitle className="font-heading text-xl">{category.name}</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 text-sm text-muted-foreground">
            <p>{category.description}</p>
            <Link
              href={{ pathname: '/discussions', query: { category: category.slug } }}
              className={cn(buttonVariants({ variant: 'secondary', size: 'sm' }), 'self-start')}
            >
              {t('spaceDiscussions')}
            </Link>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
