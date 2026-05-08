'use client';

import NextImage from 'next/image';
import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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
    eyebrow: 'Look 01 / Muse Setup',
    title: '先建立你的试穿轮廓。',
    description: '上传一张清晰的人像照片，光线平稳、姿态自然，后续成衣叠合会更准确。',
    asideTitle: '拍摄建议',
    asideBody: '优先使用正面半身或全身照，避免强逆光、遮挡与过度滤镜，给系统保留清晰的肩线和身形。',
  },
  2: {
    eyebrow: 'Look 02 / Wardrobe Casting',
    title: '为这一幕挑选本次主角。',
    description: '你可以上传一件新单品，或直接从衣橱里提取已保存的款式，保持衣物主体完整可见。',
    asideTitle: '衣橱切换',
    asideBody: '上传适合新拍单品，衣橱适合复用既有商品图。系统会沿用你当前选择的来源进入生成流程。',
  },
  3: {
    eyebrow: 'Look 03 / Silhouette Direction',
    title: '决定这次试穿的镜头语言。',
    description: '根据衣物类别选择半身或全身试穿，让生成阶段匹配正确的服装结构。',
    asideTitle: '模式选择',
    asideBody: '上装建议使用半身试穿，连衣裙、下装或成套造型建议使用全身试穿，以减少轮廓误差。',
  },
  4: {
    eyebrow: 'Look 04 / Atelier Render',
    title: '等待成片出场。',
    description: '系统会保留你的当前素材与模式选择，生成完成后你仍可保存试衣历史或直接重试。',
    asideTitle: '渲染说明',
    asideBody: '生成阶段会持续轮询任务状态。若出现失败或超时，页面会保留错误语义与重试入口。',
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

  const sceneAside = (
    <div className="space-y-6 text-sm text-[var(--lux-muted-foreground)]">
      <div>
        <p className="lux-kicker text-[11px]">{currentScene.asideTitle}</p>
        <p className="mt-3 leading-7">{currentScene.asideBody}</p>
      </div>

      <div className="lux-divider" />

      <div className="space-y-3">
        <p className="text-xs uppercase tracking-[0.28em] text-[rgba(255,245,225,0.62)]">
          Current Sequence
        </p>
        <ul className="space-y-3 text-[rgba(255,245,225,0.8)]">
          {[
            { id: 1, label: 'Model portrait ready' },
            { id: 2, label: 'Wardrobe source selected' },
            { id: 3, label: 'Try-on mode confirmed' },
            { id: 4, label: 'Result scene generated' },
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
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-[-8rem] top-[-6rem] h-72 w-72 rounded-full bg-[rgba(212,177,106,0.16)] blur-3xl" />
          <div className="absolute bottom-[-8rem] right-[-4rem] h-80 w-80 rounded-full bg-[rgba(158,129,73,0.16)] blur-3xl" />
        </div>

        <div className="flex min-h-[80vh] items-center justify-center">
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
    <div className="lux-page lux-hero-grid relative min-h-screen overflow-hidden">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-[-12rem] top-[-10rem] h-[32rem] w-[32rem] rounded-full bg-[rgba(212,177,106,0.12)] blur-3xl" />
        <div className="absolute right-[-8rem] top-[10rem] h-[28rem] w-[28rem] rounded-full bg-[rgba(125,96,55,0.16)] blur-3xl" />
        <div className="absolute bottom-[-12rem] left-[20%] h-[26rem] w-[26rem] rounded-full bg-[rgba(255,255,255,0.08)] blur-3xl" />
      </div>

      <div className="relative mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 py-8 sm:px-6 lg:px-8">
        <header className="animate-fade-up-blur pb-8">
          <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
            <div className="max-w-3xl">
              <p className="lux-kicker text-[11px] sm:text-xs">Maison Digital Fitting</p>
              <h1 className="mt-5 font-serif text-4xl italic tracking-[0.04em] text-white sm:text-5xl lg:text-6xl">
                AI 虚拟试衣叙事场
              </h1>
              <p className="mt-5 max-w-2xl text-sm leading-7 text-[var(--lux-muted-foreground)] sm:text-base">
                保留当前的上传、生成、轮询与保存逻辑，只把体验重构成一段更完整的时装分镜。
              </p>
            </div>

            <div className="lux-rail max-w-sm rounded-[1.75rem] px-5 py-4">
              <p className="text-xs uppercase tracking-[0.28em] text-[rgba(255,245,225,0.55)]">Powered by</p>
              <p className="mt-2 text-sm text-[rgba(255,248,237,0.92)]">阿里云 DashScope AI 试衣引擎</p>
            </div>
          </div>
        </header>

        <div className="animate-fade-up-blur animation-delay-2000">
          <StepIndicator currentStep={state.currentStep} />
        </div>

        <main className="flex-1 py-8">
          {state.currentStep === 1 && (
            <TryOnSceneShell
              eyebrow={currentScene.eyebrow}
              title={currentScene.title}
              description={currentScene.description}
              aside={sceneAside}
            >
              <div className="animate-in fade-in slide-in-from-right-4 duration-500">
                <UploadArea
                  title="Step 01 / 上传本人照片"
                  subtitle="请上传一张清晰的全身或半身照，背景尽量简洁，便于后续轮廓识别。"
                  previewUrl={state.personImage}
                  onFileSelect={(f) => handleFileSelect(f, 'person')}
                />
              </div>
            </TryOnSceneShell>
          )}

          {state.currentStep === 2 && (
            <TryOnSceneShell
              eyebrow={currentScene.eyebrow}
              title={currentScene.title}
              description={currentScene.description}
              aside={sceneAside}
            >
              <div className="animate-in fade-in slide-in-from-right-4 duration-500">
                {showClothingSelector ? (
                  <div className="space-y-6">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="lux-kicker text-[11px]">Wardrobe Archive</p>
                        <h3 className="mt-2 text-2xl font-serif italic text-white">从衣橱挑选本次单品</h3>
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
                      <p className="lux-kicker text-[11px]">Selection Ready</p>
                      <p className="mt-3 text-sm leading-7 text-[var(--lux-muted-foreground)]">
                        已从衣橱载入当前单品。更换衣物后会继续保留后续试穿与保存历史流程。
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
                        title="Step 02 / 上传衣服照片"
                        subtitle="衣服照片建议平铺拍摄或挂在衣架上，尽量完整呈现版型与轮廓。"
                        previewUrl={state.clothingImage}
                        onFileSelect={(f) => handleFileSelect(f, 'clothing')}
                      />
                    </div>

                    <div className="lux-rail rounded-[1.75rem] p-5">
                      <p className="lux-kicker text-[11px]">Wardrobe Shortcut</p>
                      <p className="mt-3 text-sm leading-7 text-[var(--lux-muted-foreground)]">
                        如果这件衣服已经存在于衣橱，直接提取可以减少重复上传，并自动同步单品来源。
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
          )}

          {state.currentStep === 3 && (
            <TryOnSceneShell
              eyebrow={currentScene.eyebrow}
              title={currentScene.title}
              description={currentScene.description}
              aside={sceneAside}
            >
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
                  <h3 className="mt-6 text-2xl font-serif italic text-white">半身试穿</h3>
                  <p className="mt-3 text-sm leading-7 text-[var(--lux-muted-foreground)]">
                    适用于 T 恤、衬衫、外套等上装，以肩线和胸腰比例为重点进行合成。
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
                  <h3 className="mt-6 text-2xl font-serif italic text-white">全身试穿</h3>
                  <p className="mt-3 text-sm leading-7 text-[var(--lux-muted-foreground)]">
                    适用于连衣裙、下装与成套造型，让系统按完整轮廓完成服装替换。
                  </p>
                </button>
              </div>
            </TryOnSceneShell>
          )}

          {state.currentStep === 4 && (
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
          )}
        </main>

        {state.currentStep !== 4 ? (
          <div className="animate-fade-up-blur pb-8">
            <div className="lux-rail flex flex-col gap-4 rounded-[1.75rem] p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
              <div className="text-sm leading-7 text-[var(--lux-muted-foreground)]">
                {state.currentStep === 1 && '上传你的形象参考，完成本次试穿分镜的第一幕。'}
                {state.currentStep === 2 && '确认服装来源后进入轮廓选择，当前不会改动任何生成逻辑。'}
                {state.currentStep === 3 && '模式确认后将直接沿用现有 `generateResult` 与任务轮询流程。'}
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
                      开始生成
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
