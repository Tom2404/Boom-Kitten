# Spec: Boom-Kitten Admin Operations v2

> Trạng thái: APPROVED ngày 2026-07-22 - đã duyệt role migration, model/index mới và quyền force-close/disconnect.

## Giả định đang sử dụng

1. Admin là một phần của ứng dụng web React hiện tại, không tách thành ứng dụng riêng.
2. MongoDB/Mongoose, Express, JWT và Socket.IO tiếp tục là nền tảng chính; không thêm dependency nếu chưa được duyệt.
3. Giao diện giữ ngôn ngữ thiết kế retro/pixel hiện có, nhưng ưu tiên mật độ thông tin, khả năng quét nhanh và thao tác an toàn.
4. Có thể bổ sung model, index và endpoint mới sau khi spec này được duyệt; dữ liệu hiện có phải tương thích ngược.
5. “Hoàn tất” nghĩa là cả nhóm Bắt buộc phải có và Mở rộng đều được triển khai, kiểm thử và có trạng thái loading/empty/error/success; không dùng dữ liệu giả.

## Mục tiêu

Biến Admin Console từ tập hợp màn CRUD thành trung tâm vận hành cho game Boom-Kitten. Quản trị viên phải quan sát được sức khỏe sản phẩm, điều tra người chơi/trận đấu, xử lý vi phạm, vận hành economy và live events, đồng thời mọi thao tác nhạy cảm đều có phân quyền, lý do và audit trail.

Người dùng chính:

- `super_admin`: quản lý quyền, economy, cấu hình và mọi thao tác phá huỷ.
- `operator`: vận hành người chơi, phòng, thông báo và mùa giải trong giới hạn.
- `moderator`: xử lý báo cáo, cảnh cáo, mute/suspend/ban.
- `analyst`: chỉ đọc dashboard, analytics và log đã được che dữ liệu nhạy cảm.

## Hiện trạng đã xác nhận

- Dashboard số đếm cơ bản: người chơi, online, banned, phòng, shop, nhiệm vụ.
- Người chơi: tìm kiếm/lọc, đổi role, ban/unban, điều chỉnh GoldCoin/PinkCoin và ELO, export trang hiện tại.
- CRUD shop, nhiệm vụ và mùa giải; reset mùa giải có audit.
- Broadcast trực tiếp, xem transaction log và audit log.
- Quyền hiện chỉ là `user`/`admin`; mọi admin có cùng quyền.
- Chưa có player 360, moderation case/report, giám sát trận/phòng, analytics theo thời gian, thông báo có lịch sử/lịch phát, hoặc hàng rào phê duyệt cho thao tác nhạy cảm.

## Phạm vi Bắt buộc phải có

### M1. Phân quyền và an toàn phiên quản trị

- RBAC theo bốn vai trò quản trị; server là nguồn quyết định quyền, UI chỉ ẩn/disable để hỗ trợ trải nghiệm.
- Endpoint `/api/admin/me` trả về role, permissions và thông tin phiên cần thiết.
- Mọi route Admin khai báo permission tương ứng; thao tác không đủ quyền trả `403` theo một error contract thống nhất.
- Không cho tự hạ quyền/khóa chính mình hoặc loại bỏ `super_admin` cuối cùng.
- Thao tác nhạy cảm yêu cầu nhập lý do; thao tác mức critical yêu cầu xác nhận lại bằng username và có audit.

### M2. Dashboard vận hành có dữ liệu thật

- KPI: DAU/WAU, người online, phòng waiting/playing, trận hoàn tất, tỷ lệ hoàn tất, thời lượng trận trung vị, GoldCoin/PinkCoin phát sinh và tiêu thụ.
- Xu hướng 7/30 ngày và so sánh với kỳ trước từ `GameHistory`, `Transaction`, `Room`, `User`; không hiển thị “system healthy” nếu không có phép đo.
- Bộ chọn khoảng thời gian được lưu trong URL để có thể chia sẻ/refresh.
- Cảnh báo rõ khi dữ liệu trễ, thiếu hoặc endpoint lỗi.

### M3. Hồ sơ người chơi 360°

- Drawer/page chi tiết gồm hồ sơ, trạng thái online, inventory, thống kê/rank, 20 trận gần nhất, transaction và audit liên quan.
- Timeline hợp nhất cho đăng nhập, trận, economy và moderation.
- Các hành động role, ELO, currency và trạng thái được thực hiện trong ngữ cảnh hồ sơ, hiển thị before/after trước khi xác nhận.
- Link sâu bằng URL để support có thể chia sẻ đúng người chơi/tab.

