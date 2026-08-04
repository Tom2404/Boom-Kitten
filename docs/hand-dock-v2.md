# Hand Dock V2

## Mục tiêu

Nâng cấp khu vực bài trên tay thành một dải bài ngang gọn như ảnh tham chiếu: nhận diện người chơi nằm bên trái, lá bài là nội dung chính, và các nút hành động chỉ xuất hiện khi người chơi đã chọn bài hoặc buộc phải bỏ bài.

## Phạm vi đã khóa

- Giữ nguyên luật chọn lá, đánh lá, combo, kéo ngang và bắt buộc bỏ bài.
- Hiển thị tốt ở 1, 6, 10 và 11 lá.
- `maxHandSize` vẫn là 10; 11 lá là trạng thái overflow duy nhất cần kiểm thử và phải dẫn người chơi tới thao tác bỏ một lá.
- Không thêm Level, EXP hoặc dữ liệu backend mới.
- Không thêm dependency.
- Không thay đổi payload socket hoặc game state.

## Thiết kế

### Identity rail

- Avatar, Avatar Frame, username và trạng thái lượt vẫn nằm bên trái.
- Số lá bài được đưa vào identity rail để không chiếm một hàng toolbar riêng.
- Trên màn hình hẹp, identity rail chuyển thành một hàng thấp phía trên dải bài.

### Card rail

- Mỗi lá dùng presentation `hand-strip`: giữ artwork, nút thông tin, trạng thái selected/marked và detail modal; ẩn khối mô tả bên dưới.
- Các lá tạo fan nhẹ, tối đa 6 độ và độ cong tối đa 8 px.
- 1–6 lá căn giữa và không chồng lấn.
- 7–10 lá chồng nhẹ nhưng vẫn căn giữa.
- 11 lá ưu tiên bắt đầu từ mép trái và cho phép kéo/cuộn ngang để lá cuối luôn truy cập được.
- Motion wrapper là nơi duy nhất điều khiển translate/rotate/scale để tránh transform kép.

### Action tray

- Khi chưa chọn bài và không overflow, hướng dẫn vẫn có cho screen reader nhưng không chiếm không gian nhìn thấy.
- Khi đã chọn bài hoặc có 11 lá, một action tray nhỏ hiện phía trên bên phải.
- Trạng thái 11 lá luôn giải thích rằng người chơi phải bỏ xuống còn 10 lá.

## Contract triển khai

- `getHandCardLayout({ cardCount, index, isNewGroup })` trả:
  - `rotate`
  - `y`
  - `marginLeft`
  - `shouldCenter`
- `Card` nhận thêm `presentation="hand-strip"`; presentation mặc định không thay đổi.
- `PlayerHand` tiếp tục sở hữu toàn bộ logic game hiện tại.
- `PlayerHandDock` chỉ bổ sung metadata hiển thị.

## Kiểm thử

- Unit test geometry tại 1, 6, 10 và 11 lá.
- Unit test xác nhận 10 lá chưa danger và 11 lá là danger.
- Chạy toàn bộ client tests và production build.
- Kiểm tra trực quan desktop/mobile:
  - không che lá đầu/cuối;
  - chọn lá vẫn nổi lên rõ;
  - kéo ngang không vô tình chọn lá;
  - action tray không che bài;
  - 11 lá hiển thị yêu cầu discard.

## Tiêu chí hoàn thành

- Dải bài thấp hơn rõ rệt so với UI hiện tại và ưu tiên artwork.
- 10 lá vẫn thao tác được không cần cuộn bắt buộc ở desktop.
- 11 lá có thể cuộn/kéo để truy cập mọi lá và không làm thay đổi luật discard.
- Responsive, keyboard semantics, reduced-motion và detail modal hiện có không bị regress.
