'use client';

import { MoonIcon, SunIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useTheme } from 'next-themes';
import { useSyncExternalStore } from 'react';

import { Button } from '@/components/ui/button';

const subscribe = () => () => {};

/** Sun / moon button. Rendered after mount only: the server cannot know the reader's theme. */
export function ThemeToggle() {
  const t = useTranslations('Theme');
  const { resolvedTheme, setTheme } = useTheme();
  const mounted = useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );

  if (!mounted) return <span className="inline-block size-9" aria-hidden="true" />;

  const dark = resolvedTheme === 'dark';
  return (
    <Button
      variant="outline"
      size="icon"
      onClick={() => setTheme(dark ? 'light' : 'dark')}
      aria-label={dark ? t('switchToLight') : t('switchToDark')}
      className="hidden sm:inline-flex"
    >
      {dark ? <SunIcon aria-hidden="true" /> : <MoonIcon aria-hidden="true" />}
    </Button>
  );
}
