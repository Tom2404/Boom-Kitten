# Retro Pixel Modal System v1

## Objective

Unify user-facing confirmations, card details, Favor, See/Alter the Future,
and the Victory/Defeat result view with the active game's warm paper and dark
CRT retro-pixel language.

## Runtime contract

- Result screens retain their existing snapshot, ten-second deadline, and
  client-local Skip behavior.
- Favor and Alter the Future derive an absolute `expiresAt` when the request
  reaches the client; UI countdowns use that deadline instead of interval
  subtraction.
- Alter the Future reorders only local card state until confirmation and sends
  the existing ordered card-id payload.
- No route, server state, socket event, payload, dependency, or admin-console
  UI changes.

## UI contract

- A shared pixel dialog shell owns portal layering, scroll locking, focus
  trapping/restoration, Escape policy, and paper/CRT presentation.
- Forced game interactions cannot be dismissed by backdrop or Escape.
- Card selection and the INFO action are separate native controls. INFO remains
  usable when game selection is disabled unless `hideInfo` is true.
- Alter the Future supports pointer/touch drag plus always-visible arrow
  controls and horizontal overflow.
- Vietnamese and English copy comes from the existing translation system.
- Reduced motion removes spatial/glitch motion without removing content,
  controls, or deadlines.

## Verification

- Client logic and source-contract tests: `npm test`
- Production compilation: `npm run build`
- Runtime checks: keyboard focus, no console errors, and layouts at 320, 768,
  1024, and 1440 CSS pixels.

