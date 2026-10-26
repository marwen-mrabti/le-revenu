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
});
export type SessionUser = z.infer<typeof sessionUserSchema>;

/** Strapi's user object, reduced to what we read. */
export const strapiUserSchema = z.object({
  documentId: z.string(),
  username: z.string(),
  email: z.string(),
  blocked: z.boolean().optional(),
});

export const strapiAuthResponseSchema = z.object({ jwt: z.string(), user: strapiUserSchema });

/** Token handed back by the Google callback page, for one exchange. */
export const sessionTokenSchema = z.object({ jwt: z.string().min(20).max(4096) });

/** Where to go after login: a relative path only (no `//host`, no scheme). */
export const nextPathSchema = z
  .string()
  .max(200)
  .regex(/^\/(?!\/)[^\s]*$/)
  .catch('/discussions');

export const toSessionUser = (user: z.infer<typeof strapiUserSchema>): SessionUser => ({
  documentId: user.documentId,
  username: user.username,
  email: user.email,
});
