const steps = [
  {
    index: "01",
    title: "建立衣橱",
    body: "上传本人照片和常穿衣服，给每件衣服标好类别、颜色和风格，让后面的推荐有依据。",
  },
  {
    index: "02",
    title: "选择配色与风格",
    body: "先定今天的主色，再选择街头、clean fit、老钱或复古等风格，缩小可选衣服范围。",
  },
  {
    index: "03",
    title: "换装并生成",
    body: "按外套、内搭、下装、鞋子和配饰选择一整套，最后生成搭配在本人身上的预览。",
  },
];

export default function HowItWorksSection() {
  return (
    <section id="process" className="px-4 py-24 sm:px-6 lg:px-10">
      <div className="mx-auto max-w-7xl">
        <p className="text-sm uppercase tracking-[0.22em] text-white/44">Styling flow</p>
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {steps.map((step) => (
            <article
              key={step.index}
              className="group/card lux-hover-shell relative rounded-[1.8rem] outline-none"
            >
              <div className="lux-refraction-aura" />
              <div className="lux-surface lux-outline relative min-h-[18rem] overflow-hidden rounded-[1.8rem] p-8 transition duration-500 group-hover/card:-translate-y-0.5 group-hover/card:bg-white/[0.055]">
                <div className="lux-refractive-edge" />
                <p className="font-heading text-3xl italic text-white/92">{step.index}</p>
                <h3
                  className="lux-refraction-title mt-16 font-heading text-4xl italic leading-none text-white"
                  data-refract={step.title}
                >
                  {step.title}
                </h3>
                <p className="max-h-0 translate-y-2 overflow-hidden text-sm leading-7 text-white/68 opacity-0 transition-all duration-500 group-hover/card:mt-4 group-hover/card:max-h-28 group-hover/card:translate-y-0 group-hover/card:opacity-100">
                  {step.body}
                </p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
