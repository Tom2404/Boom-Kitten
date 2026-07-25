# Implementation Plan: Boom-Kitten Admin Operations v2

> Phụ thuộc: `docs/admin-operations-v2-spec.md` được duyệt.

## Quyết định kiến trúc

- Xây theo vertical slice để mỗi task tạo ra một luồng API + UI + test dùng được.
- Tách logic khỏi `server/routes/admin.js` sang service và middleware; giữ endpoint cũ tương thích.
- MongoDB là nguồn bền vững cho scheduled work/job; Socket.IO chỉ vận chuyển sự kiện thời gian thực.
- Permission và redaction luôn thực thi ở server; UI phản ánh capability do `/api/admin/me` trả về.
- Thao tác có side effect dùng requestId/idempotency key và audit trong cùng workflow.

## Dependency graph

```text
RBAC + error contract + audit foundation
  |-- Player 360 + moderation
  |-- Room monitor + safe intervention
  |-- Economy safeguards + bulk jobs
  |-- Announcements scheduler
  |-- Tournament operations
  |-- Live-ops config
  `-- Incident center

Metric definitions + analytics service
  |-- Operations dashboard
  `-- Product analytics

Admin shell + URL state + permission-aware navigation
  `-- every feature panel
```

## Phase 1 - Nền tảng quản trị

### Task 1: Chuẩn hoá API error, validation và route composition

**Acceptance:** Error mới có contract thống nhất; filter/sort dùng allowlist; endpoint cũ không đổi success payload.

**Verify:** Server contract tests cho 400/401/403/404/409; `npm test --prefix server`.

**Files likely touched:** `server/routes/admin.js`, `server/routes/admin/index.js`, `server/utils/adminValidation.js`, `server/test/adminContracts.test.js`.

**Dependencies:** None. **Scope:** M.

### Task 2: RBAC và capability-aware Admin shell

**Acceptance:** Bốn role có permission matrix; `/api/admin/me` trả capabilities; gọi API trực tiếp vẫn bị chặn; bảo vệ self-action/last-super-admin.

**Verify:** Permission matrix tests cho từng role và UI behavior test cho hidden/disabled actions.

**Files likely touched:** `server/models/User.js`, `server/middleware/adminAuthorization.js`, `server/routes/admin/me.js`, `client/src/pages/admin/AdminPage.jsx`, `server/test/adminAuthorization.test.js`.

**Dependencies:** Task 1. **Scope:** M.

### Task 3: Audit foundation và sensitive-action confirmation

**Acceptance:** Audit taxonomy, requestId, actor/target/before/after/reason và redaction hoạt động; critical dialog yêu cầu username.

**Verify:** Audit/redaction/idempotency tests; keyboard test cho confirmation dialog.

**Files likely touched:** `server/models/AuditLog.js`, `server/services/admin/auditService.js`, `server/middleware/adminAuditContext.js`, `client/src/pages/admin/ui.jsx`, `server/test/adminAudit.test.js`.

**Dependencies:** Tasks 1-2. **Scope:** M.

### Checkpoint 1

- Permission matrix và API contracts pass.
- Client build, client tests, server tests pass.
- Duyệt migration role trên dữ liệu seed/staging.

## Phase 2 - Quan sát và điều tra

### Task 4: Analytics service và dashboard vận hành

**Acceptance:** KPI/trend 7/30 ngày có định nghĩa và dữ liệu thật; URL giữ time range; lỗi/thiếu dữ liệu không bị biểu diễn thành healthy/zero sai.

**Verify:** Metric fixture tests, API query tests, UI loading/empty/error tests, responsive manual check.

**Files likely touched:** `server/services/admin/analyticsService.js`, `server/routes/admin/analytics.js`, `client/src/pages/admin/OverviewPanel.jsx`, `client/test/adminOverview.test.js`, `docs/admin-metrics.md`.

**Dependencies:** Tasks 1-2. **Scope:** M.

### Task 5: Player 360 read model và deep-linked UI

**Acceptance:** Một URL mở đúng player/tab; inventory, 20 trận, transaction, audit và timeline có pagination/redaction; action hiện hữu có preview before/after.

**Verify:** API aggregation tests, unauthorized-field tests, URL-state/UI tests.

**Files likely touched:** `server/services/admin/playerProfileService.js`, `server/routes/admin/players.js`, `client/src/pages/admin/PlayerDetailPanel.jsx`, `client/src/pages/admin/PlayersPanel.jsx`, `client/test/adminPlayerDetail.test.js`.

**Dependencies:** Tasks 1-3. **Scope:** M.

### Task 6: Room/match monitor read-only

**Acceptance:** Room waiting/playing, age, heartbeat và safe game summary cập nhật; response không chứa hand/deck/hidden state.

**Verify:** Redaction tests với game-state fixture; socket reconnect/stale UI test.

**Files likely touched:** `server/services/admin/roomMonitorService.js`, `server/routes/admin/rooms.js`, `client/src/pages/admin/RoomsPanel.jsx`, `client/test/adminRooms.test.js`, `server/test/adminRoomMonitor.test.js`.

**Dependencies:** Tasks 1-3. **Scope:** M.

### Checkpoint 2

- Operator có thể quan sát dashboard, player và room mà không thấy secrets.
- Query plans/index được kiểm tra với dữ liệu có quy mô thực tế.
- Full tests/build pass.

## Phase 3 - Moderation và live operations bắt buộc

### Task 7: Report intake và moderation inbox

**Acceptance:** Người chơi gửi report hợp lệ; moderator lọc/assign/chuyển trạng thái case; transition sai trả conflict; notes là internal-only.

**Verify:** State-machine/API tests, permission/redaction tests, inbox UI states.

**Files likely touched:** `server/models/Report.js`, `server/models/ModerationCase.js`, `server/routes/reports.js`, `server/routes/admin/moderation.js`, `client/src/pages/admin/ModerationPanel.jsx`.

**Dependencies:** Tasks 1-3, 5. **Scope:** M.

### Task 8: Time-bound sanctions và room intervention

**Acceptance:** Warning/suspend/ban có reason, expiry, case link và audit; expiry được tính đúng; critical force-close/disconnect được permission-check và che secrets.

**Verify:** Fake-clock expiry tests, socket integration test, duplicate-request test, critical-dialog manual check.

**Files likely touched:** `server/services/admin/moderationService.js`, `server/services/admin/roomInterventionService.js`, `server/routes/admin/moderation.js`, `client/src/pages/admin/ModerationPanel.jsx`, `server/test/adminSanctions.test.js`.

**Dependencies:** Tasks 6-7. **Scope:** M.

### Task 9: Economy/rank safeguards

**Acceptance:** Strict validation, threshold warning, requestId idempotency và audit actor ID; double submit/retry chỉ tạo một adjustment.

**Verify:** Boundary/property-style cases, concurrent duplicate request test, UI double-click test.

**Files likely touched:** `server/services/admin/economyService.js`, `server/routes/admin/players.js`, `server/models/Transaction.js`, `client/src/pages/admin/PlayerDetailPanel.jsx`, `server/test/adminEconomy.test.js`.

**Dependencies:** Tasks 1-3, 5. **Scope:** M.

### Task 10: Durable announcement center

**Acceptance:** Draft/schedule/send/cancel/history/audience hoạt động; restart không mất lịch và cùng announcement không gửi trùng.

**Verify:** Scheduler fake-clock/restart/idempotency tests, audience tests, UI timezone/preview tests.

**Files likely touched:** `server/models/Announcement.js`, `server/services/admin/announcementService.js`, `server/routes/admin/announcements.js`, `client/src/pages/admin/AnnouncementsPanel.jsx`, `server/test/adminAnnouncements.test.js`.

**Dependencies:** Tasks 1-3. **Scope:** M.

### Task 11: Audit investigation UI và filtered export

**Acceptance:** Lọc actor/target/action/time, diff redacted, stable pagination và export CSV đúng filter; audit không có update/delete route.

**Verify:** Filter/index/export tests, CSV escaping test, Logs UI behavior test.

**Files likely touched:** `server/services/admin/auditQueryService.js`, `server/routes/admin/auditLogs.js`, `client/src/pages/admin/LogsPanel.jsx`, `client/test/adminLogs.test.js`, `server/test/adminAuditQuery.test.js`.

**Dependencies:** Task 3. **Scope:** M.

### Checkpoint 3 - Must-have complete

- M1-M8 đạt acceptance criteria end-to-end.
- Security review cho RBAC, redaction, idempotency và dangerous actions.
- Full tests/build pass; manual smoke test với bốn role.

## Phase 4 - Mở rộng

### Task 12: Admin Job Center và bulk operation engine

**Acceptance:** Durable queued/running/completed/failed jobs; select-by-query preview; progress/result/error CSV; restart và retry không nhân đôi side effect.

**Verify:** Worker restart/concurrency/idempotency tests; large-query preview; Job Center UI test.

**Files likely touched:** `server/models/AdminJob.js`, `server/services/admin/jobService.js`, `server/routes/admin/jobs.js`, `client/src/pages/admin/JobsPanel.jsx`, `server/test/adminJobs.test.js`.

**Dependencies:** Tasks 1-3, 9. **Scope:** M.

### Task 13: Saved views và async exports

**Acceptance:** Saved filters thuộc từng admin; toàn bộ query được export qua job; filter schema cũ được migrate an toàn.

**Verify:** Ownership/permission tests, filter serialization test, export result validation.

**Files likely touched:** `server/models/AdminSavedView.js`, `server/routes/admin/savedViews.js`, `server/services/admin/exportService.js`, `client/src/pages/admin/SavedViews.jsx`, `server/test/adminSavedViews.test.js`.

**Dependencies:** Task 12. **Scope:** M.

### Task 14: Tournament operations

**Acceptance:** Valid state transitions, participant/bracket visibility, entry fee và payout idempotent có preview/audit.

**Verify:** State machine, eligibility, payout retry và UI workflow tests.

**Files likely touched:** `server/services/admin/tournamentService.js`, `server/routes/admin/tournaments.js`, `server/models/Tournament.js`, `client/src/pages/admin/TournamentsPanel.jsx`, `server/test/adminTournaments.test.js`.

**Dependencies:** Tasks 1-3, 9, 12. **Scope:** M.

### Task 15: Versioned live-ops config

**Acceptance:** Draft/validate/publish/rollback; invalid config không publish; client/server có fallback; mọi publish có audit.

**Verify:** Schema/version/rollback tests, permission tests, config consumer fallback tests.

**Files likely touched:** `server/models/LiveOpsConfig.js`, `server/services/admin/liveOpsService.js`, `server/routes/admin/liveOps.js`, `client/src/pages/admin/LiveOpsPanel.jsx`, `server/test/adminLiveOps.test.js`.

**Dependencies:** Tasks 1-3. **Scope:** M.

### Task 16: Product analytics

**Acceptance:** Funnel, D1/D7 cohort, rank distribution, source/sink và content performance có metric definitions/timezone; không suy diễn từ dữ liệu không tồn tại.

**Verify:** Fixture-based metric tests, boundary dates/timezone tests, chart/table accessible labels.

**Files likely touched:** `server/services/admin/productAnalyticsService.js`, `server/routes/admin/analytics.js`, `client/src/pages/admin/AnalyticsPanel.jsx`, `client/test/adminAnalytics.test.js`, `docs/admin-metrics.md`.

**Dependencies:** Task 4. **Scope:** M.

### Task 17: Incident center

**Acceptance:** Tín hiệu đo được tạo/deduplicate incident; acknowledge/assign/resolve/note có timeline và links; không có health claim giả.

**Verify:** Dedup/state transition tests, role tests, incident UI states.

**Files likely touched:** `server/models/Incident.js`, `server/services/admin/incidentService.js`, `server/routes/admin/incidents.js`, `client/src/pages/admin/IncidentsPanel.jsx`, `server/test/adminIncidents.test.js`.

**Dependencies:** Tasks 6, 10, 12. **Scope:** M.

### Checkpoint 4 - Goal complete

- E1-E5 đạt acceptance criteria.
- Full server/client tests và production build pass.
- Responsive/keyboard smoke test ở 320/768/1024/1440px.
- API contracts, metric definitions, permission matrix và operational runbook được cập nhật.
- Không còn placeholder, dữ liệu giả hoặc mutation không audit trong Admin scope.

## Rủi ro và giảm thiểu

| Rủi ro | Mức | Giảm thiểu |
|---|---|---|
| Role migration khóa nhầm admin | Cao | Seed một super_admin, migration dry-run, last-super-admin guard |
| Analytics aggregate chậm | Cao | Index theo query, time bucket, bounded range, explain plan |
| Job/scheduler gửi hoặc cộng tiền hai lần | Cao | Unique idempotency key, atomic claim, retry-safe handlers |
| Lộ game secrets qua room monitor | Cao | Explicit projection/redaction + negative contract tests |
| File route Admin tiếp tục phình | Trung bình | Route modules + service layer theo feature |
| Scope mở rộng kéo dài | Trung bình | Giữ checkpoint Must-have độc lập, hoàn tất từng vertical slice |

## Open decisions

- Migration role và permission matrix cuối cùng.
- Danh sách model/index được phép thêm.
- Room intervention là read-only hay cho phép force-close/disconnect.

