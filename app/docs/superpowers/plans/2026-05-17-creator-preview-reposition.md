# Creator Preview Reposition Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reposition the product from a generic AI try-on app into a creator-focused content preview tool that helps fashion creators decide which of three content directions to publish.

**Architecture:** Reuse authentication, wardrobe CRUD, `/tryon`, `/profile`, and the existing AI try-on endpoint as the first-version render engine. Replace the old “upload one garment and try it on” flow with a creator workflow: upload person image, choose today's primary color, browse a mixed pool of user wardrobe items plus system presets, choose items slot-by-slot, generate one base render from the currently selected source image, then derive three creator-facing direction cards from that render and persist the saved session plus its three variants. The per-slot selections are still saved as creator context even though v1 rendering is not yet a full multi-garment compositor.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript 5, Prisma 6, SQLite, DashScope, Tailwind CSS 4, ESLint 9

---

## File Structure Map

- `app/prisma/schema.prisma`
  Responsibility: persist creator preview sessions and their three saved direction variants.
- `app/src/lib/creator-preview.ts`
  Responsibility: shared creator-preview types, slot/direction constants, default labels, and payload guards.
- `app/src/app/api/creator-preview/history/route.ts`
- `app/src/app/api/creator-preview/history/[id]/route.ts`
  Responsibility: save/list/delete creator preview sessions for the profile page.
- `app/src/components/creator-preview/ColorSelectionStep.tsx`
  Responsibility: “today's primary color” selector step.
- `app/src/components/creator-preview/RecommendationPoolStep.tsx`
  Responsibility: mixed recommendation pool from user wardrobe items and system preset items.
- `app/src/components/creator-preview/LookSlotCarouselStep.tsx`
  Responsibility: slot-by-slot carousel selection for outerwear, innerwear, pants, accessory, and shoes.
- `app/src/components/creator-preview/PreviewVariantGrid.tsx`
  Responsibility: render and select among the three creator-preview direction cards.
- `app/src/components/creator-preview/systemItems.ts`
  Responsibility: first-version system preset items shown alongside user wardrobe content.
- `app/src/app/tryon/page.tsx`
  Responsibility: auth gate, creator-preview state machine, AI generation orchestration, and save flow wiring.
- `app/src/components/tryon/StepIndicator.tsx`
- `app/src/components/tryon/UploadArea.tsx`
  Responsibility: reused shell components with creator-preview copy and step semantics.
- `app/src/app/profile/page.tsx`
  Responsibility: reshape history UI from “试衣历史” to “内容预演历史”.
- `app/src/app/page.tsx`
- `app/src/components/home/HeroSection.tsx`
- `app/src/components/home/BrandStatementSection.tsx`
- `app/src/components/home/CapabilityCardsSection.tsx`
- `app/src/components/home/HowItWorksSection.tsx`
- `app/src/components/home/ClosingCtaSection.tsx`
  Responsibility: homepage repositioning copy and CTA direction for creator preview instead of generic try-on.

## Constraints For This Plan

- Keep route entrypoint `/tryon`; do not introduce a second primary creation flow.
- First version is for fashion creators deciding “which version to post”, not for consumers deciding “which item to buy”.
- Do not implement e-commerce checkout, size prediction, brand collaboration backend, automated caption generation, or real 3D.
- Reuse wardrobe CRUD where possible; change product semantics to “素材库” / “look 素材”.
- First-version “3 个方向结果” may share one AI base render and differentiate via creator-direction framing metadata, labels, and saved selection state. Do not promise three fully independent render pipelines in this pass.
- Verification for this work uses `lint`, `tsc`, and explicit manual flow checks.

### Task 1: Add Creator Preview Persistence And Shared Semantics

**Files:**
- Modify: `app/prisma/schema.prisma`
- Create: `app/src/lib/creator-preview.ts`

- [ ] **Step 1: Inspect the existing try-on history model and confirm it cannot represent one preview session with three direction variants**

Run:

```bash
cd /Users/zyk/Desktop/clothes/app
rg -n "model TryOnHistory|resultImageUrl|tryOnMode" prisma/schema.prisma src/app/api src/app/profile/page.tsx
```

Expected: matches show the current history model only stores one result image, which is insufficient for one creator-preview session containing three comparable direction cards plus a selected primary version.

