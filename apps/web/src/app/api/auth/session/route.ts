import type { NextRequest } from 'next/server';

import { getUserForToken } from '@/features/auth/data';
import { sessionTokenSchema } from '@/features/auth/schemas';
import { BffError, toErrorResponse } from '@/lib/api/errors';
import { assertJson, assertSameOrigin } from '@/lib/api/guards';
import { setSession } from '@/lib/auth/session';

/**
 * Last step of the Google flow: the callback page hands over the JWT it got
 * from Strapi; it becomes a session cookie only if Strapi confirms it.
 */
export async function POST(request: NextRequest): Promise<Response> {
  try {
    assertSameOrigin(request);
    assertJson(request);
    const { jwt } = sessionTokenSchema.parse(await request.json());
    const user = await getUserForToken(jwt);
    if (!user) throw new BffError(401, 'INVALID_TOKEN', 'Session refusée.');
    const response = Response.json({ user }, { headers: { 'cache-control': 'no-store' } });
    setSession(response, jwt);
    return response;
  } catch (error) {
    return toErrorResponse(error);
  }
}
