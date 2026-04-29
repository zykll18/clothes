import React, { useRef, useState } from 'react';
import { Upload, Loader2 } from 'lucide-react';

interface UploadAreaProps {
  title: string;
  subtitle: string;
  onFileSelect: (file: File) => void;
  accept?: string;
  previewUrl?: string | null;
  minHeight?: string;
}

export const UploadArea: React.FC<UploadAreaProps> = ({
  title,
  subtitle,
  onFileSelect,
  accept = "image/png, image/jpeg, image/jpg, image/webp, image/gif",
  previewUrl,
  minHeight = "min-h-[300px]"
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imageLoading, setImageLoading] = useState(true);

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onFileSelect(e.target.files[0]);
    }
  };

  return (
    <div className="w-full h-full flex flex-col items-center justify-center p-6 sm:p-12 relative group">
      
      {/* Hidden File Input */}
      <input 
        type="file" 
        ref={fileInputRef}
        onChange={handleFileChange}
        accept={accept}
        className="hidden"
      />

      <div 
        onClick={handleClick}
        className={`
          w-full max-w-2xl aspect-[16/10] 
          rounded-xl cursor-pointer 
          transition-all duration-300
          flex flex-col items-center justify-center
          relative overflow-hidden
          ${!previewUrl ? 'dashed-border hover:bg-white/30 bg-white/10 backdrop-blur-sm' : 'border border-white/50 shadow-md bg-white/30'}
        `}
      >
        {previewUrl ? (
          <div className="w-full h-full relative">
            {imageLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
                <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
              </div>
            )}
            <img
              src={previewUrl}
              alt="Preview"
              loading="lazy"
              onLoad={() => setImageLoading(false)}
              className={`w-full h-full object-contain p-4 transition-opacity duration-300 ${imageLoading ? 'opacity-0' : 'opacity-100'}`}
            />
            <div className="absolute inset-0 bg-blue-900/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 backdrop-blur-[2px]">
               <div className="bg-white/90 px-4 py-2 rounded-full flex items-center gap-2 shadow-lg">
                 <Upload size={18} className="text-blue-600" />
                 <span className="text-sm font-medium text-blue-900">更换图片</span>
               </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center text-center z-10 p-6">
            {/* Person Silhouette Placeholder */}
            <div className="mb-6 opacity-40">
               <svg width="100" height="200" viewBox="0 0 100 200" fill="currentColor" className="text-slate-600 drop-shadow-sm">
                  <path d="M50 0 C30 0 20 20 20 30 C20 40 25 45 30 45 L30 50 C10 60 0 80 0 100 L0 160 L20 160 L25 200 L75 200 L80 160 L100 160 L100 100 C100 80 90 60 70 50 L70 45 C75 45 80 40 80 30 C80 20 70 0 50 0 Z" />
               </svg>
            </div>

            <h3 className="text-lg font-semibold text-slate-800 mb-2">{title}</h3>
            <p className="text-sm text-slate-600 mb-8 max-w-xs">{subtitle}</p>
            
            <div className="flex flex-col items-center gap-2">
              <div className="w-12 h-12 border-2 border-slate-600/30 rounded-lg flex items-center justify-center mb-2 bg-white/20 backdrop-blur-sm group-hover:scale-105 transition-transform">
                 <Upload size={24} className="text-slate-700" />
              </div>
              <span className="text-slate-800 font-medium group-hover:text-blue-700 transition-colors">点击上传照片</span>
              <span className="text-slate-500 text-xs mt-1">支持 JPG、PNG、WebP、GIF 格式</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};