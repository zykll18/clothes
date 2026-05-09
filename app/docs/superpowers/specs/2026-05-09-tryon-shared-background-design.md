# Tryon Shared Background Design

Date: 2026-05-09
Owner: Codex
Status: Ready for review

## Goal

Bring `/tryon` fully into the same visual world as the homepage by reusing the exact same flower video background system, while preserving try-on usability and all existing business logic.

This is not a logic refactor. It is a visual and structural continuity pass focused only on `/tryon`.

## Why This Exists

The current `tryon` page is closer to the homepage than before, but it still reads like a styled workflow page rather than a true continuation of the homepage experience.

The user requirement is explicit:

- `tryon` should feel like the homepage
- it should use the same flower background
- later steps should still remain usable

The design problem is therefore not whether to share the same background, but how to share it without making Steps 2-4 too visually noisy.

## Product Intent

The site still sells `AI try-on`, not abstract art direction.

That means the page must achieve both:

- strong continuity with the homepage luxury campaign language
- clear usability for upload, selection, generation, and result review

## Scope

This spec covers:

- `src/app/tryon/page.tsx`
- reuse of the existing homepage flower video background system
- tryon-only scene hierarchy and step framing

This spec does not cover:

- API changes
- upload logic changes
- image compression changes
- generation or polling changes
- history-save logic changes
- `preview` changes
- homepage structural changes

## Chosen Approach

### Option A: Use the same strong video background equally across all four steps

This creates visual consistency, but it weakens readability and makes later operational steps feel overdesigned.

### Option B: Step 1 as strong entry, Steps 2-4 as dimmed continuation

Recommended.

Use the exact same flower background across the entire route, but treat it differently by step:

- Step 1 keeps a homepage-like entrance intensity
- Steps 2-4 retain the same background but with darker overlays, softer contrast, and stronger foreground containment

This preserves continuity without sacrificing usability.

### Option C: Keep current tryon structure and only replace the background layer

Fast, but visually incoherent. The old workflow shell would still fight the homepage-level background treatment.

## Design Summary

This round adopts Option B.

`tryon` becomes a two-phase visual experience:

- Step 1 is the entry scene immediately after the homepage
- Steps 2-4 are the same world, but shifted into a darker operational stage

The same flower video background remains present throughout. The difference is foreground dominance and background intensity, not a hard visual reset.

## Shared Background System

### Core Rule

`tryon` must reuse the same flower video background source and same luxury world language already established on the homepage.

This means:

- same flower video asset
- same black / silver / bloom atmosphere
- same cinematic continuity

It should not introduce a second background concept for `tryon`.

### Step 1 Background Treatment

Step 1 should feel like the first scene after the homepage CTA.

Requirements:

- flower video is clearly visible
- bloom and highlights remain comparatively strong
- foreground panels stay lighter and less enclosing than later steps
- the user should immediately feel that they have entered the try-on world, not opened a utility tool

### Steps 2-4 Background Treatment

Steps 2-4 should still use the same flower video, but the page should deliberately shift from spectacle to usability.

Requirements:

- stronger dark overlay
- lower apparent contrast in the background
- slightly softer visual intensity
- more dominant foreground stage containers
- enough continuity that the user still feels in the same branded space

This is a dimmed continuation, not a different theme.

### Transition Between States

The step change should not feel like switching between unrelated pages.

The system should behave like a scene progression:

- Step 1 enters bright and cinematic
- moving into Step 2 lowers intensity
- Steps 2-4 remain stable in the darker operational treatment

The important principle is perceived scene progression, not decorative animation complexity.

## Tryon Layout

### Overall Structure

The route should stop feeling like a generic wizard page.

Instead, it should become:

- a strong entry scene in Step 1
- a restrained working stage in Steps 2-4

This does not require changing the underlying step logic.

### Step 1

Step 1 becomes the homepage handoff scene.

Requirements:

- fewer competing support elements
- stronger emphasis on one upload action
- page framing closer to a landing-section entry than a normal app form
- step/chapter marker present, but secondary

### Steps 2-4

These steps should retain the same route and logic, but shift into a more controlled editorial work mode.

Requirements:

- stronger containment around the content stage
- less open hero-like spacing than Step 1
- background still present, but visually subdued
- content readability clearly favored over spectacle

## Step Indicator

The step indicator should no longer read like a conventional process component.

It should become a scene or chapter marker.

Requirements:

- keep the same `currentStep` contract
- preserve clarity about where the user is
- remove the feeling of a software step tracker
- make it read like progression between scenes

## Header and Progression Framing

The top header and bottom advancement area should both align with homepage continuity.

### Header

Requirements:

- feel like a continuation of homepage narrative voice
- avoid product-dashboard or feature-banner energy
- support the background rather than compete with it

### Bottom Progression

Requirements:

- still support previous / next / generate actions
- keep existing interaction logic
- read more like scene advancement than form submission

## Interaction Rules

The following must remain behaviorally unchanged:

- auth bootstrap and redirect behavior
- person image upload
- clothing image upload
- clothing source switching
- image compression
- mode selection behavior
- generation request
- polling and progress updates
- retry behavior
- history-save behavior

Only visual structure, background treatment, copy hierarchy, and page pacing may change.

## Risks

### Risk 1: Step 1 becomes beautiful but impractical

If Step 1 leans too far into spectacle, the single required upload action will lose urgency.

Mitigation:

- keep one dominant action
- reduce secondary chrome
- ensure the upload stage remains visually obvious

### Risk 2: Steps 2-4 still feel like the old tool page

If the darker shared-background stage is too conservative, the route will still feel disconnected from the homepage.

Mitigation:

- reuse the same flower background system directly
- make the shift feel like dimmed continuity, not fallback styling

### Risk 3: Shared background harms task readability

If overlays are not strong enough in later steps, operational clarity will drop.

Mitigation:

- strengthen dim overlays on Steps 2-4
- prioritize foreground stage readability over background visibility in later steps

## Validation

Implementation will be considered complete when:

- Step 1 feels like a direct continuation of the homepage
- the same flower video background is clearly present in all tryon steps
- Steps 2-4 visibly use a dimmed version of the same world rather than a different theme
- step framing feels like scene progression rather than a generic workflow
- all existing tryon logic still behaves exactly as before
- `npm run lint` passes with no new errors
- route smoke check for `/tryon` succeeds

## Out of Scope Follow-Ups

These are explicitly deferred:

- changing `preview` again in this round
- redesigning homepage CTA behavior
- replacing raw `img` tags in this round
- merging `tryon` and `preview`
