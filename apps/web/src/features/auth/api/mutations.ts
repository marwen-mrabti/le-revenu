'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { z } from 'zod';

import { bffPost } from '@/lib/api/client';

import {
  sessionUserSchema,
  type AccountInput,
  type ChangePasswordInput,
  type ForgotPasswordInput,
  type LoginInput,
  type RegisterInput,
  type ResetPasswordInput,
} from '../schemas';
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

const pendingEnvelope = z.object({ user: sessionUserSchema, pending: z.boolean() });
const okEnvelope = z.object({ ok: z.boolean() });

/** Sign-up creates a pending account: no session until the email is confirmed. */
export function useRegister() {
  return useMutation({
    mutationFn: (input: RegisterInput) => bffPost('/api/auth/register', input, pendingEnvelope),
  });
}

export function useForgotPassword() {
  return useMutation({
    mutationFn: (input: ForgotPasswordInput) =>
      bffPost('/api/auth/forgot-password', input, okEnvelope),
  });
}

export function useSendConfirmation() {
  return useMutation({
    mutationFn: (input: ForgotPasswordInput) =>
      bffPost('/api/auth/send-confirmation', input, okEnvelope),
  });
}

/** The mailed code plus a new password: the reader is logged in on success. */
export function useResetPassword() {
  const changed = useSessionChanged();
  return useMutation({
    mutationFn: (input: ResetPasswordInput) =>
      bffPost('/api/auth/reset-password', input, userEnvelope),
    onSuccess: ({ user }) => changed(user),
  });
}

export function useChangePassword() {
  return useMutation({
    mutationFn: (input: ChangePasswordInput) =>
      bffPost('/api/auth/change-password', input, userEnvelope),
  });
}

export function useUpdateAccount() {
  const changed = useSessionChanged();
  return useMutation({
    mutationFn: (input: AccountInput) =>
      bffPost('/api/account', input, userEnvelope, { method: 'PATCH' }),
    onSuccess: ({ user }) => changed(user),
  });
}

export function useDeleteAccount() {
  const changed = useSessionChanged();
  return useMutation({
    mutationFn: (input: { username: string }) =>
      bffPost('/api/account', input, z.undefined(), { method: 'DELETE' }),
    onSuccess: () => changed(null),
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
