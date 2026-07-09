import React from 'react';
import PopButton from './PopButton.jsx';
import StickerBadge from './StickerBadge.jsx';
import { getCardImageUrl } from '../utils/cardSkins.js';
import { useLanguage } from '../context/LanguageContext.jsx';

/**
 * Hero section of the homepage.
 * Uses bold typography, halftone background, custom rotated headings, and sticker badges.
 * Now features floating card images on the sides and supports dual language translation.
 * 
 * @param {Object} props
 * @param {function} props.setPage - Router state setter from App.jsx
 */
export default function Hero({ setPage, isLoggedIn, userRole }) {
  const { language } = useLanguage();

  const scrollToSection = (id) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Get card image URLs from built-in asset mapping
  const explodingImg = getCardImageUrl('exploding_kitten', 0);
  const defuseImg = getCardImageUrl('defuse', 0);

  // Dual language translations
  const t = {
    vi: {
      tag: "PARTY TIME",
      headlineLine1: "RÚT BÀI ĐI",
      headlineLine2: "ĐỪNG ĐỂ",
      headlineLine3: "BỊ NỔ.",
      subtext: "Game bài chiến thuật dành cho nhóm bạn bè. Đặt bẫy, phá hoại kế hoạch của nhau, và cố gắng đừng để bị nổ cuối cùng.",
      ctaPrimary: "Chơi miễn phí ngay",
      ctaSecondary: "Xem gameplay",
      badge1: "2M+ NGƯỜI CHƠI",
      badge2: "TOP 1 VIỆT NAM",
      badge3: "CỰC KỲ HẤP DẪN",
    },
    en: {
      tag: "PARTY TIME",
      headlineLine1: "DRAW CARDS",
      headlineLine2: "AND TRY",
      headlineLine3: "NOT TO EXPLODE.",
      subtext: "A highly strategic, kitty-powered version of Russian Roulette. Put traps, sabotage each other, and try not to explode.",
      ctaPrimary: "Play Free Now",
      ctaSecondary: "Watch Gameplay",
      badge1: "2M+ PLAYERS",
      badge2: "TOP 1 IN VIETNAM",
      badge3: "PURE CHAOS",
    }
  }[language] || {
    tag: "PARTY TIME",
    headlineLine1: "DRAW CARDS",
    headlineLine2: "AND TRY",
    headlineLine3: "NOT TO EXPLODE.",
    subtext: "A highly strategic, kitty-powered version of Russian Roulette. Put traps, sabotage each other, and try not to explode.",
    ctaPrimary: "Play Free Now",
    ctaSecondary: "Watch Gameplay",
    badge1: "2M+ PLAYERS",
    badge2: "TOP 1 IN VIETNAM",
    badge3: "PURE CHAOS",
  };

  return (
    <section 
      id="hero"
      className="relative min-h-[88vh] bg-halftone-red w-full flex flex-col justify-center items-center py-20 px-4 select-none overflow-hidden pop-border-3 border-t-0"
    >
      {/* Floating Card Left: Mèo Nổ */}
      {explodingImg && (
        <div 
          className="absolute left-[-40px] md:left-6 lg:left-16 top-[15%] md:top-[25%] z-0 w-[120px] h-[170px] md:w-[160px] md:h-[228px] lg:w-[190px] lg:h-[270px] rounded-xl bg-white pop-border-3 overflow-hidden select-none pointer-events-auto transform -rotate-12 transition-all duration-300 hover:scale-105 hover:-rotate-6 hover:z-20 cursor-pointer hidden sm:block"
          style={{ boxShadow: '6px 6px 0 var(--pop-black)' }}
        >
          <img src={explodingImg} alt="Mèo Nổ" className="w-full h-full object-cover select-none pointer-events-none" />
        </div>
      )}

      {/* Floating Card Right: Gỡ Bom */}
      {defuseImg && (
        <div 
          className="absolute right-[-40px] md:right-6 lg:right-16 top-[15%] md:top-[25%] z-0 w-[120px] h-[170px] md:w-[160px] md:h-[228px] lg:w-[190px] lg:h-[270px] rounded-xl bg-white pop-border-3 overflow-hidden select-none pointer-events-auto transform rotate-12 transition-all duration-300 hover:scale-105 hover:rotate-6 hover:z-20 cursor-pointer hidden sm:block"
          style={{ boxShadow: '6px 6px 0 var(--pop-black)' }}
        >
          <img src={defuseImg} alt="Gỡ Bơm" className="w-full h-full object-cover select-none pointer-events-none" />
        </div>
      )}

      <div className="max-w-5xl mx-auto flex flex-col items-center text-center z-10">
        
        {/* TAG nhỏ phía trên headline */}
        <div className="mb-6 transform -rotate-1">
          <StickerBadge 
            bgColor="var(--pop-amber)" 
            textColor="var(--pop-black)"
            shadowColor="var(--pop-black)"
            rotate={0}
            className="pop-border-2 font-bold px-4 py-2 tracking-widest text-[11px]"
          >
            {t.tag}
          </StickerBadge>
        </div>

        {/* H1 Headline chính */}
        <h1 className="font-pop-display tracking-normal uppercase text-center flex flex-col items-center gap-3 mb-8 select-none leading-[1.05]">
          {/* Dòng 1: chữ trắng viền đen */}
          <span 
            className="text-white text-stroke-black-3 text-[48px] sm:text-[72px] md:text-[88px] block animate-pulse"
            style={{ textShadow: 'none', animationDuration: '3s' }}
          >
            {t.headlineLine1}
          </span>
          
          {/* Dòng 2: chữ kem viền đen */}
          <span 
            className="text-[var(--pop-cream)] text-stroke-black-3 text-[42px] sm:text-[64px] md:text-[80px] block"
          >
            {t.headlineLine2}
          </span>
          
          {/* Dòng 3: chữ đen nền amber xoay nhẹ */}
          <span className="block mt-2 transform -rotate-0.5">
            <span 
              className="inline-block bg-[var(--pop-amber)] text-[var(--pop-black)] pop-border-3 px-6 py-2 text-[40px] sm:text-[60px] md:text-[76px] font-extrabold leading-none"
              style={{ boxShadow: '6px 6px 0 var(--pop-orange)' }}
            >
              {t.headlineLine3}
            </span>
          </span>
        </h1>

        {/* Subtext */}
        <p className="font-pop-body text-white/90 text-[17px] leading-relaxed max-w-[480px] mb-10 text-center font-medium">
          {t.subtext}
        </p>

        {/* 2 nút CTA */}
        <div className="flex flex-col sm:flex-row gap-6 items-center justify-center">
          <PopButton 
            variant="primary" 
            shadowColor="var(--pop-black)"
            onClick={() => {
              if (isLoggedIn) {
                setPage(userRole === 'admin' ? 'Admin' : 'Game');
              } else {
                setPage('Login');
              }
            }}
          >
            {t.ctaPrimary}
          </PopButton>
          
          <PopButton 
            variant="secondary"
            onClick={() => scrollToSection('how-to-play')}
          >
            {t.ctaSecondary}
          </PopButton>
        </div>
      </div>

      {/* Decorative Stickers (Static Layout absolute ở góc phải dưới) */}
      <div className="hidden lg:block absolute bottom-10 right-10 z-20 pointer-events-none">
        <div className="relative w-[380px] h-36">
          {/* Badge 1: rotate(-4deg) */}
          <div className="absolute top-2 left-2 transform -rotate-3 whitespace-nowrap">
            <StickerBadge
              bgColor="#FFFFFF"
              textColor="var(--pop-black)"
              shadowColor="var(--pop-black)"
              className="text-sm px-6 py-2.5 font-extrabold pop-border-3"
            >
              {t.badge1}
            </StickerBadge>
          </div>

          {/* Badge 2: rotate(2deg) */}
          <div className="absolute top-16 left-12 transform rotate-2 z-10 whitespace-nowrap">
            <StickerBadge
              bgColor="var(--pop-red)"
              textColor="#FFFFFF"
              shadowColor="var(--pop-black)"
              className="text-sm px-6 py-2.5 font-extrabold pop-border-3 border-white"
            >
              {t.badge2}
            </StickerBadge>
          </div>

          {/* Badge 3: rotate(-2deg) */}
          <div className="absolute top-4 left-[200px] transform -rotate-2 whitespace-nowrap">
            <StickerBadge
              bgColor="var(--pop-amber)"
              textColor="var(--pop-black)"
              shadowColor="var(--pop-black)"
              className="text-sm px-5 py-2.5 font-extrabold pop-border-3"
            >
              {t.badge3}
            </StickerBadge>
          </div>
        </div>
      </div>
    </section>
  );
}
