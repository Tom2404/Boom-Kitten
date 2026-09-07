# Viewport-Fit Pages — Refactor Plan (Tournament / Arena / Top 20)

Mục tiêu: các trang dạng "màn hình game" vừa trọn trong `100dvh`, không scroll dọc ở page level.
Điều hướng nội dung bằng click: tab, phân trang, modal, accordion.

---

## 1. Khảo sát hiện trạng

Khung chung ([`App.jsx:361`](client/src/App.jsx:361)): `min-h-screen` + `flex flex-col` với
Navbar → `<main className="flex-grow ... p-4 md:p-8 max-w-7xl">` → Footer. Page tự do cao bao nhiêu tuỳ ý ⇒
mọi trang đều scroll cả page. Đây là gốc rễ, phải sửa 1 lần ở shell.

| Trang | Nguồn tràn chiều cao | Item thực tế cần thấy cùng lúc |
|---|---|---|
| **Top 20** [`Leaderboard.jsx`](client/src/pages/Leaderboard.jsx:31) | `<ol>` 20 hàng × ~68px = ~1360px + header block 3 dòng (`text-6xl`) ~180px | 10 hàng/trang là đủ (2 trang) |
| **Tournament** [`Tournaments.jsx:154`](client/src/pages/Tournaments.jsx:154) | Cột phải xếp dọc 5 khối: Metrics → nextMatch → actions → RulesPanel → BracketPanel (3 rounds × N matches) → StandingsPanel (tối đa 8) ⇒ dễ 2000px+. Cột trái: list N giải, mỗi card ~110px | Trái: 4 card. Phải: 1 khối tại 1 thời điểm |
| **Arena (Game lobby)** [`LobbyHomeView.jsx:16`](client/src/pages/Game/components/LobbyHomeView.jsx:16) | Hero banner p-7 + LobbyModeCards (3 card cao ~260px) + [`PublicRoomList`](client/src/pages/Game/components/PublicRoomList.jsx:26) bảng không giới hạn hàng | Hero rút gọn + 3 mode card + 5–6 phòng |
| WaitingRoom [`WaitingRoomView.jsx:66`](client/src/pages/Game/views/WaitingRoomView.jsx:66) | đã `min-h-[calc(100vh-4rem)]`, gần đạt | — |
| Game board | đã viewport-fit qua [`styles.css:3608`](client/src/styles.css:3608), `.game-stage` | giữ nguyên, dùng làm mẫu |

Đã có tiền lệ đúng trong repo: `.game-board`, `.game-stage` dùng `calc(100dvh - Xrem)` +
`grid-template-rows` + `overflow: hidden`. Refactor này là **mở rộng mẫu đó**, không phát minh mới.

---

## 2. Quy tắc layout chung (CSS thuần, 0 JS đo đạc)

Thêm một khối duy nhất vào [`styles.css`](client/src/styles.css:1) — dùng chung cho cả 3 trang:

```css
/* Shell: chỉ bật khi page opt-in, không đụng Home/Shop/Profile */
.viewport-fit-shell { height: 100dvh; overflow: hidden; }
.viewport-fit-shell > main { min-height: 0; overflow: hidden; }

/* Page: grid dọc, hàng giữa co được */
.vf-page {
  display: grid;
  grid-template-rows: auto minmax(0, 1fr) auto; /* header | body | pager */
  gap: clamp(0.5rem, 1.5dvh, 1.25rem);
  height: 100%;
  min-height: 0;
}
.vf-page > * { min-height: 0; }        /* bắt buộc, nếu không flex/grid con không co */
.vf-body { min-height: 0; overflow: hidden; }

/* Typography/spacing co theo chiều cao viewport */
.vf-title { font-size: clamp(1.5rem, 4.5dvh, 3rem); line-height: 1.05; }
.vf-row   { padding-block: clamp(0.35rem, 1.1dvh, 0.9rem); }
```

