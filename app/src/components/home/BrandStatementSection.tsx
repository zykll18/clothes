export default function BrandStatementSection() {
  return (
    <section id="story" className="px-4 py-24 sm:px-6 lg:px-10">
      <div className="mx-auto grid max-w-7xl gap-8 border-t border-white/10 pt-12 lg:grid-cols-[0.8fr_1.2fr]">
        <p className="text-sm uppercase tracking-[0.22em] text-white/44">Creator Preview</p>
        <div>
          <h2 className="font-heading text-5xl italic leading-[0.9] tracking-[-0.04em] text-white sm:text-6xl">
            One look. Three directions. One version worth posting.
          </h2>
          <p className="mt-6 max-w-2xl text-base leading-7 text-white/68">
            我们把 AI 试衣从“搭配像不像”改成“内容值不值得发”。在真正拍摄前，
            先用同一套 look 预演街头、老钱、clean fit 等不同方向，筛掉不出片的版本，
            留下这次该主推的那一张。
          </p>
        </div>
      </div>
    </section>
  );
}
