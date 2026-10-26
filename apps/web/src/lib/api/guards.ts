import 'server-only';

import type { NextRequest } from 'next/server';

import { BffError } from './errors';

/**
 * CSRF guard for every write handler. Browsers always send `Sec-Fetch-Site`
 * (and `Origin` on POST); a request from another site is refused. A request
 * with neither header (curl, server-side tooling) is not a browser and passes.
 */
export function assertSameOrigin(request: NextRequest): void {
  const site = request.headers.get('sec-fetch-site');
  if (site !== null && site !== 'same-origin') {
    throw new BffError(403, 'CROSS_ORIGIN', 'Requête refusée.');
  }
  const origin = request.headers.get('origin');
  if (origin !== null && origin !== request.nextUrl.origin) {
    throw new BffError(403, 'CROSS_ORIGIN', 'Requête refusée.');
  }
}

/** Write handlers accept JSON only: a form post from another site cannot be JSON. */
export function assertJson(request: NextRequest): void {
  const type = request.headers.get('content-type') ?? '';
  if (!type.toLowerCase().startsWith('application/json')) {
    throw new BffError(415, 'UNSUPPORTED_MEDIA_TYPE', 'Le corps doit être du JSON.');
  }
}
