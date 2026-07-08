import React from 'react';
import { useGameContext } from '../GameContext.jsx';
import LegacyCreateRoomModal from './LegacyCreateRoomModal.jsx';
import LobbyModeCards from './LobbyModeCards.jsx';
import PublicRoomList from './PublicRoomList.jsx';

export default function LobbyHomeView() {
  const {
    CoinIcon,
    GemIcon,
    errorToast,
    handleDailyReward,
    isDailyRewardClaimed,
    language,
    userProfile,
  } = useGameContext();

  return (
    <div className="w-full max-w-5xl mx-auto my-6 flex flex-col gap-6 animate-fade-in">
      {errorToast}

      {/* Header with Coins, Gems and Daily Reward */}
      <div className="flex justify-end items-center gap-4 flex-wrap">
        <button
          onClick={handleDailyReward}
          disabled={isDailyRewardClaimed}
          className={`btn-retro-pixel px-4 py-1.5 flex items-center gap-2 text-xs font-headline font-black transition-all uppercase
            ${isDailyRewardClaimed
              ? 'bg-neutral-200 text-neutral-400 border-neutral-400 shadow-none cursor-not-allowed translate-y-[3px]'
              : 'bg-[var(--pop-red)] hover:bg-[#e64a19] text-white animate-bounce-short shadow-[3px_3px_0px_0px_#1a1c1c]'
            }`}
          title={isDailyRewardClaimed ? 'Already claimed today' : 'Claim Daily Reward'}
        >
          <span className="material-symbols-outlined text-[16px]">
            {isDailyRewardClaimed ? 'check_circle' : 'featured_seasonal'}
          </span>
          <span>
            {isDailyRewardClaimed
              ? (language === 'vi' ? 'ĐÃ NHẬN QUÀ' : 'CLAIMED')
              : (language === 'vi' ? 'NHẬN QUÀ HÀNG NGÀY' : 'DAILY REWARD')}
          </span>
        </button>

        <div className="bg-white border-2 border-[var(--pop-black)] px-3 py-1.5 rounded-xl flex items-center gap-2 shadow-[2.5px_2.5px_0px_0px_#1a1c1c] text-xs font-headline font-black text-on-surface cursor-help relative group transition-all hover:translate-y-[-1px] hover:shadow-[3.5px_3.5px_0px_0px_#1a1c1c]">
          <CoinIcon className="w-4 h-4" />
          <span>{userProfile?.coins?.toLocaleString() ?? 0}</span>
          <div className="hidden group-hover:block absolute top-[110%] right-0 bg-[var(--pop-black)] text-white text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 rounded-md border-2 border-white shadow-[2px_2px_0_var(--pop-black)] w-max z-50 pointer-events-none">
            {language === 'vi' ? 'Tiền vàng dùng để đặt cược khi vào trận' : 'Gold coins used for match bidding'}
          </div>
        </div>

        <div className="bg-white border-2 border-[var(--pop-black)] px-3 py-1.5 rounded-xl flex items-center gap-2 shadow-[2.5px_2.5px_0px_0px_#1a1c1c] text-xs font-headline font-black text-on-surface cursor-help relative group transition-all hover:translate-y-[-1px] hover:shadow-[3.5px_3.5px_0px_0px_#1a1c1c]">
          <GemIcon className="w-4 h-4" />
          <span>{userProfile?.gems?.toLocaleString() ?? 0}</span>
          <div className="hidden group-hover:block absolute top-[110%] right-0 bg-[var(--pop-black)] text-white text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 rounded-md border-2 border-white shadow-[2px_2px_0_var(--pop-black)] w-max z-50 pointer-events-none">
            {language === 'vi' ? 'Xu hồng dùng để mua sắm trong Cửa hàng' : 'Pink coins used for Shop purchases'}
          </div>
        </div>
      </div>

      {/* Title Section (Lobby Hero Banner) */}
      <div className="relative flex flex-col items-center md:items-start p-6 bg-[var(--surface-dim)] border-3 border-[#1a1c1c] rounded-2xl shadow-[4px_4px_0_#1a1c1c] overflow-hidden mb-2 mt-2">
        <div className="absolute inset-0 bg-retro-grid opacity-20 pointer-events-none" />
        <div className="pixel-sparkle sparkle-1">*</div>
        <div className="pixel-sparkle sparkle-2">*</div>
        <div className="pixel-sparkle sparkle-3">!</div>

        <div className="relative z-10">
          <h1
            className="font-headline font-black text-4xl md:text-5xl text-on-surface uppercase tracking-tight relative select-none leading-none py-1 animate-pulse-slow"
            style={{
              WebkitTextStroke: '2px #1a1c1c',
              textShadow: '4px 4px 0px #ff5722'
            }}
          >
            CHOOSE YOUR CHAOS
          </h1>
          <p className="mt-2 text-xs font-pop-accent font-black uppercase text-[var(--pop-black)]/70 tracking-wider">
            {language === 'vi'
              ? 'Chọn chế độ chơi và thể hiện trình độ của bạn!'
              : 'Choose your game mode and dominate the board!'}
          </p>
        </div>
      </div>

      <LobbyModeCards />
      <PublicRoomList />
      <LegacyCreateRoomModal />
    </div>
  );
}
