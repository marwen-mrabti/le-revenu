import type { NextRequest } from 'next/server';
import { z } from 'zod';

import { getCategories } from '@/features/categories/data';
import { routing } from '@/i18n/routing';
import { toErrorResponse } from '@/lib/api/errors';

const querySchema = z.object({ locale: z.enum(routing.locales).default(routing.defaultLocale) });

/** Public categories read in the requested language. */
export async function GET(request: NextRequest): Promise<Response> {
  try {
    const { locale } = querySchema.parse(Object.fromEntries(request.nextUrl.searchParams));
    return Response.json(await getCategories(locale));
  } catch (error) {
    return toErrorResponse(error);
  }
}
