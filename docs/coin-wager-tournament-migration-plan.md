# Spec and Implementation Plan: Coin Wagers and Standalone Tournaments

## Status

Implemented and verified on 2026-07-26. The destructive gem conversion remains intentionally unapplied; its database dry-run is recorded below.

## Assumptions

1. Coin is an in-game currency with no cash-out.
2. Gems are not a paid premium currency and can be retired.
3. Legacy Season, rank, Elo, and gem data must remain auditable during migration.
4. Matchmaking uses a renamed, server-only rating calculator and never exposes that value as progression.
5. Tournament rewards use Coin and existing cosmetic inventory types: skin, emote, and avatar frame.
6. Gem balances convert once at `1 gem = 50 coins`; every conversion is idempotent and auditable.
7. Guests can play free/private games but cannot wager or enter paid Tournaments.

## Objective

Replace public ranked progression and Seasons with a simpler product:

- free/private games for practice and social play;
- Coin wager rooms with server-authoritative lock, settlement, and refund;
- standalone Tournaments with automatic match results, scoring, payouts, and direct cosmetic rewards;
- one visible currency, Coin;
- hidden skill-based matchmaking without public Elo, rank, rank rewards, or resets;
- Admin operations updated to manage the new economy, wagers, and Tournaments without legacy Season/rank/gem controls.

## Success Criteria

- No player or Admin UI exposes Season, rank, Elo, or gems.
- No active API awards or spends gems, resets a Season, or grants rank rewards.
- Existing gem balances can be converted exactly once and reconciled from transaction/audit records.
- Matchmaking continues to use a server-only rating; private/bot games do not affect it.
- Wager settlement is atomic, idempotent, conserves Coin, and supports deterministic refunds.
- A player can discover, register for, play, and receive rewards from a Tournament without routine Admin score entry.
- Admin can inspect wager state, resolve review-required cases, operate Tournament state/refunds/payouts, and audit all economy mutations.
- `npm test --prefix server`, `npm test --prefix client`, and `npm run build --prefix client` pass.

## Tech Stack and Commands

- Server: Node.js, Express, Socket.IO, Mongoose.
- Client: React 18, Vite, Socket.IO client.
- Server tests: `npm test --prefix server`
- Client tests: `npm test --prefix client`
- Client build: `npm run build --prefix client`
- Development: `npm run dev`

## Project Structure

- `server/models`: persisted users, transactions, matches, wagers, and Tournaments.
- `server/services`: economy, wager, Tournament, migration, and Admin workflows.
- `server/routes`: player and Admin REST contracts.
- `server/sockets`: authoritative room and match lifecycle.
- `client/src/pages`: player flows and Admin panels.
- `server/test`, `client/test`: behavior and contract checks.
- `docs`: migration contract, runbook, and API/event updates.

## Architecture Decisions

### One visible currency

- Coin is used for the shop, quest rewards, Tournament entry, Tournament cash prizes, and wagers.
- Wagers transfer Coin and do not mint Coin.
- Gems are frozen, converted once, then removed from active contracts.
- Legacy gem transactions remain readable for audit.

### Hidden matchmaking

- Keep the existing Elo calculation initially to minimize risk.
- Stop deriving public rank, awarding rank-up gems, or resetting the rating.
- Do not return the rating in public profile, match result, leaderboard, or Tournament payloads.
- Update the hidden rating only for completed authenticated public matches.

### Season retirement

- Remove active Season routes, socket lookups, UI, Admin navigation, permissions, and reset workflows.
- Stop writing `seasonId` to new match history.
- Preserve existing Season documents and historical `seasonId` values during the rollback window.

### Wager ledger

- A persisted wager record is the source of truth, not room memory or the client.
- State transitions are `created -> locked -> settled`, with `refunded` and `review_required` terminal alternatives.
- Each lock/settle/refund uses a unique request/reference key and conditional database update.
- Client displays only server-confirmed balances and settlement results.

### Standalone Tournament

- Tournament owns its schedule, registration, bracket, match references, score rules, rewards, and state.
- MVP format is eight players: two four-player groups, three group matches, then a five-match final for the top two from each group.
- Match completion submits results through the shared server match lifecycle.
- Admin override is exceptional, permission-gated, reason-required, and audited.

## Boundaries

### Always

- Test behavior before changing it.
- Keep economy operations atomic, idempotent, and audited.
- Preserve legacy data until conversion and reconciliation pass.
- Keep a free play path for players with no Coin.
- Validate all monetary and state-transition input on the server.

### Ask first

- Changing the `1:50` conversion rate after a real conversion has run.
- Enabling cash-out, real-money wagering, or gem purchases.
- Deleting archived Season/rank/gem data.
- Adding a new dependency.

