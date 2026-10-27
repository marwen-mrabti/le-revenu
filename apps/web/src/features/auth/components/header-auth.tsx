import { getTranslations } from 'next-intl/server';

import { PlusIcon } from 'lucide-react';

import { buttonVariants } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Link } from '@/i18n/navigation';
import { cn } from '@/lib/utils';

import { getCurrentUser } from '../data';
import { UserMenu } from './user-menu';

/** Right end of the header: the reader's menu, or the way in. Reads the cookie, so render under Suspense. */
export async function HeaderAuth() {
  const [t, user] = await Promise.all([getTranslations('Nav'), getCurrentUser()]);
  const publish = (
    <Link
      href={user ? '/discussions/new' : { pathname: '/login', query: { next: '/discussions/new' } }}
      className={cn(buttonVariants({ size: 'sm' }), 'max-sm:size-8 max-sm:px-0')}
      aria-label={t('newDiscussion')}
    >
      <PlusIcon aria-hidden="true" />
      <span className="max-sm:sr-only">{t('newDiscussion')}</span>
    </Link>
  );
  if (user) {
    return (
      <>
        {publish}
        <UserMenu user={user} />
      </>
    );
  }
  return (
    <>
      {publish}
      <Link
        href="/login"
        className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }), 'max-sm:hidden')}
      >
        {t('signIn')}
      </Link>
      <Link href="/register" className={buttonVariants({ variant: 'outline', size: 'sm' })}>
        {t('register')}
      </Link>
    </>
  );
}

export function HeaderAuthSkeleton() {
  return <Skeleton className="h-7 w-24 rounded-lg" aria-hidden="true" />;
}
