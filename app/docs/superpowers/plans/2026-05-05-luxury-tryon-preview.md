# Luxury Try-On / Preview Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restyle `/tryon` and `/preview` into a unified luxury fashion experience without changing their existing business logic, canvas behavior, or API flow.

**Architecture:** Keep all current state, request, polling, and editor behavior intact, but move presentation into a small set of reusable luxury shells and restyled existing components. `tryon` becomes a full-screen storyboard flow, while `preview` becomes a left-rail plus main-stage atelier layout that reuses the homepage luxury tokens instead of inventing a second design language.

**Tech Stack:** Next.js App Router, React client components, Tailwind CSS v4 utilities in `globals.css`, Lucide React, Fabric.js

---

## File Structure

### Existing files to modify

- `src/app/globals.css`
  Add only the additional luxury utilities needed for `tryon` and `preview`, keeping the existing shared helpers and homepage tokens intact.
- `src/app/tryon/page.tsx`
  Preserve all existing logic and state, but swap the current light glass card composition for a storyboard-style luxury page shell.
- `src/app/preview/page.tsx`
  Preserve current upload and preview state, but rebuild layout into a narrow control rail plus large stage.
- `src/components/tryon/StepIndicator.tsx`
  Convert the current blue step tabs into a luxury progress strip that still reflects the same `currentStep` contract.
- `src/components/tryon/UploadArea.tsx`
  Restyle the upload/dropzone presentation so both person and clothing steps match the new page language.
- `src/components/tryon/ResultView.tsx`
  Restyle generating, success, and error states to fit the campaign/result scene while keeping the same props contract.
- `src/components/canvas/CanvasPreview.tsx`
  Restyle the canvas container overlay controls for the preview atelier without changing editor behavior.

### New files to create

- `src/components/tryon/TryOnSceneShell.tsx`
  Lightweight presentational shell for each try-on step scene: eyebrow, title, description, and framed content slot.
- `src/components/preview/PreviewAtelierHeader.tsx`
  Lightweight top status bar for the preview page.
- `src/components/preview/PreviewControlRail.tsx`
  Presentational left rail for upload, clothing list, and action group in the preview page.

### No new tests

- This is a visual refactor with no business logic changes.
- Verification relies on `npm run lint`, `npm run build`, and live route checks for `/tryon` and `/preview`.

---

### Task 1: Extend Luxury Utilities Without Regressing Existing Pages

**Files:**
- Modify: `src/app/globals.css`

- [ ] **Step 1: Inspect the current luxury token surface before editing**

Run:

```bash
sed -n '1,260p' /Users/zyk/Desktop/clothes/app/src/app/globals.css
```

Expected:
- Existing `lux-page`, `lux-surface`, `lux-surface-strong`, and `lux-outline` utilities are present
- Existing shared helpers like `.animate-blob` and `.dashed-border` remain intact

- [ ] **Step 2: Add tryon/preview-specific utilities as additive classes only**

Add scoped utilities for:

```css
.lux-hero-grid {}
.lux-stage-frame {}
.lux-rail {}
.lux-kicker {}
.lux-divider {}
.lux-noise::before {}
```

Implementation rules:
- Reuse the existing color variables and avoid changing `body`
- Do not delete or rewrite the shared non-homepage helper classes
- Keep all new styles page-scoped through class usage, not global element overrides

- [ ] **Step 3: Run lint to confirm the stylesheet edit introduced no syntax errors**

Run:

```bash
cd /Users/zyk/Desktop/clothes/app && npm run lint
```

Expected:
- Exit code `0`
- Only the existing image warnings remain

- [ ] **Step 4: Commit the utility layer**

```bash
git -C /Users/zyk/Desktop/clothes/app add src/app/globals.css
git -C /Users/zyk/Desktop/clothes/app commit -m "feat: add luxury tryon preview utility styles"
```

---

### Task 2: Build the Try-On Storyboard Shell

**Files:**
- Create: `src/components/tryon/TryOnSceneShell.tsx`
- Modify: `src/components/tryon/StepIndicator.tsx`
- Modify: `src/app/tryon/page.tsx`

- [ ] **Step 1: Add a presentational scene shell component**

Create a small wrapper like:

```tsx
interface TryOnSceneShellProps {
  eyebrow: string;
  title: string;
  description: string;
  children: React.ReactNode;
  aside?: React.ReactNode;
}
```

