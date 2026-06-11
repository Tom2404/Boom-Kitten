# Hướng Dẫn Luật Chơi & Hệ Thống Kinh Tế (Game Rules & Economy)

Tài liệu này giải thích chi tiết luật chơi của **Mèo Nổ (Exploding Kittens)** và cơ chế phần thưởng kinh tế (Coin/Gem System) được áp dụng trong game.

---

## 1. Thiết Lập Bộ Bài & Phân Bổ (Deck Setup)

Ván đấu hỗ trợ từ **2 đến 5 người chơi**. Bộ bài bao gồm các quân bài sau với số lượng quy định:

| Tên Quân Bài | Số Lượng | Mô Tả Hiệu Ứng |
| :--- | :---: | :--- |
| **Exploding Kitten** | `Số người chơi - 1` | Bốc trúng lá này và không có **Defuse** để giải cứu thì bạn bị loại ngay lập tức. |
| **Defuse** | `6` | Vô hiệu hóa Mèo Nổ. Người chơi bốc trúng Mèo Nổ có thể đặt quân Mèo Nổ trở lại bất kỳ vị trí nào trong xấp bài bốc. |
| **Nope** | `5` | Hủy bỏ hiệu ứng của lá bài vừa được đánh gần nhất (trừ bài Defuse và một lá Nope khác). Có thể đánh bất kỳ lúc nào. |
| **Attack** | `4` | Kết thúc lượt đi của bạn mà không cần bốc bài. Bắt buộc người chơi tiếp theo phải đi **2 lượt liên tiếp** (được cộng dồn lượt nếu bị Attack tiếp). |
| **Skip** | `4` | Kết thúc lượt đi hiện tại của bạn mà không cần bốc bài. (Nếu bạn bị dồn lượt do Attack, Skip chỉ bỏ qua 1 lượt). |
| **See the Future** | `5` | Xem bí mật **3 lá bài trên cùng** của bộ bài bốc. Chỉ người chơi đánh lá này được nhìn thấy. |
| **Shuffle** | `4` | Xáo trộn ngẫu nhiên xấp bài bốc còn lại. |
| **Favor** | `4` | Bắt buộc một người chơi được chỉ định phải tặng bạn 1 lá bài trên tay họ (do họ tự chọn). |
| **Mèo Taco** | `4` | Mèo thường, không có hiệu ứng đơn lẻ. Đủ combo 2 lá cùng loại dùng để cướp ngẫu nhiên 1 lá trên tay người khác. |
| **Mèo Dưa Hấu** | `4` | Giống Mèo Taco. |
| **Mèo Râu Dài** | `4` | Giống Mèo Taco. |
| **Mèo Cầu Vồng** | `4` | Giống Mèo Taco. |
| **Mèo Khoai Tây** | `4` | Giống Mèo Taco. |

---

## 2. Diễn Biến Trận Đấu (Game Flow)

1. **Chuẩn bị**:
   - Mỗi người chơi bắt đầu với **1 lá bài Defuse** trên tay.
   - Xáo bộ bài và chia cho mỗi người thêm **7 lá ngẫu nhiên** từ bộ bài bốc (tổng cộng bài trên tay là 8 lá).
   - Cho các quân bài **Mèo Nổ** (`Số người chơi - 1` lá) và các quân **Defuse** còn dư vào xấp bài, xáo đều.
2. **Vòng lặp lượt chơi**:
   - Đến lượt của mình, người chơi có thể đánh **bao nhiêu lá bài tùy ý** từ trên tay của họ (hoặc không đánh lá nào).
   - Lượt chơi chỉ thực sự kết thúc khi người chơi **bốc 1 lá bài** từ xấp bài chung.
   - Nếu bốc phải **Mèo Nổ**:
     - Nếu có **Defuse**: Sử dụng Defuse để chặn tiếng nổ. Người chơi được bí mật nhét lá Mèo Nổ trở lại bất kỳ vị trí nào trong bộ bài bốc (có thể để trên cùng để hại người sau, hoặc nhét ở giữa).
     - Nếu không có **Defuse**: Người chơi bị loại khỏi trận đấu ngay lập tức.
3. **Kết thúc**:
   - Trận đấu tiếp diễn cho đến khi chỉ còn duy nhất **1 người chơi còn sống**. Người đó được tuyên bố là **Người Chiến Thắng**.

---

## 3. Quy Tắc Combo Mèo Thường (Cat Combos)

Các quân bài mèo thường (`cat_taco`, `cat_watermelon`, `cat_beard`, `cat_rainbow`, `cat_potato`) không thể kích hoạt hiệu ứng đơn lẻ. Tuy nhiên:
- **Combo 2 lá giống nhau**: Đánh xuống 2 lá mèo giống nhau cho phép chọn 1 người chơi đối thủ và cướp ngẫu nhiên 1 lá bài trên tay họ.

---

## 4. Hệ Thống Kinh Tế & Tiền Tệ (Coin & Transaction Economy)

Hệ thống sử dụng **Coin** (Tiền vàng) và **Gem** (Kim cương) làm tiền tệ chính.

### 4.1. Cơ Chế Nhận Thưởng (Earn Coins)
- **Thắng một trận đấu**: `+50 coins`
- **Thua một trận đấu**: `+10 coins` (Phần thưởng khích lệ tham gia)
- **Đăng nhập hàng ngày (Daily Login)**: `+20 coins` (Giới hạn nhận 1 lần duy nhất mỗi ngày)
- **Chuỗi thắng (Win Streak) từ 3 trận trở lên**: Tặng thêm `+30 coins` thưởng nóng cho mỗi trận thắng tiếp theo.
- **Hoàn thành nhiệm vụ ngày**: `+50 coins`

### 4.2. Cơ Chế Tiêu Dùng (Spend Coins)
- **Mua Skin (Ngoại trang bài / hình nền)**:
  - Loại Thường (Common): `200 coins`
  - Loại Hiếm (Rare): `500 coins`
  - Loại Sử Thi (Epic): `1000 coins`
- **Mua Biểu Cảm (Emote)**: Từ `100 đến 300 coins` cho mỗi biểu cảm động hoặc tĩnh.
- **Lệ phí tham gia giải đấu (Tournament Entry)**: `50 coins` mỗi lượt đăng ký giải.

### 4.3. Nhật Ký Giao Dịch (Transaction Logging)
Mọi biến động số dư trong ví người chơi đều phải tạo một bản ghi tương ứng trong cơ sở dữ liệu (`Transaction` collection) với thông tin:
- ID người dùng.
- Loại giao dịch (`earn` - nhận, `spend` - tiêu, `purchase` - nạp).
- Số tiền giao dịch.
- Loại tiền tệ (`coin` hoặc `gem`).
- Mô tả chi tiết (ví dụ: *"Nhận phần thưởng thắng trận phòng #ABCDEF"*).
