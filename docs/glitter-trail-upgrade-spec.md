# Spec: Glitter Dust Trail Upgrade

## Objective

Replace the current evenly spaced square-pixel trail with a layered, texture-based glitter/dust trail that feels organic while preserving the existing `PrimitiveEffects.createPixelTrail()` API and every current call site.

## Tech Stack

- PixiJS 8 for rendering and reusable particle textures.
- `@pixi/particle-emitter` 5 for continuous emission and particle lifecycles.
- GSAP 3 for sequencing the emitter head from `start` to `end`.
- Node's built-in test runner for deterministic logic tests.

## Commands

- Test: `npm test`
- Build: `npm run build`
- VFX asset validation: `npm run validate:vfx`
- VFX registry validation: `npm run validate:vfx-registry`

Run commands from `client/`.

## Project Structure

- `client/src/vfx/ParticleManager.js`: reusable textures, emitter creation, update, and cleanup.
- `client/src/vfx/PrimitiveEffects.js`: compatibility API and GSAP trajectory orchestration.
- `client/src/vfx/config/vfxQuality.js`: device-sensitive particle budget.
- `client/test/`: deterministic unit tests for trail configuration and sampling.

## Code Style

```js
const trail = particleManager.createGlitterTrail({ color, accent, count, size, spread });
trail?.start(start);
trail?.moveTo(position);
trail?.stop();
```

Use focused methods, safe no-op behavior before VFX initialization, transform-only animation, and explicit cleanup.

## Testing Strategy

- Unit-test pure trail configuration: palette weighting, quality budget, lifetime, texture layers, and deterministic seeded sampling.
- Run the complete client test suite.
- Build the production client to catch bundler and Pixi API incompatibilities.
- Runtime-check the game canvas for console errors and visible cleanup where a local game flow is available.

## Boundaries

- Always: preserve current call sites, reduced-motion behavior, quality budgets, and emitter cleanup.
- Ask first: adding dependencies, changing global VFX timing, or replacing the VFX renderer.
- Never: modify server game logic, unrelated UI work, or user-owned changes already present in the worktree.

## Success Criteria

- Trail particles emit continuously behind a moving head rather than appearing pre-laid on a line.
- The visual has three depth cues: soft dust, irregular flecks, and rare bright sparkles.
- Particle size, lateral drift, lifetime, rotation, and palette selection are non-periodic.
- Existing `createPixelTrail(vfxManager, start, end, options)` calls continue to work unchanged.
- Reduced-motion emits at most eight particles and completes quickly.
- Emitters stop and destroy themselves after their final particle expires.
- Client tests, production build, and VFX validators pass.

## Open Questions

None. The approved direction is to keep the current dependencies and upgrade the implementation in place.
