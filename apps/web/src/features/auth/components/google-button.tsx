import { useTranslations } from 'next-intl';

import { buttonVariants } from '@/components/ui/button';
import { env } from '@/config/env';
import { cn } from '@/lib/utils';

/**
 * Starts the Google flow on Strapi. `callback` must match the front-end URL
 * configured on the provider (origin and path); the query carries our state.
 * Rendered only when NEXT_PUBLIC_GOOGLE_LOGIN is on.
 */
export function GoogleButton({ next, locale }: { next: string; locale: string }) {
  const t = useTranslations('Auth');
  if (!env.NEXT_PUBLIC_GOOGLE_LOGIN) return null;

  const state = new URLSearchParams({ next, locale }).toString();
  const callback = `${env.NEXT_PUBLIC_APP_URL}/auth/google/callback?${state}`;
  const href = `${env.NEXT_PUBLIC_STRAPI_URL}/api/connect/google?callback=${encodeURIComponent(callback)}`;

  return (
    <>
      <a
        href={href}
        className={cn(buttonVariants({ variant: 'outline', size: 'lg' }), 'h-10 w-full gap-2.5')}
      >
        <GoogleLogo />
        {t('google')}
      </a>
      <div className="my-4 flex items-center gap-3 text-xs text-muted-foreground before:h-px before:flex-1 before:bg-border after:h-px after:flex-1 after:bg-border">
        {t('or')}
      </div>
    </>
  );
}

function GoogleLogo() {
  return (
    <svg viewBox="0 0 48 48" aria-hidden="true" className="size-[18px]">
      <path
        fill="#EA4335"
        d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.8 2.4 30.3 0 24 0 14.6 0 6.5 5.4 2.6 13.3l7.9 6.1C12.4 13.6 17.7 9.5 24 9.5z"
      />
      <path
        fill="#4285F4"
        d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v8.5h12.7c-.6 3-2.3 5.5-4.8 7.2l7.5 5.8c4.4-4 7.1-10 7.1-17z"
      />
      <path
        fill="#FBBC05"
        d="M10.5 28.6A14.5 14.5 0 0 1 9.7 24c0-1.6.3-3.1.8-4.6l-7.9-6.1A24 24 0 0 0 0 24c0 3.9.9 7.5 2.6 10.7l7.9-6.1z"
      />
      <path
        fill="#34A853"
        d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.5-5.8c-2.1 1.4-4.9 2.3-8.4 2.3-6.3 0-11.6-4.1-13.5-9.8l-7.9 6.1C6.5 42.6 14.6 48 24 48z"
      />
    </svg>
  );
}
