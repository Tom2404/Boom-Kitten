import React from 'react';
import { useLanguage } from '../context/LanguageContext.jsx';

/**
 * Footer component for the homepage.
 * Minimalist Pop Art style with two rows, custom dark colors, and hover transitions.
 * Supports dual language translation (VI/EN).
 * 
 * @param {Object} props
 * @param {function} props.setPage - Router state setter from App.jsx
 */
export default function Footer({ setPage }) {
  const { language, t } = useLanguage();

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const footerText = {
    vi: {
      tagline: "Trò chơi party hủy diệt tình bạn",
      studio: "© 2026 Mèo Nổ Studio",
      warning: "Trò chơi dành cho người từ 7 tuổi",
    },
    en: {
      tagline: "Sabotage your friends party game",
      studio: "© 2026 Exploding Kittens Studio",
      warning: "For players ages 7 and up",
    }
  }[language] || {
    tagline: "Sabotage your friends party game",
    studio: "© 2026 Exploding Kittens Studio",
    warning: "For players ages 7 and up",
  };

  return (
    <footer className="w-full bg-[#0d0d0d] py-12 px-6 md:px-12 pop-border-3 border-t-0 select-none text-white">
      <div className="max-w-7xl mx-auto flex flex-col gap-8">
        
        {/* ROW 1: Logo & Tagline left, Top links right */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          {/* Logo & Tagline */}
          <div className="flex flex-col md:flex-row items-start md:items-center gap-2 md:gap-4">
            <div 
              onClick={scrollToTop} 
              className="flex items-center gap-2 cursor-pointer"
            >
              <div className="w-[16px] h-[16px] bg-[var(--pop-red)] rotate-45 pop-border-2 border-white" />
              <span className="font-pop-display text-[28px] tracking-tight uppercase leading-none">
                <span className="text-white">Mèo</span>
                <span className="text-[var(--pop-red)]">Nổ</span>
              </span>
            </div>
            <span className="font-pop-body text-xs text-[#444] font-bold uppercase tracking-wider md:mt-1.5">
              {footerText.tagline}
            </span>
          </div>

          {/* Links */}
          <div className="flex items-center gap-6 font-pop-body text-sm font-bold">
            <button
              onClick={() => setPage('Login')}
              className="text-[#555] hover:text-[var(--pop-amber)] transition-colors duration-150 uppercase"
            >
              {t('login')}
            </button>
            <a
              href="https://discord.gg"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#555] hover:text-[var(--pop-amber)] transition-colors duration-150"
            >
              Discord
            </a>
            <a
              href="https://facebook.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#555] hover:text-[var(--pop-amber)] transition-colors duration-150"
            >
              Fanpage
            </a>
          </div>
        </div>

        {/* Divider */}
        <div className="w-full h-[1px] bg-[#1a1a1a]" />

        {/* ROW 2: Copyright & Warning */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <span className="font-pop-body text-[13px] text-[#333] font-bold">
            {footerText.studio}
          </span>
          <span className="font-pop-body text-[12px] text-[#333] font-bold uppercase tracking-wider">
            {footerText.warning}
          </span>
        </div>

      </div>
    </footer>
  );
}
