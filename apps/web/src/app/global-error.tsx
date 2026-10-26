'use client';

import Link from 'next/link';
import { useEffect } from 'react';

/**
 * Last resort: rendered when the root layout itself fails, so no provider, no
 * header, no translations are available. Inline styles only; both languages.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="fr">
      <body
        style={{
          margin: 0,
          minHeight: '100vh',
          display: 'grid',
          placeItems: 'center',
          background: '#f5f5f7',
          color: '#1d1d1f',
          fontFamily: 'Inter, system-ui, sans-serif',
          padding: 24,
        }}
      >
        <main style={{ maxWidth: 560, textAlign: 'center' }}>
          <p
            aria-hidden="true"
            style={{
              margin: 0,
              fontFamily: 'Georgia, serif',
              fontWeight: 900,
              fontSize: 56,
              letterSpacing: '-0.03em',
            }}
          >
            5<span style={{ color: '#eb0f0f' }}>0</span>0
          </p>
          <h1 style={{ margin: '6px 0 0', fontFamily: 'Georgia, serif', fontSize: 22 }}>
            Une erreur est survenue
          </h1>
          <p style={{ margin: '6px 0 0', color: '#48484a' }}>
            Réessayez dans un instant. Si le problème persiste, contactez-nous.
            <br />
            <span lang="en">Something went wrong. Try again in a moment.</span>
          </p>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginTop: 20 }}>
            <button
              type="button"
              onClick={reset}
              style={{
                height: 40,
                padding: '0 16px',
                borderRadius: 10,
                border: 0,
                background: '#eb0f0f',
                color: '#fff',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Réessayer · Retry
            </button>
            <Link
              href="/"
              style={{
                height: 40,
                padding: '0 16px',
                borderRadius: 10,
                border: '1px solid #e5e5ea',
                background: '#fff',
                color: '#1d1d1f',
                fontWeight: 600,
                display: 'inline-flex',
                alignItems: 'center',
                textDecoration: 'none',
              }}
            >
              Accueil · Home
            </Link>
          </div>
          {error.digest ? (
            <p style={{ marginTop: 16, fontSize: 12, color: '#6e6e73' }}>Code : {error.digest}</p>
          ) : null}
        </main>
      </body>
    </html>
  );
}