Render:
- a luxury eyebrow line
- a serif italic title
- a short description
- a framed content region
- optional side/support content for desktop layouts

- [ ] **Step 2: Restyle the step indicator without changing its API**

Keep:

```tsx
interface StepIndicatorProps {
  currentStep: 1 | 2 | 3 | 4;
}
```

Visual changes:
- remove the blue tab treatment
- use a thin luxury progress strip with step numbers and labels
- keep the current step visually obvious on both mobile and desktop

- [ ] **Step 3: Rebuild `/tryon` into a full-page luxury storyboard while preserving all logic**

Keep intact:

```tsx
const [state, setState] = useState<AppState>(...)
const [progress, setProgress] = useState(0)
const [savedClothes, setSavedClothes] = useState<ClothingItem[]>([])
```

Do not change:
- upload handlers
- `generateResult`
- `pollTaskStatus`
- step sequencing
- error semantics

Change only:
- outer page shell and background treatment
- step section composition
- per-step headline/subcopy
- navigation row / next-back action presentation
- wardrobe picker visual framing

- [ ] **Step 4: Run route-focused verification**

Run:

```bash
cd /Users/zyk/Desktop/clothes/app && npm run dev
```

Then verify in a separate shell:

```bash
curl -I http://localhost:3000/tryon
```

Expected:
- Dev server starts successfully
- `/tryon` returns `200`

- [ ] **Step 5: Commit the try-on shell**

```bash
git -C /Users/zyk/Desktop/clothes/app add \
  src/components/tryon/TryOnSceneShell.tsx \
  src/components/tryon/StepIndicator.tsx \
  src/app/tryon/page.tsx
git -C /Users/zyk/Desktop/clothes/app commit -m "feat: redesign tryon as luxury storyboard"
```

---

### Task 3: Restyle Try-On Upload and Result States

**Files:**
- Modify: `src/components/tryon/UploadArea.tsx`
- Modify: `src/components/tryon/ResultView.tsx`

- [ ] **Step 1: Restyle the upload area component to match the new scene shell**

Keep the public API:

```tsx
interface UploadAreaProps {
  title: string;
  subtitle: string;
  onFileSelect: (file: File) => void;
  accept?: string;
  previewUrl?: string | null;
}
```

Visual changes:
- replace the light dashed demo panel with a luxury upload stage
- keep preview replacement behavior intact
- ensure empty and loaded states both look intentional inside dark scenes

- [ ] **Step 2: Restyle the result view states without changing behavior**

Keep the public API:

```tsx
interface ResultViewProps {
  isGenerating: boolean;
  resultImage: string | null;
  error: string | null;
  onRetry: () => void;
  progress?: number;
}
```

Visual changes:
- generation state becomes a luxury “processing scene”
- success state centers the resulting image as the hero output
- error state fits the same visual language without blue/red dashboard styling

- [ ] **Step 3: Run lint after component restyling**

Run:

```bash
cd /Users/zyk/Desktop/clothes/app && npm run lint
```

Expected:
- Exit code `0`
- No new lint errors introduced by the component changes

- [ ] **Step 4: Commit the try-on component polish**

```bash
git -C /Users/zyk/Desktop/clothes/app add \
  src/components/tryon/UploadArea.tsx \
  src/components/tryon/ResultView.tsx
git -C /Users/zyk/Desktop/clothes/app commit -m "feat: polish luxury tryon states"
```

---

### Task 4: Build the Preview Atelier Layout

**Files:**
- Create: `src/components/preview/PreviewAtelierHeader.tsx`
- Create: `src/components/preview/PreviewControlRail.tsx`
- Modify: `src/app/preview/page.tsx`
- Modify: `src/components/canvas/CanvasPreview.tsx`

- [ ] **Step 1: Create a lightweight preview header**

Build a presentational header that exposes:
- page label like `Preview Atelier`
- one-line description
- optional status copy for the current editing flow

Keep it visual-only; do not add new business logic.

- [ ] **Step 2: Create a reusable preview control rail**

Move the existing left-side control sections into a focused presentational component that accepts the already-existing data and handlers from `preview/page.tsx`.

Suggested shape:

```tsx
interface PreviewControlRailProps {
  backgroundImage: string;
  clothingItems: PreviewClothingItem[];
  onBackgroundUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
}
```

