import type { ReactNode } from 'react';

interface TryOnSceneShellProps {
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
  aside?: ReactNode;
}

export function TryOnSceneShell({
  eyebrow,
  title,
  description,
  children,
  aside,
}: TryOnSceneShellProps) {
  return (
    <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_20rem]">
      <div className="lux-stage-frame lux-noise rounded-[2rem] p-5 sm:p-8">
        <div className="max-w-2xl">
          <p className="lux-kicker text-[11px] sm:text-xs">{eyebrow}</p>
          <h2 className="mt-4 font-serif text-3xl italic tracking-[0.04em] text-white sm:text-4xl">
            {title}
          </h2>
          <p className="mt-4 max-w-xl text-sm leading-7 text-[var(--lux-muted-foreground)] sm:text-base">
            {description}
          </p>
        </div>

        <div className="lux-divider my-6 sm:my-8" />

        <div className="relative">{children}</div>
      </div>

      {aside ? (
        <aside className="hidden xl:block">
          <div className="lux-rail rounded-[2rem] p-6">{aside}</div>
        </aside>
      ) : null}
    </section>
  );
}