- [ ] **Step 2: Add normalized creator-preview models to Prisma**

Add these models below `TryOnHistory`:

```prisma
model CreatorPreviewSession {
  id                  String                  @id @default(cuid())
  userId              String
  personImageUrl      String
  sourceImageUrl      String
  primaryColor        String
  directionTags       Json
  selectedOuterwearId String?
  selectedInnerwearId String?
  selectedPantsId     String?
  selectedAccessoryId String?
  selectedShoesId     String?
  selectedDirection   String
  createdAt           DateTime                @default(now())
  updatedAt           DateTime                @updatedAt

  user                User                    @relation(fields: [userId], references: [id], onDelete: Cascade)
  variants            CreatorPreviewVariant[]
}

model CreatorPreviewVariant {
  id               String                @id @default(cuid())
  sessionId        String
  direction        String
  sortOrder        Int
  resultUrl        String
  presentationTone String
  selected         Boolean               @default(false)
  createdAt        DateTime              @default(now())
  updatedAt        DateTime              @updatedAt

  session          CreatorPreviewSession @relation(fields: [sessionId], references: [id], onDelete: Cascade)
}
```

Also add the reverse relation on `User`:

```prisma
creatorPreviewSessions CreatorPreviewSession[]
```

- [ ] **Step 3: Create shared creator-preview semantics**

Create `app/src/lib/creator-preview.ts` with:

```ts
export const CREATOR_DIRECTIONS = ['old_money', 'street', 'clean_fit'] as const;
export type CreatorDirection = typeof CREATOR_DIRECTIONS[number];

export const LOOK_SLOTS = ['outerwear', 'innerwear', 'pants', 'accessory', 'shoes'] as const;
export type LookSlot = typeof LOOK_SLOTS[number];

export const PRIMARY_COLORS = ['black', 'white', 'grey', 'navy', 'brown', 'green', 'red'] as const;
export type PrimaryColor = typeof PRIMARY_COLORS[number];

export const DIRECTION_LABELS: Record<CreatorDirection, string> = {
  old_money: 'Old Money',
  street: 'Street',
  clean_fit: 'Clean Fit',
};

export const DIRECTION_TONES: Record<CreatorDirection, string> = {
  old_money: 'editorial-warm',
  street: 'contrast-grit',
  clean_fit: 'soft-clean',
};

export interface CreatorPreviewVariantInput {
  direction: CreatorDirection;
  sortOrder: number;
  resultUrl: string;
  presentationTone: string;
}

export interface CreatorPreviewSavePayload {
  personImageUrl: string;
  sourceImageUrl: string;
  primaryColor: PrimaryColor;
  directionTags: CreatorDirection[];
  selectedDirection: CreatorDirection;
  slotSelections: Partial<Record<LookSlot, string>>;
  variants: CreatorPreviewVariantInput[];
}
```

Include narrow guards such as `isCreatorDirection`, `isPrimaryColor`, and `isCreatorPreviewSavePayload`.

- [ ] **Step 4: Push the updated Prisma schema locally**

Run:

```bash
cd /Users/zyk/Desktop/clothes/app
npm run db:push
```

Expected: Prisma updates the local SQLite schema successfully with the new creator-preview tables.

- [ ] **Step 5: Run static verification for the new schema/types layer**

Run:

```bash
cd /Users/zyk/Desktop/clothes/app
npx prisma validate
npx tsc --noEmit --pretty false
```

Expected:
- `npx prisma validate` exits `0`
- `npx tsc --noEmit --pretty false` exits `0`

- [ ] **Step 6: Commit**

```bash
cd /Users/zyk/Desktop/clothes
git add app/prisma/schema.prisma app/src/lib/creator-preview.ts
git commit -m "feat: add creator preview session models"
```

### Task 2: Add Creator Preview History APIs

**Files:**
- Create: `app/src/app/api/creator-preview/history/route.ts`
- Create: `app/src/app/api/creator-preview/history/[id]/route.ts`
- Modify: `app/src/lib/creator-preview.ts`

- [ ] **Step 1: Confirm there is no existing creator-preview API surface**

Run:

```bash
cd /Users/zyk/Desktop/clothes/app
find src/app/api -maxdepth 4 -type f | sort | rg "creator-preview/history"
```

