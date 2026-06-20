# Tryon Shared Background Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make `/tryon` share the exact same flower video background world as the homepage, with Step 1 presented as a strong entry scene and Steps 2-4 as dimmed operational stages, without changing any try-on logic.

**Architecture:** Refactor the homepage flower video into a reusable background component with configurable intensity modes instead of duplicating video/HLS logic. Then recompose `/tryon` so the route keeps the same four-step state flow, but changes its page shell based on the current step: Step 1 remains open and cinematic, while Steps 2-4 sit inside darker foreground stages over the same shared video system.

**Tech Stack:** Next.js App Router, React client components, Tailwind CSS v4 utilities, HLS.js via runtime script injection, Lucide React

---

## File Structure

### Existing files to modify

- `src/components/home/HomeBackgroundVideo.tsx`
  Either convert this into the reusable shared background component directly or reduce it to a thin homepage wrapper around a new shared implementation.
- `src/app/page.tsx`
  Update homepage wiring only as needed to consume the refactored shared background component without changing homepage behavior.
- `src/app/tryon/page.tsx`
  Replace the current static glow-only shell with the shared flower background and restructure the page shell so Step 1 uses a stronger visual treatment than Steps 2-4.
- `src/components/tryon/TryOnSceneShell.tsx`
  Adjust shell containment so later tryon steps can sit inside a more dominant dark stage over the shared background without breaking existing content slots.
- `src/components/tryon/StepIndicator.tsx`
  Rebalance presentation further if needed so it behaves like a scene marker over the new shared-background layout rather than a process strip.

### New files to create

- `src/components/shared/SharedFlowerBackground.tsx`
  Own the shared flower video playback logic and expose simple props for page context and intensity mode so homepage and tryon can reuse the same implementation cleanly.

### Existing files to inspect but likely not modify

- `src/components/tryon/UploadArea.tsx`
  Confirm the current stage composition still works once Step 1 moves onto the stronger background treatment.
- `src/components/tryon/ResultView.tsx`
  Confirm the current result stage remains readable when rendered over the dimmed shared background state.

### No new tests

- This round is a presentational refactor with no business logic changes.
- Verification relies on `npm run lint`, `npm run build`, and route smoke checks for `/` and `/tryon`.

---

### Task 1: Extract the Homepage Flower Background Into a Reusable Component

**Files:**
- Create: `src/components/shared/SharedFlowerBackground.tsx`
- Modify: `src/components/home/HomeBackgroundVideo.tsx`
- Modify: `src/app/page.tsx`

- [ ] **Step 1: Inspect the current homepage background implementation**

Run:

```bash
sed -n '1,340p' /Users/zyk/Desktop/clothes/app/src/components/home/HomeBackgroundVideo.tsx
sed -n '1,120p' /Users/zyk/Desktop/clothes/app/src/app/page.tsx
```

Expected:
- HLS playback, dual-video crossfade, and parallax all live in `HomeBackgroundVideo.tsx`
- homepage page wiring mounts that component once at the page root

- [ ] **Step 2: Create a shared background component API for homepage and tryon**

Create `src/components/shared/SharedFlowerBackground.tsx` with a small prop surface like:

```tsx
type SharedFlowerBackgroundMode = "hero" | "atelier";

interface SharedFlowerBackgroundProps {
  mode: SharedFlowerBackgroundMode;
  dimmed?: boolean;
  className?: string;
}
```

Implementation requirements:
- move the existing flower video source, HLS bootstrapping, dual-video crossfade, and parallax logic into this file
- keep the same flower asset and playback behavior as homepage today
- use `mode` / `dimmed` only to vary overlay strength, bloom intensity, and foreground contrast support
- do not add page-specific text or layout logic to the shared component

- [ ] **Step 3: Reduce the homepage wrapper to shared-component wiring only**

Update `src/components/home/HomeBackgroundVideo.tsx` so it becomes a thin wrapper like:

```tsx
import SharedFlowerBackground from "@/components/shared/SharedFlowerBackground";

export default function HomeBackgroundVideo() {
  return <SharedFlowerBackground mode="hero" />;
}
```

Keep homepage behavior visually equivalent to the current implementation.

- [ ] **Step 4: Verify homepage wiring still mounts the background correctly**

Ensure `src/app/page.tsx` still renders:

```tsx
<HomeBackgroundVideo />
```

and does not gain new layout responsibilities.

- [ ] **Step 5: Run lint after the shared background extraction**

Run:

```bash
cd /Users/zyk/Desktop/clothes/app && npm run lint
```

Expected:
- Exit code `0`
- Only the known `@next/next/no-img-element` warnings remain

- [ ] **Step 6: Commit the shared background extraction**

```bash
git -C /Users/zyk/Desktop/clothes/app add \
  src/components/shared/SharedFlowerBackground.tsx \
  src/components/home/HomeBackgroundVideo.tsx \
  src/app/page.tsx
git -C /Users/zyk/Desktop/clothes/app commit -m "refactor: extract shared flower background"
```

---

### Task 2: Mount the Shared Flower Background in Tryon With Step-Sensitive Intensity

**Files:**
- Modify: `src/app/tryon/page.tsx`

- [ ] **Step 1: Inspect the current tryon page shell and step boundaries**

Run:

```bash
sed -n '1,980p' /Users/zyk/Desktop/clothes/app/src/app/tryon/page.tsx
```

Expected:
- the route owns `state.currentStep`
- the current background is static glow styling inside the page shell
- all step rendering already branches on `state.currentStep`

- [ ] **Step 2: Replace the static tryon background shell with the shared flower background**

Integrate the new shared component near the page root, for example:

