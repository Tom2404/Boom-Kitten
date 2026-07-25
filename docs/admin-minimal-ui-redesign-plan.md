# Implementation Plan: Admin/Manager Minimal UI Redesign

## Goal

Chuyển toàn bộ giao diện dành cho các role quản trị (`super_admin`, `operator`, `moderator`, `analyst`) sang phong cách flat/minimal, dễ đọc, nhất quán với brand, responsive và đạt WCAG 2.1 AA; giữ nguyên khu vực User theo phong cách retro pixel và không thay đổi nghiệp vụ, API, phân quyền hoặc cơ chế audit hiện có.

## Trạng thái triển khai

- Hoàn tất foundation, Admin shell, shared primitives và toàn bộ panel Admin/Manager.
- Hoàn tất pilot Overview/Players, responsive layout và keyboard focus cho dialog/drawer.
- Verification: 42/42 client tests pass, production build pass, các cặp màu token chính đạt WCAG AA.
- Visual browser smoke check còn cần chạy lại khi Browser webview của Codex attach được; production artifact đã build thành công.

## Success criteria

- Khu vực User không bị thay đổi giao diện hoặc hành vi.
- Admin Console không còn các dấu hiệu retro chủ đạo: font display pixel, viền khối 3–4px, shadow lệch đậm, nền lưới pixel và màu nền bão hòa cao.
- Tất cả role tiếp tục chỉ thấy đúng navigation và action theo permission từ `/api/admin/me`.
- Loading, empty, error, success, disabled và destructive states có cách thể hiện nhất quán, không truyền đạt chỉ bằng màu.
- Các luồng chính hoạt động bằng bàn phím và hiển thị đúng tại 320px, 768px, 1024px và 1440px.
- `npm test --prefix client` và `npm run build --prefix client` đều pass.

## Scope

### In scope

- Admin shell, sidebar/navigation, session states và language switcher.
- Shared Admin primitives trong `client/src/pages/admin/ui.jsx`.
- Tất cả panel và dialog trong `client/src/pages/admin/`.
- Design tokens, typography, spacing, color, border, focus và motion dành riêng cho Admin.
- Responsive, accessibility và visual regression smoke check theo từng checkpoint.

### Out of scope

- Giao diện User, Game, Lobby, Shop, Profile và các hiệu ứng VFX.
- Thay đổi API, database, RBAC, permission matrix hoặc business logic.
- Tạo ứng dụng Manager riêng; các role quản trị tiếp tục dùng chung Admin Console.
- Thêm Ant Design, Material UI hoặc component library mới.
- Dark mode, theme builder hoặc cơ chế tùy biến giao diện cho từng admin.

## Architecture decisions

- Giữ React 18, Tailwind CSS và Material Symbols đang có; không thêm dependency.
- Dùng `DM Sans` đã cấu hình làm font Admin để tránh tải thêm font và tách khỏi pixel display font.
- Scope token/style mới dưới Admin shell để không làm rò rỉ thay đổi sang User UI.
- Dùng màu Boom-Kitten đỏ/cam như accent có kiểm soát; phần lớn canvas, surface và border dùng neutral.
- Nâng shared primitives trước, sau đó migrate từng vertical slice. Không rewrite đồng loạt toàn bộ panel.
- Giữ nguyên props, state, API calls và permission checks khi đổi presentation.

## Visual contract

| Element | Decision |
|---|---|
| Canvas | Neutral warm gray/off-white, không dùng nền lưới |
| Surface | White, border 1px, shadow không có hoặc rất nhẹ |
| Radius | 6px cho control, 8–10px cho card/dialog |
| Typography | DM Sans; page title 24–30px, section title 18–20px, body 14px |
| Brand accent | Đỏ/cam dùng cho active state, CTA chọn lọc và focus |
| Semantic color | Success/warning/error/info có nền nhạt, text đủ contrast và luôn kèm label/icon |
| Density | Bảng và filter ưu tiên compact/comfortable, không dùng spacing kiểu landing page |
| Motion | 150–250ms, chỉ `opacity`/`transform`; tôn trọng `prefers-reduced-motion` |
| Focus | Focus ring rõ, tương phản tối thiểu 3:1 |

## Dependency graph

```text
Admin-scoped tokens
  └── Shared UI primitives
        ├── Admin shell/navigation
        ├── Overview pilot
        ├── Player operations
        ├── Logs and analytics
        └── Remaining feature panels
              └── Accessibility/responsive/cross-role verification
```

## Phase 1 — Foundation