Expected: no matches.

- [ ] **Step 2: Add list/save/delete route behavior**

Create `app/src/app/api/creator-preview/history/route.ts` with this shape:

```ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/api-auth';
import { isCreatorPreviewSavePayload, DIRECTION_TONES } from '@/lib/creator-preview';

export async function POST(request: NextRequest) {
  const auth = requireAuth(request);
  if (!auth.ok) return auth.response;

  const rawBody: unknown = await request.json();
  if (!isCreatorPreviewSavePayload(rawBody)) {
    return NextResponse.json({ error: '内容预演保存请求无效' }, { status: 400 });
  }

  const session = await prisma.creatorPreviewSession.create({
    data: {
      userId: auth.payload.userId,
      personImageUrl: rawBody.personImageUrl,
      sourceImageUrl: rawBody.sourceImageUrl,
      primaryColor: rawBody.primaryColor,
      directionTags: rawBody.directionTags,
      selectedOuterwearId: rawBody.slotSelections.outerwear ?? null,
      selectedInnerwearId: rawBody.slotSelections.innerwear ?? null,
      selectedPantsId: rawBody.slotSelections.pants ?? null,
      selectedAccessoryId: rawBody.slotSelections.accessory ?? null,
      selectedShoesId: rawBody.slotSelections.shoes ?? null,
      selectedDirection: rawBody.selectedDirection,
      variants: {
        create: rawBody.variants.map((variant) => ({
          direction: variant.direction,
          sortOrder: variant.sortOrder,
          resultUrl: variant.resultUrl,
          presentationTone: variant.presentationTone || DIRECTION_TONES[variant.direction],
          selected: variant.direction === rawBody.selectedDirection,
        })),
      },
    },
    include: {
      variants: { orderBy: { sortOrder: 'asc' } },
    },
  });

  return NextResponse.json({ success: true, session });
}

export async function GET(request: NextRequest) {
  const auth = requireAuth(request);
  if (!auth.ok) return auth.response;

  const limit = Math.min(Number(new URL(request.url).searchParams.get('limit') || '12'), 24);

  const sessions = await prisma.creatorPreviewSession.findMany({
    where: { userId: auth.payload.userId },
    include: {
      variants: { orderBy: { sortOrder: 'asc' } },
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
  });

  return NextResponse.json({ success: true, sessions });
}
```

- [ ] **Step 3: Add delete route for saved preview history**

Create `app/src/app/api/creator-preview/history/[id]/route.ts` with:

```ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/api-auth';

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = requireAuth(request);
  if (!auth.ok) return auth.response;

  const { id } = await params;

  const session = await prisma.creatorPreviewSession.findFirst({
    where: { id, userId: auth.payload.userId },
  });

  if (!session) {
    return NextResponse.json({ error: '内容预演不存在' }, { status: 404 });
  }

  await prisma.creatorPreviewSession.delete({
    where: { id: session.id },
  });

  return NextResponse.json({ success: true });
}
```

- [ ] **Step 4: Run static verification for the new routes**

Run:

```bash
cd /Users/zyk/Desktop/clothes/app
npm run lint -- src/app/api/creator-preview/history/route.ts 'src/app/api/creator-preview/history/[id]/route.ts' src/lib/creator-preview.ts
npx tsc --noEmit --pretty false
```

Expected:
- `lint` exits `0`
- `tsc` exits `0`

- [ ] **Step 5: Commit**

```bash
cd /Users/zyk/Desktop/clothes
git add app/src/app/api/creator-preview/history app/src/lib/creator-preview.ts
git commit -m "feat: add creator preview history routes"
```

### Task 3: Rebuild `/tryon` Into The Creator Preview Flow

**Files:**
- Create: `app/src/components/creator-preview/ColorSelectionStep.tsx`
- Create: `app/src/components/creator-preview/RecommendationPoolStep.tsx`
- Create: `app/src/components/creator-preview/LookSlotCarouselStep.tsx`
- Create: `app/src/components/creator-preview/PreviewVariantGrid.tsx`
- Create: `app/src/components/creator-preview/systemItems.ts`
- Modify: `app/src/app/tryon/page.tsx`
- Modify: `app/src/components/tryon/StepIndicator.tsx`
- Modify: `app/src/components/tryon/UploadArea.tsx`

