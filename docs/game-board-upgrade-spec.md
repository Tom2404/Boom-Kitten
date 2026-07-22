# Spec: Game Board Experience Upgrade

## Objective

Upgrade the active Boom Kitten match screen without changing its routes, socket contracts, game rules, brand identity, or card assets. The result must evolve the existing Pop Art character into a distinct modern retro-pixel game HUD while making the current turn, available action, player hand, opponents, and chat/log surfaces easier to understand and use on desktop and mobile.

## Tech Stack

- React 18 with Vite 5
- Tailwind CSS 3 plus `client/src/styles.css`
- Existing Framer Motion dependency
- Socket.io client state supplied through `GameContext`

## Commands

- Install: `npm install --prefix client`
- Test: `npm test --prefix client`
- Server test: `npm test --prefix server`
- Build: `npm run build --prefix client`
- Development: `npm run dev --prefix client`

## Project Structure

- `client/src/pages/Game/views/` - active match view composition
- `client/src/pages/Game/components/` - game header, table, side panel, and new focused UI components
- `client/src/components/` - reusable card, hand, deck, discard, and avatar components
- `client/src/utils/` - pure display-state helpers and translations
- `client/test/` - Node unit tests for pure UI behavior
- `client/src/styles.css` - global game theme tokens and motion fallbacks
- `server/game/interactions/` - interaction participant and response authorization
- `server/sockets/` - participant-only request delivery and reconnect recovery
- `server/test/` - Node unit tests for multiplayer interaction contracts

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
- Unit-test participant selection, response authorization, Nope-pass eligibility, reconnect request recovery, and public-state privacy with Node's built-in test runner.
- Run the client production build after every implementation slice.
- Verify DOM semantics, browser console, and layouts at 320, 768, 1024, and 1440 pixels.
- Manually cover normal turn, stacked draw, target selection, empty hand, sidebar, and missing game state.

## Boundaries

- Always: preserve intended game behavior, room flow, card assets, and existing user changes; reject interaction responses from non-participants at the server boundary.
- Ask first: adding dependencies, changing routes, or changing game rules. Backward-compatible socket payload hardening required by this spec is approved.
- Never: replace the brand, remove accessibility behavior, commit secrets, alter unrelated pages, regenerate card artwork, edit card image files, or change `getCardImageUrl` and its skin-selection behavior.

## Success Criteria

- One primary turn banner communicates whose turn it is and what happens next.
- Desktop and mobile layouts have no horizontal page overflow at the target widths.
- Deck, discard, action prompt, and hand remain reachable without navigating between pages.
- Desktop chat/log overlays the board in a 320-360px activity drawer rather than shrinking it; mobile uses a compact full-height drawer/bottom-sheet treatment.
- Missing game state renders a meaningful loading/recovery state instead of a blank screen.
- Icon buttons have accessible names; chat/log uses tab semantics; important status is not color-only.
- Continuous motion respects `prefers-reduced-motion` and no more than one decorative perpetual animation remains prominent.
- Retro-pixel game tokens, clipped corners, borders, icons, and shadows follow one documented gameplay system without pixelating the card images.
- Opponents use a compact horizontal rail; the active player has one primary amber indicator instead of stacked glow, bounce, sticker, and badge effects.
- The player hand rests on a neutral dock and only switches to a danger treatment for forced discard or other blocking states.
- Existing card images render through the current `Card` component and current `skinIndex` values without source or asset changes.
- Every interactive card opens a response form only for its configured participants: Favor for the target; Garbage Collection and Pot Luck for all living players; Feed the Dead for living non-owners; Grave Robber for eligible dead players; Armageddon for its stage owner or selected target; owner-only actions for their owner.
- A participant reconnecting during an unresolved interaction receives the same request with the remaining timeout; a participant who already responded receives a waiting state instead of a second form.
- The player who initiated a normal Nope window cannot count as a responder or end that window early by passing.
- Public game state does not expose private interaction metadata, response payloads, or hidden cards to non-participants.
- `npm test --prefix client`, `npm test --prefix server`, and `npm run build --prefix client` pass.

## Approved Implementation Order

1. Retro-pixel game tokens and pure UI-state tests.
2. Turn HUD, compact opponent rail, table core, and neutral hand dock.
3. Overlay activity drawer with accessible chat/log tabs and mobile treatment.
4. Loading/recovery states, keyboard interaction, and focus behavior.
5. Multiplayer response-form contracts, Nope eligibility, reconnect recovery, and public-state privacy.
6. Responsive verification, motion budget, copy cleanup, and regression checks.

## Open Questions

None blocking. Settings/help/audio behavior remains existing behavior; controls without a working handler will be clearly disabled or removed from the active hierarchy.
