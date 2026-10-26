'use client';

import { QueryClientProvider } from '@tanstack/react-query';
import { NuqsAdapter } from 'nuqs/adapters/next/app';
import type { ReactNode } from 'react';

import { ThemeProvider } from '@/components/theme/theme-provider';
import { Toaster } from '@/components/ui/sonner';
import { getQueryClient } from '@/lib/query/get-query-client';

/** Client-side context, mounted once inside <body>. Keep it thin: no data, no business logic. */
export function Providers({ children }: { children: ReactNode }) {
  const queryClient = getQueryClient();
  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <NuqsAdapter>{children}</NuqsAdapter>
        <Toaster position="bottom-center" />
      </QueryClientProvider>
    </ThemeProvider>
  );
}
