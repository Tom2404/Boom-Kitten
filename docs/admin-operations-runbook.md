# Admin Operations v2 Runbook

## Scope

This runbook covers the Admin Operations v2 release defined in `admin-operations-v2-spec.md`: RBAC, dashboard and match lifecycle, Player 360, moderation, live room intervention, safe bulk jobs, catalog/quest/announcement/season workflows, audit, tournaments, Live Ops, product analytics, Incident Center, saved views, select-by-query, and asynchronous exports.

## Roles and operating boundaries

| Role | Intended use | Important restrictions |
| --- | --- | --- |
| `super_admin` | Policy, role assignment, Live Ops publish/rollback, all operational workflows | Critical actions still require reason, confirmation text, request ID, and audit |
| `operator` | Day-to-day player, economy, content, announcement, season, tournament and job operations | Cannot assign privileged roles or publish/rollback Live Ops |
| `moderator` | Reports, cases, incidents and operational observation | Tournament and Live Ops are read-only; no economy or role mutation |
| `analyst` | Dashboards, analytics, exports and read-only investigation | No mutations; Incident Center removes internal notes and actor identity |

The server reloads the current database role on every Admin request. A stale JWT cannot preserve revoked privileges. Legacy `admin` records are temporarily treated as `super_admin` during migration.

## Critical-action protocol

For any destructive or production-impacting action:

1. Refresh the target and check its current version/state.
2. Enter an operational reason that is meaningful to another responder.
3. Complete the UI preview or dry run when offered.
4. Verify affected count, balances, entry fees, payout totals, or configuration diff.
5. Enter the required confirmation text.
6. Submit once. The client sends a request ID; retry with the same ID only when the first response is unknown.
7. Open Audit/Jobs and confirm the terminal outcome.

HTTP `409 STATE_CONFLICT` means the record changed after it was loaded. Refresh and re-evaluate; do not blindly repeat the mutation. HTTP `422 VALIDATION_ERROR` is an input/schema failure. HTTP `403 ADMIN_PERMISSION_DENIED` is a role boundary, not a retryable failure.

## Live Ops

Normal sequence: create draft → validate → publish. Only a validated draft can be published, and only `super_admin` may publish or rollback. Runtime readers use the last published version; if none exists they use safe v0 defaults.

Before publishing, verify maintenance mode, shop/missions flags, reward multiplier, maximum active rooms, schema version and config diff. After publishing, check `GET /api/live-ops/config`, create/join room behavior, shop, missions and Admin audit.

Rollback creates a new monotonically increasing version whose content matches the selected prior version; it does not move the state pointer backwards. If publication fails with a state conflict, refresh and validate that the draft remains retryable.

Emergency rollback: publish the known-good prior config through the rollback control. If Admin is unavailable, redeploy the previous application version and retain the Live Ops collections for investigation; do not manually edit the active pointer without a database backup and incident record.

## Tournament operations

Create the tournament, confirm registration window and entry currency/fee, then register participants. Entry fees are transactional and recorded with tournament sources. Start only after reviewing the deterministic bracket and byes. Update scores, complete the tournament, preview payouts, then execute the exact preview token before expiry.

Payout execution locks participant state and prevents duplicate awards. A partial failure must be treated as an incident: do not restart with a new preview until the participant ledger and payout transaction sources have been reconciled.

## Bulk jobs and exports

Bulk economy/ELO work is always two-step: select-by-query/dry-run preview, then execution using the preview token. Review target count and requested delta before execution. Jobs may finish `completed`, `failed`, `cancelled`, or with partial row errors. Cancellation does not roll back rows already applied.

For partial failure:

1. Download the output and error CSV artifacts.
2. Compare successful and failed player IDs.
3. Correct the root cause.
4. Run a new preview restricted to failed IDs only.
5. Execute the new preview and link both job IDs in the incident/audit note.

Exports run asynchronously when appropriate. Access to output/error artifacts is checked again on download; possessing a job ID is not sufficient authorization.

## Incident Center signals

Incident Center represents measured application signals, not full infrastructure health. Current automatic signals are:

- a room stuck in `playing` for more than five minutes;
- Admin HTTP 5xx volume of at least five and at least 20% within 15 minutes;
- a failed Admin job within 15 minutes;
- a scheduled announcement overdue by more than five minutes.

The scanner starts shortly after server startup and runs every minute. Active incidents are deduplicated by signal fingerprint. Workflow is `open` → `acknowledged` → `resolved`; resolving releases the dedupe key so a later recurrence can open a new incident. Record assignment, investigation notes and related room/job/announcement links before resolution.

## Product analytics definitions

- Funnel uses the account-registration cohort inside the selected UTC range.
- D1/D7 retention means match activity on the exact UTC day one/day seven after registration.
- Economy sources increase balances; sinks include spend, purchase and tournament entry. Signed Admin adjustments retain their sign.
- Rank distribution normalizes legacy rank labels before aggregation.
- Date ranges are UTC and limited to 90 days.

## Release checklist

Run from the repository root:

```powershell
Set-Location server
npm test

Set-Location ..\client
npm test
npm run build
```

Then verify:

- `/health` and `/api/live-ops/config` return 200;
- all four Admin roles can read their permitted panels;
- prohibited mutations return 403 at the route boundary;
- critical workflows require preview/confirmation/reason as designed;
- desktop and 390×844 layouts have no horizontal overflow;
- browser console has no errors on the tested Admin paths;
- no synthetic QA accounts or their Admin operation records remain;
- production secrets, CORS origins, rate limits and database indexes are configured for the target environment.

## Staged rollout and rollback thresholds

Deploy to staging first, run the checklist, then deploy to production and monitor the first hour. Hold the release if error rate is 10–100% above baseline or p95 latency is 20–50% above baseline. Roll back immediately for data-integrity/security issues, error rate above 2× baseline, p95 latency above 50% baseline, or new client errors affecting more than 0.1% of sessions.

Application rollback is a redeploy of the last known-good revision. Live Ops state should normally be rolled back through its own versioned control. Preserve audit, transaction, job and incident records across rollback so responders can reconcile already-applied mutations.

## Evidence and references

- API contracts: `docs/admin-api-contracts.md`
- Permission matrix: `docs/admin-permission-matrix.md`
- Product specification: `docs/admin-operations-v2-spec.md`
- Delivery plan: `docs/admin-operations-v2-plan.md`

Audit records redact secrets and sensitive fields. Use request ID, operation request ID, target ID and job ID as the correlation keys during investigation.
