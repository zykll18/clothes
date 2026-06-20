# Luxury Fashion Homepage Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the homepage as a luxury-fashion, narrative-first AI try-on landing page using the provided flower image as the shared visual motif.

**Architecture:** Keep the implementation isolated to the homepage by introducing a small `src/components/home` surface, adding global luxury visual tokens in `globals.css`, and composing the page from focused sections. Reuse the existing Next.js/Tailwind stack, avoid CDN prompt patterns, and keep all animation CSS-native for the first pass.

**Tech Stack:** Next.js App Router, React 19, TypeScript, Tailwind CSS v4, `next/font/google`, `next/image`, `lucide-react`

---

## File Map

- Create: `public/images/home/luxury-flower.jpg`
- Create: `src/components/home/HomeNavbar.tsx`
- Create: `src/components/home/HeroSection.tsx`
- Create: `src/components/home/BrandStatementSection.tsx`
- Create: `src/components/home/HowItWorksSection.tsx`
- Create: `src/components/home/CapabilityCardsSection.tsx`
- Create: `src/components/home/ClosingCtaSection.tsx`
- Modify: `src/app/layout.tsx`
- Modify: `src/app/globals.css`
- Modify: `src/app/page.tsx`

### Task 1: Move the hero asset into the app and wire in fashion typography

**Files:**
- Create: `public/images/home/luxury-flower.jpg`
- Modify: `src/app/layout.tsx`
- Test: `src/app/layout.tsx`

- [ ] **Step 1: Copy the approved flower image into a stable public path**

Run:

```bash
mkdir -p public/images/home
cp /Users/zyk/Downloads/ecf24cc428054fed8389e0b78397c38a.jpg public/images/home/luxury-flower.jpg
```

Expected:

```text
public/images/home/luxury-flower.jpg now exists and can be requested at /images/home/luxury-flower.jpg
```

- [ ] **Step 2: Update the root layout to expose a serif display font for homepage storytelling**

Replace `src/app/layout.tsx` with:

```tsx
import type { Metadata } from "next";
import { Cormorant_Garamond, Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["italic"],
});

export const metadata: Metadata = {
  title: "Aura | AI 试衣叙事体验",
  description: "以高级时装视觉语言重构的 AI 试衣与穿搭预览体验首页。",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${cormorant.variable} bg-[#050505] antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
```

- [ ] **Step 3: Verify the layout file is lint-clean**

Run:

```bash
npx eslint src/app/layout.tsx
```

Expected:

```text
no output
```

- [ ] **Step 4: Commit the asset and font groundwork**

Run:

```bash
git add public/images/home/luxury-flower.jpg src/app/layout.tsx
git commit -m "feat: add luxury homepage asset and typography foundation"
```

### Task 2: Add the luxury visual tokens and shared glass utilities

**Files:**
- Modify: `src/app/globals.css`
- Test: `src/app/globals.css`

- [ ] **Step 1: Replace the generic global theme with homepage-ready luxury tokens**

Update `src/app/globals.css` to:

