import Image from 'next/image';
import type { LookSlot } from '@/lib/creator-preview';

interface LookSlotCarouselStepProps {
  slot: LookSlot;
  items: Array<{ id: string; name: string; imageUrl: string }>;
  selectedItemId: string | null;
  onSelectItem: (itemId: string) => void;
}

const SLOT_LABELS: Record<LookSlot, { zh: string; en: string; description: string }> = {
  outerwear: {
    zh: '外套',
    en: 'Outerwear',
    description: '负责轮廓、肩线和第一眼气场。',
  },
  innerwear: {
    zh: '内搭',
    en: 'Innerwear',
    description: '负责基础层次和颜色过渡。',
  },
  pants: {
    zh: '裤子',
    en: 'Pants',
    description: '决定整体重心和站姿比例。',
  },
  accessory: {
    zh: '配饰',
    en: 'Accessory',
    description: '负责内容记忆点和镜头完成度。',
  },
  shoes: {
    zh: '鞋子',
    en: 'Shoes',
    description: '收住整体风格，不让下半身掉线。',
  },
};

export function LookSlotCarouselStep({
  slot,
  items,
  selectedItemId,
  onSelectItem,
}: LookSlotCarouselStepProps) {
  const slotMeta = SLOT_LABELS[slot];

  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="lux-kicker text-[11px]">{slotMeta.en}</p>
          <h4 className="mt-2 text-2xl font-serif italic text-white">{slotMeta.zh}</h4>
        </div>
        <p className="max-w-lg text-sm leading-7 text-[var(--lux-muted-foreground)]">
          {slotMeta.description}
        </p>
      </div>

      {items.length === 0 ? (
        <div className="rounded-[1.6rem] border border-white/10 bg-[rgba(255,255,255,0.03)] px-5 py-5 text-sm leading-7 text-[var(--lux-muted-foreground)]">
          当前没有适合这个部位的素材，第一版可以先保留为空，后续再扩充素材库。
        </div>
      ) : (
        <div className="overflow-x-auto pb-2">
          <div className="flex min-w-max gap-4">
            {items.map((item) => {
              const active = selectedItemId === item.id;

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onSelectItem(item.id)}
                  className={`
                    group w-[12.5rem] shrink-0 overflow-hidden rounded-[1.7rem] border text-left transition duration-300
                    ${active
                      ? 'translate-y-[-0.15rem] scale-[1.02] border-[rgba(212,177,106,0.48)] bg-[rgba(255,255,255,0.08)] shadow-[0_24px_80px_rgba(0,0,0,0.26)]'
                      : 'scale-[0.96] border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.03)] opacity-75 hover:scale-100 hover:opacity-100'}
                  `}
                >
                  <div className="relative aspect-[4/5] overflow-hidden">
                    <Image
                      src={item.imageUrl}
                      alt={item.name}
                      fill
                      unoptimized
                      sizes="12.5rem"
                      className="object-cover transition duration-500 group-hover:scale-[1.04]"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                  </div>
                  <div className="px-4 py-4">
                    <p className="text-sm text-white">{item.name}</p>
                    <p className="mt-2 text-[10px] uppercase tracking-[0.24em] text-[rgba(255,245,225,0.42)]">
                      {active ? 'Current Pick' : 'Swipe Choice'}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}
