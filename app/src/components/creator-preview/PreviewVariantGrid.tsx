import Image from 'next/image';
import Link from 'next/link';
import { CheckCircle2, Download, Loader2, Save, Sparkles } from 'lucide-react';
import { DIRECTION_LABELS, type CreatorDirection } from '@/lib/creator-preview';

interface PreviewVariantGridProps {
  variants: Array<{
    id: string;
    direction: string;
    resultUrl: string | null;
    presentationTone: string;
    selected: boolean;
  }>;
  selectedVariantId: string | null;
  onSelectVariant: (variantId: string) => void;
  onSave: () => void;
  isSaving: boolean;
  saveError: string | null;
  saved: boolean;
  demoMode: boolean;
}

const TONE_STYLES: Record<string, string> = {
  'editorial-warm': 'from-[rgba(186,151,96,0.45)] to-[rgba(18,17,15,0.15)]',
  'contrast-grit': 'from-[rgba(108,126,160,0.38)] to-[rgba(13,13,13,0.15)]',
  'soft-clean': 'from-[rgba(215,215,215,0.32)] to-[rgba(250,250,250,0.05)]',
};

function getDirectionLabel(direction: string) {
  const key = direction as CreatorDirection;
  return DIRECTION_LABELS[key] ?? direction;
}

export function PreviewVariantGrid({
  variants,
  selectedVariantId,
  onSelectVariant,
  onSave,
  isSaving,
  saveError,
  saved,
  demoMode,
}: PreviewVariantGridProps) {
  const selectedVariant =
    variants.find((variant) => variant.id === selectedVariantId) ??
    variants.find((variant) => variant.resultUrl) ??
    variants[0];

  return (
    <div className="space-y-8">
      <div className="max-w-3xl">
        <p className="lux-kicker text-[11px]">Final Outfit Preview</p>
        <h3 className="mt-3 font-serif text-3xl italic text-white sm:text-4xl">
          这是今天这套 look 的预览结果。
        </h3>
        <p className="mt-4 text-sm leading-7 text-[var(--lux-muted-foreground)] sm:text-base">
          当前版本输出一张搭配预览图。你可以保存到创作者工作台，后续继续回看、下载或重新搭配。
        </p>
        {demoMode ? (
          <p className="mt-4 inline-flex rounded-full border border-[rgba(212,177,106,0.3)] bg-[rgba(212,177,106,0.1)] px-4 py-2 text-xs text-[rgba(255,245,225,0.82)]">
            Local demo：DashScope 当前不可用，本图为本地搭配板合成，用于完整演示保存与下载流程。
          </p>
        ) : null}
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,0.86fr)_minmax(18rem,0.44fr)]">
        <div className="overflow-hidden rounded-[2rem] border border-[rgba(212,177,106,0.28)] bg-[rgba(255,255,255,0.05)] shadow-[0_28px_100px_rgba(0,0,0,0.32)]">
          <div className="relative aspect-[4/5] overflow-hidden bg-[rgba(255,255,255,0.03)] sm:aspect-[5/4] lg:aspect-[4/5]">
            {selectedVariant?.resultUrl ? (
              <Image
                src={selectedVariant.resultUrl}
                alt="AI 搭配预览结果"
                fill
                unoptimized
                sizes="(min-width: 1024px) 48rem, 100vw"
                className="object-cover"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-[var(--lux-muted-foreground)]">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            )}
            <div className={`absolute inset-0 bg-gradient-to-t ${TONE_STYLES[selectedVariant?.presentationTone ?? ''] ?? 'from-black/35 to-transparent'}`} />
            <div className="absolute left-4 top-4 rounded-full border border-white/10 bg-black/25 px-3 py-1 text-[10px] uppercase tracking-[0.22em] text-white/90">
              Outfit Preview
            </div>
          </div>
        </div>

        <aside className="flex flex-col justify-between rounded-[2rem] border border-white/10 bg-white/[0.035] p-6">
          <div>
            <p className="text-[10px] uppercase tracking-[0.28em] text-[rgba(255,245,225,0.46)]">Selected Style</p>
            <h4 className="mt-4 font-serif text-4xl italic leading-none text-white">
              {selectedVariant ? getDirectionLabel(selectedVariant.direction) : 'Preview'}
            </h4>
            <p className="mt-5 text-sm leading-7 text-[var(--lux-muted-foreground)]">
              保存的是这一套完整搭配的预览记录，不再要求你在三张方向图里做选择。
            </p>
          </div>

          {selectedVariant ? (
            <button
              type="button"
              onClick={() => onSelectVariant(selectedVariant.id)}
              className="mt-8 inline-flex w-fit items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-xs uppercase tracking-[0.22em] text-white/70"
            >
              <Sparkles className="h-3.5 w-3.5" />
              Current Result
            </button>
          ) : null}
        </aside>
      </div>

      {saveError && !saved ? (
        <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-[rgba(255,255,255,0.04)] px-4 py-3 text-sm text-[rgba(255,232,214,0.84)]">
          <CheckCircle2 className="h-4 w-4" />
          <span>{saveError}</span>
        </div>
      ) : null}

      <div className="flex flex-wrap gap-4">
        <button
          type="button"
          onClick={onSave}
          disabled={saved || isSaving || variants.length === 0}
          className="inline-flex items-center gap-2 rounded-full border border-[rgba(212,177,106,0.36)] bg-[rgba(212,177,106,0.16)] px-6 py-3 text-sm font-medium text-[rgba(255,248,237,0.96)] transition hover:bg-[rgba(212,177,106,0.22)] disabled:border-[rgba(255,255,255,0.12)] disabled:bg-[rgba(255,255,255,0.05)] disabled:text-[rgba(255,245,225,0.46)]"
        >
          {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {saved ? '已保存到搭配预览历史' : isSaving ? '保存中...' : '保存到搭配预览历史'}
        </button>

        {selectedVariant?.resultUrl ? (
          <a
            href={`/api/download?url=${encodeURIComponent(selectedVariant.resultUrl)}&filename=outfit-preview-result.png`}
            className="inline-flex items-center gap-2 rounded-full border border-[rgba(255,255,255,0.14)] bg-white px-6 py-3 text-sm font-medium text-black transition hover:bg-[rgba(255,245,225,0.92)]"
          >
            <Download className="h-4 w-4" />
            下载当前结果
          </a>
        ) : null}

        {saved ? (
          <Link
            href="/profile"
            className="inline-flex items-center gap-2 rounded-full border border-[rgba(255,255,255,0.14)] bg-[rgba(255,255,255,0.04)] px-6 py-3 text-sm font-medium text-[rgba(255,245,225,0.9)] transition hover:bg-[rgba(255,255,255,0.08)]"
          >
            <CheckCircle2 className="h-4 w-4" />
            去衣橱工作台
          </Link>
        ) : null}
      </div>
    </div>
  );
}