```css
@import "tailwindcss";

:root {
  --background: #050505;
  --foreground: #f5f2ed;
  --muted-foreground: rgba(245, 242, 237, 0.68);
  --line: rgba(255, 255, 255, 0.12);
  --line-strong: rgba(255, 255, 255, 0.24);
  --surface: rgba(255, 255, 255, 0.05);
  --surface-strong: rgba(255, 255, 255, 0.11);
  --shadow-bloom: 0 0 120px rgba(255, 255, 255, 0.08);
}

@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --font-sans: var(--font-geist-sans);
  --font-mono: var(--font-geist-mono);
  --font-heading: var(--font-cormorant);
}

html {
  background: var(--background);
}

body {
  min-height: 100dvh;
  color: var(--foreground);
  background:
    radial-gradient(circle at top center, rgba(255, 255, 255, 0.08), transparent 28%),
    linear-gradient(180deg, #050505 0%, #080808 45%, #050505 100%);
  font-family: var(--font-geist-sans), sans-serif;
}

::selection {
  background: rgba(255, 255, 255, 0.18);
  color: #fff;
}

@layer utilities {
  .font-heading {
    font-family: var(--font-cormorant), serif;
  }

  .lux-surface {
    background: rgba(255, 255, 255, 0.04);
    border: 1px solid var(--line);
    box-shadow:
      inset 0 1px 0 rgba(255, 255, 255, 0.14),
      0 16px 60px rgba(0, 0, 0, 0.28);
    backdrop-filter: blur(18px);
    -webkit-backdrop-filter: blur(18px);
  }

  .lux-surface-strong {
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid var(--line-strong);
    box-shadow:
      inset 0 1px 0 rgba(255, 255, 255, 0.22),
      0 18px 80px rgba(0, 0, 0, 0.34);
    backdrop-filter: blur(28px);
    -webkit-backdrop-filter: blur(28px);
  }

  .lux-outline {
    position: relative;
    overflow: hidden;
  }

  .lux-outline::before {
    content: "";
    position: absolute;
    inset: 0;
    border-radius: inherit;
    padding: 1px;
    background: linear-gradient(
      180deg,
      rgba(255, 255, 255, 0.44) 0%,
      rgba(255, 255, 255, 0.1) 24%,
      rgba(255, 255, 255, 0) 55%,
      rgba(255, 255, 255, 0.2) 100%
    );
    -webkit-mask:
      linear-gradient(#fff 0 0) content-box,
      linear-gradient(#fff 0 0);
    -webkit-mask-composite: xor;
    mask-composite: exclude;
    pointer-events: none;
  }

  .lux-bloom {
    box-shadow: var(--shadow-bloom);
  }

  .text-muted-lux {
    color: var(--muted-foreground);
  }

  .animate-fade-up-blur {
    animation: fade-up-blur 0.85s cubic-bezier(0.22, 1, 0.36, 1) both;
  }

  .animate-glow-drift {
    animation: glow-drift 9s ease-in-out infinite;
  }

  @keyframes fade-up-blur {
    from {
      opacity: 0;
      transform: translateY(24px);
      filter: blur(14px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
      filter: blur(0);
    }
  }

  @keyframes glow-drift {
    0%, 100% {
      transform: translate3d(0, 0, 0) scale(1);
      opacity: 0.55;
    }
    50% {
      transform: translate3d(0, -14px, 0) scale(1.04);
      opacity: 0.85;
    }
  }
}
```

- [ ] **Step 2: Verify the project still lints after the global stylesheet change**

Run:

```bash
npm run lint
```

Expected:

```text
no errors
```

- [ ] **Step 3: Commit the shared visual system**

Run:

```bash
git add src/app/globals.css
git commit -m "feat: add luxury homepage visual tokens"
```

### Task 3: Build the floating navigation and hero section

**Files:**
- Create: `src/components/home/HomeNavbar.tsx`
- Create: `src/components/home/HeroSection.tsx`
- Test: `src/components/home/HomeNavbar.tsx`
- Test: `src/components/home/HeroSection.tsx`

- [ ] **Step 1: Create the homepage-only floating navbar**

Create `src/components/home/HomeNavbar.tsx` with:

```tsx
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

const navItems = [
  { href: "#story", label: "故事" },
  { href: "#process", label: "体验" },
  { href: "#capabilities", label: "能力" },
  { href: "/auth/login", label: "登录" },
];

export default function HomeNavbar() {
  return (
    <header className="fixed inset-x-0 top-4 z-50 px-4 sm:px-6 lg:px-10">
      <div className="mx-auto flex max-w-7xl items-center justify-between">
        <Link
          href="/"
          className="lux-surface lux-outline flex h-12 w-12 items-center justify-center rounded-full text-xl text-white"
        >
          <span className="font-heading italic leading-none">a</span>
        </Link>

        <nav className="lux-surface lux-outline hidden items-center gap-1 rounded-full px-2 py-2 md:flex">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-full px-4 py-2 text-sm text-white/88 transition hover:bg-white/8 hover:text-white"
            >
              {item.label}
            </Link>
          ))}
          <Link
            href="/auth/register"
            className="ml-1 inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-medium text-black transition hover:bg-white/90"
          >
            开始试穿
            <ArrowUpRight className="h-4 w-4" />
          </Link>
        </nav>

        <div className="h-12 w-12 md:hidden" />
      </div>
    </header>
  );
}
```

