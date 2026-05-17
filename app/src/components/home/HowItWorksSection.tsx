const steps = [
  {
    index: "01",
    title: "上传人物",
    body: "用一张清晰正面照锁定人物轮廓，为同一套 look 的所有方向提供共同底稿。",
  },
  {
    index: "02",
    title: "选主色与搭 look",
    body: "先定今天想穿的主色，再从个人素材和系统单品里按部位组合这次要预演的 look。",
  },
  {
    index: "03",
    title: "比较三版预演",
    body: "系统返回 3 个内容方向结果，选出本次主推版本后再保存、下载并进入拍摄判断。",
  },
];

export default function HowItWorksSection() {
  return (
    <section id="process" className="px-4 py-24 sm:px-6 lg:px-10">
      <div className="mx-auto max-w-7xl">
        <p className="text-sm uppercase tracking-[0.22em] text-white/44">Creator flow</p>
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