### Task 1: Establish Admin-scoped design tokens

**Description:** Thêm bộ token tối thiểu cho canvas, surface, text, border, brand accent, semantic states, radius và motion. Token phải được scope vào Admin Console để User UI không bị ảnh hưởng.

**Acceptance criteria:**

- Admin có token neutral/brand/semantic riêng và dùng `DM Sans`.
- Không thay đổi giá trị các token `--pop-*` đang phục vụ User UI.
- Có xử lý `prefers-reduced-motion`.

**Verification:**

- `npm run build --prefix client`.
- Mở một trang User và Admin, xác nhận User không đổi font/màu.

**Dependencies:** None.

**Files likely touched:** `client/src/styles.css`, `client/src/pages/admin/AdminPage.jsx`.

**Estimated scope:** S.

### Task 2: Restyle shared Admin primitives

**Description:** Chuyển `AdminCard`, `SectionHeader`, `Toolbar`, `StatusBadge`, `Button`, `Field`, input, `Alert`, `EmptyState`, `SkeletonBlock`, `DataTable`, `Pagination` và `ConfirmDialog` sang visual contract mới, giữ nguyên public props.

**Acceptance criteria:**

- Shared primitives dùng border 1px, radius nhất quán và không còn block shadow.
- Button, input, dialog và table có focus/disabled/loading states rõ ràng.
- Dialog tiếp tục hỗ trợ Escape, focus ban đầu và trả focus sau khi đóng.

**Verification:**

- `npm test --prefix client`.
- `npm run build --prefix client`.
- Keyboard smoke check cho `ConfirmDialog` và pagination.

**Dependencies:** Task 1.

**Files likely touched:** `client/src/pages/admin/ui.jsx`.

**Estimated scope:** S.

### Task 3: Redesign Admin shell and navigation

**Description:** Đổi canvas, sidebar, role/session summary, active navigation và language switcher; giữ nguyên resolution của tab và permission-aware navigation.

**Acceptance criteria:**

- Navigation vẫn nhóm theo cấu trúc hiện tại và chỉ hiển thị item được phép.
- Active, hover và focus states phân biệt rõ nhưng không dùng pixel border/shadow.
- Mobile dùng navigation gọn, không gây horizontal overflow; desktop giữ sidebar dễ quét.

**Verification:**

- `node --test client/test/adminNavigation.test.js client/test/adminPanelAccess.test.js`.
- Manual check với URL có `adminTab`, refresh vẫn vào đúng tab.
- Kiểm tra layout tại 320px, 768px, 1024px và 1440px.

**Dependencies:** Tasks 1–2.

**Files likely touched:** `client/src/pages/admin/AdminPage.jsx`.

**Estimated scope:** S.

### Checkpoint 1: Foundation review

- Client tests và build pass.
- User UI không có visual regression quan sát được.
- Shell, shared controls và session error/loading state được duyệt trước khi migrate panel.

## Phase 2 — Pilot vertical slices

### Task 4: Migrate Operations Overview

**Description:** Dùng Overview làm pilot cho KPI, chart, quick actions, audit table và data-quality warnings.

**Acceptance criteria:**

- KPI có hierarchy rõ, không dùng card màu bão hòa toàn khối.
- Chart có accessible label và không phụ thuộc hover để đọc dữ liệu quan trọng.
- Loading, partial-data, error và empty states tuân theo shared primitives.

**Verification:**

- `npm test --prefix client`.
- `npm run build --prefix client`.
- Manual check range 7D/30D và URL state.

**Dependencies:** Checkpoint 1.

**Files likely touched:** `client/src/pages/admin/OverviewPanel.jsx`.

**Estimated scope:** S.

### Task 5: Migrate Players list and filters

**Description:** Chuyển player search/filter, saved views, bulk selection và table sang density phù hợp cho công cụ vận hành.

**Acceptance criteria:**

- Table vẫn đọc được với dữ liệu dài và không mất action ở desktop/mobile.
- Filter, saved view, pagination và bulk selection giữ nguyên hành vi.
- Không làm thay đổi calculation, permission hoặc mutation logic.

**Verification:**

- `node --test client/test/adminSavedViews.test.js client/test/adminBulkJob.test.js`.
- `npm run build --prefix client`.
- Manual check search, filter, pagination và empty state.

**Dependencies:** Tasks 2–3.

**Files likely touched:** `client/src/pages/admin/PlayersPanel.jsx`, `client/src/pages/admin/SavedViewsBar.jsx`.

