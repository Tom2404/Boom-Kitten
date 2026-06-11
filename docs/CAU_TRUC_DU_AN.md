# Cấu Trúc Dự Án Mèo Nổ (Exploding Kittens Online)

Tài liệu này quy định chi tiết cấu trúc thư mục, tệp tin và các Model Database của dự án **Mèo Nổ** (Exploding Kittens Online). Dự án được xây dựng dưới dạng **Monorepo** với hai phần độc lập: `client/` (Frontend) và `server/` (Backend).

---

## 1. Cấu Trúc Thư Mục Tổng Quan

```text
exploding-kittens/
├── client/                 # Mã nguồn Frontend (React 18 + Vite + Tailwind CSS)
│   ├── src/
│   │   ├── components/     # Các Component UI tái sử dụng
│   │   ├── pages/          # Các trang giao diện chính
│   │   ├── hooks/          # Custom React Hooks (Auth, Socket, Game)
│   │   ├── store/          # Quản lý State toàn cục (Zustand / Context API)
│   │   ├── utils/          # Hàm tiện ích (Xử lý bài, âm thanh)
│   │   ├── assets/         # Tài nguyên tĩnh (Hình ảnh, Âm thanh)
│   │   ├── App.jsx         # Component gốc quản lý Routing/Pages
│   │   └── main.jsx        # Điểm khởi đầu ứng dụng React
│   ├── index.html          # File HTML chính
│   ├── vite.config.js      # Cấu hình Vite
│   ├── tailwind.config.js  # Cấu hình Tailwind CSS
│   └── package.json        # Dependencies & Scripts của Client
│
├── server/                 # Mã nguồn Backend (Node.js + Express + Socket.io)
│   ├── game/               # Logic cốt lõi của trò chơi
│   ├── routes/             # REST API Routes
│   ├── models/             # Mongoose Database Models
│   ├── sockets/            # Socket.io Event Handlers
│   ├── middleware/         # Middleware bảo mật, xác thực & xử lý lỗi
│   ├── index.js            # Điểm khởi chạy Express Server
│   ├── .env.example        # Bản mẫu cấu hình biến môi trường
│   └── package.json        # Dependencies & Scripts của Server
│
├── .gitignore              # Danh sách tệp tin bỏ qua khi Git commit
└── README.md               # Hướng dẫn cài đặt và chạy dự án
```

---

## 2. Chi Tiết Các File & Thư Mục

### 2.1. Frontend (`client/src/`)

- **`components/`**:
  - `Card.jsx`: Hiển thị thông tin, hình ảnh và hoạt ảnh (Framer Motion) của từng lá bài.
  - `PlayerHand.jsx`: Hiển thị danh sách lá bài của người chơi hiện tại (chỉ hiển thị bài của mình).
  - `GameBoard.jsx`: Khu vực bàn chơi chính, chứa bài bốc, bài bỏ, và thông tin lượt đi.
  - `DeckPile.jsx`: Hiển thị xấp bài bốc còn lại, cho phép click để bốc bài.
  - `DiscardPile.jsx`: Hiển thị lá bài vừa được đánh gần nhất trên cùng.
  - `PlayerAvatar.jsx`: Hiển thị ảnh đại diện, khung viền ảnh (Skin/Frame) và trạng thái sống sót.
  - `CoinDisplay.jsx`: Hiển thị số Coin/Gem người chơi đang sở hữu.
  - `Emote.jsx`: Menu biểu cảm nhanh (Emotes) gửi đến các người chơi khác.

- **`pages/`**:
  - `Home.jsx`: Trang chủ, giới thiệu trò chơi, nút dẫn sang Login/Register hoặc phòng chờ.
  - `Login.jsx` & `Register.jsx`: Biểu mẫu đăng nhập và đăng ký tài khoản.
  - `Lobby.jsx`: Giao diện phòng chờ trước khi chơi (tạo phòng, tham gia phòng, bắt đầu game).
  - `Game.jsx`: Màn hình trận đấu chính phối hợp các component trên GameBoard.
  - `Profile.jsx`: Xem chi tiết thông tin cá nhân, chỉ số thắng thua (stats), bạn bè.
  - `Leaderboard.jsx`: Bảng xếp hạng Top 20 người chơi có tỷ lệ thắng cao nhất.
  - `Shop.jsx`: Cửa hàng mua Skin, Emote, Khung avatar bằng Coin/Gem.

- **`hooks/`**:
  - `useSocket.js`: Quản lý kết nối Socket.io-client, lắng nghe và phát tín hiệu.
  - `useGame.js`: Tương tác với logic game, truyền dữ liệu từ store đến UI.
  - `useAuth.js`: Quản lý trạng thái đăng nhập, đăng xuất, làm mới Token.

- **`store/`**:
  - `gameStore.js`: State quản lý trạng thái phòng chơi hiện tại, danh sách bài trên tay, lượt đi.
  - `authStore.js`: State quản lý JWT token, thông tin người dùng đang đăng nhập.
  - `shopStore.js`: State quản lý danh sách vật phẩm và ví coin của người chơi.

- **`utils/`**:
  - `cardHelpers.js`: Hàm phụ trợ định dạng tên bài, hiệu ứng hình ảnh.
  - `soundManager.js`: Quản lý hiệu ứng âm thanh (bốc bài, nổ, nope, thắng cuộc).

