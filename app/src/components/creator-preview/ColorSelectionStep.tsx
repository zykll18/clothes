import {
  OUTFIT_COLOR_SLOTS,
  type OutfitColorPlan,
  type OutfitColorSlot,
  type PrimaryColor,
} from '@/lib/creator-preview';

interface ColorSelectionStepProps {
  colorPlan: OutfitColorPlan;
  wantsHat: boolean | null;
  onSelectColor: (slot: OutfitColorSlot, color: PrimaryColor) => void;
  onSetWantsHat: (wantsHat: boolean) => void;
}

const COLOR_OPTIONS: Array<{
  value: PrimaryColor;
  label: string;
  swatch: string;
}> = [
  { value: 'black', label: 'Black', swatch: '#111111' },
  { value: 'white', label: 'White', swatch: '#f5f3eb' },
  { value: 'grey', label: 'Grey', swatch: '#6f7278' },
  { value: 'navy', label: 'Navy', swatch: '#1e2f56' },
  { value: 'brown', label: 'Brown', swatch: '#765239' },
  { value: 'green', label: 'Green', swatch: '#405840' },
  { value: 'red', label: 'Red', swatch: '#8b2a38' },
  { value: 'beige', label: 'Beige', swatch: '#b79a72' },
  { value: 'cream', label: 'Cream', swatch: '#e8dfcb' },
  { value: 'denim', label: 'Denim', swatch: '#3f5f82' },
  { value: 'pink', label: 'Pink', swatch: '#c37b8d' },
  { value: 'yellow', label: 'Yellow', swatch: '#d1ad42' },
  { value: 'orange', label: 'Orange', swatch: '#b86a32' },
  { value: 'purple', label: 'Purple', swatch: '#655077' },
  { value: 'silver', label: 'Silver', swatch: '#b7b9b5' },
];

const SLOT_COPY: Record<OutfitColorSlot, { label: string; helper: string }> = {
  innerwear: {
    label: '内搭',
    helper: '贴近脸和上半身的第一层。',
  },
  top: {
    label: '上衣',
    helper: '外露面积最大，决定上半身主视觉。',
  },
  pants: {
    label: '裤装',
    helper: '控制比例、重心和整体稳定感。',
  },
  shoes: {
    label: '鞋子',
    helper: '收住风格，不让下半身掉线。',
  },
  socks: {
    label: '袜子',
    helper: '小面积露出，用来接色或制造细节。',
  },
  hat: {
    label: '帽子',
    helper: '需要帽子时再选，避免造型过满。',
  },
};

const REQUIRED_COLOR_SLOTS = OUTFIT_COLOR_SLOTS.filter((slot) => slot !== 'hat');