```tsx
<SharedFlowerBackground
  mode={state.currentStep === 1 ? "hero" : "atelier"}
  dimmed={state.currentStep !== 1}
/>
```

Implementation requirements:
- reuse the exact same flower video background system as homepage
- keep the tryon route’s auth bootstrap and rendering guards unchanged
- remove or reduce the old static glow-only background layer so it does not compete with the shared background

- [ ] **Step 3: Make Step 1 read like the homepage handoff scene**

Adjust the Step 1 page shell so it:

- uses looser spacing and a more open foreground layout
- lets the flower background remain visibly stronger
- keeps one dominant upload action
- keeps the step/chapter marker secondary

Do not change:

```tsx
handleFileSelect(...)
isNextDisabled()
nextStep()
```

- [ ] **Step 4: Make Steps 2-4 read like darker operational stages in the same world**

Adjust the page shell for later steps so it:

- keeps the same shared background visible but more subdued
- uses stronger dark overlays and more dominant containers
- favors content readability over spectacle
- preserves current wardrobe selection, mode selection, render, retry, and save-history behavior exactly as-is

- [ ] **Step 5: Run route-focused lint and smoke verification**

Run:

```bash
cd /Users/zyk/Desktop/clothes/app && npm run lint
curl -I http://localhost:3000/tryon
```

Expected:
- lint exits `0`
- `/tryon` returns `200`

- [ ] **Step 6: Commit the tryon shared-background shell**

```bash
git -C /Users/zyk/Desktop/clothes/app add src/app/tryon/page.tsx
git -C /Users/zyk/Desktop/clothes/app commit -m "feat: add shared flower background to tryon"
```

---

### Task 3: Rebalance Tryon Foreground Containers for the New Background

**Files:**
- Modify: `src/components/tryon/TryOnSceneShell.tsx`
- Modify: `src/components/tryon/StepIndicator.tsx`
- Inspect: `src/components/tryon/UploadArea.tsx`
- Inspect: `src/components/tryon/ResultView.tsx`

- [ ] **Step 1: Inspect the current shell and step-indicator presentation**

Run:

```bash
sed -n '1,220p' /Users/zyk/Desktop/clothes/app/src/components/tryon/TryOnSceneShell.tsx
sed -n '1,260p' /Users/zyk/Desktop/clothes/app/src/components/tryon/StepIndicator.tsx
```

Expected:
- `TryOnSceneShell` provides the current title/description/aside frame
- `StepIndicator` still uses the same `currentStep` contract

- [ ] **Step 2: Strengthen the shell for later-step readability without breaking Step 1**

Update `TryOnSceneShell` so it can support:

- a lighter, more open reading for Step 1
- a denser, darker, more contained stage for Steps 2-4

If needed, add a minimal prop like:

```tsx
variant?: "entry" | "stage"
```

Only do this if it meaningfully reduces conditional clutter in `tryon/page.tsx`.

- [ ] **Step 3: Reduce residual workflow feel in the step indicator**

Keep the public interface:

```tsx
interface StepIndicatorProps {
  currentStep: 1 | 2 | 3 | 4;
}
```

Adjust presentation so:
- it reads like a scene marker over the shared background
- it remains legible on both stronger Step 1 and dimmer Steps 2-4 treatments
- it does not regain a generic software workflow look

- [ ] **Step 4: Confirm UploadArea and ResultView remain readable without behavioral changes**

Run:

```bash
sed -n '1,280p' /Users/zyk/Desktop/clothes/app/src/components/tryon/UploadArea.tsx
sed -n '1,340p' /Users/zyk/Desktop/clothes/app/src/components/tryon/ResultView.tsx
```

Expected:
- no contract changes are needed
- any readability issues can be solved at shell/layout level rather than changing component behavior

- [ ] **Step 5: Run lint after shell and indicator adjustments**

Run:

```bash
cd /Users/zyk/Desktop/clothes/app && npm run lint
```

Expected:
- Exit code `0`
- Only known warnings remain

- [ ] **Step 6: Commit the tryon foreground rebalance**

```bash
git -C /Users/zyk/Desktop/clothes/app add \
  src/components/tryon/TryOnSceneShell.tsx \
  src/components/tryon/StepIndicator.tsx
git -C /Users/zyk/Desktop/clothes/app commit -m "feat: rebalance tryon foreground stages"
```

---

### Task 4: Final Verification for Homepage and Tryon Continuity

**Files:**
- Verify only

- [ ] **Step 1: Run full lint verification**

Run:

```bash
cd /Users/zyk/Desktop/clothes/app && npm run lint
```

Expected:
- Exit code `0`
- Only known warnings remain

- [ ] **Step 2: Run a production build verification**

Run:

```bash
cd /Users/zyk/Desktop/clothes/app && npm run build
```

Expected:
- successful Next.js production build

- [ ] **Step 3: Run homepage and tryon route smoke checks**

Run:

```bash
curl -I http://localhost:3000/
curl -I http://localhost:3000/tryon
```

Expected:
- both routes return `200`

- [ ] **Step 4: Manually verify the visual continuity in the browser**

Validate visually:

- homepage still shows the same flower video behavior as before
- Step 1 of `/tryon` feels like a direct continuation of the homepage
- Steps 2-4 keep the same flower video world but visibly dim it
- later steps remain easier to read than Step 1
- step progression feels like scene movement, not a generic wizard

- [ ] **Step 5: Commit any final continuity-only fixes**

```bash
git -C /Users/zyk/Desktop/clothes/app add -A
git -C /Users/zyk/Desktop/clothes/app commit -m "chore: finalize tryon shared background polish"
```
