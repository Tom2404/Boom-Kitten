import React from 'react';
import { useGameContext } from '../GameContext.jsx';
import LegacyCreateRoomModal from './LegacyCreateRoomModal.jsx';
import LobbyModeCards from './LobbyModeCards.jsx';
import PublicRoomList from './PublicRoomList.jsx';

export default function LobbyHomeView() {
  const {
    errorToast,
    handleDailyReward,
    isDailyRewardClaimed,
    language,
  } = useGameContext();

  return (
    <div className="vf-page w-full max-w-7xl mx-auto animate-fadeIn text-left">
      {/* Header: hero banner + daily reward merged into a single row block */}
      <div className="flex flex-col gap-3">
        {errorToast}

        {/* Title Section (Lobby Hero Banner) — one line, no long copy */}
        <div className="relative flex flex-wrap items-center justify-between gap-3 px-4 py-3 bg-white border-3 border-[var(--pop-black)] shadow-[5px_5px_0_var(--pop-black)] overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(#FAC775_1px,transparent_1px)] [background-size:12px_12px] opacity-40 pointer-events-none" />

          <h1
            className="vf-title relative z-10 font-pop-display font-black text-[var(--pop-black)] uppercase tracking-tight select-none"
            style={{ textShadow: '3px 3px 0px var(--pop-red)' }}
          >
            CHOOSE YOUR CHAOS
          </h1>

          <div className="relative z-10 flex items-center gap-3">
            <span className="inline-block px-2.5 py-0.5 bg-[var(--pop-amber)] text-[var(--pop-black)] border-2 border-[var(--pop-black)] font-pop-accent font-black text-[10px] sm:text-xs uppercase shadow-[2px_2px_0_var(--pop-black)]">
              {language === 'vi' ? 'SẢNH CHỜ ĐẤU TRƯỜNG' : 'ARENA LOBBY'}
            </span>
            <button
              type="button"
              onClick={handleDailyReward}
              disabled={isDailyRewardClaimed}
              className={`flex items-center gap-2 px-4 py-2 text-xs font-pop-accent font-black uppercase tracking-wider transition-all border-2 border-[var(--pop-black)] ${isDailyRewardClaimed
                ? 'bg-neutral-200 text-neutral-500 border-neutral-400 shadow-none cursor-not-allowed'
                : 'bg-[var(--pop-red)] text-white shadow-[3px_3px_0_var(--pop-black)] hover:bg-[#e03837] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[4px_4px_0_var(--pop-black)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0_var(--pop-black)] cursor-pointer'
                }`}
              title={isDailyRewardClaimed ? 'Already claimed today' : 'Claim Daily Reward'}
            >
              <span className="text-base" aria-hidden="true">
                {isDailyRewardClaimed ? '✅' : '🎁'}
              </span>
              <span>
                {isDailyRewardClaimed
                  ? (language === 'vi' ? 'ĐÃ ĐIỂM DANH HÔM NAY' : 'CLAIMED TODAY')
                  : (language === 'vi' ? 'NHẬN QUÀ ĐIỂM DANH' : 'CLAIM DAILY REWARD')}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Body: mode rail on the left, Active Games owns the remaining height */}
      <div className="vf-body vf-arena-body">
        <LobbyModeCards />
        <PublicRoomList />
      </div>

      {/* Create Room Modal */}
      <LegacyCreateRoomModal />
    </div>
  );
}
