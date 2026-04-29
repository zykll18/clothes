import React from 'react';
import { AlertCircle, Download, RefreshCw } from 'lucide-react';

interface ResultViewProps {
  isGenerating: boolean;
  resultImage: string | null;
  error: string | null;
  onRetry: () => void;
  progress?: number;
}

export const ResultView: React.FC<ResultViewProps> = ({ isGenerating, resultImage, error, onRetry, progress = 0 }) => {
  if (isGenerating) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        {/* Circular Progress Indicator */}
        <div className="relative w-24 h-24 mx-auto mb-6">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="45" fill="none" stroke="#e5e7eb" strokeWidth="8" />
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke="#3b82f6"
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={`${progress * 2.83} 283`}
              className="transition-all duration-500"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-xl font-bold text-blue-600">{progress}%</span>
          </div>
        </div>
        <h3 className="text-xl font-medium text-slate-700">正在生成试穿效果...</h3>
        <p className="text-slate-500 mt-2">AI 正在进行图像融合，请稍候</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center p-8">
        <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-4">
          <AlertCircle className="w-8 h-8 text-red-500" />
        </div>
        <h3 className="text-xl font-medium text-slate-800 mb-2">生成失败</h3>
        <p className="text-slate-500 max-w-md mb-8">{error}</p>
        <button 
          onClick={onRetry}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          <RefreshCw size={18} />
          重试
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center p-4">
      <div className="relative w-full max-w-2xl bg-white p-2 rounded-xl shadow-sm border border-gray-100">
        <img 
          src={resultImage || ''} 
          alt="Generated Result" 
          className="w-full h-auto rounded-lg"
        />
      </div>
      
      <div className="mt-8 flex gap-4">
        <button 
          onClick={onRetry}
          className="px-6 py-3 border border-gray-300 text-slate-700 rounded-lg hover:bg-gray-50 transition-colors font-medium flex items-center gap-2"
        >
          <RefreshCw size={20} />
          重新试穿
        </button>
        <a 
          href={resultImage || '#'} 
          download="try-on-result.png"
          className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-lg shadow-blue-200 flex items-center gap-2"
        >
          <Download size={20} />
          下载图片
        </a>
      </div>
    </div>
  );
};
