import type { NextRequest } from 'next/server';

import { assertSameOrigin } from '@/lib/api/guards';
import { toErrorResponse } from '@/lib/api/errors';
import { clearSession } from '@/lib/auth/session';

/** Forgets the session. Strapi's JWT is stateless, so clearing the cookie is the logout. */
export async function POST(request: NextRequest): Promise<Response> {
  try {
    assertSameOrigin(request);
    const response = new Response(null, { status: 204, headers: { 'cache-control': 'no-store' } });
    clearSession(response);
    return response;
  } catch (error) {
    return toErrorResponse(error);
  }
}
