# Spec: Card-centric action presentation

## Objective

Replace action-card-specific PNG cinematics with one authoritative presentation flow:

`source card/avatar -> screen center -> readable title and summary -> optional Nope chain -> discard pile -> visual board transition`

The server remains authoritative and updates game state without waiting for client animation. The client temporarily masks already-applied discard/turn changes so presentation order still matches the game logic.

## Approved behavior

- A locally played card starts from its captured card bounds; a remote card starts from that player's avatar.
- The focused card uses the real card art, a 25% backdrop, a `1 -> 1.1` center scale, and localized title/short summary.
- Non-Nope flow targets roughly 1.4-1.8 seconds.
- Nopeable cards remain centered until the server result. Nope cards stack on the focused card and share its stable presentation identity.
- Odd Nope parity shows `Đã bị vô hiệu hóa`; even parity resolves the original action.
- The main card and every Nope card land on the discard pile before the real discard cards are revealed.
- Reduced-motion users get fades and short scale changes instead of long travel, shake, or rotation.
- Existing Howler/SoundManager infrastructure is reused for paper-flight and card-drop sounds.

## Event contract

- `presentationId`: created once per played action and stable for the full presentation.
- `eventId`: identifies the current response window and may change after every Nope.
- `game:cardPlayedPending`, `game:nopeWindow`, Nope `game:cardPlayed`, and `game:actionResolved` include the same `presentationId`.
- Client presentation code must tolerate Nope/result events arriving while the card is still flying to center.

## Timing

| Phase | Target |
| --- | ---: |
| Fly to center | 0.30s |
| Scale and text fade | 0.18s |
| Read hold (non-Nope) | 0.65s |
| Curved flight to discard | 0.35s |
| Discard bounce | 0.10s |

For a Nopeable action, the response window replaces the fixed read hold. After about 0.8 seconds the summary may become visually quieter while the card and response timer remain available.

## Tech stack and project structure

- Client: React 18, GSAP 3, Framer Motion, Howler, Vite.
- Server: Node.js, Socket.IO.
- Client presentation: `client/src/vfx/CardPlayPresentationController.js` and `client/src/components/CardFocusOverlay.jsx`.
- Socket orchestration: `client/src/pages/Game.jsx` and `server/sockets/gameSocket.js`.
- Tests: `client/test/*.test.js` and `server/test/*.test.js`.

## Code style

Use the existing JavaScript/module style and the smallest existing mechanism that covers the behavior. Prefer stable IDs and explicit state transitions over timing-based event correlation.

```js
const action = {
  eventId: createEventId(),
  presentationId: createPresentationId(),
  playerId,
  cardType,
  nopeCount: 0,
};
```

## Commands

```powershell
cd client
npm test
npm run validate:vfx
npm run validate:vfx-registry
npm run build

cd ../server
npm test
```

## Testing strategy

- Small Node tests cover stable presentation identity, legal state transitions, early result/Nope latching, Nope parity, and discard mask count.
- Existing client and server suites must remain green after each slice.
- Browser verification covers local/remote origins, no Nope, one Nope, double Nope, mobile sizing, reduced motion, mute, and disconnect cleanup.

## Boundaries

- Always: keep server state authoritative; preserve unrelated dirty-worktree changes; reuse GSAP/Howler already installed; keep localized visible text.
- Ask first: change game rules such as whether Reverse is Nopeable; add dependencies; remove special Exploding/Imploding Kitten feedback.
- Never: delay server resolution on client animation acknowledgements; expose private hand/card identifiers to other players; delete assets before all runtime references and validators are removed.

## Success criteria

- Every action presentation uses one stable `presentationId`.
- A card visibly starts from the correct local card or remote avatar.
- The focused card shows localized title and concise summary.
- Nope cards stack and resolve correctly for odd/even chains.
- No duplicate real/clone cards appear on the discard pile.
- Regular action cards no longer trigger the legacy PNG cinematic pipeline.
- No deleted asset produces a request or validation failure.
- Client/server tests, VFX validators, and the production client build pass.

## Deliberate scope decisions

- Reverse keeps its current Nopeability rule until the game rule is explicitly changed.
- `explosion-sheet.png` and critical draw/explosion feedback remain in scope as environmental/special-event VFX, not regular action-card presentation.
