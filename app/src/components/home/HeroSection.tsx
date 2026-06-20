import Link from "next/link";
import { ArrowUpRight, Play } from "lucide-react";

export default function HeroSection() {
  return (
    <section className="relative flex min-h-[100dvh] items-center overflow-hidden px-4 pb-12 pt-28 sm:px-6 lg:px-10">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-[8%] top-[16%] h-56 w-56 rounded-full bg-white/8 blur-[140px] animate-glow-drift" />
        <div className="absolute right-[14%] top-[10%] h-72 w-72 rounded-full bg-white/10 blur-[180px] animate-glow-drift" />
        <div className="absolute inset-y-0 left-0 w-full bg-gradient-to-r from-black/78 via-black/44 to-black/24 sm:w-[84%] lg:w-[68%]" />
      </div>

      <div className="relative mx-auto flex min-h-[80dvh] w-full max-w-7xl items-center">
        <div className="max-w-3xl animate-fade-up-blur">
          <div className="lux-surface lux-outline mb-6 inline-flex rounded-full px-3 py-2 text-xs uppercase tracking-[0.24em] text-white/82">
            衣橱搭配预览
          </div>
          <h1 className="font-heading text-6xl italic leading-[0.82] tracking-[-0.04em] text-white sm:text-7xl lg:text-[5.7rem]">
            把衣橱放进来，
            <br />
            今天这样搭。
          </h1>
          <p className="mt-5 max-w-xl text-base leading-7 text-white/74 sm:text-lg">
            面向潮流穿搭博主的 AI 搭配工具。上传本人和衣服，先定今天的配色与风格，
            再像换装游戏一样选出一整套并生成预览。
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <Link
              href="/auth/register"
              className="lux-surface-strong lux-outline inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-medium text-white transition hover:-translate-y-0.5 hover:bg-white/14"
            >
              开始搭配预览
              <ArrowUpRight className="h-4 w-4" />
            </Link>
            <Link
              href="/profile"
              className="inline-flex items-center gap-2 text-sm text-white/80 transition hover:text-white"
            >
              <Play className="h-4 w-4 fill-current" />
              管理我的衣橱
            </Link>
          </div>
          <div className="mt-10 grid max-w-lg gap-4 sm:grid-cols-2">
            <article className="group/card lux-hover-shell relative rounded-[1.4rem] outline-none">
              <div className="lux-refraction-aura" />
              <div className="lux-surface lux-outline relative overflow-hidden rounded-[1.4rem] p-5 transition duration-500 group-hover/card:-translate-y-0.5 group-hover/card:bg-white/[0.055]">
                <div className="lux-refractive-edge" />
                <p
                  className="lux-refraction-title font-heading text-4xl italic leading-none text-white"
                  data-refract="配色先行"
                >
                  配色先行
                </p>
                <p className="max-h-0 translate-y-2 overflow-hidden text-sm leading-6 text-white/68 opacity-0 transition-all duration-500 group-hover/card:mt-3 group-hover/card:max-h-20 group-hover/card:translate-y-0 group-hover/card:opacity-100">
                  先选今天的主色，让衣橱单品按颜色关系排到更好选的位置。
                </p>
              </div>
            </article>
            <article className="group/card lux-hover-shell relative rounded-[1.4rem] outline-none">
              <div className="lux-refraction-aura" />
              <div className="lux-surface lux-outline relative overflow-hidden rounded-[1.4rem] p-5 transition duration-500 group-hover/card:-translate-y-0.5 group-hover/card:bg-white/[0.055]">
                <div className="lux-refractive-edge" />
                <p
                  className="lux-refraction-title font-heading text-4xl italic leading-none text-white"
                  data-refract="风格筛选"
                >
                  风格筛选
                </p>
                <p className="max-h-0 translate-y-2 overflow-hidden text-sm leading-6 text-white/68 opacity-0 transition-all duration-500 group-hover/card:mt-3 group-hover/card:max-h-20 group-hover/card:translate-y-0 group-hover/card:opacity-100">
                  再选街头、clean fit、老钱或复古，从自己的衣服里搭出完整 look。
                </p>
              </div>
            </article>
          </div>
        </div>
      </div>
    </section>
  );
}
