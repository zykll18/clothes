# Tryon / Preview Continuity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refine `/tryon` and `/preview` so they read as the next editorial scenes after the homepage, while keeping all existing upload, generation, save-history, and canvas behavior unchanged.

**Architecture:** Treat this as a presentational continuity pass, not a product rewrite. `tryon` keeps its current scene-shell flow and state model, but its header, step emphasis, and progression framing are adjusted to feel like a backstage entry sequence. `preview` keeps its current atelier layout, but the left rail is rebuilt into a split between operational controls and a composition summary derived only from existing state.

**Tech Stack:** Next.js App Router, React client components, Tailwind CSS v4 utilities from `src/app/globals.css`, Lucide React, existing Fabric canvas integration

---

## File Structure

### Existing files to modify

- `src/app/tryon/page.tsx`
  Keep all auth, upload, generation, polling, and save-history logic intact while reducing tool-like framing in the page header, step progression, and per-step narrative chrome.
- `src/components/tryon/UploadArea.tsx`
  Tighten the stage composition so the main action is more obvious and the replacement state feels like scene continuation rather than widget replacement.
- `src/components/tryon/ResultView.tsx`
  Rebalance loading, success, error, and action hierarchy so the result stage reads as luxury output first and utility second.
- `src/app/preview/page.tsx`
  Adjust top-level copy and stage framing so `preview` feels like the refinement stop after `tryon`, not a separate tool page.
- `src/components/preview/PreviewControlRail.tsx`
  Split the rail into `tool controls` and `current composition summary`, using only existing state.

### Existing files to inspect but likely not modify

- `src/components/tryon/TryOnSceneShell.tsx`
  Reuse the current shell unless the presentational boundaries block continuity work.
- `src/components/preview/PreviewAtelierHeader.tsx`
  Keep the current header component unless minor copy adjustments are easier there than in `preview/page.tsx`.

### No new tests

- This round is a presentation-only refactor.
- Verification relies on `npm run lint`, `npm run build`, and route smoke checks for `/`, `/tryon`, and `/preview`.

---

### Task 1: Refine Try-On Page Continuity

**Files:**
- Modify: `src/app/tryon/page.tsx`
- Inspect: `src/components/tryon/TryOnSceneShell.tsx`

- [ ] **Step 1: Inspect the current try-on structure before editing**

Run:

```bash
sed -n '1,980p' /Users/zyk/Desktop/clothes/app/src/app/tryon/page.tsx
```

Expected:
- Auth bootstrap logic is present
- `sceneCopy` drives the four-step narrative shell
- `generateResult`, `pollTaskStatus`, and history-save logic are already wired

- [ ] **Step 2: Reframe the page header as scene entry instead of feature banner**

Adjust only the presentational header region so it:

- reduces the weight of process/explainer copy
- keeps the main `AI 虚拟试衣叙事场` title or a close equivalent as the hero anchor
- downgrades the `Powered by 阿里云 DashScope AI 试衣引擎` panel to secondary support copy

Keep these logic anchors unchanged:

```tsx
if (authLoading) { ... }
if (!isAuthenticated) { return null; }
const [state, setState] = useState<AppState>(...)
```

- [ ] **Step 3: Reduce tool-like step framing while keeping the existing four-step flow**

Update only presentation around:

```tsx
<StepIndicator currentStep={state.currentStep} />
```

and the bottom progression region so the page reads like:

- `scene introduction`
- `one dominant action`
- `advance to next scene`

Do not change:

```tsx
const nextStep = () => { ... }
const prevStep = () => { ... }
const isNextDisabled = () => { ... }
```

- [ ] **Step 4: Rebalance Step 2 and Step 3 as wardrobe/styling scenes instead of admin choices**

Keep the existing branches:

```tsx
showClothingSelector ? ... : clothingSource === 'saved' ? ... : ...
```

and:

```tsx
state.mode === 'upper_body'
state.mode === 'full_body'
```

but adjust the surrounding copy, grouping, and emphasis so Step 2 reads as wardrobe casting and Step 3 reads as silhouette direction.

- [ ] **Step 5: Run lint to confirm the page refactor introduced no errors**

Run:

```bash
cd /Users/zyk/Desktop/clothes/app && npm run lint
```

Expected:
- Exit code `0`
- Only the existing `@next/next/no-img-element` warnings remain unless separately addressed in this task set

- [ ] **Step 6: Commit the try-on continuity pass**

```bash
git -C /Users/zyk/Desktop/clothes/app add src/app/tryon/page.tsx
git -C /Users/zyk/Desktop/clothes/app commit -m "feat: refine tryon narrative continuity"
```

---

### Task 2: Tighten Upload and Result Stage Hierarchy

**Files:**
- Modify: `src/components/tryon/UploadArea.tsx`
- Modify: `src/components/tryon/ResultView.tsx`

- [ ] **Step 1: Inspect the current upload and result contracts**

Run:

```bash
sed -n '1,280p' /Users/zyk/Desktop/clothes/app/src/components/tryon/UploadArea.tsx
sed -n '1,340p' /Users/zyk/Desktop/clothes/app/src/components/tryon/ResultView.tsx
```

Expected:
- `UploadArea` accepts `title`, `subtitle`, `onFileSelect`, `accept`, and `previewUrl`
- `ResultView` accepts loading, result, error, retry, save-history, and progress props

- [ ] **Step 2: Make UploadArea read as a single dominant stage**

Keep the public interface unchanged:

```tsx
interface UploadAreaProps {
  title: string;
  subtitle: string;
  onFileSelect: (file: File) => void;
  accept?: string;
  previewUrl?: string | null;
}
```

