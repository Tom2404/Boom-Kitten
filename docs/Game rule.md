
# Exploding Kittens — Luật Chơi Đầy Đủ (AI-Readable Reference)

> **Phiên bản:** Bản gốc (Original Edition) — 2–5 người chơi
>
> **Tác giả:** Elan Lee & The Oatmeal (Matthew Inman)
>
> **Mục tiêu:** Là người cuối cùng **không bị nổ** bởi lá Mèo Nổ.
>
> # Exploding Kittens — Luật Chơi Đầy Đủ (AI-Readable Reference)
>
>> **Phiên bản:** Bản gốc (Original Edition) — 2–5 người chơi
>>
>> **Tác giả:** Elan Lee & The Oatmeal (Matthew Inman)
>>
>> **Mục tiêu:** Là người cuối cùng **không bị nổ** bởi lá Mèo Nổ.
>>
>
> ---
>
> ## 1. Tổng quan bộ bài (Base Deck)
>
> Bộ bài gốc gồm **56 lá** tổng cộng (trước khi loại bỏ theo số người chơi).
>
> | Loại lá                          | Số lượng gốc |
> | ---------------------------------- | ---------------- |
> | Exploding Kitten (Mèo Nổ)        | 4                |
> | Defuse (Tháo Ngòi)               | 6                |
> | Attack (Tấn Công)                | 4                |
> | Skip (Bỏ Lượt)                  | 4                |
> | See the Future (Nhìn Tương Lai) | 5                |
> | Shuffle (Xáo Bài)                | 4                |
> | Favor (Nhờ Vả)                   | 4                |
> | Nope (Chặn)                       | 5                |
> | Tacocat                            | 4                |
> | Hairy Potato Cat                   | 4                |
> | Rainbow Ralphing Cat               | 4                |
> | Beard Cat                          | 4                |
> | Cattermelon                        | 4                |
> | **Tổng**                    | **56**     |
>
> ---
>
> ## 2. Cấu hình deck theo số người chơi
>
> Quy tắc xây dựng deck trước mỗi ván:
>
> 1. Lấy ra **toàn bộ lá Mèo Nổ** và **toàn bộ lá Tháo Ngòi** — để riêng.
> 2. Xáo phần bài còn lại.
> 3. Chia **7 lá** cho mỗi người + **1 lá Tháo Ngòi** (mỗi người đều có đúng 1 Defuse trên tay khi bắt đầu).
> 4. Nhét **(số người − 1) lá Mèo Nổ** vào bộ bài còn lại rồi xáo.
> 5. Các lá Mèo Nổ và Tháo Ngòi dư ra → **loại khỏi ván chơi** (không dùng).
>
> ### Bảng cấu hình chi tiết
>
> | Số người | Lá Mèo Nổ trong deck | Lá Tháo Ngòi trong deck | Bài chia/người | Tổng bài trên tay | Bài còn trong draw pile (xấp xỉ) |
> | ----------- | ----------------------- | -------------------------- | ----------------- | -------------------- | ------------------------------------ |
> | 2           | 1                       | 0                          | 7 + 1 Defuse      | 8                    | ~38                                  |
> | 3           | 2                       | 0                          | 7 + 1 Defuse      | 8                    | ~30                                  |
> | 4           | 3                       | 0                          | 7 + 1 Defuse      | 8                    | ~22                                  |
> | 5           | 4                       | 0                          | 7 + 1 Defuse      | 8                    | ~14                                  |
>
>> **Ghi chú:** Số bài trong draw pile = 56 − (số Exploding Kittens dư) − (số Defuse dư) − (bài đã chia). Với 5 người, draw pile rất nhỏ (~14 lá), ván chơi nhanh và căng thẳng hơn nhiều.
>>
>
> ---
>
> ## 3. Luật chia bài (Setup)
>
> ```
> 1. Tách Exploding Kittens và Defuse ra khỏi bộ bài.
> 2. Xáo 44 lá còn lại.
> 3. Chia 7 lá cho mỗi người.
> 4. Thêm 1 lá Defuse vào tay mỗi người (tay bài = 8 lá).
> 5. Bỏ (N-1) Exploding Kittens vào draw pile, xáo.
> 6. Các lá Exploding Kittens và Defuse dư → loại khỏi ván.
> 7. Đặt draw pile úp giữa bàn.
> 8. Người đi đầu: người mặc áo lông mèo, hoặc chọn ngẫu nhiên.
> ```
>
> ---
>
> ## 4. Cấu trúc một lượt chơi (Turn Structure)
>
> Mỗi lượt gồm  **đúng 2 bước** , theo thứ tự:
>
> ### Bước 1 — Chơi bài (tùy chọn)
>
> * Chơi **0 hoặc nhiều lá** từ tay bài.
> * Lá đã chơi bỏ vào **discard pile** (ngửa mặt).
> * Lá Nope có thể được chơi bởi  **bất kỳ người nào** , bất kỳ lúc nào trong bước này để chặn lá vừa đánh.
>
> ### Bước 2 — Rút bài (bắt buộc)
>
> * Rút **1 lá** từ **trên cùng** của draw pile.
> * Nếu rút trúng Exploding Kitten → xem mục 5.
> * Nếu không → lượt kết thúc, chuyển sang người tiếp theo.
>
> ---
>
> ## 5. Rút Mèo Nổ (Exploding Kitten)
>
> ```
> Rút Exploding Kitten
> │
> ├── Có lá Defuse trên tay?
> │   ├── CÓ → Sống sót:
> │   │         1. Chơi lá Defuse (bỏ vào discard pile, ngửa mặt).
> │   │         2. Đặt lá Exploding Kitten vào bất kỳ vị trí nào trong draw pile (bí mật).
> │   │         3. Lượt kết thúc bình thường.
> │   │
> │   └── KHÔNG → Bị loại:
> │               1. Lật ngửa Exploding Kitten, đặt ra ngoài game.
> │               2. Bỏ toàn bộ bài trên tay vào discard pile.
> │               3. Ra khỏi vòng chơi.
> ```
>
>> **Quy tắc đặt Exploding Kitten:** Người dùng Defuse có thể đặt lá Mèo Nổ ở **bất kỳ vị trí** trong draw pile — trên cùng, dưới cùng, hoặc giữa — mà không cần thông báo vị trí cho người khác.
>>
>
> ---
>
> ## 6. Mô tả chi tiết từng lá bài
>
> ### 6.1 Exploding Kitten (Mèo Nổ)
>
> * **Số lượng dùng:** N−1 (N = số người chơi)
> * **Hiệu ứng:** Rút lá này = bị loại khỏi game (trừ khi có Defuse).
> * **Không thể bị Nope.**
>
> ### 6.2 Defuse (Tháo Ngòi)
>
> * **Số lượng:** 6 trong bộ; mỗi người nhận 1 lúc đầu, số dư bị loại.
> * **Hiệu ứng:** Vô hiệu hóa 1 Exploding Kitten vừa rút.
> * **Không thể bị Nope.**
>
> ### 6.3 Attack (Tấn Công)
>
> * **Số lượng:** 4
> * **Hiệu ứng:** Kết thúc lượt ngay (không rút bài). Người kế tiếp phải thực hiện  **2 lượt liên tiếp** .
> * **Cộng dồn:** Nếu người bị attack cũng chơi Attack → người kế tiếp phải chơi **3 hoặc 4 lượt** (tùy số Attack cộng).
> * **Có thể bị Nope.**
>
>> **Chi tiết cộng dồn Attack:**
>>
>> * 1 Attack → người tiếp theo: 2 lượt
>> * 2 Attack liên tiếp → 3 lượt
>> * 3 Attack liên tiếp → 4 lượt
>>
>>   (Công thức: số lượt hiện tại + 1)
>>
>
> ### 6.4 Skip (Bỏ Lượt)
>
> * **Số lượng:** 4
> * **Hiệu ứng:** Kết thúc lượt ngay mà  **không rút bài** .
> * **Khi bị Attack:** Skip chỉ thoát **1 trong 2 lượt** bị áp. Vẫn phải chơi lượt còn lại.
> * **Có thể bị Nope.**
>
> ### 6.5 See the Future (Nhìn Tương Lai)
>
> * **Số lượng:** 5
> * **Hiệu ứng:** Bí mật xem **3 lá trên cùng** của draw pile (không thay đổi thứ tự, không cho ai xem cùng).
> * **Có thể bị Nope.**
>
> ### 6.6 Shuffle (Xáo Bài)
>
> * **Số lượng:** 4
> * **Hiệu ứng:** Xáo ngẫu nhiên  **toàn bộ draw pile** .
> * **Có thể bị Nope.**
>
> ### 6.7 Favor (Nhờ Vả)
>
> * **Số lượng:** 4
> * **Hiệu ứng:** Chọn 1 người chơi khác. Người đó phải **trao 1 lá bài** cho bạn (họ tự chọn lá nào).
> * **Có thể bị Nope.**
>
> ### 6.8 Nope (Chặn)
>
> * **Số lượng:** 5
> * **Hiệu ứng:** Hủy bỏ hiệu ứng của **bất kỳ lá nào** vừa được chơi — kể cả ngoài lượt của mình.
> * **Không thể chặn:** Exploding Kitten, Defuse.
> * **Có thể bị Nope lại:** Nope chặn Nope → hành động có hiệu lực trở lại (chuỗi Nope không giới hạn).
> * **Thời điểm chơi:** Bất kỳ lúc nào, ngay khi có lá được chơi.
>
> ### 6.9 Bài Mèo — Cat Cards (5 loại)
>
> | Lá                  | Số lượng |
> | -------------------- | ----------- |
> | Tacocat              | 4           |
> | Hairy Potato Cat     | 4           |
> | Rainbow Ralphing Cat | 4           |
> | Beard Cat            | 4           |
> | Cattermelon          | 4           |
>
> **Chơi đơn lẻ:** Không có hiệu ứng.
>
> **Combo:**
>
> | Số lá chơi | Điều kiện       | Hiệu ứng                                                                                    |
> | ------------- | ------------------ | --------------------------------------------------------------------------------------------- |
> | 2 lá         | Cùng loại        | Lấy**ngẫu nhiên**1 lá từ tay người khác (bạn chọn người, không chọn lá). |
> | 3 lá         | Cùng loại        | Lấy**bất kỳ**lá nào từ tay người khác (bạn chọn cả người lẫn lá).       |
> | 5 lá         | 5 loại khác nhau | Lấy**bất kỳ**lá nào từ**discard pile**(đống bài đã chơi).             |
>
>> Combo Cat Cards **có thể bị Nope.**
>>
>
> ---
>
> ## 7. Luật đặc biệt
>
> ### Discard Pile
>
> * Ngửa mặt, tất cả người chơi được xem.
> * Chỉ lấy được khi chơi combo 5 lá khác nhau.
>
> ### Thứ tự lượt
>
> * Chiều kim đồng hồ.
> * Người bị loại rời bàn ngay lập tức, thứ tự tiếp tục với người kế.
>
> ### Kết thúc ván
>
> * Khi chỉ còn **1 người** không bị loại → người đó thắng.
>
> ---
>
> ## 8. Bảng tóm tắt lá bài (Quick Reference)
>
> | Lá                  | SL             | Chặn bởi Nope?   | Tác dụng tóm tắt                      |
> | -------------------- | -------------- | ------------------ | ----------------------------------------- |
> | Exploding Kitten     | 4 (dùng N−1) | ❌                 | Bị loại nếu không có Defuse          |
> | Defuse               | 6 (dùng N)    | ❌                 | Vô hiệu hóa Exploding Kitten           |
> | Attack               | 4              | ✅                 | Không rút, người tiếp theo +2 lượt |
> | Skip                 | 4              | ✅                 | Không rút, kết thúc lượt            |
> | See the Future       | 5              | ✅                 | Xem 3 lá trên cùng draw pile           |
> | Shuffle              | 4              | ✅                 | Xáo draw pile                            |
> | Favor                | 4              | ✅                 | Lấy 1 lá tùy ý từ người khác      |
> | Nope                 | 5              | ✅ (bị Nope lại) | Hủy lá vừa chơi                       |
> | Cat Cards (x5 loại) | 4 mỗi loại   | ✅ (khi combo)     | Combo để lấy bài người khác        |
>
> ---
>
> ## 9. Các mở rộng (Expansions)
>
> | Tên                        | Nội dung chính                                                                   |
> | --------------------------- | ---------------------------------------------------------------------------------- |
> | **Imploding Kittens** | Thêm lá Imploding Kitten (không dùng Defuse được), mở rộng lên 6 người |
> | **Streaking Kittens** | Lá giúp giữ Exploding Kitten trên tay mà không bị loại                     |
> | **Barking Kittens**   | Cơ chế bắt cặp giữa 2 người chơi                                           |
> | **Party Pack**        | Phiên bản 2–10 người                                                          |
>
> ---
>
> ## 10. Metadata cho AI Agent
>
> ```yaml
> game_name: "Exploding Kittens"
> players_min: 2
> players_max: 5
> average_duration_minutes: 15
> age_minimum: 7
> deck_total_cards: 56
> turn_structure:
>   step_1: "Play 0 or more cards (optional)"
>   step_2: "Draw 1 card from draw pile (mandatory)"
> win_condition: "Last player not eliminated"
> elimination_condition: "Draw Exploding Kitten without Defuse card"
> nope_targets: ["Attack", "Skip", "See the Future", "Shuffle", "Favor", "Cat Card combos"]
> nope_immune: ["Exploding Kitten", "Defuse"]
> setup_per_player_count:
>   2: {exploding_kittens_in_deck: 1, defuse_in_deck: 0, hand_size: 8}
>   3: {exploding_kittens_in_deck: 2, defuse_in_deck: 0, hand_size: 8}
>   4: {exploding_kittens_in_deck: 3, defuse_in_deck: 0, hand_size: 8}
>   5: {exploding_kittens_in_deck: 4, defuse_in_deck: 0, hand_size: 8}
> ```
>

