import { createNavigation } from 'next-intl/navigation';

import { routing } from './routing';

/** Locale-aware drop-ins for Next's navigation APIs. Always import these, never `next/link`. */
export const { Link, redirect, usePathname, useRouter, getPathname } = createNavigation(routing);