- [ ] **Step 1: Confirm the current page still reflects generic try-on semantics**

Run:

```bash
cd /Users/zyk/Desktop/clothes/app
rg -n "Wardrobe Casting|Silhouette Direction|重新试穿|试衣|Scene 02 / Wardrobe Casting" src/app/tryon/page.tsx src/components/tryon/UploadArea.tsx src/components/tryon/StepIndicator.tsx
```

Expected: multiple matches showing old generic try-on copy and the old four-step semantics.

- [ ] **Step 2: Add creator-preview system preset items**

Create `app/src/components/creator-preview/systemItems.ts`:

```ts
import type { LookSlot, PrimaryColor } from '@/lib/creator-preview';

export interface SystemPreviewItem {
  id: string;
  slot: LookSlot;
  name: string;
  imageUrl: string;
  colorTag: PrimaryColor;
  source: 'system';
}

export const SYSTEM_PREVIEW_ITEMS: SystemPreviewItem[] = [
  { id: 'sys-outer-black-blazer', slot: 'outerwear', name: 'Black Blazer', imageUrl: '/images/presets/outer-black-blazer.jpg', colorTag: 'black', source: 'system' },
  { id: 'sys-inner-white-tee', slot: 'innerwear', name: 'White Tee', imageUrl: '/images/presets/inner-white-tee.jpg', colorTag: 'white', source: 'system' },
  { id: 'sys-pants-indigo-denim', slot: 'pants', name: 'Indigo Denim', imageUrl: '/images/presets/pants-indigo-denim.jpg', colorTag: 'navy', source: 'system' },
  { id: 'sys-accessory-silver-chain', slot: 'accessory', name: 'Silver Chain', imageUrl: '/images/presets/accessory-silver-chain.jpg', colorTag: 'grey', source: 'system' },
  { id: 'sys-shoes-white-sneaker', slot: 'shoes', name: 'White Sneaker', imageUrl: '/images/presets/shoes-white-sneaker.jpg', colorTag: 'white', source: 'system' },
];
```

If the asset pack is not present yet, add a minimal first-version preset image set under `app/public/images/presets` during implementation rather than blocking the flow on design-perfect assets.

- [ ] **Step 3: Create focused creator-preview step components**

Use these prop contracts as the boundary:

```tsx
// ColorSelectionStep.tsx
interface ColorSelectionStepProps {
  selectedColor: string | null;
  onSelectColor: (color: string) => void;
}

// RecommendationPoolStep.tsx
interface RecommendationPoolStepProps {
  wardrobeItems: { id: string; name: string; imageUrl: string; clothType: string; color?: string }[];
  systemItems: SystemPreviewItem[];
  primaryColor: string;
  selectedSourceImage: string | null;
  onSelectSourceImage: (imageUrl: string) => void;
}

// LookSlotCarouselStep.tsx
interface LookSlotCarouselStepProps {
  slot: LookSlot;
  items: Array<{ id: string; name: string; imageUrl: string }>;
  selectedItemId: string | null;
  onSelectItem: (itemId: string) => void;
}

// PreviewVariantGrid.tsx
interface PreviewVariantGridProps {
  variants: Array<{
    id: string;
    direction: string;
    resultUrl: string | null;
    presentationTone: string;
    selected: boolean;
  }>;
  selectedVariantId: string | null;
  onSelectVariant: (variantId: string) => void;
  onSave: () => void;
  isSaving: boolean;
  saveError: string | null;
  saved: boolean;
}
```

- [ ] **Step 4: Replace the old four-step `/tryon` flow with creator-preview state**

Restructure `app/src/app/tryon/page.tsx` around this shape:

```tsx
type CreatorPreviewStep = 1 | 2 | 3 | 4 | 5;

interface CreatorPreviewVariantState {
  id: string;
  direction: CreatorDirection;
  resultUrl: string | null;
  presentationTone: string;
  selected: boolean;
}

interface CreatorPreviewState {
  currentStep: CreatorPreviewStep;
  personImage: string | null;
  primaryColor: PrimaryColor | null;
  sourceImage: string | null;
  slotSelections: Partial<Record<LookSlot, string>>;
  variants: CreatorPreviewVariantState[];
  selectedVariantId: string | null;
  isGenerating: boolean;
  error: string | null;
}
```

