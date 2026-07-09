import React from 'react';
import PopButton from './PopButton.jsx';
import { useLanguage } from '../context/LanguageContext.jsx';

/**
 * CTAFinal - Section 07 of the homepage.
 * Features an asymmetric amber-background call to action, 
 * bold typography, rotated sub-headings, and a giant black PopButton with orange shadow.
 * Supports dual language (VI/EN).
 * 
 * @param {Object} props
 * @param {function} props.setPage - Router state setter from App.jsx
 */
export default function CTAFinal({ setPage, isLoggedIn, userRole }) {
  const { language } = useLanguage();

  const t = {
    vi: {
      tag: "SẴN SÀNG CHƯA?",
      titleLine1: "Thêm bạn, vui hơn.",
      titleLine2: "Thêm kẻ thù, càng vui.",
      subtext: "Chơi trực tiếp trên trình duyệt cùng nhóm bạn bè của bạn. Bắt đầu ngay bây giờ và tận hưởng những ván bài đầy tiếng cười (và tiếng hét).",
      cta: "Chơi miễn phí",
      footerNote: "Không cần tải app · Chơi trên web",
    },
    en: {
      tag: "ARE YOU READY?",
      titleLine1: "More Friends, More Fun.",
      titleLine2: "More Enemies, Even Better.",
      subtext: "Play directly in your browser with your friends. Start now and enjoy matches full of laughter (and screaming).",
      cta: "Play for Free",
      footerNote: "No apps required · Play on web",
    }
  }[language] || {
    tag: "ARE YOU READY?",
    titleLine1: "More Friends, More Fun.",
    titleLine2: "More Enemies, Even Better.",
    subtext: "Play directly in your browser with your friends. Start now and enjoy matches full of laughter (and screaming).",
    cta: "Play for Free",
    footerNote: "No apps required · Play on web",
  };

  return (
    <section 
      id="cta-final"
      className="w-full bg-[var(--pop-amber)] py-20 px-6 md:px-12 pop-border-3 border-t-0 select-none overflow-hidden"
    >
      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center justify-between gap-12">
        
        {/* Left column: Text content */}
        <div className="flex-1 text-center lg:text-left flex flex-col items-center lg:items-start">
          <span className="font-pop-accent text-[11px] font-bold text-[#7a3a00] tracking-wider uppercase mb-3">
            {t.tag}
          </span>
          
          <h2 className="font-pop-display text-[44px] md:text-[56px] text-[var(--pop-black)] leading-[0.9] uppercase mb-4 text-center lg:text-left">
            {t.titleLine1}
            <span className="block mt-1 transform -rotate-0.5 text-[var(--pop-orange)] font-extrabold">
              {t.titleLine2}
            </span>
          </h2>
          
          <p className="font-pop-body text-base md:text-[16px] text-[#7a3a00] font-medium max-w-md">
            {t.subtext}
          </p>
        </div>

        {/* Right column: Main action */}
        <div className="flex-1 flex flex-col items-center justify-center">
          <PopButton
            variant="dark"
            shadowColor="var(--pop-orange)"
            onClick={() => {
              if (isLoggedIn) {
                setPage(userRole === 'admin' ? 'Admin' : 'Game');
              } else {
                setPage('Login');
              }
            }}
            className="mb-4"
          >
            {t.cta}
          </PopButton>
          
          <span className="font-pop-body text-[13px] text-[#7a3a00] font-bold">
            {t.footerNote}
          </span>
        </div>

      </div>
    </section>
  );
}
