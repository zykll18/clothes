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
    <div className="w-full max-w-6xl mx-auto px-4">
      <div className="relative flex items-start justify-between gap-3 sm:gap-4">
        <div className="absolute left-0 right-0 top-[18px] hidden h-px bg-[linear-gradient(90deg,rgba(212,177,106,0.18)_0%,rgba(212,177,106,0.55)_50%,rgba(212,177,106,0.18)_100%)] sm:block" />

        {steps.map((step) => {
          const isActive = step.id === currentStep;
          const isCompleted = step.id < currentStep;
          const stateClass = isActive
            ? 'text-white'
            : isCompleted
              ? 'text-[rgba(255,245,225,0.8)]'
              : 'text-[rgba(255,245,225,0.45)]';

          return (
            <div key={step.id} className="relative flex min-w-0 flex-1 flex-col items-center">
              <div
                className={`
                  relative z-10 flex h-9 w-9 items-center justify-center rounded-full border text-sm font-medium transition-all duration-300 sm:h-10 sm:w-10
                  ${isActive
                    ? 'border-[rgba(212,177,106,0.95)] bg-[rgba(212,177,106,0.18)] text-[rgba(255,248,237,1)] shadow-[0_0_0_6px_rgba(212,177,106,0.08)]'
                    : isCompleted
                      ? 'border-[rgba(212,177,106,0.65)] bg-[rgba(255,255,255,0.06)] text-[rgba(248,232,198,0.92)]'
                      : 'border-[rgba(255,255,255,0.14)] bg-[rgba(255,255,255,0.03)] text-[rgba(255,245,225,0.52)]'}
                `}
              >
                {step.id}
              </div>

              <div className="mt-3 flex flex-col items-center text-center">
                <span className={`text-[10px] uppercase tracking-[0.28em] ${stateClass}`}>
                  0{step.id}
                </span>
                <span
                  className={`
                    mt-1 text-xs sm:text-sm ${stateClass}
                    ${isActive ? 'font-medium' : 'font-normal'}
                  `}
                >
                  {step.label}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