Keep current capabilities:
- background upload
- clothing list display
- existing add clothing button

- [ ] **Step 3: Recompose `/preview` into a luxury atelier layout**

Keep intact:

```tsx
const [backgroundImage, setBackgroundImage] = useState<string>('')
const [clothingItems, setClothingItems] = useState<PreviewClothingItem[]>(...)
const handlePositionChange = (...)
const handleBackgroundUpload = (...)
```

Change only:
- page shell
- heading and copy hierarchy
- left rail styling and spacing
- main stage framing around `CanvasPreview`

- [ ] **Step 4: Restyle the canvas overlay chrome without touching editor behavior**

In `CanvasPreview.tsx`:
- keep Fabric setup and object manipulation logic unchanged
- restyle the bottom control strip and selected-item badge
- ensure controls remain readable over dark stage framing

- [ ] **Step 5: Run route-focused verification**

Run:

```bash
cd /Users/zyk/Desktop/clothes/app && npm run dev
```

Then verify in a separate shell:

```bash
curl -I http://localhost:3000/preview
```

Expected:
- Dev server starts successfully if not already running
- `/preview` returns `200`

- [ ] **Step 6: Commit the preview atelier**

```bash
git -C /Users/zyk/Desktop/clothes/app add \
  src/components/preview/PreviewAtelierHeader.tsx \
  src/components/preview/PreviewControlRail.tsx \
  src/app/preview/page.tsx \
  src/components/canvas/CanvasPreview.tsx
git -C /Users/zyk/Desktop/clothes/app commit -m "feat: redesign preview as luxury atelier"
```

---

### Task 5: Final Assembly and Verification

**Files:**
- Review: `src/app/globals.css`
- Review: `src/app/tryon/page.tsx`
- Review: `src/app/preview/page.tsx`
- Review: `src/components/tryon/StepIndicator.tsx`
- Review: `src/components/tryon/UploadArea.tsx`
- Review: `src/components/tryon/ResultView.tsx`
- Review: `src/components/tryon/TryOnSceneShell.tsx`
- Review: `src/components/preview/PreviewAtelierHeader.tsx`
- Review: `src/components/preview/PreviewControlRail.tsx`
- Review: `src/components/canvas/CanvasPreview.tsx`

- [ ] **Step 1: Run full lint verification**

Run:

```bash
cd /Users/zyk/Desktop/clothes/app && npm run lint
```

Expected:
- Exit code `0`
- Only pre-existing image warnings remain unless separately fixed

- [ ] **Step 2: Run production build verification**

Run:

```bash
cd /Users/zyk/Desktop/clothes/app && npm run build
```

Expected:
- Build completes successfully
- No new type or compile errors are introduced

- [ ] **Step 3: Smoke-check key routes in dev**

Run:

```bash
curl -I http://localhost:3000/
curl -I http://localhost:3000/tryon
curl -I http://localhost:3000/preview
```

Expected:
- All three routes return `200`

- [ ] **Step 4: Commit the final pass if needed**

```bash
git -C /Users/zyk/Desktop/clothes/app status --short
```

If any verification-driven fixes were required:

```bash
git -C /Users/zyk/Desktop/clothes/app add src/app/globals.css src/app/tryon/page.tsx src/app/preview/page.tsx src/components/tryon/StepIndicator.tsx src/components/tryon/UploadArea.tsx src/components/tryon/ResultView.tsx src/components/tryon/TryOnSceneShell.tsx src/components/preview/PreviewAtelierHeader.tsx src/components/preview/PreviewControlRail.tsx src/components/canvas/CanvasPreview.tsx
git -C /Users/zyk/Desktop/clothes/app commit -m "fix: finalize luxury tryon preview refinement"
```

If no files changed during verification, do not create an empty commit.

---

## Self-Review

- Spec coverage check:
  - `tryon` storyboard structure is covered in Tasks 2 and 3.
  - `preview` atelier structure is covered in Task 4.
  - shared visual system and scoped utility reuse are covered in Task 1.
  - final non-regression verification is covered in Task 5.
- Placeholder scan:
  - no `TODO`, `TBD`, or “similar to above” placeholders remain.
- Boundary check:
  - every task keeps business logic and canvas behavior intact and limits changes to presentation-layer code.
