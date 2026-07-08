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
    roomState,
    setIsSidebarOpen,
    setRightPanelTab,
    t,
  } = context;

  return (
    <>
{/* Top Header Bar matching Pop Art */}
<div className="flex justify-between items-center bg-[var(--pop-cream)] border-4 border-[var(--pop-black)] rounded-none px-6 py-3 shadow-[6px_6px_0_var(--pop-black)] z-20">
  {/* Left: Title & Room ID */}
  <div className="flex items-center gap-3 md:gap-4 flex-wrap">
    <h1 className="font-pop-display text-2xl md:text-3xl italic font-black uppercase tracking-tight text-[var(--pop-red)]"
        style={{ WebkitTextStroke: '2px var(--pop-black)', textShadow: '3px 3px 0px var(--pop-black)' }}>
      ARENA BATTLE
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
  <div className="flex items-center gap-3">
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
      className={`relative font-pop-accent font-black border-2 border-[var(--pop-black)] shadow-[2px_2px_0_var(--pop-black)] px-3.5 py-1.5 rounded-none text-xs active:translate-y-0.5 active:shadow-none transition-all uppercase ${
        hasUnreadMessages && !isSidebarOpen
          ? 'bg-[var(--pop-red)] text-white shadow-[2px_2px_0_var(--pop-black)]'
          : 'bg-white text-[var(--pop-black)] hover:bg-[var(--pop-cream)]'
      }`}
    >
      {isSidebarOpen ? "Ẩn Chat" : "Hiện Chat"}
      {hasUnreadMessages && !isSidebarOpen && (
        <span className="absolute -top-1 -right-1 flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-none bg-[var(--pop-amber)] opacity-75 border-2 border-[var(--pop-black)]"></span>
          <span className="relative inline-flex rounded-none h-3 w-3 bg-[var(--pop-amber)] border-2 border-[var(--pop-black)]"></span>
        </span>
      )}
    </button>

    <button className="p-1.5 rounded-none border-2 border-[var(--pop-black)] bg-white shadow-[2px_2px_0_var(--pop-black)] hover:translate-y-[-1px] hover:shadow-[3px_3px_0_var(--pop-black)] active:translate-y-0.5 active:shadow-none transition-all text-[var(--pop-black)]" title="Cài đặt">
      <GearIcon className="w-5 h-5" />
    </button>
    <button className="p-1.5 rounded-none border-2 border-[var(--pop-black)] bg-white shadow-[2px_2px_0_var(--pop-black)] hover:translate-y-[-1px] hover:shadow-[3px_3px_0_var(--pop-black)] active:translate-y-0.5 active:shadow-none transition-all text-[var(--pop-black)]" title="Hướng dẫn">
      <HelpIcon className="w-5 h-5" />
    </button>
    <button className="p-1.5 rounded-none border-2 border-[var(--pop-black)] bg-white shadow-[2px_2px_0_var(--pop-black)] hover:translate-y-[-1px] hover:shadow-[3px_3px_0_var(--pop-black)] active:translate-y-0.5 active:shadow-none transition-all text-[var(--pop-black)]" title="Âm thanh">
      <SoundIcon className="w-5 h-5" />
    </button>

    <ImageButton
      variant="quit"
      size="md"
      onClick={handleLeaveConfirm}
      className="px-3.5 py-1.5 uppercase"
    >
      Thoát
    </ImageButton>
  </div>
</div>
    </>
  );
}
