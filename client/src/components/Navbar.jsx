import React, { useState, useEffect, useRef } from 'react';
import { useLanguage } from '../context/LanguageContext.jsx';
import {
  PixelHomeIcon,
  PixelPlayIcon,
  PixelProfileIcon,
  PixelFriendsIcon,
  PixelLeaderboardIcon,
  PixelShopIcon,
  PixelStarIcon,
  PixelTrophyIcon,
  PixelWardrobeIcon,
} from './PixelIcons.jsx';
import { CoinIcon } from './CoinDisplay.jsx';
import { isAdminRole } from '../utils/adminRoles.js';

const PRESET_AVATARS = {
  angry_kitten: '😿',
  crown_kitten: '👑',
  space_kitten: '🚀',
  bomb_kitten: '💣',
  sleepy_kitten: '😴',
  cool_kitten: '😎',
};

/**
 * Navbar component for Exploding Kittens (Pop Art & Neo-Brutalism).
 * Features structured 3-zone architecture:
 * 1. Brand Logo (Left)
 * 2. Core Game Loop Navigation (Center)
 * 3. User Economy, Profile Capsule & Dropdown Hub (Right)
 */
export default function Navbar({ page, setPage, isLoggedIn, userRole, handleLogout }) {
  const { language, setLanguage, t } = useLanguage();
  const isAdmin = isAdminRole(userRole);

  // User Profile state for Coins, Avatar, Rank & Stats
  const [userProfile, setUserProfile] = useState(null);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Button hover & active states for tactile mechanical feedback
  const [langHover, setLangHover] = useState(false);
  const [langActive, setLangActive] = useState(false);
  const [authHover, setAuthHover] = useState(false);
  const [authActive, setAuthActive] = useState(false);
  const [regHover, setRegHover] = useState(false);
  const [regActive, setRegActive] = useState(false);

  const mobileMenuButtonRef = useRef(null);
  const userMenuRef = useRef(null);

  const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:5000';

  // Fetch User profile to keep coins and stats in sync
  const fetchUserProfile = async () => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      setUserProfile(null);
      return;
    }
    try {
      const res = await fetch(`${API_URL}/api/users/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setUserProfile(data);
      }
    } catch (e) {
      console.error('Navbar: Error fetching user profile:', e);
    }
  };

  useEffect(() => {
    if (isLoggedIn) {
      fetchUserProfile();
      const interval = setInterval(fetchUserProfile, 6000);
      return () => clearInterval(interval);
    } else {
      setUserProfile(null);
    }
  }, [isLoggedIn]);

  useEffect(() => {
    const handleSync = () => {
      if (localStorage.getItem('accessToken')) {
        fetchUserProfile();
      } else {
        setUserProfile(null);
      }
    };

    window.addEventListener('auth:changed', handleSync);
    window.addEventListener('balance:updated', handleSync);
    window.addEventListener('storage', handleSync);

    return () => {
      window.removeEventListener('auth:changed', handleSync);
      window.removeEventListener('balance:updated', handleSync);
      window.removeEventListener('storage', handleSync);
    };
  }, []);

  // Click outside listener for User Menu
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setUserMenuOpen(false);
      }
    };
    if (userMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [userMenuOpen]);

  // Smooth scroll to home top or specific elements
  const scrollToSection = (id) => {
    if (isAdmin) {
      setPage('Admin');
      return;
    }
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

  const navigateTo = (targetPage) => {
    setMobileOpen(false);
    setUserMenuOpen(false);
    if (isAdmin) {
      setPage('Admin');
      return;
    }
    if (targetPage === 'Home') scrollToSection('hero');
    else setPage(targetPage);
  };

  // Full registry of navigation items (Required for test suites)
  const navigationItems = [
    { page: 'Home', label: t('home'), Icon: PixelHomeIcon, isCore: true },
    { page: 'Game', label: t('arena'), Icon: PixelPlayIcon, isCore: true },
    { page: 'Tournaments', label: language === 'en' ? 'Tournament' : 'Giải Đấu', Icon: PixelTrophyIcon, isCore: true },
    { page: 'Leaderboard', label: language === 'en' ? 'Top 20' : 'Xếp Hạng', Icon: PixelLeaderboardIcon, isCore: true },
    { page: 'Shop', label: t('shop'), Icon: PixelShopIcon, isCore: true },
    { page: 'Mission', label: t('mission'), Icon: PixelStarIcon, isCore: false },
    { page: 'Wardrobe', label: t('wardrobe'), Icon: PixelWardrobeIcon, authenticated: true, isCore: false },
    { page: 'Friends', label: language === 'en' ? 'Friends' : 'Bạn Bè', Icon: PixelFriendsIcon, authenticated: true, isCore: false },
    { page: 'Profile', label: t('profile'), Icon: PixelProfileIcon, authenticated: true, isCore: false },
  ].filter((item) => !item.authenticated || isLoggedIn);

  // Core navigation tabs displayed horizontally in the center
  const coreNavItems = navigationItems.filter((item) => item.isCore);

  // Language button style
  const langBtnStyle = {
    backgroundColor: '#FFFFFF',
    color: 'var(--pop-black)',
    border: '2px solid var(--pop-black)',
    boxShadow: langActive
      ? '0px 0px 0 transparent'
      : langHover
        ? '3px 3px 0 var(--pop-red)'
        : '2px 2px 0 var(--pop-red)',
    transform: langActive
      ? 'translate(2px, 2px)'
      : langHover
        ? 'translate(-1px, -1px)'
        : 'translate(0, 0)',
  };

  // Auth button style
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
          ? '3px 3px 0 ' + shadowColor
          : '2px 2px 0 ' + shadowColor,
      transform: isActive
        ? 'translate(2px, 2px)'
        : isHovered
          ? 'translate(-1px, -1px)'
          : 'translate(0, 0)',
    };
  };

  // Render User Avatar
  const renderAvatarContent = (sizeClass = 'w-6 h-6 text-sm') => {
    const av = userProfile?.avatar;
    if (av && PRESET_AVATARS[av]) {
      return <span>{PRESET_AVATARS[av]}</span>;
    }
    if (av && (av.startsWith('http') || av.startsWith('/'))) {
      return <img src={av} alt="Avatar" className="w-full h-full object-cover rounded-full" />;
    }
    const initials = userProfile?.username ? userProfile.username.slice(0, 2).toUpperCase() : '🐱';
    return <span>{initials}</span>;
  };

  // Admin view topbar
  if (page === 'Admin') {
    return (
      <nav className="admin-topbar sticky top-0 z-40 w-full border-b border-[var(--admin-border)] bg-[var(--admin-surface)]/95 backdrop-blur-sm" aria-label={language === 'en' ? 'Admin account' : 'Tài khoản quản trị'}>
        <div className="mx-auto flex min-h-14 w-full max-w-[1600px] items-center justify-between gap-4 px-4 md:px-6 lg:px-8">
          <button
            type="button"
            onClick={() => setPage('Admin')}
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
      className="sticky top-0 w-full h-[64px] bg-[var(--pop-black)] border-b-2 border-white/10 z-50 select-none shadow-[0_4px_12px_rgba(0,0,0,0.5)]"
      onKeyDown={(event) => {
        if (event.key === 'Escape') {
          if (userMenuOpen) setUserMenuOpen(false);
          if (mobileOpen) {
            setMobileOpen(false);
            mobileMenuButtonRef.current?.focus();
          }
        }
      }}
    >
      <div className="max-w-7xl mx-auto h-full px-3 sm:px-4 md:px-8 flex justify-between items-center gap-2 md:gap-4">

        {/* ========================================================= */}
        {/* ZONE 1: BRAND LOGO */}
        {/* ========================================================= */}
        <div
          onClick={() => scrollToSection('hero')}
          className="flex items-center gap-2.5 cursor-pointer shrink-0 group transition-transform active:scale-95"
        >
          {/* Red diamond */}
          <div className="w-[16px] h-[16px] bg-[var(--pop-red)] rotate-45 pop-border-2 border-white shadow-[2px_2px_0_#fff] group-hover:rotate-90 transition-transform duration-300" />

          <span className="font-pop-display text-lg md:text-[22px] tracking-tight uppercase">
            <span className="text-white font-black">Mèo</span>
            <span className="text-[var(--pop-red)] font-black ml-1">Nổ</span>
          </span>
        </div>

        {/* ========================================================= */}
        {/* ZONE 2: CORE NAVIGATION LINKS (Whitespace-Nowrap & Clean) */}
        {/* ========================================================= */}
        <div className="hidden lg:flex items-center gap-1 xl:gap-2 font-pop-body text-xs font-bold">
          {!isAdmin && coreNavItems.map(({ page: targetPage, label, Icon }) => {
            const active = page === targetPage;
            return (
              <button
                key={targetPage}
                type="button"
                onClick={() => navigateTo(targetPage)}
                className={`flex items-center gap-1.5 uppercase tracking-wider transition-all duration-150 px-3 py-1.5 cursor-pointer whitespace-nowrap rounded-sm ${
                  active
                    ? 'text-white bg-white/10 border-b-3 border-[var(--pop-red)] font-black shadow-[inset_0_-2px_0_var(--pop-red)] translate-y-[-1px]'
                    : 'text-[#999] border-b-3 border-transparent hover:text-white hover:bg-white/5'
                }`}
              >
                <Icon size={13} className={active ? 'text-[var(--pop-red)]' : 'text-neutral-400'} />
                <span>{label}</span>
              </button>
            );
          })}

          {isLoggedIn && isAdmin && (
            <button
              onClick={() => setPage('Admin')}
              className={`flex items-center gap-1.5 uppercase tracking-wider transition-all duration-200 border-b-2 py-1 px-3 cursor-pointer font-black rounded-sm whitespace-nowrap
                ${page === 'Admin'
                  ? 'text-[var(--pop-amber)] border-[var(--pop-amber)] translate-y-[-1px]'
                  : 'text-[var(--pop-amber)] border-transparent hover:text-white hover:border-[var(--pop-amber)]'}`}
            >
              <span className="animate-pulse">🛠️</span>
              {language === 'en' ? 'Admin' : 'Quản Lý'}
            </button>
          )}
        </div>

        {/* ========================================================= */}
        {/* ZONE 3: USER ECONOMY, CAPSULE & ACTION HUB */}
        {/* ========================================================= */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0 font-pop-accent text-xs">

          {/* Mobile Hamburger Button */}
          {!isAdmin && (
            <button
              ref={mobileMenuButtonRef}
              type="button"
              className="lg:hidden flex h-9 w-9 items-center justify-center border-2 border-white bg-[var(--pop-black)] text-white shadow-[2px_2px_0_var(--pop-red)] active:translate-y-0.5"
              aria-expanded={mobileOpen}
              aria-controls="player-mobile-navigation"
              aria-label={language === 'en' ? 'Open navigation' : 'Mở điều hướng'}
              onClick={() => setMobileOpen((open) => !open)}
            >
              <span className="material-symbols-outlined text-xl" aria-hidden="true">{mobileOpen ? 'close' : 'menu'}</span>
            </button>
          )}

          {/* COIN BALANCE PILL (When logged in as player) */}
          {isLoggedIn && !isAdmin && (
            <button
              type="button"
              onClick={() => setPage('Shop')}
              className="flex items-center gap-1.5 bg-[#1a1829] border-2 border-[var(--pop-amber)] px-2.5 sm:px-3 py-1 text-white font-pop-accent font-bold shadow-[2px_2px_0_var(--pop-amber)] hover:bg-[#26223d] hover:scale-105 active:scale-95 transition-all cursor-pointer"
              title={language === 'en' ? 'Click to visit Shop' : 'Bấm để vào Cửa Hàng'}
            >
              <CoinIcon className="w-4 h-4" />
              <span className="text-[var(--pop-amber)] font-black text-xs sm:text-sm tracking-tight">
                {userProfile?.coins !== undefined ? userProfile.coins.toLocaleString() : '...'}
              </span>
              <span className="text-[10px] text-white/70 uppercase hidden sm:inline">Xu</span>
            </button>
          )}

          {/* USER PROFILE CAPSULE & DROPDOWN (When Logged in) */}
          {isLoggedIn ? (
            <div className="relative" ref={userMenuRef}>
              <button
                type="button"
                onClick={() => setUserMenuOpen((prev) => !prev)}
                className={`flex items-center gap-2 bg-white text-[var(--pop-black)] border-2 border-[var(--pop-black)] px-2 sm:px-3 py-1 font-pop-accent font-black transition-all cursor-pointer ${
                  userMenuOpen
                    ? 'shadow-[0_0_0_transparent] translate-x-[2px] translate-y-[2px] bg-[var(--pop-cream)]'
                    : 'shadow-[2px_2px_0_var(--pop-red)] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[3px_3px_0_var(--pop-red)]'
                }`}
                aria-expanded={userMenuOpen}
                aria-haspopup="true"
              >
                {/* Avatar Badge */}
                <div className="w-5 h-5 rounded-full bg-[var(--pop-amber)] border border-[var(--pop-black)] flex items-center justify-center text-xs overflow-hidden shrink-0">
                  {renderAvatarContent()}
                </div>

                {/* Username */}
                <span className="max-w-[80px] sm:max-w-[120px] truncate text-xs font-black uppercase tracking-tight">
                  {userProfile?.username || 'Người chơi'}
                </span>

                {/* Chevron */}
                <span className={`text-[10px] transition-transform duration-200 ${userMenuOpen ? 'rotate-180 text-[var(--pop-red)]' : 'text-neutral-600'}`}>
                  ▼
                </span>
              </button>

              {/* POP-ART USER DROPDOWN CARD */}
              {userMenuOpen && (
                <div
                  className="absolute right-0 top-[calc(100%+8px)] w-72 sm:w-80 border-3 border-[var(--pop-black)] bg-[var(--pop-cream)] p-4 shadow-[6px_6px_0_var(--pop-black)] z-50 font-pop-body animate-fadeIn"
                  role="menu"
                  aria-label="User profile menu"
                >
                  {/* Player Summary Header Card */}
                  <div className="flex items-center gap-3 bg-white border-2 border-[var(--pop-black)] p-3 shadow-[3px_3px_0_var(--pop-black)] mb-3">
                    <div className="w-12 h-12 rounded-lg bg-[var(--pop-amber)] border-2 border-[var(--pop-black)] flex items-center justify-center text-2xl shadow-[2px_2px_0_var(--pop-black)] shrink-0 overflow-hidden">
                      {renderAvatarContent('w-10 h-10')}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-pop-display text-sm font-black uppercase text-[var(--pop-black)] truncate">
                        {userProfile?.username || 'Người chơi'}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5 text-[11px] font-bold text-neutral-600">
                        <span className="bg-[var(--pop-amber)]/30 text-[var(--pop-black)] px-1.5 py-0.5 rounded border border-[var(--pop-black)]/20 text-[10px] uppercase">
                          {userProfile?.rank || 'Bronze I'}
                        </span>
                        <span>{userProfile?.stats?.wins || 0}W - {userProfile?.stats?.losses || 0}L</span>
                      </div>
                    </div>
                  </div>

                  {/* Quick User Navigation Links */}
                  <div className="grid grid-cols-1 gap-1.5 mb-3 font-pop-accent text-xs">
                    {isAdmin ? (
                      <button
                        type="button"
                        onClick={() => navigateTo('Admin')}
                        className="flex items-center gap-2.5 w-full p-2 border-2 text-left font-bold uppercase transition-all bg-[var(--pop-amber)] text-[var(--pop-black)] border-[var(--pop-black)] shadow-[2px_2px_0_var(--pop-black)]"
                      >
                        <span>🛠️</span>
                        <span>{language === 'en' ? 'Admin Panel' : 'Trang Quản Trị'}</span>
                      </button>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={() => navigateTo('Profile')}
                          className={`flex items-center gap-2.5 w-full p-2 border-2 text-left font-bold uppercase transition-all ${
                            page === 'Profile'
                              ? 'bg-[var(--pop-red)] text-white border-[var(--pop-black)] shadow-[2px_2px_0_var(--pop-black)]'
                              : 'bg-white text-[var(--pop-black)] border-[var(--pop-black)] shadow-[2px_2px_0_var(--pop-black)] hover:bg-[var(--pop-amber)] hover:translate-x-0.5'
                          }`}
                        >
                          <PixelProfileIcon size={14} />
                          <span>{t('profile')}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => navigateTo('Wardrobe')}
                          className={`flex items-center gap-2.5 w-full p-2 border-2 text-left font-bold uppercase transition-all ${
                            page === 'Wardrobe'
                              ? 'bg-[var(--pop-red)] text-white border-[var(--pop-black)] shadow-[2px_2px_0_var(--pop-black)]'
                              : 'bg-white text-[var(--pop-black)] border-[var(--pop-black)] shadow-[2px_2px_0_var(--pop-black)] hover:bg-[var(--pop-amber)] hover:translate-x-0.5'
                          }`}
                        >
                          <PixelWardrobeIcon size={14} />
                          <span>{t('wardrobe')}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => navigateTo('Friends')}
                          className={`flex items-center gap-2.5 w-full p-2 border-2 text-left font-bold uppercase transition-all ${
                            page === 'Friends'
                              ? 'bg-[var(--pop-red)] text-white border-[var(--pop-black)] shadow-[2px_2px_0_var(--pop-black)]'
                              : 'bg-white text-[var(--pop-black)] border-[var(--pop-black)] shadow-[2px_2px_0_var(--pop-black)] hover:bg-[var(--pop-amber)] hover:translate-x-0.5'
                          }`}
                        >
                          <PixelFriendsIcon size={14} />
                          <span>{language === 'en' ? 'Friends' : 'Bạn Bè'}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => navigateTo('Mission')}
                          className={`flex items-center gap-2.5 w-full p-2 border-2 text-left font-bold uppercase transition-all ${
                            page === 'Mission'
                              ? 'bg-[var(--pop-red)] text-white border-[var(--pop-black)] shadow-[2px_2px_0_var(--pop-black)]'
                              : 'bg-white text-[var(--pop-black)] border-[var(--pop-black)] shadow-[2px_2px_0_var(--pop-black)] hover:bg-[var(--pop-amber)] hover:translate-x-0.5'
                          }`}
                        >
                          <PixelStarIcon size={14} />
                          <span>{t('mission')}</span>
                        </button>
                      </>
                    )}
                  </div>

                  {/* Separator */}
                  <div className="border-t-2 border-dashed border-[var(--pop-black)]/30 my-2.5" />

                  {/* Logout Button */}
                  <button
                    type="button"
                    style={getAuthBtnStyle(false)}
                    className="w-full font-pop-accent font-black py-2 px-3 text-center uppercase tracking-wider text-xs transition-all cursor-pointer"
                    onMouseEnter={() => setAuthHover(true)}
                    onMouseLeave={() => {
                      setAuthHover(false);
                      setAuthActive(false);
                    }}
                    onMouseDown={() => setAuthActive(true)}
                    onMouseUp={() => setAuthActive(false)}
                    onClick={() => {
                      setUserMenuOpen(false);
                      handleLogout();
                    }}
                  >
                    🚪 {t('logout')}
                  </button>
                </div>
              )}
            </div>
          ) : (
            /* Login / Register Buttons (When Not Logged In) */
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage('Login')}
                className="text-[#aaa] hover:text-white transition-colors duration-150 font-pop-body font-bold uppercase tracking-wider text-xs px-2 py-1"
              >
                {t('login')}
              </button>

              <button
                style={getAuthBtnStyle(true)}
                className="font-pop-accent font-bold px-3 py-1.5 transition-all duration-150 cursor-pointer uppercase text-xs"
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
            </div>
          )}

          {/* Brutalist Language Switcher */}
          <button
            style={langBtnStyle}
            className="font-pop-accent font-black px-2.5 sm:px-3 py-1.5 transition-all duration-150 cursor-pointer uppercase text-xs shrink-0"
            onMouseEnter={() => setLangHover(true)}
            onMouseLeave={() => {
              setLangHover(false);
              setLangActive(false);
            }}
            onMouseDown={() => setLangActive(true)}
            onMouseUp={() => setLangActive(false)}
            onClick={() => setLanguage(language === 'en' ? 'vi' : 'en')}
            aria-label={language === 'en' ? 'Switch to Vietnamese' : 'Chuyển sang tiếng Anh'}
          >
            {language === 'en' ? 'VI' : 'EN'}
          </button>
        </div>

      </div>

      {/* ========================================================= */}
      {/* MOBILE EXPANDED DRAWER MENU */}
      {/* ========================================================= */}
      {mobileOpen && !isAdmin && (
        <div
          id="player-mobile-navigation"
          className="lg:hidden absolute left-2 right-2 top-[calc(100%+4px)] border-3 border-[var(--pop-black)] bg-[var(--pop-cream)] p-4 shadow-[6px_6px_0_var(--pop-black)] font-pop-accent z-50 animate-fadeIn max-h-[85vh] overflow-y-auto"
          aria-label={language === 'en' ? 'Player navigation' : 'Điều hướng người chơi'}
        >
          {/* User profile summary header on mobile if logged in */}
          {isLoggedIn && (
            <div className="flex items-center justify-between gap-3 bg-white border-2 border-[var(--pop-black)] p-3 shadow-[3px_3px_0_var(--pop-black)] mb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-lg bg-[var(--pop-amber)] border-2 border-[var(--pop-black)] flex items-center justify-center text-xl shadow-[2px_2px_0_var(--pop-black)]">
                  {renderAvatarContent()}
                </div>
                <div>
                  <div className="font-pop-display text-sm font-black uppercase text-[var(--pop-black)]">
                    {userProfile?.username || 'Người chơi'}
                  </div>
                  <div className="text-[10px] text-neutral-600 font-bold uppercase">
                    {userProfile?.rank || 'Bronze I'}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1 bg-[#1a1829] border border-[var(--pop-amber)] px-2 py-1 rounded text-white font-bold text-xs">
                <CoinIcon className="w-3.5 h-3.5" />
                <span className="text-[var(--pop-amber)] font-black">{userProfile?.coins?.toLocaleString() ?? 0}</span>
              </div>
            </div>
          )}

          {/* Navigation Items Grid */}
          <div className="text-[10px] font-black uppercase text-neutral-500 mb-1 tracking-wider">
            {language === 'en' ? 'Navigation' : 'Điều hướng'}
          </div>
          <div className="grid grid-cols-2 gap-2 mb-3">
            {navigationItems.map(({ page: targetPage, label, Icon }) => {
              const active = page === targetPage;
              return (
                <button
                  key={targetPage}
                  type="button"
                  onClick={() => navigateTo(targetPage)}
                  aria-current={active ? 'page' : undefined}
                  className={`flex min-h-11 items-center gap-2 border-2 border-[var(--pop-black)] px-3 py-2 text-left text-[11px] font-black uppercase shadow-[2px_2px_0_var(--pop-black)] active:translate-y-0.5 transition-all ${
                    active ? 'bg-[var(--pop-red)] text-white' : 'bg-white text-[var(--pop-black)] hover:bg-[var(--pop-amber)]'
                  }`}
                >
                  <Icon size={14} aria-hidden="true" />
                  <span className="truncate">{label}</span>
                </button>
              );
            })}
          </div>

          {/* Admin link if admin */}
          {isLoggedIn && isAdmin && (
            <button
              type="button"
              onClick={() => navigateTo('Admin')}
              className="w-full flex items-center justify-center gap-2 border-2 border-[var(--pop-black)] bg-[var(--pop-amber)] text-[var(--pop-black)] py-2 px-3 font-black uppercase text-xs shadow-[2px_2px_0_var(--pop-black)] mb-3"
            >
              <span>🛠️</span>
              <span>{language === 'en' ? 'Admin Panel' : 'Trang Quản Trị'}</span>
            </button>
          )}

          {/* Auth Button at bottom of mobile drawer */}
          {isLoggedIn ? (
            <button
              type="button"
              style={getAuthBtnStyle(false)}
              className="w-full font-pop-accent font-black py-2.5 px-3 text-center uppercase tracking-wider text-xs shadow-[2px_2px_0_var(--pop-black)]"
              onClick={() => {
                setMobileOpen(false);
                handleLogout();
              }}
            >
              🚪 {t('logout')}
            </button>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => navigateTo('Login')}
                className="w-full border-2 border-[var(--pop-black)] bg-white text-[var(--pop-black)] font-black py-2 text-center uppercase text-xs shadow-[2px_2px_0_var(--pop-black)]"
              >
                {t('login')}
              </button>
              <button
                type="button"
                onClick={() => navigateTo('Register')}
                className="w-full border-2 border-[var(--pop-black)] bg-[var(--pop-amber)] text-[var(--pop-black)] font-black py-2 text-center uppercase text-xs shadow-[2px_2px_0_var(--pop-black)]"
              >
                {t('register')}
              </button>
            </div>
          )}
        </div>
      )}
    </nav>
  );
}
