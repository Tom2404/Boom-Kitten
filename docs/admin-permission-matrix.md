# Boom-Kitten Admin Permission Matrix

> Trạng thái: APPROVED ngày 2026-07-22. Đây là contract phía server; việc ẩn nút ở client không thay thế authorization.

## Roles

| Role | Mục đích | Mặc định |
|---|---|---|
| `super_admin` | Quản trị quyền, economy, live-ops và thao tác critical | Full access |
| `operator` | Vận hành người chơi, phòng, thông báo, mùa giải và job thường | Không quản trị role/config critical |
| `moderator` | Điều tra report/case và áp dụng sanctions | Không sửa economy/ELO/config |
| `analyst` | Quan sát dashboard, analytics và dữ liệu đã redact | Read-only |

Role `user` không phải admin role và không được truy cập `/api/admin/*`.

## Permission keys

Permission dùng dạng `resource.action`. API trả danh sách effective permissions qua `GET /api/admin/me`.

| Permission | super_admin | operator | moderator | analyst |
|---|:---:|:---:|:---:|:---:|
| `dashboard.read` | ✓ | ✓ | ✓ | ✓ |
| `analytics.read` | ✓ | ✓ | ✓ | ✓ |
| `players.read` | ✓ | ✓ | ✓ | ✓ |
| `players.export` | ✓ | ✓ |  | ✓ |
| `players.role.write` | ✓ |  |  |  |
| `players.status.write` | ✓ | ✓ | ✓ |  |
| `players.elo.write` | ✓ | ✓ |  |  |
| `economy.read` | ✓ | ✓ |  | ✓ |
| `economy.adjust` | ✓ | ✓¹ |  |  |
| `moderation.read` | ✓ | ✓ | ✓ | ✓² |
| `moderation.assign` | ✓ | ✓ | ✓ |  |
| `moderation.resolve` | ✓ | ✓ | ✓ |  |
| `moderation.sanction.warning` | ✓ | ✓ | ✓ |  |
| `moderation.sanction.suspend` | ✓ | ✓¹ | ✓¹ |  |
| `moderation.sanction.ban` | ✓ |  | ✓¹ |  |
| `rooms.read` | ✓ | ✓ | ✓ | ✓ |
| `rooms.intervene` | ✓ | ✓¹ |  |  |
| `catalog.read` | ✓ | ✓ | ✓ | ✓ |
| `catalog.write` | ✓ | ✓ |  |  |
| `quests.read` | ✓ | ✓ | ✓ | ✓ |
| `quests.write` | ✓ | ✓ |  |  |
| `seasons.read` | ✓ | ✓ | ✓ | ✓ |
| `seasons.write` | ✓ | ✓ |  |  |
| `seasons.reset` | ✓ |  |  |  |
| `announcements.read` | ✓ | ✓ | ✓ | ✓ |
| `announcements.write` | ✓ | ✓ | ✓ |  |
| `announcements.schedule` | ✓ | ✓ |  |  |
| `audit.read` | ✓ | ✓ | ✓ | ✓² |
| `audit.export` | ✓ | ✓ |  | ✓² |
| `jobs.read` | ✓ | ✓ | ✓ | ✓² |
| `jobs.create` | ✓ | ✓¹ |  |  |
| `jobs.cancel` | ✓ | ✓¹ |  |  |
| `tournaments.read` | ✓ | ✓ | ✓ | ✓ |
| `tournaments.write` | ✓ | ✓ |  |  |
| `tournaments.payout` | ✓ |  |  |  |
| `live_ops.read` | ✓ | ✓ | ✓ | ✓ |
| `live_ops.draft` | ✓ | ✓ |  |  |
| `live_ops.publish` | ✓ |  |  |  |
| `live_ops.rollback` | ✓ |  |  |  |
| `incidents.read` | ✓ | ✓ | ✓ | ✓² |
| `incidents.write` | ✓ | ✓ | ✓ |  |

¹ Bị giới hạn bởi policy/threshold; vượt ngưỡng phải do `super_admin` thực hiện.

² Read-only và redact actor IP/user-agent, internal notes hoặc dữ liệu định danh không cần thiết.

## Risk levels

| Level | Ví dụ | Yêu cầu |
|---|---|---|
| `normal` | Lọc danh sách, sửa draft, gửi warning | Permission check; mutation có reason khi liên quan người chơi |
| `sensitive` | Adjust economy/ELO, suspend, bulk export | Permission, reason, preview before/after, requestId, audit |
| `critical` | Ban, đổi admin role, season reset, force-close room, payout, publish/rollback config | `super_admin` hoặc policy rõ ràng; nhập lại username; requestId; audit; last-admin/self-action guard |

## Threshold policy mặc định

Các giá trị là cấu hình server, không hard-code trong client.

| Hành động | operator/moderator | super_admin |
|---|---:|---:|
| Currency adjustment mỗi request | Tối đa 10,000 Gold hoặc 500 Pink | Không giới hạn cứng; vẫn cần warning |
| ELO adjustment | Chênh lệch tối đa 500 | Không giới hạn cứng; vẫn cần warning |
| Suspension | Tối đa 30 ngày | Tối đa 365 ngày hoặc permanent ban |
| Bulk job | Tối đa 1,000 targets | Tối đa giới hạn hệ thống |
| Force disconnect | Một player | Một player hoặc toàn room |

## Invariants bắt buộc

1. Authorization đọc role/permission từ dữ liệu hiện hành, không chỉ tin role nằm trong JWT cũ.
2. Không admin nào được thay đổi role hoặc sanction chính mình.
3. Không thể demote, suspend hoặc ban `super_admin` cuối cùng.
4. `analyst` không có mutation permission.
5. Permission denial trả `403 ADMIN_PERMISSION_DENIED` và không tạo business side effect.
6. Critical action thiếu confirmation trả `422 ADMIN_CONFIRMATION_REQUIRED`.
7. Mutation có cùng actor + requestId + operation phải trả lại kết quả cũ, không thực hiện lần hai.
8. Audit log không được chứa password hash, access token, refresh token, hand, deck hoặc hidden game state.

## Migration mặc định được đề xuất

- `role: admin` hiện tại -> `role: super_admin`.
- `role: user` giữ nguyên.
- Migration phải idempotent và có dry-run count.
- Server tạm chấp nhận legacy `admin` như `super_admin` trong một cửa sổ migration; client không tạo role legacy mới.
