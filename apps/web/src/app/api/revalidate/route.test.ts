// @vitest-environment node
import { NextRequest } from 'next/server';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@/config/env', () => ({ env: { REVALIDATE_SECRET: 's3cret-s3cret-s3cret' } }));
vi.mock('next/cache', () => ({ revalidateTag: vi.fn() }));

import { revalidateTag } from 'next/cache';

import { POST } from './route';

const call = (body: unknown, secret = 's3cret-s3cret-s3cret') =>
  POST(
    new NextRequest('http://web.test/api/revalidate', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-revalidate-secret': secret },
      body: JSON.stringify(body),
    }),
  );
const event = {
  event: 'entry.update',
  uid: 'api::discussion.discussion',
  entry: { documentId: 'd1', title: 'x' },
};

describe('POST /api/revalidate', () => {
  it('refuses a wrong or missing secret', async () => {
    expect((await call(event, 'nope')).status).toBe(401);
    expect((await call(event, '')).status).toBe(401);
    expect(revalidateTag).not.toHaveBeenCalled();
  });

  it('expires the collection and the entry tags', async () => {
    expect((await call(event)).status).toBe(204);
    expect(revalidateTag).toHaveBeenCalledWith('strapi:discussions', { expire: 0 });
    expect(revalidateTag).toHaveBeenCalledWith('strapi:discussions:d1', { expire: 0 });
  });

  it('answers 400 for a content type it does not cache, or a bad payload', async () => {
    expect((await call({ ...event, uid: 'plugin::upload.file' })).status).toBe(400);
    expect((await call({ nope: true })).status).toBe(400);
    expect(revalidateTag).not.toHaveBeenCalled();
  });
});
