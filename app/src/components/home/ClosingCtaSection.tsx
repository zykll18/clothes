import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

export default function ClosingCtaSection() {
  return (
    <section className="px-4 pb-24 pt-10 sm:px-6 lg:px-10">
      <div className="mx-auto max-w-7xl rounded-[2rem] border border-white/10 bg-white/[0.03] px-6 py-14 text-center shadow-[0_24px_120px_rgba(0,0,0,0.28)] sm:px-10">
        <p className="text-sm uppercase tracking-[0.22em] text-white/44">Ready</p>
        <h2 className="mt-4 font-heading text-5xl italic leading-[0.88] tracking-[-0.04em] text-white sm:text-6xl">
          Try the look before the look chooses you.
        </h2>
        <p className="mx-auto mt-5 max-w-2xl text-sm leading-7 text-white/64 sm:text-base">
          现在开始，把灵感、人物与服装放进同一张画面里，先看见，再决定。
        </p>
        <Link
          href="/auth/register"
          className="lux-surface-strong lux-outline mx-auto mt-8 inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-medium text-white transition hover:-translate-y-0.5 hover:bg-white/14"
        >
          创建账户
          <ArrowUpRight className="h-4 w-4" />
        </Link>
      </div>
    </section>
  );
}
