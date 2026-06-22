import React from 'react';
import { getCardImageUrl } from '../utils/cardSkins.js';
import { useLanguage } from '../context/LanguageContext.jsx';

/**
 * HowToPlay - Section 05 of the homepage.
 * Features 3 full-width stages with staggered backgrounds, giant watermarked step numbers, 
 * pop-art card visual overlays, and SVG zigzag dividers.
 * Supports dual language (VI/EN).
 */
export default function HowToPlay() {
  const { language } = useLanguage();
  const zigzagPoints = "0,30 30,0 60,30 90,0 120,30 150,0 180,30 210,0 240,30 270,0 300,30 330,0 360,30 390,0 420,30 450,0 480,30 510,0 540,30 570,0 600,30 630,0 660,30 690,0 720,30 750,0 780,30 810,0 840,30 870,0 900,30 930,0 960,30 990,0 1020,30 1050,0 1080,30 1110,0 1140,30 1170,0 1200,30";

  // Nạp ảnh thẻ bài thực tế
  const explodingImg = getCardImageUrl('exploding_kitten', 1);
  const defuseImg = getCardImageUrl('defuse', 1);
  const nopeImg = getCardImageUrl('nope', 0);
  const attackImg = getCardImageUrl('attack', 0);

  const t = {
    vi: {
      sectionTitle: "CÁCH CHƠI NHƯ THẾ NÀO?",
      sectionSubtext: "3 bước đơn giản để bắt đầu cuộc hủy diệt tình bạn",
      step1Tag: "BƯỚC ĐẦU TIÊN",
      step1Title: "Tạo phòng, mời bạn",
      step1Desc: "Chỉ với 1 cú click để tạo phòng chơi riêng tư trực tiếp trên trình duyệt. Sao chép liên kết phòng và gửi cho nhóm bạn của bạn. Vào chơi ngay lập tức mà không cần cài đặt hay đăng ký tài khoản rườm rà.",
      step1Quote: "\"Không cần tải app, chơi ngay trên web\"",
      step2Tag: "BƯỚC GIỮA TRẬN",
      step2Title: "Nhận bài, lên chiến thuật",
      step2Desc: "Mỗi người chơi nhận 4 lá bài ngẫu nhiên và 1 lá gỡ bom (Defuse). Trong lượt của mình, bạn có thể đánh ra các lá bài chức năng để cướp bài của người khác, xem trước xấp bài rút, hoặc ép đối thủ phải rút bài liên tục.",
      step2Quote: "\"Giữ lá Defuse kỹ như sinh mạng của bạn!\"",
      step3Tag: "BƯỚC QUYẾT ĐỊNH",
      step3Title: "Tránh Mèo Nổ bằng mọi giá",
      step3Desc: "Mỗi lượt kết thúc bằng việc rút 1 lá bài. Nếu rút phải lá Mèo Nổ và không có lá Defuse để hóa giải, bạn sẽ bị nổ tung và loại khỏi cuộc chơi ngay lập tức. Người chơi cuối cùng còn sống sót sẽ thắng!",
      step3Quote: "\"Nổ tung hay sống sót? Bạn dám liều mạng rút bài?\"",
    },
    en: {
      sectionTitle: "HOW TO PLAY?",
      sectionSubtext: "3 simple steps to start destroying friendships",
      step1Tag: "FIRST STEP",
      step1Title: "Create Room, Invite Friends",
      step1Desc: "Create a private lobby directly in your browser with just 1 click. Copy the room link and send it to your friends. Jump into the game instantly without tedious installs or sign-ups.",
      step1Quote: "\"No downloads required, play instantly on web\"",
      step2Tag: "MID-GAME STRATEGY",
      step2Title: "Draw Cards, Strategize",
      step2Desc: "Each player receives 4 random cards and 1 Defuse card. On your turn, you can play functional cards to steal from others, peek at the deck, or force opponents to take multiple turns.",
      step2Quote: "\"Protect your Defuse card like your life depends on it!\"",
      step3Tag: "THE FINAL CLIMAX",
      step3Title: "Avoid Exploding Kittens at All Costs",
      step3Desc: "Each turn ends by drawing 1 card. If you draw an Exploding Kitten and don't have a Defuse card, you blow up and get eliminated instantly! The last survivor wins!",
      step3Quote: "\"Blow up or survive? Do you dare to draw?\"",
    }
  }[language] || {
    sectionTitle: "HOW TO PLAY?",
    sectionSubtext: "3 simple steps to start destroying friendships",
    step1Tag: "FIRST STEP",
    step1Title: "Create Room, Invite Friends",
    step1Desc: "Create a private lobby directly in your browser with just 1 click. Copy the room link and send it to your friends. Jump into the game instantly without tedious installs or sign-ups.",
    step1Quote: "\"No downloads required, play instantly on web\"",
    step2Tag: "MID-GAME STRATEGY",
    step2Title: "Draw Cards, Strategize",
    step2Desc: "Each player receives 4 random cards and 1 Defuse card. On your turn, you can play functional cards to steal from others, peek at the deck, or force opponents to take multiple turns.",
    step2Quote: "\"Protect your Defuse card like your life depends on it!\"",
    step3Tag: "THE FINAL CLIMAX",
    step3Title: "Avoid Exploding Kittens at All Costs",
    step3Desc: "Each turn ends by drawing 1 card. If you draw an Exploding Kitten and don't have a Defuse card, you blow up and get eliminated instantly! The last survivor wins!",
    step3Quote: "\"Blow up or survive? Do you dare to draw?\"",
  };

  return (
    <section id="how-to-play" className="w-full bg-[var(--pop-red)] select-none">
      
      {/* 1. TOP ZIGZAG DIVIDER: transition from Cream to Red */}
      <div className="w-full bg-[var(--pop-cream)] h-[30px] overflow-hidden">
        <svg 
          viewBox="0 0 1200 30" 
          className="w-full h-full block" 
          preserveAspectRatio="none"
        >
          <polyline points={zigzagPoints} fill="var(--pop-red)" />
        </svg>
      </div>

      <div className="w-full py-16 text-center">
        <h2 className="font-pop-display text-[44px] md:text-[56px] text-white text-stroke-black-2 uppercase tracking-tight leading-none">
          {t.sectionTitle}
        </h2>
        <p className="font-pop-body text-sm md:text-base text-[var(--pop-cream)] font-medium mt-2">
          {t.sectionSubtext}
        </p>
      </div>

      {/* STAGE 1: Cream background, black text */}
      <div className="w-full bg-[var(--pop-cream)] py-20 px-6 md:px-12 pop-border-3 border-x-0 relative overflow-hidden">
        {/* Giant background number */}
        <div 
          style={{ color: 'rgba(226, 75, 74, 0.08)' }} 
          className="absolute top-1/2 left-6 md:left-12 transform -translate-y-1/2 font-pop-display text-[180px] md:text-[260px] leading-none select-none pointer-events-none z-0"
        >
          01
        </div>

        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-12 relative z-10">
          {/* Left info */}
          <div className="max-w-xl md:ml-48 relative z-10">
            <span className="font-pop-accent text-xs font-bold text-[var(--pop-red)] uppercase tracking-wider block mb-2">
              {t.step1Tag}
            </span>
            <h3 className="font-pop-display text-[32px] md:text-[40px] text-[var(--pop-black)] uppercase leading-none mb-4">
              {t.step1Title}
            </h3>
            <p className="font-pop-body text-base text-[var(--pop-black)]/80 leading-relaxed font-medium">
              {t.step1Desc}
            </p>
          </div>

          {/* Right quote block */}
          <div className="transform rotate-3 bg-[var(--pop-amber)] pop-border-3 p-6 max-w-sm shrink-0" style={{ boxShadow: '6px 6px 0 var(--pop-black)' }}>
            <p className="font-pop-accent font-bold text-lg md:text-xl text-[var(--pop-orange)] italic leading-tight text-center">
              {t.step1Quote}
            </p>
          </div>
        </div>
      </div>

      {/* STAGE 2: Black background, white/amber text */}
      <div className="w-full bg-[var(--pop-black)] text-white py-20 px-6 md:px-12 pop-border-3 border-t-0 border-x-0 relative overflow-hidden">
        {/* Giant background number */}
        <div 
          style={{ color: 'rgba(255, 255, 255, 0.04)' }} 
          className="absolute top-1/2 right-6 md:right-12 transform -translate-y-1/2 font-pop-display text-[180px] md:text-[260px] leading-none select-none pointer-events-none z-0"
        >
          02
        </div>

        <div className="max-w-7xl mx-auto flex flex-col md:flex-row-reverse items-center justify-between gap-12 relative z-10">
          {/* Left info */}
          <div className="max-w-xl md:mr-48 relative z-10">
            <span className="font-pop-accent text-xs font-bold text-[var(--pop-amber)] uppercase tracking-wider block mb-2">
              {t.step2Tag}
            </span>
            <h3 className="font-pop-display text-[32px] md:text-[40px] text-[var(--pop-amber)] uppercase leading-none mb-4">
              {t.step2Title}
            </h3>
            <p className="font-pop-body text-base text-white/80 leading-relaxed font-medium">
              {t.step2Desc}
            </p>
          </div>

          {/* Right visual: Fan of 3 cards */}
          <div className="relative w-80 h-52 select-none scale-90 md:scale-100 flex items-center justify-center shrink-0">
            {/* Card 1: Attack */}
            {attackImg && (
              <div 
                className="absolute left-2 top-4 w-[110px] h-[156px] md:w-[124px] md:h-[176px] rounded-xl bg-white pop-border-2 overflow-hidden transform -rotate-12 transition-transform duration-200 hover:-translate-y-2 hover:z-20 cursor-pointer"
                style={{ boxShadow: '4px 4px 0 var(--pop-black)' }}
              >
                <img src={attackImg} alt="Tấn công" className="w-full h-full object-cover select-none pointer-events-none" />
              </div>
            )}
            
            {/* Card 2: Nope */}
            {nopeImg && (
              <div 
                className="absolute left-16 top-2 w-[110px] h-[156px] md:w-[124px] md:h-[176px] rounded-xl bg-white pop-border-2 overflow-hidden z-10 transform -rotate-2 transition-transform duration-200 hover:-translate-y-2 hover:z-20 cursor-pointer"
                style={{ boxShadow: '4px 4px 0 var(--pop-black)' }}
              >
                <img src={nopeImg} alt="Nope" className="w-full h-full object-cover select-none pointer-events-none" />
              </div>
            )}
            
            {/* Card 3: Defuse */}
            {defuseImg && (
              <div 
                className="absolute left-32 top-6 w-[110px] h-[156px] md:w-[124px] md:h-[176px] rounded-xl bg-white pop-border-2 overflow-hidden z-20 transform rotate-12 transition-transform duration-200 hover:-translate-y-2 hover:z-30 cursor-pointer"
                style={{ boxShadow: '4px 4px 0 var(--pop-black)' }}
              >
                <img src={defuseImg} alt="Gỡ Bom" className="w-full h-full object-cover select-none pointer-events-none" />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* STAGE 3: Amber background, black text */}
      <div className="w-full bg-[var(--pop-amber)] py-20 px-6 md:px-12 pop-border-3 border-t-0 border-x-0 relative overflow-hidden">
        {/* Giant background number */}
        <div 
          style={{ color: 'rgba(17, 17, 17, 0.06)' }} 
          className="absolute top-1/2 left-6 md:left-12 transform -translate-y-1/2 font-pop-display text-[180px] md:text-[260px] leading-none select-none pointer-events-none z-0"
        >
          03
        </div>

        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-12 relative z-10">
          {/* Left info */}
          <div className="max-w-xl md:ml-48 relative z-10">
            <span className="font-pop-accent text-xs font-bold text-[var(--pop-orange)] uppercase tracking-wider block mb-2">
              {t.step3Tag}
            </span>
            <h3 className="font-pop-display text-[32px] md:text-[40px] text-[var(--pop-black)] uppercase leading-none mb-4">
              {t.step3Title}
            </h3>
            <p className="font-pop-body text-base text-[var(--pop-black)]/80 leading-relaxed font-medium">
              {t.step3Desc}
            </p>
          </div>

          {/* Right visual: Giant Exploding Kitten Card */}
          {explodingImg && (
            <div 
              className="w-[140px] h-[198px] md:w-[170px] md:h-[240px] rounded-xl bg-white pop-border-3 overflow-hidden transform rotate-6 hover:-rotate-2 transition-transform duration-300 cursor-pointer shrink-0"
              style={{ boxShadow: '8px 8px 0 var(--pop-red)' }}
            >
              <img src={explodingImg} alt="Mèo Nổ" className="w-full h-full object-cover select-none pointer-events-none" />
            </div>
          )}
        </div>
      </div>

      {/* 2. BOTTOM ZIGZAG DIVIDER: transition from Red to Cream */}
      <div className="w-full bg-[var(--pop-cream)] h-[30px] overflow-hidden">
        <svg 
          viewBox="0 0 1200 30" 
          className="w-full h-full block" 
          preserveAspectRatio="none"
        >
          <polyline points={zigzagPoints} fill="var(--pop-red)" />
        </svg>
      </div>

    </section>
  );
}
