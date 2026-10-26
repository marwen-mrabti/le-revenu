import type { Metadata } from 'next';
import { Suspense } from 'react';

import { GoogleCallback } from '@/features/auth/components/google-callback';

export const metadata: Metadata = { title: 'Google', robots: { index: false } };

/** Landing page of the Google flow; the client component does the work. */
export default function GoogleCallbackPage() {
  return (
    <Suspense fallback={null}>
      <GoogleCallback />
    </Suspense>
  );
}