### M4. Moderation và báo cáo

- Người chơi có thể gửi report tối thiểu với đối tượng, category, mô tả và room/match context khi có.
- Admin có inbox lọc theo trạng thái, category, assignee, thời gian và độ ưu tiên.
- Case workflow: `OPEN -> INVESTIGATING -> RESOLVED/DISMISSED`; có ghi chú nội bộ và lịch sử chuyển trạng thái.
- Hành động: warning, suspend có thời hạn, ban, unban; hết hạn suspension tự được coi là active mà không cần sửa tay.
- Mọi quyết định liên kết với report/case và AuditLog.

### M5. Giám sát phòng và trận đấu

- Danh sách room waiting/playing với mã phòng, host, số người, mode, tuổi phòng và lần cập nhật cuối.
- Chi tiết read-only về người chơi, lượt hiện tại, phase và các pending interaction đã được che bài/bí mật game.
- Phát hiện room stale và cho phép `super_admin` đóng room hoặc ngắt người chơi với xác nhận critical, lý do và broadcast thông báo phù hợp.
- Không để endpoint Admin làm lộ hand/deck hoặc bí mật có thể dùng để gian lận.

### M6. Hàng rào economy và rank

- Validate allowlist currency/operation/status/role, giới hạn giá trị, kiểu số nguyên và payload tại API boundary.
- Currency/ELO adjustment có `requestId` idempotent để retry không ghi nhận hai lần.
- Preview before/after, cảnh báo vượt ngưỡng, bắt buộc reason và ghi actor ID ổn định thay vì chỉ username.
- Bulk adjustment chỉ chạy qua job có preview, số lượng đối tượng, progress, kết quả từng dòng và khả năng tải file lỗi; không giả lập atomicity.

### M7. Trung tâm thông báo

- Lưu lịch sử announcement với draft/scheduled/sent/cancelled, người tạo, audience, lịch phát và số người nhận.
- Hỗ trợ gửi ngay hoặc lên lịch; audience tối thiểu: all online, role, rank range.
- Preview, timezone rõ ràng, huỷ lịch trước khi gửi; scheduled job an toàn khi server restart và không gửi trùng.
- Client nhận thông báo hiện tại vẫn tương thích.

### M8. Audit và khả năng điều tra

- Audit log có action taxonomy thống nhất, actor, target, requestId, IP/user-agent nếu có, before/after đã che secrets và reason.
- Lọc theo actor/target/action/time, xem diff dễ đọc và export CSV theo bộ lọc.
- Audit là append-only qua API; không có UI sửa/xóa.
- Transaction và audit dùng pagination ổn định, query được index và error contract nhất quán.

## Phạm vi Mở rộng

### E1. Tournament operations

- Dùng các model Tournament/TournamentParticipant hiện có để quản lý đăng ký, bracket, trạng thái, entry fee và prize payout.
- State transition được kiểm soát; payout idempotent, có preview và audit.

### E2. Live-ops configuration và feature flags

- Cấu hình có schema/version cho maintenance mode, giới hạn phòng, multiplier thưởng và bật/tắt tính năng.
- Draft -> validate -> publish -> rollback; chỉ `super_admin` được publish/rollback.
- Client/server đọc cùng một phiên bản cấu hình và có fallback an toàn.

### E3. Product analytics

- Funnel: đăng ký -> chơi trận đầu -> hoàn tất trận -> quay lại D1/D7.
- Retention cohort, phân phối rank, economy source/sink và top nội dung shop/nhiệm vụ.
- Có định nghĩa metric ngay trong UI; khoảng thời gian và timezone nhất quán.

### E4. Bulk operations và saved views

- Chọn theo toàn bộ query (không chỉ current page), preview đối tượng bị tác động và yêu cầu xác nhận theo mức rủi ro.
- Saved filters cho Players, Reports, Logs và Rooms; export chạy nền khi dữ liệu lớn.
- Job Center hiển thị queued/running/completed/failed, progress, actor và file kết quả.

### E5. Incident center

- Gộp tín hiệu room stale, tỷ lệ lỗi thao tác, queue job thất bại và scheduled announcement quá hạn thành incident feed.
- Acknowledge/resolve, assignee, internal note, timeline và link tới đối tượng liên quan.
- Không tuyên bố health hạ tầng ngoài những tín hiệu ứng dụng thực sự đo được.

## Hợp đồng API và dữ liệu