### Never

- Trust wager amount, winner, balance, or Tournament score from the client.
- Allow gems to be wagered.
- Award gameplay power through Tournament cosmetics.
- Run a destructive migration without dry-run output and a rollback record.
- Delete failed tests to make the migration pass.

## Dependency Graph

```text
Migration contract and feature flags
  |-- hidden matchmaking / rank retirement
  |-- Season retirement
  |-- gem freeze and conversion
  |     `-- coin-only shop, quests, rewards, Admin economy
  |-- wager ledger
  |     `-- wager room socket/UI/Admin review
  `-- Tournament match integration
        `-- player Tournament UI and Admin operations

All slices
  `-- full regression, build, dry-run, runbook, dead-code cleanup
```

## Implementation Tasks

### Phase 1: Contracts and safety net

#### Task 1: Freeze the migration contract

**Acceptance**

- Feature flags and data-retention rules are documented.
- Conversion rate, wager states, and Tournament result contract have one canonical definition.
- Rollback conditions are explicit.

**Verify**

- Review this document against current models/routes.
- Confirm the working tree contains no unrelated edits.

**Likely files**

- `docs/coin-wager-tournament-migration-plan.md`
- `docs/SOCKET_EVENTS.md`

**Dependencies:** None. **Scope:** S.

#### Task 2: Add pure contract tests

**Acceptance**

- Tests specify gem conversion idempotency and integer safety.
- Tests specify wager allocation/conservation and valid state transitions.
- Tests specify hidden matchmaking update eligibility.

**Verify**

- New tests fail for missing behavior before implementation.
- Run targeted Node tests.

**Likely files**

- `server/test/currencyMigration.test.js`
- `server/test/wagerService.test.js`
- `server/test/matchmakingRating.test.js`

**Dependencies:** Task 1. **Scope:** M.

### Checkpoint 1

- New contract tests fail for the intended missing behavior.
- Existing server/client suites establish a clean baseline.

### Phase 2: Retire Season and public rank

#### Task 3: Stop Season behavior on the server

**Acceptance**

- New matches no longer query or write an active Season.
- Season reset and mutation endpoints are unavailable.
- Historical Season and match data remain readable in MongoDB.

**Verify**

- Match lifecycle tests prove `seasonId` is no longer required.
- Removed endpoints return 404 and server tests pass.

**Likely files**

- `server/sockets/gameSocket.js`
- `server/services/matchLifecycleService.js`
- `server/index.js`
- `server/routes/admin.js`
- `server/test/matchLifecycle.test.js`

**Dependencies:** Task 2. **Scope:** M.

#### Task 4: Remove Season from player and Admin clients

**Acceptance**

- No Season fetch, banner, countdown, navigation, action, or translation is reachable.
- Admin permission payload/navigation no longer advertises Season capabilities.

**Verify**

- Client navigation/permission tests pass.
- Client production build contains no unresolved Season imports.

**Likely files**

- `client/src/pages/Game.jsx`
- `client/src/pages/Game/components/LobbyHomeView.jsx`
- `client/src/pages/admin/AdminPage.jsx`
- `server/utils/adminPermissions.js`
- `client/test/adminNavigation.test.js`

**Dependencies:** Task 3. **Scope:** M.

#### Task 5: Decouple hidden rating from rank and rewards

**Acceptance**

- Saving a changed rating never changes rank or grants gems.
- Match completion updates the rating only when eligible.
- No Season reset or tier protection affects the rating.

**Verify**

- Unit tests cover public/private/guest/bot eligibility.
- Match completion tests assert no rank/gem side effects.

**Likely files**

- `server/models/User.js`
- `server/sockets/gameSocket.js`
- `server/utils/eloCalculator.js`
- `server/test/matchmakingRating.test.js`
- `server/test/gameSocketRating.test.js`

**Dependencies:** Task 2. **Scope:** M.

#### Task 6: Remove public rank/Elo contracts and Admin controls

**Acceptance**

- Public profile, results, leaderboard, Tournament eligibility, Admin player operations, bulk jobs, and analytics do not expose or mutate rank/Elo.
- Existing legacy fields remain stored during the rollback window.

**Verify**

- API redaction and Admin capability tests pass.
- Client tests/build pass without rank UI.

**Likely files**

- `server/routes/user.js`
- `server/routes/leaderboard.js`
- `server/routes/admin.js`
- `client/src/pages/Profile.jsx`
- `client/src/pages/Game/Modals/GameEndedOverlay.jsx`

**Dependencies:** Task 5. **Scope:** M.

### Checkpoint 2

- A public match still completes and records stats.
- No Season/rank/Elo UI or reward remains.
- Full tests/build pass.

### Phase 3: Coin-only economy

#### Task 7: Implement idempotent gem conversion

**Acceptance**

- Dry-run reports affected users, gems retired, Coin issued, and invalid records.
- Apply mode converts each user at most once at `1:50`.
- Every conversion has transaction and Admin audit evidence.

**Verify**

- Repeat/concurrency tests prove no double conversion.
- Dry-run makes no database mutations.

**Likely files**

- `server/services/admin/currencyMigrationService.js`
- `server/models/User.js`
- `server/models/Transaction.js`
- `server/routes/admin.js`
- `server/test/currencyMigration.test.js`

**Dependencies:** Task 2. **Scope:** M.

#### Task 8: Convert shop, quests, rewards, and Tournament payouts to Coin

**Acceptance**

- Active schemas/routes accept and award Coin only.
- Existing gem-priced shop items have deterministic converted Coin prices.
- Tournament payout calculations no longer produce gems.

**Verify**

- Shop purchase, quest claim, daily reward, and Tournament payout tests pass.
- No active route increments or decrements `gems`.

**Likely files**

- `server/routes/shop.js`
- `server/routes/mission.js`
- `server/routes/user.js`
- `server/services/admin/tournamentService.js`
- `server/test/adminTournaments.test.js`

**Dependencies:** Task 7. **Scope:** M.

#### Task 9: Make player and Admin UI coin-only

**Acceptance**

- Wallet, profile, shop, quests, Tournament, economy adjustment, bulk jobs, and analytics use Coin only.
- Legacy gem records remain legible in historical audit views.

**Verify**

- Client economy/Admin tests pass.
- Client production build succeeds.

**Likely files**

- `client/src/pages/Shop.jsx`
- `client/src/pages/Profile.jsx`
- `client/src/pages/admin/PlayersPanel.jsx`
- `client/src/pages/admin/TournamentsPanel.jsx`
- `client/test/adminBulkJob.test.js`

**Dependencies:** Task 8. **Scope:** M.

### Checkpoint 3

- Conversion dry-run reconciles totals.
- A converted player can purchase and claim rewards using Coin only.
- Full tests/build pass.

### Phase 4: Coin wager rooms

#### Task 10: Add the wager model and pure settlement rules

**Acceptance**

- Persisted wager state validates fixed stake tiers and authenticated participants.
- Allocation conserves the pot for 2–5 players.
- Invalid or repeated transitions are rejected/no-op safely.

**Verify**

- Unit tests cover amounts, ties/placements, rounding, and every state transition.

**Likely files**

- `server/models/Wager.js`
- `server/services/wagerService.js`
- `server/models/Transaction.js`
- `server/test/wagerService.test.js`

**Dependencies:** Task 2. **Scope:** M.

#### Task 11: Integrate wager lock, settlement, refund, and reconnect

**Acceptance**

- Coin locks before game start; insufficient balance prevents start.
- Match completion settles once; server cancellation refunds once.
- Disconnect grace/forfeit produces a deterministic terminal outcome.

**Verify**

- Socket integration tests cover duplicate events, crash/retry boundaries, reconnect, and cancellation.

**Likely files**

- `server/sockets/gameSocket.js`
- `server/game/roomManager.js`
- `server/services/wagerService.js`
- `server/services/matchLifecycleService.js`
- `server/test/wagerSocket.test.js`

**Dependencies:** Task 10. **Scope:** M.

#### Task 12: Add player wager flow and Admin review

**Acceptance**

- Player selects a fixed stake, sees confirmation, locked amount, and server-confirmed result.
- Admin can filter wagers and inspect participants, transactions, state, and review reason.
- Manual refund/resolve actions require permission, reason, idempotency, and audit.

**Verify**

- Client contract tests and Admin permission tests pass.
- Manual smoke test covers create, cancel/refund, complete/settle, and review.

**Likely files**

- `client/src/pages/Game.jsx`
- `client/src/pages/Game/components/LobbyHomeView.jsx`
- `server/routes/adminWagers.js`
- `client/src/pages/admin/WagersPanel.jsx`
- `server/test/adminWagers.test.js`

**Dependencies:** Task 11. **Scope:** M.

### Checkpoint 4

- Coin conservation invariant passes across wager fixtures.
- Player and Admin wager flows work end to end.
- Full tests/build pass.

### Phase 5: Standalone Tournament

#### Task 13: Add player Tournament registration and lifecycle APIs

**Acceptance**

- Authenticated eligible players can list, inspect, register, and withdraw before close.
- Entry fee/refund is atomic and idempotent.
- No Elo or Season eligibility exists.

**Verify**

- API tests cover capacity, duplicate registration, insufficient Coin, close time, and refund.

**Likely files**

- `server/routes/tournaments.js`
- `server/services/tournamentService.js`
- `server/models/Tournament.js`
- `server/models/TournamentParticipant.js`
- `server/test/tournaments.test.js`

**Dependencies:** Tasks 8, 10. **Scope:** M.

#### Task 14: Automate bracket, match results, scores, and direct rewards

**Acceptance**

- An eight-player Tournament creates group/final matches deterministically.
- Shared match completion records placements and advances the Tournament once.
- Completion pays Coin and grants configured existing cosmetic IDs directly.

**Verify**

- Deterministic bracket/scoring/tie-break tests pass.
- Duplicate match completion and payout retry do not duplicate score or rewards.

**Likely files**

- `server/services/tournamentService.js`
- `server/services/matchLifecycleService.js`
- `server/models/Tournament.js`
- `server/models/TournamentParticipant.js`
- `server/test/tournamentLifecycle.test.js`

**Dependencies:** Task 13. **Scope:** M.

#### Task 15: Complete player and Admin Tournament UI

**Acceptance**

- Players can view schedule, rewards, registration, current table, next match, and results.
- Admin can create/edit/cancel, configure Coin/cosmetics, inspect automatic results, preview payout/refund, and perform audited overrides.
- Admin does not routinely enter scores by hand.

**Verify**

- Player/Admin client tests pass.
- Manual smoke test covers registration through reward receipt.

**Likely files**

- `client/src/pages/Tournaments.jsx`
- `client/src/App.jsx`
- `client/src/pages/admin/TournamentsPanel.jsx`
- `client/test/tournaments.test.js`
- `client/test/adminTournament.test.js`

**Dependencies:** Task 14. **Scope:** M.

### Checkpoint 5

- An eight-player fixture completes a Tournament without manual scoring.
- Coin and cosmetic payout are idempotent.
- Full tests/build pass.

### Phase 6: Migration and release verification

#### Task 16: Reconcile, clean, and document release

**Acceptance**

- Gem conversion dry-run totals reconcile before apply.
- Active code has no Season/rank/public-Elo/gem behavior.
- Legacy data retention and rollback instructions are documented.
- Socket/API/Admin documentation matches the shipped contracts.

**Verify**

- `npm test --prefix server`
- `npm test --prefix client`
- `npm run build --prefix client`
- Search for active Season/rank/gem callers and classify any retained legacy references.
- Run migration dry-run and archive its summary.

**Likely files**

- `docs/SOCKET_EVENTS.md`
- `docs/API routes.md`
- `docs/admin-permission-matrix.md`
- `docs/admin-operations-runbook.md`
- migration run summary

**Dependencies:** Tasks 3–15. **Scope:** M.

## Risks and Mitigation

| Risk | Impact | Mitigation |
|---|---|---|
| Double conversion or payout | Critical | Unique reference keys, atomic claims, retry tests |
| Coin loss during server failure | Critical | Persisted lock before start; deterministic recovery/refund |
| Existing User save hook grants gems | High | Remove rank reward coupling before conversion |
| Admin retains legacy mutation powers | High | Remove permissions server-side, not only navigation |
| Tournament result submitted twice | High | Unique match reference and conditional score update |
| Users lose purchasing power | High | Catalog audit, `1:50` dry-run, balance reconciliation |
| Hidden rating leaks publicly | Medium | Explicit projections and negative contract tests |
| Historical reports break | Medium | Preserve legacy documents/transactions read-only |

## Release Gates

1. Contract tests green.
2. Season/rank retirement checkpoint green.
3. Coin-only conversion checkpoint green.
4. Wager conservation and recovery checkpoint green.
5. Tournament end-to-end checkpoint green.
6. Full server/client tests, client build, migration dry-run, and Admin smoke test green.

## Verification Record

- Server: `139/139` tests passed.
- Client: `40/40` tests passed.
- Production client build: passed with Vite (`2106` modules transformed).
- Gem migration dry-run: scanned `10` users, affected `10`, retired `1,000` gems, would issue `50,000` Coin, `0` invalid users.
- Active-code audit: Season routes/services/UI, leaderboard, public rank/Elo controls, Gem UI, and legacy Admin mutations are removed. Legacy database fields and read-time Coin conversion remain only for safe rollout, reconciliation, and rollback.
- Tournament fixture: deterministic 8-player schedule, idempotent results, final ranking, automatic payout path, cancellation refunds, and player room handoff are covered.
- Wager fixture: lock, settlement, Coin conservation, cancellation refund, review state, and Admin refund paths are covered.
