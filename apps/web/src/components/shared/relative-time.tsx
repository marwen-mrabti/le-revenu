'use client';

import { useFormatter, useNow } from 'next-intl';

/**
 * "il y a 3 h" / "3 hours ago", refreshed every minute on the client so the
 * server never renders a value that is stale by the time it hydrates.
 */
export function RelativeTime({ date }: { date: Date | string }) {
  const value = typeof date === 'string' ? new Date(date) : date;
  const now = useNow({ updateInterval: 60_000 });
  const format = useFormatter();
  return <time dateTime={value.toISOString()}>{format.relativeTime(value, now)}</time>;
}
