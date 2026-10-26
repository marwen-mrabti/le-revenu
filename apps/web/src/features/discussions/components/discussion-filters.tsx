'use client';

import { SearchIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { debounce, useQueryStates } from 'nuqs';
import { useId } from 'react';

import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import { SORTS, type Sort } from '../schemas';
import { discussionSearchParams } from '../search-params';

/**
 * Search box and sort select, bound to the URL through nuqs. Updates are
 * shallow: the list refetches through the BFF, the shell stays in place.
 * Any change goes back to page 1.
 */
export function DiscussionFilters() {
  const t = useTranslations('Discussions');
  const tSort = useTranslations('Sort');
  const searchId = useId();
  const [{ q, sort }, setParams] = useQueryStates(discussionSearchParams, { shallow: true });

  return (
    <div className="flex flex-wrap items-center gap-2.5">
      <div className="relative min-w-0 flex-1 basis-56">
        <SearchIcon
          aria-hidden="true"
          className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
        />
        <label htmlFor={searchId} className="sr-only">
          {t('searchLabel')}
        </label>
        <Input
          id={searchId}
          type="search"
          value={q}
          placeholder={t('searchPlaceholder')}
          autoComplete="off"
          maxLength={80}
          className="h-9 bg-card pl-9"
          onChange={(event) =>
            void setParams(
              { q: event.target.value, page: null },
              { history: 'replace', limitUrlUpdates: debounce(300) },
            )
          }
        />
      </div>
      <Select
        value={sort}
        onValueChange={(value) =>
          void setParams({ sort: value as Sort, page: null }, { history: 'push' })
        }
      >
        <SelectTrigger aria-label={tSort('label')} className="h-9 w-40 bg-card">
          <SelectValue />
        </SelectTrigger>
        <SelectContent align="end">
          {SORTS.map((value) => (
            <SelectItem key={value} value={value}>
              {tSort(value)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