The new step mapping must be:

```tsx
1 -> 上传人物
2 -> 选择主色
3 -> 混排推荐素材
4 -> 按部位滚动选衣服
5 -> 三方向内容预演结果
```

Keep the auth gate behavior already added to `/tryon`: unauthenticated users should still be redirected to `/auth/login`.

- [ ] **Step 5: Wire generation to the existing AI endpoint, then derive three creator-facing direction cards**

Keep `/api/ai-tryon` as the first-version base render source:

```tsx
const response = await fetch('/api/ai-tryon', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    personImage: state.personImage,
    clothImage: state.sourceImage,
    clothType: 'upper',
    keepClothImage: null,
  }),
});
```

After the base render completes, fan it out into three saved direction cards in page state:

```tsx
const nextVariants = CREATOR_DIRECTIONS.map((direction, index) => ({
  id: `${direction}-${index}`,
  direction,
  resultUrl: data.resultUrl,
  presentationTone: DIRECTION_TONES[direction],
  selected: index === 0,
}));
```

Then save to `/api/creator-preview/history` only when the user explicitly clicks save:

```tsx
await fetch('/api/creator-preview/history', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    personImageUrl: state.personImage,
    sourceImageUrl: state.sourceImage,
    primaryColor: state.primaryColor,
    directionTags: CREATOR_DIRECTIONS,
    selectedDirection,
    slotSelections: state.slotSelections,
    variants: nextVariants.map((variant, index) => ({
      direction: variant.direction,
      sortOrder: index,
      resultUrl: variant.resultUrl,
      presentationTone: variant.presentationTone,
    })),
  }),
});
```

In this first pass, `state.sourceImage` is the image actually sent to the AI route. `slotSelections` are still required and saved to history, but they are not yet composed into a true multi-item render pipeline.

- [ ] **Step 6: Verify the rebuilt flow still compiles cleanly**

Run:

```bash
cd /Users/zyk/Desktop/clothes/app
npm run lint -- src/app/tryon/page.tsx src/components/tryon/StepIndicator.tsx src/components/tryon/UploadArea.tsx src/components/creator-preview
npx tsc --noEmit --pretty false
```

Expected:
- `lint` exits `0`
- `tsc` exits `0`

- [ ] **Step 7: Commit**

```bash
cd /Users/zyk/Desktop/clothes
git add app/src/app/tryon/page.tsx app/src/components/tryon/StepIndicator.tsx app/src/components/tryon/UploadArea.tsx app/src/components/creator-preview
git commit -m "feat: rebuild tryon as creator preview flow"
```

### Task 4: Reposition Homepage And Creator History Semantics

**Files:**
- Modify: `app/src/app/page.tsx`
- Modify: `app/src/components/home/HeroSection.tsx`
- Modify: `app/src/components/home/BrandStatementSection.tsx`
- Modify: `app/src/components/home/CapabilityCardsSection.tsx`
- Modify: `app/src/components/home/HowItWorksSection.tsx`
- Modify: `app/src/components/home/ClosingCtaSection.tsx`
- Modify: `app/src/app/profile/page.tsx`

- [ ] **Step 1: Confirm the homepage and profile still sell generic try-on semantics**

Run:

```bash
cd /Users/zyk/Desktop/clothes/app
rg -n "Narrative AI Try-On|开始试穿|Luxury Fit|换装工具|试衣历史|AI 虚拟试衣" src/app/page.tsx src/components/home src/app/profile/page.tsx
```

Expected: matches showing the old generic try-on positioning.

- [ ] **Step 2: Rewrite homepage hero and capability copy for creator preview**

Update the homepage to emphasize creator decisions, not shopping:

```tsx
// HeroSection.tsx
<div className="lux-surface lux-outline mb-6 inline-flex rounded-full px-3 py-2 text-xs uppercase tracking-[0.24em] text-white/82">
  Creator Preview Tool
</div>

<h1 className="font-heading text-6xl italic leading-[0.82] tracking-[-0.04em] text-white sm:text-7xl lg:text-[5.7rem]">
  Decide the drop before you shoot the look.
</h1>

<p className="mt-5 max-w-xl text-base leading-7 text-white/74 sm:text-lg">
  面向潮流穿搭博主的内容预演工具。上传人物、选主色、混排素材、对比三种方向，先决定这次内容该发哪一版。
</p>
```