---

## 1. Tổng quan bộ bài (Base Deck)

Bộ bài gốc gồm **56 lá** tổng cộng (trước khi loại bỏ theo số người chơi).

| Loại lá                          | Số lượng gốc |
| ---------------------------------- | ---------------- |
| Exploding Kitten (Mèo Nổ)        | 4                |
| Defuse (Tháo Ngòi)               | 6                |
| Attack (Tấn Công)                | 4                |
| Skip (Bỏ Lượt)                  | 4                |
| See the Future (Nhìn Tương Lai) | 5                |
| Shuffle (Xáo Bài)                | 4                |
| Favor (Nhờ Vả)                   | 4                |
| Nope (Chặn)                       | 5                |
| Tacocat                            | 4                |
| Hairy Potato Cat                   | 4                |
| Rainbow Ralphing Cat               | 4                |
| Beard Cat                          | 4                |
| Cattermelon                        | 4                |
| **Tổng**                    | **56**     |

---

## 2. Cấu hình deck theo số người chơi

Quy tắc xây dựng deck trước mỗi ván:

1. Lấy ra **toàn bộ lá Mèo Nổ** và **toàn bộ lá Tháo Ngòi** — để riêng.
2. Xáo phần bài còn lại.
3. Chia **7 lá** cho mỗi người + **1 lá Tháo Ngòi** (mỗi người đều có đúng 1 Defuse trên tay khi bắt đầu).
4. Nhét **(số người − 1) lá Mèo Nổ** vào bộ bài còn lại rồi xáo.
5. Các lá Mèo Nổ và Tháo Ngòi dư ra → **loại khỏi ván chơi** (không dùng).

