# Tournament v1

Tài liệu vận hành và contract cho format `groups_then_final_v1`.

## Luật chơi

- Một giải có đúng 8 người, chia thành Bảng A và Bảng B, mỗi bảng 4 người.
- Seed theo thời điểm đăng ký, sau đó phân luân phiên vào hai bảng.
- Mỗi bảng chơi 3 ván. Hai người đứng đầu mỗi bảng vào Chung kết; Chung kết chơi 5 ván.
- Tổng cộng mỗi giải có 11 ván.
- Điểm mỗi ván: hạng 1 = 5, hạng 2 = 3, hạng 3 = 1, hạng 4 = 0.
- Tie-break theo thứ tự: tổng điểm, số lần hạng 1, `placementSum` thấp hơn, seed sớm hơn, `participantId`.
- Kết quả hợp lệ phải đến từ game server. Forfeit được ghi riêng bằng `resultSource: forfeit`.

Grace period của mỗi trận là 5 phút. Người chơi mất kết nối được reconnect trong thời gian này; sau đó bị forfeit. Không thay người bằng bot. Khi không thể bắt đầu trận, người đã vào trận được xếp trước, người vắng nhận các vị trí thấp hơn theo seed.

## Đăng ký và hoàn tiền

User phải đăng nhập, có đủ Coin và đăng ký trong khoảng `registrationOpensAt` đến trước `registrationClosesAt`. Mỗi User chỉ có một participant trong một giải. Rút trước khi đóng đăng ký hoàn 100% entry fee; sau khi giải active thì không được rút. Hủy giải sẽ hoàn tự động tất cả entry fee đã thanh toán.

`register`, `withdraw`, `refund` và `payout` đều cần request idempotency. Các mutation của Admin dùng thêm `stateVersion`/`expectedVersion` để tránh ghi đè state mới.

## Payout

Prize pool dùng Coin. Mặc định hạng 1/2/3 nhận lần lượt 60%/30%/10%; hạng 4–8 không nhận Coin. Cosmetic có thể cấu hình theo rank và chỉ được giao bằng thao tác idempotent (`$addToSet`), không tạo lợi thế gameplay. Payout lỗi không làm mất kết quả giải; Admin có thể retry từ trạng thái `failed`.

## API public

- `GET /api/tournaments` — danh sách và public projection.
- `GET /api/tournaments/rules` — rules contract v1.
- `GET /api/tournaments/:id` — detail, standings, registration và next match.
- `POST /api/tournaments/:id/register` — đăng ký với `requestId`/`Idempotency-Key`.
- `POST /api/tournaments/:id/withdraw` — rút và hoàn Coin với idempotency.
- `POST /api/tournaments/:id/matches/room` — lấy room của trận kế tiếp.

Public projection không chứa Elo, Rank, Gem, payout token, payout preview nội bộ hoặc thông tin tạo giải của Admin.

## Admin operations và quyền

| Permission | Phạm vi |
|---|---|
| `tournaments.read` | list, detail, bracket, participants, audit |
| `tournaments.write` | create, edit, transition, register participant |
| `tournaments.override` | override điểm/kết quả, bắt buộc reason + expectedVersion |
| `tournaments.payout` | preview và execute payout |
| `tournaments.refund` | preview và retry refund |

Admin detail hiển thị state version, payment/refund/payout state, bracket, room reference và audit timeline. Override, payout và refund đều có confirmation; payout yêu cầu xác nhận username.

## Vận hành và rollback

Đặt `TOURNAMENTS_ENABLED=false` để dừng đăng ký, withdraw và tạo room mới trong khi vẫn cho phép xem giải/kết quả và Admin xử lý refund/payout. Không xóa dữ liệu Tournament, Participant, Transaction hoặc AuditLog khi rollback. Theo dõi fill rate, withdraw, forfeit, room error, duplicate event, payout failed/retry, refund pending/failed và số lần override.
