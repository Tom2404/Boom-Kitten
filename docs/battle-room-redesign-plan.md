# Kế hoạch nâng cấp giao diện Room đấu

## 1. Mục tiêu

Nâng cấp Room đấu từ bố cục HUD chia thành nhiều dải ngang sang một bàn đấu pixel-art tập trung, lấy Ảnh 2 làm định hướng thị giác. Thay đổi chỉ tác động đến cách trình bày và tương tác UI; route, socket contract, luật chơi, dữ liệu phòng, card asset và các VFX anchor hiện có phải được giữ nguyên.

## 2. Giả định đã chốt

- Ảnh 2 là tham chiếu về bố cục, độ ưu tiên thông tin và phong cách; không sao chép asset hay thương hiệu.
- Tái sử dụng avatar, card image, font, animation và dependency hiện có.
- Desktop ưu tiên bố cục bàn móng ngựa; màn hình hẹp chuyển sang rail ngang để không che khu vực bốc/đánh bài.
- Header và chat/lịch sử vẫn truy cập được nhưng không cạnh tranh với bàn đấu.
- Hand card vẫn dùng logic chọn bài, combo, kéo ngang và VFX hiện tại.

## 3. Trích xuất đặc trưng từ ảnh tham chiếu

### 3.1. Cấu trúc không gian

- Một sân khấu tối chiếm gần toàn bộ viewport.
- Bàn chơi xanh hình móng ngựa/oval là tâm điểm thị giác.
- Người chơi được neo quanh mép bàn thay vì nằm trong một rail tách rời.
- Hand card của người chơi nằm ở cạnh dưới, chồng quạt lên một khay màu đỏ sẫm.
- Draw pile và discard pile nằm cạnh nhau ở trung tâm.
- Banner lượt nằm phía trên hai pile, cùng một trục dọc rõ ràng.

### 3.2. Phân cấp thông tin

1. Người đang có lượt: viền và ánh sáng vàng.
2. Hành động hiện tại: banner trạng thái duy nhất.
3. Draw/discard và số lá: to, rõ, nằm giữa bàn.
4. Đối thủ: avatar, tên, số bài; trạng thái phụ giảm tương phản.
5. Bài trên tay và CTA: gần cạnh dưới, luôn trong tầm thao tác.
6. Chat/lịch sử và thông tin phòng: lớp tiện ích thứ cấp.

### 3.3. Ngôn ngữ thị giác

- Nền ngoài bàn: charcoal/navy gần đen, có vignette nhẹ.
- Mặt bàn: xanh felt đậm, có texture vi mô và ánh sáng hướng tâm.
- Thành bàn: nhiều lớp tối + gỗ đỏ nâu để tạo chiều sâu.
- Khay tay bài: burgundy với viền amber.
- Hình khối hard-edge/pixel, viền rõ, bóng đổ có hướng.
- Màu nhấn duy nhất cho lượt/hành động: amber vàng.
- Chuyển động ngắn, có trọng lượng; tôn trọng `prefers-reduced-motion`.

### 3.4. Hành vi responsive

- `>= 960px` và chiều cao đủ: ghế đối thủ theo horseshoe quanh bàn.
- `640–959px` hoặc nhiều hơn 4 đối thủ: horseshoe compact.
- `< 640px` hoặc không đủ chiều cao: opponent rail ngang, piles và banner vẫn ở giữa.
- Hand card cuộn ngang, không gây page overflow.

## 4. Audit giao diện hiện tại

### Điểm giữ lại

- `GameBoardView` đã tách header, table, side panel và modal rõ ràng.
- `GameTable` đã có state mục tiêu, `ResizeObserver` và interaction state.
- `GameTableCore` đã có VFX anchors, piles, hướng chơi và nhánh horseshoe/rail.
- `PlayerHand` đã có fan layout, drag-scroll, keyboard-compatible action button và reduced motion.
- `PlayerAvatar`, `DeckPile`, `DiscardPile` đã mang đầy đủ trạng thái gameplay.

### Khoảng cách so với mục tiêu

- Sân khấu vẫn đọc như một khung chữ nhật phẳng; chưa tạo silhouette móng ngựa.
- Mặt bàn, thành bàn và khay bài chưa hợp thành một không gian duy nhất.
- Header/hand dock còn mang sắc cream của giao diện cũ, chia màn hình thành các dải ngang.
- Seat pod còn thiên về thanh thông tin; avatar chưa đủ nổi bật như một “ghế” quanh bàn.
- Banner/piles chưa có trục dọc và khoảng trống ổn định khi có nhiều ghế.
- CSS hiện có nhiều lớp override nối tiếp, cần gom phần nâng cấp cuối file thành một lớp theme có ranh giới rõ.
- Chưa có test trực tiếp cho seat allocation và chưa có ảnh kiểm chứng ở các breakpoint mục tiêu.

