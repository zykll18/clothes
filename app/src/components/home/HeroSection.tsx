import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, Play } from "lucide-react";

export default function HeroSection() {
  return (
    <section className="relative flex min-h-[100dvh] items-center overflow-hidden px-4 pb-12 pt-28 sm:px-6 lg:px-10">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-[8%] top-[16%] h-56 w-56 rounded-full bg-white/8 blur-[140px] animate-glow-drift" />
        <div className="absolute right-[14%] top-[10%] h-72 w-72 rounded-full bg-white/10 blur-[180px] animate-glow-drift" />
        <div className="absolute inset-y-0 right-0 w-1/2 bg-gradient-to-l from-transparent via-black/12 to-black/72" />
      </div>

      <div className="relative mx-auto grid min-h-[80dvh] w-full max-w-7xl items-center gap-10 lg:grid-cols-[minmax(0,0.92fr)_minmax(420px,0.88fr)]">
        <div className="max-w-2xl animate-fade-up-blur">
          <div className="lux-surface lux-outline mb-6 inline-flex rounded-full px-3 py-2 text-xs uppercase tracking-[0.24em] text-white/82">
            Creator Preview Tool
          </div>
          <h1 className="font-heading text-6xl italic leading-[0.82] tracking-[-0.04em] text-white sm:text-7xl lg:text-[5.7rem]">
            Decide the drop before you shoot the look.
          </h1>
          <p className="mt-5 max-w-xl text-base leading-7 text-white/74 sm:text-lg">
            面向潮流穿搭博主的内容预演工具。上传人物、选主色、混排素材、对比三种方向，
            先决定这次内容该发哪一版。
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <Link
              href="/auth/register"
              className="lux-surface-strong lux-outline inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-medium text-white transition hover:-translate-y-0.5 hover:bg-white/14"
            >
              开始内容预演
              <ArrowUpRight className="h-4 w-4" />
            </Link>
            <Link
              href="/preview"
              className="inline-flex items-center gap-2 text-sm text-white/80 transition hover:text-white"
            >
              <Play className="h-4 w-4 fill-current" />
              查看定稿台
            </Link>
          </div>
          <div className="mt-10 grid max-w-lg gap-4 sm:grid-cols-2">
            <div className="lux-surface lux-outline rounded-[1.4rem] p-5">
              <p className="font-heading text-4xl italic leading-none text-white">3 Directions</p>
              <p className="mt-2 text-sm text-white/64">
                同一套 look 一次返回三种内容方向，直接并排判断这次主推哪一版。
              </p>
            </div>
            <div className="lux-surface lux-outline rounded-[1.4rem] p-5">
              <p className="font-heading text-4xl italic leading-none text-white">Lead Pick</p>
              <p className="mt-2 text-sm text-white/64">
                选定主推版本后再去拍摄、做封面或和品牌沟通，少把试错留到现场。
              </p>
            </div>
          </div>
        </div>

        <div className="relative flex min-h-[520px] items-center justify-center lg:justify-end">
          <div className="lux-bloom absolute right-[12%] top-[10%] h-60 w-60 rounded-full bg-white/6 blur-[140px]" />
          <div className="absolute inset-y-[10%] right-0 w-[88%] rounded-[2.2rem] border border-white/8 bg-gradient-to-b from-white/[0.03] to-transparent" />
          <Image
            src="/images/home/luxury-flower.jpg"
            alt="银白发光花朵主视觉"
            width={900}
            height={1400}
            priority
            className="relative z-10 h-[78dvh] w-auto max-w-[520px] object-contain object-right"
          />
        </div>
      </div>
    </section>
  );
}
