/** The revalidation webhook (ADR-0006) is registered at boot from WEB_URL, once. */
import { describe, expect, it } from 'vitest';

import { queryOne } from './helpers/db';

describe('next-revalidate webhook', () => {
  it('points at the web app with the three entry events, enabled', async () => {
    const row = await queryOne<{
      url: string;
      events: string[];
      enabled: boolean;
      headers: unknown;
    }>("select url, events, enabled, headers from strapi_webhooks where name = 'next-revalidate'");
    expect(row).not.toBeNull();
    expect(row!.url).toBe('http://localhost:3000/api/revalidate');
    expect(row!.enabled).toBe(true);
    expect([...row!.events].sort()).toEqual(['entry.create', 'entry.delete', 'entry.update']);
    const count = await queryOne<{ n: string }>(
      "select count(*)::text as n from strapi_webhooks where name = 'next-revalidate'",
    );
    expect(count!.n).toBe('1');
  });
});
