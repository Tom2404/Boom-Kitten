# Spec: Game Motion Experience Upgrade

## Objective

Upgrade the in-match experience with clear, responsive animation for drawing and
playing cards, drawing a kitten, using Defuse, and reaching Victory or Defeat.
Animations must communicate game state without delaying or changing server-owned
rules.

## Tech Stack

- React 18
- Framer Motion 12 for React layout, overlays, and micro-interactions
- Existing GSAP card-play presentation for DOM flight paths and Nope resolution
- Existing Pixi/VFX manager for particles and screen shake
- Node's built-in test runner

## Commands

- Test: `npm test --prefix client`
- Build: `npm run build --prefix client`
- Dev: `npm run dev --prefix client`

## Project Structure

- `client/src/components/` — shared card and action-modal UI
- `client/src/pages/Game/` — match views, overlays, and game presentation state
- `client/src/vfx/` — GSAP/Pixi animation controllers and registries
- `client/test/` — small deterministic behavior and source-contract tests

## Code Style

Keep animation state local to the component that renders it and preserve the
existing event/state ownership:

```jsx
const reduceMotion = useReducedMotion();

<motion.div
  initial={reduceMotion ? false : { opacity: 0, scale: 0.9 }}
  animate={{ opacity: 1, scale: 1 }}
  exit={{ opacity: 0, scale: 0.96 }}
/>
```

Use existing palette, typography, card art, and VFX anchors. Do not introduce a
second animation owner for an element already controlled by GSAP.

## Testing Strategy

- Unit-test deterministic motion configuration and presentation-state helpers.
- Keep existing card-play presentation tests green.
- Verify production bundling after each completed vertical slice.
- Manually verify draw, play/Nope, Defuse, explosion, Victory, and Defeat at
  desktop and mobile widths.

## Boundaries

- Always: clean timers/timelines on unmount and honor reduced-motion preferences.
- Always: keep socket events and game rules authoritative.
- Ask first: new dependencies, new server events, or replacing GSAP/Pixi.
- Never: delay a required game response solely to finish decorative animation.
- Never: animate the same DOM element concurrently with Framer Motion and GSAP.

## Success Criteria

- A newly drawn card has a staged enter, readable reveal, and exit into the hand.
- Card selection/play has immediate feedback and the existing
  hand-to-center-to-discard/Nope flow remains correct.
- Kitten and explosion events provide distinct, targeted feedback.
- Defuse clearly communicates neutralization and reinsertion without changing the
  response contract.
- Victory and Defeat use distinct staged presentations with accessible controls.
- Rapid events, leaving a room, and reduced-motion mode do not leave stale UI.
- Client tests and production build pass.

## Approved Implementation Order

1. Shared motion configuration and draw reveal.
2. Card play feedback and resolved-card accents.
3. Kitten/explosion and Defuse sequences.
4. Victory/Defeat choreography.
5. Cleanup, reduced-motion audit, full verification.

## Open Questions

None. The user approved the scope and implementation plan on 2026-07-28.