export function ColorSelectionStep({
  colorPlan,
  wantsHat,
  onSelectColor,
  onSetWantsHat,
}: ColorSelectionStepProps) {
  const activeSlot =
    REQUIRED_COLOR_SLOTS.find((slot) => !colorPlan[slot]) ??
    (wantsHat === null ? 'hat' : wantsHat && !colorPlan.hat ? 'hat' : null);

  const visibleSlots = wantsHat === false
    ? REQUIRED_COLOR_SLOTS
    : OUTFIT_COLOR_SLOTS;

  return (
    <div className="space-y-8">
      <div className="max-w-3xl">
        <p className="lux-kicker text-[11px]">Color Plan</p>
        <h3 className="mt-3 font-serif text-3xl italic text-white sm:text-4xl">
          先把每个部位的颜色定下来。
        </h3>
        <p className="mt-4 text-sm leading-7 text-[var(--lux-muted-foreground)] sm:text-base">
          按内搭、上衣、裤装、鞋子、袜子逐个选色。帽子先决定需不需要，需要再选颜色。
        </p>
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,0.82fr)_minmax(18rem,0.48fr)]">
        <div className="space-y-3">
          {visibleSlots.map((slot) => {
            const selectedColor = colorPlan[slot];
            const meta = SLOT_COPY[slot];
            const active = activeSlot === slot;

            return (
              <section
                key={slot}
                className={`
                  rounded-[1.65rem] border px-5 py-4 transition duration-300
                  ${active
                    ? 'border-[rgba(212,177,106,0.48)] bg-[rgba(212,177,106,0.1)]'
                    : selectedColor
                      ? 'border-[rgba(255,255,255,0.12)] bg-[rgba(255,255,255,0.045)]'
                      : 'border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.025)]'}
                `}
              >
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.24em] text-[rgba(255,245,225,0.44)]">
                      {slot === 'hat' ? 'Optional' : 'Required'}
                    </p>
                    <h4 className="mt-2 font-serif text-3xl italic leading-none text-white">
                      {meta.label}
                    </h4>
                    <p className="mt-2 text-sm leading-6 text-[var(--lux-muted-foreground)]">
                      {meta.helper}
                    </p>
                  </div>

                  {selectedColor ? (
                    <div className="flex items-center gap-3">
                      <span
                        className="h-11 w-11 rounded-full border border-white/15 shadow-[inset_0_1px_0_rgba(255,255,255,0.18)]"
                        style={{ backgroundColor: COLOR_OPTIONS.find((option) => option.value === selectedColor)?.swatch }}
                      />
                      <span className="text-sm uppercase tracking-[0.16em] text-white/72">
                        {selectedColor}
                      </span>
                    </div>
                  ) : (
                    <span className="rounded-full border border-white/10 px-3 py-1 text-[10px] uppercase tracking-[0.22em] text-white/42">
                      Waiting
                    </span>
                  )}
                </div>
              </section>
            );
          })}
        </div>

        <aside className="rounded-[1.85rem] border border-white/10 bg-white/[0.035] p-5">
          {activeSlot === 'hat' && wantsHat === null ? (
            <div className="space-y-5">
              <div>
                <p className="lux-kicker text-[11px]">Hat</p>
                <h4 className="mt-3 font-serif text-3xl italic text-white">今天需要帽子吗？</h4>
              </div>
              <div className="grid gap-3">
                <button
                  type="button"
                  onClick={() => onSetWantsHat(true)}
                  className="rounded-full border border-[rgba(212,177,106,0.36)] bg-[rgba(212,177,106,0.12)] px-5 py-3 text-sm text-white transition hover:bg-[rgba(212,177,106,0.18)]"
                >
                  需要，继续选帽子颜色
                </button>
                <button
                  type="button"
                  onClick={() => onSetWantsHat(false)}
                  className="rounded-full border border-white/12 bg-white/[0.04] px-5 py-3 text-sm text-white/80 transition hover:bg-white/[0.08]"
                >
                  不需要帽子
                </button>
              </div>
            </div>
          ) : activeSlot ? (
            <div className="space-y-5">
              <div>
                <p className="lux-kicker text-[11px]">Palette</p>
                <h4 className="mt-3 font-serif text-3xl italic text-white">
                  选择{SLOT_COPY[activeSlot].label}颜色
                </h4>
              </div>
              <div className="grid grid-cols-5 gap-2">
                {COLOR_OPTIONS.map((option) => {
                  const selected = colorPlan[activeSlot] === option.value;

                  return (
                    <button
                      key={option.value}
                      type="button"
                      title={option.label}
                      onClick={() => onSelectColor(activeSlot, option.value)}
                      className={`
                        aspect-square rounded-full border transition duration-200 hover:scale-105
                        ${selected
                          ? 'border-[rgba(255,245,225,0.9)] shadow-[0_0_0_5px_rgba(212,177,106,0.18)]'
                          : 'border-white/14'}
                      `}
                      style={{ backgroundColor: option.swatch }}
                    >
                      <span className="sr-only">{option.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            <div>
              <p className="lux-kicker text-[11px]">Palette Complete</p>
              <h4 className="mt-3 font-serif text-3xl italic text-white">颜色已经定好。</h4>
              <p className="mt-4 text-sm leading-7 text-[var(--lux-muted-foreground)]">
                下一步选择风格，再根据这些颜色从衣橱里推衣服。
              </p>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
