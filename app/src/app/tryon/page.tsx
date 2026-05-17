'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Loader2,
  Palette,
  Shirt,
  Sparkles,
  User,
} from 'lucide-react';
import SharedFlowerBackground from '@/components/shared/SharedFlowerBackground';
import { StepIndicator } from '@/components/tryon/StepIndicator';
import { TryOnSceneShell } from '@/components/tryon/TryOnSceneShell';
import { UploadArea } from '@/components/tryon/UploadArea';
import { ColorSelectionStep } from '@/components/creator-preview/ColorSelectionStep';
import { RecommendationPoolStep } from '@/components/creator-preview/RecommendationPoolStep';
import { LookSlotCarouselStep } from '@/components/creator-preview/LookSlotCarouselStep';
import { PreviewVariantGrid } from '@/components/creator-preview/PreviewVariantGrid';
import {
  CREATOR_DIRECTIONS,
  DIRECTION_LABELS,
  DIRECTION_TONES,
  LOOK_SLOTS,
  type CreatorDirection,
  type LookSlot,
  type PrimaryColor,
} from '@/lib/creator-preview';
import { SYSTEM_PREVIEW_ITEMS } from '@/components/creator-preview/systemItems';

type CreatorPreviewStep = 1 | 2 | 3 | 4 | 5;
type SourceClothType = 'upper' | 'lower' | 'full';
type ClothingCategory = 'TOP' | 'BOTTOM' | 'DRESS' | 'OUTERWEAR' | 'SHOES' | 'ACCESSORY';

interface ClothingItem {
  id: string;
  name: string;
  category: ClothingCategory;
  clothType: SourceClothType;
  imageUrl: string;
  color?: string;
}

interface CreatorPreviewVariantState {
  id: string;
  direction: CreatorDirection;
  resultUrl: string | null;
  presentationTone: string;
  selected: boolean;
}

interface CreatorPreviewState {
  currentStep: CreatorPreviewStep;
  personImage: string | null;
  primaryColor: PrimaryColor | null;
  sourceImage: string | null;
  sourceSelectionId: string | null;
  sourceClothType: SourceClothType | null;
  slotSelections: Partial<Record<LookSlot, string>>;
  variants: CreatorPreviewVariantState[];
  selectedVariantId: string | null;
  isGenerating: boolean;
  error: string | null;
}

interface SourceCandidate {
  id: string;
  name: string;
  imageUrl: string;
  color?: string;
  source: 'user' | 'system';
  clothType: SourceClothType;
  slotHints: LookSlot[];
}

const INITIAL_STATE: CreatorPreviewState = {
  currentStep: 1,
  personImage: null,
  primaryColor: null,
  sourceImage: null,
  sourceSelectionId: null,
  sourceClothType: null,
  slotSelections: {},
  variants: [],
  selectedVariantId: null,
  isGenerating: false,
  error: null,
};

const SCENE_COPY: Record<
  CreatorPreviewStep,
  {
    eyebrow: string;
    title: string;
    description: string;
    asideTitle: string;
    asideBody: string;
  }
