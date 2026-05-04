const steps = [
  {
    index: "01",
    title: "上传人物",
    body: "从一张干净人物照开始，让轮廓、姿态与比例成为后续试穿的底稿。",
  },
  {
    index: "02",
    title: "选择服装",
    body: "把单件、套装或不同风格方向放进同一叙事框架里比较，而不是孤立地看图。",
  },
  {
    index: "03",
    title: "生成试穿",
    body: "在真正下决定之前看见材质、风格与人物气质如何合在一起。",
  },
];

export default function HowItWorksSection() {
  return (
    <section id="process" className="px-4 py-24 sm:px-6 lg:px-10">
      <div className="mx-auto max-w-7xl">
        <p className="text-sm uppercase tracking-[0.22em] text-white/44">How it works</p>
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {steps.map((step) => (
            <article
              key={step.index}
              className="lux-surface lux-outline rounded-[1.8rem] p-8"
            >
              <p className="font-heading text-3xl italic text-white/92">{step.index}</p>
              <h3 className="mt-12 font-heading text-4xl italic leading-none text-white">
                {step.title}
              </h3>
              <p className="mt-4 max-w-[28ch] text-sm leading-7 text-white/66">
                {step.body}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
