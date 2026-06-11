# Đặc Tả REST API (REST API Route Specification)

Tài liệu này cung cấp chi tiết danh sách tất cả các điểm cuối (endpoints) HTTP REST API trong dự án **Mèo Nổ**, bao gồm các phương thức, yêu cầu tham số truyền vào, cấu trúc phản hồi và phân quyền bảo mật (JWT).

Mặc định, tất cả các API nằm dưới đường dẫn cơ sở `/api`.

---

## 1. API Xác Thực (Auth Routes — `/api/auth`)

Các API này hỗ trợ người dùng đăng ký, đăng nhập và quản lý phiên làm việc bằng JWT Token.

### 1.1. Đăng Ký Tài Khoản (`POST /api/auth/register`)
- **Phân quyền**: Công khai
- **Request Body**:
  ```json
  {
    "username": "user123",
    "email": "user123@example.com",
    "password": "strongpassword"
  }
  ```
- **Response (201 Created)**:
  ```json
  {
    "message": "Đăng ký thành công!",
    "user": {
      "id": "mongo_user_id",
      "username": "user123",
      "email": "user123@example.com"
    }
  }
  ```

### 1.2. Đăng Nhập (`POST /api/auth/login`)
- **Phân quyền**: Công khai
- **Request Body**:
  ```json
  {
    "email": "user123@example.com",
    "password": "strongpassword"
  }
  ```
- **Response (200 OK)**:
  ```json
  {
    "message": "Đăng nhập thành công!",
    "accessToken": "ey...",
    "refreshToken": "ey...",
    "user": {
      "id": "mongo_user_id",
      "username": "user123",
      "coins": 100,
      "gems": 0
    }
  }
  ```

### 1.3. Làm Mới Token (`POST /api/auth/refresh`)
- **Phân quyền**: Công khai (yêu cầu gửi Refresh Token trong Header hoặc Cookie)
- **Request Body**:
  ```json
  {
    "refreshToken": "ey..."
  }
  ```
- **Response (200 OK)**:
  ```json
  {
    "accessToken": "ey_new_access_token",
    "refreshToken": "ey_new_refresh_token"
  }
  ```

### 1.4. Đăng Xuất (`POST /api/auth/logout`)
- **Phân quyền**: Công khai
- **Request Body**:
  ```json
  {
    "refreshToken": "ey..."
  }
  ```
- **Response (200 OK)**:
  ```json
  {
    "message": "Đăng xuất thành công!"
  }
  ```

---

## 2. API Người Dùng (User Routes — `/api/users`)

Quản lý hồ sơ cá nhân, lịch sử đấu và mạng lưới bạn bè.

### 2.1. Lấy Hồ Sơ Cá Nhân Hiện Tại (`GET /api/users/me`)
- **Phân quyền**: Yêu cầu JWT Access Token (`Authorization: Bearer <token>`)
- **Response (200 OK)**:
  ```json
  {
    "id": "mongo_user_id",
    "username": "user123",
    "email": "user123@example.com",
    "avatar": "default_avatar.png",
    "coins": 100,
    "gems": 0,
    "activeSkin": "default",
    "ownedSkins": ["default"],
    "rank": "Bronze",
    "eloPoints": 1000,
    "stats": {
      "wins": 0,
      "losses": 0,
      "totalGames": 0,
      "currentStreak": 0,
      "longestStreak": 0
    }
  }
  ```

### 2.2. Cập Nhật Hồ Sơ Cá Nhân (`PUT /api/users/me`)
- **Phân quyền**: Yêu cầu JWT Access Token
- **Request Body** (tất cả các trường đều là tùy chọn):
  ```json
  {
    "username": "new_name123",
    "avatar": "avatar_kitty.png",
    "activeSkin": "skin_space_kitten"
  }
  ```
- **Response (200 OK)**:
  ```json
  {
    "message": "Cập nhật hồ sơ thành công!",
    "user": { ... } // Đối tượng user đã cập nhật
  }
  ```

### 2.3. Lấy Hồ Sơ Công Khai Của Người Khác (`GET /api/users/:id`)
- **Phân quyền**: Công khai
- **Response (200 OK)**:
  ```json
  {
    "id": "mongo_user_id",
    "username": "user123",
    "avatar": "avatar_kitty.png",
    "rank": "Bronze",
    "eloPoints": 1000,
    "stats": {
      "wins": 5,
      "losses": 3,
      "totalGames": 8
    }
  }
  ```

