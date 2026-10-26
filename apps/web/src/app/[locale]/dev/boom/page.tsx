import { notFound } from 'next/navigation';

/** Development only: throws on purpose so the 500 page can be seen and tested. 404 in production. */
export default function BoomPage() {
  if (process.env.NODE_ENV === 'production') notFound();
  throw new Error('Boom: intentional error to preview the 500 page');
}
