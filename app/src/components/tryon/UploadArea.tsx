import React, { useEffect, useRef, useState } from 'react';
import { ImagePlus, Loader2, Upload } from 'lucide-react';

interface UploadAreaProps {
  title: string;
  subtitle: string;
  onFileSelect: (file: File) => void;
  accept?: string;
  previewUrl?: string | null;
}

export const UploadArea: React.FC<UploadAreaProps> = ({
  title,
  subtitle,
  onFileSelect,
  accept = 'image/png, image/jpeg, image/jpg, image/webp, image/gif',
  previewUrl,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imageLoading, setImageLoading] = useState(Boolean(previewUrl));

  useEffect(() => {
    setImageLoading(Boolean(previewUrl));
  }, [previewUrl]);

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onFileSelect(e.target.files[0]);
    }
  };

  return (
    <div className="group relative w-full">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept={accept}
        className="hidden"
      />

      <button
        type="button"
        onClick={handleClick}
        className={`
          relative block w-full overflow-hidden rounded-[2rem] text-left transition duration-500
          focus:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(212,177,106,0.55)] focus-visible:ring-offset-0
          ${previewUrl
            ? 'lux-stage-frame min-h-[26rem] sm:min-h-[30rem]'
            : 'lux-stage-frame min-h-[26rem] hover:-translate-y-0.5 hover:border-[rgba(212,177,106,0.34)] sm:min-h-[30rem]'}
        `}
      >
        <div className="pointer-events-none absolute inset-x-8 top-7 flex items-center justify-between text-[10px] uppercase tracking-[0.3em] text-[rgba(255,245,225,0.45)] sm:text-[11px]">
          <span>Digital Casting</span>
          <span>{previewUrl ? 'Scene Held' : 'Stage Open'}</span>
        </div>

        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(212,177,106,0.16),transparent_32%),linear-gradient(180deg,rgba(255,255,255,0.05),rgba(0,0,0,0.08))]" />
        <div className="pointer-events-none absolute inset-[18px] rounded-[1.6rem] border border-[rgba(255,255,255,0.08)]" />
        <div className="pointer-events-none absolute inset-x-10 bottom-9 h-px bg-[linear-gradient(90deg,transparent,rgba(212,177,106,0.4),transparent)]" />

        {previewUrl ? (
          <div className="relative flex h-full min-h-[26rem] flex-col justify-end sm:min-h-[30rem]">
            <div className="absolute inset-0">
              {imageLoading ? (
                <div className="absolute inset-0 flex items-center justify-center bg-[rgba(5,5,5,0.7)] backdrop-blur-sm">
                  <div className="flex flex-col items-center gap-3 text-[rgba(255,245,225,0.78)]">
                    <Loader2 className="h-8 w-8 animate-spin text-[rgba(212,177,106,0.92)]" />
                    <span className="text-xs uppercase tracking-[0.28em]">Preparing Preview</span>
                  </div>
                </div>
              ) : null}

              <img
                src={previewUrl}
                alt="Preview"
                loading="lazy"
                onLoad={() => setImageLoading(false)}
                className={`h-full w-full object-contain p-8 transition duration-500 sm:p-10 ${imageLoading ? 'scale-[0.985] opacity-0' : 'scale-100 opacity-100'}`}
              />
            </div>

            <div className="relative z-10 mt-auto flex flex-col gap-5 bg-[linear-gradient(180deg,transparent_0%,rgba(4,4,4,0.78)_34%,rgba(4,4,4,0.92)_100%)] px-7 pb-8 pt-20 sm:px-8">
              <div>
                <p className="text-xs uppercase tracking-[0.28em] text-[rgba(212,177,106,0.72)]">Scene Prepared</p>
                <h3 className="mt-3 text-2xl font-serif italic text-white sm:text-[2rem]">{title}</h3>
                <p className="mt-3 max-w-2xl text-sm leading-7 text-[var(--lux-muted-foreground)]">{subtitle}</p>
              </div>

              <div className="flex flex-col gap-4 text-[rgba(255,245,225,0.88)] sm:flex-row sm:items-end sm:justify-between">
                <div className="space-y-3">
                  <div className="inline-flex items-center gap-3 text-sm">
                    <span className="flex h-11 w-11 items-center justify-center rounded-full border border-[rgba(212,177,106,0.3)] bg-[rgba(255,255,255,0.05)]">
                      <ImagePlus size={18} />
                    </span>
                    <span>当前画面已就位，可继续进入下一幕。</span>
                  </div>

                  <p className="max-w-xl text-sm leading-7 text-[rgba(255,245,225,0.62)]">
                    如需换图，直接替换当前人物素材即可，现有流程与后续步骤保持不变。
                  </p>
                </div>

                <span className="inline-flex items-center gap-2 self-start rounded-full border border-[rgba(212,177,106,0.28)] bg-[rgba(255,255,255,0.05)] px-4 py-2 text-xs uppercase tracking-[0.22em] text-[rgba(255,245,225,0.82)] transition group-hover:border-[rgba(212,177,106,0.4)] group-hover:text-white sm:self-auto">
                  <Upload size={14} />
                  Continue With A New Image
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className="relative flex min-h-[26rem] flex-col px-7 pb-8 pt-20 sm:min-h-[30rem] sm:px-8 sm:pb-9">
            <div className="grid gap-8 lg:grid-cols-[minmax(0,1.1fr)_14rem] lg:items-start">
              <div>
                <p className="text-xs uppercase tracking-[0.28em] text-[rgba(212,177,106,0.72)]">Upload Stage</p>
                <h3 className="mt-3 text-3xl font-serif italic text-white sm:text-[2.4rem]">{title}</h3>
                <p className="mt-4 max-w-2xl text-sm leading-7 text-[var(--lux-muted-foreground)] sm:text-base">
                  {subtitle}
                </p>
              </div>

              <div className="justify-self-start lg:justify-self-end">
                <div className="rounded-[1.6rem] border border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.03)] px-4 py-4 backdrop-blur-sm">
                  <p className="text-[10px] uppercase tracking-[0.28em] text-[rgba(255,245,225,0.5)]">Accepted</p>
                  <p className="mt-3 text-sm leading-7 text-[rgba(255,245,225,0.84)]">JPG, PNG, WebP, GIF</p>
                </div>
              </div>
            </div>

            <div className="mt-10 flex flex-1 items-center justify-center">
              <div className="flex w-full max-w-2xl flex-col items-center text-center">
                <div className="relative flex h-40 w-32 items-center justify-center rounded-[999px] border border-[rgba(212,177,106,0.24)] bg-[radial-gradient(circle_at_top,rgba(212,177,106,0.18),transparent_58%),rgba(255,255,255,0.03)] text-[rgba(255,245,225,0.9)] shadow-[0_24px_80px_rgba(0,0,0,0.24)]">
                  <div className="absolute inset-3 rounded-[999px] border border-[rgba(255,255,255,0.08)]" />
                  <Upload className="relative z-10 h-10 w-10" />
                </div>

                <p className="mt-8 text-sm uppercase tracking-[0.3em] text-[rgba(255,245,225,0.62)]">Opening Portrait</p>
                <h4 className="mt-4 text-2xl font-serif italic text-white sm:text-[2rem]">
                  先放入这一幕唯一需要的主角画面。
                </h4>
                <p className="mt-4 max-w-lg text-sm leading-7 text-[var(--lux-muted-foreground)]">
                  选择一张清晰人物图开始试穿。上传后会直接进入当前场景，不会打断你后续的步骤节奏。
                </p>

                <div className="mt-8 inline-flex items-center gap-3 rounded-full border border-[rgba(212,177,106,0.34)] bg-[rgba(255,255,255,0.06)] px-6 py-3 text-sm font-medium text-[rgba(255,248,237,0.96)] shadow-[0_16px_50px_rgba(0,0,0,0.22)] transition group-hover:border-[rgba(212,177,106,0.48)] group-hover:bg-[rgba(255,255,255,0.1)]">
                  <Upload size={18} />
                  Select Image To Begin
                </div>
              </div>
            </div>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-3 text-xs uppercase tracking-[0.22em] text-[rgba(255,245,225,0.48)]">
              <span className="rounded-full border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.03)] px-4 py-2">
                Clean portrait preferred
              </span>
              <span className="rounded-full border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.03)] px-4 py-2">
                Full or upper body supported
              </span>
            </div>
          </div>
        )}
      </button>
    </div>
  );
};
