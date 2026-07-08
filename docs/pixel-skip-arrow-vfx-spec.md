# Spec: Pixel Skip Arrow VFX

## Objective
Upgrade the Skip/Super Skip card VFX into a readable retro pixel arcade arrow effect. The effect should clearly communicate a card effect being activated: a large cyan/blue arrow pops in, flies toward the target direction, leaves square pixel particles, and lands with a visible impact afterglow.

## Tech Stack
Client VFX uses PixiJS v8 display objects and GSAP timelines in `client/src/vfx`.

## Commands
- Build: `npm run build --prefix client`
- Dev: `npm run dev --prefix client`

## Project Structure
- `client/src/vfx/VFXFactory.js` - card-specific VFX composition
- `client/src/vfx/PrimitiveEffects.js` - reusable Pixi/GSAP primitives
- `docs/` - feature specs and implementation notes

## Code Style
Use existing Pixi containers, `PrimitiveEffects.makePixelRect`, `PALETTE`, `getFxScale`, and GSAP timeline helpers. Prefer square/blocky shapes and `steps(...)` easing for arcade motion.

## Testing Strategy
This change is visual and timeline-based. Verify by running the client build and, when possible, triggering Skip/Super Skip in the browser to confirm no console/runtime errors and the effect remains readable.

## Boundaries
- Always: keep particles square, maintain black arrow outline, clean up Pixi objects after the timeline.
- Ask first: adding new runtime dependencies or replacing the VFX pipeline.
- Never: focus on card-play animation instead of the arrow effect, use soft smoke/circle particles, or shorten the effect below the requested readable duration.

## Success Criteria
- Skip/Super Skip uses a chunky black-outlined blue/cyan pixel arrow.
- The sequence has spawn/pop, fly/trail, and impact/afterglow phases.
- Normal motion lasts about 3 seconds; reduced motion remains shorter.
- Trail particles are square blocks with cyan/blue/white variation, different sizes, fade/shrink, and linger after impact.
- Impact includes pixel debris plus ring/ray afterglow.