- [ ] **Step 2: Create the hero section with the flower image as the primary sculpture**

Create `src/components/home/HeroSection.tsx` with:

```tsx
import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, Play } from "lucide-react";

export default function HeroSection() {
  return (
    <section className="relative flex min-h-[100dvh] items-center overflow-hidden px-4 pb-12 pt-28 sm:px-6 lg:px-10">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-[8%] top-[16%] h-56 w-56 rounded-full bg-white/8 blur-[140px] animate-glow-drift" />
        <div className="absolute right-[14%] top-[10%] h-72 w-72 rounded-full bg-white/10 blur-[180px] animate-glow-drift" />
        <div className="absolute inset-y-0 right-0 w-1/2 bg-gradient-to-l from-transparent via-black/12 to-black/72" />
      </div>

      <div className="relative mx-auto grid min-h-[80dvh] w-full max-w-7xl items-center gap-10 lg:grid-cols-[minmax(0,0.92fr)_minmax(420px,0.88fr)]">
        <div className="max-w-2xl animate-fade-up-blur">
          <div className="lux-surface lux-outline mb-6 inline-flex rounded-full px-3 py-2 text-xs uppercase tracking-[0.24em] text-white/82">
            Narrative AI Try-On
          </div>
          <h1 className="font-heading text-6xl italic leading-[0.82] tracking-[-0.04em] text-white sm:text-7xl lg:text-[5.7rem]">
            Dress the story before you wear the look.
          </h1>
          <p className="mt-5 max-w-xl text-base leading-7 text-white/74 sm:text-lg">
            用更接近高级时装 campaign 的方式体验 AI 试衣。上传人物，选择服装，
            在真正决定之前先看见轮廓、气质与风格的完成态。
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <Link
              href="/auth/register"
              className="lux-surface-strong lux-outline inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-medium text-white transition hover:-translate-y-0.5 hover:bg-white/14"
            >
              开始试穿
              <ArrowUpRight className="h-4 w-4" />
            </Link>
            <Link
              href="/preview"
              className="inline-flex items-center gap-2 text-sm text-white/80 transition hover:text-white"
            >
              <Play className="h-4 w-4 fill-current" />
              查看效果
            </Link>
          </div>
          <div className="mt-10 grid max-w-lg gap-4 sm:grid-cols-2">
            <div className="lux-surface lux-outline rounded-[1.4rem] p-5">
              <p className="font-heading text-4xl italic leading-none text-white">3 Steps</p>
              <p className="mt-2 text-sm text-white/64">上传人物、挑选服装、生成试穿画面。</p>
            </div>
            <div className="lux-surface lux-outline rounded-[1.4rem] p-5">
              <p className="font-heading text-4xl italic leading-none text-white">Luxury Fit</p>
              <p className="mt-2 text-sm text-white/64">不是普通换装工具，而是更接近成片质感的预览体验。</p>
            </div>
          </div>
        </div>

        <div className="relative flex min-h-[520px] items-center justify-center lg:justify-end">
          <div className="lux-bloom absolute right-[12%] top-[10%] h-60 w-60 rounded-full bg-white/6 blur-[140px]" />
          <div className="absolute inset-y-[10%] right-0 w-[88%] rounded-[2.2rem] border border-white/8 bg-gradient-to-b from-white/[0.03] to-transparent" />
          <Image
            src="/images/home/luxury-flower.jpg"
            alt="银白发光花朵主视觉"
            width={900}
            height={1400}
            priority
            className="relative z-10 h-[78dvh] w-auto max-w-[520px] object-contain object-right"
          />
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 3: Verify the new hero files are lint-clean**

Run:

```bash
npx eslint src/components/home/HomeNavbar.tsx src/components/home/HeroSection.tsx
```

Expected:

```text
no output
```

- [ ] **Step 4: Commit the homepage shell**

Run:

```bash
git add src/components/home/HomeNavbar.tsx src/components/home/HeroSection.tsx
git commit -m "feat: add luxury homepage navbar and hero"
```

### Task 4: Build the narrative sections below the fold

**Files:**
- Create: `src/components/home/BrandStatementSection.tsx`
- Create: `src/components/home/HowItWorksSection.tsx`
- Create: `src/components/home/CapabilityCardsSection.tsx`
- Create: `src/components/home/ClosingCtaSection.tsx`
- Test: `src/components/home/BrandStatementSection.tsx`
- Test: `src/components/home/HowItWorksSection.tsx`
- Test: `src/components/home/CapabilityCardsSection.tsx`
- Test: `src/components/home/ClosingCtaSection.tsx`

- [ ] **Step 1: Add the short brand statement section that bridges beauty and product meaning**

Create `src/components/home/BrandStatementSection.tsx` with:

```tsx
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
```

- [ ] **Step 2: Add the three-step editorial process section**

Create `src/components/home/HowItWorksSection.tsx` with:

```tsx
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
```

- [ ] **Step 3: Add the capability cards using the same glass language**

Create `src/components/home/CapabilityCardsSection.tsx` with:

```tsx
import { Layers3, ScanFace, Sparkles } from "lucide-react";