### Bảng cấu hình chi tiết

| Số người | Lá Mèo Nổ trong deck | Lá Tháo Ngòi trong deck | Bài chia/người | Tổng bài trên tay | Bài còn trong draw pile (xấp xỉ) |
| ----------- | ----------------------- | -------------------------- | ----------------- | -------------------- | ------------------------------------ |
| 2           | 1                       | 0                          | 7 + 1 Defuse      | 8                    | ~38                                  |
| 3           | 2                       | 0                          | 7 + 1 Defuse      | 8                    | ~30                                  |
| 4           | 3                       | 0                          | 7 + 1 Defuse      | 8                    | ~22                                  |
| 5           | 4                       | 0                          | 7 + 1 Defuse      | 8                    | ~14                                  |

> **Ghi chú:** Số bài trong draw pile = 56 − (số Exploding Kittens dư) − (số Defuse dư) − (bài đã chia). Với 5 người, draw pile rất nhỏ (~14 lá), ván chơi nhanh và căng thẳng hơn nhiều.

---

## 3. Luật chia bài (Setup)

```
1. Tách Exploding Kittens và Defuse ra khỏi bộ bài.
2. Xáo 44 lá còn lại.
3. Chia 7 lá cho mỗi người.
4. Thêm 1 lá Defuse vào tay mỗi người (tay bài = 8 lá).
5. Bỏ (N-1) Exploding Kittens vào draw pile, xáo.
6. Các lá Exploding Kittens và Defuse dư → loại khỏi ván.
7. Đặt draw pile úp giữa bàn.
8. Người đi đầu: người mặc áo lông mèo, hoặc chọn ngẫu nhiên.
```