## 5. Quyết định kỹ thuật

- Không thêm dependency.
- Không đổi data shape hay event handler.
- Giữ `GameTable` làm container stateful; `GameTableCore` và các seat/dock là presentation.
- Dùng CSS pseudo-elements và gradient để tạo felt, rail và tray; không tạo raster asset mới.
- Giữ nguyên các id/anchor: `game-board-container`, `board-center-target`, `deck-pile-element`, `discard-pile-element`, `player-hand-container`, `hand-card-*`.
- Chỉ thêm logic thuần nếu cần cho responsive/seat mapping và phải có test Node nhỏ.

## 6. Kế hoạch triển khai

### Phase 1 — Khóa nền tảng và regression guard

- [ ] Task 1: Chạy test/build baseline và ghi nhận lỗi có sẵn.
  - Acceptance: biết trạng thái client test/build trước khi sửa.
  - Verify: `npm test --prefix client`; `npm run build --prefix client`.
  - Files: không đổi source.
- [ ] Task 2: Bổ sung test cho seat order và seat preset.
  - Acceptance: 1–5 đối thủ nhận đúng thứ tự tương đối và vị trí cân đối.
  - Verify: `node --test client/test/seatAllocation.test.js`.
  - Files: `client/test/seatAllocation.test.js`.

### Phase 2 — Bàn đấu và ghế đối thủ

- [ ] Task 3: Hoàn thiện stage/table silhouette, felt, rail gỗ và chiều sâu.
  - Acceptance: desktop đọc thành một bàn móng ngựa ngay từ silhouette; center piles không bị che.
  - Verify: build và screenshot 1440×900, 1024×768.
  - Files: `client/src/styles.css`.
- [ ] Task 4: Hoàn thiện seat pod, active turn, targetable/selected/out states.
  - Acceptance: avatar/tên/số bài đọc được; active turn chỉ có một nhấn amber; các trạng thái không chỉ phụ thuộc màu.
  - Verify: keyboard focus + screenshot với 1, 3 và 5 đối thủ.
  - Files: `client/src/styles.css`, chỉ sửa `PlayerAvatar.jsx` nếu semantic markup thiếu.

### Phase 3 — Center action và hand tray

- [ ] Task 5: Căn banner, draw/discard và direction indicator theo một trục trung tâm.
  - Acceptance: banner không đè ghế; piles giữ kích thước ổn định; VFX anchors không đổi.
  - Verify: draw, discard history, target selection và reverse direction vẫn hoạt động.
  - Files: `client/src/styles.css`, `GameTableCore.jsx` nếu thật sự cần.
- [ ] Task 6: Hợp nhất hand dock thành khay bài ở cạnh dưới bàn.
  - Acceptance: card fan nổi trên tray; toolbar/CTA rõ nhưng không tạo dải cream lớn; overflow ngang có chủ đích.
  - Verify: hand 0, 5, 8, 12 lá; chọn bài; hủy chọn; CTA disabled/enabled.
  - Files: `client/src/styles.css`, `PlayerHandDock.jsx` nếu cần semantic state.

### Phase 4 — Responsive, accessibility và hoàn thiện

- [ ] Task 7: Tinh chỉnh rail mode và các breakpoint.
  - Acceptance: không có page overflow tại 320, 768, 1024, 1440; opponent rail dùng được bằng keyboard/touch.
  - Verify: browser resize và screenshot từng breakpoint.
  - Files: `client/src/styles.css`, `GameTable.jsx` nếu threshold cần hiệu chỉnh.
- [ ] Task 8: Regression pass và review.
  - Acceptance: test/build pass, console sạch, reduced-motion hoạt động, chat/log và leave room còn truy cập được.
  - Verify: `npm test --prefix client`; `npm run build --prefix client`; browser smoke test.
  - Files: chỉ các file đã nêu trong plan.

## 7. Rủi ro và giảm thiểu

| Rủi ro | Mức | Giảm thiểu |
|---|---:|---|
| Ghế che banner/piles ở 4–5 người | Cao | Preset riêng theo số người, safe zone trung tâm và rail fallback |
| Hand card bị cắt trên viewport thấp | Cao | Dùng `clamp()`, `dvh`, max-height và overflow ngang |
| CSS override cũ xung đột | Trung bình | Một block `battle-table-v2` cuối file, selector có phạm vi dưới `.game-stage` |
| VFX bay sai đích | Cao | Không đổi id/anchor; smoke test draw/play/discard |
| Active/target states khó phân biệt | Trung bình | Kết hợp border, label, glow và `aria-pressed` |
| Animation gây khó chịu | Thấp | Giới hạn animation lặp và có reduced-motion fallback |

