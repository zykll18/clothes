import React from 'react';

type AppStep = 1 | 2 | 3 | 4;

interface StepIndicatorProps {
  currentStep: AppStep;
}

const steps = [
  { id: 1, label: '上传照片' },
  { id: 2, label: '上传衣服' },
  { id: 3, label: '选择模式' },
  { id: 4, label: '生成结果' },
];

export const StepIndicator: React.FC<StepIndicatorProps> = ({ currentStep }) => {
  return (
    <div className="w-full max-w-4xl mx-auto mb-8 px-4">
      <div className="flex items-center justify-between relative">
        {/* Connecting Lines */}
        <div className="absolute top-1/2 left-0 w-full h-0.5 -translate-y-1/2 bg-gray-200 -z-10 rounded"></div>
        
        {steps.map((step) => {
          const isActive = step.id === currentStep;
          const isCompleted = step.id < currentStep;
          
          return (
            <div key={step.id} className="flex flex-col items-center bg-transparent">
              <div 
                className={`
                  text-sm font-medium px-4 py-2 transition-all duration-300 relative
                  ${isActive ? 'text-blue-600' : isCompleted ? 'text-gray-500' : 'text-gray-400'}
                `}
              >
                <span className="whitespace-nowrap text-xs sm:text-sm">
                  <span className="hidden sm:inline">Step {step.id}: </span>
                  <span className="sm:hidden">{step.id}. </span>
                  {step.label}
                </span>
                {/* Active Indicator Line specific to the tab style in the screenshot */}
                {isActive && (
                  <div className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600 rounded-full mt-1"></div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
