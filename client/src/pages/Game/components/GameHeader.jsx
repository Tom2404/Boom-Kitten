import React from 'react';
import { useGameContext } from '../GameContext.jsx';

export default function GameHeader() {
  const context = useGameContext();
  const {
    GearIcon,
    HelpIcon,
    ImageButton,
    SoundIcon,
    handleLeaveConfirm,
    hasUnreadMessages,
    isSidebarOpen,
    connectionState,
    roomState,
    setIsSidebarOpen,
    setRightPanelTab,
    t,
  } = context;

  const connectionLabel = connectionState === 'connected'
    ? 'Đã kết nối'
    : connectionState === 'error'
      ? 'Mất kết nối'
      : 'Đang kết nối lại';

  return (
    <>
{/* Top Header Bar matching Pop Art */}
<header className="relative z-20 flex min-w-0 items-center justify-between gap-3 border-4 border-[var(--pop-black)] bg-[var(--pop-cream)] px-3 py-2.5 shadow-[4px_4px_0_var(--pop-black)] md:px-5 md:py-3 md:shadow-[6px_6px_0_var(--pop-black)]">
  {/* Left: Title & Room ID */}
  <div className="flex min-w-0 items-center gap-2 md:gap-4">
    <h1 className="truncate font-pop-display text-lg italic font-black uppercase tracking-tight text-[var(--pop-red)] sm:text-2xl md:text-3xl"
        style={{ WebkitTextStroke: '2px var(--pop-black)', textShadow: '3px 3px 0px var(--pop-black)' }}>
      ĐẤU TRƯỜNG
    </h1>
    <div className="h-6 w-1 bg-[var(--pop-black)]/20 rounded-none hidden sm:block" />
    <span className="font-pop-accent font-black text-lg text-[var(--pop-black)]/40 uppercase tracking-widest hidden sm:block">
      _{roomState.code.slice(0, 3)}
    </span>
    <span className="text-[9px] font-pop-accent font-black bg-[var(--pop-cream)] border-2 border-[var(--pop-black)] text-[var(--pop-black)] px-2 py-0.5 rounded-none shadow-[1.5px_1.5px_0_var(--pop-black)] uppercase tracking-wide">
      {t('edition_' + roomState.edition + '_name') || roomState.edition}
    </span>
  </div>

  {/* Right: Header Buttons & Toggle */}
  <div className="flex flex-shrink-0 items-center gap-1.5 md:gap-2">
    <span className={`hidden border-2 border-[var(--pop-black)] px-2 py-1 font-pop-accent text-[9px] font-black uppercase sm:inline ${connectionState === 'connected' ? 'bg-emerald-100 text-emerald-900' : connectionState === 'error' ? 'bg-red-100 text-red-900' : 'bg-[var(--pop-amber)] text-[var(--pop-black)]'}`} role="status">
      {connectionLabel}
    </span>
    <div className="hidden md:flex items-center gap-2 bg-[var(--pop-amber)] text-[var(--pop-black)] font-pop-display font-black text-xs px-3.5 py-1.5 rounded-none border-2 border-[var(--pop-black)] shadow-[2px_2px_0_var(--pop-black)]">
      <span>ROOM: {roomState.code}</span>
    </div>

    <button
      onClick={() => {
        setIsSidebarOpen(prev => !prev);
        if (!isSidebarOpen) {
          setRightPanelTab('chat');
        }
      }}
      aria-expanded={isSidebarOpen}
      aria-controls="game-side-panel"
      aria-label={isSidebarOpen ? 'Ẩn chat và lịch sử' : 'Mở chat và lịch sử'}
      className={`relative min-h-9 border-2 border-[var(--pop-black)] px-2.5 py-1.5 font-pop-accent text-[10px] font-black uppercase shadow-[2px_2px_0_var(--pop-black)] transition-all active:translate-y-0.5 active:shadow-none md:px-3.5 md:text-xs ${
        hasUnreadMessages && !isSidebarOpen
          ? 'bg-[var(--pop-red)] text-white shadow-[2px_2px_0_var(--pop-black)]'
          : 'bg-white text-[var(--pop-black)] hover:bg-[var(--pop-cream)]'
      }`}
    >
      <span className="hidden sm:inline">{isSidebarOpen ? 'Ẩn Chat' : 'Hiện Chat'}</span>
      <span className="sm:hidden">Chat</span>
      {hasUnreadMessages && !isSidebarOpen && (
        <span className="absolute -top-1 -right-1 flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-none bg-[var(--pop-amber)] opacity-75 border-2 border-[var(--pop-black)]"></span>
          <span className="relative inline-flex rounded-none h-3 w-3 bg-[var(--pop-amber)] border-2 border-[var(--pop-black)]"></span>
        </span>
      )}
    </button>

    <button disabled aria-label="Cài đặt, sắp ra mắt" className="hidden p-1.5 border-2 border-[var(--pop-black)] bg-white text-[var(--pop-black)] opacity-45 shadow-[2px_2px_0_var(--pop-black)] md:block" title="Cài đặt, sắp ra mắt">
      <GearIcon className="w-5 h-5" />
    </button>
    <button disabled aria-label="Hướng dẫn, sắp ra mắt" className="hidden p-1.5 border-2 border-[var(--pop-black)] bg-white text-[var(--pop-black)] opacity-45 shadow-[2px_2px_0_var(--pop-black)] md:block" title="Hướng dẫn, sắp ra mắt">
      <HelpIcon className="w-5 h-5" />
    </button>
    <button disabled aria-label="Âm thanh, sắp ra mắt" className="hidden p-1.5 border-2 border-[var(--pop-black)] bg-white text-[var(--pop-black)] opacity-45 shadow-[2px_2px_0_var(--pop-black)] md:block" title="Âm thanh, sắp ra mắt">
      <SoundIcon className="w-5 h-5" />
    </button>

    <ImageButton
      variant="quit"
      size="md"
      onClick={handleLeaveConfirm}
      className="px-2.5 py-1.5 uppercase md:px-3.5"
    >
      Thoát
    </ImageButton>
  </div>
</header>
    </>
  );
}
