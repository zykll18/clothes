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
    <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_20.5rem] xl:items-stretch">
      <div className="lux-stage-frame lux-noise relative overflow-hidden rounded-[2rem] p-5 sm:p-8 lg:p-9">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(212,177,106,0.16),transparent_30%),linear-gradient(180deg,rgba(255,255,255,0.05),rgba(0,0,0,0.12))]" />
        <div className="pointer-events-none absolute inset-x-10 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.3),transparent)]" />
        <div className="relative">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-2xl">
              <p className="lux-kicker text-[11px] sm:text-xs">{eyebrow}</p>
              <h2 className="mt-4 font-serif text-3xl italic tracking-[0.04em] text-white sm:text-4xl lg:text-[2.65rem] lg:leading-[0.98]">
                {title}
              </h2>
              <p className="mt-4 max-w-xl text-sm leading-7 text-[var(--lux-muted-foreground)] sm:text-base">
                {description}
              </p>
            </div>

            <div className="self-start rounded-full border border-[rgba(255,255,255,0.12)] bg-[rgba(255,255,255,0.04)] px-4 py-2 text-[10px] uppercase tracking-[0.28em] text-[rgba(255,245,225,0.54)] backdrop-blur-md">
              Atelier Stage
            </div>
          </div>
        </div>

        <div className="lux-divider my-6 sm:my-8" />

        <div className="relative">{children}</div>
      </div>

      {aside ? (
        <aside className="hidden xl:block xl:sticky xl:top-28 xl:self-stretch">
          <div className="lux-rail relative h-full overflow-hidden rounded-[2rem] p-6">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.08),transparent_36%)]" />
            <div className="relative">{aside}</div>
          </div>
        </aside>
      ) : null}
    </section>
  );
}