---

## 4. Cấu trúc một lượt chơi (Turn Structure)

Mỗi lượt gồm  **đúng 2 bước** , theo thứ tự:

### Bước 1 — Chơi bài (tùy chọn)

* Chơi **0 hoặc nhiều lá** từ tay bài.
* Lá đã chơi bỏ vào **discard pile** (ngửa mặt).
* Lá Nope có thể được chơi bởi  **bất kỳ người nào** , bất kỳ lúc nào trong bước này để chặn lá vừa đánh.

### Bước 2 — Rút bài (bắt buộc)

* Rút **1 lá** từ **trên cùng** của draw pile.
* Nếu rút trúng Exploding Kitten → xem mục 5.
* Nếu không → lượt kết thúc, chuyển sang người tiếp theo.

---

## 5. Rút Mèo Nổ (Exploding Kitten)

```
Rút Exploding Kitten
│
├── Có lá Defuse trên tay?
│   ├── CÓ → Sống sót:
│   │         1. Chơi lá Defuse (bỏ vào discard pile, ngửa mặt).
│   │         2. Đặt lá Exploding Kitten vào bất kỳ vị trí nào trong draw pile (bí mật).
│   │         3. Lượt kết thúc bình thường.
│   │
│   └── KHÔNG → Bị loại:
│               1. Lật ngửa Exploding Kitten, đặt ra ngoài game.
│               2. Bỏ toàn bộ bài trên tay vào discard pile.
│               3. Ra khỏi vòng chơi.
```

