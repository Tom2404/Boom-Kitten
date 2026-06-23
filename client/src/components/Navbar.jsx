import React from 'react';
import { useLanguage } from '../context/LanguageContext.jsx';

/**
 * Navbar component for the Exploding Kittens homepage (Pop Art Style).
 * Synchronized with the global app navigation (links, auth states, language switcher) 
 * while maintaining bold Neo-brutalism aesthetics.
 * 
 * @param {Object} props
 * @param {function} props.setPage - Safe navigation method from App.jsx
 * @param {boolean} props.isLoggedIn - User login status
 * @param {string} props.userRole - User role ('admin' or 'user')
 * @param {function} props.handleLogout - App-level logout handler
 */
export default function Navbar({ setPage, isLoggedIn, userRole, handleLogout }) {
  const { language, setLanguage, t } = useLanguage();
  
  // Hover & Active states for buttons to animate mechanical transitions
  const [langHover, setLangHover] = React.useState(false);
  const [langActive, setLangActive] = React.useState(false);
  
  const [authHover, setAuthHover] = React.useState(false);
  const [authActive, setAuthActive] = React.useState(false);

  const [regHover, setRegHover] = React.useState(false);
  const [regActive, setRegActive] = React.useState(false);

  // Smooth scroll to home top or specific elements
  const scrollToSection = (id) => {
    setPage('Home');
    setTimeout(() => {
      const element = document.getElementById(id);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }, 50);
  };

  // Lang Switcher Button pop art style
  const langBtnStyle = {
    backgroundColor: '#FFFFFF',
    color: 'var(--pop-black)',
    border: '2px solid var(--pop-black)',
    boxShadow: langActive 
      ? '0px 0px 0 transparent' 
      : langHover 
        ? '4px 4px 0 var(--pop-red)' 
        : '2px 2px 0 var(--pop-red)',
    transform: langActive 
      ? 'translate(2px, 2px)' 
      : langHover 
        ? 'translate(-2px, -2px)' 
        : 'translate(0, 0)',
  };

  // Auth Button (Logout/Register) Pop Art Style
  const getAuthBtnStyle = (isRegister) => {
    const isActive = isRegister ? regActive : authActive;
    const isHovered = isRegister ? regHover : authHover;
    const bg = isRegister ? 'var(--pop-amber)' : 'var(--pop-red)';
    const shadowColor = isRegister ? 'var(--pop-red)' : 'var(--pop-black)';
    const text = isRegister ? 'var(--pop-black)' : '#FFFFFF';

    return {
      backgroundColor: bg,
      color: text,
      border: '2px solid var(--pop-black)',
      boxShadow: isActive 
        ? '0px 0px 0 transparent' 
        : isHovered 
          ? '4px 4px 0 ' + shadowColor 
          : '2px 2px 0 ' + shadowColor,
      transform: isActive 
        ? 'translate(2px, 2px)' 
        : isHovered 
          ? 'translate(-2px, -2px)' 
          : 'translate(0, 0)',
    };
  };

  return (
    <nav className="sticky top-0 w-full h-[60px] bg-[var(--pop-black)] border-b-2 border-white/10 z-50 select-none">
      <div className="max-w-7xl mx-auto h-full px-4 md:px-12 flex justify-between items-center">
        
        {/* LOGO */}
        <div 
          onClick={() => scrollToSection('hero')} 
          className="flex items-center gap-2 cursor-pointer shrink-0"
        >
          {/* Red diamond */}
          <div className="w-[14px] h-[14px] bg-[var(--pop-red)] rotate-45 pop-border-2 border-white" />
          
          <span className="font-pop-display text-lg md:text-[22px] tracking-tight uppercase">
            <span className="text-white">Mèo</span>
            <span className="text-[var(--pop-red)]">Nổ</span>
          </span>
        </div>

        {/* NAVIGATION LINKS (Unified with core game routes) */}
        <div className="hidden lg:flex items-center gap-6 font-pop-body text-xs md:text-sm font-bold">
          <button 
            onClick={() => scrollToSection('hero')}
            className="text-[#888] hover:text-white transition-colors duration-150 uppercase tracking-wider"
          >
            {t('home')}
          </button>
          
          <button 
            onClick={() => setPage('Game')}
            className="text-[#888] hover:text-white transition-colors duration-150 uppercase tracking-wider"
          >
            {t('arena')}
          </button>
          
          <button 
            onClick={() => setPage('Leaderboard')}
            className="text-[#888] hover:text-white transition-colors duration-150 uppercase tracking-wider"
          >
            {t('leaderboard')}
          </button>
          
          <button 
            onClick={() => setPage('Shop')}
            className="text-[#888] hover:text-white transition-colors duration-150 uppercase tracking-wider"
          >
            {t('shop')}
          </button>

          {isLoggedIn && (
            <button 
              onClick={() => setPage('Profile')}
              className="text-[#888] hover:text-white transition-colors duration-150 uppercase tracking-wider"
            >
              {t('profile')}
            </button>
          )}
        </div>

        {/* ACTIONS: Lang, Login/Register/Logout, Admin */}
        <div className="flex items-center gap-4 shrink-0 font-pop-accent text-xs">
          
          {/* Admin badge if role is admin */}
          {isLoggedIn && userRole === 'admin' && (
            <button
              onClick={() => setPage('Admin')}
              className="bg-[var(--pop-amber)] text-[var(--pop-black)] pop-border-2 px-3 py-1 font-bold uppercase tracking-wider transform -rotate-2 hover:scale-105 active:scale-95 transition-all"
              style={{ boxShadow: '2px 2px 0 var(--pop-red)' }}
            >
              {t('admin')}
            </button>
          )}

          {/* Brutalist Language Switcher */}
          <button
            style={langBtnStyle}
            className="font-pop-accent font-bold px-3 py-1.5 transition-all duration-150 cursor-pointer uppercase"
            onMouseEnter={() => setLangHover(true)}
            onMouseLeave={() => {
              setLangHover(false);
              setLangActive(false);
            }}
            onMouseDown={() => setLangActive(true)}
            onMouseUp={() => setLangActive(false)}
            onClick={() => setLanguage(language === 'en' ? 'vi' : 'en')}
          >
            {language === 'en' ? 'VI' : 'EN'}
          </button>

          {/* Login / Register / Logout States */}
          {isLoggedIn ? (
            <button
              style={getAuthBtnStyle(false)}
              className="font-pop-accent font-bold px-4 py-1.5 transition-all duration-150 cursor-pointer uppercase"
              onMouseEnter={() => setAuthHover(true)}
              onMouseLeave={() => {
                setAuthHover(false);
                setAuthActive(false);
              }}
              onMouseDown={() => setAuthActive(true)}
              onMouseUp={() => setAuthActive(false)}
              onClick={handleLogout}
            >
              {t('logout')}
            </button>
          ) : (
            <>
              {/* Login Link */}
              <button
                onClick={() => setPage('Login')}
                className="text-[#888] hover:text-white transition-colors duration-150 font-pop-body font-bold uppercase tracking-wider text-xs md:text-sm mr-1"
              >
                {t('login')}
              </button>

              {/* Register Button */}
              <button
                style={getAuthBtnStyle(true)}
                className="font-pop-accent font-bold px-4 py-1.5 transition-all duration-150 cursor-pointer uppercase text-xs md:text-sm"
                onMouseEnter={() => setRegHover(true)}
                onMouseLeave={() => {
                  setRegHover(false);
                  setRegActive(false);
                }}
                onMouseDown={() => setRegActive(true)}
                onMouseUp={() => setRegActive(false)}
                onClick={() => setPage('Register')}
              >
                {t('register')}
              </button>
            </>
          )}
        </div>

      </div>
    </nav>
  );
}
