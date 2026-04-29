'use client';

import { useEffect, useRef, useState } from 'react';
import * as fabric from 'fabric';
import { ClothingItem, ClothingTransform } from '@/types';

interface CanvasPreviewProps {
  backgroundImage?: string;
  clothingItems: ClothingItem[];
  onPositionChange?: (item: ClothingItem, transform: ClothingTransform) => void;
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

            fabricCanvas.setBackgroundImage(img, fabricCanvas.requestRenderAll.bind(fabricCanvas));
          });
        } catch (error) {
          console.error('Error loading background image:', error);
        }
      } else {
        fabricCanvas.setBackgroundImage(null, fabricCanvas.requestRenderAll.bind(fabricCanvas));
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
    <div className="relative">
      <canvas ref={canvasRef} />

      {/* 控制面板 */}
      <div className="absolute bottom-4 left-4 right-4 bg-white rounded-lg shadow-lg p-4">
        <div className="flex items-center justify-between">
          <div className="flex space-x-2">
            <button
              onClick={clearSelection}
              className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg transition-colors"
            >
              清除选中
            </button>
            <button
              onClick={saveAsImage}
              className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-colors"
            >
              保存图片
            </button>
          </div>
          {selectedItem && (
            <div className="text-sm text-gray-600">
              已选中: {clothingItems.find(item => item.id === selectedItem)?.name}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
