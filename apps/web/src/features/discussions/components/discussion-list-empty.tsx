import { MessageSquareDashedIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Button } from '@/components/ui/button';
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty';
import { Link } from '@/i18n/navigation';

type Reason = 'no-data' | 'filtered' | 'out-of-range';

/** Nothing to list: say why and offer the way back. */
export function DiscussionListEmpty({ reason, backHref }: { reason: Reason; backHref: string }) {
  const t = useTranslations('Discussions');
  const descriptions: Record<Reason, string> = {
    'no-data': t('emptyHint'),
    filtered: t('emptyFiltered'),
    'out-of-range': t('emptyOutOfRange'),
  };
  const actions: Record<Reason, string | null> = {
    'no-data': null,
    filtered: t('clearFilters'),
    'out-of-range': t('backToFirstPage'),
  };
  const action = actions[reason];

  return (
    <Empty className="rounded-xl border border-border bg-card py-12">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <MessageSquareDashedIcon aria-hidden="true" />
        </EmptyMedia>
        <EmptyTitle className="font-heading text-xl">{t('empty')}</EmptyTitle>
        <EmptyDescription>{descriptions[reason]}</EmptyDescription>
      </EmptyHeader>
      {action ? (
        <Button variant="secondary" render={<Link href={backHref as '/discussions'} />}>
          {action}
        </Button>
      ) : null}
    </Empty>
  );
}