### 2.4. Lấy Lịch Sử Đấu Của Bản Thân (`GET /api/users/me/history`)
- **Phân quyền**: Yêu cầu JWT Access Token
- **Query Parameters**: `page` (mặc định 1), `limit` (mặc định 10)
- **Response (200 OK)**:
  ```json
  {
    "histories": [
      {
        "roomId": "ABCDEF",
        "winner": { "id": "winner_id", "username": "user123" },
        "players": [
          { "userId": "id1", "rank": 1, "result": "win" },
          { "userId": "id2", "rank": 2, "result": "lose" }
        ],
        "duration": 120,
        "cardsPlayed": 14,
        "playedAt": "2026-06-11T16:30:00.000Z"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 5,
      "totalItems": 48
    }
  }
  ```

### 2.5. Lấy Danh Sách Bạn Bè (`GET /api/users/me/friends`)
- **Phân quyền**: Yêu cầu JWT Access Token
- **Response (200 OK)**:
  ```json
  {
    "friends": [
      {
        "id": "friend_user_id",
        "username": "friend_name",
        "avatar": "friend_avatar.png",
        "rank": "Bronze"
      }
    ]
  }
  ```

### 2.6. Gửi Yêu Cầu Kết Bạn / Đồng Ý Kết Bạn (`POST /api/users/friends/:id`)
- **Phân quyền**: Yêu cầu JWT Access Token
- **Response (200 OK)**:
  ```json
  {
    "message": "Kết bạn thành công!"
  }
  ```

### 2.7. Xóa Bạn Bè (`DELETE /api/users/friends/:id`)
- **Phân quyền**: Yêu cầu JWT Access Token
- **Response (200 OK)**:
  ```json
  {
    "message": "Đã xóa bạn bè khỏi danh sách."
  }
  ```

---

## 3. API Phòng Chơi chờ (Room Routes — `/api/rooms`)

### 3.1. Danh Sách Phòng Chờ Công Cộng (`GET /api/rooms`)
- **Phân quyền**: Công khai
- **Response (200 OK)**:
  ```json
  {
    "rooms": [
      {
        "code": "ABCDEF",
        "host": { "username": "host_user" },
        "playerCount": 3,
        "maxPlayers": 5,
        "isPublic": true
      }
    ]
  }
  ```

### 3.2. Lấy Thông Tin Một Phòng Chơi (`GET /api/rooms/:code`)
- **Phân quyền**: Công khai
- **Response (200 OK)**:
  ```json
  {
    "room": {
      "code": "ABCDEF",
      "host": "user_id_host",
      "players": [ ... ],
      "maxPlayers": 5,
      "status": "waiting"
    }
  }
  ```

---

## 4. API Cửa Hàng (Shop Routes — `/api/shop`)

### 4.1. Danh Sách Vật Phẩm Trong Cửa Hàng (`GET /api/shop/items`)
- **Phân quyền**: Công khai
- **Response (200 OK)**:
  ```json
  {
    "items": [
      {
        "id": "item_id_123",
        "name": "Mèo Phi Hành Gia",
        "type": "skin",
        "price": { "coins": 500, "gems": 0 },
        "rarity": "rare",
        "isLimited": false,
        "imageUrl": "/assets/skins/space_kitten.png"
      }
    ]
  }
  ```

### 4.2. Mua Vật Phẩm (`POST /api/shop/buy`)
- **Phân quyền**: Yêu cầu JWT Access Token
- **Request Body**:
  ```json
  {
    "itemId": "item_id_123"
  }
  ```
- **Response (200 OK)**:
  ```json
  {
    "message": "Mua vật phẩm thành công!",
    "coins": 200, // Số coins còn lại
    "gems": 0,
    "activeSkin": "skin_space_kitten"
  }
  ```

### 4.3. Lấy Danh Sách Vật Phẩm Đã Sở Hữu (`GET /api/shop/owned`)
- **Phân quyền**: Yêu cầu JWT Access Token
- **Response (200 OK)**:
  ```json
  {
    "ownedSkins": ["default", "skin_space_kitten"],
    "ownedEmotes": ["emote_laugh", "emote_crying"]
  }
  ```

---

## 5. API Bảng Xếp Hạng (Leaderboard Routes — `/api/leaderboard`)

### 5.1. Xem Bảng Xếp Hạng Top 20 (`GET /api/leaderboard`)
- **Phân quyền**: Công khai
- **Mô tả**: Trả về danh sách 20 người chơi có tỷ lệ thắng (Win Rate) cao nhất, điều kiện tối thiểu đã chơi 10 ván.
- **Response (200 OK)**:
  ```json
  {
    "leaderboard": [
      {
        "rank": 1,
        "userId": "id_1",
        "username": "master_kitten",
        "eloPoints": 1500,
        "totalGames": 40,
        "wins": 32,
        "winRate": 80.0
      },
      {
        "rank": 2,
        "userId": "id_2",
        "username": "lucky_cat",
        "eloPoints": 1420,
        "totalGames": 25,
        "wins": 18,
        "winRate": 72.0
      }
    ]
  }
  ```
