'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { z } from 'zod';

import { bffPost } from '@/lib/api/client';

import { sessionUserSchema, type LoginInput, type RegisterInput } from '../schemas';
import { authQueries } from './queries';

const userEnvelope = z.object({ user: sessionUserSchema });

/** After any session change: the client cache and the server-rendered header are both refreshed. */
function useSessionChanged() {
  const queryClient = useQueryClient();
  const router = useRouter();
  return async (user: z.infer<typeof sessionUserSchema> | null) => {
    queryClient.setQueryData(authQueries.me().queryKey, user);
    await queryClient.invalidateQueries({ queryKey: authQueries.all() });
    router.refresh();
  };
}

export function useLogin() {
  const changed = useSessionChanged();
  return useMutation({
    mutationFn: (input: LoginInput) => bffPost('/api/auth/login', input, userEnvelope),
    onSuccess: ({ user }) => changed(user),
  });
}

export function useRegister() {
  const changed = useSessionChanged();
  return useMutation({
    mutationFn: (input: RegisterInput) => bffPost('/api/auth/register', input, userEnvelope),
    onSuccess: ({ user }) => changed(user),
  });
}

export function useLogout() {
  const changed = useSessionChanged();
  return useMutation({
    mutationFn: () => bffPost('/api/auth/logout', undefined, z.undefined()),
    onSuccess: () => changed(null),
  });
}

/** Google flow, last step: the token Strapi gave the browser becomes the session cookie. */
export function useGoogleSession() {
  const changed = useSessionChanged();
  return useMutation({
    mutationFn: (jwt: string) => bffPost('/api/auth/session', { jwt }, userEnvelope),
    onSuccess: ({ user }) => changed(user),
  });
}
