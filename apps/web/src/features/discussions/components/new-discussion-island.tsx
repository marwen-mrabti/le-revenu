import { getTranslations } from 'next-intl/server';

import { IslandError } from '@/components/shared/island-error';
import { getCurrentUser } from '@/features/auth/data';
import { getCategories } from '@/features/categories/data';
import { redirect } from '@/i18n/navigation';
import type { AppLocale } from '@/i18n/routing';
import { errorCodeOfStrapi } from '@/lib/api/error-codes';

import { DiscussionForm } from './discussion-form';

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

/**
 * The create form: needs the session (a visitor goes to login and comes back)
 * and the spaces in the page language; `?category=` preselects one.
 */
export async function NewDiscussionIsland({
  searchParams,
  locale,
}: {
  searchParams: SearchParams;
  locale: AppLocale;
}) {
  const [user, params] = await Promise.all([getCurrentUser(), searchParams]);
  if (!user) {
    redirect({ href: { pathname: '/login', query: { next: '/discussions/new' } }, locale });
    return null;
  }
  const result = await getCategories(locale).then(
    (categories) => ({ categories, error: null }),
    (error: unknown) => ({ categories: null, error }),
  );
  if (!result.categories) return <IslandError error={errorCodeOfStrapi(result.error)} />;
  const wanted = Array.isArray(params.category) ? params.category[0] : params.category;
  const initial = result.categories.find((category) => category.slug === wanted);
  const t = await getTranslations('DiscussionNew');
  return (
    <>
      <p className="sr-only">{t('intro')}</p>
      <DiscussionForm
        spaces={result.categories.map(({ documentId, name }) => ({ documentId, name }))}
        initialCategory={initial?.documentId ?? ''}
      />
    </>
  );
}
