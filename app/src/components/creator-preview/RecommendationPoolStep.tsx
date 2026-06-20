import { useMemo } from 'react';
import Image from 'next/image';
import type { SystemPreviewItem } from '@/components/creator-preview/systemItems';

interface WardrobePreviewItem {
  id: string;
  name: string;
  imageUrl: string;
  clothType: string;
  color?: string;
}

interface RecommendationPoolStepProps {
  wardrobeItems: WardrobePreviewItem[];
  systemItems: SystemPreviewItem[];
  primaryColor: string;
  selectedSourceImage: string | null;
  onSelectSourceImage: (imageUrl: string) => void;
}

function normalizeColor(value?: string | null): string | null {
  if (!value) return null;
  return value.trim().toLowerCase();
}

function colorMatches(primaryColor: string, candidate?: string) {
  const normalizedCandidate = normalizeColor(candidate);
  if (!normalizedCandidate) return false;

  const normalizedPrimary = primaryColor.toLowerCase();
  return normalizedCandidate.includes(normalizedPrimary) || normalizedPrimary.includes(normalizedCandidate);
}

export function RecommendationPoolStep({
  wardrobeItems,
  systemItems,
  primaryColor,
  selectedSourceImage,
  onSelectSourceImage,
}: RecommendationPoolStepProps) {
  const [recommendedUserItems, recommendedSystemItems] = useMemo(() => {
    const user = [...wardrobeItems].sort((left, right) => {
      const leftScore = colorMatches(primaryColor, left.color) ? 1 : 0;
      const rightScore = colorMatches(primaryColor, right.color) ? 1 : 0;
      return rightScore - leftScore;
    });

    const system = [...systemItems].sort((left, right) => {
      const leftScore = left.colorTag === primaryColor ? 1 : 0;
      const rightScore = right.colorTag === primaryColor ? 1 : 0;
      return rightScore - leftScore;
    });

    return [user, system];
  }, [primaryColor, systemItems, wardrobeItems]);

  return (
    <div className="space-y-8">
      <div className="max-w-3xl">
        <p className="lux-kicker text-[11px]">Wardrobe Recommendation Pool</p>
        <h3 className="mt-3 font-serif text-3xl italic text-white sm:text-4xl">
          先从素材池里挑一个今天的主画面。
        </h3>
        <p className="mt-4 text-sm leading-7 text-[var(--lux-muted-foreground)] sm:text-base">
          用户衣橱和系统单品会混排出现。第一版里，这里选中的衣服会进入 AI 渲染，后面的部位选择继续补齐本次搭配上下文。
        </p>
      </div>

      <div className="grid gap-8 xl:grid-cols-2">
        <section className="space-y-4">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="lux-kicker text-[11px]">Your Library</p>
              <h4 className="mt-2 text-xl text-white">用户素材</h4>
            </div>
            <span className="rounded-full border border-white/10 px-3 py-1 text-[10px] uppercase tracking-[0.22em] text-[rgba(255,245,225,0.46)]">
              {wardrobeItems.length} Items
            </span>
          </div>

          {recommendedUserItems.length === 0 ? (
            <div className="rounded-[1.75rem] border border-white/10 bg-[rgba(255,255,255,0.03)] px-5 py-6 text-sm leading-7 text-[var(--lux-muted-foreground)]">
              你的素材库里还没有可用衣物。可以先去个人中心补一些单品素材，再回来混排。
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {recommendedUserItems.map((item) => {
                const active = selectedSourceImage === item.imageUrl;
                const recommended = colorMatches(primaryColor, item.color);

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => onSelectSourceImage(item.imageUrl)}
                    className={`
                      group overflow-hidden rounded-[1.6rem] border text-left transition duration-300
                      ${active
                        ? 'border-[rgba(212,177,106,0.48)] bg-[rgba(255,255,255,0.08)] shadow-[0_20px_70px_rgba(0,0,0,0.24)]'
                        : 'border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.03)] hover:-translate-y-1 hover:border-[rgba(212,177,106,0.26)]'}
                    `}
                  >
                    <div className="relative aspect-[4/5] overflow-hidden">
                      <Image
                        src={item.imageUrl}
                        alt={item.name}
                        fill
                        unoptimized
                        sizes="(min-width: 640px) 18rem, 50vw"
                        className="object-cover transition duration-500 group-hover:scale-[1.03]"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                      <div className="absolute left-3 top-3 flex flex-wrap gap-2">
                        <span className="rounded-full border border-white/10 bg-black/30 px-3 py-1 text-[10px] uppercase tracking-[0.22em] text-white/85">
                          User
                        </span>
                        {recommended ? (
                          <span className="rounded-full border border-[rgba(212,177,106,0.36)] bg-[rgba(212,177,106,0.18)] px-3 py-1 text-[10px] uppercase tracking-[0.22em] text-[rgba(255,245,225,0.9)]">
                            Color Match
                          </span>
                        ) : null}
                      </div>
                    </div>
                    <div className="px-4 py-4">
                      <p className="text-sm text-white">{item.name}</p>
                      <p className="mt-2 text-xs uppercase tracking-[0.22em] text-[rgba(255,245,225,0.44)]">
                        {item.color || 'No color tag'}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </section>

        <section className="space-y-4">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="lux-kicker text-[11px]">System Presets</p>
              <h4 className="mt-2 text-xl text-white">系统单品</h4>
            </div>
            <span className="rounded-full border border-white/10 px-3 py-1 text-[10px] uppercase tracking-[0.22em] text-[rgba(255,245,225,0.46)]">
              Curated
            </span>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {recommendedSystemItems.map((item) => {
              const active = selectedSourceImage === item.imageUrl;
              const recommended = item.colorTag === primaryColor;

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onSelectSourceImage(item.imageUrl)}
                  className={`
                    group overflow-hidden rounded-[1.6rem] border text-left transition duration-300
                    ${active
                      ? 'border-[rgba(212,177,106,0.48)] bg-[rgba(255,255,255,0.08)] shadow-[0_20px_70px_rgba(0,0,0,0.24)]'
                      : 'border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.03)] hover:-translate-y-1 hover:border-[rgba(212,177,106,0.26)]'}
                  `}
                >
                  <div className="relative aspect-[4/5] overflow-hidden">
                    <Image
                      src={item.imageUrl}
                      alt={item.name}
                      fill
                      unoptimized
                      sizes="(min-width: 640px) 18rem, 50vw"
                      className="object-cover transition duration-500 group-hover:scale-[1.03]"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                    <div className="absolute left-3 top-3 flex flex-wrap gap-2">
                      <span className="rounded-full border border-white/10 bg-black/30 px-3 py-1 text-[10px] uppercase tracking-[0.22em] text-white/85">
                        System
                      </span>
                      {recommended ? (
                        <span className="rounded-full border border-[rgba(212,177,106,0.36)] bg-[rgba(212,177,106,0.18)] px-3 py-1 text-[10px] uppercase tracking-[0.22em] text-[rgba(255,245,225,0.9)]">
                          Color Match
                        </span>
                      ) : null}
                    </div>
                  </div>
                  <div className="px-4 py-4">
                    <p className="text-sm text-white">{item.name}</p>
                    <p className="mt-2 text-xs uppercase tracking-[0.22em] text-[rgba(255,245,225,0.44)]">
                      {item.colorTag}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}
