import type { ChangeEvent } from 'react';
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
  return (
    <aside className="lux-rail rounded-[2rem] p-5 sm:p-6">
      <div>
        <p className="lux-kicker text-[11px]">Control Rail</p>
        <h2 className="mt-3 font-heading text-3xl italic text-white">场景与衣橱</h2>
        <p className="mt-3 text-sm leading-7 text-muted-lux">
          保留当前上传与单品能力，只将操作区整理为更适合编辑台的纵向布局。
        </p>
      </div>

      <div className="lux-divider my-6" />

      <section className="space-y-4">
        <div className="flex items-center gap-2 text-white">
          <ImagePlus className="h-4 w-4 text-[#d4b16a]" />
          <p className="lux-kicker text-[10px]">Backdrop Upload</p>
        </div>

        <label className="lux-stage-frame block cursor-pointer rounded-[1.5rem] p-4 transition-transform duration-200 hover:-translate-y-0.5">
          <span className="sr-only">选择照片</span>
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-white">上传模特照片</p>
              <p className="mt-2 text-sm text-muted-lux">支持 image/*，用于主舞台背景。</p>
            </div>
            <span className="rounded-full border border-white/15 px-3 py-1 text-xs tracking-[0.2em] text-white/80 uppercase">
              Select
            </span>
          </div>
          <input
            type="file"
            accept="image/*"
            onChange={onBackgroundUpload}
            className="sr-only"
          />
        </label>

        {backgroundImage ? (
          <div className="overflow-hidden rounded-[1.5rem] border border-white/10 bg-white/5">
            <img
              src={backgroundImage}
              alt="背景"
              className="h-40 w-full object-cover"
            />
          </div>
        ) : (
          <div className="rounded-[1.5rem] border border-dashed border-white/15 bg-white/[0.03] px-4 py-6 text-sm text-muted-lux">
            暂无背景图。上传后会立即出现在主舞台中。
          </div>
        )}
      </section>

      <div className="lux-divider my-6" />

      <section>
        <div className="flex items-center gap-2 text-white">
          <Shirt className="h-4 w-4 text-[#d4b16a]" />
          <p className="lux-kicker text-[10px]">Wardrobe Edit</p>
        </div>
        <div className="mt-4 space-y-3">
          {clothingItems.map((item) => (
            <div
              key={item.id}
              className="flex items-center gap-3 rounded-[1.25rem] border border-white/10 bg-white/[0.04] p-3 transition-colors hover:bg-white/[0.07]"
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
      </section>

      <div className="mt-6">
        <button className="flex w-full items-center justify-center gap-2 rounded-full border border-white/15 bg-white/[0.08] px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-white/[0.12]">
          <Plus className="h-4 w-4" />
          添加衣物
        </button>
      </div>
    </aside>
  );
}
