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
import { StyleSelectionStep } from '@/components/creator-preview/StyleSelectionStep';
import { LookSlotCarouselStep } from '@/components/creator-preview/LookSlotCarouselStep';
import { PreviewVariantGrid } from '@/components/creator-preview/PreviewVariantGrid';
import {
  CREATOR_DIRECTIONS,
  DIRECTION_LABELS,
  DIRECTION_TONES,
  LOOK_SLOTS,
  type CreatorDirection,
  type LookSlot,
  type OutfitColorPlan,
  type OutfitColorSlot,
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
  brand?: string;
  tags?: string;
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
  outfitColorPlan: OutfitColorPlan;
  wantsHat: boolean | null;
  selectedStyle: CreatorDirection | null;
  sourceImage: string | null;
  sourceClothType: SourceClothType | null;
  keepClothImage: string | null;
  slotSelections: Partial<Record<LookSlot, string>>;
  variants: CreatorPreviewVariantState[];
  selectedVariantId: string | null;
  isGenerating: boolean;
  isDemoMode: boolean;
  error: string | null;
}

interface SourceCandidate {
  id: string;
  name: string;
  imageUrl: string;
  color?: string;
  tags?: string;
  source: 'user' | 'system';
  clothType: SourceClothType;
  slotHints: LookSlot[];
  styleHints: CreatorDirection[];
}