> = {
  1: {
    eyebrow: 'Step 01 / Portrait Setup',
    title: '先把这次内容的主角放进画面。',
    description: '上传一张清晰人物图。后面的颜色、素材和方向判断都会围绕这张人像展开。',
    asideTitle: '人物建议',
    asideBody: '优先正面或略侧的人像，避免大面积遮挡、强逆光和过度滤镜，让轮廓足够清晰。',
  },
  2: {
    eyebrow: 'Step 02 / Primary Color',
    title: '先定今天想穿的主色。',
    description: '把这一步当成内容基调，不是搭配结果本身。后面的推荐池和搭配部位都会围绕这个颜色组织。',
    asideTitle: '颜色作用',
    asideBody: '主色决定推荐优先级，也帮助你更快收敛这次 look 的内容氛围。',
  },
  3: {
    eyebrow: 'Step 03 / Mixed Recommendations',
    title: '从用户素材和系统单品里选出主画面素材。',
    description: '这里先挑一张会进入本轮 AI 基础渲染的主素材。它可以来自你的素材库，也可以来自系统预置单品。',
    asideTitle: '第一版边界',
    asideBody: 'v1 先用一个主素材进入 AI 渲染，后面的部位选择会作为完整搭配上下文被记录下来。',
  },
  4: {
    eyebrow: 'Step 04 / Slot Styling',
    title: '按部位把这次 look 补完整。',
    description: '用滚动卡片的方式依次决定外套、内搭、裤子、配饰和鞋子，形成一套完整的内容预演上下文。',
    asideTitle: '内容目的',
    asideBody: '这一步重点不是做精细试衣，而是帮助你决定这次内容的结构和氛围是否成立。',
  },
  5: {
    eyebrow: 'Step 05 / Creator Preview',
    title: '比较三种方向，选出这次最值得发的一版。',
    description: '生成完成后，你会得到三张内容方向卡片。它们共享同一张基础渲染，但承担不同的内容判断语义。',
    asideTitle: '输出结果',
    asideBody: '保存后会进入内容预演历史，方便回看、下载和继续筛选未来的内容方向。',
  },
};

function getSlotHintsFromCategory(item: ClothingItem): LookSlot[] {
  switch (item.category) {
    case 'OUTERWEAR':
      return ['outerwear'];
    case 'TOP':
      return ['innerwear', 'outerwear'];
    case 'BOTTOM':
      return ['pants'];
    case 'SHOES':
      return ['shoes'];
    case 'ACCESSORY':
      return ['accessory'];
    case 'DRESS':
      return ['outerwear', 'innerwear', 'pants'];
    default:
      if (item.clothType === 'upper') return ['innerwear', 'outerwear'];
      if (item.clothType === 'lower') return ['pants'];
      return ['outerwear', 'innerwear', 'pants'];
  }
}

function getSlotHintsFromSystemSlot(slot: LookSlot): LookSlot[] {
  return [slot];
}

