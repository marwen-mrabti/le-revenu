import { useTranslations } from 'next-intl';

import { RelativeTime } from '@/components/shared/relative-time';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Link } from '@/i18n/navigation';
import { cn } from '@/lib/utils';

import type { DiscussionListItem } from '../schemas';

/** One row of the list. The title link covers the whole card; everything else is plain text. */
export function DiscussionCard({ discussion }: { discussion: DiscussionListItem }) {
  const t = useTranslations('Discussions');
  const count = discussion.replies.count;
  const initial = (discussion.author?.username ?? '?').charAt(0).toUpperCase();
  const color = discussion.category?.color ?? undefined;

  return (
    <article className="relative grid gap-2.5 border-t border-border p-4 transition-colors first:border-t-0 focus-within:bg-accent/50 hover:bg-accent/50 md:grid-cols-[62px_minmax(0,1fr)] md:gap-4 md:px-[18px]">
      <div
        className={cn(
          'flex items-center justify-center gap-1.5 self-start rounded-lg border border-border px-2.5 py-1 text-xs text-muted-foreground tabular-nums',
          'md:h-[58px] md:w-[62px] md:flex-col md:gap-0 md:px-0 md:py-0',
          count === 0 && 'border-dashed text-destructive',
        )}
      >
        <span
          className={cn(
            'text-lg leading-none font-semibold',
            count === 0 ? 'text-destructive' : 'text-foreground',
          )}
        >
          {count}
        </span>
        <span className="text-[10.5px] leading-tight">{t('replyCountLabel', { count })}</span>
      </div>

      <div className="min-w-0">
        <div className="mb-1 flex flex-wrap items-center gap-2 text-[12.5px] text-muted-foreground">
          {discussion.category ? (
            <span className="inline-flex items-center gap-1.5 font-semibold text-secondary-foreground">
              <span
                aria-hidden="true"
                className="size-2 rounded-full bg-muted-foreground"
                style={color ? { backgroundColor: color } : undefined}
              />
              {discussion.category.name}
            </span>
          ) : null}
          {discussion.type === 'question' ? (
            <Badge variant="secondary" className="rounded-full text-[11.5px]">
              {t('typeQuestion')}
            </Badge>
          ) : null}
        </div>
        <h3 className="font-heading text-[18.5px] leading-[1.3] font-bold tracking-tight">
          <Link
            href={`/discussions/${discussion.slug}`}
            className="after:absolute after:inset-0 hover:text-brand-text focus-visible:outline-none"
          >
            {discussion.title}
          </Link>
        </h3>
        <p className="mt-1 line-clamp-2 text-sm text-secondary-foreground/80">
          {discussion.content}
        </p>
        <div className="mt-2.5 flex flex-wrap items-center gap-1.5 text-[13px] text-muted-foreground">
          <Avatar size="sm" className="size-[22px] text-[9.5px]">
            <AvatarFallback className="bg-primary/15 font-semibold text-brand-text">
              {initial}
            </AvatarFallback>
          </Avatar>
          <span className="font-semibold text-secondary-foreground">
            {discussion.author?.username ?? t('anonymous')}
          </span>
          <span aria-hidden="true">·</span>
          <RelativeTime date={discussion.createdAt} />
        </div>
      </div>
    </article>
  );
}