**Estimated scope:** M.

### Task 6: Migrate player detail and destructive dialogs

**Description:** Restyle player drawer, currency/ELO/status/role dialogs và bulk adjustment dialog, ưu tiên độ rõ của before/after, policy limit và confirmation.

**Acceptance criteria:**

- Before/after, reason, policy threshold và critical confirmation vẫn hiện rõ.
- Drawer/dialog không mất focus management, Escape hoặc disabled-submit protection.
- Danger action không truyền đạt chỉ bằng màu và không bị đặt sát action an toàn.

**Verification:**

- `node --test client/test/adminMutation.test.js client/test/adminRoles.test.js`.
- Manual keyboard check: mở, tab xuyên dialog, Escape, đóng và trả focus.
- `npm run build --prefix client`.

**Dependencies:** Task 5.

**Files likely touched:** `client/src/pages/admin/PlayerDetailDrawer.jsx`, `client/src/pages/admin/BulkAdjustmentDialog.jsx`, `client/src/pages/admin/PlayersPanel.jsx`.

**Estimated scope:** M.

### Checkpoint 2: Pilot approval

- Overview và Players đại diện được cho dashboard, table, filter, drawer và destructive dialog.
- Duyệt trực quan trước khi áp dụng cùng ngôn ngữ thiết kế cho các panel còn lại.
- Client tests và build pass.

## Phase 3 — Feature panel migration

### Task 7: Migrate governance and content panels

**Description:** Áp dụng shared system cho Catalog, Quests và Seasons mà không đổi CRUD hoặc reset workflows.

**Acceptance criteria:**

- Form/table/action hierarchy nhất quán với pilot.
- Destructive actions dùng confirm state chuẩn.
- Loading, empty và error states không bị bỏ sót.

**Verification:**

- `npm test --prefix client`.
- Manual CRUD smoke check cho từng panel.
- `npm run build --prefix client`.

**Dependencies:** Checkpoint 2.

**Files likely touched:** `client/src/pages/admin/CatalogPanel.jsx`, `client/src/pages/admin/QuestsPanel.jsx`, `client/src/pages/admin/SeasonsPanel.jsx`.

**Estimated scope:** M.

### Task 8: Migrate communications and live operations

**Description:** Restyle Announcements và Live Ops, tập trung vào status, scheduling, timezone, validation và publish/rollback safety.

**Acceptance criteria:**

- Draft/scheduled/sent/cancelled và live-ops version state dễ phân biệt.
- Publish, rollback, cancel và send actions giữ nguyên permission/confirmation.
- Form dài vẫn dễ quét ở desktop và xếp chồng hợp lý trên mobile.

**Verification:**

- `node --test client/test/adminLiveOps.test.js`.
- Manual announcement schedule/cancel và live-ops publish preview.
- `npm run build --prefix client`.

**Dependencies:** Checkpoint 2.

**Files likely touched:** `client/src/pages/admin/AnnouncementsPanel.jsx`, `client/src/pages/admin/LiveOpsPanel.jsx`.

**Estimated scope:** M.

### Task 9: Migrate safety and incident operations

**Description:** Restyle Moderation, Rooms và Incidents; ưu tiên severity, ownership, timeline, stale-room signal và critical interventions.

**Acceptance criteria:**

- Severity/status có text label; màu chỉ là tín hiệu bổ sung.
- Critical room/moderation action giữ reason, confirmation và permission guard.
- Split/detail views không overflow tại các breakpoint mục tiêu.

**Verification:**

- `npm test --prefix client`.
- Manual role smoke check với moderator, operator và super_admin.
- `npm run build --prefix client`.

**Dependencies:** Checkpoint 2.

**Files likely touched:** `client/src/pages/admin/ModerationPanel.jsx`, `client/src/pages/admin/RoomsPanel.jsx`, `client/src/pages/admin/IncidentsPanel.jsx`.

**Estimated scope:** M.

### Task 10: Migrate jobs and tournaments

**Description:** Restyle Job Center và Tournaments, giữ rõ progress, result, failure, transition và payout state.

**Acceptance criteria:**

- Job progress/failure/result dễ quét và có text thay cho color-only state.
- Tournament transitions và payout confirmation giữ nguyên safety logic.
- Bảng/danh sách lớn không gây page-level horizontal overflow.

**Verification:**

- `node --test client/test/adminBulkJob.test.js client/test/adminTournament.test.js`.
- Manual retry/result download và tournament transition smoke check.
- `npm run build --prefix client`.

