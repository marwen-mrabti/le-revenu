import { describe, expect, it } from 'vitest';

import { loginSchema, nextPathSchema, registerSchema } from './schemas';

describe('registerSchema', () => {
  it('accepts a valid account and lowercases the email', () => {
    const parsed = registerSchema.parse({
      username: 'Claire_Nantes',
      email: 'Claire@Exemple.FR',
      password: 'Password123!',
    });
    expect(parsed.email).toBe('claire@exemple.fr');
  });

  it('refuses short or odd usernames, bad emails and short passwords', () => {
    const base = { username: 'claire', email: 'c@x.fr', password: 'Password123!' };
    expect(registerSchema.safeParse({ ...base, username: 'ab' }).success).toBe(false);
    expect(registerSchema.safeParse({ ...base, username: 'claire nantes' }).success).toBe(false);
    expect(registerSchema.safeParse({ ...base, email: 'not-an-email' }).success).toBe(false);
    expect(registerSchema.safeParse({ ...base, password: '1234567' }).success).toBe(false);
    expect(registerSchema.safeParse({ ...base, password: '12345678' }).success).toBe(true);
  });
});

describe('loginSchema', () => {
  it('trims the identifier and requires both fields', () => {
    expect(loginSchema.parse({ identifier: ' alice ', password: 'x' }).identifier).toBe('alice');
    expect(loginSchema.safeParse({ identifier: 'alice', password: '' }).success).toBe(false);
  });
});

describe('nextPathSchema', () => {
  it('keeps a relative path with its query and falls back on anything else', () => {
    expect(nextPathSchema.parse('/discussions?category=bourse')).toBe(
      '/discussions?category=bourse',
    );
    expect(nextPathSchema.parse('//evil.test')).toBe('/discussions');
    expect(nextPathSchema.parse('http://evil.test')).toBe('/discussions');
    expect(nextPathSchema.parse('discussions')).toBe('/discussions');
    expect(nextPathSchema.parse(undefined)).toBe('/discussions');
  });
});
