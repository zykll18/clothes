import { Sparkles } from 'lucide-react';

interface PreviewAtelierHeaderProps {
  itemCount: number;
  hasBackgroundImage: boolean;
}

export function PreviewAtelierHeader({
  itemCount,
  hasBackgroundImage,
}: PreviewAtelierHeaderProps) {
  return (
    <header className="lux-stage-frame lux-noise rounded-[2rem] px-5 py-6 sm:px-8 sm:py-7">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-3xl">
          <p className="lux-kicker text-[11px] sm:text-xs">Preview Atelier</p>
          <h1 className="mt-4 font-heading text-4xl italic leading-[0.9] tracking-[-0.03em] text-white sm:text-5xl lg:text-6xl">
            在摄影棚里微调整套造型。
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-muted-lux sm:text-base">
            上传模特底图，在主舞台中查看当前造型排版，围绕光线、层次与轮廓完成最终定稿。
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="lux-rail rounded-[1.5rem] px-4 py-4">
            <p className="lux-kicker text-[10px]">Stage Status</p>
            <p className="mt-3 text-2xl text-white">{hasBackgroundImage ? 'Ready' : 'Awaiting'}</p>
            <p className="mt-2 text-sm text-muted-lux">
              {hasBackgroundImage ? '背景已就位，可直接进入排版。' : '先上传底图，再开始布置造型。'}
            </p>
          </div>

          <div className="lux-rail rounded-[1.5rem] px-4 py-4">
            <div className="flex items-center gap-2 text-white">
              <Sparkles className="h-4 w-4 text-[#d4b16a]" />
              <p className="lux-kicker text-[10px]">Wardrobe Loaded</p>
            </div>
            <p className="mt-3 text-2xl text-white">{itemCount}</p>
            <p className="mt-2 text-sm text-muted-lux">
              当前舞台可用单品列表，供造型查看与导出前确认。
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}
