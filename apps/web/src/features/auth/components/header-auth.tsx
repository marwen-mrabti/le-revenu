import { getTranslations } from 'next-intl/server';

import { buttonVariants } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Link } from '@/i18n/navigation';
import { cn } from '@/lib/utils';

import { getCurrentUser } from '../data';
import { UserMenu } from './user-menu';

/** Right end of the header: the reader's menu, or the way in. Reads the cookie, so render under Suspense. */
export async function HeaderAuth() {
  const [t, user] = await Promise.all([getTranslations('Nav'), getCurrentUser()]);
  if (user) return <UserMenu user={user} />;
  return (
    <>
      <Link
        href="/login"
        className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }), 'max-sm:hidden')}
      >
        {t('signIn')}
      </Link>
      <Link href="/register" className={buttonVariants({ size: 'sm' })}>
        {t('register')}
      </Link>
    </>
  );
}

export function HeaderAuthSkeleton() {
  return <Skeleton className="h-7 w-24 rounded-lg" aria-hidden="true" />;
}