> **Quy tắc đặt Exploding Kitten:** Người dùng Defuse có thể đặt lá Mèo Nổ ở **bất kỳ vị trí** trong draw pile — trên cùng, dưới cùng, hoặc giữa — mà không cần thông báo vị trí cho người khác.

---

## 6. Mô tả chi tiết từng lá bài

### 6.1 Exploding Kitten (Mèo Nổ)

* **Số lượng dùng:** N−1 (N = số người chơi)
* **Hiệu ứng:** Rút lá này = bị loại khỏi game (trừ khi có Defuse).
* **Không thể bị Nope.**

### 6.2 Defuse (Tháo Ngòi)

* **Số lượng:** 6 trong bộ; mỗi người nhận 1 lúc đầu, số dư bị loại.
* **Hiệu ứng:** Vô hiệu hóa 1 Exploding Kitten vừa rút.
* **Không thể bị Nope.**

### 6.3 Attack (Tấn Công)

* **Số lượng:** 4
* **Hiệu ứng:** Kết thúc lượt ngay (không rút bài). Người kế tiếp phải thực hiện  **2 lượt liên tiếp** .
* **Cộng dồn:** Nếu người bị attack cũng chơi Attack → người kế tiếp phải chơi **3 hoặc 4 lượt** (tùy số Attack cộng).
* **Có thể bị Nope.**

> **Chi tiết cộng dồn Attack:**
>
> * 1 Attack → người tiếp theo: 2 lượt
> * 2 Attack liên tiếp → 3 lượt
> * 3 Attack liên tiếp → 4 lượt
>
>   (Công thức: số lượt hiện tại + 1)

### 6.4 Skip (Bỏ Lượt)

* **Số lượng:** 4
* **Hiệu ứng:** Kết thúc lượt ngay mà  **không rút bài** .
* **Khi bị Attack:** Skip chỉ thoát **1 trong 2 lượt** bị áp. Vẫn phải chơi lượt còn lại.
* **Có thể bị Nope.**

### 6.5 See the Future (Nhìn Tương Lai)

* **Số lượng:** 5
* **Hiệu ứng:** Bí mật xem **3 lá trên cùng** của draw pile (không thay đổi thứ tự, không cho ai xem cùng).
* **Có thể bị Nope.**

### 6.6 Shuffle (Xáo Bài)

* **Số lượng:** 4
* **Hiệu ứng:** Xáo ngẫu nhiên  **toàn bộ draw pile** .
* **Có thể bị Nope.**

### 6.7 Favor (Nhờ Vả)

* **Số lượng:** 4
* **Hiệu ứng:** Chọn 1 người chơi khác. Người đó phải **trao 1 lá bài** cho bạn (họ tự chọn lá nào).
* **Có thể bị Nope.**

### 6.8 Nope (Chặn)

* **Số lượng:** 5
* **Hiệu ứng:** Hủy bỏ hiệu ứng của **bất kỳ lá nào** vừa được chơi — kể cả ngoài lượt của mình.
* **Không thể chặn:** Exploding Kitten, Defuse.
* **Có thể bị Nope lại:** Nope chặn Nope → hành động có hiệu lực trở lại (chuỗi Nope không giới hạn).
* **Thời điểm chơi:** Bất kỳ lúc nào, ngay khi có lá được chơi.

