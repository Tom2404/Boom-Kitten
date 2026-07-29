# Spec: Admin Dashboard Upgrade

## Objective

Turn the existing Admin overview into a decision-oriented operations dashboard, then make Shop and Quest lists easier to scan without expanding the product into a new analytics, Live Ops, audit-log, or bulk-jobs system.

The primary user is an admin or super admin managing players, catalog content, quests, and tournaments. Success means the overview explains current state, recent change, and items requiring attention while preserving the existing permission and mutation safety model.

## Tech Stack

- Client: React 18, Vite 5, Tailwind CSS 3
- Server: Express 4, Mongoose 8
- Tests: Node.js built-in test runner
- Charts: native HTML/SVG only; no new dependency

## Commands

- Client tests: `npm test --prefix client`
- Client build: `npm run build --prefix client`
- Server tests: `npm test --prefix server`
- Development: `npm run dev`

## Project Structure

- `client/src/pages/admin/` — Admin shell, panels, and shared UI primitives
- `client/test/` — Client behavior and source-contract tests
- `server/routes/admin.js` — Admin overview HTTP endpoint
- `server/services/admin/` — Testable Admin business logic
- `server/test/` — Server unit and route tests
- `docs/` — Approved feature specifications

## Code Style

Reuse existing Admin tokens and primitives. Keep data transformation in small pure functions and keep rendering straightforward.

```js
const rangeDays = value === '7' ? 7 : 30;
const response = await getAdminOverview({ rangeDays });
return res.json({ success: true, data: response });
```

## Testing Strategy

- Write failing small tests for date range normalization, zero-filled daily series, period comparison, and attention summaries.
- Keep database aggregation behind injected models so unit tests need no database.
- Use existing client source-contract tests for accessibility and permission wiring.
- Verify the complete client build and both existing test suites after all slices.

## Boundaries

- Always: preserve existing overview fields, enforce `dashboard.read`, provide loading/error/empty states, keep charts accessible with visible values or a table fallback.
- Ask first: database schema changes, new dependencies, CI changes, new Admin navigation areas.
- Never: fabricate analytics, expose controls without permission, add realtime charts for periodic data, implement Live Ops/Audit/Bulk Jobs as part of this goal.

## Success Criteria

- `/api/admin/overview?range=7|30` returns `generatedAt`, existing counts, contextual ratios/breakdowns, comparison data, a zero-filled daily game series, and attention items.
- The overview shows contextual KPI cards, one daily-games trend, attention items, resource summaries, refresh time, and a 7/30-day selector.
- Overview quick actions are permission-aware.
- Shop and Quest panels provide client-side summaries, search, filters, reset, and distinct empty-filter states without extra requests.
- Error announcements, skip navigation, shared touch targets, loading labels, and action icons are accessible and consistent.
- Server tests, client tests, and client production build pass.

## Approved Scope Notes

- Preserve the existing light Admin design system and responsive shell.
- Prefer deletion or reuse over new abstractions.
- Use native SVG only if it remains smaller than adding and configuring a chart package.
- The user approved this specification through the preceding Admin audit and implementation plan.

## Open Questions

None. The approved defaults are a 30-day initial range, a 7-day alternate range, and Asia/Bangkok-independent UTC date buckets in the API.
