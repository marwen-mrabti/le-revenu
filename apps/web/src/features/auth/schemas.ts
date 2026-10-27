import { z } from 'zod';

/** What the login form sends. The identifier is an email or a username. Messages are `Form.*` keys. */
export const loginSchema = z.object({
  identifier: z.string().trim().min(1, 'required').max(254, 'tooLong'),
  password: z.string().min(1, 'required').max(200, 'tooLong'),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const USERNAME_PATTERN = /^[a-zA-Z0-9._-]+$/;
export const PASSWORD_MIN = 8;

/** What the sign-up form sends. Strapi re-checks uniqueness and hashes the password. */
export const registerSchema = z.object({
  username: z
    .string()
    .trim()
    .min(3, 'usernameLength')
    .max(30, 'usernameLength')
    .regex(USERNAME_PATTERN, 'usernamePattern'),
  email: z
    .email('email')
    .max(254, 'tooLong')
    .transform((value) => value.toLowerCase()),
  password: z.string().min(PASSWORD_MIN, 'passwordMin').max(200, 'tooLong'),
});
export type RegisterInput = z.infer<typeof registerSchema>;

/** The only shape of the logged-in reader the BFF ever answers. */
export const sessionUserSchema = z.object({
  documentId: z.string(),
  username: z.string(),
  email: z.string(),
  displayName: z.string().nullable(),
  avatarUrl: z.string().nullable(),
  /** `local` (password) or `google`; a linked account stays `local` and can use both. */
  provider: z.string(),
});
export type SessionUser = z.infer<typeof sessionUserSchema>;

/** Strapi's user object, reduced to what we read. `id` stays server-side (needed for PUT /users/:id). */
export const strapiUserSchema = z.object({
  id: z.number(),
  documentId: z.string(),
  username: z.string(),
  email: z.string(),
  displayName: z.string().nullable().optional(),
  avatarUrl: z.string().nullable().optional(),
  provider: z.string().optional(),
  confirmed: z.boolean().optional(),
  blocked: z.boolean().optional(),
});
export type StrapiUser = z.infer<typeof strapiUserSchema>;

export const strapiAuthResponseSchema = z.object({ jwt: z.string(), user: strapiUserSchema });
/** Register with email confirmation on: a user, no token. */
export const strapiRegisterResponseSchema = z.object({
  jwt: z.string().optional(),
  user: strapiUserSchema,
});

export const forgotPasswordSchema = z.object({ email: z.email('email').max(254, 'tooLong') });
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;

const newPassword = z.string().min(PASSWORD_MIN, 'passwordMin').max(72, 'tooLong');

export const resetPasswordSchema = z
  .object({
    code: z.string().min(20).max(512),
    password: newPassword,
    passwordConfirmation: z.string(),
  })
  .refine((v) => v.password === v.passwordConfirmation, {
    path: ['passwordConfirmation'],
    message: 'passwordMismatch',
  });
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'required').max(200),
    password: newPassword,
    passwordConfirmation: z.string(),
  })
  .refine((v) => v.password === v.passwordConfirmation, {
    path: ['passwordConfirmation'],
    message: 'passwordMismatch',
  })
  .refine((v) => v.password !== v.currentPassword, { path: ['password'], message: 'passwordSame' });
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;

/** Profile edits; an empty display name clears it. */
export const accountSchema = z.object({
  username: z
    .string()
    .trim()
    .min(3, 'usernameLength')
    .max(30, 'usernameLength')
    .regex(USERNAME_PATTERN, 'usernamePattern'),
  displayName: z
    .string()
    .trim()
    .max(60, 'tooLong')
    .transform((v) => (v.length === 0 ? null : v))
    .refine((v) => v === null || v.length >= 2, 'displayNameLength'),
});
export type AccountInput = z.infer<typeof accountSchema>;

export const deleteAccountSchema = z.object({ username: z.string().min(1, 'required') });

/** Token handed back by the Google callback page, for one exchange. */
export const sessionTokenSchema = z.object({ jwt: z.string().min(20).max(4096) });

/** Where to go after login: a relative path only (no `//host`, no scheme). */
export const nextPathSchema = z
  .string()
  .max(200)
  .regex(/^\/(?!\/)[^\s]*$/)
  .catch('/discussions');

export const toSessionUser = (user: StrapiUser): SessionUser => ({
  documentId: user.documentId,
  username: user.username,
  email: user.email,
  displayName: user.displayName ?? null,
  avatarUrl: user.avatarUrl ?? null,
  provider: user.provider ?? 'local',
});