## 8. Tiêu chí hoàn thành

- Room đấu có silhouette bàn xanh móng ngựa, rail gỗ, nền tối và khay bài dưới cùng giống tinh thần Ảnh 2.
- Người chơi bố trí quanh bàn theo số lượng; active/target/out state rõ ràng.
- Banner lượt, draw pile, discard pile và hand card tạo thành trục hành động chính.
- Không thay đổi luật chơi, socket contract, card source hoặc VFX anchor.
- Chat/lịch sử, thoát phòng, discard history và toàn bộ CTA chính còn hoạt động.
- Không có horizontal page overflow tại 320/768/1024/1440.
- Keyboard focus rõ, status có text, reduced motion hoạt động.
- Client tests và production build pass.

## 9. Phạm vi không làm

- Không vẽ lại card/avatar asset.
- Không thay đổi server/game rules.
- Không đổi framework hoặc thêm thư viện UI/animation.
- Không redesign lobby, waiting room, shop hay admin.
- Không deploy production trong task này.

## 10. Nhật ký thực thi

Trạng thái Goal: hoàn thành phạm vi nâng cấp giao diện Room đấu.

| Task | Trạng thái | Bằng chứng |
|---|---|---|
| 1. Baseline | Hoàn thành | Build baseline đạt; test baseline có 3 lỗi sẵn trong `cardPlayPresentation.test.js`. |
| 2. Seat regression guard | Hoàn thành | Thêm `client/test/seatAllocation.test.js`; 3/3 test đạt. |
| 3. Table silhouette | Hoàn thành | Stage tối, mặt nỉ xanh, rail gỗ nhiều lớp và chiều sâu được gom trong block `Battle table v2`. |
| 4. Opponent seats | Hoàn thành | Seat pod, active turn, target, waiting và eliminated state giữ đủ text/semantic state hiện có. |
| 5. Center action | Hoàn thành | Banner, draw/discard và direction indicator cùng một trục; toàn bộ VFX anchor được giữ nguyên. |
| 6. Hand tray | Hoàn thành | Hand dock trở thành khay burgundy, giữ card fan, CTA và cuộn ngang. |
| 7. Responsive | Hoàn thành | Horseshoe large/compact và rail fallback dùng `ResizeObserver`; CSS có breakpoint 960/640px. |
| 8. Regression/review | Hoàn thành có ghi chú | Production build đạt; full suite 46/49 đạt, đúng 3 lỗi baseline không thuộc Room redesign; review không phát hiện lỗi blocking trong phần nâng cấp. |

### Kết quả xác minh cuối

- `node --test client/test/seatAllocation.test.js`: **3 đạt, 0 lỗi**.
- `npm run build --prefix client`: **đạt**, Vite build hoàn tất.
- `npm test --prefix client`: **46 đạt, 3 lỗi**. Ba lỗi đã tồn tại trước thay đổi này và đều thuộc presentation/Nope overlay: source card id, focus copy font-size và vị trí panel `top-24`/`top-16`.
- Browser smoke test desktop 1440×900: xác nhận silhouette bàn xanh, rail gỗ, ghế đối thủ, banner/piles trung tâm và khay bài dưới cùng hiển thị đúng định hướng Ảnh 2.
- Lần reload cuối trên dev server cũ `localhost:2404` gặp stale dynamic-import timestamp của Vite; production build vẫn đạt và lỗi này không xuất hiện trong source/build output.
- `git diff --check` còn báo whitespace trong `ActionModals.jsx` và `GameTableCore.jsx`; đây là các dòng thuộc WIP có sẵn, không được tự ý sửa trong phạm vi nâng cấp này.

### Review năm trục

- **Correctness:** seat order/preset có regression test; data contract, gameplay handler và VFX anchor không đổi.
- **Readability:** phần theme mới được cô lập dưới `.game-room`/`.game-stage` và đặt cuối stylesheet.
- **Architecture:** tái sử dụng component, asset, `ResizeObserver` và interaction state có sẵn; không thêm abstraction hoặc dependency.
- **Security:** chỉ thay đổi presentation và logic bố trí thuần; không thêm input, secret hoặc external data flow.
- **Performance:** texture dùng CSS gradient; không thêm ảnh raster, vòng lặp hoặc listener dài hạn.
