import React from 'react';

/**
 * CommunityReviews - Section 06 of the homepage.
 * Features a masonry review list using CSS columns layout, 
 * zero circle avatars, and custom red-bordered cards for dynamic rhythm.
 */
export default function CommunityReviews() {
  const reviews = [
    {
      id: 1,
      name: "hoang_dung99",
      rank: "KIM CƯƠNG IV (Hà Nội)",
      content: "chơi game này mất bạn thực sự. thằng bạn chí cốt nó cướp lá defuse duy nhất của mình xong gài mèo nổ lên đầu xấp bài. tối đó hai đứa không thèm nhìn mặt nhau luôn. 10/10 game cực vui sẽ chơi tiếp.",
      borderColor: '#222222',
    },
    {
      id: 2,
      name: "meo_la_nha",
      rank: "CHIẾN THẦN (Sài Gòn)",
      content: "vừa lật kèo thắng ván bài nhờ lá bài xem trước tương lai. cả lũ bạn gào thét bất lực nhìn mình nhảy qua lượt rút bài nổ. cảm giác làm kẻ ác nó sướng gì đâu á.",
      borderColor: 'var(--pop-red)', // Card thứ 2 viền đỏ
    },
    {
      id: 3,
      name: "huyen.tran20",
      rank: "VÀNG II (Đà Nẵng)",
      content: "không cần tải ứng dụng gì hết cứ gửi link qua messenger là cả nhóm vào solo được luôn. giao diện chơi mượt, cơ chế gỡ bom rồi đặt lại bom vào vị trí bất kỳ đúng là đỉnh cao của sự lừa lọc.",
      borderColor: '#222222',
    },
    {
      id: 4,
      name: "bomb_master",
      rank: "THÁCH ĐẤU I (Quốc Tế)",
      content: "tôi đã thức tới 3 giờ sáng chỉ để phục thù trận thua bị gài bom. game cuốn khủng khiếp, lối chơi cực kỳ hack não và mang tính chiến thuật cao hơn tôi tưởng.",
      borderColor: 'var(--pop-red)', // Card thứ 4 viền đỏ
    },
    {
      id: 5,
      name: "kitty_killer",
      rank: "BẠC I (Hải Phòng)",
      content: "bạn không thể tin bất kỳ ai trong game này kể cả người yêu. vừa hứa không gài bom mình xong lượt sau nó dùng bài liên hoàn cướp sạch bài phòng thủ của mình.",
      borderColor: '#222222',
    },
    {
      id: 6,
      name: "party_animal",
      rank: "CAO THỦ II (Cần Thơ)",
      content: "mỗi lần tụ tập nhóm bạn là lại lôi web ra chơi. ván đấu nhanh tầm 15 phút nên ai cũng được chơi nhiều lượt, tiếng cười và tiếng chửi nhau vang vọng cả phòng.",
      borderColor: '#222222',
    }
  ];

  return (
    <section 
      id="reviews"
      className="w-full bg-[var(--pop-black)] py-20 px-4 md:px-12 pop-border-3 border-t-0 select-none overflow-hidden"
    >
      <div className="max-w-5xl mx-auto">
        
        {/* Section title */}
        <h2 className="font-pop-display text-[38px] md:text-[52px] leading-[0.95] uppercase text-white mb-16 text-left">
          HÀNG TRIỆU TÌNH BẠN <br />
          <span className="text-[var(--pop-red)]">ĐÃ CHƠI QUA ĐÊM.</span>
        </h2>

        {/* Masonry Layout using CSS columns */}
        <div className="columns-1 md:columns-2 gap-6 space-y-6">
          {reviews.map((review) => (
            <div
              key={review.id}
              className="break-inside-avoid bg-[#161616] p-6 rounded-[4px] flex flex-col justify-between transition-all duration-150"
              style={{
                border: `2px solid ${review.borderColor}`,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translate(-2px, -2px)';
                e.currentTarget.style.boxShadow = `4px 4px 0 ${review.borderColor}`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translate(0, 0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              {/* Review Content */}
              <p className="font-pop-body text-sm md:text-[15px] text-[#bbb] leading-relaxed mb-6 lowercase font-medium">
                "{review.content}"
              </p>

              {/* Reviewer Meta (No Circle Avatar) */}
              <div className="flex items-center justify-between border-t border-[#222] pt-4">
                <span className="font-pop-accent text-[13px] text-[var(--pop-amber)] font-bold">
                  {review.name}
                </span>
                <span className="font-pop-body text-[11px] text-[#666] font-bold uppercase tracking-wider">
                  {review.rank}
                </span>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
