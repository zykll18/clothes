import type { PrimaryColor } from '@/lib/creator-preview';

interface ColorSelectionStepProps {
  selectedColor: string | null;
  onSelectColor: (color: string) => void;
}

const COLOR_OPTIONS: Array<{
  value: PrimaryColor;
  label: string;
  swatch: string;
  accent: string;
}> = [
  { value: 'black', label: 'Black', swatch: 'bg-[#111111]', accent: 'text-white' },
  { value: 'white', label: 'White', swatch: 'bg-[#f5f3eb]', accent: 'text-black' },
  { value: 'grey', label: 'Grey', swatch: 'bg-[#6f7278]', accent: 'text-white' },
  { value: 'navy', label: 'Navy', swatch: 'bg-[#1e2f56]', accent: 'text-white' },
  { value: 'brown', label: 'Brown', swatch: 'bg-[#6b4b35]', accent: 'text-white' },
  { value: 'green', label: 'Green', swatch: 'bg-[#405840]', accent: 'text-white' },
  { value: 'red', label: 'Red', swatch: 'bg-[#7b2834]', accent: 'text-white' },
];

export function ColorSelectionStep({
  selectedColor,
  onSelectColor,
}: ColorSelectionStepProps) {
  return (
    <div className="space-y-8">
      <div className="max-w-3xl">
        <p className="lux-kicker text-[11px]">Primary Color</p>
        <h3 className="mt-3 font-serif text-3xl italic text-white sm:text-4xl">
          先定今天想让观众记住的颜色。
        </h3>
        <p className="mt-4 text-sm leading-7 text-[var(--lux-muted-foreground)] sm:text-base">
          这一步不是做完整搭配，而是先给本次内容设一个视觉锚点。后面的推荐池和部位选择都会围绕它展开。
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {COLOR_OPTIONS.map((option) => {
          const active = selectedColor === option.value;

          return (
            <button
              key={option.value}
              type="button"
              onClick={() => onSelectColor(option.value)}
              className={`
                group rounded-[1.75rem] border p-4 text-left transition duration-300
                ${active
                  ? 'border-[rgba(212,177,106,0.5)] bg-[rgba(255,255,255,0.08)] shadow-[0_22px_70px_rgba(0,0,0,0.22)]'
                  : 'border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.03)] hover:-translate-y-1 hover:border-[rgba(212,177,106,0.28)]'}
              `}
            >
              <div className="flex items-center justify-between gap-4">
                <span
                  className={`flex h-16 w-16 items-center justify-center rounded-[1.25rem] border border-white/10 ${option.swatch} ${option.accent}`}
                >
                  {option.label.slice(0, 1)}
                </span>
                <span
                  className={`
                    rounded-full border px-3 py-1 text-[10px] uppercase tracking-[0.24em]
                    ${active
                      ? 'border-[rgba(212,177,106,0.45)] text-[rgba(255,245,225,0.88)]'
                      : 'border-[rgba(255,255,255,0.12)] text-[rgba(255,245,225,0.45)]'}
                  `}
                >
                  {active ? 'Selected' : 'Palette'}
                </span>
              </div>

              <h4 className="mt-5 text-lg text-white">{option.label}</h4>
              <p className="mt-2 text-sm leading-6 text-[var(--lux-muted-foreground)]">
                {option.value === 'black' && '更利落、压气场，适合街头或强对比镜头。'}
                {option.value === 'white' && '更 clean，适合留白感封面和轻层次构图。'}
                {option.value === 'grey' && '适合做低饱和过渡，保留轮廓细节。'}
                {option.value === 'navy' && '更稳，适合老钱或学院感的内容方向。'}
                {option.value === 'brown' && '偏复古与老钱，适合暖调人像。'}
                {option.value === 'green' && '更有记忆点，适合做风格切口。'}
                {option.value === 'red' && '存在感最强，适合做主视觉爆点。'}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
