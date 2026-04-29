'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { User, Sparkles, Shirt, LogOut, Download, Trash2, Plus, Upload, X } from 'lucide-react';

interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  height?: number;
  weight?: number;
  bodyType?: string;
}

interface TryOnHistory {
  id: string;
  personImageUrl: string;
  clothImageUrl: string;
  keepClothImageUrl?: string;
  resultImageUrl: string;
  clothType: string;
  tryOnMode: string;
  createdAt: string;
}

interface ClothingItem {
  id: string;
  name: string;
  category: string;
  clothType: string;
  imageUrl: string;
  color?: string;
  brand?: string;
  createdAt: string;
}

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [history, setHistory] = useState<TryOnHistory[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);

  // Clothing items state
  const [clothingItems, setClothingItems] = useState<ClothingItem[]>([]);
  const [clothingLoading, setClothingLoading] = useState(true);
  const [showAddClothing, setShowAddClothing] = useState(false);
  const [newClothing, setNewClothing] = useState({
    name: '',
    clothType: 'upper' as 'upper' | 'lower',
    imageUrl: '',
    color: '',
  });
  const [uploadingImage, setUploadingImage] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

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
        const response = await fetch('/api/tryon-history?limit=10');
        if (response.ok) {
          const data = await response.json();
          setHistory(data.history || []);
        }
      } catch (error) {
        console.error('获取试衣历史失败:', error);
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
        console.error('获取衣服列表失败:', error);
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

  const deleteHistory = async (id: string) => {
    if (!confirm('确定要删除这条试衣记录吗？')) return;

    try {
      const response = await fetch(`/api/tryon-history/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setHistory(history.filter(h => h.id !== id));
      } else {
        alert('删除失败，请稍后重试');
      }
    } catch (error) {
      console.error('删除试衣历史失败:', error);
      alert('删除失败，请稍后重试');
    }
  };

  // Compress image
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
        const compressedBase64 = canvas.toDataURL('image/jpeg', 0.8);
        resolve(compressedBase64);
      };

      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('图片加载失败'));
      };

      img.src = url;
    });
  }, []);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
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
      setNewClothing(prev => ({ ...prev, imageUrl: compressed }));
    } catch (err) {
      console.error('图片处理失败:', err);
      alert('图片处理失败');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleAddClothing = async () => {
    if (!newClothing.name || !newClothing.imageUrl) {
      alert('请填写衣服名称并上传图片');
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch('/api/clothing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newClothing.name,
          clothType: newClothing.clothType,
          imageUrl: newClothing.imageUrl,
          color: newClothing.color,
          category: newClothing.clothType === 'upper' ? 'TOP' : 'BOTTOM',
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setClothingItems([data.item, ...clothingItems]);
        setShowAddClothing(false);
        setNewClothing({ name: '', clothType: 'upper', imageUrl: '', color: '' });
      } else {
        alert(data.error || '添加失败，请检查网络连接');
      }
    } catch (error) {
      console.error('添加衣服失败:', error);
      alert('添加失败: ' + (error instanceof Error ? error.message : '未知错误'));
    } finally {
      setIsSaving(false);
    }
  };

  const deleteClothing = async (id: string) => {
    if (!confirm('确定要删除这件衣服吗？')) return;

    try {
      const response = await fetch(`/api/clothing/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setClothingItems(clothingItems.filter(c => c.id !== id));
      } else {
        alert('删除失败');
      }
    } catch (error) {
      console.error('删除衣服失败:', error);
      alert('删除失败');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen py-10 px-4 flex flex-col items-center justify-center relative w-full overflow-hidden bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center z-10">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-slate-600">加载中...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen py-10 px-4 flex flex-col items-center justify-center relative w-full overflow-hidden bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center z-10 bg-white/20 backdrop-blur-sm rounded-2xl p-8 border border-white/30 shadow-xl">
          <p className="text-slate-600 mb-4">请先登录</p>
          <Link href="/auth/login">
            <button className="px-6 py-2 bg-gradient-to-r from-blue-500 to-sky-500 text-white rounded-lg hover:from-blue-600 hover:to-sky-600 transition-all">
              去登录
            </button>
          </Link>
        </div>
      </div>
    );
  }

  const upperClothes = clothingItems.filter(c => c.clothType === 'upper');
  const lowerClothes = clothingItems.filter(c => c.clothType === 'lower');

  return (
    <div className="min-h-screen py-10 px-4 flex flex-col items-center relative w-full overflow-hidden bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Background Decorative Blobs */}
      <div className="fixed top-0 left-0 w-full h-full -z-10 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[600px] h-[600px] bg-blue-300 rounded-full mix-blend-multiply filter blur-[100px] opacity-60 animate-blob"></div>
        <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-sky-200 rounded-full mix-blend-multiply filter blur-[100px] opacity-60 animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-[-20%] left-[20%] w-[500px] h-[500px] bg-cyan-200 rounded-full mix-blend-multiply filter blur-[100px] opacity-60 animate-blob animation-delay-4000"></div>
        <div className="absolute bottom-[10%] right-[10%] w-[400px] h-[400px] bg-indigo-200 rounded-full mix-blend-multiply filter blur-[100px] opacity-50 animate-blob animation-delay-3000"></div>
      </div>

      {/* Header */}
      <header className="text-center mb-10 relative z-10">
        <h1 className="text-4xl font-serif text-slate-900 mb-3 tracking-wide drop-shadow-sm">个人中心</h1>
        <p className="text-slate-600 text-lg">管理你的账户和试衣记录</p>
      </header>

      {/* Main Content */}
      <main className="w-full max-w-6xl relative">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 relative">
          {/* User Info Card */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white/20 backdrop-blur-sm rounded-3xl p-6 border border-white/30 shadow-xl">
              <div className="text-center">
                <div className="w-24 h-24 bg-blue-100 rounded-full mx-auto mb-4 flex items-center justify-center border-4 border-white/50">
                  <User size={40} className="text-blue-500" />
                </div>
                <h2 className="text-xl font-semibold text-slate-800">{user.name}</h2>
                <p className="text-slate-500">{user.email}</p>
              </div>

              <div className="mt-6 space-y-3 bg-white/30 rounded-2xl p-4">
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
                  <span className="font-medium text-slate-800">
                    {user.bodyType === 'SLIM' && '瘦削'}
                    {user.bodyType === 'REGULAR' && '标准'}
                    {user.bodyType === 'ATHLETIC' && '健壮'}
                    {user.bodyType === 'PLUS_SIZE' && '丰满'}
                    {!user.bodyType && '未设置'}
                  </span>
                </div>
              </div>

              <button
                onClick={handleLogout}
                className="w-full mt-6 px-4 py-3 rounded-xl border border-red-300/40 bg-red-50/30 text-red-600 hover:bg-red-50/50 transition-all font-medium flex items-center justify-center gap-2"
              >
                <LogOut size={18} />
                登出
              </button>
            </div>

            {/* Quick Actions */}
            <Link href="/tryon">
              <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-6 border border-white/30 shadow-lg hover:shadow-xl transition-all hover:scale-[1.02] cursor-pointer group">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center shadow-lg shadow-blue-200">
                    <Sparkles size={24} className="text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-slate-800">AI 虚拟试衣</h3>
                    <p className="text-slate-500 text-sm">AI 自动将衣服穿到你身上</p>
                  </div>
                </div>
              </div>
            </Link>
          </div>

          {/* Main Content Area */}
          <div className="lg:col-span-2 space-y-6">
            {/* My Clothes Section */}
            <div className="bg-white/20 backdrop-blur-sm rounded-3xl p-6 border border-white/30 shadow-xl">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                  <Shirt size={24} className="text-blue-500" />
                  我的衣服
                  <span className="text-sm font-normal text-slate-500">({clothingItems.length}件)</span>
                </h2>
                <button
                  onClick={() => setShowAddClothing(true)}
                  className="px-4 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-all flex items-center gap-2 text-sm"
                >
                  <Plus size={18} />
                  添加衣服
                </button>
              </div>

              {/* Clothing Grid */}
              {clothingLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                </div>
              ) : clothingItems.length === 0 ? (
                <div className="bg-white/30 rounded-2xl p-8 text-center border border-white/20">
                  <p className="text-slate-500 mb-4">还没有添加衣服</p>
                  <button
                    onClick={() => setShowAddClothing(true)}
                    className="px-6 py-2 bg-gradient-to-r from-blue-500 to-sky-500 text-white rounded-lg hover:from-blue-600 hover:to-sky-600 transition-all"
                  >
                    添加第一件
                  </button>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Upper Body */}
                  {upperClothes.length > 0 && (
                    <div>
                      <h3 className="text-sm font-medium text-slate-500 mb-3">👕 上装 ({upperClothes.length})</h3>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {upperClothes.map((item) => (
                          <div key={item.id} className="bg-white/30 rounded-xl overflow-hidden border border-white/20 group">
                            <div className="relative aspect-[3/4]">
                              <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                              <button
                                onClick={() => deleteClothing(item.id)}
                                className="absolute top-2 right-2 w-7 h-7 bg-red-500/80 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                            <div className="p-2">
                              <p className="text-sm font-medium text-slate-800 truncate">{item.name}</p>
                              {item.color && <p className="text-xs text-slate-500">{item.color}</p>}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Lower Body */}
                  {lowerClothes.length > 0 && (
                    <div>
                      <h3 className="text-sm font-medium text-slate-500 mb-3">👖 下装 ({lowerClothes.length})</h3>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {lowerClothes.map((item) => (
                          <div key={item.id} className="bg-white/30 rounded-xl overflow-hidden border border-white/20 group">
                            <div className="relative aspect-[3/4]">
                              <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                              <button
                                onClick={() => deleteClothing(item.id)}
                                className="absolute top-2 right-2 w-7 h-7 bg-red-500/80 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                            <div className="p-2">
                              <p className="text-sm font-medium text-slate-800 truncate">{item.name}</p>
                              {item.color && <p className="text-xs text-slate-500">{item.color}</p>}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Try-on History */}
            <div className="bg-white/20 backdrop-blur-sm rounded-3xl p-6 border border-white/30 shadow-xl">
              <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                <span className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center text-white text-sm">
                  {history.length}
                </span>
                试衣历史
              </h2>

              {historyLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-2 text-slate-500 text-sm">加载中...</p>
                </div>
              ) : history.length === 0 ? (
                <div className="bg-white/30 rounded-2xl p-8 text-center border border-white/20">
                  <p className="text-slate-500 mb-4">还没有试衣记录</p>
                  <Link href="/tryon">
                    <button className="px-6 py-2 bg-gradient-to-r from-blue-500 to-sky-500 text-white rounded-lg hover:from-blue-600 hover:to-sky-600 transition-all">
                      去体验 AI 试衣
                    </button>
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {history.map((item) => (
                    <div key={item.id} className="bg-white/30 rounded-2xl overflow-hidden border border-white/20 shadow-lg hover:shadow-xl transition-all">
                      <div className="relative aspect-[3/4] bg-gray-100">
                        <img
                          src={item.resultImageUrl}
                          alt="试衣结果"
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute top-2 right-2">
                          <button
                            onClick={() => deleteHistory(item.id)}
                            className="w-8 h-8 bg-red-500/80 backdrop-blur-sm text-white rounded-full hover:bg-red-600 flex items-center justify-center text-sm transition-all"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                        <div className="absolute bottom-2 left-2">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium backdrop-blur-sm ${
                            item.tryOnMode === 'overlay'
                              ? 'bg-green-500/80 text-white'
                              : 'bg-blue-500/80 text-white'
                          }`}>
                            {item.tryOnMode === 'overlay' ? '叠加模式' : '替换模式'}
                          </span>
                        </div>
                      </div>

                      <div className="p-4">
                        <div className="flex items-center space-x-2 mb-2">
                          <span className="text-sm text-slate-600">
                            {item.clothType === 'upper' ? '👕 上装' : '👖 下装'}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400">
                          {new Date(item.createdAt).toLocaleString('zh-CN')}
                        </p>
                        <a
                          href={item.resultImageUrl}
                          download
                          className="mt-3 block w-full text-center px-4 py-2 bg-blue-500/80 text-white rounded-xl hover:bg-blue-600 transition-all text-sm font-medium backdrop-blur-sm flex items-center justify-center gap-2"
                        >
                          <Download size={16} />
                          下载图片
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-12 text-center text-slate-500 text-sm relative z-10">
        <p>Powered by 阿里云 DashScope AI 试衣</p>
      </footer>

      {/* Add Clothing Modal - Moved outside main to overlay everything */}
      {showAddClothing && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold">添加新衣服</h3>
              <button
                onClick={() => setShowAddClothing(false)}
                className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              {/* Image Upload */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">衣服照片</label>
                {newClothing.imageUrl ? (
                  <div className="relative aspect-square rounded-xl overflow-hidden">
                    <img src={newClothing.imageUrl} alt="Preview" className="w-full h-full object-cover" />
                    <button
                      onClick={() => setNewClothing(prev => ({ ...prev, imageUrl: '' }))}
                      className="absolute top-2 right-2 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center w-full aspect-square rounded-xl border-2 border-dashed border-slate-300 hover:border-blue-400 hover:bg-blue-50/50 transition-all cursor-pointer">
                    <Upload size={32} className="text-slate-400 mb-2" />
                    <span className="text-sm text-slate-500">点击上传衣服照片</span>
                    <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                  </label>
                )}
                {uploadingImage && <p className="text-sm text-slate-500 mt-2 text-center">处理中...</p>}
              </div>

              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">衣服名称</label>
                <input
                  type="text"
                  value={newClothing.name}
                  onChange={(e) => setNewClothing(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="例如：蓝色T恤"
                  className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:border-blue-500 focus:outline-none"
                />
              </div>

              {/* Cloth Type */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">衣服类型</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setNewClothing(prev => ({ ...prev, clothType: 'upper' }))}
                    className={`py-3 rounded-xl border transition-all ${
                      newClothing.clothType === 'upper'
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-slate-200 hover:border-blue-300'
                    }`}
                  >
                    👕 上装
                  </button>
                  <button
                    onClick={() => setNewClothing(prev => ({ ...prev, clothType: 'lower' }))}
                    className={`py-3 rounded-xl border transition-all ${
                      newClothing.clothType === 'lower'
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-slate-200 hover:border-blue-300'
                    }`}
                  >
                    👖 下装
                  </button>
                </div>
              </div>

              {/* Color */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">颜色 (可选)</label>
                <input
                  type="text"
                  value={newClothing.color}
                  onChange={(e) => setNewClothing(prev => ({ ...prev, color: e.target.value }))}
                  placeholder="例如：蓝色"
                  className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:border-blue-500 focus:outline-none"
                />
              </div>

              <button
                onClick={handleAddClothing}
                disabled={!newClothing.name || !newClothing.imageUrl || isSaving}
                className="w-full py-3 bg-gradient-to-r from-blue-500 to-sky-500 text-white rounded-xl hover:from-blue-600 hover:to-sky-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSaving ? '保存中...' : '保存'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
