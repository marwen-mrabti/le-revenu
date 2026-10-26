import { notFound } from 'next/navigation';

/**
 * Any URL that matches no page lands here, inside the locale segment, so the
 * locale's not-found page (header, language, theme) renders instead of Next's default.
 * The segment only ever throws, so Next's instant-navigation check is opted out.
 */
export const instant = false;

export default function CatchAllPage() {
  notFound();
}
