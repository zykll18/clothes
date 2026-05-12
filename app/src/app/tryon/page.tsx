'use client';

import NextImage from 'next/image';
import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import SharedFlowerBackground from '@/components/shared/SharedFlowerBackground';
import { StepIndicator } from '@/components/tryon/StepIndicator';
import { TryOnSceneShell } from '@/components/tryon/TryOnSceneShell';
import { UploadArea } from '@/components/tryon/UploadArea';
import { ResultView } from '@/components/tryon/ResultView';
import { ArrowLeft, ArrowRight, CheckCircle2, Library, Shirt, Sparkles, Upload, User } from 'lucide-react';

type AppStep = 1 | 2 | 3 | 4;
type TryOnUiMode = 'upper_body' | 'full_body';
type PersistedClothType = 'upper' | 'lower';
type PersistedTryOnMode = 'replace';

interface ClothingItem {
  id: string;
  name: string;
  clothType: string;
  imageUrl: string;
  color?: string;
}

interface AppState {
  currentStep: AppStep;
  personImage: string | null;
  clothingImage: string | null;
  generatedImage: string | null;
  isGenerating: boolean;
  error: string | null;
  mode: TryOnUiMode;
}

const sceneCopy: Record<
  AppStep,
  {
    eyebrow: string;
    title: string;
    description: string;
    asideTitle: string;
    asideBody: string;
  }
> = {
  1: {
    eyebrow: 'Scene 01 / Muse Setup',
    title: '先让你的轮廓进入镜头。',
    description: '上传一张清晰的人像照片，让后续单品叠合沿着你的姿态与身形自然展开。',
    asideTitle: '入镜建议',
    asideBody: '优先使用正面半身或全身照，避免强逆光、遮挡与过度滤镜，给系统保留清晰的肩线、腰线与站姿。',
  },
  2: {
    eyebrow: 'Scene 02 / Wardrobe Casting',
    title: '为这次出场选定主角单品。',
    description: '上传新的服装素材，或从既有衣橱里调用一件成衣，让这一幕先确定造型核心。',
    asideTitle: '选款方式',
    asideBody: '新拍单品适合上传进入本次流程，已整理过的商品图更适合直接从衣橱提取。系统会沿用你当前选择的来源进入生成。',
  },
  3: {
    eyebrow: 'Scene 03 / Silhouette Direction',
    title: '决定这一套造型的镜头比例。',
    description: '根据单品类型选择半身或全身试穿，让系统按正确的服装结构与画面重心生成成片。',
    asideTitle: '镜头比例',
    asideBody: '上装更适合半身构图，连衣裙、下装与成套造型更适合全身呈现，这样轮廓会更完整，成片也更稳定。',
  },
  4: {
    eyebrow: 'Scene 04 / Atelier Render',
    title: '等待成片出场。',
    description: '系统会保留你当前的人像、单品与镜头设定，生成完成后仍可保存这次试穿记录或直接重试。',
    asideTitle: '渲染阶段',
    asideBody: '生成时会持续轮询任务状态。若出现失败或超时，页面会保留错误语义与重试入口，不打断这条出片流程。',
  },
};

