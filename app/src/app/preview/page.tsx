'use client';

import type { ChangeEvent } from 'react';
import { useState } from 'react';
import CanvasPreview from '@/components/canvas/CanvasPreview';
import { PreviewAtelierHeader } from '@/components/preview/PreviewAtelierHeader';
import { PreviewControlRail } from '@/components/preview/PreviewControlRail';
import { ClothingTransform, PreviewClothingItem } from '@/types';

export default function PreviewPage() {
  const [backgroundImage, setBackgroundImage] = useState<string>('');
  const [clothingItems, setClothingItems] = useState<PreviewClothingItem[]>([
    {
      id: '1',
      userId: '',
      name: '示例上衣',
      category: 'TOP',
      clothType: 'upper',
      imageUrl: '/images/presets/outer-black-blazer.svg',
      color: '#000000',
      brand: null,
      price: null,
      size: null,
      material: null,
      tags: '',
      position: { x: 300, y: 200 },
      scale: { x: 0.8, y: 0.8 },
      rotation: 0,
      opacity: 0.8,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ]);

  const handlePositionChange = (item: PreviewClothingItem, transform: ClothingTransform) => {
    setClothingItems(prev =>
      prev.map(prevItem =>
        prevItem.id === item.id
          ? { ...prevItem, ...transform }
          : prevItem
      )
    );
  };

  const handleBackgroundUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setBackgroundImage(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="lux-page">
      <div className="lux-hero-grid">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-10">
          <PreviewAtelierHeader
            itemCount={clothingItems.length}
            hasBackgroundImage={Boolean(backgroundImage)}
          />

          <div className="grid gap-8 xl:grid-cols-[20rem_minmax(0,1fr)] xl:items-start">
            <PreviewControlRail
              backgroundImage={backgroundImage}
              clothingItems={clothingItems}
              onBackgroundUpload={handleBackgroundUpload}
            />

            <div className="lux-stage-frame lux-noise rounded-[2rem] p-4 sm:p-6 lg:p-8 xl:p-9">
              <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                <div className="max-w-3xl">
                  <p className="lux-kicker text-[11px]">Refinement Stage</p>
                  <h2 className="mt-3 font-heading text-3xl italic text-white sm:text-4xl lg:text-[2.8rem]">
                    生成之后，在这里把造型修到能出片。
                  </h2>
                  <p className="mt-3 max-w-2xl text-sm leading-7 text-muted-lux sm:text-base">
                    保持现有 Fabric 编辑行为不变，只把这一站重新整理成真正的摄影棚定稿台:
                    右侧专注构图、层次与轮廓，左侧只保留必要控制与成片摘要。
                  </p>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="lux-rail rounded-[1.5rem] px-4 py-3.5">
                    <p className="lux-kicker text-[10px]">Canvas Format</p>
                    <p className="mt-2 text-sm text-white/90">800 × 1200 editorial frame</p>
                  </div>
                  <div className="lux-rail rounded-[1.5rem] px-4 py-3.5">
                    <p className="lux-kicker text-[10px]">Current Pass</p>
                    <p className="mt-2 text-sm text-white/90">
                      {backgroundImage ? 'Backdrop aligned' : 'Awaiting backdrop'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="lux-divider my-6 sm:my-8" />

              <div className="rounded-[1.9rem] border border-white/10 bg-[#0a0a0a] p-3 shadow-[0_28px_80px_rgba(0,0,0,0.45)] sm:p-5 lg:p-6">
                <div className="overflow-hidden rounded-[1.35rem] border border-white/8 bg-[#111]">
                  <div className="flex flex-col gap-2 border-b border-white/10 px-4 py-3 text-xs tracking-[0.22em] text-white/45 uppercase sm:flex-row sm:items-center sm:justify-between">
                    <span>Atelier View</span>
                    <span>{backgroundImage ? 'Backdrop Live' : 'Backdrop Pending'}</span>
                  </div>
                  <div className="flex flex-col gap-1 border-b border-white/8 px-4 py-3 text-xs text-white/58 sm:flex-row sm:items-center sm:justify-between">
                    <p>Fine-tune placement, overlap, and negative space before export.</p>
                    <p>{clothingItems.length} styled piece{clothingItems.length === 1 ? '' : 's'} in frame</p>
                  </div>
                  <div className="flex justify-center bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.08),transparent_42%),linear-gradient(180deg,#151515_0%,#090909_100%)] p-3 sm:p-5">
                    <CanvasPreview
                      backgroundImage={backgroundImage}
                      clothingItems={clothingItems}
                      onPositionChange={handlePositionChange}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
