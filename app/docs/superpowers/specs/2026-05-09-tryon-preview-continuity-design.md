# Tryon / Preview Continuity Design

Date: 2026-05-09
Owner: Codex
Status: Ready for review

## Goal

Refine the transition from the luxury-fashion homepage into the `tryon` and `preview` routes so the product feels like one continuous brand journey instead of three adjacent pages with different interface instincts.

This round does not introduce new business logic. It only improves narrative continuity, layout hierarchy, and information framing across the existing flow.

## Why This Exists

The homepage already establishes a strong `luxury campaign + AI try-on` tone. The remaining gap is not visual quality in isolation, but continuity:

- `tryon` still reads partly like a step form rather than a branded first scene.
- `preview` has the correct atelier direction, but the left rail still behaves like a generic control column.
- The user journey from homepage CTA to generation to refinement needs clearer emotional progression:
  `campaign promise` -> `enter fitting scene` -> `generate look` -> `refine editorial output`.

## Product Intent

The site should still primarily sell `AI try-on`, not pure concept art.

The desired feeling across the three stages is:

- Homepage: luxury fashion campaign with product clarity.
- Tryon: backstage scene entry with one dominant action per step.
- Preview: editorial retouch desk with both controls and composition awareness.

## Scope

This spec covers:

- `src/app/tryon/page.tsx`
- `src/components/tryon/UploadArea.tsx`
- `src/components/tryon/ResultView.tsx`
- `src/app/preview/page.tsx`
- `src/components/preview/PreviewControlRail.tsx`

This spec does not cover:

- API changes
- auth flow changes
- try-on generation logic changes
- try-on history persistence changes
- Fabric canvas interaction changes
- homepage structure changes beyond preserving continuity assumptions

## Chosen Approach

### Option A: Keep both pages mostly functional and only retouch copy

Low risk, but too weak. It would preserve current discontinuities in layout rhythm and page identity.

### Option B: Strengthen narrative continuity while keeping business logic intact

Recommended.

This keeps all existing logic and route boundaries, but reframes both pages so they feel like the next scenes of the same luxury product story.

### Option C: Merge tryon and preview into a single atelier flow

Too large for this round. It would require interaction redesign, state redesign, and likely API-side assumptions about route flow.

## Design Summary

This round adopts Option B.

The homepage remains the campaign promise.

`tryon` becomes the guided backstage scene where the user prepares the look.

`preview` becomes the editorial refinement desk where the user checks composition and prepares the final output.

The key design rule is that continuity should come from hierarchy, copy tone, pacing, and recurring UI language, not by making every page visually identical.

## Tryon Design

### Intended Role

`tryon` is the first operational scene after the homepage CTA. It should feel like entering the fitting sequence, not opening a generic step wizard.

### Structure Changes

- Keep the four-step route logic exactly as it exists.
- Keep the current `TryOnSceneShell` pattern.
- Reframe the page header so it reads as a scene introduction rather than a feature banner.
- Reduce the prominence of tool/process language in the hero region.
- Preserve the step indicator, but visually subordinate it to the scene narrative.
- Keep the bottom progression bar, but tune its copy and visual weight so it reads like advancing scenes rather than filling a form.

### Content Hierarchy

Per step, the page should emphasize:

- one main action
- one short framing description
- one supporting aside block
- one advancement decision

The page should avoid showing multiple competing control clusters at once.

### Step-Specific Intent

#### Step 1

This is the cleanest entry point from the homepage. The upload area should dominate the scene. Supporting guidance should stay present but secondary.

#### Step 2

This is wardrobe selection. The route should feel like choosing the featured piece for the next look, not browsing an admin asset library.

#### Step 3

This is silhouette direction. The choice cards should read like styling decisions, not technical modes.

#### Step 4

This is the render and result stage. The loading state should feel like a darkroom or atelier process, and the success state should feel like a reveal on the main stage.

## UploadArea Design

### Intended Role

`UploadArea` is the dominant visual stage in Steps 1 and 2.

### Required Adjustments