export default function AITryOnPage() {
  const router = useRouter();
  const [state, setState] = useState<AppState>({
    currentStep: 1,
    personImage: null,
    clothingImage: null,
    generatedImage: null,
    isGenerating: false,
    error: null,
    mode: 'upper_body'
  });

  // Auth bootstrap state
  const [authLoading, setAuthLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Progress state for generation
  const [progress, setProgress] = useState(0);

  // History save state
  const [isSavingHistory, setIsSavingHistory] = useState(false);
  const [historySaved, setHistorySaved] = useState(false);
  const [historySaveError, setHistorySaveError] = useState<string | null>(null);

  // Clothing selection state
  const [savedClothes, setSavedClothes] = useState<ClothingItem[]>([]);
  const [clothesLoading, setClothesLoading] = useState(false);
  const [showClothingSelector, setShowClothingSelector] = useState(false);
  const [clothingSource, setClothingSource] = useState<'upload' | 'saved'>('upload');

  useEffect(() => {
    let cancelled = false;

    const verifyAuth = async () => {
      try {
        const response = await fetch('/api/auth/me');

        if (!response.ok) {
          if (!cancelled) {
            router.replace('/auth/login');
          }
          return;
        }

        if (!cancelled) {
          setIsAuthenticated(true);
        }
      } catch (error) {
        console.error('获取登录状态失败:', error);
        if (!cancelled) {
          router.replace('/auth/login');
        }
      } finally {
        if (!cancelled) {
          setAuthLoading(false);
        }
      }
    };

    verifyAuth();

    return () => {
      cancelled = true;
    };
  }, [router]);

  // Fetch saved clothes when entering step 2
  useEffect(() => {
    if (state.currentStep === 2 && clothingSource === 'saved') {
      fetchSavedClothes();
    }
  }, [state.currentStep, clothingSource]);

  const getErrorMessage = (error: unknown, fallback: string) => {
    return error instanceof Error ? error.message : fallback;
  };

  const fetchSavedClothes = async () => {
    setClothesLoading(true);
    try {
      const response = await fetch('/api/clothing');
      if (response.ok) {
        const data = await response.json();
        setSavedClothes(data.items || []);
      }
    } catch (error) {
      console.error('获取衣服列表失败:', error);
    } finally {
      setClothesLoading(false);
    }
  };

  // Compress image
  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(file);

      img.onload = () => {
        URL.revokeObjectURL(url);
        let width = img.width;
        let height = img.height;
        const maxSize = 2048;
        const minSize = 200;

        // 保持宽高比
        const maxDimension = Math.max(width, height);
        if (maxDimension > maxSize) {
          const ratio = maxSize / maxDimension;
          width = Math.floor(width * ratio);
          height = Math.floor(height * ratio);
        }

        const minDimension = Math.min(width, height);
        if (minDimension < minSize) {
          const ratio = minSize / minDimension;
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

        // 确保图片绘制正确
        ctx.drawImage(img, 0, 0, width, height);
        const compressedBase64 = canvas.toDataURL('image/jpeg', 0.9);
        resolve(compressedBase64);
      };

      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('图片加载失败，请检查文件是否损坏'));
      };

      img.src = url;
    });
  };

  const handleFileSelect = useCallback(async (file: File, type: 'person' | 'clothing') => {
    if (!file.type.startsWith('image/')) {
      alert('请选择图片文件');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      alert('图片大小不能超过10MB');
      return;
    }

    try {
      const compressedBase64 = await compressImage(file);
      setState(prev => ({
        ...prev,
        [type === 'person' ? 'personImage' : 'clothingImage']: compressedBase64
      }));
    } catch (err) {
      console.error('图片处理失败:', err);
      alert('图片处理失败，请重试');
    }
  }, []);

  const selectClothingFromSaved = (item: ClothingItem) => {
    setState(prev => ({
      ...prev,
      clothingImage: item.imageUrl,
      mode: item.clothType === 'upper' ? 'upper_body' : 'full_body'
    }));
    setShowClothingSelector(false);
    setClothingSource('saved');
  };

  const resetHistorySaveState = () => {
    setIsSavingHistory(false);
    setHistorySaved(false);
    setHistorySaveError(null);
  };

  const getHistoryClothType = (mode: TryOnUiMode): PersistedClothType => {
    return mode === 'upper_body' ? 'upper' : 'lower';
  };

  const nextStep = () => {
    const next = (state.currentStep + 1) as AppStep;
    const { personImage, clothingImage, mode } = state;

    setState(prev => ({
      ...prev,
      currentStep: next
    }));

    if (next === 4) {
      resetHistorySaveState();
      generateResult(personImage, clothingImage, mode);
    }
  };

  const prevStep = () => {
    setState(prev => ({
      ...prev,
      currentStep: Math.max(1, prev.currentStep - 1) as AppStep,
      error: null
    }));
  };

  const pollTaskStatus = async (id: string, retryCount = 0) => {
    const maxAttempts = 60;
    let attempts = 0;

    const checkStatus = async () => {
      try {
        const response = await fetch(`/api/ai-tryon/status?taskId=${id}`);
        const data = await response.json();

        if (!response.ok) {
          if (retryCount < 3) {
            setTimeout(() => pollTaskStatus(id, retryCount + 1), 3000);
            return;
          }
          throw new Error(data.error || '查询状态失败');
        }

        if (data.status === 'completed') {
          setProgress(100);
          setState(prev => ({
            ...prev,
            generatedImage: data.resultUrl,
            isGenerating: false,
            error: null
          }));
          return;
        } else if (data.status === 'failed') {
          setState(prev => ({
            ...prev,
            isGenerating: false,
            error: data.message || 'AI 试衣失败'
          }));
          return;
        } else {
          attempts++;
          // Update progress based on attempts (max 90% to leave room for completion)
          const newProgress = Math.min(Math.floor((attempts / maxAttempts) * 90), 90);
          setProgress(newProgress);
          if (attempts < maxAttempts) {
            setTimeout(checkStatus, 3000);
          } else {
            setState(prev => ({
              ...prev,
              isGenerating: false,
              error: 'AI 试衣超时，请稍后重试'
            }));
          }
        }
      } catch (error: unknown) {
        setState(prev => ({
          ...prev,
          isGenerating: false,
          error: getErrorMessage(error, '查询状态失败')
        }));
      }
    };

    checkStatus();
  };

  const generateResult = async (person: string | null, cloth: string | null, mode: 'upper_body' | 'full_body') => {
    if (!person || !cloth) return;

    resetHistorySaveState();
    setState(prev => ({ ...prev, isGenerating: true, error: null }));
    setProgress(5); // Start progress at 5%

    try {
      const clothType = mode === 'upper_body' ? 'upper' : 'lower';

      const response = await fetch('/api/ai-tryon', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          personImage: person,
          clothImage: cloth,
          clothType,
          keepClothImage: null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '创建任务失败');
      }

      pollTaskStatus(data.taskId);
    } catch (error: unknown) {
      setState(prev => ({
        ...prev,
        isGenerating: false,
        error: getErrorMessage(error, '网络错误，请稍后重试')
      }));
    }
  };

  const handleSaveHistory = async () => {
    if (
      !state.personImage ||
      !state.clothingImage ||
      !state.generatedImage ||
      isSavingHistory ||
      historySaved
    ) {
      return;
    }

    setIsSavingHistory(true);
    setHistorySaveError(null);

    try {
      const response = await fetch('/api/tryon-history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          personImageUrl: state.personImage,
          clothImageUrl: state.clothingImage,
          keepClothImageUrl: null,
          resultImageUrl: state.generatedImage,
          clothType: getHistoryClothType(state.mode),
          tryOnMode: 'replace' as PersistedTryOnMode,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          typeof data?.error === 'string' ? data.error : '保存试衣历史失败'
        );
      }

      setHistorySaved(true);
    } catch (error: unknown) {
      setHistorySaveError(getErrorMessage(error, '保存试衣历史失败'));
    } finally {
      setIsSavingHistory(false);
    }
  };

  const isNextDisabled = () => {
    if (state.currentStep === 1) return !state.personImage;
    if (state.currentStep === 2) return !state.clothingImage;
    return false;
  };

  const resetAll = () => {
    setState({
      currentStep: 1,
      personImage: null,
      clothingImage: null,
      generatedImage: null,
      isGenerating: false,
      error: null,
      mode: 'upper_body'
    });
    setClothingSource('upload');
    setProgress(0);
    resetHistorySaveState();
  };

  const upperClothes = savedClothes.filter(c => c.clothType === 'upper');
  const lowerClothes = savedClothes.filter(c => c.clothType === 'lower');
  const currentScene = sceneCopy[state.currentStep];
  const isEntryScene = state.currentStep === 1;

  const sceneAside = (
    <div className="space-y-6 text-sm text-[var(--lux-muted-foreground)]">
      <div>
        <p className="lux-kicker text-[11px]">{currentScene.asideTitle}</p>
        <p className="mt-3 leading-7">{currentScene.asideBody}</p>
      </div>

      <div className="lux-divider" />

      <div className="space-y-3">
        <p className="text-xs uppercase tracking-[0.28em] text-[rgba(255,245,225,0.62)]">
          Scene Progression
        </p>
        <ul className="space-y-3 text-[rgba(255,245,225,0.8)]">
          {[
            { id: 1, label: 'Muse portrait in place' },
            { id: 2, label: 'Wardrobe lead selected' },
            { id: 3, label: 'Silhouette direction set' },
            { id: 4, label: 'Atelier render revealed' },
          ].map((item) => {
            const active = item.id === state.currentStep;
            const done = item.id < state.currentStep;

            return (
              <li key={item.id} className="flex items-center gap-3">
                <span
                  className={`
                    flex h-7 w-7 items-center justify-center rounded-full border text-[11px]
                    ${active
                      ? 'border-[rgba(212,177,106,0.85)] bg-[rgba(212,177,106,0.16)] text-white'
                      : done
                        ? 'border-[rgba(212,177,106,0.55)] bg-[rgba(255,255,255,0.06)] text-[rgba(248,232,198,0.88)]'
                        : 'border-[rgba(255,255,255,0.1)] text-[rgba(255,245,225,0.45)]'}
                  `}
                >
                  {done ? <CheckCircle2 size={14} /> : `0${item.id}`}
                </span>
                <span className={active ? 'text-white' : ''}>{item.label}</span>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );

  const renderClothingSelector = () => {
    if (clothesLoading) {
      return (
        <div className="flex min-h-[20rem] items-center justify-center">
          <div className="h-10 w-10 animate-spin rounded-full border border-[rgba(212,177,106,0.35)] border-t-[rgba(212,177,106,0.95)]" />
        </div>
      );
    }

    if (savedClothes.length === 0) {
      return (
        <div className="flex min-h-[20rem] flex-col items-center justify-center rounded-[1.75rem] border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.02)] px-6 text-center">
          <p className="text-lg text-white">衣橱里还没有可用单品</p>
          <p className="mt-3 max-w-sm text-sm leading-7 text-[var(--lux-muted-foreground)]">
            返回上传流程新增一件衣服，之后这里会自动成为你的可复用素材库。
          </p>
          <button
            onClick={() => {
              setShowClothingSelector(false);
              setClothingSource('upload');
            }}
            className="mt-6 inline-flex items-center gap-2 rounded-full border border-[rgba(212,177,106,0.4)] px-5 py-2 text-sm text-[rgba(255,245,225,0.92)] transition hover:bg-[rgba(255,255,255,0.06)]"
          >
            <Upload size={16} />
            改为上传衣服
          </button>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {upperClothes.length > 0 && (
          <section className="space-y-3">
            <div>
              <p className="lux-kicker text-[11px]">Upper Pieces</p>
              <h3 className="mt-2 text-lg text-white">上装衣橱</h3>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
              {upperClothes.map((item) => (
                <button
                  key={item.id}
                  onClick={() => selectClothingFromSaved(item)}
                  className="group overflow-hidden rounded-[1.5rem] border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.03)] text-left transition hover:-translate-y-1 hover:border-[rgba(212,177,106,0.55)]"
                >
                  <div className="relative aspect-[3/4] overflow-hidden">
                    <NextImage
                      src={item.imageUrl}
                      alt={item.name}
                      fill
                      unoptimized
                      className="object-cover transition duration-500 group-hover:scale-[1.03]"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[rgba(7,7,9,0.72)] via-transparent to-transparent" />
                  </div>
                  <div className="px-4 py-3">
                    <p className="truncate text-sm text-[rgba(255,248,237,0.94)]">{item.name}</p>
                  </div>
                </button>
              ))}
            </div>
          </section>
        )}

        {lowerClothes.length > 0 && (
          <section className="space-y-3">
            <div>
              <p className="lux-kicker text-[11px]">Lower Pieces</p>
              <h3 className="mt-2 text-lg text-white">下装衣橱</h3>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
              {lowerClothes.map((item) => (
                <button
                  key={item.id}
                  onClick={() => selectClothingFromSaved(item)}
                  className="group overflow-hidden rounded-[1.5rem] border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.03)] text-left transition hover:-translate-y-1 hover:border-[rgba(212,177,106,0.55)]"
                >
                  <div className="relative aspect-[3/4] overflow-hidden">
                    <NextImage
                      src={item.imageUrl}
                      alt={item.name}
                      fill
                      unoptimized
                      className="object-cover transition duration-500 group-hover:scale-[1.03]"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[rgba(7,7,9,0.72)] via-transparent to-transparent" />
                  </div>
                  <div className="px-4 py-3">
                    <p className="truncate text-sm text-[rgba(255,248,237,0.94)]">{item.name}</p>
                  </div>
                </button>
              ))}
            </div>
          </section>
        )}
      </div>
    );
  };

  if (authLoading) {
    return (
      <div className="lux-page lux-hero-grid relative min-h-screen overflow-hidden px-4 py-8 sm:px-6 lg:px-8">
        <SharedFlowerBackground mode="atelier" dimmed />
        <div className="pointer-events-none absolute inset-0 z-10 bg-[linear-gradient(180deg,rgba(4,4,6,0.72),rgba(4,4,6,0.86))]" />
        <div className="pointer-events-none absolute inset-0 z-10">
          <div className="absolute left-[-8rem] top-[-6rem] h-72 w-72 rounded-full bg-[rgba(212,177,106,0.08)] blur-3xl" />
          <div className="absolute bottom-[-8rem] right-[-4rem] h-80 w-80 rounded-full bg-[rgba(158,129,73,0.12)] blur-3xl" />
        </div>

        <div className="relative z-20 flex min-h-[80vh] items-center justify-center">
          <div className="lux-stage-frame rounded-[2rem] px-10 py-14 text-center">
            <div className="mx-auto h-10 w-10 animate-spin rounded-full border border-[rgba(212,177,106,0.3)] border-t-[rgba(212,177,106,0.95)]" />
            <p className="mt-5 text-sm tracking-[0.24em] text-[var(--lux-muted-foreground)] uppercase">
              正在检查登录状态
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="lux-page lux-hero-grid relative min-h-screen overflow-hidden bg-transparent">
      <SharedFlowerBackground mode={isEntryScene ? 'hero' : 'atelier'} dimmed={!isEntryScene} />

      <div className="pointer-events-none absolute inset-0 z-10">
        <div
          className={`
            absolute inset-0 transition-[background,opacity] duration-700
            ${isEntryScene
              ? 'bg-[linear-gradient(180deg,rgba(4,4,6,0.24),rgba(4,4,6,0.46)_42%,rgba(4,4,6,0.82))]'
              : 'bg-[linear-gradient(180deg,rgba(4,4,6,0.62),rgba(4,4,6,0.78)_32%,rgba(4,4,6,0.94))]'}
          `}
        />
        <div
          className={`
            absolute inset-0 transition-opacity duration-700
            ${isEntryScene
              ? 'bg-[radial-gradient(circle_at_18%_22%,rgba(255,255,255,0.08),transparent_24%),radial-gradient(circle_at_74%_14%,rgba(212,177,106,0.08),transparent_22%)] opacity-100'
              : 'bg-[radial-gradient(circle_at_16%_18%,rgba(255,255,255,0.03),transparent_20%),radial-gradient(circle_at_78%_10%,rgba(212,177,106,0.04),transparent_18%)] opacity-100'}
          `}
        />
        <div
          className={`
            absolute inset-y-0 left-0 transition-all duration-700
            ${isEntryScene
              ? 'w-full bg-gradient-to-r from-black/82 via-black/62 to-transparent sm:w-[82%] lg:w-[60%]'
              : 'w-full bg-gradient-to-r from-black via-black/96 to-black/55 sm:w-[88%] lg:w-[72%]'}
          `}
        />
        <div
          className={`
            absolute inset-x-0 bottom-0 h-48 transition-all duration-700
            ${isEntryScene
              ? 'bg-gradient-to-t from-[#050505] via-[#050505]/88 to-transparent'
              : 'bg-gradient-to-t from-[#050505] via-[#050505]/96 to-transparent'}
          `}
        />
        <div className="absolute left-[-12rem] top-[-10rem] h-[32rem] w-[32rem] rounded-full bg-[rgba(212,177,106,0.08)] blur-3xl" />
        <div className="absolute right-[-8rem] top-[10rem] h-[28rem] w-[28rem] rounded-full bg-[rgba(125,96,55,0.12)] blur-3xl" />
        <div className="absolute bottom-[-12rem] left-[20%] h-[26rem] w-[26rem] rounded-full bg-[rgba(255,255,255,0.05)] blur-3xl" />
      </div>

      <div
        className={`
          pointer-events-none absolute inset-x-0 z-10 mx-auto w-full max-w-7xl px-4 transition-all duration-700 sm:px-6 lg:px-8
          ${isEntryScene ? 'top-[6.75rem] opacity-60' : 'top-[7.5rem] opacity-40'}
        `}
      >
        <div
          className={`
            max-w-sm rounded-[1.5rem] border px-4 py-4 backdrop-blur-md
            ${isEntryScene
              ? 'border-[rgba(255,255,255,0.14)] bg-[rgba(8,8,10,0.22)]'
              : 'border-[rgba(255,255,255,0.08)] bg-[rgba(8,8,10,0.4)]'}
          `}
        >
          <p className="text-[11px] uppercase tracking-[0.28em] text-[rgba(255,245,225,0.46)]">
            Scene Marker
          </p>
          <p className="mt-3 text-base font-serif italic text-white sm:text-lg">
            {currentScene.eyebrow}
          </p>
        </div>
      </div>

      <div className="relative z-20 mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 pb-8 pt-24 sm:px-6 sm:pt-28 lg:px-8 lg:pt-32">
        <header className={`animate-fade-up-blur ${isEntryScene ? 'pb-10 lg:pb-14' : 'pb-6'}`}>
          <div className={`grid gap-5 ${isEntryScene ? 'xl:grid-cols-[minmax(0,1fr)_18rem] xl:items-end' : 'xl:grid-cols-[minmax(0,1fr)_18rem] xl:items-start'}`}>
            <div className={isEntryScene ? 'max-w-4xl' : 'max-w-3xl'}>
              <p className="lux-kicker text-[11px] sm:text-xs">
                {isEntryScene ? 'Scene Entry / Digital Fitting Maison' : 'Operational Stage / Digital Fitting Maison'}
              </p>
              <h1 className={`mt-4 font-serif italic tracking-[0.04em] text-white ${isEntryScene ? 'text-4xl sm:text-5xl lg:text-6xl xl:text-[4.6rem] xl:leading-[0.92]' : 'text-4xl sm:text-5xl lg:text-[3.6rem]'}`}>
                AI 虚拟试衣叙事场
              </h1>
              <p className={`mt-4 text-sm leading-7 text-[rgba(255,248,237,0.82)] sm:text-base ${isEntryScene ? 'max-w-2xl' : 'max-w-xl'}`}>
                {isEntryScene
                  ? '从首页的品牌镜头进入这里后，第一幕只做一件事：让你的轮廓先进入同一条花影与高定光线构成的试穿世界。'
                  : '人物已入镜，现在进入更克制的操作舞台。后续每一步仍在同一条花影背景里，但视觉重心会让位给造型判断与出片。'}
              </p>
              <p className={`mt-4 text-sm leading-7 text-[var(--lux-muted-foreground)] ${isEntryScene ? 'max-w-3xl' : 'max-w-2xl'}`}>
                上传人物、挑选单品、确认镜头比例，再让现有生成、轮询与历史保存逻辑接手出片。流程没变，只是舞台变成了与首页同源的花影空间。
              </p>
            </div>

            <div className={`rounded-[1.75rem] px-5 py-4 backdrop-blur-md ${isEntryScene ? 'border border-[rgba(255,255,255,0.12)] bg-[rgba(8,8,10,0.18)]' : 'lux-rail'}`}>
              <p className="text-xs uppercase tracking-[0.28em] text-[rgba(255,245,225,0.48)]">Engine Note</p>
              <p className="mt-2 text-sm text-[rgba(255,248,237,0.84)]">阿里云 DashScope AI 试衣引擎</p>
              <p className="mt-2 text-xs leading-6 text-[rgba(255,245,225,0.52)]">
                负责当前试穿生成、任务轮询与结果回传。
              </p>
            </div>
          </div>
        </header>

        <div className={`animate-fade-up-blur animation-delay-2000 ${isEntryScene ? 'opacity-85' : ''}`}>
          <div
            className={`
              rounded-[1.5rem] px-4 py-4 backdrop-blur-md sm:px-5
              ${isEntryScene
                ? 'border border-[rgba(255,255,255,0.12)] bg-[rgba(8,8,10,0.22)]'
                : 'lux-rail'}
            `}
          >
            <div className={`flex flex-col gap-4 ${isEntryScene ? 'lg:flex-row lg:items-end lg:justify-between' : 'lg:flex-row lg:items-end lg:justify-between'}`}>
              <div>
                <p className="text-xs uppercase tracking-[0.26em] text-[rgba(255,245,225,0.46)]">
                  Current Scene
                </p>
                <p className="mt-2 text-lg font-serif italic text-white sm:text-xl">
                  {currentScene.eyebrow}
                </p>
              </div>

              <p className="max-w-2xl text-sm leading-7 text-[var(--lux-muted-foreground)]">
                保留当前四步逻辑，但把每一步压成一个主动作，让你像推进一组造型镜头一样前进。
              </p>
            </div>

            <div className="lux-divider my-4" />
            <StepIndicator currentStep={state.currentStep} />
          </div>
        </div>

        <main className={`flex-1 ${isEntryScene ? 'py-10 lg:py-14' : 'py-8'}`}>
          {state.currentStep === 1 && (
            <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_20rem] xl:items-start">
              <div className="rounded-[2rem] border border-[rgba(255,255,255,0.12)] bg-[rgba(8,8,10,0.16)] px-5 py-6 backdrop-blur-md sm:px-7 sm:py-8 lg:px-10 lg:py-10">
                <div className="max-w-3xl">
                  <p className="lux-kicker text-[11px]">Scene One / Handoff</p>
                  <h2 className="mt-4 font-serif text-3xl italic text-white sm:text-4xl lg:text-[3.35rem] lg:leading-[1]">
                    {currentScene.title}
                  </h2>
                  <p className="mt-4 max-w-2xl text-sm leading-7 text-[rgba(255,248,237,0.86)] sm:text-base">
                    {currentScene.description}
                  </p>
                  <p className="mt-4 max-w-2xl text-sm leading-7 text-[var(--lux-muted-foreground)]">
                    这一幕先不给你多余选择，只保留一个上传动作，让人物轮廓先被这条背景世界接住。
                  </p>
                </div>

                <div className="mt-8 animate-in fade-in slide-in-from-right-4 duration-500">
                  <UploadArea
                    title="Scene 01 / 上传人物照片"
                    subtitle="请上传一张清晰的半身或全身照，让系统先捕捉你的轮廓、姿态与站姿。"
                    previewUrl={state.personImage}
                    onFileSelect={(f) => handleFileSelect(f, 'person')}
                  />
                </div>
              </div>

              <aside className="rounded-[1.75rem] border border-[rgba(255,255,255,0.12)] bg-[rgba(8,8,10,0.18)] p-5 backdrop-blur-md">
                {sceneAside}
              </aside>
            </div>
          )}

          {state.currentStep === 2 && (
            <div className="rounded-[2rem] border border-[rgba(255,255,255,0.08)] bg-[rgba(7,7,9,0.5)] px-4 py-5 shadow-[0_32px_120px_rgba(0,0,0,0.36)] backdrop-blur-xl sm:px-5 sm:py-6 lg:px-7 lg:py-7">
              <TryOnSceneShell
                eyebrow={currentScene.eyebrow}
                title={currentScene.title}
                description={currentScene.description}
                aside={sceneAside}
              >
              <div className="animate-in fade-in slide-in-from-right-4 duration-500">
                <div className="mb-6 flex flex-col gap-3 rounded-[1.5rem] border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.03)] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-[0.24em] text-[rgba(255,245,225,0.48)]">
                      Wardrobe Lead
                    </p>
                    <p className="mt-2 text-sm leading-7 text-[var(--lux-muted-foreground)]">
                      这一幕只需要定下本次成片的核心单品。来源可以是新上传，也可以来自既有衣橱。
                    </p>
                  </div>
                  <div className="inline-flex self-start rounded-full border border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.03)] p-1">
                    <span
                      className={`
                        inline-flex items-center rounded-full px-3 py-1.5 text-xs uppercase tracking-[0.16em]
                        ${clothingSource === 'upload'
                          ? 'bg-[rgba(212,177,106,0.18)] text-[rgba(255,248,237,0.94)]'
                          : 'text-[rgba(255,245,225,0.52)]'}
                      `}
                    >
                      Upload Source
                    </span>
                    <span
                      className={`
                        inline-flex items-center rounded-full px-3 py-1.5 text-xs uppercase tracking-[0.16em]
                        ${clothingSource === 'saved'
                          ? 'bg-[rgba(212,177,106,0.18)] text-[rgba(255,248,237,0.94)]'
                          : 'text-[rgba(255,245,225,0.52)]'}
                      `}
                    >
                      Wardrobe Archive
                    </span>
                  </div>
                </div>

                {showClothingSelector ? (
                  <div className="space-y-6">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="lux-kicker text-[11px]">Wardrobe Archive</p>
                        <h3 className="mt-2 text-2xl font-serif italic text-white">从衣橱挑选这一幕的主角</h3>
                        <p className="mt-3 max-w-xl text-sm leading-7 text-[var(--lux-muted-foreground)]">
                          直接从既有素材里挑一件成衣，让本次试穿延续同一套品牌素材体系。
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          setShowClothingSelector(false);
                          setClothingSource('upload');
                        }}
                        className="inline-flex items-center gap-2 self-start rounded-full border border-[rgba(255,255,255,0.14)] px-4 py-2 text-sm text-[rgba(255,245,225,0.88)] transition hover:bg-[rgba(255,255,255,0.06)]"
                      >
                        <Upload size={16} />
                        改为上传
                      </button>
                    </div>
                    {renderClothingSelector()}
                  </div>
                ) : clothingSource === 'saved' ? (
                    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_16rem]">
                      <div className="flex min-h-[24rem] items-center justify-center rounded-[1.75rem] border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.03)] p-4">
                        <div className="relative aspect-[3/4] w-full max-w-md overflow-hidden rounded-[1.75rem] border border-[rgba(212,177,106,0.35)]">
                        <NextImage
                          src={state.clothingImage || ''}
                          alt="Selected clothing"
                          fill
                          unoptimized
                          className="object-cover"
                        />
                        <div className="absolute left-4 top-4 rounded-full border border-[rgba(212,177,106,0.38)] bg-[rgba(7,7,9,0.54)] px-3 py-1 text-xs uppercase tracking-[0.24em] text-[rgba(255,245,225,0.84)]">
                          Wardrobe Pick
                        </div>
                      </div>
                    </div>

                    <div className="lux-rail rounded-[1.75rem] p-5">
                      <p className="lux-kicker text-[11px]">Casting Locked</p>
                      <p className="mt-3 text-sm leading-7 text-[var(--lux-muted-foreground)]">
                        当前单品已从衣橱载入。你仍可随时替换主角服装，后续试穿与保存历史流程不会改变。
                      </p>
                      <button
                        onClick={() => {
                          setShowClothingSelector(true);
                          setClothingSource('saved');
                          fetchSavedClothes();
                        }}
                        className="mt-6 inline-flex items-center gap-2 rounded-full border border-[rgba(212,177,106,0.4)] px-4 py-2 text-sm text-[rgba(255,245,225,0.92)] transition hover:bg-[rgba(255,255,255,0.06)]"
                      >
                        <Library size={16} />
                        更换衣服
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_18rem]">
                    <div>
                      <UploadArea
                        title="Scene 02 / 上传主角单品"
                        subtitle="衣物建议平铺拍摄或悬挂拍摄，尽量完整呈现版型、肩线和下摆。"
                        previewUrl={state.clothingImage}
                        onFileSelect={(f) => handleFileSelect(f, 'clothing')}
                      />
                    </div>

                    <div className="lux-rail rounded-[1.75rem] p-5">
                      <p className="lux-kicker text-[11px]">Wardrobe Shortcut</p>
                      <p className="mt-3 text-sm leading-7 text-[var(--lux-muted-foreground)]">
                        如果这件衣服已经存在于衣橱，直接提取会比重新上传更顺，也能保持既有商品素材的一致性。
                      </p>
                      <button
                        onClick={() => {
                          setShowClothingSelector(true);
                          setClothingSource('saved');
                          fetchSavedClothes();
                        }}
                        className="mt-6 inline-flex items-center gap-2 rounded-full border border-[rgba(212,177,106,0.4)] px-4 py-2 text-sm text-[rgba(255,245,225,0.92)] transition hover:bg-[rgba(255,255,255,0.06)]"
                      >
                        <Library size={16} />
                        从衣橱选择
                      </button>
                    </div>
                  </div>
                )}
              </div>
              </TryOnSceneShell>
            </div>
          )}

          {state.currentStep === 3 && (
            <div className="rounded-[2rem] border border-[rgba(255,255,255,0.08)] bg-[rgba(7,7,9,0.52)] px-4 py-5 shadow-[0_32px_120px_rgba(0,0,0,0.38)] backdrop-blur-xl sm:px-5 sm:py-6 lg:px-7 lg:py-7">
              <TryOnSceneShell
                eyebrow={currentScene.eyebrow}
                title={currentScene.title}
                description={currentScene.description}
                aside={sceneAside}
              >
              <div className="mb-6 rounded-[1.5rem] border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.03)] px-5 py-4">
                <p className="text-xs uppercase tracking-[0.24em] text-[rgba(255,245,225,0.48)]">
                  Frame Choice
                </p>
                <p className="mt-2 text-sm leading-7 text-[var(--lux-muted-foreground)]">
                  这一幕不是在选择功能，而是在确认镜头比例。选定后，当前生成逻辑会按相同的人像与单品进入渲染。
                </p>
              </div>

              <div className="grid gap-4 lg:grid-cols-2">
                <button
                  onClick={() => setState(prev => ({ ...prev, mode: 'upper_body' }))}
                  className={`
                    rounded-[1.75rem] border p-7 text-left transition duration-300
                    ${state.mode === 'upper_body'
                      ? 'border-[rgba(212,177,106,0.7)] bg-[rgba(212,177,106,0.08)] shadow-[0_24px_80px_rgba(0,0,0,0.24)]'
                      : 'border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.02)] hover:-translate-y-1 hover:border-[rgba(212,177,106,0.4)]'}
                  `}
                >
                  <div className="flex h-14 w-14 items-center justify-center rounded-full border border-[rgba(212,177,106,0.28)] bg-[rgba(255,255,255,0.04)] text-[rgba(255,245,225,0.88)]">
                    <User size={28} />
                  </div>
                  <p className="mt-6 text-xs uppercase tracking-[0.24em] text-[rgba(255,245,225,0.5)]">
                    Portrait Frame
                  </p>
                  <h3 className="mt-3 text-2xl font-serif italic text-white">半身试穿</h3>
                  <p className="mt-3 text-sm leading-7 text-[var(--lux-muted-foreground)]">
                    适合 T 恤、衬衫、外套等上装，让系统把重点放在肩线、领口与胸腰比例。
                  </p>
                </button>

                <button
                  onClick={() => setState(prev => ({ ...prev, mode: 'full_body' }))}
                  className={`
                    rounded-[1.75rem] border p-7 text-left transition duration-300
                    ${state.mode === 'full_body'
                      ? 'border-[rgba(212,177,106,0.7)] bg-[rgba(212,177,106,0.08)] shadow-[0_24px_80px_rgba(0,0,0,0.24)]'
                      : 'border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.02)] hover:-translate-y-1 hover:border-[rgba(212,177,106,0.4)]'}
                  `}
                >
                  <div className="flex h-14 w-14 items-center justify-center rounded-full border border-[rgba(212,177,106,0.28)] bg-[rgba(255,255,255,0.04)] text-[rgba(255,245,225,0.88)]">
                    <Shirt size={28} />
                  </div>
                  <p className="mt-6 text-xs uppercase tracking-[0.24em] text-[rgba(255,245,225,0.5)]">
                    Full Figure
                  </p>
                  <h3 className="mt-3 text-2xl font-serif italic text-white">全身试穿</h3>
                  <p className="mt-3 text-sm leading-7 text-[var(--lux-muted-foreground)]">
                    适合连衣裙、下装与成套造型，让系统按完整身形与造型比例完成替换。
                  </p>
                </button>
              </div>
              </TryOnSceneShell>
            </div>
          )}

          {state.currentStep === 4 && (
            <div className="rounded-[2rem] border border-[rgba(255,255,255,0.08)] bg-[rgba(7,7,9,0.54)] px-4 py-5 shadow-[0_32px_120px_rgba(0,0,0,0.4)] backdrop-blur-xl sm:px-5 sm:py-6 lg:px-7 lg:py-7">
              <TryOnSceneShell
                eyebrow={currentScene.eyebrow}
                title={currentScene.title}
                description={currentScene.description}
                aside={sceneAside}
              >
              <div className="animate-in fade-in duration-700">
                <ResultView
                  isGenerating={state.isGenerating}
                  resultImage={state.generatedImage}
                  error={state.error}
                  onRetry={() => generateResult(state.personImage, state.clothingImage, state.mode)}
                  onSaveHistory={handleSaveHistory}
                  isSavingHistory={isSavingHistory}
                  historySaved={historySaved}
                  historySaveError={historySaveError}
                  progress={progress}
                />
              </div>
              </TryOnSceneShell>
            </div>
          )}
        </main>

        {state.currentStep !== 4 ? (
          <div className="animate-fade-up-blur pb-8">
            <div className="lux-rail flex flex-col gap-4 rounded-[1.75rem] p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-[rgba(255,245,225,0.46)]">
                  Next Scene Cue
                </p>
                <div className="mt-2 text-sm leading-7 text-[var(--lux-muted-foreground)]">
                  {state.currentStep === 1 && '人物轮廓确认后，下一幕会进入单品 casting，只保留一个主动作继续推进。'}
                  {state.currentStep === 2 && '主角单品锁定后，下一幕只需要确认镜头比例，现有生成逻辑不会发生变化。'}
                  {state.currentStep === 3 && '镜头比例确认后，将直接沿用当前 generateResult、轮询与历史保存流程进入出片。'}
                </div>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                {state.currentStep > 1 && (
                  <button
                    onClick={prevStep}
                    className="inline-flex items-center justify-center gap-2 rounded-full border border-[rgba(255,255,255,0.14)] px-5 py-3 text-sm text-[rgba(255,245,225,0.9)] transition hover:bg-[rgba(255,255,255,0.06)]"
                  >
                    <ArrowLeft size={16} />
                    上一步
                  </button>
                )}

                <button
                  onClick={nextStep}
                  disabled={isNextDisabled()}
                  className={`
                    inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-medium transition
                    ${isNextDisabled()
                      ? 'cursor-not-allowed border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.05)] text-[rgba(255,245,225,0.34)]'
                      : 'border border-[rgba(212,177,106,0.4)] bg-[linear-gradient(135deg,rgba(212,177,106,0.24),rgba(212,177,106,0.08))] text-white hover:-translate-y-0.5 hover:bg-[linear-gradient(135deg,rgba(212,177,106,0.34),rgba(212,177,106,0.12))]'}
                  `}
                >
                  {state.currentStep === 3 ? (
                    <>
                      <Sparkles size={16} />
                      进入成片
                    </>
                  ) : (
                    <>
                      下一幕
                      <ArrowRight size={16} />
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        ) : state.generatedImage ? (
          <div className="pb-8">
            <div className="flex justify-center">
              <button
                onClick={resetAll}
                className="inline-flex items-center justify-center rounded-full border border-[rgba(255,255,255,0.14)] px-6 py-3 text-sm text-[rgba(255,245,225,0.92)] transition hover:bg-[rgba(255,255,255,0.06)]"
              >
                再试一次
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
