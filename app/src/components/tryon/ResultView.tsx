import Link from 'next/link';
import Image from 'next/image';
import React from 'react';
import { AlertCircle, CheckCircle2, Download, RefreshCw, Save, Sparkles } from 'lucide-react';

interface ResultViewProps {
  isGenerating: boolean;
  resultImage: string | null;
  error: string | null;
  onRetry: () => void;
  onSaveHistory?: () => void;
  isSavingHistory?: boolean;
  historySaved?: boolean;
  historySaveError?: string | null;
  progress?: number;
}

export const ResultView: React.FC<ResultViewProps> = ({
  isGenerating,
  resultImage,
  error,
  onRetry,
  onSaveHistory,
  isSavingHistory = false,
  historySaved = false,
  historySaveError = null,
  progress = 0,
}) => {
  const hasSaveControls = typeof onSaveHistory === 'function';

  if (isGenerating) {
    return (
      <div className="relative overflow-hidden rounded-[2rem] border border-[rgba(255,255,255,0.1)] bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))] px-6 py-14 sm:px-10 sm:py-16">
        <div className="absolute inset-x-[15%] top-0 h-40 rounded-full bg-[rgba(212,177,106,0.1)] blur-[110px]" />
        <div className="absolute inset-y-10 left-8 w-px bg-[linear-gradient(180deg,transparent,rgba(255,255,255,0.16),transparent)]" />
        <div className="absolute inset-y-10 right-8 w-px bg-[linear-gradient(180deg,transparent,rgba(255,255,255,0.16),transparent)]" />

        <div className="relative mx-auto flex max-w-4xl flex-col gap-10">
          <div className="flex flex-col items-center text-center">
            <p className="text-xs uppercase tracking-[0.32em] text-[rgba(212,177,106,0.72)]">Atelier Processing</p>

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

            <h3 className="mt-8 text-3xl font-serif italic text-white sm:text-4xl">成片正在暗房显影。</h3>
            <p className="mt-4 max-w-xl text-sm leading-7 text-[var(--lux-muted-foreground)] sm:text-base">
              AI 正在融合轮廓、服装结构与光影细节。当前进度与既有轮询逻辑保持不变。
            </p>
          </div>

          <div className="grid gap-3 text-left sm:grid-cols-3">
            {['Muse aligned', 'Wardrobe mapped', 'Render finishing'].map((label, index) => (
              <div
                key={label}
                className={`
                  rounded-[1.4rem] border px-4 py-4 text-sm
                  ${progress >= [34, 67, 100][index]
                    ? 'border-[rgba(212,177,106,0.34)] bg-[rgba(212,177,106,0.08)] text-[rgba(255,245,225,0.9)]'
                    : 'border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.03)] text-[var(--lux-muted-foreground)]'}
                `}
              >
                <p className="text-[10px] uppercase tracking-[0.24em]">Phase 0{index + 1}</p>
                <p className="mt-3">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="relative overflow-hidden rounded-[2rem] border border-[rgba(255,255,255,0.1)] bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.02))] px-6 py-14 text-center sm:px-10 sm:py-16">
        <div className="absolute inset-x-[18%] top-0 h-32 rounded-full bg-[rgba(255,255,255,0.08)] blur-[100px]" />

        <div className="relative mx-auto max-w-2xl">
          <div className="mx-auto flex h-[4.5rem] w-[4.5rem] items-center justify-center rounded-full border border-[rgba(212,177,106,0.28)] bg-[rgba(255,255,255,0.05)] text-[rgba(255,245,225,0.9)] shadow-[0_18px_60px_rgba(0,0,0,0.26)]">
            <AlertCircle className="h-8 w-8" />
          </div>
          <p className="mt-6 text-xs uppercase tracking-[0.3em] text-[rgba(212,177,106,0.72)]">Render Interrupted</p>
          <h3 className="mt-3 text-3xl font-serif italic text-white">这一幕没有顺利输出。</h3>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-[var(--lux-muted-foreground)] sm:text-base">{error}</p>

          <div className="mt-8 flex justify-center">
            <button
              onClick={onRetry}
              className="inline-flex items-center gap-2 rounded-full border border-[rgba(212,177,106,0.38)] bg-[rgba(255,255,255,0.05)] px-6 py-3 text-sm font-medium text-[rgba(255,245,225,0.94)] transition hover:bg-[rgba(255,255,255,0.08)]"
            >
              <RefreshCw size={18} />
              再试一次
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center">
      <div className="w-full max-w-4xl">
        <div className="mb-5 text-center">
          <p className="text-xs uppercase tracking-[0.32em] text-[rgba(212,177,106,0.72)]">Final Look</p>
          <h3 className="mt-3 text-3xl font-serif italic text-white sm:text-4xl">生成结果已进入主舞台。</h3>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-[var(--lux-muted-foreground)] sm:text-base">
            先确认这一版成片是否成立，再决定保存、下载或回到上一幕重新生成。
          </p>
        </div>

        <div className="lux-stage-frame lux-noise relative overflow-hidden rounded-[2rem] p-3 sm:p-4">
          <div className="absolute inset-x-[12%] top-0 h-24 rounded-full bg-[rgba(212,177,106,0.12)] blur-[90px]" />
          <div className="relative overflow-hidden rounded-[1.5rem] border border-[rgba(255,255,255,0.08)] bg-[rgba(0,0,0,0.28)]">
            {resultImage ? (
              <Image
                src={resultImage}
                alt="Generated Result"
                width={1200}
                height={1500}
                unoptimized
                sizes="(min-width: 1024px) 64rem, 100vw"
                className="h-auto w-full rounded-[1.5rem] object-contain"
              />
            ) : null}
          </div>
        </div>

        {hasSaveControls && historySaved ? (
          <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-[rgba(212,177,106,0.32)] bg-[rgba(212,177,106,0.08)] px-4 py-3 text-sm text-[rgba(255,245,225,0.9)]">
            <CheckCircle2 size={16} />
            <span>已保存到历史记录</span>
          </div>
        ) : null}

        {hasSaveControls && historySaveError && !historySaved ? (
          <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-[rgba(255,255,255,0.14)] bg-[rgba(255,255,255,0.04)] px-4 py-3 text-sm text-[rgba(255,232,214,0.84)]">
            <AlertCircle size={16} />
            <span>{historySaveError}</span>
          </div>
        ) : null}

        <div className="mt-8 flex flex-wrap justify-center gap-4">
          <a
            href={resultImage || '#'}
            download="try-on-result.png"
            className="inline-flex items-center gap-2 rounded-full border border-[rgba(255,255,255,0.14)] bg-white px-6 py-3 text-sm font-medium text-black transition hover:bg-[rgba(255,245,225,0.92)]"
          >
            <Download size={18} />
            下载图片
          </a>

          {hasSaveControls ? (
            <button
              onClick={onSaveHistory}
              disabled={!resultImage || isSavingHistory || historySaved}
              className="inline-flex items-center gap-2 rounded-full border border-[rgba(212,177,106,0.36)] bg-[rgba(212,177,106,0.16)] px-6 py-3 text-sm font-medium text-[rgba(255,248,237,0.96)] transition hover:bg-[rgba(212,177,106,0.22)] disabled:border-[rgba(255,255,255,0.12)] disabled:bg-[rgba(255,255,255,0.05)] disabled:text-[rgba(255,245,225,0.46)] disabled:hover:bg-[rgba(255,255,255,0.05)]"
            >
              {isSavingHistory ? (
                <>
                  <RefreshCw size={18} className="animate-spin" />
                  保存中...
                </>
              ) : historySaved ? (
                <>
                  <CheckCircle2 size={18} />
                  已保存
                </>
              ) : (
                <>
                  <Save size={18} />
                  保存到历史
                </>
              )}
            </button>
          ) : null}

          <button
            onClick={onRetry}
            className="inline-flex items-center gap-2 rounded-full border border-[rgba(255,255,255,0.14)] bg-[rgba(255,255,255,0.04)] px-6 py-3 text-sm font-medium text-[rgba(255,245,225,0.9)] transition hover:bg-[rgba(255,255,255,0.08)]"
          >
            <RefreshCw size={18} />
            重新试穿
          </button>

          {hasSaveControls && historySaved ? (
            <Link
              href="/profile"
              className="inline-flex items-center gap-2 rounded-full border border-[rgba(255,255,255,0.14)] bg-[rgba(255,255,255,0.04)] px-6 py-3 text-sm font-medium text-[rgba(255,245,225,0.9)] transition hover:bg-[rgba(255,255,255,0.08)]"
            >
              <CheckCircle2 size={18} />
              查看个人主页
            </Link>
          ) : null}
        </div>
      </div>
    </div>
  );
};
