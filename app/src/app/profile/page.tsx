'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import NextImage from 'next/image';
import { useRouter } from 'next/navigation';
import {
  Download,
  LogOut,
  Palette,
  Plus,
  Shirt,
  Sparkles,
  Trash2,
  Upload,
  User,
  X,
} from 'lucide-react';
import { DIRECTION_LABELS, type CreatorDirection } from '@/lib/creator-preview';

type BodyType = 'SLIM' | 'REGULAR' | 'ATHLETIC' | 'PLUS_SIZE';
type ClothingCategory = 'TOP' | 'BOTTOM' | 'DRESS' | 'OUTERWEAR' | 'SHOES' | 'ACCESSORY';
type ClothingType = 'upper' | 'lower' | 'full';

interface ProfileUser {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  height?: number;
  weight?: number;
  bodyType?: BodyType;
}

interface CreatorPreviewVariant {
  id: string;
  direction: CreatorDirection;
  sortOrder: number;
  resultUrl: string;
  presentationTone: string;
  selected: boolean;
}

interface CreatorPreviewSession {
  id: string;
  personImageUrl: string;
  sourceImageUrl: string;
  primaryColor: string;
  directionTags: CreatorDirection[];
  selectedDirection: CreatorDirection;
  createdAt: string;
  variants: CreatorPreviewVariant[];
}

interface ClothingItem {
  id: string;
  name: string;
  category: ClothingCategory;
  clothType: ClothingType;
  imageUrl: string;
  color?: string;
  brand?: string;
  createdAt: string;
}

const CATEGORY_OPTIONS: Array<{
  value: ClothingCategory;
  label: string;
  clothType: ClothingType;
}> = [
  { value: 'OUTERWEAR', label: '外套', clothType: 'upper' },
  { value: 'TOP', label: '内搭 / 上装', clothType: 'upper' },
  { value: 'BOTTOM', label: '裤子 / 下装', clothType: 'lower' },
  { value: 'SHOES', label: '鞋子', clothType: 'lower' },
  { value: 'ACCESSORY', label: '配饰', clothType: 'full' },
  { value: 'DRESS', label: '连体 / 套装', clothType: 'full' },
];

function getBodyTypeLabel(bodyType?: BodyType) {
  if (bodyType === 'SLIM') return '瘦削';
  if (bodyType === 'REGULAR') return '标准';
  if (bodyType === 'ATHLETIC') return '健壮';
  if (bodyType === 'PLUS_SIZE') return '丰满';
  return '未设置';
}

function getCategoryLabel(category: ClothingCategory) {
  const match = CATEGORY_OPTIONS.find((item) => item.value === category);
  return match?.label ?? category;
}

