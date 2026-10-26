import { connection, type NextRequest } from 'next/server';

import { getUserForToken } from '@/features/auth/data';
import { toErrorResponse } from '@/lib/api/errors';
import { clearSession, readSessionFrom } from '@/lib/auth/session';

/** Who is logged in, for client components. A stale cookie is cleared on the way out. */
export async function GET(request: NextRequest): Promise<Response> {
  await connection();
  try {
    const headers = { 'cache-control': 'no-store' };
    const jwt = readSessionFrom(request);
    if (!jwt) return Response.json({ user: null }, { status: 401, headers });
    const user = await getUserForToken(jwt);
    if (!user) {
      const response = Response.json({ user: null }, { status: 401, headers });
      clearSession(response);
      return response;
    }
    return Response.json({ user }, { headers });
  } catch (error) {
    return toErrorResponse(error);
  }
}
