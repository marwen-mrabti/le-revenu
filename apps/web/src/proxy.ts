import createMiddleware from 'next-intl/middleware';
import { NextResponse, type NextRequest } from 'next/server';

import { routing } from '@/i18n/routing';

const intl = createMiddleware(routing);
const SESSION_COOKIE = process.env.AUTH_COOKIE_NAME ?? 'lr_session';
const PROTECTED_PATHS = ['/discussions/new'];

/** Strips a leading locale prefix so paths can be compared locale-free. */
function stripLocale(pathname: string): { locale: string | null; path: string } {
  const [, first = '', ...rest] = pathname.split('/');
  if ((routing.locales as readonly string[]).includes(first)) {
    return { locale: first, path: `/${rest.join('/')}` };
  }
  return { locale: null, path: pathname };
}

/**
 * Locale negotiation plus an optimistic cookie check for protected pages.
 * The cookie presence only redirects early; the real authorization happens
 * server-side in the data access layer and the route handlers.
 */
export default function proxy(request: NextRequest) {
  const { locale, path } = stripLocale(request.nextUrl.pathname);

  if (PROTECTED_PATHS.includes(path) && !request.cookies.get(SESSION_COOKIE)) {
    const prefix = locale && locale !== routing.defaultLocale ? `/${locale}` : '';
    const url = new URL(`${prefix}/login`, request.url);
    // Keep the query (`?category=` of the create page) so the reader lands where they aimed.
    url.searchParams.set('next', `${path}${request.nextUrl.search}`);
    return NextResponse.redirect(url);
  }

  return intl(request);
}

export const config = {
  // Everything except API routes, Next internals, Vercel internals and files with an extension.
  matcher: '/((?!api|trpc|_next|_vercel|.*\\..*).*)',
};