Nguyên tắc:
- `dvh` (không `vh`) để đúng với thanh URL mobile; `svh` cho phần tử phải luôn thấy được khi bar hiện.
- `min-height: 0` ở **mọi** ancestor của vùng co — lỗi phổ biến nhất khiến `1fr` không co.
- `overflow: hidden` đặt ở container, **không** ở `body` (tránh phá modal/dialog đang có).
- `clamp()` cho type/spacing thay vì breakpoint rời rạc; `container-type: size` chỉ dùng nếu clamp không đủ.
- Số item mỗi trang là **hằng số** (10 / 5 / 4), không tính bằng JS từ chiều cao. Đây là ceiling có chủ ý — xem §8.

---

## 3. Chiến lược thay scroll theo loại nội dung

| Loại | Thay bằng | Áp dụng |
|---|---|---|
| Danh sách xếp hạng dài | **Pagination click**, 10 item/trang | Top 20 → 2 trang. `<nav>` + `aria-current="page"` |
| Danh sách phòng | Pagination 6 item/trang | Arena PublicRoomList |
| Nhiều khối nội dung phụ | **Tabs** (Luật / Lịch đấu / Bảng điểm) | Tournament detail — 3 panel hiện đang xếp dọc |
| Chi tiết một item | **Modal** dùng lại `.pixel-dialog` sẵn có ([`styles.css:1085`](client/src/styles.css:1085)) | Chi tiết trận, chi tiết người chơi |
| Mô tả/hero dài | Rút còn 1 dòng, phần còn lại vào `<details>` hoặc tooltip | Header Top 20, hero Arena |
| Danh sách giải (cột trái) | 4 card + pager nhỏ | Tournament list |

Không thêm thư viện. Tabs = `<button role="tab">` + state `useState`; pagination = `useState(page)` + `slice()`.
Mỗi cái ~15 dòng, không cần abstraction chung cho đến khi có trang thứ 4 (rule of three).

---

## 4. Ngưỡng viewport & fallback

- **Hợp đồng: `height >= 640px` ⇒ zero page scroll.** Với 640px: shell 100dvh − navbar 56px − padding 32px = ~552px cho page; 10 hàng × `clamp(...1.1dvh...)` ≈ 44px = 440px + header 60px + pager 48px vừa đủ.
- **`height < 640px`** (landscape phone, zoom 200%): cho phép **một** vùng cuộn duy nhất là `.vf-body`, page vẫn không cuộn:

```css
@media (max-height: 639px) {
  .vf-body { overflow-y: auto; -webkit-overflow-scrolling: touch; }
}
```

- **`height < 480px`**: bỏ hợp đồng, trả về layout tự nhiên (`.vf-page { height: auto }`, shell `overflow: visible`). Thà scroll còn hơn cắt nội dung.

Ba tầng này là CSS thuần, không JS, không breakpoint JS.

---

## 5. Mobile / landscape / zoom / font lớn

- Không dùng `height` cố định cho row nội dung — chỉ `minmax(0, 1fr)`. Text tự wrap, không bị cắt.
- **Không** `overflow: hidden` lên text container ⇒ nếu user đặt font 24px, `.vf-body` chuyển sang scroll nội bộ (§4) thay vì mất chữ.
- Zoom trình duyệt = giảm `dvh` hiệu dụng ⇒ tự rơi vào fallback 639px. Đúng hành vi mong muốn.
- Accessibility bắt buộc (không được đơn giản hoá đi):
  - Pagination: `<nav aria-label="Phân trang">`, nút hiện tại `aria-current="page"`.
  - Tabs: `role="tablist"/"tab"/"tabpanel"`, `aria-selected`, mũi tên trái/phải, `tabindex="-1"` cho tab không active.
  - Mọi control ≥ **44×44px** (`min-height: 2.75rem; min-width: 2.75rem`).
  - Đổi trang/tab: giữ focus trên control vừa bấm; nội dung mới thông báo qua `aria-live="polite"` (số hạng đang xem).
  - Modal: focus trap + `Esc` — dùng lại `CustomDialog` đã có, không viết mới.
  - Thứ tự focus theo DOM = theo luồng click, không dùng `tabindex` dương.

---

## 6. Thứ tự thực thi (diff nhỏ nhất trước)

