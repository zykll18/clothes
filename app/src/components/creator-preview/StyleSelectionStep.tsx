import { DIRECTION_LABELS, type CreatorDirection } from '@/lib/creator-preview';

interface StyleSelectionStepProps {
  selectedStyle: CreatorDirection | null;
  onSelectStyle: (style: CreatorDirection) => void;
}

const STYLE_OPTIONS: Array<{
  value: CreatorDirection;
  title: string;
  subtitle: string;
  keywords: string[];
}> = [
  {
    value: 'clean_fit',
    title: DIRECTION_LABELS.clean_fit,
    subtitle: '干净、克制、留白多，适合低饱和层次和日常高级感。',
    keywords: ['clean', 'minimal', 'basic', '简洁', '通勤'],
  },
  {
    value: 'street',
    title: DIRECTION_LABELS.street,
    subtitle: '轮廓更强、对比更直接，适合廓形外套、运动感和街头单品。',
    keywords: ['street', 'oversize', 'sport', '街头', '机能'],
  },
  {
    value: 'old_money',
    title: DIRECTION_LABELS.old_money,
    subtitle: '更稳、更贵气，适合西装、大衣、针织、皮革和复古色系。',
    keywords: ['classic', 'tailored', 'vintage', '老钱', '复古'],
  },
];

export function StyleSelectionStep({
  selectedStyle,
  onSelectStyle,
}: StyleSelectionStepProps) {
  return (
    <div className="space-y-8">
      <div className="max-w-3xl">
        <p className="lux-kicker text-[11px]">Style Filter</p>
        <h3 className="mt-3 font-serif text-3xl italic text-white sm:text-4xl">
          再定今天要走哪种风格。
        </h3>
        <p className="mt-4 text-sm leading-7 text-[var(--lux-muted-foreground)] sm:text-base">
          风格不是最后输出的“方向卡”，而是提前筛衣服的规则。它会影响后面每个部位的推荐顺序。
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {STYLE_OPTIONS.map((option) => {
          const active = selectedStyle === option.value;

          return (
            <button
              key={option.value}
              type="button"
              onClick={() => onSelectStyle(option.value)}
              className={`
                group rounded-[1.85rem] border p-5 text-left transition duration-300
                ${active
                  ? 'border-[rgba(212,177,106,0.5)] bg-[rgba(255,255,255,0.08)] shadow-[0_22px_70px_rgba(0,0,0,0.22)]'
                  : 'border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.03)] hover:-translate-y-1 hover:border-[rgba(212,177,106,0.28)]'}
              `}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.28em] text-[rgba(255,245,225,0.46)]">
                    Styling Mode
                  </p>
                  <h4 className="mt-4 font-serif text-4xl italic leading-none text-white">
                    {option.title}
                  </h4>
                </div>
                <span
                  className={`
                    rounded-full border px-3 py-1 text-[10px] uppercase tracking-[0.24em]
                    ${active
                      ? 'border-[rgba(212,177,106,0.45)] text-[rgba(255,245,225,0.88)]'
                      : 'border-[rgba(255,255,255,0.12)] text-[rgba(255,245,225,0.45)]'}
                  `}
                >
                  {active ? 'Selected' : 'Filter'}
                </span>
              </div>

              <p className="mt-5 text-sm leading-7 text-[var(--lux-muted-foreground)]">
                {option.subtitle}
              </p>

              <div className="mt-6 flex flex-wrap gap-2">
                {option.keywords.map((keyword) => (
                  <span
                    key={keyword}
                    className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-[10px] uppercase tracking-[0.18em] text-[rgba(255,245,225,0.54)]"
                  >
                    {keyword}
                  </span>
                ))}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
