import React, { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { Loader2, Upload } from 'lucide-react';

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
            ? 'lux-stage-frame min-h-[20rem] sm:min-h-[24rem]'
            : 'lux-stage-frame min-h-[16rem] hover:-translate-y-0.5 hover:border-[rgba(212,177,106,0.34)] sm:min-h-[18rem]'}
        `}
      >
        <div className="pointer-events-none absolute inset-x-6 top-6 flex items-center justify-between text-[10px] uppercase tracking-[0.24em] text-[rgba(255,245,225,0.45)] sm:inset-x-8">
          <span>Portrait</span>
          <span>{previewUrl ? 'Portrait Ready' : 'Upload Open'}</span>
        </div>

        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(212,177,106,0.16),transparent_32%),linear-gradient(180deg,rgba(255,255,255,0.05),rgba(0,0,0,0.08))]" />
        <div className="pointer-events-none absolute inset-[14px] rounded-[1.5rem] border border-[rgba(255,255,255,0.08)]" />

        {previewUrl ? (
          <div className="relative flex h-full min-h-[20rem] flex-col justify-end sm:min-h-[24rem]">
            <div className="absolute inset-0">
              {imageLoading ? (
                <div className="absolute inset-0 flex items-center justify-center bg-[rgba(5,5,5,0.7)] backdrop-blur-sm">
                  <div className="flex flex-col items-center gap-3 text-[rgba(255,245,225,0.78)]">
                    <Loader2 className="h-8 w-8 animate-spin text-[rgba(212,177,106,0.92)]" />
                    <span className="text-xs uppercase tracking-[0.28em]">Preparing Preview</span>
                  </div>
                </div>
              ) : null}

              <Image
                src={previewUrl}
                alt="Preview"
                fill
                unoptimized
                sizes="(min-width: 640px) 40rem, 100vw"
                onLoad={() => setImageLoading(false)}
                className={`object-contain p-6 transition duration-500 sm:p-8 ${imageLoading ? 'scale-[0.985] opacity-0' : 'scale-100 opacity-100'}`}
              />
            </div>

            <div className="relative z-10 mt-auto flex flex-col gap-4 bg-[linear-gradient(180deg,transparent_0%,rgba(4,4,4,0.78)_34%,rgba(4,4,4,0.92)_100%)] px-5 pb-6 pt-16 sm:px-6">
              <div>
                <p className="text-[10px] uppercase tracking-[0.24em] text-[rgba(212,177,106,0.72)]">Ready</p>
                <h3 className="mt-2 text-2xl font-serif italic text-white sm:text-[1.8rem]">{title}</h3>
              </div>

              <div className="flex flex-col gap-4 text-[rgba(255,245,225,0.88)] sm:flex-row sm:items-end sm:justify-between">
                <span className="inline-flex items-center gap-2 self-start rounded-full border border-[rgba(212,177,106,0.28)] bg-[rgba(255,255,255,0.05)] px-4 py-2 text-xs uppercase tracking-[0.22em] text-[rgba(255,245,225,0.82)] transition group-hover:border-[rgba(212,177,106,0.4)] group-hover:text-white sm:self-auto">
                  <Upload size={14} />
                  Replace Portrait
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className="relative flex min-h-[16rem] flex-col px-5 pb-6 pt-16 sm:min-h-[18rem] sm:px-7">
            <div className="grid gap-5 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
              <div className="max-w-xl">
                <p className="text-[10px] uppercase tracking-[0.24em] text-[rgba(212,177,106,0.72)]">Portrait Upload</p>
                <h3 className="mt-3 text-2xl font-serif italic leading-tight text-white sm:text-[2rem]">{title}</h3>
                <p className="mt-3 max-w-lg text-sm leading-6 text-[var(--lux-muted-foreground)]">
                  {subtitle}
                </p>
              </div>

              <div className="flex flex-col items-start gap-3 sm:items-end">
                <div className="inline-flex items-center gap-3 rounded-full border border-[rgba(212,177,106,0.34)] bg-[rgba(255,255,255,0.06)] px-5 py-3 text-sm font-medium text-[rgba(255,248,237,0.96)] shadow-[0_16px_50px_rgba(0,0,0,0.22)] transition group-hover:border-[rgba(212,177,106,0.48)] group-hover:bg-[rgba(255,255,255,0.1)]">
                  <Upload size={18} />
                  选择图片
                </div>
                <span className="text-[10px] uppercase tracking-[0.22em] text-[rgba(255,245,225,0.42)]">
                  JPG / PNG / WebP
                </span>
              </div>
            </div>
          </div>
        )}
      </button>
    </div>
  );
};