Adjust presentation so:

- empty state has one obvious action
- helper details stay secondary
- loaded state feels like a prepared scene
- replacement language feels like continuation, not reset

- [ ] **Step 3: Rebalance ResultView action hierarchy**

Keep the public interface unchanged:

```tsx
interface ResultViewProps {
  isGenerating: boolean;
  resultImage: string | null;
  error: string | null;
  onRetry: () => void;
  onSaveHistory?: () => void;
  isSavingHistory?: boolean;
  historySaved?: boolean;
  historySaveError?: string | null;
  progress?: number;
}
```

Adjust presentation so:

- loading feels deliberate and editorial
- success centers the output as the main stage reveal
- save-history feedback sits inside the result hierarchy
- button ordering clearly separates retry, save, download, and profile follow-up

- [ ] **Step 4: Run lint after component refinement**

Run:

```bash
cd /Users/zyk/Desktop/clothes/app && npm run lint
```

Expected:
- Exit code `0`
- No new lint errors introduced by component edits

- [ ] **Step 5: Commit the try-on stage polish**

```bash
git -C /Users/zyk/Desktop/clothes/app add \
  src/components/tryon/UploadArea.tsx \
  src/components/tryon/ResultView.tsx
git -C /Users/zyk/Desktop/clothes/app commit -m "feat: polish tryon upload and result stages"
```

---

### Task 3: Rebuild Preview Rail as Controls Plus Composition Summary

**Files:**
- Modify: `src/app/preview/page.tsx`
- Modify: `src/components/preview/PreviewControlRail.tsx`
- Inspect: `src/components/preview/PreviewAtelierHeader.tsx`

- [ ] **Step 1: Inspect the current preview layout and rail responsibilities**

Run:

```bash
sed -n '1,260p' /Users/zyk/Desktop/clothes/app/src/app/preview/page.tsx
sed -n '1,260p' /Users/zyk/Desktop/clothes/app/src/components/preview/PreviewControlRail.tsx
```

Expected:
- `preview/page.tsx` owns `backgroundImage` and `clothingItems`
- `PreviewControlRail` receives only `backgroundImage`, `clothingItems`, and `onBackgroundUpload`

- [ ] **Step 2: Keep the stage dominant while refining copy continuity**

In `src/app/preview/page.tsx`, adjust only presentational framing around:

```tsx
<PreviewAtelierHeader ... />
<PreviewControlRail ... />
<CanvasPreview ... />
```

The page should read like:

- a refinement desk after generation
- one main editorial stage on the right
- one supporting rail on the left

Do not change:

```tsx
const [backgroundImage, setBackgroundImage] = useState<string>('')
const [clothingItems, setClothingItems] = useState<PreviewClothingItem[]>(...)
const handlePositionChange = (...)
const handleBackgroundUpload = (...)
```

- [ ] **Step 3: Split the control rail into two stacked sections**

In `PreviewControlRail`, keep the existing props:

```tsx
interface PreviewControlRailProps {
  backgroundImage: string;
  clothingItems: PreviewClothingItem[];
  onBackgroundUpload: (e: ChangeEvent<HTMLInputElement>) => void;
}
```

Reframe the component as:

- upper section: operational controls
- lower section: current composition summary

The summary must derive only from existing state, for example:

- backdrop present or pending
- item count
- a simple stage label based on whether a background exists and whether any clothing items exist
- a short pre-export check list

- [ ] **Step 4: Keep the add-clothing affordance present without inventing new behavior**

The existing add button is visual-only. Preserve that constraint.

Do not introduce:

- modal logic
- new upload flows
- new callbacks

Only improve wording, grouping, and hierarchy around the existing button.

- [ ] **Step 5: Run lint after the preview refactor**

Run:

```bash
cd /Users/zyk/Desktop/clothes/app && npm run lint
```

Expected:
- Exit code `0`
- No new lint errors introduced by preview edits

- [ ] **Step 6: Commit the preview continuity pass**

```bash
git -C /Users/zyk/Desktop/clothes/app add \
  src/app/preview/page.tsx \
  src/components/preview/PreviewControlRail.tsx
git -C /Users/zyk/Desktop/clothes/app commit -m "feat: refine preview continuity and rail summary"
```

---

### Task 4: Final Verification Across the Full Journey

**Files:**
- Verify only

- [ ] **Step 1: Run lint for the whole app**

Run:

```bash
cd /Users/zyk/Desktop/clothes/app && npm run lint
```

Expected:
- Exit code `0`
- Only known warnings remain

- [ ] **Step 2: Run a production build smoke check**

Run:

```bash
cd /Users/zyk/Desktop/clothes/app && npm run build
```

Expected:
- Successful Next.js production build

- [ ] **Step 3: Run route smoke checks**

Run:

```bash
curl -I http://localhost:3000/
curl -I http://localhost:3000/tryon
curl -I http://localhost:3000/preview
```

Expected:
- All three routes return `200`

- [ ] **Step 4: Manual continuity check in the browser**

Validate visually:

- homepage CTA leads into a `tryon` first scene rather than a tool jump
- Step 1 has one dominant upload action
- Step 4 result state feels like a reveal stage
- preview left rail clearly reads as `controls + composition summary`
- preview main stage remains the visual center

- [ ] **Step 5: Commit any final continuity-only fixes**

```bash
git -C /Users/zyk/Desktop/clothes/app add -A
git -C /Users/zyk/Desktop/clothes/app commit -m "chore: finalize tryon preview continuity polish"
```