Change CTA labels and section copy so the homepage explains:
- 上传人物
- 选择主色
- 混排素材
- 按部位选 look
- 比较三版内容方向

- [ ] **Step 3: Rename profile/history semantics from try-on history to creator preview history**

Refactor `app/src/app/profile/page.tsx` to consume `/api/creator-preview/history` and rename the UI:

```tsx
<h1 className="text-4xl font-serif text-slate-900 mb-3 tracking-wide drop-shadow-sm">创作者工作台</h1>
<p className="text-slate-600 text-lg">管理你的素材库与内容预演记录</p>
```

History section target:

```tsx
<h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
  <span className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center text-white text-sm">
    {history.length}
  </span>
  内容预演历史
</h2>
```

The list should show one session card with three variants instead of one flat try-on result row.

- [ ] **Step 4: Verify static checks after the repositioning changes**

Run:

```bash
cd /Users/zyk/Desktop/clothes/app
npm run lint -- src/app/page.tsx src/components/home/HeroSection.tsx src/components/home/BrandStatementSection.tsx src/components/home/CapabilityCardsSection.tsx src/components/home/HowItWorksSection.tsx src/components/home/ClosingCtaSection.tsx src/app/profile/page.tsx
npx tsc --noEmit --pretty false
```

Expected:
- `lint` exits `0`
- `tsc` exits `0`

- [ ] **Step 5: Commit**

```bash
cd /Users/zyk/Desktop/clothes
git add app/src/app/page.tsx app/src/components/home/HeroSection.tsx app/src/components/home/BrandStatementSection.tsx app/src/components/home/CapabilityCardsSection.tsx app/src/components/home/HowItWorksSection.tsx app/src/components/home/ClosingCtaSection.tsx app/src/app/profile/page.tsx
git commit -m "feat: reposition homepage and creator history"
```

### Task 5: Verify The End-To-End Creator Preview MVP

**Files:**
- Verify target: `app/src/app/tryon/page.tsx`
- Verify target: `app/src/app/profile/page.tsx`
- Verify target: `app/src/app/api/creator-preview/*`

- [ ] **Step 1: Run repository-level static verification**

Run:

```bash
cd /Users/zyk/Desktop/clothes/app
npm run lint
npx tsc --noEmit --pretty false
```

Expected:
- `lint` exits `0` or only retains any intentionally accepted image warnings if none were addressed in this pass
- `tsc` exits `0`

- [ ] **Step 2: Start the app locally**

Run:

```bash
cd /Users/zyk/Desktop/clothes/app
npm run dev
```

Expected: local app starts on `http://localhost:3000`.

- [ ] **Step 3: Manually verify the creator-preview flow**

Manual checklist:

```text
1. Open http://localhost:3000 and confirm homepage positioning is creator-focused, not generic try-on.
2. Log in and enter /tryon.
3. Upload one person image.
4. Pick one primary color.
5. Confirm the recommendation step shows a mixed pool of wardrobe items and system preset items.
6. Complete the slot-selection step for outerwear, innerwear, pants, accessory, and shoes.
7. Trigger generation and wait for the base render to complete.
8. Confirm three direction cards render together and one can be marked as the primary version.
9. Save the session and go to /profile.
10. Confirm the history list is labeled as content preview history and shows the newly saved session with three variants.
```

Expected: the user can complete the new creator-preview workflow and use the resulting comparison to decide which version to publish.

- [ ] **Step 4: Verify failure recovery**

Manual checklist:

```text
1. Trigger generation with the creator-preview flow.
2. Simulate one failing AI request or temporarily block the preview-history save request.
3. Confirm the page surfaces an understandable error without destroying the current creator-preview state.
4. Confirm the user can retry generation or retry saving from the same flow.
```

Expected: errors remain recoverable and the flow preserves enough state for creators to continue.

- [ ] **Step 5: Commit final plan execution updates if needed**

Only if implementation added any final touch-up edits during verification:

```bash
cd /Users/zyk/Desktop/clothes
git add app
git commit -m "fix: finalize creator preview verification polish"
```