1. **`styles.css`** — thêm khối `.viewport-fit-shell` / `.vf-*` (~30 dòng). Chưa ảnh hưởng trang nào.
2. **`App.jsx`** — 1 dòng: thêm `VIEWPORT_FIT_PAGES = new Set(['Leaderboard','Tournaments','Game'])` và nối class vào root + `main`. Diff ~5 dòng.
3. **Top 20** — dễ nhất, chứng minh mẫu. Thêm `useState(page)`, `slice(page*10, +10)`, `<Pagination>` cục bộ, rút header xuống 1 dòng. Diff ~40 dòng, 1 file.
4. **Arena** — bọc `LobbyHomeView` bằng `.vf-page`, hero rút gọn, `PublicRoomList` phân trang 6. Diff ~50 dòng, 2 file. Giữ nguyên toàn bộ logic socket/room.
5. **Tournament** — nặng nhất. `.vf-page` 2 cột, cột phải chuyển 3 panel (Rules/Bracket/Standings) thành tabs. Diff ~80 dòng, 1 file.
6. Copy component `Pagination` giữa 3 trang → **chỉ tách ra `components/ui/Pager.jsx` ở bước 5**, khi đã có 3 chỗ dùng thật.

**Tái sử dụng:** `.vf-*` CSS, `CustomDialog`, `.pixel-dialog`, `Pager` (bước 5).
**Giữ nguyên:** toàn bộ data fetching, socket, `tournamentUi.js`, Game board (`.game-stage` đã fit), Admin console, Home/Shop/Profile/Wardrobe.

---

## 7. Kiểm chứng

Runnable check — thêm vào `client/test/viewportFit.test.js` (jsdom, cùng runner với các test hiện có):

```js
// assert số item render đúng ngưỡng phân trang, không phụ thuộc layout engine
assert.equal(screen.getAllByRole('listitem').length, 10);
assert.equal(screen.getByRole('button', { current: 'page' }).textContent, '1');
```

Check chiều cao thật phải chạy trong browser (jsdom không layout). Dán vào console ở mỗi breakpoint:

```js
// PASS nếu <= 1 (sai số subpixel)
document.body.scrollHeight - window.innerHeight <= 1
&& document.querySelectorAll('.vf-page').length > 0
```

Viewport test tay: `1920×1080`, `1440×900`, `1366×768`, `1280×720`, `390×844` (iPhone portrait),
`844×390` (landscape → fallback), `768×1024` (iPad), và `1440×900 @ zoom 200%` (→ fallback).
Mỗi cái kiểm: không scrollbar dọc, không chữ bị cắt, Tab đi hết được mọi control.

---

## 8. Cố tình KHÔNG làm ở giai đoạn này

| Bỏ qua | Lý do | Nâng cấp khi |
|---|---|---|
| JS đo chiều cao để tính `itemsPerPage` động | CSS + hằng số đủ cho 640px+ | Có yêu cầu "luôn lấp đầy màn hình" trên 4K |
| `ResizeObserver` / `container-type: size` | `clamp()+dvh` đủ; container queries chưa cần khi layout không lồng sâu | Panel bị nhúng lại ở nhiều context rộng khác nhau |
| Virtual scrolling | 20 hàng, không phải 20k | Leaderboard vượt ~200 hàng |
| Component `Pager` chung ngay từ bước 3 | 1 chỗ dùng ≠ abstraction | Sau bước 5 (3 chỗ dùng) |
| Refactor Admin console sang viewport-fit | Admin là công cụ, scroll là đúng cho bảng dữ liệu | Không |
| Refactor Shop / Wardrobe / Profile | Không thuộc nhóm "màn hình game" | Có yêu cầu riêng |
| Animation chuyển tab/trang | Không nằm trong yêu cầu, tăng rủi ro layout shift | Có brief motion |
| Deep-link `?page=2` cho pagination | 2 trang, không ai bookmark | Số trang > 3 hoặc cần share link |

`ponytail:` số item/trang là hằng số cố định (10/6/4) thay vì tính động — trần là màn hình rất cao
sẽ dư khoảng trắng; nâng cấp bằng `ResizeObserver` chỉ khi có khiếu nại thật.
