# Spec: Retro Pixel Game Operations Dashboard

## Objective

Redesign the existing Boom-Kitten Admin Console as a compact retro-pixel game operations dashboard while preserving all routes, authorization checks, CRUD behavior, request payloads, and server contracts.

## Tech Stack

- React 18 with Vite
- Tailwind CSS and the existing global Boom-Kitten design tokens
- Existing admin API wrapper and Express admin endpoints
- Pixelify Sans for dense pixel UI; existing display font for headings

## Commands

- Build: `npm run build --prefix client`
- Run client: `npm run dev --prefix client`
- Run server tests: `npm test --prefix server`

## Project Structure

- `client/src/pages/admin/` — admin shell, panels, API hook, and shared primitives
- `client/src/styles.css` — global fonts and Boom-Kitten visual tokens
- `server/routes/admin.js` — existing contracts; out of scope for modification

## Code Style

Use focused React components, semantic HTML, Tailwind classes based on the existing `--pop-*` palette, and native controls for keyboard accessibility. Data fetching remains in panel containers and shared UI primitives remain presentation-only.

## Testing Strategy

- Build the production client after each coherent slice.
- Exercise existing server tests to ensure no backend regression.
- Runtime-check the admin shell at mobile, tablet, and desktop widths when a usable local authenticated environment is available.
- Verify keyboard focus, dialog behavior, loading, empty, success, and error states.

## Boundaries

- Always: preserve existing admin endpoints, payloads, routes, permissions, CRUD operations, responsive layouts, and audit reasons.
- Ask first: add dependencies, change server routes, or introduce new data models.
- Never: fake unsupported pending-report data, implement incorrect page-local rank filtering, or represent repeated single-user requests as atomic bulk operations.

## Success Criteria

- Shared admin surfaces use cream backgrounds, 3–4px dark pixel borders, square corners, block shadows, and the Boom-Kitten semantic arcade palette.
- Navigation has pixel icons, strong active/focus states, and remains responsive.
- Overview shows Total Players, Online Players, Active Rooms, Active Seasons from the existing seasons endpoint, Banned Accounts, and accurately labelled economy totals from the existing stats endpoint.
- Player operations include avatar identity, rank/ELO/currency badges, supported search/role/status/sort filters, explicit Search/Reset controls, sticky zebra table rows, a keyboard-accessible Manage menu, and a separate Ban/Unban action.
- Quick actions route into existing announcement, season, player currency, export-current-page, and reset-season workflows.
- Remaining admin panels inherit the same shared visual system without behavioral changes.

## Approved Scope Decisions

- Replace unsupported Pending Reports with Banned Accounts.
- Calculate active seasons client-side from `GET /api/admin/seasons`.
- Use the existing stats response for lifetime economy totals and label it accurately.
- Export only selected or currently loaded users without introducing a backend export route.
- Defer true rank filtering and atomic bulk mutations.
