# Spec: Game Board Experience Upgrade

## Objective

Upgrade the active Boom Kitten match screen without changing its routes, socket contracts, game rules, brand identity, or card assets. The result must preserve the Pop Art character while making the current turn, available action, player hand, opponents, and chat/log surfaces easier to understand and use on desktop and mobile.

## Tech Stack

- React 18 with Vite 5
- Tailwind CSS 3 plus `client/src/styles.css`
- Existing Framer Motion dependency
- Socket.io client state supplied through `GameContext`

## Commands

- Install: `npm install --prefix client`
- Test: `npm test --prefix client`
- Build: `npm run build --prefix client`
- Development: `npm run dev --prefix client`

## Project Structure

- `client/src/pages/Game/views/` - active match view composition
- `client/src/pages/Game/components/` - game header, table, side panel, and new focused UI components
- `client/src/components/` - reusable card, hand, deck, discard, and avatar components
- `client/src/utils/` - pure display-state helpers and translations
- `client/test/` - Node unit tests for pure UI behavior
- `client/src/styles.css` - global game theme tokens and motion fallbacks

## Code Style

Use focused React components, semantic HTML, existing context state, mobile-first Tailwind classes, and semantic game tokens.

```jsx
<section className="game-panel" aria-labelledby="game-turn-title">
  <h2 id="game-turn-title">Lượt của bạn</h2>
  <p>{instruction}</p>
</section>
```

## Testing Strategy

- Unit-test pure turn/status derivation with Node's built-in test runner.
- Run the client production build after every implementation slice.
- Verify DOM semantics, browser console, and layouts at 320, 768, 1024, and 1440 pixels.
- Manually cover normal turn, stacked draw, target selection, empty hand, sidebar, and missing game state.

## Boundaries

- Always: preserve game behavior, socket payloads, room flow, card assets, and existing user changes.
- Ask first: adding dependencies, changing routes, changing server contracts, or changing game rules.
- Never: replace the brand, remove accessibility behavior, commit secrets, or alter unrelated pages.

## Success Criteria

- One primary turn banner communicates whose turn it is and what happens next.
- Desktop and mobile layouts have no horizontal page overflow at the target widths.
- Deck, discard, action prompt, and hand remain reachable without navigating between pages.
- Mobile chat/log uses a compact drawer-like surface rather than consuming the main board width.
- Missing game state renders a meaningful loading/recovery state instead of a blank screen.
- Icon buttons have accessible names; chat/log uses tab semantics; important status is not color-only.
- Continuous motion respects `prefers-reduced-motion` and no more than one decorative perpetual animation remains prominent.
- Pop Art tokens, radii, borders, and shadows follow one documented gameplay system.
- `npm test --prefix client` and `npm run build --prefix client` pass.

## Approved Implementation Order

1. Game theme tokens and display-state tests.
2. Turn banner, action hierarchy, and desktop board shell.
3. Mobile layout and touch-friendly player hand.
4. Loading/recovery states and accessibility.
5. Motion, copy, and inactive-control cleanup.

## Open Questions

None blocking. Settings/help/audio behavior remains existing behavior; controls without a working handler will be clearly disabled or removed from the active hierarchy.
