import { Palette, ScanFace, Shirt } from "lucide-react";

const cards = [
  {
    title: "本人入镜",
    body: "先上传本人照片，让后续每次搭配都围绕同一个身形、姿态和镜头气质生成预览。",
    icon: ScanFace,
    tags: ["Portrait", "Fit Base", "Preview"],
  },
  {
    title: "衣橱筛选",
    body: "按今日配色和风格，从自己的橱窗里优先推送更匹配的外套、内搭、下装、鞋子和配饰。",
    icon: Palette,
    tags: ["Color", "Style", "Wardrobe"],
  },
  {
    title: "游戏式选衣",
    body: "像换装游戏一样按部位挑选单品，搭出完整 look 后生成一张可保存、可下载的上身预览。",
    icon: Shirt,
    tags: ["Outfit", "Slots", "Generate"],
  },
];

export default function CapabilityCardsSection() {
  return (
    <section id="capabilities" className="px-4 py-24 sm:px-6 lg:px-10">
      <div className="mx-auto max-w-7xl">
        <p className="text-sm uppercase tracking-[0.22em] text-white/44">Why it helps</p>
        <div className="mt-10 grid gap-6 lg:grid-cols-3">
          {cards.map((card) => {
            const Icon = card.icon;

            return (
              <article
                key={card.title}
                className="group/card lux-hover-shell relative rounded-[1.8rem] outline-none"
              >
                <div className="lux-refraction-aura" />
                <div className="lux-surface lux-outline relative flex min-h-[240px] flex-col overflow-hidden rounded-[1.8rem] p-6 transition duration-500 group-hover/card:-translate-y-0.5 group-hover/card:bg-white/[0.055] sm:min-h-[260px] sm:p-7">
                  <div className="lux-refractive-edge" />

                  <div className="relative flex items-start justify-between gap-4">
                    <div className="lux-surface rounded-[1rem] p-3">
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                    <div className="flex max-w-[70%] flex-wrap justify-end gap-2">
                      {card.tags.map((tag) => (
                        <span
                          key={tag}
                          className="lux-surface rounded-full px-3 py-1 text-[11px] text-white/76"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="relative mt-auto pt-8 sm:pt-10">
                    <h3
                      className="lux-refraction-title font-heading text-4xl italic leading-none text-white"
                      data-refract={card.title}
                    >
                      {card.title}
                    </h3>
                    <p className="max-h-0 translate-y-2 overflow-hidden text-sm leading-7 text-white/68 opacity-0 transition-all duration-500 group-hover/card:mt-3 group-hover/card:max-h-24 group-hover/card:translate-y-0 group-hover/card:opacity-100">
                      {card.body}
                    </p>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
