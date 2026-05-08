'use client';

import { useEffect, useRef, useState } from 'react';
import * as fabric from 'fabric';
import { ClothingTransform, PreviewClothingItem } from '@/types';

interface CanvasPreviewProps {
  backgroundImage?: string;
  clothingItems: PreviewClothingItem[];
  onPositionChange?: (item: PreviewClothingItem, transform: ClothingTransform) => void;
  width?: number;
  height?: number;
}

export default function CanvasPreview({
  backgroundImage,
  clothingItems,
  onPositionChange,
  width = 800,
  height = 1200,
}: CanvasPreviewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [fabricCanvas, setFabricCanvas] = useState<fabric.Canvas | null>(null);
  const [selectedItem, setSelectedItem] = useState<string | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    // 初始化 Fabric.js Canvas
    const canvas = new fabric.Canvas(canvasRef.current, {
      width,
      height,
      backgroundColor: '#f5f5f5',
      selection: true,
    });

    setFabricCanvas(canvas);

    // 清理函数
    return () => {
      canvas.dispose();
    };
  }, [width, height]);

  // 加载背景图片
  useEffect(() => {
    if (!fabricCanvas) return;

    const loadBackground = async () => {
      if (backgroundImage) {
        try {
          fabric.FabricImage.fromURL(backgroundImage).then((img) => {
            // 调整背景图片大小以适应canvas
            const scale = Math.min(width / (img.width || 1), height / (img.height || 1));
            img.scale(scale);

            fabricCanvas.set('backgroundImage', img);
            fabricCanvas.requestRenderAll();
          });
        } catch (error) {
          console.error('Error loading background image:', error);
        }
      } else {
        fabricCanvas.set('backgroundImage', undefined);
        fabricCanvas.requestRenderAll();
      }
    };

    loadBackground();
  }, [backgroundImage, fabricCanvas, width, height]);

  // 添加衣物到canvas
  useEffect(() => {
    if (!fabricCanvas) return;

    // 清除现有的衣物对象（保留背景）
    const objects = fabricCanvas.getObjects();
    objects.forEach(obj => fabricCanvas.remove(obj));

    // 添加每个衣物
    clothingItems.forEach((item) => {
      fabric.FabricImage.fromURL(item.imageUrl).then((img) => {
        img.set({
          left: item.position.x,
          top: item.position.y,
          scaleX: item.scale.x,
          scaleY: item.scale.y,
          angle: item.rotation,
          opacity: item.opacity,
          selectable: true,
          hasControls: true,
          hasBorders: true,
        });

        // 设置控制点
        img.setControlsVisibility({
          mt: true, // middle top
          mb: true, // middle bottom
          ml: true, // middle left
          mr: true, // middle right
          tl: true, // top left
          tr: true, // top right
          bl: true, // bottom left
          br: true, // bottom right
          mtr: true, // middle top rotation
        });

        // 事件监听
        img.on('modified', () => {
          const transform: ClothingTransform = {
            position: { x: img.left || 0, y: img.top || 0 },
            scale: { x: img.scaleX || 1, y: img.scaleY || 1 },
            rotation: img.angle || 0,
            opacity: img.opacity || 1,
          };

          onPositionChange?.(item, transform);
        });

        img.on('selected', () => {
          setSelectedItem(item.id);
        });

        img.on('deselected', () => {
          setSelectedItem(null);
        });

        fabricCanvas.add(img);
        fabricCanvas.requestRenderAll();
      });
    });
  }, [clothingItems, fabricCanvas, onPositionChange]);

  // 保存canvas为图片
  const saveAsImage = () => {
    if (!fabricCanvas) return;

    const dataURL = fabricCanvas.toDataURL({
      format: 'png',
      quality: 1,
      multiplier: 1,
    });

    // 创建下载链接
    const link = document.createElement('a');
    link.download = 'outfit-preview.png';
    link.href = dataURL;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // 清除选中
  const clearSelection = () => {
    if (fabricCanvas) {
      fabricCanvas.discardActiveObject();
      fabricCanvas.requestRenderAll();
    }
  };

  return (
    <div className="relative mx-auto w-fit">
      <div className="overflow-hidden rounded-[1.2rem] border border-white/10 bg-[#f5f5f5] shadow-[0_18px_60px_rgba(0,0,0,0.32)]">
        <canvas ref={canvasRef} />
      </div>

      {/* 控制面板 */}
      <div className="pointer-events-none absolute inset-x-4 bottom-4">
        <div className="pointer-events-auto rounded-[1.5rem] border border-white/12 bg-black/72 p-3 text-white shadow-[0_20px_50px_rgba(0,0,0,0.45)] backdrop-blur-xl">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap gap-2">
              <button
                onClick={clearSelection}
                className="rounded-full border border-white/14 bg-white/[0.08] px-4 py-2 text-sm text-white transition-colors hover:bg-white/[0.14]"
              >
                清除选中
              </button>
              <button
                onClick={saveAsImage}
                className="rounded-full border border-[#d4b16a]/40 bg-[#d4b16a] px-4 py-2 text-sm font-medium text-[#16110a] transition-colors hover:bg-[#e1c07b]"
              >
                保存图片
              </button>
            </div>
            {selectedItem ? (
              <div className="inline-flex items-center gap-2 self-start rounded-full border border-white/14 bg-white/[0.08] px-3 py-2 text-sm text-white/[0.88] sm:self-auto">
                <span className="h-2 w-2 rounded-full bg-[#d4b16a]" />
                已选中: {clothingItems.find(item => item.id === selectedItem)?.name}
              </div>
            ) : (
              <div className="text-sm text-white/55">选择单品后可查看当前编辑对象</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
