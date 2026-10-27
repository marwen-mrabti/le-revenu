import { getFormatter, getTranslations } from 'next-intl/server';

import { Card, CardContent, CardDescription, CardHeader } from '@/components/ui/card';

import type { DiscussionDetail } from '../schemas';

/** Right column: the numbers of this discussion. */
export async function DiscussionFactsCard({ discussion }: { discussion: DiscussionDetail }) {
  const [t, format] = await Promise.all([getTranslations('Discussion'), getFormatter()]);
  const color = discussion.category?.color ?? undefined;
  return (
    <Card>
      <CardHeader>
        <CardDescription className="text-xs font-semibold tracking-wider uppercase">
          {t('factsTitle')}
        </CardDescription>
      </CardHeader>
      <CardContent className="text-sm">
        <dl className="grid grid-cols-2 gap-3">
          <div>
            <dt className="text-xs text-muted-foreground">{t('factsReplies')}</dt>
            <dd className="text-lg font-bold tabular-nums">{discussion.replies.length}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">{t('factsPublished')}</dt>
            <dd className="font-semibold">
              <time dateTime={discussion.createdAt}>
                {format.dateTime(new Date(discussion.createdAt), { dateStyle: 'medium' })}
              </time>
            </dd>
          </div>
        </dl>
        {discussion.category ? (
          <p className="mt-3 inline-flex items-center gap-1.5 font-semibold text-secondary-foreground">
            <span
              aria-hidden="true"
              className="size-2 rounded-full bg-muted-foreground"
              style={color ? { backgroundColor: color } : undefined}
            />
            {discussion.category.name}
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}
