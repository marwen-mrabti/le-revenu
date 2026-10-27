import { timingSafeEqual } from 'node:crypto';

import { revalidateTag } from 'next/cache';
import type { NextRequest } from 'next/server';
import { z } from 'zod';

import { env } from '@/config/env';
import { tagsForEvent } from '@/lib/cache/tags';

const payloadSchema = z.object({
  event: z.string(),
  uid: z.string(),
  entry: z.object({ documentId: z.string().optional() }).passthrough().optional(),
});

/** Constant-time comparison; a length mismatch is a mismatch, not a timing leak. */
function secretMatches(given: string | null, expected: string): boolean {
  if (!given) return false;
  const a = Buffer.from(given);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

/**
 * Strapi's webhook (ADR-0006): an entry changed in the admin or through the
 * API, the tags of its collection and of the entry are expired. The web app
 * answers 204 whatever it did; Strapi only logs the status.
 */
export async function POST(request: NextRequest): Promise<Response> {
  if (!secretMatches(request.headers.get('x-revalidate-secret'), env.REVALIDATE_SECRET)) {
    return Response.json({ code: 'UNAUTHENTICATED' }, { status: 401 });
  }
  const parsed = payloadSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ code: 'VALIDATION' }, { status: 400 });
  const tags = tagsForEvent(parsed.data.uid, parsed.data.entry?.documentId);
  if (!tags) return Response.json({ code: 'UNKNOWN_UID' }, { status: 400 });
  for (const tag of tags) revalidateTag(tag, { expire: 0 });
  return new Response(null, { status: 204 });
}
