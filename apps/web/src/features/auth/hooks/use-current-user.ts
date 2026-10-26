'use client';

import { useQuery } from '@tanstack/react-query';

import { authQueries } from '../api/queries';
import type { SessionUser } from '../schemas';

/** For client components that need the reader (reply form, …). `null` when logged out. */
export function useCurrentUser(initialUser?: SessionUser | null) {
  return useQuery({
    ...authQueries.me(),
    ...(initialUser !== undefined ? { initialData: initialUser } : {}),
  });
}
