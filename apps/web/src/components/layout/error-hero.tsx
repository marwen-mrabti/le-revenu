import type { ReactNode } from 'react';

/**
 * The dark block of the error pages: red-on-black gradient from the client
 * mockup, giant Playfair code, one sentence, actions. Works in Server and
 * Client Components (no hooks).
 */
export function ErrorHero({
  kicker,
  code,
  title,
  description,
  children,
  role,
}: {
  kicker: string;
  code: string;
  title: string;
  description: string;
  children: ReactNode;
  role?: 'alert';
}) {
  const [first, middle, ...rest] = code.split('');
  return (
    <section
      role={role}
      className="relative overflow-hidden rounded-[18px] bg-[radial-gradient(120%_140%_at_100%_0%,color-mix(in_srgb,var(--primary)_55%,transparent)_0%,transparent_55%),linear-gradient(160deg,#2c2c2e,#0e0e10)] px-6 py-7 text-white sm:px-8 sm:py-8 dark:bg-[radial-gradient(120%_140%_at_100%_0%,color-mix(in_srgb,var(--primary)_55%,transparent)_0%,transparent_55%),linear-gradient(160deg,#3a3a3c,#1c1c1e)]"
    >
      <p className="text-xs font-semibold tracking-[0.08em] text-white/60 uppercase">{kicker}</p>
      <p
        aria-hidden="true"
        className="font-heading text-[72px] leading-[0.95] font-black tracking-[-0.03em] sm:text-[96px]"
      >
        {first}
        <span className="text-primary">{middle}</span>
        {rest.join('')}
      </p>
      <h1 className="mt-2.5 font-heading text-2xl font-bold tracking-tight text-balance sm:text-[30px]">
        {title}
      </h1>
      <p className="mt-2 max-w-[48ch] text-[15.5px] text-white/80">{description}</p>
      <div className="mt-5 flex flex-wrap gap-2.5">{children}</div>
    </section>
  );
}
