import type { ReactNode } from 'react';

/** Centred card shared by the login and sign-up pages. */
export function AuthCard({
  title,
  intro,
  children,
  footer,
}: {
  title: string;
  intro: string;
  children: ReactNode;
  footer: ReactNode;
}) {
  return (
    <main id="content" className="mx-auto w-full max-w-[420px] px-4 py-10">
      <section
        aria-labelledby="auth-title"
        className="rounded-xl border border-border bg-card p-6 shadow-xs sm:p-7"
      >
        <h1
          id="auth-title"
          className="font-heading text-[26px] leading-tight font-bold tracking-tight"
        >
          {title}
        </h1>
        <p className="mt-1.5 text-[14.5px] text-muted-foreground">{intro}</p>
        <div className="mt-5">{children}</div>
        <p className="mt-5 text-center text-[13.5px] text-muted-foreground">{footer}</p>
      </section>
    </main>
  );
}
