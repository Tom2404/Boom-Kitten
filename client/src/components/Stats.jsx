import React from 'react';
import { useLanguage } from '../context/LanguageContext.jsx';

/**
 * Stats section of the homepage.
 * Uses a bold, asymmetric layout, baseline aligned numbers, and hard dividers.
 * Supports dual language (VI/EN).
 */
export default function Stats() {
  const { language } = useLanguage();

  const t = {
    vi: {
      stat1: "2.000.000",
      lbl1: "người chơi đang online",
      lbl2: "loại bài đặc biệt",
      lbl3: "đánh giá trên app store",
      lbl4: "mỗi ván đấu — không mốc thời gian",
    },
    en: {
      stat1: "2,000,000",
      lbl1: "players online now",
      lbl2: "unique card types",
      lbl3: "ratings on app store",
      lbl4: "average match time — quick setup",
    }
  }[language] || {
    stat1: "2,000,000",
    lbl1: "players online now",
    lbl2: "unique card types",
    lbl3: "ratings on app store",
    lbl4: "average match time — quick setup",
  };

  return (
    <section className="w-full bg-[var(--pop-black)] py-12 px-4 md:px-12 pop-border-3 border-t-0 select-none overflow-x-auto hide-scroll">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-baseline md:justify-between gap-12 md:gap-6 min-w-[900px] py-4">
        
        {/* Số liệu 1 */}
        <div className="flex-1 flex flex-col">
          <div className="flex items-baseline">
            <span className="font-pop-display text-[84px] md:text-[96px] text-[var(--pop-amber)] leading-none">{t.stat1}</span>
          </div>
          <span className="font-pop-body text-xs md:text-sm text-[#666] font-bold uppercase tracking-wider mt-2">
            {t.lbl1}
          </span>
        </div>

        {/* Đường kẻ dọc 1 */}
        <div className="hidden md:block w-[1px] bg-[#222] self-center h-20" />

        {/* Số liệu 2 */}
        <div className="flex-1 flex flex-col">
          <div className="flex items-baseline">
            <span className="font-pop-display text-[64px] text-white leading-none">150+</span>
          </div>
          <span className="font-pop-body text-xs md:text-sm text-[#888] font-bold uppercase tracking-wider mt-2">
            {t.lbl2}
          </span>
        </div>

        {/* Đường kẻ dọc 2 */}
        <div className="hidden md:block w-[1px] bg-[#222] self-center h-20" />

        {/* Số liệu 3 */}
        <div className="flex-1 flex flex-col">
          <div className="flex items-baseline gap-1">
            <span className="font-pop-display text-[84px] md:text-[96px] text-[var(--pop-red)] leading-none">4.9</span>
            <span className="font-pop-body text-2xl font-bold text-[#444]">/5</span>
          </div>
          <span className="font-pop-body text-xs md:text-sm text-[#666] font-bold uppercase tracking-wider mt-2">
            {t.lbl3}
          </span>
        </div>

        {/* Đường kẻ dọc 3 */}
        <div className="hidden md:block w-[1px] bg-[#222] self-center h-20" />

        {/* Số liệu 4 */}
        <div className="flex-grow flex flex-col">
          <div className="flex items-baseline">
            <span className="font-pop-display text-[64px] text-white leading-none">15'</span>
          </div>
          <span className="font-pop-body text-xs md:text-sm text-[#888] font-bold uppercase tracking-wider mt-2">
            {t.lbl4}
          </span>
        </div>

      </div>
    </section>
  );
}
