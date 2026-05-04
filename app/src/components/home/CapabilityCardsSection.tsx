import { Layers3, ScanFace, Sparkles } from "lucide-react";

const cards = [
  {
    title: "真实轮廓",
    body: "更准确地判断服装如何贴合人物线条，而不是只看一张被滤镜撑起来的成片。",
    icon: ScanFace,
    tags: ["Silhouette", "Proportion", "Presence"],
  },
  {
    title: "快速换装",
    body: "同一张人物底稿上迅速比较多组服装方向，把犹豫留在生成前，而不是下单后。",
    icon: Layers3,
    tags: ["Fast Switch", "Compare", "Edit Flow"],
  },
  {
    title: "风格比较",
    body: "把不同气质的搭配放进同一叙事背景里衡量，找到最接近你想表达的那一套。",
    icon: Sparkles,
    tags: ["Mood", "Styling", "Narrative"],
  },
];

export default function CapabilityCardsSection() {
  return (
    <section id="capabilities" className="px-4 py-24 sm:px-6 lg:px-10">
      <div className="mx-auto max-w-7xl">
        <p className="text-sm uppercase tracking-[0.22em] text-white/44">Capabilities</p>
        <div className="mt-10 grid gap-6 lg:grid-cols-3">
          {cards.map((card) => {
            const Icon = card.icon;

            return (
              <article
                key={card.title}
                className="lux-surface lux-outline flex min-h-[320px] flex-col rounded-[1.8rem] p-7"
              >
                <div className="flex items-start justify-between gap-4">
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

                <div className="mt-auto pt-16">
                  <h3 className="font-heading text-4xl italic leading-none text-white">
                    {card.title}
                  </h3>
                  <p className="mt-4 max-w-[30ch] text-sm leading-7 text-white/66">
                    {card.body}
                  </p>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
