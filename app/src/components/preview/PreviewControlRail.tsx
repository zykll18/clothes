import { useRef, type ChangeEvent } from 'react';
import { ImagePlus, Plus, Shirt } from 'lucide-react';
import { PreviewClothingItem } from '@/types';

interface PreviewControlRailProps {
  backgroundImage: string;
  clothingItems: PreviewClothingItem[];
  onBackgroundUpload: (e: ChangeEvent<HTMLInputElement>) => void;
}

export function PreviewControlRail({
  backgroundImage,
  clothingItems,
  onBackgroundUpload,
}: PreviewControlRailProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const hasBackgroundImage = Boolean(backgroundImage);
  const itemCount = clothingItems.length;
  const hasClothingItems = itemCount > 0;
  const stageLabel = hasBackgroundImage
    ? hasClothingItems
      ? 'Editorial compose'
      : 'Backdrop ready'
    : hasClothingItems
      ? 'Wardrobe blocking'
      : 'Awaiting setup';
  const stageDescription = hasBackgroundImage
    ? hasClothingItems
      ? '背景与单品都已进场，可以专注构图、层次和最终留白。'
      : '背景已就位，但还需要确认舞台中的造型单品。'
    : hasClothingItems
      ? '单品已就位，补上模特底图后即可进入精修构图。'
      : '先把背景与单品准备好，再进入真正的定稿阶段。';

  return (
    <aside className="flex flex-col gap-6">
      <section className="lux-rail rounded-[2rem] p-5 sm:p-6">
        <div>
          <p className="lux-kicker text-[11px]">Control Rail</p>
          <h2 className="mt-3 font-heading text-3xl italic text-white">场景与衣橱</h2>
          <p className="mt-3 text-sm leading-7 text-muted-lux">
            这里保留现有上传、列表浏览与添加入口，只把它们整理成更像编辑台操作区的纵向节奏。
          </p>
        </div>

        <div className="lux-divider my-6" />

        <section className="space-y-4">
          <div className="flex items-center gap-2 text-white">
            <ImagePlus className="h-4 w-4 text-[#d4b16a]" />
            <p className="lux-kicker text-[10px]">Backdrop Control</p>
          </div>

          <div className="lux-stage-frame rounded-[1.5rem] p-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-white">上传模特底图</p>
                <p className="mt-2 text-sm text-muted-lux">支持 image/*，上传后会直接接入右侧主舞台。</p>
              </div>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="rounded-full border border-white/15 bg-white/[0.08] px-4 py-2 text-xs tracking-[0.2em] text-white/85 uppercase transition-colors hover:bg-white/[0.12] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d4b16a] focus-visible:ring-offset-2 focus-visible:ring-offset-[#111]"
              >
                Select
              </button>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={onBackgroundUpload}
              className="sr-only"
            />
          </div>

          {backgroundImage ? (
            <div className="overflow-hidden rounded-[1.5rem] border border-white/10 bg-white/5">
              <div className="flex items-center justify-between border-b border-white/10 px-4 py-3 text-[11px] tracking-[0.2em] text-white/45 uppercase">
                <span>Backdrop Ready</span>
                <span>Live on Stage</span>
              </div>
              <img
                src={backgroundImage}
                alt="背景"
                className="h-40 w-full object-cover"
              />
            </div>
          ) : (
            <div className="rounded-[1.5rem] border border-dashed border-white/15 bg-white/[0.03] px-4 py-6 text-sm text-muted-lux">
              暂无背景图。底图就位后，主舞台会立即切换到当前构图环境。
            </div>
          )}
        </section>

        <div className="lux-divider my-6" />

        <section>
          <div className="flex items-center gap-2 text-white">
            <Shirt className="h-4 w-4 text-[#d4b16a]" />
            <p className="lux-kicker text-[10px]">Wardrobe List</p>
          </div>
          <div className="mt-4 space-y-3">
            {clothingItems.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-3 rounded-[1.25rem] border border-white/10 bg-white/[0.04] p-3"
              >
                <img
                  src={item.imageUrl}
                  alt={item.name}
                  className="h-14 w-14 rounded-[1rem] object-cover"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-white">{item.name}</p>
                  <p className="mt-1 text-xs tracking-[0.18em] text-white/45 uppercase">
                    {item.category}
                  </p>
                </div>
              </div>
            ))}
          </div>
          <p className="mt-4 text-sm leading-6 text-muted-lux">
            当前可用单品会保持原有列表显示与画布联动，主舞台中的拖拽和缩放行为不变。
          </p>
        </section>

        <div className="mt-6">
          <button className="flex w-full items-center justify-center gap-2 rounded-full border border-white/15 bg-white/[0.08] px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-white/[0.12]">
            <Plus className="h-4 w-4" />
            添加衣物
          </button>
        </div>
      </section>

      <section className="lux-stage-frame lux-noise rounded-[2rem] p-5 sm:p-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="lux-kicker text-[11px]">Composition Summary</p>
            <h3 className="mt-3 font-heading text-2xl italic text-white">当前成片摘要</h3>
          </div>
          <div className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-1 text-[10px] tracking-[0.22em] text-white/55 uppercase">
            {stageLabel}
          </div>
        </div>

        <p className="mt-3 text-sm leading-7 text-muted-lux">{stageDescription}</p>

        <div className="mt-6 grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
          <div className="rounded-[1.25rem] border border-white/10 bg-white/[0.04] px-4 py-4">
            <p className="lux-kicker text-[10px]">Backdrop</p>
            <p className="mt-2 text-lg text-white">{hasBackgroundImage ? 'Ready' : 'Pending'}</p>
          </div>
          <div className="rounded-[1.25rem] border border-white/10 bg-white/[0.04] px-4 py-4">
            <p className="lux-kicker text-[10px]">Wardrobe</p>
            <p className="mt-2 text-lg text-white">{itemCount} piece{itemCount === 1 ? '' : 's'}</p>
          </div>
          <div className="rounded-[1.25rem] border border-white/10 bg-white/[0.04] px-4 py-4">
            <p className="lux-kicker text-[10px]">Stage</p>
            <p className="mt-2 text-lg text-white">{stageLabel}</p>
          </div>
        </div>

        <div className="lux-divider my-6" />

        <div>
          <p className="lux-kicker text-[10px]">Pre-Export Check</p>
          <div className="mt-4 space-y-3">
            <div className="flex items-start justify-between gap-4 rounded-[1.2rem] border border-white/10 bg-white/[0.035] px-4 py-3">
              <div>
                <p className="text-sm text-white">模特底图是否已就位</p>
                <p className="mt-1 text-xs leading-6 text-muted-lux">决定主舞台的构图基准与视线关系。</p>
              </div>
              <span className="text-xs tracking-[0.18em] text-white/60 uppercase">
                {hasBackgroundImage ? 'Checked' : 'Pending'}
              </span>
            </div>

            <div className="flex items-start justify-between gap-4 rounded-[1.2rem] border border-white/10 bg-white/[0.035] px-4 py-3">
              <div>
                <p className="text-sm text-white">单品数量是否适合当前构图</p>
                <p className="mt-1 text-xs leading-6 text-muted-lux">用现有清单确认前后景层次是否足够。</p>
              </div>
              <span className="text-xs tracking-[0.18em] text-white/60 uppercase">
                {hasClothingItems ? 'Checked' : 'Pending'}
              </span>
            </div>

            <div className="flex items-start justify-between gap-4 rounded-[1.2rem] border border-white/10 bg-white/[0.035] px-4 py-3">
              <div>
                <p className="text-sm text-white">导出前再看一遍留白与重叠</p>
                <p className="mt-1 text-xs leading-6 text-muted-lux">这一步不新增功能，只提醒在主舞台内完成最终视觉确认。</p>
              </div>
              <span className="text-xs tracking-[0.18em] text-white/60 uppercase">Review</span>
            </div>
          </div>
        </div>
      </section>
    </aside>
  );
}
