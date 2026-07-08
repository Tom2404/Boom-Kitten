import React from 'react';
import { useGameContext } from '../GameContext.jsx';

export default function CreateRoomMobileLayout() {
  const props = useGameContext();
  const {
    CheckIcon,
    CoinIcon,
    EDITIONS_MAP,
    ExclusiveCard,
    ExtensionIcon,
    GemIcon,
    ImageButton,
    LockIcon,
    PixelBombIcon,
    PixelSkullIcon,
    PixelStarIcon,
    PlayModeCard,
    createPassword,
    createRoom,
    createRoomIcon,
    createRoomStep,
    detailFading,
    editionsList,
    getCardImageUrl,
    getEditionDetails,
    handleDailyReward,
    handleJoinRoomCode,
    handleQuickPlay,
    idRoomImg,
    isCreateModalOpen,
    isCreatingRoom,
    isDailyRewardClaimed,
    isEditionDropdownOpen,
    isQuickPlaySearching,
    joinRoom,
    language,
    lastClickedEdition,
    lobbyBetAmount,
    lobbyCustomDefuses,
    lobbyCustomExplodingKittens,
    lobbyEdition,
    lobbyMaxPlayers,
    pressedChip,
    publicRooms,
    quickplayIcon,
    renderEditionArtwork,
    roomInput,
    roomPrivacy,
    setCreatePassword,
    setCreateRoomStep,
    setDetailFading,
    setHoveredEdition,
    setIsCreateModalOpen,
    setIsCreatingRoom,
    setIsEditionDropdownOpen,
    setLastClickedEdition,
    setLobbyBetAmount,
    setLobbyCustomDefuses,
    setLobbyCustomExplodingKittens,
    setLobbyEdition,
    setLobbyMaxPlayers,
    setPressedChip,
    setRoomInput,
    setRoomPrivacy,
    setShowPasswordInput,
    setVisibleEdition,
    setVoiceChatEnabled,
    showPasswordInput,
    t,
    userProfile,
    visibleEdition,
    voiceChatEnabled,
  } = props;
const activeMeta = EDITIONS_MAP[lobbyEdition] || EDITIONS_MAP.original;
const activeDetails = getEditionDetails(lobbyEdition);
const prizePool = lobbyBetAmount * lobbyMaxPlayers;
const isAffordable = !userProfile?.coins || userProfile.coins >= lobbyBetAmount;

return (
  <div className="flex md:hidden flex-col gap-4 w-full">
    {/* 5-Step indicator on Mobile */}
    <div className="flex items-center justify-between border-b-4 border-[#1A1C1C] pb-3 mb-2">
      <div className="flex flex-wrap gap-1 w-full justify-between">
        {[1, 2, 3, 4, 5].map((step) => {
          const stepNames = {
            1: { vi: 'BẢN', en: 'EDITION' },
            2: { vi: 'PHÒNG', en: 'ROOM' },
            3: { vi: 'CƯỢC', en: 'BET' },
            4: { vi: 'DUYỆT', en: 'REVIEW' },
            5: { vi: 'TẠO', en: 'CREATE' }
          };
          const isCurrent = createRoomStep === step;
          const isCompleted = createRoomStep > step;
          return (
            <div
              key={step}
              className={`flex-1 text-center py-1.5 text-[8px] font-pixel-title border-2 border-[#1A1C1C] transition-colors
                ${isCurrent
                  ? 'bg-[#FFD54A] font-black text-[#1A1C1C]'
                  : isCompleted
                    ? 'bg-[#4CDE77] text-[#1A1C1C]'
                    : 'bg-white text-slate-400'
                }`}
            >
              {step}. {language === 'vi' ? stepNames[step].vi : stepNames[step].en}
            </div>
          );
        })}
      </div>
    </div>

    {/* STEP 1: CHOOSE EDITION */}
    {createRoomStep === 1 && (
      <div className="flex flex-col gap-4">
        <span className="font-pixel-title text-[9px] text-[#1A1C1C]/70 uppercase tracking-wider text-center">
          {t('choose_edition')}
        </span>
        <div className="flex flex-col gap-3">
          {editionsList.map((key) => {
            const isSelected = lobbyEdition === key;
            const details = getEditionDetails(key);
            const meta = EDITIONS_MAP[key] || EDITIONS_MAP.original;

            return (
              <button
                key={key}
                type="button"
                onClick={() => {
                  setLobbyEdition(key);
                  const maxLimit = key === '2_player' ? 2 : (key === 'imploding' ? 6 : 5);
                  if (lobbyMaxPlayers > maxLimit || key === '2_player') {
                    setLobbyMaxPlayers(maxLimit);
                  }
                }}
                className={`w-full p-4 rounded-none border-4 border-[#1A1C1C] text-left flex flex-col justify-between gap-2.5 h-32 cursor-pointer transition-all duration-150 relative overflow-hidden
                  ${isSelected
                    ? 'bg-[#FFD54A] text-[#1A1C1C] translate-y-0.5 shadow-none ring-3 ring-[#ff5722]'
                    : 'bg-white text-[#1A1C1C] shadow-[3px_3px_0_#1A1C1C]'
                  }`}
              >
                {isSelected && (
                  <div className="absolute top-0 right-0 bg-[#E63946] text-white border-b-3 border-l-3 border-[#1A1C1C] px-2 py-0.5 text-[8px] font-pixel-title uppercase z-20">
                    Active
                  </div>
                )}
                <div className="flex justify-between items-center w-full">
                  <div className="flex flex-col gap-1 pr-2">
                    <h3 className="font-pixel-title text-[9px] uppercase tracking-wider leading-none text-[#1A1C1C]">
                      {details.name}
                    </h3>
                    <span className="inline-block text-[7px] font-pixel-title bg-black/5 text-[#1A1C1C]/65 px-1 py-0.5 w-max">
                      {language === 'vi' ? meta.badge.vi : meta.badge.en}
                    </span>
                  </div>
                  <div>
                    {renderEditionArtwork(key, 28)}
                  </div>
                </div>
                <p className="text-[10px] font-bold leading-tight line-clamp-2 text-[#1A1C1C]/70">
                  {details.description}
                </p>
              </button>
            );
          })}
        </div>

        {/* Preview active showcase at bottom of step 1 */}
        <div className="bg-[#0f172a] text-white border-4 border-[#1A1C1C] p-4 text-left relative overflow-hidden mt-2">
          <div className="absolute inset-0 pixel-crt pixel-scanline pointer-events-none" />
          <span className="font-pixel-title text-[8px] text-[#86efac] block uppercase tracking-wider mb-2">
            {language === 'vi' ? 'LÁ BÀI & LUẬT MỚI' : 'CARDS & RULES PREVIEW'}
          </span>
          <div className="flex flex-wrap gap-1.5 mb-3">
            {activeMeta.rules[language].map((ruleText, idx) => (
              <span key={idx} className="bg-slate-900 border border-[#86efac] text-[#86efac] text-[8px] font-pixel-title px-1.5 py-0.5">
                ✓ {ruleText}
              </span>
            ))}
          </div>
          <div className="grid grid-cols-4 gap-2">
            {activeMeta.exclusiveCards.map((card, idx) => (
              <div key={idx} className="border border-white/20 aspect-[3/4] bg-slate-900 relative group overflow-hidden">
                <img src={getCardImageUrl(card.type, 0)} alt="" className="w-full h-full object-cover" />
              </div>
            ))}
          </div>
        </div>

        {/* Next button */}
        <button
          type="button"
          onClick={() => setCreateRoomStep(2)}
          className="w-full btn-retro-pixel py-3.5 bg-[#4CC9F0] text-slate-950 font-pixel-title text-[9px] uppercase tracking-widest shadow-[3px_3px_0_#1A1C1C]"
        >
          {language === 'vi' ? 'CÀI ĐẶT PHÒNG →' : 'ROOM SETTINGS →'}
        </button>
      </div>
    )}

    {/* STEP 2: CONFIGURE SETTINGS */}
    {createRoomStep === 2 && (
      <div className="flex flex-col gap-4 animate-fade-in">
        <div className="pixel-card p-5 flex flex-col gap-4 bg-white border-4 border-[#1A1C1C] shadow-[4px_4px_0_#1A1C1C] text-left">
          <div className="border-b-2 border-dashed border-[#1A1C1C]/15 pb-2">
            <span className="font-pixel-title text-[10px] text-white bg-[#1A1C1C] px-2 py-0.5">1. CONFIG ROOM</span>
          </div>

          {/* Player stepper */}
          <div className="flex justify-between items-center gap-2">
            <span className="font-pixel-title text-[9px] text-[#1A1C1C] uppercase tracking-wider">
              {t('max_players')}
            </span>
            {(() => {
              const minLimit = 2;
              const maxLimit = lobbyEdition === '2_player' ? 2 : (lobbyEdition === 'imploding' ? 6 : 5);
              const isLocked = minLimit === maxLimit;

              return (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={isLocked || lobbyMaxPlayers <= minLimit}
                    onClick={() => setLobbyMaxPlayers(p => Math.max(minLimit, p - 1))}
                    className="btn-retro-pixel w-8 h-8 bg-white text-[#1A1C1C] font-pixel-title text-sm flex items-center justify-center shadow-[1.5px_1.5px_0_#1A1C1C] disabled:opacity-40"
                  >
                    -
                  </button>
                  <div className="border-2 border-[#1A1C1C] bg-[#FFD54A] px-2.5 py-1 text-center font-pixel-title text-[9px] flex items-center justify-center h-8">
                    {lobbyMaxPlayers}
                  </div>
                  <button
                    type="button"
                    disabled={isLocked || lobbyMaxPlayers >= maxLimit}
                    onClick={() => setLobbyMaxPlayers(p => Math.min(maxLimit, p + 1))}
                    className="btn-retro-pixel w-8 h-8 bg-white text-[#1A1C1C] font-pixel-title text-sm flex items-center justify-center shadow-[1.5px_1.5px_0_#1A1C1C] disabled:opacity-40"
                  >
                    +
                  </button>
                </div>
              );
            })()}
          </div>

          {/* Room Visibility toggle */}
          <div className="flex flex-col gap-2">
            <span className="font-pixel-title text-[9px] text-[#1A1C1C] uppercase tracking-wider">
              {language === 'vi' ? 'Chế độ phòng' : 'Room Visibility'}
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setRoomPrivacy('public');
                  setCreatePassword('');
                }}
                className={`pixel-tab-button flex-1 text-center py-2 ${roomPrivacy === 'public' ? 'pixel-tab-button-active' : ''}`}
              >
                🌐 {language === 'vi' ? 'Công khai' : 'Public'}
              </button>
              <button
                type="button"
                onClick={() => setRoomPrivacy('private')}
                className={`pixel-tab-button flex-1 text-center py-2 ${roomPrivacy === 'private' ? 'pixel-tab-button-active' : ''}`}
              >
                🔒 {language === 'vi' ? 'Riêng tư' : 'Private'}
              </button>
            </div>
          </div>

          {/* Password field */}
          {roomPrivacy === 'private' && (
            <div className="flex flex-col gap-1.5 animate-fade-in">
              <span className="font-pixel-title text-[9px] text-[#1A1C1C] uppercase tracking-wider">
                {language === 'vi' ? 'Mật khẩu' : 'Password'}
              </span>
              <input
                type="password"
                placeholder={language === 'vi' ? 'Nhập mật khẩu' : 'Enter password'}
                value={createPassword}
                onChange={(e) => setCreatePassword(e.target.value)}
                maxLength={20}
                className="pixel-input w-full py-2 text-xs"
              />
            </div>
          )}

          {/* Custom Bombs & Defuses */}
          <div className="flex gap-3 border-t border-dashed border-[#1A1C1C]/15 pt-3">
            <div className="flex flex-col gap-1.5 w-1/2">
              <span className="font-pixel-title text-[8px] text-[#1A1C1C] uppercase tracking-wider">
                {language === 'vi' ? 'SỐ DEFUSE' : 'DEFUSES'}
              </span>
              <input
                type="number"
                min={0}
                max={8}
                placeholder={language === 'vi' ? 'Mặc định' : 'Default'}
                value={lobbyCustomDefuses}
                onChange={(e) => {
                  const val = e.target.value === '' ? '' : Math.min(8, Math.max(0, parseInt(e.target.value, 10) || 0));
                  setLobbyCustomDefuses(val);
                }}
                className="pixel-input w-full py-1.5 text-xs"
              />
            </div>
            <div className="flex flex-col gap-1.5 w-1/2">
              <span className="font-pixel-title text-[8px] text-[#1A1C1C] uppercase tracking-wider">
                {language === 'vi' ? 'SỐ BOMB' : 'BOMBS'}
              </span>
              <input
                type="number"
                min={0}
                max={8}
                placeholder={language === 'vi' ? 'Mặc định' : 'Default'}
                value={lobbyCustomExplodingKittens}
                onChange={(e) => {
                  const val = e.target.value === '' ? '' : Math.min(8, Math.max(0, parseInt(e.target.value, 10) || 0));
                  setLobbyCustomExplodingKittens(val);
                }}
                className="pixel-input w-full py-1.5 text-xs"
              />
            </div>
          </div>

          {/* Voice Chat Switch */}
          <div className="flex justify-between items-center border-t border-dashed border-[#1A1C1C]/15 pt-3">
            <span className="font-pixel-title text-[8px] uppercase tracking-wider text-[#1A1C1C]">
              {t('voice_chat')}
            </span>
            <button
              type="button"
              onClick={() => setVoiceChatEnabled(!voiceChatEnabled)}
              className={`pixel-switch flex items-center px-0.5 rounded-none cursor-pointer focus:outline-none transition-colors scale-90
                ${voiceChatEnabled ? 'pixel-switch-active' : ''}`}
            >
              <div className={`pixel-switch-thumb rounded-none shadow-[1px_1px_0_rgba(0,0,0,0.15)]
                ${voiceChatEnabled ? 'pixel-switch-thumb-active bg-[#FFF]' : 'bg-[#FFF]'}`}
              />
            </button>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setCreateRoomStep(1)}
            className="flex-1 btn-retro-pixel py-3 bg-white text-slate-950 font-pixel-title text-[8px] uppercase tracking-wider shadow-[3px_3px_0_#1A1C1C]"
          >
            {language === 'vi' ? '← QUAY LẠI' : '← BACK'}
          </button>
          <button
            type="button"
            onClick={() => setCreateRoomStep(3)}
            className="flex-1 btn-retro-pixel py-3 bg-[#4CC9F0] text-slate-950 font-pixel-title text-[8px] uppercase tracking-wider shadow-[3px_3px_0_#1A1C1C]"
          >
            {language === 'vi' ? 'TIẾP THEO →' : 'NEXT →'}
          </button>
        </div>
      </div>
    )}

    {/* STEP 3: BETTING */}
    {createRoomStep === 3 && (
      <div className="flex flex-col gap-4 animate-fade-in text-left">
        <div className="pixel-card p-5 flex flex-col gap-4 bg-white border-4 border-[#1A1C1C] shadow-[4px_4px_0_#1A1C1C]">
          <div className="border-b-2 border-dashed border-[#1A1C1C]/15 pb-2">
            <span className="font-pixel-title text-[10px] text-white bg-[#1A1C1C] px-2 py-0.5">2. CHOOSE BET</span>
          </div>

          <div className="flex justify-between items-center gap-2">
            <div className="flex flex-col">
              <span className="font-pixel-title text-[8px] text-[#1A1C1C]/50 uppercase">{language === 'vi' ? 'TIỀN CƯỢC' : 'BET AMOUNT'}</span>
              <span className="font-pixel-title text-base text-[#ff5722] flex items-center gap-1 font-black">
                <CoinIcon className="w-5.5 h-5.5" /> {lobbyBetAmount}
              </span>
            </div>
            <div className="flex flex-col items-end">
              <span className="font-pixel-title text-[8px] text-[#1A1C1C]/50 uppercase">{language === 'vi' ? 'SỐ DƯ CỦA BẠN' : 'YOUR COINS'}</span>
              <span className="font-pixel-title text-xs text-[#1A1C1C] flex items-center gap-1 font-black">
                <CoinIcon className="w-4 h-4" /> {userProfile?.coins ?? 0}
              </span>
            </div>
          </div>

          {/* Circular bet chips */}
          <div className="flex flex-wrap gap-2 justify-center py-2">
            {[0, 10, 50, 100, 250, 500, 1000].map((val) => {
              const isSelected = lobbyBetAmount === val;
              const isPressed = pressedChip === val;
              const isAffordable = !userProfile?.coins || userProfile.coins >= val;
              return (
                <button
                  key={val}
                  type="button"
                  disabled={!isAffordable}
                  onClick={() => {
                    setLobbyBetAmount(val);
                    setPressedChip(val);
                    setTimeout(() => setPressedChip(null), 220);
                  }}
                  className={`pixel-chip w-11 h-11 text-[9px]
                    ${isPressed ? 'chip-press' : ''}
                    ${isSelected ? 'pixel-chip-selected' : ''}
                    ${isAffordable ? '' : 'pixel-chip-disabled'}`}
                >
                  {val}
                </button>
              );
            })}
          </div>

          {/* Estimate Info cards */}
          <div className="grid grid-cols-2 gap-2 mt-1">
            <div className="pixel-info-card flex flex-col gap-0.5">
              <span className="font-pixel-title text-[7px] text-[#1A1C1C]/50 uppercase">{language === 'vi' ? 'QUỸ THƯỞNG' : 'PRIZE POOL'}</span>
              <span className="font-pixel-title text-[10px] text-emerald-600 flex items-center gap-1 font-black">
                <CoinIcon className="w-3 h-3" /> {prizePool}
              </span>
            </div>
            <div className="pixel-info-card flex flex-col gap-0.5">
              <span className="font-pixel-title text-[7px] text-[#1A1C1C]/50 uppercase">{language === 'vi' ? 'PHẦN THƯỞNG' : 'MAX REWARD'}</span>
              <span className="font-pixel-title text-[10px] text-amber-500 flex items-center gap-1 font-black">
                <CoinIcon className="w-3 h-3" /> {prizePool}
              </span>
            </div>
          </div>

          {/* Bet validation messages */}
          <div className="flex flex-col gap-1.5 select-none">
            {!isAffordable && (
              <div className="border-2 border-[#E63946] bg-[#FFECEF] text-[#E63946] p-2 text-center font-pixel-title text-[8px] uppercase tracking-wider animate-pulse">
                ⚠️ {language === 'vi' ? 'Số dư không đủ!' : 'Insufficient balance!'}
              </div>
            )}
            {lobbyBetAmount === 0 && (
              <div className="border-2 border-sky-500 bg-[#EBF8FF] text-sky-600 p-1.5 text-center font-pixel-title text-[8px] uppercase tracking-wider">
                ℹ️ {language === 'vi' ? 'Mức cược tối thiểu' : 'MINIMUM BET LEVEL'}
              </div>
            )}
            {lobbyBetAmount === 1000 && (
              <div className="border-2 border-amber-500 bg-[#FFFDF0] text-amber-600 p-1.5 text-center font-pixel-title text-[8px] uppercase tracking-wider animate-bounce-short">
                🔥 {language === 'vi' ? 'MỨC CƯỢC TỐI ĐA!' : 'MAXIMUM BET LEVEL!'}
              </div>
            )}
          </div>
        </div>

        {/* Navigation */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setCreateRoomStep(2)}
            className="flex-1 btn-retro-pixel py-3 bg-white text-slate-950 font-pixel-title text-[8px] uppercase tracking-wider shadow-[3px_3px_0_#1A1C1C]"
          >
            {language === 'vi' ? '← QUAY LẠI' : '← BACK'}
          </button>
          <button
            type="button"
            onClick={() => setCreateRoomStep(4)}
            className="flex-1 btn-retro-pixel py-3 bg-[#4CC9F0] text-slate-950 font-pixel-title text-[8px] uppercase tracking-wider shadow-[3px_3px_0_#1A1C1C]"
          >
            {language === 'vi' ? 'TIẾP THEO →' : 'NEXT →'}
          </button>
        </div>
      </div>
    )}

    {/* STEP 4: REVIEW */}
    {createRoomStep === 4 && (
      <div className="flex flex-col gap-4 animate-fade-in text-left">
        <span className="font-pixel-title text-[9px] text-[#1A1C1C]/70 uppercase tracking-wider text-center block">
          {language === 'vi' ? 'XÁC NHẬN PHÒNG ĐẤU' : 'CONFIRM ROOM SETUP'}
        </span>

        {/* Receipt summary ticket */}
        <div className="room-summary-ticket flex flex-col gap-2.5 text-[11px] font-mono bg-[#FFFDF0]">
          <div className="border-b-2 border-dashed border-[#1A1C1C]/25 pb-1 flex justify-between font-black uppercase text-[9px] text-[#1A1C1C]/60">
            <span>RECEIPT: ROOM SETUP</span>
            <span>#{(visibleEdition || 'original').substring(0, 3).toUpperCase()}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#1A1C1C]/60">EDITION:</span>
            <span className="font-black text-[#1A1C1C] uppercase">{getEditionDetails(lobbyEdition).name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#1A1C1C]/60">MAX PLAYERS:</span>
            <span className="font-black text-[#1A1C1C]">{lobbyMaxPlayers} Players</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#1A1C1C]/60">BET SIZE:</span>
            <span className="font-black text-[#ff5722]">{lobbyBetAmount} Gold</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#1A1C1C]/60">VISIBILITY:</span>
            <span className="font-black text-[#1A1C1C] uppercase">{roomPrivacy === 'private' ? 'Private' : 'Public'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#1A1C1C]/60">VOICE CHAT:</span>
            <span className="font-black text-[#1A1C1C] uppercase">{voiceChatEnabled ? 'Enabled' : 'Disabled'}</span>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setCreateRoomStep(3)}
            className="flex-1 btn-retro-pixel py-3 bg-white text-slate-950 font-pixel-title text-[8px] uppercase tracking-wider shadow-[3px_3px_0_#1A1C1C]"
          >
            {language === 'vi' ? '← QUAY LẠI' : '← BACK'}
          </button>
          <button
            type="button"
            onClick={() => setCreateRoomStep(5)}
            className="flex-1 btn-retro-pixel py-3 bg-[#4CC9F0] text-slate-950 font-pixel-title text-[8px] uppercase tracking-wider shadow-[3px_3px_0_#1A1C1C]"
          >
            {language === 'vi' ? 'TIẾP THEO →' : 'NEXT →'}
          </button>
        </div>
      </div>
    )}

    {/* STEP 5: CREATE ROOM */}
    {createRoomStep === 5 && (
      <div className="flex flex-col gap-5 animate-fade-in text-center">
        {/* Decorative retro bomb graphic element */}
        <div className="border-4 border-[#1A1C1C] bg-[#1e293b] p-6 flex flex-col items-center justify-center gap-3 relative overflow-hidden shadow-[4px_4px_0px_#1A1C1C]">
          <div className="absolute inset-0 pixel-crt pixel-scanline pointer-events-none" />

          {/* Small animated bomb icon using SVG */}
          <svg viewBox="0 0 16 16" className="w-16 h-16 text-rose-500 fill-current animate-bounce-short drop-shadow-[0_2px_8px_rgba(244,63,94,0.4)]">
            <path d="M7 1h2v1H7zM6 2h4v2H6zM3 5h10v1H3zM2 6h12v7H2zM3 13h10v1H3zM5 14h6v1H5z" />
            <path d="M12 1h1v1h-1zM11 2h1v1h-1zM10 3h1v1h-1z" className="text-yellow-400 fill-current" />
          </svg>

          <h3 className="font-pixel-title text-sm text-white uppercase tracking-wider select-none">
            {language === 'vi' ? 'PHÒNG ĐÃ SẴN SÀNG!' : 'ROOM IS READY!'}
          </h3>
          <p className="font-pixel-body text-[10px] text-[#86efac] max-w-xs select-none">
            {language === 'vi'
              ? 'Tất cả cấu hình đã hoàn tất. Kích nổ bom ngay để tạo phòng của riêng bạn!'
              : 'All configurations completed. Detonate the bomb now to establish your lobby!'}
          </p>
        </div>

        {/* Detonate and Back buttons */}
        <div className="flex flex-col gap-3">
          <button
            disabled={!isAffordable}
            onClick={() => {
              const defuses = lobbyCustomDefuses === '' ? undefined : parseInt(lobbyCustomDefuses, 10);
              const kittens = lobbyCustomExplodingKittens === '' ? undefined : parseInt(lobbyCustomExplodingKittens, 10);
              createRoom(createPassword, lobbyEdition, lobbyMaxPlayers, lobbyBetAmount, defuses, kittens);
              setIsCreatingRoom(false);
            }}
            className={`w-full btn-retro-pixel py-4 text-white font-pixel-title uppercase text-[10px] tracking-widest shadow-[4px_4px_0_#1A1C1C] active:translate-y-[2px]
              ${isAffordable
                ? 'bg-[#E63946] active:translate-y-[2px]'
                : 'bg-[#64748B] opacity-50 cursor-not-allowed shadow-none active:translate-y-0'}`}
            style={{ textShadow: '1px 1px 0px #1a1c1c' }}
          >
            💥 {language === 'vi' ? 'KÍCH NỔ / TẠO PHÒNG' : 'DETONATE / CREATE ROOM'} 💥
          </button>
          <button
            type="button"
            onClick={() => setCreateRoomStep(4)}
            className="w-full btn-retro-pixel py-3 bg-white text-slate-950 font-pixel-title text-[8px] uppercase tracking-wider shadow-[3px_3px_0_#1A1C1C]"
          >
            {language === 'vi' ? '← QUAY LẠI TÓM TẬT' : '← BACK TO SUMMARY'}
          </button>
        </div>
      </div>
    )}
  </div>
);
}