- Preserve existing upload behavior and file handling.
- Increase the feeling of a single-stage focal object rather than a decorated uploader.
- Tighten copy so the title is the real anchor and the support text stays calm.
- Keep the preview state immersive, but reduce any elements that feel like a utility prompt.
- Make the replacement state feel like continuing a scene, not restarting a widget.

### Success Criteria

When the user lands on the page, their eye should immediately know what the single required action is.

## ResultView Design

### Intended Role

`ResultView` is the reveal and action surface after generation.

### Required Adjustments

- Preserve the current loading, error, save-history, retry, and download paths.
- Make the loading state feel slower and more deliberate than a generic progress panel.
- Make the success state look like the look has arrived on the main stage.
- Keep action buttons clear, but group them with stronger primary/secondary hierarchy.
- Keep save success and error feedback, but make them feel integrated into the result stage rather than floating system notices.

### Success Criteria

The result state should read as a luxury output surface first, with utility controls second.

## Preview Design

### Intended Role

`preview` is not another generation page. It is the refinement desk after the generated look exists.

### Structure Changes

- Keep the current large right-side stage.
- Keep the existing `PreviewAtelierHeader`.
- Keep the current Fabric canvas integration untouched.
- Rework the left rail into two clear sections:
  - `tool controls`
  - `current composition summary`

### Left Rail: Tool Controls

The upper half remains operational:

- background upload
- visible backdrop status
- wardrobe list
- add clothing entry point

This area should feel like a well-organized editing console, not a generic form sidebar.

### Left Rail: Current Composition Summary

The lower half is informational rather than procedural. It should summarize what is already true in the current editing session:

- whether a backdrop has been added
- how many clothing items are active
- what stage the composition is in
- what the user should check before export

This summary should not create new data dependencies. It should derive from existing page state only.

## Preview Main Stage

### Intended Role

The right-side stage should continue to be the center of gravity.

### Required Adjustments

- Preserve the current stage frame direction.
- Refine supporting copy so it feels like a continuation of the homepage and tryon voice.
- Keep stage chrome minimal enough that the canvas remains the hero.
- Ensure the left rail and stage feel like one atelier system rather than two separate panels.

## Visual System Rules

The existing visual system remains:

- black / silver / soft white
- serif italic headings
- clean sans body text
- liquid-glass surfaces
- restrained bloom and soft glow
- campaign/editorial pacing

This round should not introduce a competing accent color, new layout language, or SaaS-style feature density.

## Interaction Rules

The following must remain behaviorally unchanged:

- auth redirect behavior
- image upload triggers
- image compression
- try-on generation request
- polling / progress logic
- save-history behavior
- preview background upload behavior
- preview item transform behavior

Only presentation, layout, copy hierarchy, and perceived pacing may change.

## Risks

### Risk 1: Over-styling weakens clarity

If the tryon entry becomes too atmospheric, users may lose the immediacy of the required upload action.

Mitigation:
- keep one dominant CTA/action per step
- keep utility copy short and legible

### Risk 2: Preview summary feels fake or redundant

If the left-rail summary invents conceptual states that are not grounded in real page state, it will feel ornamental.

Mitigation:
- derive all summary lines from existing `backgroundImage` and `clothingItems` state

### Risk 3: Changes leak into business behavior

The components are close to real logic. A careless refactor could accidentally alter upload, polling, or canvas behavior.

Mitigation:
- keep logic changes out of scope
- favor presentational refactors over structural rewrites

## Validation

Implementation will be considered complete when:

- homepage -> `tryon` feels like a continuous narrative handoff
- `tryon` steps still function exactly as before
- `preview` still supports the same background and clothing editing behavior
- `preview` left rail clearly reads as `controls + composition summary`
- `npm run lint` passes with no new errors
- route smoke checks for `/`, `/tryon`, and `/preview` still succeed

## Out of Scope Follow-Ups

These are explicitly deferred:

- merge `tryon` and `preview` into one route
- add new preview export states
- revise history UX in profile
- replace remaining raw `img` tags with `next/image`
