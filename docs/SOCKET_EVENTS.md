# Danh Sách Sự Kiện WebSocket (Socket.io Event Specification)

Hệ thống multiplayer của trò chơi **Mèo Nổ** giao tiếp thời gian thực thông qua Socket.io. Dưới đây là đặc tả chi tiết của tất cả các sự kiện Client-to-Server và Server-to-Client.

---

## 1. Sự Kiện Từ Client Gửi Lên Server (Client → Server Events)

Các sự kiện này được phát đi từ phía Frontend để yêu cầu thực hiện hành động.

### 1.1. Phòng Chờ (Room Lobby)
- **`room:create`**: Yêu cầu tạo phòng chơi mới.
  - *Payload*:
    ```json
    {
      "maxPlayers": 5,   // Số lượng người chơi tối đa (2-5)
      "isPublic": true   // Phòng công cộng hay riêng tư
    }
    ```
- **`room:join`**: Tham gia phòng chơi thông qua mã code.
  - *Payload*:
    ```json
    {
      "roomCode": "ABCDEF" // Mã phòng gồm 6 ký tự viết hoa
    }
    ```
- **`room:leave`**: Rời phòng chơi hiện tại (không cần gửi payload, server tự phát hiện từ Socket ID).
- **`game:start`**: Host phòng yêu cầu bắt đầu trận đấu (không cần gửi payload, chỉ host mới có quyền gửi).

### 1.2. Hành Động Trong Ván Đấu (In-Game Actions)
- **`game:playCard`**: Đánh một lá bài trên tay.
  - *Payload*:
    ```json
    {
      "cardType": "see_the_future", // Loại lá bài
      "targetPlayerId": "user_id_xyz", // (Tùy chọn) ID người bị nhắm mục tiêu (ví dụ: Favor, Attack, Combo)
      "insertPosition": 0 // (Tùy chọn) Vị trí nhét Mèo Nổ trở lại bộ bài (dành cho Defuse)
    }
    ```
- **`game:drawCard`**: Bốc một lá bài từ bộ bài chung để kết thúc lượt (không cần gửi payload).
- **`game:nope`**: Đánh bài Nope để ngăn chặn lá bài vừa được đánh trước đó.
  - *Payload*:
    ```json
    {
      "originalEventId": "event_timestamp_id" // ID của sự kiện lá bài gốc đang chờ kết quả Nope
    }
    ```
- **`game:favor:respond`**: Phản hồi lại yêu cầu Favor của người chơi khác bằng cách chọn một lá bài để tặng.
  - *Payload*:
    ```json
    {
      "cardId": "uuid_cua_la_bai_tren_tay"
    }
    ```
- **`game:combo`**: Sử dụng combo mèo thường (2 lá cùng loại) để cướp ngẫu nhiên một lá bài của người chơi khác.
  - *Payload*:
    ```json
    {
      "cards": ["cat_taco", "cat_taco"], // Danh sách quân bài combo
      "targetPlayerId": "user_id_xyz" // ID của người chơi bị cướp
    }
    ```

### 1.3. Biểu Cảm & Trò Chuyện (Interaction)
- **`game:emote`**: Gửi emote nhanh lên bàn đấu.
  - *Payload*:
    ```json
    {
      "emoteId": "emote_angry" // ID của biểu cảm
    }
    ```
- **`chat:message`**: Gửi tin nhắn trò chuyện nhóm trong phòng đấu.
  - *Payload*:
    ```json
    {
      "text": "Chào mọi người!" // Nội dung tin nhắn (tối đa 500 ký tự)
    }
    ```

---

## 2. Sự Kiện Từ Server Gửi Về Client (Server → Client Events)

Các sự kiện được broadcast hoặc gửi riêng tư cho Client để cập nhật giao diện.

### 2.1. Cập Nhật Phòng & Trạng Thái
- **`room:updated`**: Broadcast cho tất cả người chơi trong phòng khi phòng có thay đổi (có người vào, ra phòng, đổi cài đặt).
  - *Payload*:
    ```json
    {
      "room": {
        "code": "ABCDEF",
        "host": "user_id_host",
        "players": [
          { "userId": "id_1", "username": "player_1", "avatar": "avatar_1" }
        ],
        "maxPlayers": 5,
        "status": "waiting",
        "isPublic": true
      }
    }
    ```
