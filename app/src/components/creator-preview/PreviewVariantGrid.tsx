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
}: PreviewVariantGridProps) {
  return (
    <div className="space-y-8">
      <div className="max-w-3xl">
        <p className="lux-kicker text-[11px]">Preview Directions</p>
        <h3 className="mt-3 font-serif text-3xl italic text-white sm:text-4xl">
          现在决定这次内容要发哪一版。
        </h3>
        <p className="mt-4 text-sm leading-7 text-[var(--lux-muted-foreground)] sm:text-base">
          第一版里三张结果共享同一张基础渲染，但会以不同内容方向标签和展示语义帮助你快速做发布判断。
        </p>
      </div>

      <div className="grid gap-5 xl:grid-cols-3">
        {variants.map((variant, index) => {
          const active = selectedVariantId === variant.id;

          return (
            <button
              key={variant.id}
              type="button"
              onClick={() => onSelectVariant(variant.id)}
              className={`
                group overflow-hidden rounded-[1.9rem] border text-left transition duration-300
                ${active
                  ? 'border-[rgba(212,177,106,0.5)] bg-[rgba(255,255,255,0.08)] shadow-[0_26px_90px_rgba(0,0,0,0.28)]'
                  : 'border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.03)] hover:-translate-y-1 hover:border-[rgba(212,177,106,0.26)]'}
              `}
            >
              <div className="relative aspect-[4/5] overflow-hidden bg-[rgba(255,255,255,0.03)]">
                {variant.resultUrl ? (
                  <img
                    src={variant.resultUrl}
                    alt={getDirectionLabel(variant.direction)}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-[var(--lux-muted-foreground)]">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                )}
                <div className={`absolute inset-0 bg-gradient-to-t ${TONE_STYLES[variant.presentationTone] ?? 'from-black/40 to-transparent'}`} />
                <div className="absolute left-4 top-4 flex items-center gap-2">
                  <span className="rounded-full border border-white/10 bg-black/25 px-3 py-1 text-[10px] uppercase tracking-[0.22em] text-white/90">
                    Direction 0{index + 1}
                  </span>
                  {active ? (
                    <span className="rounded-full border border-[rgba(212,177,106,0.38)] bg-[rgba(212,177,106,0.18)] px-3 py-1 text-[10px] uppercase tracking-[0.22em] text-[rgba(255,245,225,0.9)]">
                      Main Pick
                    </span>
                  ) : null}
                </div>
              </div>

              <div className="space-y-3 px-5 py-5">
                <div className="flex items-center justify-between gap-4">
                  <h4 className="text-xl font-serif italic text-white">{getDirectionLabel(variant.direction)}</h4>
                  <Sparkles className="h-4 w-4 text-[rgba(212,177,106,0.72)]" />
                </div>
                <p className="text-sm leading-7 text-[var(--lux-muted-foreground)]">
                  {variant.direction === 'old_money' && '更稳、更克制，适合偏老钱、学院或高质感封面。'}
                  {variant.direction === 'street' && '更直接、更有冲击力，适合街头和高对比镜头。'}
                  {variant.direction === 'clean_fit' && '更干净、更轻，适合 clean fit 和轻编辑感内容。'}
                </p>
              </div>
            </button>
          );
        })}
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
          {saved ? '已保存到内容预演历史' : isSaving ? '保存中...' : '保存到内容预演历史'}
        </button>

        {variants[0]?.resultUrl ? (
          <a
            href={variants[0].resultUrl}
            download="creator-preview-result.png"
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
            去创作者工作台
          </Link>
        ) : null}
      </div>
    </div>
  );
}