- Giữ các endpoint hiện tại để tương thích; endpoint mới sử dụng namespace `/api/admin/...` với danh từ số nhiều.
- List response chuẩn: `{ success, data: { items, pagination } }`.
- Error response chuẩn: `{ error: { code, message, details? } }`.
- Tất cả list endpoint mới có pagination, filter allowlist, sort allowlist và giới hạn page size.
- Field mới là additive và có default để tài liệu cũ tiếp tục đọc được.
- Index phải được định nghĩa cho mọi query chính theo actor/target/status/createdAt và idempotency key.

## Giao diện và trải nghiệm

- Giữ visual system retro/pixel: nền cream, viền tối 3-4px, shadow khối, semantic palette hiện tại; không dùng card grid đồng đều cho dữ liệu vận hành dày.
- Desktop ưu tiên bảng, split view và sticky action bar; mobile chuyển thành stacked summary nhưng vẫn giữ đủ hành động.
- Navigation nhóm thành Observe, Operate, Govern thay vì danh sách phẳng ngày càng dài.
- Filter/pagination/tab quan trọng nằm trong URL; có breadcrumbs và deep-link.
- Mọi màn có skeleton, empty, error, retry và stale state; mutation có trạng thái pending và chống bấm lặp.
- Dialog quản trị phải trap focus, trả focus, hỗ trợ Escape; không truyền đạt trạng thái chỉ bằng màu.
- Kiểm tra ở 320px, 768px, 1024px và 1440px; mục tiêu WCAG 2.1 AA.

## Tech stack và cấu trúc

- Client: React 18, Vite, Tailwind CSS, context/hook hiện có.
- Server: Express, Mongoose, JWT, Socket.IO.
- `client/src/pages/admin/`: shell, feature panels và shared primitives.
- `server/routes/admin/`: route composition; logic mới tách sang services để tránh tiếp tục phình file route 847 dòng.
- `server/models/`: model và index mới.
- `server/services/admin/`: RBAC, analytics, moderation, jobs và live-ops logic.
- `server/test/`, `client/test/`: unit/contract/UI behavior tests bằng Node test runner hiện có.
- `docs/`: API contracts, metric definitions và runbook vận hành.

## Lệnh build và kiểm thử

- Client test: `npm test --prefix client`
- Client build: `npm run build --prefix client`
- Server test: `npm test --prefix server`
- Chạy local: `npm run dev`

## Chiến lược kiểm thử

- Unit: permission matrix, state transition, validation, metric calculation, idempotency và redaction.
- API integration: auth/403, happy path, invalid input, conflict/retry, pagination/filter/sort và audit side effects.
- Client behavior: URL state, loading/empty/error, dialog keyboard, mutation double-submit và permission-aware actions.
- E2E thủ công theo từng vertical slice với seed data ở bốn role quản trị.
- Sau mỗi checkpoint: chạy toàn bộ server test, client test và production build.

## Ranh giới

- Luôn làm: validate ở server, audit mutation, redact secrets, dùng dữ liệu thật, tương thích ngược và thêm index cho query mới.
- Cần duyệt trong spec này: model/field/index mới, job runner dựa trên MongoDB, thay đổi role enum và endpoint can thiệp room.
- Cần hỏi riêng nếu phát sinh: dependency mới, dịch vụ bên ngoài, email/SMS, thay đổi CI/deployment hoặc migration phá vỡ dữ liệu.
- Không bao giờ: ghi log password/token/hand/deck bí mật, xoá audit, gọi nhiều mutation đơn lẻ rồi quảng bá là atomic bulk, hoặc hiển thị health giả.

## Tiêu chí hoàn tất

- Tất cả M1-M8 và E1-E5 đạt acceptance criteria, không còn UI placeholder hoặc endpoint trả dữ liệu giả.
- Permission matrix được kiểm thử và không thể bypass bằng gọi API trực tiếp.
- Mọi mutation nhạy cảm có reason, actor, target, before/after, requestId và audit record.
- Dashboard/analytics có định nghĩa metric, timezone và xử lý dữ liệu thiếu.
- Không làm lộ secrets game hoặc dữ liệu xác thực trong API/log/export.
- Client test, server test và client build đều pass.
- Các luồng chính được kiểm tra responsive và keyboard; tài liệu API/runbook được cập nhật.

## Quyết định đã duyệt

1. Dùng bốn role `super_admin`, `operator`, `moderator`, `analyst`; migration role `admin` hiện tại thành `super_admin`.
2. Được thêm model/index cho Report/ModerationCase/Announcement/AdminJob/LiveOpsConfig/Incident và dùng MongoDB làm durable job queue.
3. `super_admin` được force-close room/disconnect người chơi với confirmation critical và audit.