---

### 2.2. Backend (`server/`)

- **`game/`**:
  - `deck.js`: Chứa các hàm tạo bộ bài (`createDeck`), xáo bài (`shuffleDeck`), chia bài ban đầu (`dealCards`), chèn mèo nổ vào vị trí ngẫu nhiên (`insertExplodingKittens`).
  - `gameLogic.js`: Quản lý tất cả hiệu ứng của các quân bài (Attack, Skip, See the Future, Nope, Defuse, Favor, Combo mèo thường).
  - `roomManager.js`: Quản lý danh sách các phòng chơi đang hoạt động (`createRoom`, `joinRoom`, `leaveRoom`, `startGame`).

- **`models/`**: (Xem chi tiết ở mục 3)
- **`routes/`**:
  - `auth.js`: Các API đăng ký, đăng nhập, làm mới token, đăng xuất.
  - `user.js`: Các API lấy thông tin cá nhân, cập nhật skin, danh sách bạn bè, lịch sử đấu.
  - `room.js`: Danh sách các phòng chờ công cộng, thông tin chi tiết một phòng chơi.
  - `shop.js`: Lấy vật phẩm cửa hàng, mua vật phẩm.
  - `leaderboard.js`: Xếp hạng người chơi dựa trên win rate.

- **`sockets/`**:
  - `gameSocket.js`: Trung tâm kết nối WebSocket, điều phối toàn bộ luồng sự kiện thời gian thực giữa server và client.

- **`middleware/`**:
  - `authMiddleware.js`: Kiểm tra tính hợp lệ của JWT Access Token trước khi truy cập API bảo mật.
  - `errorHandler.js`: Middleware tập trung bắt và xử lý lỗi hệ thống, trả về định dạng JSON chuẩn.

---

## 3. Database Models (Mongoose Schemas)

Hệ thống sử dụng MongoDB làm cơ sở dữ liệu. Các model được thiết kế như sau:

### 3.1. User Model (`User.js`)
```javascript
{
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  avatar: { type: String, default: 'default_avatar.png' },
  coins: { type: Number, default: 100 },
  gems: { type: Number, default: 0 },
  ownedSkins: [{ type: String }],          // Danh sách skin đã mua
  activeSkin: { type: String, default: 'default' },
  friends: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  stats: {
    wins: { type: Number, default: 0 },
    losses: { type: Number, default: 0 },
    totalGames: { type: Number, default: 0 },
    currentStreak: { type: Number, default: 0 },
    longestStreak: { type: Number, default: 0 }
  },
  rank: { type: String, enum: ['Bronze', 'Silver', 'Gold', 'Diamond', 'Legend'], default: 'Bronze' },
  eloPoints: { type: Number, default: 1000 },
  lastLoginDate: { type: Date, default: Date.now },
  createdAt: { type: Date, default: Date.now }
}
```

### 3.2. Room Model (`Room.js`)
```javascript
{
  code: { type: String, required: true, unique: true }, // Mã phòng 6 ký tự
  host: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  players: [{
    userId: { type: String, required: true },
    username: { type: String },
    avatar: { type: String }
  }],
  maxPlayers: { type: Number, default: 5, min: 2, max: 5 },
  status: { type: String, enum: ['waiting', 'playing', 'finished'], default: 'waiting' },
  isPublic: { type: Boolean, default: true },
  gameState: { type: Object, default: null } // Lưu trạng thái ván đấu hiện tại
}
```

### 3.3. GameHistory Model (`GameHistory.js`)
```javascript
{
  roomId: { type: String, required: true },
  players: [{
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    rank: { type: Number },                   // Thứ hạng khi kết thúc (1: Thắng, 2+: Bị loại lần lượt)
    result: { type: String, enum: ['win', 'lose'] }
  }],
  winner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  duration: { type: Number, default: 0 },     // Thời gian ván đấu tính bằng giây
  cardsPlayed: { type: Number, default: 0 },  // Tổng số lá bài đã đánh trong ván
  playedAt: { type: Date, default: Date.now }
}
```

### 3.4. ShopItem Model (`ShopItem.js`)
```javascript
{
  name: { type: String, required: true },
  type: { type: String, enum: ['skin', 'emote', 'avatar_frame'], required: true },
  price: {
    coins: { type: Number, default: 0 },
    gems: { type: Number, default: 0 }
  },
  rarity: { type: String, enum: ['common', 'rare', 'epic', 'legendary'], default: 'common' },
  isLimited: { type: Boolean, default: false },
  availableUntil: { type: Date },             // Hạn chót mua nếu là giới hạn
  imageUrl: { type: String, required: true },
  previewUrl: { type: String }
}
```

### 3.5. Transaction Model (`Transaction.js`)
```javascript
{
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, enum: ['earn', 'spend', 'purchase'], required: true }, // Nhận/Tiêu/Nạp
  amount: { type: Number, required: true },
  currency: { type: String, enum: ['coin', 'gem'], required: true },
  description: { type: String },              // Lý do giao dịch (Ví dụ: "Win game", "Buy skin Epic")
  createdAt: { type: Date, default: Date.now }
}
```