**Dependencies:** Checkpoint 2.

**Files likely touched:** `client/src/pages/admin/JobsPanel.jsx`, `client/src/pages/admin/TournamentsPanel.jsx`.

**Estimated scope:** M.

### Task 11: Migrate logs and product analytics

**Description:** Restyle audit/transaction investigation và product analytics, ưu tiên dense data, filter clarity, chart labeling và export actions.

**Acceptance criteria:**

- Logs có sticky header, filter rõ và diff/action dễ quét.
- Analytics chart/table có accessible name và fallback khi thiếu dữ liệu.
- Export action phản ánh đúng active filters.

**Verification:**

- `npm test --prefix client`.
- Manual filter/pagination/export smoke check.
- `npm run build --prefix client`.

**Dependencies:** Checkpoint 2.

**Files likely touched:** `client/src/pages/admin/LogsPanel.jsx`, `client/src/pages/admin/ProductAnalyticsPanel.jsx`.

**Estimated scope:** M.

## Phase 4 — Consolidation and release verification

### Task 12: Remove remaining retro styling from Admin scope

**Description:** Tìm và loại bỏ các pixel-only class còn sót trong `client/src/pages/admin/`, đồng thời gom các style lặp lại về shared primitives khi việc đó thực sự giảm code.

**Acceptance criteria:**

- Không còn `font-pop-display`, border 3–4px hoặc block shadow trong Admin scope.
- Không thêm abstraction chỉ dùng một lần.
- Không sửa file User để đạt kết quả.

**Verification:**

```powershell
rg -n "font-pop-display|border-\[(3|4)px\]|shadow-\[[^]]*var\(--pop-black\)" client/src/pages/admin
```

Kết quả mong đợi: không có match.

**Dependencies:** Tasks 7–11.

**Files likely touched:** Chỉ các file Admin còn match.

**Estimated scope:** S.

### Task 13: Accessibility, responsive and cross-role verification

**Description:** Chạy ma trận smoke test cuối cho keyboard, focus, contrast, responsive, permission-aware navigation và các trạng thái dữ liệu.

**Acceptance criteria:**

- Tab order hợp lý; dialog/drawer quản lý focus đúng; không có action chỉ dùng `div` click.
- Không có page-level horizontal overflow tại 320/768/1024/1440px.
- Bốn role chỉ thấy và thao tác đúng capability hiện có.
- Loading, empty, error, success và disabled states được kiểm tra trên các surface đại diện.

**Verification:**

- `npm test --prefix client`.
- `npm run build --prefix client`.
- Browser smoke matrix tại 320px, 768px, 1024px và 1440px.
- Manual role matrix: `super_admin`, `operator`, `moderator`, `analyst`.

**Dependencies:** Task 12.

**Files likely touched:** Chỉ các file có lỗi được phát hiện.

**Estimated scope:** M.

### Checkpoint 3: Complete

- Toàn bộ success criteria đạt.
- Client tests và production build pass.
- User UI không có visual regression quan sát được.
- Admin Console được duyệt ở bốn breakpoint và bốn role.
- Không có thay đổi ngoài scope về API, permission hoặc business logic.

## Risks and mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| Shared global CSS làm đổi User UI | High | Scope token dưới Admin shell; kiểm tra User ở mỗi checkpoint |
| Restyle làm hỏng permission/action visibility | High | Giữ nguyên data flow và chạy navigation/panel-access tests sau shell và cuối mỗi phase |
| Worktree hiện có nhiều thay đổi chưa commit | High | Diff từng file trước khi sửa; không reset/overwrite; chia task nhỏ và checkpoint thường xuyên |
| Panel dùng nhiều class retro inline ngoài shared primitives | Medium | Pilot trước, sau đó migrate theo panel; dùng `rg` làm completion check |
| Minimal quá mức làm giảm data density | Medium | Dùng compact tables/toolbars; đánh giá bằng Players và Logs pilot |
| Màu semantic nhạt không đủ contrast | Medium | Kiểm tra WCAG AA; luôn kèm text/icon, không dùng color-only state |
| Scope lan sang redesign nghiệp vụ | Medium | Không đổi props/API/state; mọi phát hiện UX cần đổi flow được tách thành task khác để duyệt |

## Execution rule

Không bắt đầu Phase 2 trước khi Checkpoint 1 được duyệt và không mở rộng toàn bộ panel trước khi Checkpoint 2 được duyệt. Mỗi task phải kết thúc với client tests/build pass hoặc ghi rõ regression đã tồn tại trước task.
