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
    <div className="w-full max-w-5xl mx-auto my-4 sm:my-6 flex flex-col gap-5 sm:gap-6 animate-fadeIn text-left">
      {errorToast}

      {/* Header Action Bar: Daily Reward Claim Button */}
      <div className="flex justify-end items-center gap-3">
        <button
          type="button"
          onClick={handleDailyReward}
          disabled={isDailyRewardClaimed}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-pop-accent font-black uppercase tracking-wider transition-all border-2 border-[var(--pop-black)] ${
            isDailyRewardClaimed
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

      {/* Title Section (Lobby Hero Banner) */}
      <div className="relative flex flex-col items-center md:items-start p-6 sm:p-7 bg-white border-3 border-[var(--pop-black)] shadow-[5px_5px_0_var(--pop-black)] overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(#FAC775_1px,transparent_1px)] [background-size:12px_12px] opacity-40 pointer-events-none" />

        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-block px-2.5 py-0.5 bg-[var(--pop-amber)] text-[var(--pop-black)] border-2 border-[var(--pop-black)] font-pop-accent font-black text-[10px] sm:text-xs uppercase shadow-[2px_2px_0_var(--pop-black)]">
              {language === 'vi' ? 'SẢNH CHỜ ĐẤU TRƯỜNG' : 'ARENA LOBBY'}
            </span>
          </div>

          <h1
            className="font-pop-display font-black text-3xl sm:text-5xl text-[var(--pop-black)] uppercase tracking-tight relative select-none leading-none py-1"
            style={{
              textShadow: '3px 3px 0px var(--pop-red)',
            }}
          >
            CHOOSE YOUR CHAOS
          </h1>
          <p className="mt-2 text-xs sm:text-sm font-pop-accent font-bold uppercase text-[var(--pop-black)]/80 tracking-wider">
            {language === 'vi'
              ? 'Chọn chế độ chơi và thống trị bàn đấu cùng bạn bè!'
              : 'Choose your game mode and dominate the board!'}
          </p>
        </div>
      </div>

      {/* Mode Selection Cards */}
      <LobbyModeCards />

      {/* Active Rooms Table */}
      <PublicRoomList />

      {/* Create Room Modal */}
      <LegacyCreateRoomModal />
    </div>
  );
}
