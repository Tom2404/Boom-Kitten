# Implementation Plan: Original Edition Card VFX

## Overview

Build polished card-specific visual effects for the Original Edition cards by extending the existing PixiJS/GSAP VFX system. `Skip.mp4` is treated as a visual reference only; the production path should prefer procedural VFX built from Pixi graphics, sprites, particles, transforms, opacity, screen shake, and camera primitives. Video assets remain an optional fallback for effects that cannot be recreated convincingly with code.

## Current Context

- `client/src/components/VFXOverlay.jsx` mounts the Pixi canvas and initializes `vfxManager`.
- `client/src/vfx/CardAnimations.js` registers card animation keys such as `CARD_SKIP`, `CARD_SHUFFLE`, and `CARD_DEFUSE`.
- `client/src/vfx/VFXFactory.js` creates the actual timelines with GSAP and Pixi display objects.
- `client/src/pages/Game.jsx` listens to confirmed server events such as `game:cardPlayed` and calls `window.vfxManager?.playAnimation(...)`.
- `Skip.mp4` is currently imported in `VFXFactory.js`; it is 10 seconds, 1280x720, around 2.76 MB, and includes audio. This is too heavy as the primary pattern for every basic card effect.

## Architecture Decisions

- Use the existing VFX layer, not `Card.jsx`, for cinematic card effects.
- Trigger effects from server-confirmed events, especially `game:cardPlayed`, so rejected card plays do not animate.
- Keep `PlayerHand` and Framer Motion responsible for hand layout and card selection motion.
- Use GSAP timelines inside `VFXFactory.js` for sequenced effects.
- Add reusable Pixi primitives to `PrimitiveEffects.js` only when at least two card effects need the same behavior.
- Prefer transform, scale, rotation, alpha, and Pixi graphics over layout or DOM animation.
- Respect reduced motion by providing a short flash/fade fallback before broadening the effect set.

## Original Edition Scope

Primary card effects:

- `skip`
- `attack` / `attack_2x`
- `shuffle`
- `favor`
- `see_the_future_3`
- `nope`
- `defuse`
- `exploding_kitten`

Secondary/fallback effects:

- Normal cat cards and cat combos
- Unknown or unmapped action cards

## Task List

### Phase 1: VFX Foundation

## Task 1: Normalize Original Edition Animation Keys

**Description:** Align real card types emitted by the game with the keys registered in `CardAnimations.js`. Make sure `CARD_ATTACK`, `CARD_ATTACK_2X`, `CARD_SEE_THE_FUTURE_3`, `CARD_DRAW_FROM_BOTTOM`, and cat-card fallbacks resolve predictably instead of relying on mismatched names like `SEE_THE_FUTURE_3X`.

**Acceptance criteria:**

- [ ] Every Original Edition action card type maps to a registered animation key.
- [ ] Unknown card types fall back to a generic card flash animation.
- [ ] Existing expansion keys such as Zombie-specific cards keep working.

**Verification:**

- [ ] Manually trigger each Original Edition card and confirm no `No animation registered` warning appears.
- [ ] Run `npm run build` from the client or repo script used by this project.

**Dependencies:** None

**Files likely touched:**

- `client/src/vfx/CardAnimations.js`
- `client/src/vfx/VFXFactory.js`

**Estimated scope:** Small

## Task 2: Add Shared Procedural VFX Helpers

**Description:** Add reusable helpers for streaks, rings, stamp text, burst lines, and temporary Pixi display object cleanup. These helpers should reduce duplicated Pixi creation/destruction code across card effects.

**Acceptance criteria:**

- [ ] Helpers destroy temporary Pixi objects after their timelines finish.
- [ ] Helpers use `alpha`, `scale`, `rotation`, `x`, and `y` animation paths.
- [ ] Helpers can be composed inside existing GSAP timelines.

**Verification:**

- [ ] Play 10 card animations in a row and confirm no visible leftover objects remain.
- [ ] Inspect console for Pixi/GSAP runtime errors.

**Dependencies:** Task 1

**Files likely touched:**

- `client/src/vfx/PrimitiveEffects.js`
- `client/src/vfx/VFXFactory.js`

**Estimated scope:** Medium

### Checkpoint: Foundation

- [ ] VFX registry covers Original Edition keys.
- [ ] Generic fallback works.
- [ ] Temporary VFX objects clean up reliably.

### Phase 2: Skip Prototype

## Task 3: Replace Skip Video With Procedural Skip Effect

**Description:** Recreate the non-card-playing part of `Skip.mp4` as a code-driven effect: card flies to center, cyan/sky speed streaks cut across the screen, skip arrows burst forward, camera briefly zooms out, and the card exits quickly toward discard.

**Acceptance criteria:**

- [ ] `CARD_SKIP` does not depend on `Skip.mp4` for the main effect.
- [ ] Effect duration is about 1.2 to 1.8 seconds.
- [ ] Visual language resembles the video reference without embedding the full video.
- [ ] `CARD_SUPER_SKIP` can reuse the same effect with stronger scale/color/intensity.

**Verification:**

- [ ] Play `skip` locally and confirm the effect appears after successful card play.
- [ ] Confirm network/bundle no longer requires loading `Skip.mp4` for `CARD_SKIP`.
- [ ] Test at desktop and narrow mobile viewport.

**Dependencies:** Tasks 1-2

**Files likely touched:**

- `client/src/vfx/VFXFactory.js`
- `client/src/vfx/PrimitiveEffects.js`

**Estimated scope:** Medium

## Task 4: Add Reduced-Motion Path

**Description:** Add a reduced-motion branch for VFX, starting with Skip. Users with `prefers-reduced-motion: reduce` should see a short center flash and card fade instead of fast streaks and camera motion.

**Acceptance criteria:**