export default function CreatorPreviewPage() {
  const router = useRouter();
  const [state, setState] = useState<CreatorPreviewState>(INITIAL_STATE);
  const [authLoading, setAuthLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [progress, setProgress] = useState(0);
  const [wardrobeItems, setWardrobeItems] = useState<ClothingItem[]>([]);
  const [wardrobeLoading, setWardrobeLoading] = useState(false);
  const [isSavingPreview, setIsSavingPreview] = useState(false);
  const [previewSaved, setPreviewSaved] = useState(false);
  const [previewSaveError, setPreviewSaveError] = useState<string | null>(null);

  const sourceCandidates = useMemo<SourceCandidate[]>(() => {
    const wardrobeCandidates = wardrobeItems.map((item) => ({
      id: item.id,
      name: item.name,
      imageUrl: item.imageUrl,
      color: item.color,
      source: 'user' as const,
      clothType: item.clothType,
      slotHints: getSlotHintsFromCategory(item),
    }));

    const systemCandidates = SYSTEM_PREVIEW_ITEMS.map((item) => ({
      id: item.id,
      name: item.name,
      imageUrl: item.imageUrl,
      color: item.colorTag,
      source: 'system' as const,
      clothType: item.clothType,
      slotHints: getSlotHintsFromSystemSlot(item.slot),
    }));

    return [...wardrobeCandidates, ...systemCandidates];
  }, [wardrobeItems]);

  const slotItems = useMemo(() => {
    return LOOK_SLOTS.reduce<Record<LookSlot, Array<{ id: string; name: string; imageUrl: string }>>>(
      (accumulator, slot) => {
        accumulator[slot] = sourceCandidates
          .filter((item) => item.slotHints.includes(slot))
          .map((item) => ({
            id: item.id,
            name: item.name,
            imageUrl: item.imageUrl,
          }));
        return accumulator;
      },
      {
        outerwear: [],
        innerwear: [],
        pants: [],
        accessory: [],
        shoes: [],
      }
    );
  }, [sourceCandidates]);

  const currentScene = SCENE_COPY[state.currentStep];
  const isEntryScene = state.currentStep <= 2;

  const resetSaveState = useCallback(() => {
    setIsSavingPreview(false);
    setPreviewSaved(false);
    setPreviewSaveError(null);
  }, []);

  const resetGeneratedState = useCallback(() => {
    setState((previous) => ({
      ...previous,
      variants: [],
      selectedVariantId: null,
      error: null,
      isGenerating: false,
    }));
    setProgress(0);
    resetSaveState();
  }, [resetSaveState]);

  useEffect(() => {
    let cancelled = false;

    const bootstrap = async () => {
      try {
        const authResponse = await fetch('/api/auth/me');
        if (!authResponse.ok) {
          if (!cancelled) {
            router.replace('/auth/login');
          }
          return;
        }

        if (!cancelled) {
          setIsAuthenticated(true);
        }

        setWardrobeLoading(true);
        const clothingResponse = await fetch('/api/clothing');
        if (!clothingResponse.ok) {
          throw new Error('获取素材库失败');
        }

        const clothingData = await clothingResponse.json();
        if (!cancelled) {
          setWardrobeItems(clothingData.items || []);
        }
      } catch (error) {
        console.error('初始化创作者预演失败:', error);
        if (!cancelled) {
          router.replace('/auth/login');
        }
      } finally {
        if (!cancelled) {
          setWardrobeLoading(false);
          setAuthLoading(false);
        }
      }
    };

    bootstrap();

    return () => {
      cancelled = true;
    };
  }, [router]);

  const compressImage = useCallback((file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(file);

      img.onload = () => {
        URL.revokeObjectURL(url);

        let width = img.width;
        let height = img.height;
        const maxSize = 2048;

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
        resolve(canvas.toDataURL('image/jpeg', 0.9));
      };

      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('图片加载失败'));
      };

      img.src = url;
    });
  }, []);

  const handlePersonFileSelect = useCallback(
    async (file: File) => {
      if (!file.type.startsWith('image/')) {
        alert('请选择图片文件');
        return;
      }

      if (file.size > 10 * 1024 * 1024) {
        alert('图片大小不能超过 10MB');
        return;
      }

      try {
        const compressed = await compressImage(file);
        setState((previous) => ({
          ...previous,
          personImage: compressed,
        }));
        resetGeneratedState();
      } catch (error) {
        console.error('人物图片处理失败:', error);
        alert('人物图片处理失败，请重试');
      }
    },
    [compressImage, resetGeneratedState]
  );

  const handleSelectPrimaryColor = useCallback(
    (color: string) => {
      setState((previous) => ({
        ...previous,
        primaryColor: color as PrimaryColor,
      }));
      resetGeneratedState();
    },
    [resetGeneratedState]
  );

  const handleSelectSourceImage = useCallback(
    (imageUrl: string) => {
      const selectedItem = sourceCandidates.find((item) => item.imageUrl === imageUrl);
      if (!selectedItem) return;

      setState((previous) => ({
        ...previous,
        sourceImage: selectedItem.imageUrl,
        sourceSelectionId: selectedItem.id,
        sourceClothType: selectedItem.clothType,
      }));
      resetGeneratedState();
    },
    [resetGeneratedState, sourceCandidates]
  );

  const handleSelectSlotItem = useCallback(
    (slot: LookSlot, itemId: string) => {
      setState((previous) => ({
        ...previous,
        slotSelections: {
          ...previous.slotSelections,
          [slot]: itemId,
        },
      }));
      resetGeneratedState();
    },
    [resetGeneratedState]
  );

  const pollTaskStatus = useCallback(async (taskId: string) => {
    const maxAttempts = 60;
    let attempts = 0;

    const checkStatus = async () => {
      try {
        const response = await fetch(`/api/ai-tryon/status?taskId=${taskId}`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || '查询任务状态失败');
        }

        if (data.status === 'completed') {
          setProgress(100);
          const variants = CREATOR_DIRECTIONS.map((direction, index) => ({
            id: `${direction}-${index}`,
            direction,
            resultUrl: data.resultUrl,
            presentationTone: DIRECTION_TONES[direction],
            selected: index === 0,
          }));

          setState((previous) => ({
            ...previous,
            variants,
            selectedVariantId: variants[0]?.id ?? null,
            isGenerating: false,
            error: null,
          }));
          return;
        }

        if (data.status === 'failed') {
          setState((previous) => ({
            ...previous,
            isGenerating: false,
            error: data.message || '内容预演失败，请稍后重试',
          }));
          return;
        }

        attempts += 1;
        setProgress(Math.min(Math.floor((attempts / maxAttempts) * 90), 92));

        if (attempts < maxAttempts) {
          setTimeout(checkStatus, 3000);
          return;
        }

        setState((previous) => ({
          ...previous,
          isGenerating: false,
          error: '内容预演超时，请稍后重试',
        }));
      } catch (error) {
        const message = error instanceof Error ? error.message : '查询任务状态失败';
        setState((previous) => ({
          ...previous,
          isGenerating: false,
          error: message,
        }));
      }
    };

    checkStatus();
  }, []);

  const generatePreview = useCallback(async () => {
    if (!state.personImage || !state.sourceImage || !state.sourceClothType) {
      return;
    }

    resetSaveState();
    setProgress(6);
    setState((previous) => ({
      ...previous,
      variants: [],
      selectedVariantId: null,
      isGenerating: true,
      error: null,
    }));

    try {
      const response = await fetch('/api/ai-tryon', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          personImage: state.personImage,
          clothImage: state.sourceImage,
          clothType: state.sourceClothType,
          keepClothImage: null,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || '创建内容预演任务失败');
      }

      pollTaskStatus(data.taskId);
    } catch (error) {
      const message = error instanceof Error ? error.message : '网络错误，请稍后重试';
      setState((previous) => ({
        ...previous,
        isGenerating: false,
        error: message,
      }));
    }
  }, [pollTaskStatus, resetSaveState, state.personImage, state.sourceClothType, state.sourceImage]);

  const handleSavePreview = useCallback(async () => {
    if (
      !state.personImage ||
      !state.sourceImage ||
      !state.primaryColor ||
      state.variants.length === 0 ||
      !state.selectedVariantId ||
      isSavingPreview ||
      previewSaved
    ) {
      return;
    }

    const selectedVariant = state.variants.find((variant) => variant.id === state.selectedVariantId);
    if (!selectedVariant) {
      return;
    }

    setIsSavingPreview(true);
    setPreviewSaveError(null);

    try {
      const response = await fetch('/api/creator-preview/history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          personImageUrl: state.personImage,
          sourceImageUrl: state.sourceImage,
          primaryColor: state.primaryColor,
          directionTags: CREATOR_DIRECTIONS,
          selectedDirection: selectedVariant.direction,
          slotSelections: state.slotSelections,
          variants: state.variants.map((variant, index) => ({
            direction: variant.direction,
            sortOrder: index,
            resultUrl: variant.resultUrl,
            presentationTone: variant.presentationTone,
          })),
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(typeof data?.error === 'string' ? data.error : '保存内容预演失败');
      }

      setPreviewSaved(true);
    } catch (error) {
      setPreviewSaveError(error instanceof Error ? error.message : '保存内容预演失败');
    } finally {
      setIsSavingPreview(false);
    }
  }, [isSavingPreview, previewSaved, state.personImage, state.primaryColor, state.selectedVariantId, state.slotSelections, state.sourceImage, state.variants]);

  const selectedDirection = useMemo(() => {
    const selected = state.variants.find((variant) => variant.id === state.selectedVariantId);
    return selected ? DIRECTION_LABELS[selected.direction] : null;
  }, [state.selectedVariantId, state.variants]);

  const canAdvanceFromStepFour = LOOK_SLOTS.every((slot) => {
    const available = slotItems[slot];
    return available.length === 0 || Boolean(state.slotSelections[slot]);
  });

  const isNextDisabled = (() => {
    if (state.currentStep === 1) return !state.personImage;
    if (state.currentStep === 2) return !state.primaryColor;
    if (state.currentStep === 3) return !state.sourceImage;
    if (state.currentStep === 4) return !canAdvanceFromStepFour;
    return false;
  })();

  const handleNextStep = () => {
    if (state.currentStep === 5) return;

    const nextStep = (state.currentStep + 1) as CreatorPreviewStep;
    setState((previous) => ({
      ...previous,
      currentStep: nextStep,
    }));

    if (nextStep === 5) {
      generatePreview();
    }
  };

  const handlePreviousStep = () => {
    setState((previous) => ({
      ...previous,
      currentStep: Math.max(1, previous.currentStep - 1) as CreatorPreviewStep,
      error: null,
    }));
  };

  const handleSelectVariant = (variantId: string) => {
    setState((previous) => ({
      ...previous,
      selectedVariantId: variantId,
      variants: previous.variants.map((variant) => ({
        ...variant,
        selected: variant.id === variantId,
      })),
    }));
    resetSaveState();
  };

  const handleResetAll = () => {
    setState(INITIAL_STATE);
    setProgress(0);
    resetSaveState();
  };

  const sceneAside = (
    <div className="space-y-6 text-sm text-[var(--lux-muted-foreground)]">
      <div>
        <p className="lux-kicker text-[11px]">{currentScene.asideTitle}</p>
        <p className="mt-3 leading-7">{currentScene.asideBody}</p>
      </div>

      <div className="lux-divider" />

      <div className="space-y-3">
        <p className="text-xs uppercase tracking-[0.28em] text-[rgba(255,245,225,0.62)]">
          Preview Progression
        </p>
        <ul className="space-y-3 text-[rgba(255,245,225,0.8)]">
          {[
            { id: 1, label: 'Portrait ready', icon: User },
            { id: 2, label: 'Primary color fixed', icon: Palette },
            { id: 3, label: 'Source item selected', icon: Shirt },
            { id: 4, label: 'Look slots shaped', icon: Sparkles },
            { id: 5, label: 'Direction decided', icon: CheckCircle2 },
          ].map((item) => {
            const active = item.id === state.currentStep;
            const done = item.id < state.currentStep;
            const Icon = item.icon;

            return (
              <li key={item.id} className="flex items-center gap-3">
                <span
                  className={`
                    flex h-8 w-8 items-center justify-center rounded-full border text-[11px]
                    ${active
                      ? 'border-[rgba(212,177,106,0.85)] bg-[rgba(212,177,106,0.16)] text-white'
                      : done
                        ? 'border-[rgba(212,177,106,0.55)] bg-[rgba(255,255,255,0.06)] text-[rgba(248,232,198,0.88)]'
                        : 'border-[rgba(255,255,255,0.1)] text-[rgba(255,245,225,0.45)]'}
                  `}
                >
                  {done ? <CheckCircle2 size={14} /> : <Icon size={14} />}
                </span>
                <span className={active ? 'text-white' : ''}>{item.label}</span>
              </li>
            );
          })}
        </ul>
      </div>

      {state.primaryColor ? (
        <>
          <div className="lux-divider" />
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[0.28em] text-[rgba(255,245,225,0.62)]">
              Current Focus
            </p>
            <p className="text-white">主色：{state.primaryColor}</p>
            {selectedDirection ? (
              <p className="text-[rgba(255,245,225,0.78)]">当前主推方向：{selectedDirection}</p>
            ) : null}
          </div>
        </>
      ) : null}
    </div>
  );

  const renderStepContent = () => {
    if (state.currentStep === 1) {
      return (
        <UploadArea
          title="上传人物，先让内容主角入镜。"
          subtitle="选择一张清晰、轮廓明确的人像图。后面的主色、素材和方向判断都会围绕这张画面展开。"
          onFileSelect={handlePersonFileSelect}
          previewUrl={state.personImage}
        />
      );
    }

    if (state.currentStep === 2) {
      return (
        <ColorSelectionStep
          selectedColor={state.primaryColor}
          onSelectColor={handleSelectPrimaryColor}
        />
      );
    }

    if (state.currentStep === 3) {
      return (
        <RecommendationPoolStep
          wardrobeItems={wardrobeItems}
          systemItems={SYSTEM_PREVIEW_ITEMS}
          primaryColor={state.primaryColor ?? 'black'}
          selectedSourceImage={state.sourceImage}
          onSelectSourceImage={handleSelectSourceImage}
        />
      );
    }

    if (state.currentStep === 4) {
      return (
        <div className="space-y-8">
          <div className="rounded-[1.7rem] border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.03)] px-5 py-5">
            <p className="lux-kicker text-[11px]">Lead Source</p>
            <h3 className="mt-2 text-xl text-white">
              当前基础渲染主素材：
              <span className="ml-2 font-serif italic text-[rgba(255,245,225,0.88)]">
                {sourceCandidates.find((item) => item.id === state.sourceSelectionId)?.name ?? '未选择'}
              </span>
            </h3>
            <p className="mt-3 text-sm leading-7 text-[var(--lux-muted-foreground)]">
              第一版里，这张素材会进入 AI 基础渲染。下面五个部位的选择会作为完整搭配上下文被记录下来，用于你后续比较内容方向。
            </p>
          </div>

          {LOOK_SLOTS.map((slot) => (
            <LookSlotCarouselStep
              key={slot}
              slot={slot}
              items={slotItems[slot]}
              selectedItemId={state.slotSelections[slot] ?? null}
              onSelectItem={(itemId) => handleSelectSlotItem(slot, itemId)}
            />
          ))}
        </div>
      );
    }

    if (state.isGenerating) {
      return (
        <div className="relative overflow-hidden rounded-[2rem] border border-[rgba(255,255,255,0.1)] bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))] px-6 py-14 sm:px-10 sm:py-16">
          <div className="absolute inset-x-[15%] top-0 h-40 rounded-full bg-[rgba(212,177,106,0.1)] blur-[110px]" />

          <div className="relative mx-auto flex max-w-4xl flex-col gap-10">
            <div className="flex flex-col items-center text-center">
              <p className="text-xs uppercase tracking-[0.32em] text-[rgba(212,177,106,0.72)]">Creator Preview Processing</p>

              <div className="relative mt-8 flex h-36 w-36 items-center justify-center rounded-full border border-[rgba(212,177,106,0.28)] bg-[radial-gradient(circle_at_top,rgba(212,177,106,0.22),transparent_58%),rgba(255,255,255,0.03)] shadow-[0_24px_90px_rgba(0,0,0,0.28)]">
                <div className="absolute inset-3 rounded-full border border-[rgba(255,255,255,0.08)]" />
                <svg className="absolute inset-0 h-full w-full -rotate-90" viewBox="0 0 100 100" aria-hidden="true">
                  <circle cx="50" cy="50" r="45" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="4" />
                  <circle
                    cx="50"
                    cy="50"
                    r="45"
                    fill="none"
                    stroke="rgba(212,177,106,0.96)"
                    strokeWidth="4"
                    strokeLinecap="round"
                    strokeDasharray={`${progress * 2.83} 283`}
                    className="transition-all duration-500"
                  />
                </svg>
                <div className="relative flex flex-col items-center gap-2">
                  <Sparkles className="h-6 w-6 text-[rgba(255,245,225,0.9)]" />
                  <span className="text-3xl font-semibold text-white">{progress}%</span>
                </div>
              </div>

              <h3 className="mt-8 text-3xl font-serif italic text-white sm:text-4xl">正在生成基础预演结果。</h3>
              <p className="mt-4 max-w-xl text-sm leading-7 text-[var(--lux-muted-foreground)] sm:text-base">
                AI 先输出这次内容的基础渲染，之后页面会把它展开成三种方向卡片，供你决定最值得发布的一版。
              </p>
            </div>
          </div>
        </div>
      );
    }

    if (state.error) {
      return (
        <div className="rounded-[2rem] border border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.03)] px-6 py-12 text-center">
          <p className="text-xs uppercase tracking-[0.32em] text-[rgba(212,177,106,0.72)]">Preview Interrupted</p>
          <h3 className="mt-4 text-3xl font-serif italic text-white">这一版预演没有顺利输出。</h3>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-[var(--lux-muted-foreground)] sm:text-base">
            {state.error}
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <button
              type="button"
              onClick={generatePreview}
              className="inline-flex items-center gap-2 rounded-full border border-[rgba(212,177,106,0.36)] bg-[rgba(212,177,106,0.16)] px-6 py-3 text-sm font-medium text-[rgba(255,248,237,0.96)] transition hover:bg-[rgba(212,177,106,0.22)]"
            >
              <Loader2 className="h-4 w-4" />
              重新预演
            </button>
            <button
              type="button"
              onClick={handlePreviousStep}
              className="inline-flex items-center gap-2 rounded-full border border-[rgba(255,255,255,0.14)] bg-[rgba(255,255,255,0.04)] px-6 py-3 text-sm font-medium text-[rgba(255,245,225,0.9)] transition hover:bg-[rgba(255,255,255,0.08)]"
            >
              返回上一阶段
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <PreviewVariantGrid
          variants={state.variants}
          selectedVariantId={state.selectedVariantId}
          onSelectVariant={handleSelectVariant}
          onSave={handleSavePreview}
          isSaving={isSavingPreview}
          saveError={previewSaveError}
          saved={previewSaved}
        />

        <div className="flex flex-wrap gap-4">
          <button
            type="button"
            onClick={generatePreview}
            className="inline-flex items-center gap-2 rounded-full border border-[rgba(255,255,255,0.14)] bg-[rgba(255,255,255,0.04)] px-6 py-3 text-sm font-medium text-[rgba(255,245,225,0.9)] transition hover:bg-[rgba(255,255,255,0.08)]"
          >
            <Loader2 className="h-4 w-4" />
            重新预演
          </button>

          <button
            type="button"
            onClick={handleResetAll}
            className="inline-flex items-center gap-2 rounded-full border border-[rgba(255,255,255,0.14)] bg-[rgba(255,255,255,0.04)] px-6 py-3 text-sm font-medium text-[rgba(255,245,225,0.9)] transition hover:bg-[rgba(255,255,255,0.08)]"
          >
            重新开始
          </button>
        </div>
      </div>
    );
  };

  if (authLoading) {
    return (
      <div className="lux-page lux-hero-grid relative min-h-screen overflow-hidden px-4 py-8 sm:px-6 lg:px-8">
        <SharedFlowerBackground mode="atelier" dimmed />
        <div className="pointer-events-none absolute inset-0 z-10 bg-[linear-gradient(180deg,rgba(4,4,6,0.72),rgba(4,4,6,0.86))]" />

        <div className="relative z-20 flex min-h-[80vh] items-center justify-center">
          <div className="lux-stage-frame rounded-[2rem] px-10 py-14 text-center">
            <div className="mx-auto h-10 w-10 animate-spin rounded-full border border-[rgba(212,177,106,0.3)] border-t-[rgba(212,177,106,0.95)]" />
            <p className="mt-5 text-sm uppercase tracking-[0.24em] text-[var(--lux-muted-foreground)]">
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

      <div className="pointer-events-none absolute inset-0 z-10 bg-[linear-gradient(180deg,rgba(4,4,6,0.42),rgba(4,4,6,0.78)_34%,rgba(4,4,6,0.94))]" />

      <div className="relative z-20 mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 pb-8 pt-24 sm:px-6 sm:pt-28 lg:px-8 lg:pt-32">
        <header className="pb-8">
          <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_18rem] xl:items-end">
            <div className="max-w-4xl">
              <p className="lux-kicker text-[11px] sm:text-xs">
                Creator Preview / Content Direction Tool
              </p>
              <h1 className="mt-4 font-serif text-4xl italic tracking-[0.04em] text-white sm:text-5xl lg:text-6xl xl:text-[4.6rem] xl:leading-[0.92]">
                发内容前，先决定这次该发哪一版。
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-[rgba(255,248,237,0.82)] sm:text-base">
                这不是面向普通消费者的试衣流程，而是一条面向潮流穿搭博主的内容预演链路：上传人物、选主色、混排素材、按部位确定 look，再比较三种方向。
              </p>
            </div>

            <div className="lux-rail rounded-[1.75rem] px-5 py-4 backdrop-blur-md">
              <p className="text-xs uppercase tracking-[0.28em] text-[rgba(255,245,225,0.48)]">Current MVP</p>
              <p className="mt-2 text-sm text-[rgba(255,248,237,0.84)]">1 次基础渲染 + 3 个内容方向判断</p>
              <p className="mt-2 text-xs leading-6 text-[rgba(255,245,225,0.52)]">
                第一版优先帮助你决定内容主推方向，而不是做复杂的多单品真实试穿。
              </p>
            </div>
          </div>
        </header>

        <div className="rounded-[1.5rem] border border-[rgba(255,255,255,0.12)] bg-[rgba(8,8,10,0.22)] px-4 py-4 backdrop-blur-md sm:px-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.26em] text-[rgba(255,245,225,0.46)]">
                Current Stage
              </p>
              <p className="mt-2 text-lg font-serif italic text-white sm:text-xl">
                {currentScene.eyebrow}
              </p>
            </div>

            <p className="max-w-2xl text-sm leading-7 text-[var(--lux-muted-foreground)]">
              每一步只解决一个内容判断：人物、主色、主素材、部位搭配，再到三方向比较。
            </p>
          </div>

          <div className="lux-divider my-4" />
          <StepIndicator currentStep={state.currentStep} />
        </div>

        <main className="flex-1 py-8">
          <TryOnSceneShell
            eyebrow={currentScene.eyebrow}
            title={currentScene.title}
            description={currentScene.description}
            aside={sceneAside}
          >
            {wardrobeLoading && state.currentStep >= 3 ? (
              <div className="mb-6 inline-flex items-center gap-3 rounded-full border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.03)] px-4 py-3 text-sm text-[rgba(255,245,225,0.78)]">
                <Loader2 className="h-4 w-4 animate-spin" />
                正在同步你的素材库
              </div>
            ) : null}

            {renderStepContent()}
          </TryOnSceneShell>
        </main>

        <footer className="pb-6 pt-2">
          <div className="flex flex-col gap-4 rounded-[1.5rem] border border-[rgba(255,255,255,0.1)] bg-[rgba(8,8,10,0.22)] px-5 py-5 backdrop-blur-md sm:flex-row sm:items-center sm:justify-between">
            <div className="text-sm leading-7 text-[var(--lux-muted-foreground)]">
              {state.currentStep < 5
                ? '下一步会继续收敛这次内容的表达方式，不会直接跳到电商或尺码判断。'
                : '选定方向后即可保存到内容预演历史，后续在创作者工作台回看。'}
            </div>

            <div className="flex flex-wrap gap-3">
              {state.currentStep > 1 && state.currentStep < 5 ? (
                <button
                  type="button"
                  onClick={handlePreviousStep}
                  className="inline-flex items-center gap-2 rounded-full border border-[rgba(255,255,255,0.14)] bg-[rgba(255,255,255,0.04)] px-5 py-3 text-sm font-medium text-[rgba(255,245,225,0.9)] transition hover:bg-[rgba(255,255,255,0.08)]"
                >
                  <ArrowLeft className="h-4 w-4" />
                  上一步
                </button>
              ) : null}

              {state.currentStep < 5 ? (
                <button
                  type="button"
                  onClick={handleNextStep}
                  disabled={isNextDisabled}
                  className="inline-flex items-center gap-2 rounded-full border border-[rgba(212,177,106,0.36)] bg-[rgba(212,177,106,0.16)] px-5 py-3 text-sm font-medium text-[rgba(255,248,237,0.96)] transition hover:bg-[rgba(212,177,106,0.22)] disabled:border-[rgba(255,255,255,0.12)] disabled:bg-[rgba(255,255,255,0.05)] disabled:text-[rgba(255,245,225,0.46)]"
                >
                  {state.currentStep === 4 ? '开始内容预演' : '下一步'}
                  <ArrowRight className="h-4 w-4" />
                </button>
              ) : null}
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
