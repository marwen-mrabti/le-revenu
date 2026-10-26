// @vitest-environment node
// Route handlers and guards read Cookie, Origin and Sec-Fetch-Site: a browser-like Request drops those headers.
import { NextRequest } from 'next/server';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@/config/env', () => ({ env: { AUTH_COOKIE_NAME: 'lr_session' } }));

import { clearSession, readSessionFrom, sessionCookie, setSession } from './session';

describe('session cookie', () => {
  it('is httpOnly, same-site lax, path / and lasts seven days', () => {
    expect(sessionCookie('tok.en')).toBe(
      'lr_session=tok.en; Path=/; Max-Age=604800; HttpOnly; SameSite=Lax',
    );
  });

  it('is written on the response and cleared with Max-Age 0', () => {
    const response = new Response(null);
    setSession(response, 'abc');
    expect(response.headers.get('set-cookie')).toContain('lr_session=abc');
    const bye = new Response(null);
    clearSession(bye);
    expect(bye.headers.get('set-cookie')).toContain('lr_session=; Path=/; Max-Age=0');
  });

  it('reads the token back from a request, null when absent', () => {
    const request = new NextRequest('http://web.test/api/auth/me', {
      headers: { cookie: 'lr_session=abc.def' },
    });
    expect(readSessionFrom(request)).toBe('abc.def');
    expect(readSessionFrom(new NextRequest('http://web.test/api/auth/me'))).toBeNull();
  });
});
