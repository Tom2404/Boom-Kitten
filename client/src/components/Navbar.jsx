import React from 'react';
import { useLanguage } from '../context/LanguageContext.jsx';
import {
  PixelHomeIcon,
  PixelPlayIcon,
  PixelProfileIcon,
  PixelShopIcon,
  PixelStarIcon,
  PixelTrophyIcon,
  PixelWardrobeIcon,
} from './PixelIcons.jsx';
import { isAdminRole } from '../utils/adminRoles.js';

/**
 * Navbar component for the Exploding Kittens homepage (Pop Art Style).
 * Synchronized with the global app navigation (links, auth states, language switcher) 
 * while maintaining bold Neo-brutalism aesthetics.
 * 
 * @param {Object} props
 * @param {string} props.page - Current active page name
 * @param {function} props.setPage - Safe navigation method from App.jsx
 * @param {boolean} props.isLoggedIn - User login status
 * @param {string} props.userRole - User role ('admin' or 'user')
 * @param {function} props.handleLogout - App-level logout handler
 */
export default function Navbar({ page, setPage, isLoggedIn, userRole, handleLogout }) {
  const { language, setLanguage, t } = useLanguage();
  const isAdmin = isAdminRole(userRole);
  
  // Hover & Active states for buttons to animate mechanical transitions
  const [langHover, setLangHover] = React.useState(false);
  const [langActive, setLangActive] = React.useState(false);
  
  const [authHover, setAuthHover] = React.useState(false);
  const [authActive, setAuthActive] = React.useState(false);

  const [regHover, setRegHover] = React.useState(false);
  const [regActive, setRegActive] = React.useState(false);
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const mobileMenuButtonRef = React.useRef(null);

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

  const navigationItems = [
    { page: 'Home', label: t('home'), Icon: PixelHomeIcon },
    { page: 'Game', label: t('arena'), Icon: PixelPlayIcon },
    { page: 'Tournaments', label: 'Tournament', Icon: PixelTrophyIcon },
    { page: 'Mission', label: t('mission'), Icon: PixelStarIcon },
    { page: 'Shop', label: t('shop'), Icon: PixelShopIcon },
    { page: 'Wardrobe', label: t('wardrobe'), Icon: PixelWardrobeIcon, authenticated: true },
    { page: 'Profile', label: t('profile'), Icon: PixelProfileIcon, authenticated: true },
  ].filter((item) => !item.authenticated || isLoggedIn);

  const navigateTo = (targetPage) => {
    setMobileOpen(false);
    if (targetPage === 'Home') scrollToSection('hero');
    else setPage(targetPage);
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

  if (page === 'Admin') {
    return (
      <nav className="admin-topbar sticky top-0 z-40 w-full border-b border-[var(--admin-border)] bg-[var(--admin-surface)]/95 backdrop-blur-sm" aria-label={language === 'en' ? 'Admin account' : 'Tài khoản quản trị'}>
        <div className="mx-auto flex min-h-14 w-full max-w-[1600px] items-center justify-between gap-4 px-4 md:px-6 lg:px-8">
          <button
            type="button"
            onClick={() => setPage('Home')}
            className="flex items-center gap-2 rounded-md text-left text-[var(--admin-text)] transition-colors hover:text-[var(--admin-accent)] focus:outline-none focus:ring-2 focus:ring-[var(--admin-focus)] focus:ring-offset-2"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-md bg-[var(--admin-danger-bg)] text-[var(--admin-accent)]" aria-hidden="true">
              <span className="material-symbols-outlined text-[20px]">admin_panel_settings</span>
            </span>
            <span>
              <span className="block text-sm font-semibold tracking-[-0.01em]">Boom-Kitten</span>
              <span className="block text-[11px] text-[var(--admin-text-muted)]">Operations</span>
            </span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              className="min-h-9 rounded-md border border-[var(--admin-border-strong)] bg-[var(--admin-surface)] px-3 text-xs font-semibold text-[var(--admin-text)] transition-colors hover:bg-[var(--admin-surface-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--admin-focus)] focus:ring-offset-2"
              onClick={() => setLanguage(language === 'en' ? 'vi' : 'en')}
              aria-label={language === 'en' ? 'Switch to Vietnamese' : 'Chuyển sang tiếng Anh'}
            >
              {language === 'en' ? 'VI' : 'EN'}
            </button>
            {isLoggedIn && (
              <button
                type="button"
                className="min-h-9 rounded-md border border-transparent px-3 text-xs font-semibold text-[var(--admin-text-muted)] transition-colors hover:bg-[var(--admin-surface-muted)] hover:text-[var(--admin-text)] focus:outline-none focus:ring-2 focus:ring-[var(--admin-focus)] focus:ring-offset-2"
                onClick={handleLogout}
              >
                {t('logout')}
              </button>
            )}
          </div>
        </div>
      </nav>
    );
  }

  return (
    <nav
      className="sticky top-0 w-full h-[60px] bg-[var(--pop-black)] border-b-2 border-white/10 z-50 select-none"
      onKeyDown={(event) => {
        if (event.key === 'Escape' && mobileOpen) {
          setMobileOpen(false);
          mobileMenuButtonRef.current?.focus();
        }
      }}
    >
      <div className="max-w-7xl mx-auto h-full px-2 sm:px-4 md:px-12 flex justify-between items-center">
        
        {/* LOGO */}
        <div 
          onClick={() => scrollToSection('hero')} 
          className="flex items-center gap-2 cursor-pointer shrink-0"
        >
          {/* Red diamond */}
          <div className="w-[14px] h-[14px] bg-[var(--pop-red)] rotate-45 pop-border-2 border-white" />
          
          <span className="hidden min-[400px]:inline font-pop-display text-lg md:text-[22px] tracking-tight uppercase">
            <span className="text-white">Mèo</span>
            <span className="text-[var(--pop-red)]">Nổ</span>
          </span>
        </div>

        {/* NAVIGATION LINKS (Unified with core game routes) */}
        <div className="hidden lg:flex items-center gap-2 xl:gap-6 font-pop-body text-xs font-bold">
          {!isAdmin && navigationItems.map(({ page: targetPage, label, Icon }) => {
            const active = page === targetPage;
            return (
              <button
                key={targetPage}
                type="button"
                onClick={() => navigateTo(targetPage)}
                className={`flex items-center gap-1.5 uppercase tracking-wider transition-all duration-200 border-b-2 py-1 px-1 cursor-pointer ${active ? 'text-white border-[var(--pop-red)] font-black translate-y-[-1px]' : 'text-[#888] border-transparent hover:text-white hover:border-white/40'}`}
              >
                <Icon size={12} className={active ? 'text-[var(--pop-red)]' : 'text-neutral-500'} />
                {label}
              </button>
            );
          })}
          
          {isLoggedIn && isAdmin && (
            <button 
              onClick={() => setPage('Admin')}
              className={`flex items-center gap-1.5 uppercase tracking-wider transition-all duration-200 border-b-2 py-1 px-2 cursor-pointer font-black rounded-sm
                ${page === 'Admin' 
                  ? 'text-[var(--pop-amber)] border-[var(--pop-amber)] translate-y-[-1px]' 
                  : 'text-[var(--pop-amber)] border-transparent hover:text-white hover:border-[var(--pop-amber)]'}`}
            >
              <span className="animate-pulse">🛠️</span>
              Quản Lý
            </button>
          )}
        </div>

        {/* ACTIONS: Lang, Login/Register/Logout, Admin */}
        <div className="flex items-center gap-2 sm:gap-4 shrink-0 font-pop-accent text-xs">
          {!isAdmin && (
            <button
              ref={mobileMenuButtonRef}
              type="button"
              className="lg:hidden flex h-9 w-9 items-center justify-center border-2 border-white bg-[var(--pop-black)] text-white shadow-[2px_2px_0_var(--pop-red)]"
              aria-expanded={mobileOpen}
              aria-controls="player-mobile-navigation"
              aria-label={language === 'en' ? 'Open navigation' : 'Mở điều hướng'}
              onClick={() => setMobileOpen((open) => !open)}
            >
              <span className="material-symbols-outlined text-xl" aria-hidden="true">{mobileOpen ? 'close' : 'menu'}</span>
            </button>
          )}
          
          {/* Admin badge if role is admin */}
          {isLoggedIn && isAdmin && (
            <button
              onClick={() => setPage('Admin')}
              className="bg-[var(--pop-amber)] text-[var(--pop-black)] pop-border-2 px-2 sm:px-3 py-1 font-bold uppercase tracking-wider transform -rotate-2 hover:scale-105 active:scale-95 transition-all"
              style={{ boxShadow: '2px 2px 0 var(--pop-red)' }}
            >
              Quản Lý
            </button>
          )}

          {/* Brutalist Language Switcher */}
          <button
            style={langBtnStyle}
            className="font-pop-accent font-bold px-2 sm:px-3 py-1.5 transition-all duration-150 cursor-pointer uppercase"
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
              className="font-pop-accent font-bold px-2 sm:px-4 py-1.5 transition-all duration-150 cursor-pointer uppercase"
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
      {mobileOpen && !isAdmin && (
        <div
          id="player-mobile-navigation"
          className="lg:hidden absolute left-2 right-2 top-[calc(100%+2px)] grid grid-cols-2 gap-2 border-3 border-[var(--pop-black)] bg-[var(--pop-cream)] p-3 shadow-[5px_5px_0_var(--pop-black)] font-pop-accent"
          aria-label={language === 'en' ? 'Player navigation' : 'Điều hướng người chơi'}
        >
          {navigationItems.map(({ page: targetPage, label, Icon }) => {
            const active = page === targetPage;
            return (
              <button
                key={targetPage}
                type="button"
                onClick={() => navigateTo(targetPage)}
                aria-current={active ? 'page' : undefined}
                className={`flex min-h-11 items-center gap-2 border-2 border-[var(--pop-black)] px-3 py-2 text-left text-[10px] font-black uppercase shadow-[2px_2px_0_var(--pop-black)] ${active ? 'bg-[var(--pop-red)] text-white' : 'bg-white text-[var(--pop-black)]'}`}
              >
                <Icon size={13} aria-hidden="true" />
                {label}
              </button>
            );
          })}
        </div>
      )}
    </nav>
  );
}
