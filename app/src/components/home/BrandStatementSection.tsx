export default function BrandStatementSection() {
  return (
    <section id="story" className="px-4 py-24 sm:px-6 lg:px-10">
      <div className="mx-auto grid max-w-7xl gap-8 border-t border-white/10 pt-12 lg:grid-cols-[0.8fr_1.2fr]">
        <p className="text-sm uppercase tracking-[0.22em] text-white/44">Brand Statement</p>
        <div>
          <h2 className="font-heading text-5xl italic leading-[0.9] tracking-[-0.04em] text-white sm:text-6xl">
            Every look deserves to be felt before it is chosen.
          </h2>
          <p className="mt-6 max-w-2xl text-base leading-7 text-white/68">
            我们把 AI 试衣从“快速换图”提升为“风格判断工具”。在点击购买、拍摄或出门之前，
            先确认轮廓是否成立，气质是否准确，搭配是否真的属于你。
          </p>
        </div>
      </div>
    </section>
  );
}
