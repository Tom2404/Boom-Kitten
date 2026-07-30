# Game Result Screen v1

## Objective

Show Victory/Defeat as a dedicated full-screen Game view for 10 seconds. Each
client may skip independently, then returns to the same room's waiting screen.

## Runtime contract

- `game:ended` captures the final public game snapshot and a wall-clock
  dismissal deadline.
- The existing `room:playAgain` event resets the authoritative room once; it
  does not dismiss result screens on other clients.
- A waiting-room update must not dismiss an active result screen.
- Host readiness resets to ready; every other player must ready again.
- No new route, socket event, dependency, or persisted result state is added.

## UI contract

- Result content replaces the board in document flow and fills at least one
  dynamic viewport height.
- Victory and Defeat have distinct visual treatments.
- A visible countdown and one Skip button are the only result actions.
- Reduced-motion users receive the same 10-second reading time without spatial
  or looping decorative animation.
- Result copy uses the existing Vietnamese/English translation system.

## Verification

- Client: `npm test`, `npm run build`
- Server: `npm test`
- Manual: two clients receive the result; one skips without dismissing the
  other; both reveal the same waiting room no later than their own deadline.

