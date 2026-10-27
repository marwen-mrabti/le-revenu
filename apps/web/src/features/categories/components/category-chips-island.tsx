import { connection } from 'next/server';

import type { AppLocale } from '@/i18n/routing';

import { getCategories } from '../data';
import { CategoryChips } from './category-chips';

/** Mobile chips: request-time data, invisible when the categories cannot be read (the nav handles the message). */
export async function CategoryChipsIsland({ locale }: { locale: AppLocale }) {
  await connection();
  const categories = await getCategories(locale).catch(() => null);
  if (!categories) return null;
  return <CategoryChips categories={categories} />;
}
