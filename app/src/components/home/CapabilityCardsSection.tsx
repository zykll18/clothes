import { Layers3, ScanFace, Sparkles } from "lucide-react";

const cards = [
  {
    title: "人物底稿",
    body: "用同一张人物照锁定轮廓、姿态与比例，让每个方向都建立在同一个人设和气质锚点上。",
    icon: ScanFace,
    tags: ["Identity", "Silhouette", "Consistency"],
  },
  {
    title: "三向对比",
    body: "同一套 look 一次返回 3 个内容方向，把街头、老钱、clean fit 这类不同气质放在一屏里判断。",
    icon: Layers3,
    tags: ["3 Variants", "Compare", "Direction"],
  },
  {
    title: "主推定版",
    body: "生成后手动选定这次主推版本，把结果留下来给拍摄、封面、选题和品牌沟通继续使用。",
    icon: Sparkles,
    tags: ["Hero Pick", "Save", "Download"],
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
