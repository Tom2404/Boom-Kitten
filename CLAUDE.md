# Hướng Dẫn Phát Triển Dự Án Boom-Kitten (Mèo Nổ)

Tài liệu này chứa các quy tắc cốt lõi, quy ước đặt tên (naming conventions) và cấu trúc dự án. Kết hợp tài liệu này cùng công cụ **CodeGraph**, các AI model khác có thể hiểu được toàn bộ dự án ngay lập tức mà không cần đọc lại toàn bộ codebase.

---

## 1. Tổng Quan Dự Án
- **Tên dự án**: Mèo Nổ (Boom-Kitten) - Khung game Exploding Kittens nhiều người chơi (React + Express + Socket.io + MongoDB).
- **Công nghệ chính**:
  - **Frontend (Client)**: React 18 (Vite) + Tailwind CSS + Socket.io-client + Framer Motion.
  - **Backend (Server)**: Node.js (Express) + Socket.io + MongoDB (Mongoose) + JWT Auth.
- **Cơ chế điều hướng (Client)**: Single Page Application đơn giản, sử dụng state-driven navigation (`page` state trong [App.jsx](file:///d:/Project/Boom-Kitten/client/src/App.jsx)) thay vì React Router.
- **State Management (Client)**: Lưu trữ in-memory đơn giản trong thư mục `/client/src/store/` (như `authStore.js`, `gameStore.js`, `shopStore.js`) để dễ dàng tích hợp Zustand/Redux về sau.

---

## 2. Quy Tắc Đặt Tên & Viết Code (Naming Conventions & Code Styles)

### Đặt tên File & Thư mục
- **React Components / Pages**: Viết theo kiểu **PascalCase** với đuôi `.jsx`.
  - *Ví dụ*: `GameBoard.jsx`, `Card.jsx`, `Home.jsx`, `Lobby.jsx`.
- **Database Models (Mongoose)**: Viết theo kiểu **PascalCase** với đuôi `.js`.
  - *Ví dụ*: `User.js`, `Room.js`, `Transaction.js`, `Quest.js`.
- **Logic / Helpers / Middlewares / Routes (JS)**: Viết theo kiểu **camelCase** với đuôi `.js`.
  - *Ví dụ*: `gameLogic.js`, `deck.js`, `roomManager.js`, `auth.js`, `gameSocket.js`.

### Biến, Thuộc tính & Hàm (Variables, Properties & Functions)
- Luôn sử dụng **camelCase** cho tên biến, thuộc tính đối tượng, tham số và hàm.
  - *Ví dụ*: `isLoggedIn`, `makeAccessToken`, `playCard`, `removeCardFromHand`, `ownedSkins`, `activeSkin`.

### Hằng số (Constants)
- Luôn sử dụng **UPPER_SNAKE_CASE** cho hằng số global hoặc config tĩnh.
  - *Ví dụ*: `CARD_COUNTS`, `SKIN_COUNTS`, `PAGES`.

### Sự kiện Socket (Socket Events)
- Đặt tên theo dạng `phân_vùng:hành_động` hoặc `camelCase`.
  - *Ví dụ*: `room:updated`, `room:leave`, `game:privateHand`, `server_announcement`.

### Kiểu Module (Module System)
- **Client (Frontend)**: Sử dụng ES6 Module (`import`/`export`).
- **Server (Backend)**: Sử dụng CommonJS Module (`require`/`module.exports`).

---

## 3. Cấu Trúc Thư Mục Chính (Project Structure)

```
Boom-Kitten/
├── client/                     # Mã nguồn Frontend (React + Vite)
│   ├── src/
│   │   ├── components/         # UI Components dùng chung (Card, PlayerHand, PlayerAvatar...)
│   │   ├── pages/              # Các trang giao diện (Home, Game, Shop, Leaderboard, Admin...)
│   │   ├── store/              # Quản lý state in-memory đơn giản
│   │   ├── hooks/              # Custom hooks (như useSocket.js dùng chung socket instance)
│   │   ├── utils/              # Utilities (như skin cấu hình cardSkins.js)
│   │   └── App.jsx             # File điều hướng & kết nối socket chính ở Client
├── server/                     # Mã nguồn Backend (Express + Socket.io)
│   ├── game/                   # Core logic của game (deck.js, gameLogic.js, roomManager.js)
│   ├── models/                 # Mongoose schemas (User, Room, Quest, Transaction...)
│   ├── routes/                 # Các REST API endpoints (auth, user, shop, leaderboard, admin...)
│   ├── sockets/                # Quản lý Socket.io events (gameSocket.js)
│   ├── middleware/             # Middlewares (như xác thực JWT auth.js)
│   └── index.js                # Điểm khởi chạy server
```

---

## 4. Luồng Nghiệp Vụ Cốt Lõi (Core Workflows)

### Luồng Game Realtime (Socket.io)
1. **Trạng thái Game (GameState)**: Server là **Single Source of Truth**. Trạng thái được cập nhật tập trung tại `server/game/gameLogic.js`.
2. **Khi người chơi hành động** (đánh bài, rút bài, nope...):
   - Client phát (emit) sự kiện lên server thông qua `useSocket()` (ví dụ: `game:play`, `game:draw`).
   - Server nhận sự kiện tại `server/sockets/gameSocket.js`.
   - Server gọi hàm xử lý tương ứng trong `server/game/gameLogic.js` để làm thay đổi `gameState` (mutative hoặc pure).
   - Server broadcast `room:updated` chứa thông tin công khai (số bài còn lại, bài đã đánh...) cho tất cả người chơi trong phòng.
   - Trạng thái bài trên tay của từng người chơi được gửi riêng tư qua sự kiện `game:privateHand` nhằm chống hack/cheat.

### Hệ Thống Xác Thực (Auth Workflow)
- Sử dụng cặp token JWT: **Access Token** (hết hạn nhanh - mặc định 15 phút) và **Refresh Token** (hết hạn lâu - mặc định 7 ngày).
- Tích hợp middleware xác thực JWT để đính kèm `req.user` vào request phục vụ REST APIs.

---

## 5. Hướng Dẫn Sử Dụng CodeGraph Để Định Vị Nhanh (CodeGraph Navigation)

Dự án đã được index bằng CodeGraph (có thư mục `.codegraph/` ở thư mục gốc). Khi AI Model mới tiếp cận dự án, thay vì đọc tuần tự từng file, hãy sử dụng các lệnh hoặc công cụ CodeGraph sau:

1. **Tìm hiểu logic game và các lá bài**:
   - Khám phá các hàm chơi bài chính: `codegraph explore "playCard"`
   - Khám phá các hàm rút bài hoặc phạt: `codegraph explore "drawCard"` hoặc `codegraph explore "handleAttack"`
2. **Tìm hiểu cấu trúc Dữ liệu (Mongoose Models)**:
   - Truy vấn cấu trúc User: `codegraph explore "User"`
   - Truy vấn cấu trúc Phòng đấu: `codegraph explore "Room"`
3. **Tìm hiểu giao diện Frontend**:
   - Truy vấn Component chính hiển thị bàn đấu: `codegraph explore "GameBoard"`
   - Xem component biểu diễn lá bài: `codegraph explore "Card"`
4. **Tìm hiểu các Socket Event**:
   - Truy vấn file phân phối sự kiện socket: `codegraph explore "gameSocket"`
