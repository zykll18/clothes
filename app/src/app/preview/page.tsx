'use client';

import { useState } from 'react';
import CanvasPreview from '@/components/canvas/CanvasPreview';
import { ClothingTransform, PreviewClothingItem } from '@/types';

export default function PreviewPage() {
  const [backgroundImage, setBackgroundImage] = useState<string>('');
  const [clothingItems, setClothingItems] = useState<PreviewClothingItem[]>([
    {
      id: '1',
      userId: '',
      name: '示例上衣',
      category: 'TOP',
      clothType: 'T_SHIRT',
      imageUrl: '/images/sample-top.png',
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

  const handleBackgroundUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
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
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">搭配预览</h1>
          <p className="text-gray-600">上传你的照片和衣物，实时预览搭配效果</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* 左侧控制面板 */}
          <div className="lg:col-span-1 space-y-6">
            {/* 背景上传 */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-lg font-semibold mb-4">上传照片</h2>
              <label className="block w-full">
                <span className="sr-only">选择照片</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleBackgroundUpload}
                  className="block w-full text-sm text-gray-500
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-full file:border-0
                    file:text-sm file:font-semibold
                    file:bg-blue-50 file:text-blue-700
                    hover:file:bg-blue-100"
                />
              </label>
              {backgroundImage && (
                <div className="mt-4">
                  <img
                    src={backgroundImage}
                    alt="背景"
                    className="w-full h-32 object-cover rounded-lg"
                  />
                </div>
              )}
            </div>

            {/* 衣物列表 */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-lg font-semibold mb-4">我的衣物</h2>
              <div className="space-y-2">
                {clothingItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded-lg cursor-pointer"
                  >
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      className="w-12 h-12 object-cover rounded"
                    />
                    <div className="flex-1">
                      <p className="text-sm font-medium">{item.name}</p>
                      <p className="text-xs text-gray-500">{item.category}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 添加衣物按钮 */}
            <button className="w-full py-3 px-4 bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-colors">
              + 添加衣物
            </button>
          </div>

          {/* 右侧Canvas区域 */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-lg shadow-md p-6">
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
  );
}