const INITIAL_STATE: CreatorPreviewState = {
  currentStep: 1,
  personImage: null,
  primaryColor: null,
  outfitColorPlan: {},
  wantsHat: null,
  selectedStyle: null,
  sourceImage: null,
  sourceClothType: null,
  keepClothImage: null,
  slotSelections: {},
  variants: [],
  selectedVariantId: null,
  isGenerating: false,
  isDemoMode: false,
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
    title: '先把本人放进画面。',
    description: '上传一张清晰人物图。后面的配色、风格和试穿预览都会围绕这张人像展开。',
    asideTitle: '人物建议',
    asideBody: '优先正面或略侧的人像，避免大面积遮挡、强逆光和过度滤镜，让轮廓足够清晰。',
  },
  2: {
    eyebrow: 'Step 02 / Color Plan',
    title: '逐件确定今天的颜色。',
    description: '内搭、上衣、裤装、鞋子和袜子逐个选色；帽子先决定需不需要，需要再选颜色。',
    asideTitle: '颜色规则',
    asideBody: '分项颜色会直接影响后面的衣橱推荐排序，不再只用一个主色概括整套 look。',
  },
  3: {
    eyebrow: 'Step 03 / Style Filter',
    title: '再定今天要走哪种风格。',
    description: '风格是提前筛衣服的规则，不是最后才出现的结果标签。它会影响每个部位的推荐顺序。',
    asideTitle: '风格作用',
    asideBody: '如果衣服已经有 tags，系统会优先匹配；没有 tags 时，会用名称、颜色和品类做第一版排序。',
  },
  4: {
    eyebrow: 'Step 04 / Wardrobe Game',
    title: '像换装游戏一样，从橱窗里选衣服。',
    description: '按外套、内搭、下装、配饰和鞋子逐个选择。系统会把配色和风格更匹配的衣服排在前面。',
    asideTitle: '选择规则',
    asideBody: '生成接口第一版会优先使用已选上装和下装；鞋子和配饰会作为搭配记录保存，方便你回看本次造型。',
  },
  5: {
    eyebrow: 'Step 05 / Outfit Preview',
    title: '生成这套 look 的上身预览。',
    description: '这里输出的是今天这套搭配的最终预览，用来判断这套衣服上身后是否成立。',
    asideTitle: '输出结果',
    asideBody: '保存后会进入搭配预览历史，方便回看、下载和继续迭代你的衣橱搭配。',
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

const STYLE_KEYWORDS: Record<CreatorDirection, string[]> = {
  old_money: ['old money', 'old_money', 'classic', 'tailored', 'vintage', '复古', '老钱', '学院', '西装', '大衣'],
  street: ['street', 'oversize', 'sport', 'utility', '街头', '运动', '机能', '廓形'],
  clean_fit: ['clean', 'minimal', 'basic', 'simple', '简洁', '通勤', '基础', '干净'],
};

function normalizeText(value?: string | null): string {
  return (value ?? '').trim().toLowerCase();
}

function colorMatches(primaryColor: PrimaryColor | null, candidate?: string | null): boolean {
  if (!primaryColor || !candidate) return false;

  const normalizedCandidate = normalizeText(candidate);
  const normalizedPrimary = primaryColor.toLowerCase();
  return normalizedCandidate.includes(normalizedPrimary) || normalizedPrimary.includes(normalizedCandidate);
}

function getColorForLookSlot(colorPlan: OutfitColorPlan, slot: LookSlot): PrimaryColor | null {
  if (slot === 'outerwear') return colorPlan.top ?? null;
  if (slot === 'innerwear') return colorPlan.innerwear ?? null;
  if (slot === 'pants') return colorPlan.pants ?? null;
  if (slot === 'shoes') return colorPlan.shoes ?? null;
  if (slot === 'accessory') return colorPlan.hat ?? colorPlan.socks ?? null;
  return null;
}

function getPrimaryColorFromPlan(colorPlan: OutfitColorPlan): PrimaryColor | null {
  return (
    colorPlan.top ??
    colorPlan.innerwear ??
    colorPlan.pants ??
    colorPlan.shoes ??
    colorPlan.socks ??
    colorPlan.hat ??
    null
  );
}

function isColorPlanComplete(colorPlan: OutfitColorPlan, wantsHat: boolean | null): boolean {
  return Boolean(
    colorPlan.innerwear &&
    colorPlan.top &&
    colorPlan.pants &&
    colorPlan.shoes &&
    colorPlan.socks &&
    wantsHat !== null &&
    (!wantsHat || colorPlan.hat)
  );
}

function inferStyleHints(item: Pick<ClothingItem, 'name' | 'tags' | 'brand' | 'category'>): CreatorDirection[] {
  const searchable = normalizeText(`${item.name} ${item.tags ?? ''} ${item.brand ?? ''} ${item.category}`);

  return CREATOR_DIRECTIONS.filter((style) => (
    STYLE_KEYWORDS[style].some((keyword) => searchable.includes(keyword.toLowerCase()))
  ));
}

function systemStyleHints(name: string): CreatorDirection[] {
  const searchable = normalizeText(name);
  return CREATOR_DIRECTIONS.filter((style) => (
    STYLE_KEYWORDS[style].some((keyword) => searchable.includes(keyword.toLowerCase()))
  ));
}

function styleMatches(selectedStyle: CreatorDirection | null, candidate: SourceCandidate): boolean {
  if (!selectedStyle) return false;
  if (candidate.styleHints.includes(selectedStyle)) return true;

  const searchable = normalizeText(`${candidate.name} ${candidate.tags ?? ''}`);
  return STYLE_KEYWORDS[selectedStyle].some((keyword) => searchable.includes(keyword.toLowerCase()));
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
      tags: item.tags,
      source: 'user' as const,
      clothType: item.clothType,
      slotHints: getSlotHintsFromCategory(item),
      styleHints: inferStyleHints(item),
    }));

    const systemCandidates = SYSTEM_PREVIEW_ITEMS.map((item) => ({
      id: item.id,
      name: item.name,
      imageUrl: item.imageUrl,
      color: item.colorTag,
      tags: item.colorTag,
      source: 'system' as const,
      clothType: item.clothType,
      slotHints: getSlotHintsFromSystemSlot(item.slot),
      styleHints: systemStyleHints(item.name),
    }));

    return [...wardrobeCandidates, ...systemCandidates];
  }, [wardrobeItems]);

  const slotItems = useMemo(() => {
    return LOOK_SLOTS.reduce<Record<LookSlot, Array<{
      id: string;
      name: string;
      imageUrl: string;
      source: 'user' | 'system';
      color?: string;
      colorMatch: boolean;
      styleMatch: boolean;
    }>>>(
      (accumulator, slot) => {
        const slotColor = getColorForLookSlot(state.outfitColorPlan, slot) ?? state.primaryColor;
        accumulator[slot] = sourceCandidates
          .filter((item) => item.slotHints.includes(slot))
          .sort((left, right) => {
            const leftScore =
              (colorMatches(slotColor, left.color) ? 2 : 0) +
              (styleMatches(state.selectedStyle, left) ? 2 : 0) +
              (left.source === 'user' ? 1 : 0);
            const rightScore =
              (colorMatches(slotColor, right.color) ? 2 : 0) +
              (styleMatches(state.selectedStyle, right) ? 2 : 0) +
              (right.source === 'user' ? 1 : 0);
            return rightScore - leftScore;
          })
          .map((item) => ({
            id: item.id,
            name: item.name,
            imageUrl: item.imageUrl,
            source: item.source,
            color: item.color,
            colorMatch: colorMatches(slotColor, item.color),
            styleMatch: styleMatches(state.selectedStyle, item),
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
  }, [sourceCandidates, state.outfitColorPlan, state.primaryColor, state.selectedStyle]);

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
      sourceImage: null,
      sourceClothType: null,
      keepClothImage: null,
      variants: [],
      selectedVariantId: null,
      error: null,
      isGenerating: false,
      isDemoMode: false,
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

  const handleSelectOutfitColor = useCallback(
    (slot: OutfitColorSlot, color: PrimaryColor) => {
      setState((previous) => ({
        ...previous,
        outfitColorPlan: {
          ...previous.outfitColorPlan,
          [slot]: color,
        },
        primaryColor: getPrimaryColorFromPlan({
          ...previous.outfitColorPlan,
          [slot]: color,
        }),
      }));
      resetGeneratedState();
    },
    [resetGeneratedState]
  );

  const handleSetWantsHat = useCallback(
    (wantsHat: boolean) => {
      setState((previous) => ({
        ...previous,
        wantsHat,
        outfitColorPlan: wantsHat
          ? previous.outfitColorPlan
          : {
            ...previous.outfitColorPlan,
            hat: undefined,
          },
      }));
      resetGeneratedState();
    },
    [resetGeneratedState]
  );

  const handleSelectStyle = useCallback(
    (style: CreatorDirection) => {
      setState((previous) => ({
        ...previous,
        selectedStyle: style,
      }));
      resetGeneratedState();
    },
    [resetGeneratedState]
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

  const resolveGenerationInput = useCallback(() => {
    const garmentSlots: LookSlot[] = ['outerwear', 'innerwear', 'pants'];
    const selectedItems = garmentSlots
      .map((slot) => {
        const selectedId = state.slotSelections[slot];
        return selectedId ? sourceCandidates.find((item) => item.id === selectedId) ?? null : null;
      })
      .filter((item): item is SourceCandidate => Boolean(item));

    const fullBodyItem = selectedItems.find((item) => item.clothType === 'full');
    if (fullBodyItem) {
      return {
        sourceImage: fullBodyItem.imageUrl,
        sourceClothType: 'full' as SourceClothType,
        keepClothImage: null,
      };
    }

    const upperItem =
      sourceCandidates.find((item) => item.id === state.slotSelections.outerwear && item.clothType === 'upper') ??
      sourceCandidates.find((item) => item.id === state.slotSelections.innerwear && item.clothType === 'upper') ??
      selectedItems.find((item) => item.clothType === 'upper');

    const lowerItem =
      sourceCandidates.find((item) => item.id === state.slotSelections.pants && item.clothType === 'lower') ??
      selectedItems.find((item) => item.clothType === 'lower');

    if (upperItem && lowerItem) {
      return {
        sourceImage: upperItem.imageUrl,
        sourceClothType: 'upper' as SourceClothType,
        keepClothImage: lowerItem.imageUrl,
      };
    }

    return null;
  }, [sourceCandidates, state.slotSelections]);

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
          const selectedStyle = state.selectedStyle ?? 'clean_fit';
          const variants = [{
            id: `${selectedStyle}-0`,
            direction: selectedStyle,
            resultUrl: data.resultUrl,
            presentationTone: DIRECTION_TONES[selectedStyle],
            selected: true,
          }];
          const selectedVariant = variants[0];

          setState((previous) => ({
            ...previous,
            variants,
            selectedVariantId: selectedVariant?.id ?? null,
            isGenerating: false,
            isDemoMode: false,
            error: null,
          }));
          return;
        }

        if (data.status === 'failed') {
          setState((previous) => ({
            ...previous,
            isGenerating: false,
            error: data.message || '搭配预览失败，请稍后重试',
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
          error: '搭配预览超时，请稍后重试',
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
  }, [state.selectedStyle]);

  const generatePreview = useCallback(async () => {
    const generationInput = resolveGenerationInput();
    if (!state.personImage || !generationInput) {
      return;
    }

    resetSaveState();
    setProgress(6);
    setState((previous) => ({
      ...previous,
      sourceImage: generationInput.sourceImage,
      sourceClothType: generationInput.sourceClothType,
      keepClothImage: generationInput.keepClothImage,
      variants: [],
      selectedVariantId: null,
      isGenerating: true,
      isDemoMode: false,
      error: null,
    }));

    try {
      const response = await fetch('/api/ai-tryon', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          personImage: state.personImage,
          clothImage: generationInput.sourceImage,
          clothType: generationInput.sourceClothType,
          keepClothImage: generationInput.keepClothImage ?? null,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || '创建搭配预览任务失败');
      }

      if (data.status === 'completed' && data.resultUrl) {
        const selectedStyle = state.selectedStyle ?? 'clean_fit';
        const variant = {
          id: `${selectedStyle}-0`,
          direction: selectedStyle,
          resultUrl: data.resultUrl,
          presentationTone: DIRECTION_TONES[selectedStyle],
          selected: true,
        };

        setProgress(100);
        setState((previous) => ({
          ...previous,
          variants: [variant],
          selectedVariantId: variant.id,
          isGenerating: false,
          isDemoMode: Boolean(data.demoMode),
          error: null,
        }));
        return;
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
  }, [pollTaskStatus, resetSaveState, resolveGenerationInput, state.personImage, state.selectedStyle]);

  const handleSavePreview = useCallback(async () => {
    if (
      !state.personImage ||
      !state.sourceImage ||
      !state.primaryColor ||
      !state.selectedStyle ||
      state.variants.length === 0 ||
      !state.selectedVariantId ||
      isSavingPreview ||
      previewSaved
    ) {
      return;
    }

    if (!state.variants.some((variant) => variant.id === state.selectedVariantId)) {
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
          outfitColorPlan: state.outfitColorPlan,
          directionTags: [state.selectedStyle],
          selectedDirection: state.selectedStyle,
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
        throw new Error(typeof data?.error === 'string' ? data.error : '保存搭配预览失败');
      }

      setPreviewSaved(true);
    } catch (error) {
      setPreviewSaveError(error instanceof Error ? error.message : '保存搭配预览失败');
    } finally {
      setIsSavingPreview(false);
    }
  }, [isSavingPreview, previewSaved, state.outfitColorPlan, state.personImage, state.primaryColor, state.selectedStyle, state.selectedVariantId, state.slotSelections, state.sourceImage, state.variants]);

  const selectedStyleLabel = state.selectedStyle ? DIRECTION_LABELS[state.selectedStyle] : null;
  const colorPlanComplete = isColorPlanComplete(state.outfitColorPlan, state.wantsHat);

  const canGenerateOutfit = Boolean(resolveGenerationInput());

  const isNextDisabled = (() => {
    if (state.currentStep === 1) return !state.personImage;
    if (state.currentStep === 2) return !colorPlanComplete;
    if (state.currentStep === 3) return !state.selectedStyle;
    if (state.currentStep === 4) return !canGenerateOutfit;
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
            { id: 2, label: 'Colors planned', icon: Palette },
            { id: 3, label: 'Style filter set', icon: Sparkles },
            { id: 4, label: 'Wardrobe picked', icon: Shirt },
            { id: 5, label: 'Preview generated', icon: CheckCircle2 },
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
            <p className="text-white">兼容主色：{state.primaryColor}</p>
            {selectedStyleLabel ? (
              <p className="text-[rgba(255,245,225,0.78)]">今日风格：{selectedStyleLabel}</p>
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
          title="上传本人照。"
          subtitle="一张清晰人像即可，后面会围绕它搭配。"
          onFileSelect={handlePersonFileSelect}
          previewUrl={state.personImage}
        />
      );
    }

    if (state.currentStep === 2) {
      return (
        <ColorSelectionStep
          colorPlan={state.outfitColorPlan}
          wantsHat={state.wantsHat}
          onSelectColor={handleSelectOutfitColor}
          onSetWantsHat={handleSetWantsHat}
        />
      );
    }

    if (state.currentStep === 3) {
      return (
        <StyleSelectionStep
          selectedStyle={state.selectedStyle}
          onSelectStyle={handleSelectStyle}
        />
      );
    }

    if (state.currentStep === 4) {
      return (
        <div className="space-y-8">
          <div className="rounded-[1.7rem] border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.03)] px-5 py-5">
            <p className="lux-kicker text-[11px]">Wardrobe Picks</p>
            <h3 className="mt-2 text-xl text-white">
              当前规则：
              <span className="ml-2 font-serif italic text-[rgba(255,245,225,0.88)]">
                分项配色 / {selectedStyleLabel ?? '未选风格'}
              </span>
            </h3>
            <p className="mt-3 text-sm leading-7 text-[var(--lux-muted-foreground)]">
              每个部位都会优先显示与该部位颜色和今日风格更接近的单品。生成时会使用已选上装和下装完成第一版 AI 试穿。
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
              <p className="text-xs uppercase tracking-[0.32em] text-[rgba(212,177,106,0.72)]">Outfit Preview Processing</p>

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

              <h3 className="mt-8 text-3xl font-serif italic text-white sm:text-4xl">正在生成这套搭配的上身预览。</h3>
              <p className="mt-4 max-w-xl text-sm leading-7 text-[var(--lux-muted-foreground)] sm:text-base">
                AI 会根据你的人像和已选衣服生成一张预览图。配饰和鞋子会保存在本次搭配记录里。
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
          <h3 className="mt-4 text-3xl font-serif italic text-white">这套搭配没有顺利输出。</h3>
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
              重新生成
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
          demoMode={state.isDemoMode}
        />

        <div className="flex flex-wrap gap-4">
          <button
            type="button"
            onClick={generatePreview}
            className="inline-flex items-center gap-2 rounded-full border border-[rgba(255,255,255,0.14)] bg-[rgba(255,255,255,0.04)] px-6 py-3 text-sm font-medium text-[rgba(255,245,225,0.9)] transition hover:bg-[rgba(255,255,255,0.08)]"
          >
            <Loader2 className="h-4 w-4" />
            重新生成
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
          <div className="max-w-4xl">
            <p className="lux-kicker text-[11px] sm:text-xs">
              Wardrobe Styling / AI Outfit Preview
            </p>
            <h1 className="mt-4 font-serif text-4xl italic tracking-[0.04em] text-white sm:text-5xl lg:text-6xl xl:text-[4.6rem] xl:leading-[0.92]">
              先选配色和风格，再从衣橱里搭一套。
            </h1>
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
              每一步只解决一个搭配判断：本人、主色、风格、单品选择，再到最终预览。
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
                ? '下一步会继续缩小衣橱范围，直到选出一套可以生成预览的 look。'
                : '生成后即可保存到搭配预览历史，后续在创作者工作台回看。'}
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
                  {state.currentStep === 4 ? '生成搭配预览' : '下一步'}
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
