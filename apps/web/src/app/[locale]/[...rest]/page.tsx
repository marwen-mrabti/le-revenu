import { notFound } from 'next/navigation';

/**
 * Any URL that matches no page lands here, inside the locale segment, so the
 * locale's not-found page (header, language, theme) renders instead of Next's default.
 */
export default function CatchAllPage() {
  notFound();
}