function getSelectedVariant(session: CreatorPreviewSession) {
  return (
    session.variants.find((variant) => variant.selected) ||
    session.variants.find((variant) => variant.direction === session.selectedDirection) ||
    session.variants[0] ||
    null
  );
}

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<ProfileUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [history, setHistory] = useState<CreatorPreviewSession[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [clothingItems, setClothingItems] = useState<ClothingItem[]>([]);
  const [clothingLoading, setClothingLoading] = useState(true);
  const [showAddClothing, setShowAddClothing] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [newClothing, setNewClothing] = useState({
    name: '',
    category: 'OUTERWEAR' as ClothingCategory,
    clothType: 'upper' as ClothingType,
    imageUrl: '',
    color: '',
  });

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await fetch('/api/auth/me');
        if (!response.ok) {
          router.push('/auth/login');
          return;
        }

        const data = await response.json();
        setUser(data.user);
      } catch (error) {
        console.error('获取用户信息失败:', error);
      } finally {
        setLoading(false);
      }
    };

    const fetchHistory = async () => {
      try {
        const response = await fetch('/api/creator-preview/history?limit=12');
        if (response.ok) {
          const data = await response.json();
          setHistory(data.sessions || []);
        }
      } catch (error) {
        console.error('获取内容预演历史失败:', error);
      } finally {
        setHistoryLoading(false);
      }
    };

    const fetchClothing = async () => {
      try {
        const response = await fetch('/api/clothing');
        if (response.ok) {
          const data = await response.json();
          setClothingItems(data.items || []);
        }
      } catch (error) {
        console.error('获取素材库失败:', error);
      } finally {
        setClothingLoading(false);
      }
    };

    fetchUser();
    fetchHistory();
    fetchClothing();
  }, [router]);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/auth/login');
    } catch (error) {
      console.error('登出失败:', error);
    }
  };

  const compressImage = useCallback((file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(file);

      img.onload = () => {
        URL.revokeObjectURL(url);

        let width = img.width;
        let height = img.height;
        const maxSize = 1024;
        const maxDimension = Math.max(width, height);

        if (maxDimension > maxSize) {
          const ratio = maxSize / maxDimension;
          width = Math.floor(width * ratio);
          height = Math.floor(height * ratio);
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          reject(new Error('无法创建 canvas 上下文'));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.8));
      };

      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('图片加载失败'));
      };

      img.src = url;
    });
  }, []);

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('请上传图片文件');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      alert('图片大小不能超过 10MB');
      return;
    }

    setUploadingImage(true);
    try {
      const compressed = await compressImage(file);
      setNewClothing((previous) => ({ ...previous, imageUrl: compressed }));
    } catch (error) {
      console.error('图片处理失败:', error);
      alert('图片处理失败');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleCategoryChange = (category: ClothingCategory) => {
    const matched = CATEGORY_OPTIONS.find((item) => item.value === category);
    setNewClothing((previous) => ({
      ...previous,
      category,
      clothType: matched?.clothType ?? previous.clothType,
    }));
  };

  const handleAddClothing = async () => {
    if (!newClothing.name || !newClothing.imageUrl) {
      alert('请填写素材名称并上传图片');
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch('/api/clothing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newClothing.name,
          category: newClothing.category,
          clothType: newClothing.clothType,
          imageUrl: newClothing.imageUrl,
          color: newClothing.color,
        }),
      });

      const data = await response.json();
      if (response.ok && data.success) {
        setClothingItems((previous) => [data.item, ...previous]);
        setShowAddClothing(false);
        setNewClothing({
          name: '',
          category: 'OUTERWEAR',
          clothType: 'upper',
          imageUrl: '',
          color: '',
        });
      } else {
        alert(data.error || '添加素材失败，请稍后重试');
      }
    } catch (error) {
      console.error('添加素材失败:', error);
      alert(`添加失败: ${error instanceof Error ? error.message : '未知错误'}`);
    } finally {
      setIsSaving(false);
    }
  };

  const deleteClothing = async (id: string) => {
    if (!confirm('确定要删除这条素材吗？')) return;

    try {
      const response = await fetch(`/api/clothing/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setClothingItems((previous) => previous.filter((item) => item.id !== id));
      } else {
        alert('删除失败，请稍后重试');
      }
    } catch (error) {
      console.error('删除素材失败:', error);
      alert('删除失败，请稍后重试');
    }
  };

  const deleteHistory = async (id: string) => {
    if (!confirm('确定要删除这条内容预演记录吗？')) return;

    try {
      const response = await fetch(`/api/creator-preview/history/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setHistory((previous) => previous.filter((item) => item.id !== id));
      } else {
        alert('删除失败，请稍后重试');
      }
    } catch (error) {
      console.error('删除内容预演历史失败:', error);
      alert('删除失败，请稍后重试');
    }
  };

  if (loading) {
    return (
      <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-blue-50 to-indigo-100 px-4 py-10">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600" />
          <p className="mt-4 text-slate-600">加载中...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-blue-50 to-indigo-100 px-4 py-10">
        <div className="rounded-2xl border border-white/30 bg-white/20 p-8 text-center shadow-xl backdrop-blur-sm">
          <p className="mb-4 text-slate-600">请先登录</p>
          <Link href="/auth/login">
            <button className="rounded-lg bg-gradient-to-r from-blue-500 to-sky-500 px-6 py-2 text-white transition-all hover:from-blue-600 hover:to-sky-600">
              去登录
            </button>
          </Link>
        </div>
      </div>
    );
  }

  const upperLibrary = clothingItems.filter((item) => item.clothType === 'upper');
  const lowerLibrary = clothingItems.filter((item) => item.clothType === 'lower');
  const fullLibrary = clothingItems.filter((item) => item.clothType === 'full');

  return (
    <div className="relative flex min-h-screen flex-col items-center overflow-hidden bg-gradient-to-br from-blue-50 to-indigo-100 px-4 py-10">
      <div className="pointer-events-none fixed left-0 top-0 -z-10 h-full w-full">
        <div className="absolute left-[-10%] top-[-10%] h-[600px] w-[600px] rounded-full bg-blue-300 opacity-60 blur-[100px]" />
        <div className="absolute right-[-10%] top-[-10%] h-[500px] w-[500px] rounded-full bg-sky-200 opacity-60 blur-[100px]" />
        <div className="absolute bottom-[-20%] left-[20%] h-[500px] w-[500px] rounded-full bg-cyan-200 opacity-60 blur-[100px]" />
        <div className="absolute bottom-[10%] right-[10%] h-[400px] w-[400px] rounded-full bg-indigo-200 opacity-50 blur-[100px]" />
      </div>

      <header className="relative z-10 mb-10 text-center">
        <h1 className="mb-3 text-4xl font-serif tracking-wide text-slate-900 drop-shadow-sm">创作者工作台</h1>
        <p className="text-lg text-slate-600">管理你的素材库与内容预演记录</p>
      </header>

      <main className="relative w-full max-w-6xl">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-1">
            <div className="rounded-3xl border border-white/30 bg-white/20 p-6 shadow-xl backdrop-blur-sm">
              <div className="text-center">
                <div className="mx-auto mb-4 flex h-24 w-24 items-center justify-center rounded-full border-4 border-white/50 bg-blue-100">
                  <User size={40} className="text-blue-500" />
                </div>
                <h2 className="text-xl font-semibold text-slate-800">{user.name}</h2>
                <p className="text-slate-500">{user.email}</p>
              </div>

              <div className="mt-6 space-y-3 rounded-2xl bg-white/30 p-4">
                <div className="flex justify-between">
                  <span className="text-slate-600">身高:</span>
                  <span className="font-medium text-slate-800">{user.height ? `${user.height} cm` : '未设置'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">体重:</span>
                  <span className="font-medium text-slate-800">{user.weight ? `${user.weight} kg` : '未设置'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">体型:</span>
                  <span className="font-medium text-slate-800">{getBodyTypeLabel(user.bodyType)}</span>
                </div>
              </div>

              <button
                onClick={handleLogout}
                className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl border border-red-300/40 bg-red-50/30 px-4 py-3 font-medium text-red-600 transition-all hover:bg-red-50/50"
              >
                <LogOut size={18} />
                登出
              </button>
            </div>

            <Link href="/tryon">
              <div className="group cursor-pointer rounded-2xl border border-white/30 bg-white/20 p-6 shadow-lg transition-all hover:scale-[1.02] hover:shadow-xl backdrop-blur-sm">
                <div className="flex items-center space-x-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500 shadow-lg shadow-blue-200">
                    <Sparkles size={24} className="text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-slate-800">开始内容预演</h3>
                    <p className="text-sm text-slate-500">上传人物、选主色、比较三种方向</p>
                  </div>
                </div>
              </div>
            </Link>
          </div>

          <div className="space-y-6 lg:col-span-2">
            <div className="rounded-3xl border border-white/30 bg-white/20 p-6 shadow-xl backdrop-blur-sm">
              <div className="mb-6 flex items-center justify-between">
                <h2 className="flex items-center gap-2 text-xl font-bold text-slate-800">
                  <Shirt size={24} className="text-blue-500" />
                  我的素材库
                  <span className="text-sm font-normal text-slate-500">({clothingItems.length}件)</span>
                </h2>
                <button
                  onClick={() => setShowAddClothing(true)}
                  className="flex items-center gap-2 rounded-xl bg-blue-500 px-4 py-2 text-sm text-white transition-all hover:bg-blue-600"
                >
                  <Plus size={18} />
                  添加素材
                </button>
              </div>

              {clothingLoading ? (
                <div className="py-8 text-center">
                  <div className="mx-auto h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600" />
                </div>
              ) : clothingItems.length === 0 ? (
                <div className="rounded-2xl border border-white/20 bg-white/30 p-8 text-center">
                  <p className="mb-4 text-slate-500">还没有添加素材</p>
                  <button
                    onClick={() => setShowAddClothing(true)}
                    className="rounded-lg bg-gradient-to-r from-blue-500 to-sky-500 px-6 py-2 text-white transition-all hover:from-blue-600 hover:to-sky-600"
                  >
                    添加第一件
                  </button>
                </div>
              ) : (
                <div className="space-y-6">
                  {upperLibrary.length > 0 ? (
                    <section>
                      <h3 className="mb-3 text-sm font-medium text-slate-500">上装 / 外套 ({upperLibrary.length})</h3>
                      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                        {upperLibrary.map((item) => (
                          <div key={item.id} className="group overflow-hidden rounded-xl border border-white/20 bg-white/30">
                            <div className="relative aspect-[3/4]">
                              <NextImage
                                src={item.imageUrl}
                                alt={item.name}
                                fill
                                unoptimized
                                sizes="(min-width: 640px) 12rem, 50vw"
                                className="object-cover"
                              />
                              <button
                                onClick={() => deleteClothing(item.id)}
                                className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-red-500/80 text-white opacity-0 transition-opacity group-hover:opacity-100"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                            <div className="space-y-1 p-3">
                              <p className="truncate text-sm font-medium text-slate-800">{item.name}</p>
                              <p className="text-xs text-slate-500">{getCategoryLabel(item.category)}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </section>
                  ) : null}

                  {lowerLibrary.length > 0 ? (
                    <section>
                      <h3 className="mb-3 text-sm font-medium text-slate-500">下装 / 鞋子 ({lowerLibrary.length})</h3>
                      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                        {lowerLibrary.map((item) => (
                          <div key={item.id} className="group overflow-hidden rounded-xl border border-white/20 bg-white/30">
                            <div className="relative aspect-[3/4]">
                              <NextImage
                                src={item.imageUrl}
                                alt={item.name}
                                fill
                                unoptimized
                                sizes="(min-width: 640px) 12rem, 50vw"
                                className="object-cover"
                              />
                              <button
                                onClick={() => deleteClothing(item.id)}
                                className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-red-500/80 text-white opacity-0 transition-opacity group-hover:opacity-100"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                            <div className="space-y-1 p-3">
                              <p className="truncate text-sm font-medium text-slate-800">{item.name}</p>
                              <p className="text-xs text-slate-500">{getCategoryLabel(item.category)}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </section>
                  ) : null}

                  {fullLibrary.length > 0 ? (
                    <section>
                      <h3 className="mb-3 text-sm font-medium text-slate-500">配饰 / 全身类 ({fullLibrary.length})</h3>
                      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                        {fullLibrary.map((item) => (
                          <div key={item.id} className="group overflow-hidden rounded-xl border border-white/20 bg-white/30">
                            <div className="relative aspect-[3/4]">
                              <NextImage
                                src={item.imageUrl}
                                alt={item.name}
                                fill
                                unoptimized
                                sizes="(min-width: 640px) 12rem, 50vw"
                                className="object-cover"
                              />
                              <button
                                onClick={() => deleteClothing(item.id)}
                                className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-red-500/80 text-white opacity-0 transition-opacity group-hover:opacity-100"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                            <div className="space-y-1 p-3">
                              <p className="truncate text-sm font-medium text-slate-800">{item.name}</p>
                              <p className="text-xs text-slate-500">{getCategoryLabel(item.category)}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </section>
                  ) : null}
                </div>
              )}
            </div>

            <div className="rounded-3xl border border-white/30 bg-white/20 p-6 shadow-xl backdrop-blur-sm">
              <h2 className="mb-6 flex items-center gap-2 text-xl font-bold text-slate-800">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500 text-sm text-white">
                  {history.length}
                </span>
                内容预演历史
              </h2>

              {historyLoading ? (
                <div className="py-8 text-center">
                  <div className="mx-auto h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600" />
                  <p className="mt-2 text-sm text-slate-500">加载中...</p>
                </div>
              ) : history.length === 0 ? (
                <div className="rounded-2xl border border-white/20 bg-white/30 p-8 text-center">
                  <p className="mb-4 text-slate-500">还没有内容预演记录</p>
                  <Link href="/tryon">
                    <button className="rounded-lg bg-gradient-to-r from-blue-500 to-sky-500 px-6 py-2 text-white transition-all hover:from-blue-600 hover:to-sky-600">
                      去开始内容预演
                    </button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-5">
                  {history.map((session) => {
                    const selectedVariant = getSelectedVariant(session);

                    return (
                      <article
                        key={session.id}
                        className="overflow-hidden rounded-3xl border border-white/20 bg-white/30 shadow-lg"
                      >
                        <div className="flex flex-col gap-5 p-5">
                          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                            <div>
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="rounded-full border border-blue-300/40 bg-blue-50/60 px-3 py-1 text-[11px] uppercase tracking-[0.22em] text-blue-700">
                                  主色 {session.primaryColor}
                                </span>
                                <span className="rounded-full border border-white/30 bg-white/40 px-3 py-1 text-[11px] uppercase tracking-[0.22em] text-slate-600">
                                  主推 {DIRECTION_LABELS[session.selectedDirection]}
                                </span>
                              </div>
                              <p className="mt-3 text-sm text-slate-500">
                                {new Date(session.createdAt).toLocaleString('zh-CN')}
                              </p>
                            </div>

                            <div className="flex flex-wrap gap-2">
                              {selectedVariant ? (
                                <a
                                  href={selectedVariant.resultUrl}
                                  download={`creator-preview-${session.id}.png`}
                                  className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/70 px-4 py-2 text-sm text-slate-700 transition hover:bg-white"
                                >
                                  <Download size={16} />
                                  下载主推版
                                </a>
                              ) : null}
                              <button
                                onClick={() => deleteHistory(session.id)}
                                className="inline-flex items-center gap-2 rounded-full border border-red-200/60 bg-red-50/60 px-4 py-2 text-sm text-red-600 transition hover:bg-red-50"
                              >
                                <Trash2 size={16} />
                                删除
                              </button>
                            </div>
                          </div>

                          <div className="grid gap-4 md:grid-cols-3">
                            {session.variants.map((variant) => (
                              <div
                                key={variant.id}
                                className={`
                                  overflow-hidden rounded-2xl border
                                  ${variant.selected
                                    ? 'border-blue-300/60 bg-white/80 shadow-md'
                                    : 'border-white/20 bg-white/50'}
                                `}
                              >
                                <div className="relative aspect-[4/5] bg-slate-100">
                                  <NextImage
                                    src={variant.resultUrl}
                                    alt={DIRECTION_LABELS[variant.direction]}
                                    fill
                                    unoptimized
                                    sizes="(min-width: 768px) 20rem, 100vw"
                                    className="object-cover"
                                  />
                                  <div className="absolute left-3 top-3 flex gap-2">
                                    <span className="rounded-full bg-black/55 px-3 py-1 text-[10px] uppercase tracking-[0.22em] text-white">
                                      {DIRECTION_LABELS[variant.direction]}
                                    </span>
                                    {variant.selected ? (
                                      <span className="rounded-full bg-blue-500/85 px-3 py-1 text-[10px] uppercase tracking-[0.22em] text-white">
                                        Lead
                                      </span>
                                    ) : null}
                                  </div>
                                </div>
                                <div className="space-y-2 p-4">
                                  <p className="text-sm font-medium text-slate-800">
                                    {DIRECTION_LABELS[variant.direction]}
                                  </p>
                                  <p className="text-xs leading-6 text-slate-500">
                                    {variant.direction === 'old_money' && '偏稳、偏克制，适合老钱或学院质感内容。'}
                                    {variant.direction === 'street' && '更强烈、更直接，适合街头和高对比表达。'}
                                    {variant.direction === 'clean_fit' && '更轻、更 clean，适合简洁封面和轻编辑感。'}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {showAddClothing ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 backdrop-blur-sm">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-white/30 bg-white/90 p-6 shadow-2xl">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-slate-800">添加素材</h2>
                <p className="mt-1 text-sm text-slate-500">为后续内容预演补充 look 素材</p>
              </div>
              <button
                onClick={() => setShowAddClothing(false)}
                className="rounded-full p-2 text-slate-500 transition hover:bg-slate-100"
              >
                <X size={22} />
              </button>
            </div>

            <div className="space-y-5">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">素材名称</label>
                <input
                  type="text"
                  value={newClothing.name}
                  onChange={(event) => setNewClothing((previous) => ({ ...previous, name: event.target.value }))}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-800 outline-none transition focus:border-blue-400"
                  placeholder="例如：黑色双排扣西装外套"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">素材类别</label>
                  <select
                    value={newClothing.category}
                    onChange={(event) => handleCategoryChange(event.target.value as ClothingCategory)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-800 outline-none transition focus:border-blue-400"
                  >
                    {CATEGORY_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">主色标签</label>
                  <div className="relative">
                    <Palette size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={newClothing.color}
                      onChange={(event) => setNewClothing((previous) => ({ ...previous, color: event.target.value }))}
                      className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-11 pr-4 text-slate-800 outline-none transition focus:border-blue-400"
                      placeholder="例如：black / navy / silver"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">上传素材图片</label>
                <label className="flex min-h-[12rem] cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50/80 px-4 text-center transition hover:border-blue-400 hover:bg-blue-50/40">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                  {newClothing.imageUrl ? (
                    <div className="w-full">
                      <NextImage
                        src={newClothing.imageUrl}
                        alt="素材预览"
                        width={480}
                        height={480}
                        unoptimized
                        className="mx-auto max-h-60 h-auto w-auto rounded-xl object-contain"
                      />
                      <p className="mt-4 text-sm text-slate-500">点击重新上传</p>
                    </div>
                  ) : (
                    <>
                      {uploadingImage ? (
                        <div className="mx-auto h-8 w-8 animate-spin rounded-full border-b-2 border-blue-500" />
                      ) : (
                        <Upload size={32} className="mb-3 text-slate-400" />
                      )}
                      <p className="text-base font-medium text-slate-700">
                        {uploadingImage ? '处理中...' : '点击上传素材图片'}
                      </p>
                      <p className="mt-2 text-sm text-slate-500">支持 JPG、PNG、WebP，最大 10MB</p>
                    </>
                  )}
                </label>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={handleAddClothing}
                  disabled={isSaving || uploadingImage}
                  className="flex-1 rounded-xl bg-gradient-to-r from-blue-500 to-sky-500 px-6 py-3 text-white transition-all hover:from-blue-600 hover:to-sky-600 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSaving ? '保存中...' : '添加到素材库'}
                </button>
                <button
                  onClick={() => setShowAddClothing(false)}
                  className="rounded-xl border border-slate-300 px-6 py-3 text-slate-600 transition hover:bg-slate-50"
                >
                  取消
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
