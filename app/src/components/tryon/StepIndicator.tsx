import React from 'react';

type AppStep = 1 | 2 | 3 | 4 | 5;

interface StepIndicatorProps {
  currentStep: AppStep;
}

const steps = [
  { id: 1, chapter: 'Scene 01', label: '本人入镜' },
  { id: 2, chapter: 'Scene 02', label: '今日配色' },
  { id: 3, chapter: 'Scene 03', label: '今日风格' },
  { id: 4, chapter: 'Scene 04', label: '游戏式选衣' },
  { id: 5, chapter: 'Scene 05', label: '生成预览' },
];

export const StepIndicator: React.FC<StepIndicatorProps> = ({ currentStep }) => {
  return (
    <div className="w-full">
      <div className="grid gap-2.5 sm:grid-cols-5 sm:gap-3">
        {steps.map((step, index) => {
          const isActive = step.id === currentStep;
          const isCompleted = step.id < currentStep;
          const frameClass = isActive
            ? 'border-[rgba(212,177,106,0.52)] bg-[rgba(212,177,106,0.12)] text-white shadow-[0_18px_60px_rgba(0,0,0,0.18)]'
            : isCompleted
              ? 'border-[rgba(255,255,255,0.12)] bg-[rgba(255,255,255,0.05)] text-[rgba(255,245,225,0.86)]'
              : 'border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.02)] text-[rgba(255,245,225,0.52)]';
          const dotClass = isActive
            ? 'bg-[rgba(212,177,106,0.96)] shadow-[0_0_0_6px_rgba(212,177,106,0.12)]'
            : isCompleted
              ? 'bg-[rgba(255,245,225,0.84)]'
              : 'bg-[rgba(255,255,255,0.24)]';

          return (
            <div key={step.id} className="relative min-w-0">
              <div className={`rounded-[1.35rem] border px-4 py-4 backdrop-blur-md transition-all duration-300 ${frameClass}`}>
                <div className="flex items-center gap-3">
                  <span className={`h-2.5 w-2.5 rounded-full transition-all duration-300 ${dotClass}`} />
                  <span className="text-[10px] uppercase tracking-[0.3em] text-inherit/80">
                    {step.chapter}
                  </span>
                </div>

                <p
                  className={`
                    mt-4 text-sm leading-6 sm:text-[15px]
                    ${isActive ? 'font-medium text-white' : 'font-normal text-inherit'}
                  `}
                >
                  {step.label}
                </p>
              </div>

              {index < steps.length - 1 ? (
                <div className="pointer-events-none absolute left-[calc(100%+0.15rem)] top-1/2 hidden h-px w-2 -translate-y-1/2 bg-[linear-gradient(90deg,rgba(212,177,106,0.28),rgba(255,255,255,0.08))] sm:block" />
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
};