const cards = [
  {
    title: "真实轮廓",
    body: "更准确地判断服装如何贴合人物线条，而不是只看一张被滤镜撑起来的成片。",
    icon: ScanFace,
    tags: ["Silhouette", "Proportion", "Presence"],
  },
  {
    title: "快速换装",
    body: "同一张人物底稿上迅速比较多组服装方向，把犹豫留在生成前，而不是下单后。",
    icon: Layers3,
    tags: ["Fast Switch", "Compare", "Edit Flow"],
  },
  {
    title: "风格比较",
    body: "把不同气质的搭配放进同一叙事背景里衡量，找到最接近你想表达的那一套。",
    icon: Sparkles,
    tags: ["Mood", "Styling", "Narrative"],
  },
];

export default function CapabilityCardsSection() {
  return (
    <section id="capabilities" className="px-4 py-24 sm:px-6 lg:px-10">
      <div className="mx-auto max-w-7xl">
        <p className="text-sm uppercase tracking-[0.22em] text-white/44">Capabilities</p>
        <div className="mt-10 grid gap-6 lg:grid-cols-3">
          {cards.map((card) => {
            const Icon = card.icon;

            return (
              <article
                key={card.title}
                className="lux-surface lux-outline flex min-h-[320px] flex-col rounded-[1.8rem] p-7"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="lux-surface rounded-[1rem] p-3">
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                  <div className="flex max-w-[70%] flex-wrap justify-end gap-2">
                    {card.tags.map((tag) => (
                      <span
                        key={tag}
                        className="lux-surface rounded-full px-3 py-1 text-[11px] text-white/76"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="mt-auto pt-16">
                  <h3 className="font-heading text-4xl italic leading-none text-white">
                    {card.title}
                  </h3>
                  <p className="mt-4 max-w-[30ch] text-sm leading-7 text-white/66">
                    {card.body}
                  </p>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 4: Add the closing conversion block**

Create `src/components/home/ClosingCtaSection.tsx` with:

```tsx
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

export default function ClosingCtaSection() {
  return (
    <section className="px-4 pb-24 pt-10 sm:px-6 lg:px-10">
      <div className="mx-auto max-w-7xl rounded-[2rem] border border-white/10 bg-white/[0.03] px-6 py-14 text-center shadow-[0_24px_120px_rgba(0,0,0,0.28)] sm:px-10">
        <p className="text-sm uppercase tracking-[0.22em] text-white/44">Ready</p>
        <h2 className="mt-4 font-heading text-5xl italic leading-[0.88] tracking-[-0.04em] text-white sm:text-6xl">
          Try the look before the look chooses you.
        </h2>
        <p className="mx-auto mt-5 max-w-2xl text-sm leading-7 text-white/64 sm:text-base">
          现在开始，把灵感、人物与服装放进同一张画面里，先看见，再决定。
        </p>
        <Link
          href="/auth/register"
          className="lux-surface-strong lux-outline mx-auto mt-8 inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-medium text-white transition hover:-translate-y-0.5 hover:bg-white/14"
        >
          创建账户
          <ArrowUpRight className="h-4 w-4" />
        </Link>
      </div>
    </section>
  );
}
```

- [ ] **Step 5: Verify the narrative sections are lint-clean**

Run:

```bash
npx eslint src/components/home/BrandStatementSection.tsx src/components/home/HowItWorksSection.tsx src/components/home/CapabilityCardsSection.tsx src/components/home/ClosingCtaSection.tsx
```

Expected:

```text
no output
```

- [ ] **Step 6: Commit the below-the-fold narrative sections**

Run:

```bash
git add src/components/home/BrandStatementSection.tsx src/components/home/HowItWorksSection.tsx src/components/home/CapabilityCardsSection.tsx src/components/home/ClosingCtaSection.tsx
git commit -m "feat: add luxury homepage narrative sections"
```

### Task 5: Assemble the homepage, remove the prototype layout, and verify the final experience

**Files:**
- Modify: `src/app/page.tsx`
- Test: `src/app/page.tsx`

- [ ] **Step 1: Replace the prototype homepage with the new composed landing page**

Replace `src/app/page.tsx` with:

```tsx
import BrandStatementSection from "@/components/home/BrandStatementSection";
import CapabilityCardsSection from "@/components/home/CapabilityCardsSection";
import ClosingCtaSection from "@/components/home/ClosingCtaSection";
import HeroSection from "@/components/home/HeroSection";
import HomeNavbar from "@/components/home/HomeNavbar";
import HowItWorksSection from "@/components/home/HowItWorksSection";

export default function Home() {
  return (
    <main className="relative overflow-x-hidden bg-[#050505] text-white">
      <HomeNavbar />
      <HeroSection />
      <BrandStatementSection />
      <HowItWorksSection />
      <CapabilityCardsSection />
      <ClosingCtaSection />
    </main>
  );
}
```

- [ ] **Step 2: Run the full lint suite**

Run:

```bash
npm run lint
```

Expected:

```text
no errors
```

- [ ] **Step 3: Run the app locally and verify the desktop/mobile composition**

Run:

```bash
npm run dev
```

Expected:

```text
ready - started server on http://localhost:3000
```

Then verify in the browser:

```text
1. Desktop: hero reads left-to-right, flower remains right-weighted, CTA is visible above the fold.
2. Mobile: flower head remains visible, CTA stack wraps cleanly, navbar does not cover headline.
3. The blue gradient prototype UI is fully gone from the homepage.
4. All primary links work: /auth/register, /auth/login, /preview.
```

- [ ] **Step 4: Commit the final homepage assembly**

Run:

```bash
git add src/app/page.tsx
git commit -m "feat: launch luxury fashion ai try-on homepage"
```

## Self-Review

### Spec coverage

- Hero, brand statement, process, capability cards, and closing CTA each map directly to the 5 required homepage sections.
- The flower image is used exactly once as a complete hero visual, with later sections relying on derived glass, glow, and editorial language instead of repeated full-image reuse.
- The plan keeps the scope limited to the homepage, matching the spec non-goals.
- The plan intentionally avoids the CDN-only cinematic prompt implementation and stays within the existing Next.js stack.

### Placeholder scan

- No `TODO`, `TBD`, or “add appropriate handling” placeholders remain.
- Every file path, command, and code step is explicit.

### Type consistency

- All imports match files created earlier in the plan.
- The asset path `/images/home/luxury-flower.jpg` is defined in Task 1 and used in Task 3.
- The final page composition in Task 5 references only components introduced in Tasks 3 and 4.
