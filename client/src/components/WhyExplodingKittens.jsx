import React from 'react';
import { useLanguage } from '../context/LanguageContext.jsx';

/**
 * WhyExplodingKittens - Section 04 of the homepage.
 * Uses an asymmetric CSS Grid layout, rotated cards, big numeric labels, and hover lift effects.
 * Supports dual language translation (VI/EN).
 */
export default function WhyExplodingKittens() {
  const { language } = useLanguage();

  const t = {
    vi: {
      sectionTitle: "TẠI SAO PHẢI CHƠI?",
      sectionSubtext: "Mèo Nổ không chỉ là một trò chơi, đó là chiến trường của sự phản bội, hài hước và những quả bom nổ chậm!",
      card1Title: "Cơ chế bài độc đáo",
      card1Desc: "Rút bài và đối đầu với thần chết! Mỗi lá bài là một cơ hội để lật ngược tình thế: đặt bẫy bè bạn, nhìn trộm tương lai, hay nhảy qua lượt đầy hèn nhát. Nhưng hãy cẩn thận, lá Mèo Nổ luôn trực chờ để nổ tung bạn!",
      card2Title: "Ván đấu 15 phút",
      card2Desc: "Nhanh gọn, kịch tính và không tốn thời gian. Hoàn hảo cho các buổi tụ tập bạn bè chớp nhoáng hoặc giải trí giữa giờ nghỉ. Mỗi lượt rút bài là một khoảnh khắc nghẹt thở!",
      card3Title: "7 Phiên bản khác nhau",
      card3Desc: "Trải nghiệm 7 phiên bản hộp bài độc lập từ bản Cơ bản, Mở rộng cho đến phiên bản Mèo Thây Ma cực kỳ kịch tính.",
      card4Title: "Chơi offline & online",
      card4Desc: "Tụ tập chơi bài vật lý truyền thống hoặc so trình online bất cứ lúc nào với phòng chơi trực tuyến.",
    },
    en: {
      sectionTitle: "WHY PLAY?",
      sectionSubtext: "Exploding Kittens is more than a game—it's a chaotic battlefield of betrayal, humor, and ticking bomb time!",
      card1Title: "Unique Card Mechanics",
      card1Desc: "Draw cards and face death! Each card is a chance to turn the tide: trap your friends, peek into the future, or skip turns like a coward. But beware, the Exploding Kitten is always waiting to blow you up!",
      card2Title: "15-Minute Matches",
      card2Desc: "Fast-paced, dramatic, and time-efficient. Perfect for quick gatherings or coffee breaks. Every card draw is a breathtaking moment of suspense!",
      card3Title: "7 Different Editions",
      card3Desc: "Experience 7 independent deck editions, from the Original Game and Expansions to the chaotic Zombie Kittens.",
      card4Title: "Play Offline & Online",
      card4Desc: "Gather for traditional physical tabletop play or test your skills online anytime with digital lobbies.",
    }
  }[language] || {
    sectionTitle: "WHY PLAY?",
    sectionSubtext: "Exploding Kittens is more than a game—it's a chaotic battlefield of betrayal, humor, and ticking bomb time!",
    card1Title: "Unique Card Mechanics",
    card1Desc: "Draw cards and face death! Each card is a chance to turn the tide: trap your friends, peek into the future, or skip turns like a coward. But beware, the Exploding Kitten is always waiting to blow you up!",
    card2Title: "15-Minute Matches",
    card2Desc: "Fast-paced, dramatic, and time-efficient. Perfect for quick gatherings or coffee breaks. Every card draw is a breathtaking moment of suspense!",
    card3Title: "7 Different Editions",
    card3Desc: "Experience 7 independent deck editions, from the Original Game and Expansions to the chaotic Zombie Kittens.",
    card4Title: "Play Offline & Online",
    card4Desc: "Gather for traditional physical tabletop play or test your skills online anytime with digital lobbies.",
  };

  return (
    <section 
      id="why-play"
      className="w-full bg-[var(--pop-cream)] py-20 px-4 md:px-12 pop-border-3 border-t-0 select-none overflow-hidden"
    >
      <div className="max-w-7xl mx-auto">
        
        {/* Section title */}
        <div className="mb-16 text-center md:text-left">
          <h2 className="font-pop-display text-[44px] md:text-[56px] text-[var(--pop-black)] uppercase tracking-tight leading-none mb-4">
            {t.sectionTitle}
          </h2>
          <p className="font-pop-body text-base md:text-lg text-[var(--pop-black)]/80 max-w-xl font-medium">
            {t.sectionSubtext}
          </p>
        </div>

        {/* Asymmetric Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:grid-rows-2">
          
          {/* Card Lớn: Cơ chế bài độc đáo (Chiếm cột 1, hàng 1 & 2) */}
          <div 
            className="md:col-span-1 md:row-span-2 bg-[var(--pop-red)] pop-border-3 p-8 flex flex-col justify-between relative overflow-hidden transition-all duration-150 group cursor-pointer"
            style={{ 
              boxShadow: '6px 6px 0 var(--pop-black)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translate(-3px, -3px)';
              e.currentTarget.style.boxShadow = '9px 9px 0 var(--pop-black)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translate(0, 0)';
              e.currentTarget.style.boxShadow = '6px 6px 0 var(--pop-black)';
            }}
            onMouseDown={(e) => {
              e.currentTarget.style.transform = 'translate(6px, 6px)';
              e.currentTarget.style.boxShadow = '0px 0px 0 transparent';
            }}
            onMouseUp={(e) => {
              e.currentTarget.style.transform = 'translate(-3px, -3px)';
              e.currentTarget.style.boxShadow = '9px 9px 0 var(--pop-black)';
            }}
          >
            <div>
              <h3 className="font-pop-display text-[26px] text-white uppercase mb-4 leading-tight">
                {t.card1Title}
              </h3>
              <p className="font-pop-body text-sm text-[var(--pop-cream)]/90 leading-relaxed font-medium max-w-sm">
                {t.card1Desc}
              </p>
            </div>
            
            {/* Số thứ tự lớn mờ ở góc dưới phải */}
            <div className="self-end font-pop-display text-[100px] text-black/10 select-none leading-none mt-10 md:mt-24">
              01
            </div>
          </div>

          {/* Card Vừa (Góc trên phải): Ván đấu 15 phút (Chiếm cột 2 & 3, hàng 1) */}
          <div 
            className="md:col-span-2 bg-[var(--pop-black)] text-white pop-border-3 p-8 flex flex-col md:flex-row md:items-center justify-between relative overflow-hidden transition-all duration-150 cursor-pointer"
            style={{ 
              transform: 'rotate(1.5deg)',
              boxShadow: '6px 6px 0 var(--pop-red)', // Shadow đỏ đặc trưng
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translate(-3px, -3px) rotate(1.5deg)';
              e.currentTarget.style.boxShadow = '9px 9px 0 var(--pop-red)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'rotate(1.5deg)';
              e.currentTarget.style.boxShadow = '6px 6px 0 var(--pop-red)';
            }}
            onMouseDown={(e) => {
              e.currentTarget.style.transform = 'translate(6px, 6px) rotate(1.5deg)';
              e.currentTarget.style.boxShadow = '0px 0px 0 transparent';
            }}
            onMouseUp={(e) => {
              e.currentTarget.style.transform = 'translate(-3px, -3px) rotate(1.5deg)';
              e.currentTarget.style.boxShadow = '9px 9px 0 var(--pop-red)';
            }}
          >
            <div className="max-w-md">
              <h3 className="font-pop-display text-[24px] text-[var(--pop-amber)] uppercase mb-3 leading-tight">
                {t.card2Title}
              </h3>
              <p className="font-pop-body text-sm text-[#bbb] leading-relaxed font-medium">
                {t.card2Desc}
              </p>
            </div>
            
            <div className="self-end md:self-auto font-pop-display text-[80px] text-white/5 select-none leading-none mt-4 md:mt-0 md:mr-4">
              02
            </div>
          </div>

          {/* Card Vừa (Hàng 2 giữa): 7 Phiên bản khác nhau (Chiếm cột 2, hàng 2) */}
          <div 
            className="bg-[var(--pop-amber)] pop-border-3 p-8 flex flex-col justify-between relative overflow-hidden transition-all duration-150 cursor-pointer"
            style={{ 
              boxShadow: '6px 6px 0 var(--pop-black)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translate(-3px, -3px)';
              e.currentTarget.style.boxShadow = '9px 9px 0 var(--pop-black)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translate(0, 0)';
              e.currentTarget.style.boxShadow = '6px 6px 0 var(--pop-black)';
            }}
            onMouseDown={(e) => {
              e.currentTarget.style.transform = 'translate(6px, 6px)';
              e.currentTarget.style.boxShadow = '0px 0px 0 transparent';
            }}
            onMouseUp={(e) => {
              e.currentTarget.style.transform = 'translate(-3px, -3px)';
              e.currentTarget.style.boxShadow = '9px 9px 0 var(--pop-black)';
            }}
          >
            <div>
              <h3 className="font-pop-display text-[22px] text-[var(--pop-black)] uppercase mb-3 leading-tight">
                {t.card3Title}
              </h3>
              <p className="font-pop-body text-sm text-[var(--pop-black)]/80 leading-relaxed font-medium">
                {t.card3Desc}
              </p>
            </div>
            
            <div className="self-end font-pop-display text-[72px] text-black/10 select-none leading-none mt-8">
              03
            </div>
          </div>

          {/* Card Nhỏ (Hàng 2 phải): Chơi offline & online (Chiếm cột 3, hàng 2) */}
          <div 
            className="bg-[var(--pop-cream)] pop-border-3 p-8 flex flex-col justify-between relative overflow-hidden transition-all duration-150 cursor-pointer"
            style={{ 
              transform: 'rotate(-1deg)',
              boxShadow: '6px 6px 0 var(--pop-black)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translate(-3px, -3px) rotate(-1deg)';
              e.currentTarget.style.boxShadow = '9px 9px 0 var(--pop-black)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'rotate(-1deg)';
              e.currentTarget.style.boxShadow = '6px 6px 0 var(--pop-black)';
            }}
            onMouseDown={(e) => {
              e.currentTarget.style.transform = 'translate(6px, 6px) rotate(-1deg)';
              e.currentTarget.style.boxShadow = '0px 0px 0 transparent';
            }}
            onMouseUp={(e) => {
              e.currentTarget.style.transform = 'translate(-3px, -3px) rotate(-1deg)';
              e.currentTarget.style.boxShadow = '9px 9px 0 var(--pop-black)';
            }}
          >
            <div>
              <h3 className="font-pop-display text-[22px] text-[var(--pop-black)] uppercase mb-3 leading-tight">
                {t.card4Title}
              </h3>
              <p className="font-pop-body text-sm text-[var(--pop-black)]/80 leading-relaxed font-medium">
                {t.card4Desc}
              </p>
            </div>
            
            <div className="self-end font-pop-display text-[72px] text-black/10 select-none leading-none mt-8">
              04
            </div>
          </div>

        </div>

      </div>
    </section>
  );
}
