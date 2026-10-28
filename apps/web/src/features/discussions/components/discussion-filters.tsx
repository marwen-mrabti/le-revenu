'use client';

import { SearchIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useQueryStates } from 'nuqs';
import { useId, useRef, useState } from 'react';

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

const SEARCH_DEBOUNCE_MS = 300;

/**
 * Search box and sort select, bound to the URL through nuqs. Updates are
 * shallow: the list refetches through the BFF, the shell stays in place.
 * Any change goes back to page 1. The search text is committed to the URL
 * (and so to the list query) 300 ms after the last keystroke, not on each one.
 */
export function DiscussionFilters() {
  const t = useTranslations('Discussions');
  const tSort = useTranslations('Sort');
  const searchId = useId();
  const [{ q, sort }, setParams] = useQueryStates(discussionSearchParams, { shallow: true });
  const [text, setText] = useState(q);
  const [syncedQ, setSyncedQ] = useState(q);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // The URL changed elsewhere (back button, "clear filters"): follow it.
  if (q !== syncedQ) {
    setSyncedQ(q);
    setText(q);
  }

  function onSearchChange(value: string) {
    setText(value);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      setSyncedQ(value);
      void setParams({ q: value, page: null }, { history: 'replace' });
    }, SEARCH_DEBOUNCE_MS);
  }

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
          value={text}
          placeholder={t('searchPlaceholder')}
          autoComplete="off"
          maxLength={80}
          className="h-9 bg-card pl-9"
          onChange={(event) => onSearchChange(event.target.value)}
        />
      </div>
      <Select
        value={sort}
        // Base UI shows the raw value unless it knows the labels: "newest" → "Plus récentes".
        items={SORTS.map((value) => ({ value, label: tSort(value) }))}
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