- **`game:stateUpdate`**: Broadcast trạng thái bàn cờ công cộng cho tất cả người chơi. Không bao giờ tiết lộ bài chi tiết của người khác.
  - *Payload*:
    ```json
    {
      "publicGameState": {
        "currentPlayerIndex": 0,
        "drawsRequired": 1,
        "deckCount": 23,            // Số lượng bài còn lại trong bộ bài bốc
        "discardPile": [            // Lịch sử bài đã đánh
          { "id": "card_id", "type": "attack" }
        ],
        "players": [
          { "userId": "id_1", "alive": true, "handCount": 5 },
          { "userId": "id_2", "alive": true, "handCount": 4 }
        ],
        "activePlayerIds": ["id_1", "id_2"],
        "pendingNope": { "eventId": "evt_id", "resolved": false } // Trạng thái Nope hiện tại
      }
    }
    ```
- **`game:privateHand`**: Gửi riêng tư cho từng người chơi để đồng bộ hóa bài trên tay của chính họ.
  - *Payload*:
    ```json
    {
      "cards": [
        { "id": "card_id_1", "type": "defuse" },
        { "id": "card_id_2", "type": "see_the_future" }
      ]
    }
    ```

### 2.2. Sự Kiện Ván Đấu & Hiệu Ứng
- **`game:cardPlayed`**: Thông báo có người chơi vừa đánh một lá bài cụ thể.
  - *Payload*:
    ```json
    {
      "playerId": "user_id_xyz",
      "cardType": "skip",
      "targetPlayerId": null
    }
    ```
- **`game:nopeWindow`**: Mở cửa sổ chờ Nope kéo dài 3 giây trên UI.
  - *Payload*:
    ```json
    {
      "eventId": "evt_id_123",
      "timeoutMs": 3000
    }
    ```
- **`game:exploded`**: Thông báo người chơi đã bốc trúng Mèo Nổ và bị loại (hoặc phải dùng Defuse).
  - *Payload*:
    ```json
    {
      "playerId": "user_id_xyz"
    }
    ```
- **`game:seeTheFuture`**: Trả về danh sách 3 lá bài trên cùng của bộ bài bốc (chỉ gửi riêng cho người chơi đánh bài See The Future).
  - *Payload*:
    ```json
    {
      "cards": [
        { "id": "c1", "type": "nope" },
        { "id": "c2", "type": "exploding_kitten" },
        { "id": "c3", "type": "shuffle" }
      ]
    }
    ```
- **`game:favor:request`**: Yêu cầu người chơi đích lựa chọn một quân bài để cống nộp cho người chơi đánh lá Favor.
  - *Payload*:
    ```json
    {
      "fromPlayerId": "user_id_yeu_cau",
      "timeoutMs": 15000
    }
    ```
- **`game:turnChanged`**: Thông báo thay đổi lượt đi mới.
  - *Payload*:
    ```json
    {
      "currentPlayerId": "user_id_luot_moi",
      "drawsRequired": 1 // Số lượt bốc bài bắt buộc (ví dụ: bị Attack dồn lượt)
    }
    ```
- **`game:ended`**: Thông báo trận đấu kết thúc, công bố người thắng và bảng xếp hạng kết quả.
  - *Payload*:
    ```json
    {
      "winnerId": "user_id_win",
      "rankings": [
        { "userId": "id_win", "result": "win" },
        { "userId": "id_lose", "result": "lose" }
      ]
    }
    ```

### 2.3. Tương Tác & Lỗi
- **`game:emote`**: Broadcast biểu cảm của một người chơi cho cả phòng.
  - *Payload*:
    ```json
    {
      "playerId": "user_id_xyz",
      "emoteId": "emote_funny"
    }
    ```
- **`chat:message`**: Phát đi tin nhắn chat cho toàn bộ thành viên trong phòng.
  - *Payload*:
    ```json
    {
      "userId": "user_id_xyz",
      "username": "tuan123",
      "text": "Alo alo",
      "timestamp": "2026-06-11T16:30:00.000Z"
    }
    ```
- **`error`**: Phát đi thông báo lỗi riêng tư khi một hành động của Client bị từ chối hoặc lỗi hệ thống xảy ra.
  - *Payload*:
    ```json
    {
      "message": "Không phải lượt đi của bạn!"
    }
    ```
