import { queryOptions } from '@tanstack/react-query';
import { z } from 'zod';

import { ApiError, bffGet } from '@/lib/api/client';

import { sessionUserSchema, type SessionUser } from '../schemas';

const meSchema = z.object({ user: sessionUserSchema.nullable() });

/** The logged-in reader as seen by client components. 401 means "nobody", not an error. */
export const authQueries = {
  all: () => ['auth'] as const,
  me: () =>
    queryOptions({
      queryKey: [...authQueries.all(), 'me'] as const,
      queryFn: async ({ signal }): Promise<SessionUser | null> => {
        try {
          return (await bffGet('/api/auth/me', meSchema, signal)).user;
        } catch (error) {
          if (error instanceof ApiError && error.status === 401) return null;
          throw error;
        }
      },
      staleTime: 5 * 60 * 1000,
    }),
};