- [ ] Reduced-motion users avoid large camera zoom, shake, and fast full-screen movement.
- [ ] Normal-motion users keep the full Skip effect.

**Verification:**

- [ ] Emulate reduced motion in browser dev tools and play `skip`.
- [ ] Confirm the effect remains understandable.

**Dependencies:** Task 3

**Files likely touched:**

- `client/src/vfx/VFXFactory.js`
- `client/src/vfx/PrimitiveEffects.js`

**Estimated scope:** Small

### Checkpoint: Skip Complete

- [ ] Skip effect is code-driven.
- [ ] `Skip.mp4` is no longer required by the main VFX factory path.
- [ ] Reduced-motion path works.

### Phase 3: Original Edition Effects

## Task 5: Implement Attack And Nope Effects

**Description:** Polish the aggressive/cancel effects. Attack should use impact lines, orange/red slash or hit burst, and screen shake. Nope should use a stamp/slash cancel moment with strong readability.

**Acceptance criteria:**

- [ ] `attack` and `attack_2x` share a family but differ in intensity.
- [ ] `nope` is readable at a glance and short enough not to stall play.
- [ ] Effects clean up all temporary Pixi objects.

**Verification:**

- [ ] Trigger attack variants and Nope through real game events.
- [ ] Confirm no overlapping stale text remains after repeated Nope plays.

**Dependencies:** Tasks 1-2

**Files likely touched:**

- `client/src/vfx/VFXFactory.js`
- `client/src/vfx/PrimitiveEffects.js`

**Estimated scope:** Medium

## Task 6: Implement Shuffle And See The Future Effects

**Description:** Build deck-focused information effects. Shuffle should create a swirling deck/tornado cue. See The Future should show top-card peek silhouettes or layered cards with violet/cyan scan glow.

**Acceptance criteria:**

- [ ] `shuffle` visually communicates deck mixing.
- [ ] `see_the_future_3` visually communicates peeking at upcoming cards without revealing real private card data in the public VFX layer.
- [ ] Effects avoid long blocking timelines.

**Verification:**

- [ ] Trigger `shuffle` and `see_the_future_3`.
- [ ] Confirm private modal behavior still works separately.

**Dependencies:** Tasks 1-2

**Files likely touched:**

- `client/src/vfx/VFXFactory.js`
- `client/src/vfx/PrimitiveEffects.js`

**Estimated scope:** Medium

## Task 7: Implement Favor And Cat Combo Fallbacks

**Description:** Add softer interaction effects for Favor and cat combos. Favor should imply card transfer/request. Cat combos should have a lightweight playful burst instead of a generic flash.

**Acceptance criteria:**

- [ ] `favor` communicates one player requesting or pulling a card from another.
- [ ] Normal cat cards and combo-related card plays do not feel broken or unmapped.
- [ ] Effects remain short and do not obscure target-selection modals.

**Verification:**

- [ ] Trigger Favor with a selected target.
- [ ] Trigger cat combo play.

**Dependencies:** Tasks 1-2

**Files likely touched:**

- `client/src/vfx/VFXFactory.js`
- `client/src/vfx/CardAnimations.js`

**Estimated scope:** Medium

## Task 8: Polish Defuse And Exploding Kitten

**Description:** Upgrade the existing survival/death effects. Defuse should visibly absorb or shield the bomb. Exploding Kitten should stay dramatic but bounded, with shake, vignette, particles, and cleanup.

**Acceptance criteria:**

- [ ] `defuse` effect feels like a successful rescue, not a generic green flash.
- [ ] `exploding_kitten` effect remains dramatic but does not block UI longer than necessary.
- [ ] Existing pending defuse/explosion gameplay modals remain readable.

**Verification:**

- [ ] Draw Exploding Kitten with and without Defuse.
- [ ] Confirm screen flash and modals do not visually fight each other.

**Dependencies:** Tasks 1-2

**Files likely touched:**

- `client/src/vfx/VFXFactory.js`
- `client/src/vfx/ParticleManager.js`
- `client/src/vfx/PrimitiveEffects.js`

**Estimated scope:** Medium

### Checkpoint: Original Edition Complete

- [ ] All Original Edition action cards have recognizable VFX.
- [ ] No missing animation-key warnings for Original Edition cards.
- [ ] Repeated plays do not leak visible Pixi objects.
- [ ] Effects are readable on desktop and mobile.
- [ ] Reduced-motion mode remains usable.

## Risks And Mitigations

| Risk | Impact | Mitigation |
|---|---:|---|
| Animation key mismatch between game card types and VFX registry | High | Start with registry normalization and fallback behavior. |
| Video import increases bundle/network cost | Medium | Remove `Skip.mp4` from the main Skip path; keep it only as reference or optional dev asset. |
| Pixi object leaks after repeated effects | High | Centralize cleanup helpers and manually stress-test repeated effects. |
| Effects obscure gameplay modals | Medium | Keep timelines short and use VFX layers below UI popup where needed. |
| Too much motion on mobile or reduced-motion users | Medium | Add reduced-motion branch and test narrow viewport. |

## Open Questions

- Should `Skip.mp4` remain in the repo as a reference asset, or be removed after procedural Skip is approved?
- Should Original Edition cat combo effects be public for everyone, or only emphasized for the acting player?
- Should card-specific VFX block the animation queue, or should low-impact effects run as non-blocking `LOW` priority events?

## Recommended Implementation Order

1. Task 1: Normalize animation keys.
2. Task 2: Add shared procedural helpers.
3. Task 3: Rebuild Skip procedurally.
4. Task 4: Add reduced-motion behavior.
5. Task 5-7: Fill the rest of Original Edition effects.
6. Task 8: Polish high-drama survival/death effects last, after the primitives are stable.
