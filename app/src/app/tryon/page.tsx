'use client';

import { useState, useCallback, useEffect } from 'react';
import { StepIndicator } from '@/components/tryon/StepIndicator';
import { UploadArea } from '@/components/tryon/UploadArea';
import { ResultView } from '@/components/tryon/ResultView';
import { Shirt, User, Sparkles, Upload, Library } from 'lucide-react';

type AppStep = 1 | 2 | 3 | 4;

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
  mode: 'upper_body' | 'full_body';
}

export default function AITryOnPage() {
  const [state, setState] = useState<AppState>({
    currentStep: 1,
    personImage: null,
    clothingImage: null,
    generatedImage: null,
    isGenerating: false,
    error: null,
    mode: 'upper_body'
  });

  // Progress state for generation
  const [progress, setProgress] = useState(0);

  // Clothing selection state
  const [savedClothes, setSavedClothes] = useState<ClothingItem[]>([]);
  const [clothesLoading, setClothesLoading] = useState(false);
  const [showClothingSelector, setShowClothingSelector] = useState(false);
  const [clothingSource, setClothingSource] = useState<'upload' | 'saved'>('upload');

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

  const nextStep = () => {
    const next = (state.currentStep + 1) as AppStep;
    const { personImage, clothingImage, mode } = state;

    setState(prev => ({
      ...prev,
      currentStep: next
    }));

    if (next === 4) {
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
  };

  const upperClothes = savedClothes.filter(c => c.clothType === 'upper');
  const lowerClothes = savedClothes.filter(c => c.clothType === 'lower');

  return (
    <div className="min-h-screen py-10 px-4 flex flex-col items-center relative w-full overflow-hidden bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Background Decorative Blobs */}
      <div className="fixed top-0 left-0 w-full h-full -z-10 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[600px] h-[600px] bg-blue-300 rounded-full mix-blend-multiply filter blur-[100px] opacity-60 animate-blob"></div>
        <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-sky-200 rounded-full mix-blend-multiply filter blur-[100px] opacity-60 animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-[-20%] left-[20%] w-[500px] h-[500px] bg-cyan-200 rounded-full mix-blend-multiply filter blur-[100px] opacity-60 animate-blob animation-delay-4000"></div>
        <div className="absolute bottom-[10%] right-[10%] w-[400px] h-[400px] bg-indigo-200 rounded-full mix-blend-multiply filter blur-[100px] opacity-50 animate-blob animation-delay-3000"></div>
      </div>

      {/* Header */}
      <header className="text-center mb-6 sm:mb-10 relative z-10 px-4">
        <h1 className="text-3xl sm:text-4xl font-serif text-slate-900 mb-2 sm:mb-3 tracking-wide drop-shadow-sm">AI 虚拟试衣</h1>
        <p className="text-slate-600 text-base sm:text-lg">简单4步，看衣服穿在你身上的效果</p>
      </header>

      {/* Stepper */}
      <StepIndicator currentStep={state.currentStep} />

      {/* Main Card */}
      <main className="w-full max-w-4xl glass-panel rounded-3xl p-2 sm:p-4 min-h-[500px] flex flex-col relative overflow-hidden transition-all z-10 bg-white/20 backdrop-blur-sm border border-white/30 shadow-xl">

        {/* Step 1: Upload Person */}
        {state.currentStep === 1 && (
          <div className="flex-1 animate-in fade-in slide-in-from-right-4 duration-500">
            <UploadArea
              title="第一步：上传本人照片"
              subtitle="请上传一张清晰的全身或半身照，背景尽量简单"
              previewUrl={state.personImage}
              onFileSelect={(f) => handleFileSelect(f, 'person')}
            />
          </div>
        )}

        {/* Step 2: Select Clothing Source */}
        {state.currentStep === 2 && (
          <div className="flex-1 animate-in fade-in slide-in-from-right-4 duration-500">
            {showClothingSelector ? (
              /* Clothing Selector Grid */
              <div className="flex flex-col h-full p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-medium text-slate-800">从衣橱选择衣服</h3>
                  <button
                    onClick={() => {
                      setShowClothingSelector(false);
                      setClothingSource('upload');
                    }}
                    className="px-4 py-2 text-sm text-slate-600 hover:text-slate-800 flex items-center gap-1"
                  >
                    <Upload size={16} />
                    改为上传
                  </button>
                </div>

                {clothesLoading ? (
                  <div className="flex-1 flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                ) : savedClothes.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                    <p className="text-slate-500 mb-4">衣橱还没有衣服</p>
                    <button
                      onClick={() => {
                        setShowClothingSelector(false);
                        setClothingSource('upload');
                      }}
                      className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-all"
                    >
                      上传新衣服
                    </button>
                  </div>
                ) : (
                  <div className="flex-1 overflow-y-auto space-y-4">
                    {/* Upper Body */}
                    {upperClothes.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium text-slate-500 mb-2">👕 上装</h4>
                        <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                          {upperClothes.map((item) => (
                            <button
                              key={item.id}
                              onClick={() => selectClothingFromSaved(item)}
                              className="relative aspect-[3/4] rounded-xl overflow-hidden border-2 border-transparent hover:border-blue-400 transition-all group"
                            >
                              <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all"></div>
                              <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/60 to-transparent">
                                <p className="text-white text-xs truncate">{item.name}</p>
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Lower Body */}
                    {lowerClothes.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium text-slate-500 mb-2">👖 下装</h4>
                        <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                          {lowerClothes.map((item) => (
                            <button
                              key={item.id}
                              onClick={() => selectClothingFromSaved(item)}
                              className="relative aspect-[3/4] rounded-xl overflow-hidden border-2 border-transparent hover:border-blue-400 transition-all group"
                            >
                              <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all"></div>
                              <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/60 to-transparent">
                                <p className="text-white text-xs truncate">{item.name}</p>
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : clothingSource === 'saved' ? (
              /* Selected from Wardrobe Preview */
              <div className="flex flex-col h-full">
                <div className="flex items-center justify-between mb-4 px-4">
                  <h3 className="text-xl font-medium text-slate-800">已选择衣服</h3>
                  <button
                    onClick={() => {
                      setShowClothingSelector(true);
                      setClothingSource('saved');
                      fetchSavedClothes();
                    }}
                    className="px-4 py-2 text-sm text-slate-600 hover:text-slate-800 flex items-center gap-1"
                  >
                    <Library size={16} />
                    更换衣服
                  </button>
                </div>
                <div className="flex-1 flex items-center justify-center p-4">
                  <div className="relative w-full max-w-md aspect-[3/4] rounded-2xl overflow-hidden border-2 border-blue-200 shadow-lg">
                    <img
                      src={state.clothingImage || ''}
                      alt="Selected clothing"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-3 left-3 px-3 py-1 bg-blue-500 text-white text-sm rounded-full">
                      来自衣橱
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* Upload Area */
              <div className="flex flex-col h-full">
                <div className="flex items-center justify-between mb-4 px-4">
                  <h3 className="text-xl font-medium text-slate-800">上传衣服照片</h3>
                  <button
                    onClick={() => {
                      setShowClothingSelector(true);
                      setClothingSource('saved');
                      fetchSavedClothes();
                    }}
                    className="px-4 py-2 text-sm text-slate-600 hover:text-slate-800 flex items-center gap-1"
                  >
                    <Library size={16} />
                    从衣橱选择
                  </button>
                </div>
                <div className="flex-1">
                  <UploadArea
                    title=""
                    subtitle="衣服照片最好平铺拍摄或挂在衣架上"
                    previewUrl={state.clothingImage}
                    onFileSelect={(f) => handleFileSelect(f, 'clothing')}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Step 3: Select Mode */}
        {state.currentStep === 3 && (
          <div className="flex-1 flex flex-col items-center justify-center gap-6 sm:gap-8 animate-in fade-in slide-in-from-right-4 duration-500 py-6 sm:py-12 px-4">
            <h3 className="text-xl sm:text-2xl font-medium text-slate-800">选择试穿模式</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 w-full max-w-2xl px-0 sm:px-8">
              <button
                onClick={() => setState(prev => ({ ...prev, mode: 'upper_body' }))}
                className={`
                  p-6 sm:p-8 rounded-2xl border transition-all flex flex-col items-center gap-3 sm:gap-4 group backdrop-blur-sm
                  ${state.mode === 'upper_body'
                    ? 'border-blue-400 bg-blue-100/40 shadow-lg shadow-blue-100/40 scale-[1.02]'
                    : 'border-white/50 bg-white/20 hover:bg-white/40 hover:shadow-md'}
                `}
              >
                <div className={`p-3 sm:p-4 rounded-full ${state.mode === 'upper_body' ? 'bg-blue-500 text-white' : 'bg-white/60 text-slate-500'}`}>
                  <User size={28} className="sm:w-8 sm:h-8" />
                </div>
                <div className="text-center">
                  <h4 className="text-base sm:text-lg font-semibold text-slate-800">半身试穿</h4>
                  <p className="text-xs sm:text-sm text-slate-600 mt-1">适用于 T恤、衬衫、外套</p>
                </div>
              </button>

              <button
                onClick={() => setState(prev => ({ ...prev, mode: 'full_body' }))}
                className={`
                  p-6 sm:p-8 rounded-2xl border transition-all flex flex-col items-center gap-3 sm:gap-4 group backdrop-blur-sm
                  ${state.mode === 'full_body'
                    ? 'border-blue-400 bg-blue-100/40 shadow-lg shadow-blue-100/40 scale-[1.02]'
                    : 'border-white/50 bg-white/20 hover:bg-white/40 hover:shadow-md'}
                `}
              >
                 <div className={`p-3 sm:p-4 rounded-full ${state.mode === 'full_body' ? 'bg-blue-500 text-white' : 'bg-white/60 text-slate-500'}`}>
                  <Shirt size={28} className="sm:w-8 sm:h-8" />
                </div>
                <div className="text-center">
                  <h4 className="text-base sm:text-lg font-semibold text-slate-800">全身试穿</h4>
                  <p className="text-xs sm:text-sm text-slate-600 mt-1">适用于 连衣裙、套装</p>
                </div>
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Result */}
        {state.currentStep === 4 && (
          <div className="flex-1 animate-in fade-in duration-700">
             <ResultView
               isGenerating={state.isGenerating}
               resultImage={state.generatedImage}
               error={state.error}
               onRetry={() => generateResult(state.personImage, state.clothingImage, state.mode)}
               progress={progress}
             />
          </div>
        )}

        {/* Footer Navigation within Card */}
        {state.currentStep !== 4 && (
          <div className="p-4 sm:p-6 flex flex-col sm:flex-row justify-center gap-3 sm:gap-4 border-t border-white/20">
            {state.currentStep > 1 && (
              <button
                onClick={prevStep}
                className="w-full sm:w-auto px-8 py-2.5 rounded-lg border border-slate-300/40 bg-white/20 text-slate-700 hover:bg-white/40 transition-all font-medium sm:min-w-[120px] backdrop-blur-sm"
              >
                上一步
              </button>
            )}

            <button
              onClick={nextStep}
              disabled={isNextDisabled()}
              className={`
                w-full sm:w-auto px-8 py-2.5 rounded-lg text-white font-medium sm:min-w-[120px] shadow-lg transition-all backdrop-blur-sm flex items-center justify-center gap-2
                ${isNextDisabled()
                  ? 'bg-blue-300/70 cursor-not-allowed'
                  : 'bg-gradient-to-r from-blue-500 to-sky-500 hover:from-blue-600 hover:to-sky-600 shadow-blue-200/50 transform hover:-translate-y-0.5'}
              `}
            >
              {state.currentStep === 3 ? (
                <>
                  <Sparkles size={18} />
                  开始生成
                </>
              ) : '下一步'}
            </button>
          </div>
        )}
      </main>

      {/* Restart Button for Result Step */}
      {state.currentStep === 4 && state.generatedImage && (
        <div className="mt-8 flex justify-center">
          <button
            onClick={resetAll}
            className="px-6 py-3 border border-gray-300 text-slate-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
          >
            再试一次
          </button>
        </div>
      )}

      {/* Global Footer */}
      <footer className="mt-12 text-center text-slate-500 text-sm relative z-10">
        <p>Powered by 阿里云 DashScope AI 试衣</p>
      </footer>
    </div>
  );
}
