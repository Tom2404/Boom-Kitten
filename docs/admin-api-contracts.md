# Boom-Kitten Admin API Contracts v2

> Trạng thái: APPROVED ngày 2026-07-22. Contract mới là additive; endpoint hiện hữu tiếp tục hoạt động trong giai đoạn migration.

## Conventions

### Authentication

- Header: `Authorization: Bearer <accessToken>`.
- `401` khi không có/không hợp lệ; `403` khi xác thực được nhưng thiếu permission.
- Server phải load role/permission hiện hành trước mutation nhạy cảm để tránh JWT role cũ giữ quyền sau khi bị demote.

### Success envelope

```json
{
  "success": true,
  "data": {}
}
```

List endpoints:

```json
{
  "success": true,
  "data": {
    "items": [],
    "pagination": {
      "page": 1,
      "pageSize": 20,
      "totalItems": 0,
      "totalPages": 0,
      "nextCursor": null
    }
  }
}
```

Endpoint có pagination theo cursor không bắt buộc trả `page/totalPages`; field không áp dụng được bỏ qua thay vì trả giá trị giả.

### Error envelope

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Payload không hợp lệ",
    "details": {
      "fields": {
        "reason": "Bắt buộc"
      }
    },
    "requestId": "req_01..."
  }
}
```

| Status | Code điển hình |
|---:|---|
| 400 | `INVALID_QUERY`, `INVALID_JSON` |
| 401 | `AUTH_REQUIRED`, `TOKEN_INVALID` |
| 403 | `ADMIN_PERMISSION_DENIED` |
| 404 | `RESOURCE_NOT_FOUND` |
| 409 | `STATE_CONFLICT`, `IDEMPOTENCY_CONFLICT`, `LAST_SUPER_ADMIN` |
| 422 | `VALIDATION_ERROR`, `ADMIN_CONFIRMATION_REQUIRED`, `POLICY_LIMIT_EXCEEDED` |
| 429 | `RATE_LIMITED` |
| 500 | `INTERNAL_ERROR` |

Không đưa stack trace, query MongoDB hoặc secret vào response.

### Mutation context

Sensitive/critical mutation nhận:

```json
{
  "reason": "Support ticket BK-1234",
  "requestId": "adm_01J...",
  "confirmation": {
    "username": "operator-name"
  }
}
```

- `requestId`: required cho sensitive/critical; unique trong actor + operation scope.
- `confirmation`: chỉ required cho critical.
- Response replay cho cùng requestId có header `Idempotency-Replayed: true`.

### Query rules

- `pageSize`: default 20, max 100.
- `sortBy`/`sortOrder`: allowlist theo endpoint; không đưa raw field vào Mongo sort.
- Thời gian dùng ISO-8601 UTC; UI chịu trách nhiệm hiển thị timezone.
- Search text được escape; ObjectId được validate trước query.

## Identity and permissions

### `GET /api/admin/me`

Permission: admin role bất kỳ.

```json
{
  "success": true,
  "data": {
    "admin": {
      "id": "...",
      "username": "admin",
      "role": "operator"
    },
    "permissions": ["dashboard.read", "players.read"],
    "policy": {
      "maxCurrencyAdjustment": { "coin": 10000, "gem": 500 },
      "maxEloDelta": 500,
      "maxSuspensionDays": 30,
      "maxBulkTargets": 1000
    }
  }
}
```

## Dashboard and analytics

### `GET /api/admin/analytics/operations`

Permission: `dashboard.read`.

Query: `from`, `to`, `timezone`, `bucket=day|week`.

Response gồm:

- `freshness`: `generatedAt`, `dataThrough`, `isPartial`.
- `kpis`: DAU/WAU, online, rooms, completed matches, completion rate, median duration, economy source/sink.
- `series`: time buckets có `start`, `end` và metric values.
- `comparison`: kỳ trước với absolute/percentage delta; `null` nếu không đủ mẫu.

### `GET /api/admin/analytics/product`

Permission: `analytics.read`.

Query: `from`, `to`, `timezone`, `view=funnel|retention|rank|economy|content`.

Mỗi response trả `metricDefinitions` và `isPartial`; không tự thay missing thành zero.

## Players

### `GET /api/admin/players`

Permission: `players.read`.

Query: `search`, `role`, `status`, `rank`, `isOnline`, `createdFrom`, `createdTo`, `sortBy`, `sortOrder`, `page`, `pageSize`.

### `GET /api/admin/players/:playerId`

Permission: `players.read`.

Query: `include=inventory,stats,recentMatches,economy,audit,moderation`.

Response không bao giờ chứa password hash/token; analyst nhận timeline đã redact.

### `PATCH /api/admin/players/:playerId/role`

Permission: `players.role.write`. Critical.

Body: `role`, `reason`, `requestId`, `confirmation`.

Invariants: không self-change; không loại bỏ last super_admin; role allowlist.

### `POST /api/admin/players/:playerId/sanctions`

Permission phụ thuộc `type`.

Body: `type=warning|suspension|ban`, `reason`, `expiresAt?`, `caseId?`, `requestId`, `confirmation?`.

### `POST /api/admin/players/:playerId/economy-adjustments`

Permission: `economy.adjust`. Sensitive/critical theo threshold.

Body: `currency=coin|gem`, `operation=add|subtract|set`, `amount`, `reason`, `requestId`, `confirmation?`.

Response: adjustment ID, `balanceBefore`, `balanceAfter`, `wasReplayed`.

### `POST /api/admin/players/:playerId/elo-adjustments`

Permission: `players.elo.write`. Sensitive/critical theo threshold.

Body: `elo`, `reason`, `requestId`, `confirmation?`.

## Reports and moderation cases

### `POST /api/reports`

Authenticated player endpoint.

Body: `targetPlayerId`, `category`, `description`, `roomId?`, `matchId?`.

Rate-limited; reporter không thể report chính mình; server xác minh room/match context nếu được cung cấp.

### `GET /api/admin/moderation/cases`

Permission: `moderation.read`.

Query: `status`, `category`, `priority`, `assigneeId`, `targetPlayerId`, `from`, `to`, pagination/sort.

### `GET /api/admin/moderation/cases/:caseId`

Permission: `moderation.read`; analyst không nhận internal notes.

### `PATCH /api/admin/moderation/cases/:caseId`

Permission: `moderation.assign` hoặc `moderation.resolve` tùy field.

Body: subset của `status`, `priority`, `assigneeId`, kèm `reason`, `requestId`.

Invalid state transition trả `409 STATE_CONFLICT`.

### `POST /api/admin/moderation/cases/:caseId/notes`

Permission: `moderation.assign`. Body: `content`, `requestId`.

Internal notes không bao giờ xuất hiện trong player API.

## Rooms

### `GET /api/admin/rooms`

Permission: `rooms.read`.

Query: `status=waiting|playing|stale`, `search`, `minAgeSeconds`, pagination/sort.

### `GET /api/admin/rooms/:roomId`

Permission: `rooms.read`.

Response là safe projection: metadata, participant public identity, turn/phase/pending interaction summary. Cấm hand, deck order, hidden card identity và private action payload.

### `POST /api/admin/rooms/:roomId/interventions`

Permission: `rooms.intervene`. Critical.

Body: `type=disconnect_player|close_room`, `playerId?`, `reason`, `requestId`, `confirmation`.

## Announcements

### `GET /api/admin/announcements`

Permission: `announcements.read`. Filter theo `status`, `creatorId`, `from`, `to`.

### `POST /api/admin/announcements`

Permission: `announcements.write` hoặc `announcements.schedule`.

Body: `title`, `message`, `type`, `durationSeconds`, `audience`, `scheduledAt?`, `timezone`, `requestId`.

Audience variants:

```json
{ "type": "all_online" }
```

```json
{ "type": "role", "roles": ["user"] }
```

```json
{ "type": "rank_range", "minElo": 1000, "maxElo": 1999 }
```

### `POST /api/admin/announcements/:id/cancel`

Permission: `announcements.schedule`. Chỉ scheduled announcement chưa claim được phép cancel.

## Audit

### `GET /api/admin/audit-logs`

Permission: `audit.read`.

Query: `actorId`, `targetType`, `targetId`, `action`, `from`, `to`, pagination/sort.

### `POST /api/admin/audit-logs/exports`

Permission: `audit.export`.

Body là filter schema giống list endpoint và `requestId`; response trả `jobId`, không stream dataset lớn trong request.

Không tồn tại `PATCH` hoặc `DELETE` audit endpoint.

## Jobs and bulk operations

### `GET /api/admin/jobs` / `GET /api/admin/jobs/:jobId`

Permission: `jobs.read`. Analyst chỉ thấy job metadata và result summary đã redact.

### `POST /api/admin/jobs`

Permission: `jobs.create` cộng permission của operation bên trong.

Body: `type`, `query`, `operation`, `dryRun`, `reason`, `requestId`, `confirmation?`.

Luồng bắt buộc: tạo `dryRun=true` -> xem target count/sample/impact -> tạo execution job tham chiếu preview token chưa hết hạn.

### `POST /api/admin/jobs/:jobId/cancel`

Permission: `jobs.cancel`. Chỉ queued/running cooperative job; response không cam kết rollback phần đã hoàn tất.

## Tournaments

- `GET /api/admin/tournaments`
- `GET /api/admin/tournaments/:id`
- `POST /api/admin/tournaments`
- `PATCH /api/admin/tournaments/:id`
- `POST /api/admin/tournaments/:id/transitions`
- `POST /api/admin/tournaments/:id/payouts`

Transitions và payout dùng state version + requestId; stale version trả `409 STATE_CONFLICT`.

## Live-ops config

- `GET /api/admin/live-ops/configs`
- `POST /api/admin/live-ops/configs` tạo draft
- `POST /api/admin/live-ops/configs/:id/validate`
- `POST /api/admin/live-ops/configs/:id/publish`
- `POST /api/admin/live-ops/configs/:id/rollback`

Publish/rollback là critical; config có immutable version và schemaVersion.

## Incidents

- `GET /api/admin/incidents`
- `GET /api/admin/incidents/:id`
- `PATCH /api/admin/incidents/:id` cho assign/status
- `POST /api/admin/incidents/:id/notes`

Signal ingest là internal service interface, không mở public write endpoint.

## Compatibility map

| Existing endpoint | V2 destination | Migration |
|---|---|---|
| `GET /api/admin/overview` | `GET /api/admin/analytics/operations` | Giữ endpoint cũ, map subset |
| `GET /api/admin/stats` | `GET /api/admin/analytics/operations` | Deprecate sau khi client chuyển |
| `GET /api/admin/users` | `GET /api/admin/players` | Alias trong migration window |
| `PATCH /users/:id/status` | `POST /players/:id/sanctions` | Giữ adapter, bắt reason |
| `PATCH /users/:id/currency` | `POST /players/:id/economy-adjustments` | Client chuyển trước, sau đó deprecate |
| `PATCH /users/:id/elo` | `POST /players/:id/elo-adjustments` | Client chuyển trước, sau đó deprecate |
| `GET /api/admin/transactions` | audit/economy query endpoints | Giữ legacy response cho client cũ |
| `POST /api/admin/announcement(s)` | `POST /api/admin/announcements` | Singular alias deprecated |

Mọi deprecation phải có log/metric usage trước khi xoá alias; spec hiện tại không cho phép xoá endpoint legacy.