### 6.9 Bài Mèo — Cat Cards (5 loại)

| Lá                  | Số lượng |
| -------------------- | ----------- |
| Tacocat              | 4           |
| Hairy Potato Cat     | 4           |
| Rainbow Ralphing Cat | 4           |
| Beard Cat            | 4           |
| Cattermelon          | 4           |

**Chơi đơn lẻ:** Không có hiệu ứng.

**Combo:**

| Số lá chơi | Điều kiện       | Hiệu ứng                                                                                    |
| ------------- | ------------------ | --------------------------------------------------------------------------------------------- |
| 2 lá         | Cùng loại        | Lấy**ngẫu nhiên**1 lá từ tay người khác (bạn chọn người, không chọn lá). |
| 3 lá         | Cùng loại        | Lấy**bất kỳ**lá nào từ tay người khác (bạn chọn cả người lẫn lá).       |
| 5 lá         | 5 loại khác nhau | Lấy**bất kỳ**lá nào từ**discard pile**(đống bài đã chơi).             |

> Combo Cat Cards **có thể bị Nope.**

---

## 7. Luật đặc biệt

### Discard Pile

* Ngửa mặt, tất cả người chơi được xem.
* Chỉ lấy được khi chơi combo 5 lá khác nhau.

### Thứ tự lượt

* Chiều kim đồng hồ.
* Người bị loại rời bàn ngay lập tức, thứ tự tiếp tục với người kế.

### Kết thúc ván

* Khi chỉ còn **1 người** không bị loại → người đó thắng.

---

## 8. Bảng tóm tắt lá bài (Quick Reference)

| Lá                  | SL             | Chặn bởi Nope?   | Tác dụng tóm tắt                      |
| -------------------- | -------------- | ------------------ | ----------------------------------------- |
| Exploding Kitten     | 4 (dùng N−1) | ❌                 | Bị loại nếu không có Defuse          |
| Defuse               | 6 (dùng N)    | ❌                 | Vô hiệu hóa Exploding Kitten           |
| Attack               | 4              | ✅                 | Không rút, người tiếp theo +2 lượt |
| Skip                 | 4              | ✅                 | Không rút, kết thúc lượt            |
| See the Future       | 5              | ✅                 | Xem 3 lá trên cùng draw pile           |
| Shuffle              | 4              | ✅                 | Xáo draw pile                            |
| Favor                | 4              | ✅                 | Lấy 1 lá tùy ý từ người khác      |
| Nope                 | 5              | ✅ (bị Nope lại) | Hủy lá vừa chơi                       |
| Cat Cards (x5 loại) | 4 mỗi loại   | ✅ (khi combo)     | Combo để lấy bài người khác        |

---

## 9. Các mở rộng (Expansions)

| Tên                        | Nội dung chính                                                                   |
| --------------------------- | ---------------------------------------------------------------------------------- |
| **Imploding Kittens** | Thêm lá Imploding Kitten (không dùng Defuse được), mở rộng lên 6 người |
| **Streaking Kittens** | Lá giúp giữ Exploding Kitten trên tay mà không bị loại                     |
| **Barking Kittens**   | Cơ chế bắt cặp giữa 2 người chơi                                           |
| **Party Pack**        | Phiên bản 2–10 người                                                          |

---

## 10. Metadata cho AI Agent

```yaml
game_name: "Exploding Kittens"
players_min: 2
players_max: 5
average_duration_minutes: 15
age_minimum: 7
deck_total_cards: 56
turn_structure:
  step_1: "Play 0 or more cards (optional)"
  step_2: "Draw 1 card from draw pile (mandatory)"
win_condition: "Last player not eliminated"
elimination_condition: "Draw Exploding Kitten without Defuse card"
nope_targets: ["Attack", "Skip", "See the Future", "Shuffle", "Favor", "Cat Card combos"]
nope_immune: ["Exploding Kitten", "Defuse"]
setup_per_player_count:
  2: {exploding_kittens_in_deck: 1, defuse_in_deck: 0, hand_size: 8}
  3: {exploding_kittens_in_deck: 2, defuse_in_deck: 0, hand_size: 8}
  4: {exploding_kittens_in_deck: 3, defuse_in_deck: 0, hand_size: 8}
  5: {exploding_kittens_in_deck: 4, defuse_in_deck: 0, hand_size: 8}
```
