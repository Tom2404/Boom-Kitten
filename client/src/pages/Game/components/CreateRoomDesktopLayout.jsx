import React from 'react';
import { useGameContext } from '../GameContext.jsx';

export default function CreateRoomDesktopLayout() {
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

// Calculate estimated prize pool
const maxLimit = lobbyEdition === '2_player' ? 2 : (lobbyEdition === 'imploding' ? 6 : 5);
const prizePool = lobbyBetAmount * lobbyMaxPlayers;

// Bet validation alerts
const isAffordable = !userProfile?.coins || userProfile.coins >= lobbyBetAmount;

return (
  <div className="hidden md:flex flex-col gap-6 w-full">
    {/* Grid Edition Selection */}
    <div className="flex flex-col gap-2">
      <span className="font-pixel-title text-[10px] text-[#1A1C1C]/70 uppercase tracking-wider">
        {t('choose_edition')}
      </span>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 pt-1">
        {editionsList.map((key) => {
          const isSelected = lobbyEdition === key;
          const isSnapping = lastClickedEdition === key;
          const details = getEditionDetails(key);
          const meta = EDITIONS_MAP[key] || EDITIONS_MAP.original;

          return (
            <button
              key={key}
              type="button"
              onClick={() => {
                // Trigger snap animation
                setLastClickedEdition(key);
                setTimeout(() => setLastClickedEdition(null), 250);
                // Fade transition for detail panel
                if (key !== lobbyEdition) {
                  setDetailFading(true);
                  setTimeout(() => {
                    setVisibleEdition(key);
                    setDetailFading(false);
                  }, 150);
                }
                setLobbyEdition(key);
                const maxLimit = key === '2_player' ? 2 : (key === 'imploding' ? 6 : 5);
                if (lobbyMaxPlayers > maxLimit || key === '2_player') {
                  setLobbyMaxPlayers(maxLimit);
                }
              }}
              onMouseEnter={() => setHoveredEdition(key)}
              onMouseLeave={() => setHoveredEdition(null)}
              className={`w-full p-4 rounded-none border-4 border-[#1A1C1C] text-left flex flex-col justify-between gap-3 h-36 cursor-pointer relative overflow-hidden
                ${isSnapping ? 'edition-snap' : ''}
                ${isSelected
                  ? 'bg-[#FFD54A] text-[#1A1C1C] translate-y-[2px] shadow-none edition-selected-glow'
                  : 'bg-white text-[#1A1C1C] shadow-[4px_4px_0_#1A1C1C] hover:translate-y-[-2px] hover:shadow-[6px_6px_0_#1A1C1C] active:translate-y-0.5 active:shadow-none transition-all duration-150'
                }`}
            >
              {/* Edition accent bar - colored per edition */}
              <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${isSelected ? 'bg-[#E63946]' : 'bg-[#1A1C1C]/20'} transition-colors duration-150`} />

              {/* Active Ribbon indicator */}
              {isSelected && (
                <div className="absolute top-0 right-0 bg-[#E63946] text-white border-b-3 border-l-3 border-[#1A1C1C] px-2 py-0.5 text-[8px] font-pixel-title uppercase tracking-widest z-20">
                  Active
                </div>
              )}

              {isSelected && <div className="absolute inset-0 pixel-scanline pointer-events-none opacity-20" />}

              <div className="flex justify-between items-start w-full pl-2">
                <div className="flex flex-col gap-1 flex-grow pr-1">
                  <h3 className="font-pixel-title text-[10px] uppercase tracking-wider leading-none text-[#1A1C1C]">
                    {details.name}
                  </h3>
                  <span className="inline-block text-[7px] font-pixel-title bg-black/5 text-[#1A1C1C]/65 px-1 py-0.5 w-max">
                    {language === 'vi' ? meta.badge.vi : meta.badge.en}
                  </span>
                </div>
                <div className="flex-shrink-0">
                  {renderEditionArtwork(key, 32)}
                </div>
              </div>
              <p className="text-[11px] font-bold leading-snug line-clamp-2 text-[#1A1C1C]/75 mt-auto pl-2">
                {details.description}
              </p>
            </button>
          );
        })}
      </div>
    </div>

    {/* Split Columns Grid */}
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start mt-2">
      {/* Left Column: Active Edition Showcase */}
      <div className="lg:col-span-7 relative p-6 flex flex-col gap-6 text-left min-h-[420px] border-4 border-[#1A1C1C] rounded-none shadow-[6px_6px_0px_#1A1C1C] overflow-visible bg-[#0f172a]">
        {/* Screen backdrop with CRT effect */}
        <div className="absolute inset-0 pixel-crt pixel-scanline z-0 pointer-events-none" style={{ position: 'absolute', border: 'none' }} />

        {(() => {
          const activeKey = visibleEdition;
          const details = getEditionDetails(activeKey);
          const meta = EDITIONS_MAP[activeKey] || EDITIONS_MAP.original;
          const fanAngles = [-4, -1.5, 1.5, 4];
          const fanYs = [3, 1, 1, 3];
          return (
            <div className={`relative z-10 flex flex-col gap-6 w-full h-full ${detailFading ? 'detail-fade-out' : 'detail-fade-in'}`}>
              {/* Slanted Retro Badge */}
              <div className="absolute top-5 right-5 rotate-6 z-20 select-none">
                <div className={`font-pixel-title text-[8px] px-3.5 py-1.5 rounded-none border-3 border-[#1A1C1C] shadow-[2px_2px_0_#1A1C1C] uppercase tracking-wider ${meta.badgeColor}`}>
                  {language === 'vi' ? meta.badge.vi : meta.badge.en}
                </div>
              </div>

              {/* Title & Description */}
              <div className="pb-4 pr-24 border-b-2 border-dashed border-white/10">
                <h3 className="font-pixel-title text-xl text-white uppercase tracking-tight">
                  {details.name}
                </h3>
                <p className="font-pixel-body text-sm text-[#86efac] mt-2 leading-relaxed opacity-90">
                  {details.description}
                </p>
              </div>

              {/* Special Rules */}
              <div className="flex flex-col gap-2">
                <span className="font-pixel-title text-[9px] text-white/80 uppercase tracking-wider">
                  {language === 'vi' ? 'LUẬT CHƠI ĐẶC TRƯNG' : 'SPECIAL RULES'}
                </span>
                <div className="flex flex-wrap gap-2.5 mt-1 select-none">
                  {meta.rules[language].map((ruleText, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1.5 bg-[#1e293b] text-[#86efac] border-2 border-[#86efac] px-3 py-1 text-[10px] font-pixel-title uppercase tracking-wider shadow-[2px_2px_0_rgba(0,0,0,0.5)]"
                    >
                      <span className="text-[10px] text-emerald-400 font-pixel-title">✓</span>
                      {ruleText}
                    </span>
                  ))}
                </div>
              </div>

              {/* Exclusive Cards - fan layout with natural spread */}
              <div className="flex flex-col gap-3 pt-4 border-t-2 border-dashed border-white/10">
                <span className="font-pixel-title text-[9px] text-white/80 uppercase tracking-wider">
                  {language === 'vi' ? 'THÀNH PHẦN THẺ BÀI TIÊU BIỂU' : 'FEATURED EXCLUSIVE CARDS'}
                </span>
                <div className="grid grid-cols-4 gap-4 mt-2" style={{ perspective: '800px' }}>
                  {meta.exclusiveCards.map((card, idx) => (
                    <ExclusiveCard
                      key={idx}
                      cardType={card.type}
                      name={language === 'vi' ? card.name.vi : card.name.en}
                      fanAngle={fanAngles[idx] ?? 0}
                      fanY={fanYs[idx] ?? 0}
                    />
                  ))}
                </div>
              </div>
            </div>
          );
        })()}
      </div>

      {/* Right Column: Lobby Settings Card */}
      <div className="lg:col-span-5 flex flex-col gap-6">
        <div className="pixel-card p-6 flex flex-col gap-5 text-left bg-white border-4 border-[#1A1C1C] shadow-[6px_6px_0_#1A1C1C]">

          {/* GROUP 1: ROOM */}
          <div className="flex flex-col gap-4 border-b-4 border-dashed border-[#1A1C1C]/15 pb-4">
            <div className="flex items-center gap-2">
              <span className="font-pixel-title text-[10px] text-white bg-[#1A1C1C] px-2 py-0.5 uppercase">ROOM</span>
            </div>

            {/* Player count Stepper Selector */}
            <div className="flex flex-col gap-2">
              <span className="font-pixel-title text-[10px] text-[#1A1C1C] uppercase tracking-wider">
                {t('max_players')}
              </span>
              {(() => {
                const minLimit = 2;
                const maxLimit = lobbyEdition === '2_player' ? 2 : (lobbyEdition === 'imploding' ? 6 : 5);
                const isLocked = minLimit === maxLimit;

                return (
                  <div className="flex items-center gap-2 mt-1">
                    <button
                      type="button"
                      disabled={isLocked || lobbyMaxPlayers <= minLimit}
                      onClick={() => setLobbyMaxPlayers(p => Math.max(minLimit, p - 1))}
                      className="btn-retro-pixel w-10 h-10 bg-white hover:bg-slate-50 text-[#1A1C1C] font-pixel-title text-base flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none disabled:translate-y-0 shadow-[2px_2px_0_#1A1C1C]"
                    >
                      -
                    </button>
                    <div className="border-3 border-[#1A1C1C] bg-[#FFD54A] px-4 py-2 min-w-[120px] text-center font-pixel-title text-[11px] flex items-center justify-center h-10 shadow-[2px_2px_0_#1A1C1C] select-none">
                      {lobbyMaxPlayers} {language === 'vi' ? 'NGƯỜI' : 'PLAYERS'}
                    </div>
                    <button
                      type="button"
                      disabled={isLocked || lobbyMaxPlayers >= maxLimit}
                      onClick={() => setLobbyMaxPlayers(p => Math.min(maxLimit, p + 1))}
                      className="btn-retro-pixel w-10 h-10 bg-white hover:bg-slate-50 text-[#1A1C1C] font-pixel-title text-base flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none disabled:translate-y-0 shadow-[2px_2px_0_#1A1C1C]"
                    >
                      +
                    </button>
                  </div>
                );
              })()}
            </div>

            {/* Room Visibility Tab Buttons */}
            <div className="flex flex-col gap-2">
              <span className="font-pixel-title text-[10px] text-[#1A1C1C] uppercase tracking-wider">
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

            {/* Room Password field */}
            {roomPrivacy === 'private' && (
              <div className="flex flex-col gap-2 animate-fade-in">
                <span className="font-pixel-title text-[10px] text-[#1A1C1C] uppercase tracking-wider">
                  {language === 'vi' ? 'Mật khẩu phòng' : 'Room Password'}
                </span>
                <div className="relative flex items-center">
                  <input
                    type={showPasswordInput ? "text" : "password"}
                    placeholder={language === 'vi' ? 'Nhập mật khẩu phòng' : 'Enter room password'}
                    value={createPassword}
                    onChange={(e) => setCreatePassword(e.target.value)}
                    maxLength={20}
                    className="pixel-input w-full pr-16"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswordInput(!showPasswordInput)}
                    className="absolute right-3 bg-white hover:bg-slate-100 border-2 border-[#1A1C1C] px-2 py-1 rounded-none text-[10px] font-pixel-title text-[#1A1C1C]"
                  >
                    {showPasswordInput ? '[-_-]' : '[O_O]'}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* GROUP 2: GAMEPLAY */}
          <div className="flex flex-col gap-4 border-b-4 border-dashed border-[#1A1C1C]/15 pb-4">
            <div className="flex items-center gap-2">
              <span className="font-pixel-title text-[10px] text-white bg-[#1A1C1C] px-2 py-0.5 uppercase">GAMEPLAY</span>
            </div>

            <div className="flex gap-4">
              <div className="flex flex-col gap-2 w-1/2">
                <div className="flex items-center gap-1">
                  <span className="font-pixel-title text-[10px] text-[#1A1C1C] uppercase tracking-wider">
                    {language === 'vi' ? 'SỐ DEFUSE' : 'CUSTOM DEFUSES'}
                  </span>
                  <div className="relative group cursor-help text-xs font-bold text-slate-500 hover:text-black">
                    <span className="inline-block bg-slate-200 border-2 border-[#1A1C1C] w-3.5 h-3.5 rounded-full text-center leading-3 font-mono text-[9px]">i</span>
                    <div className="hidden group-hover:block absolute bottom-[130%] left-1/2 transform -translate-x-1/2 w-48 bg-white border-3 border-[#1A1C1C] p-2 text-[10px] font-pixel-body text-[#1A1C1C] shadow-[3px_3px_0_#1A1C1C] z-30 pointer-events-none uppercase tracking-wide normal-case text-center">
                      {language === 'vi' ? 'Số lượng thẻ gỡ bom có trong bộ bài (Tối đa 8, mặc định tự động)' : 'Number of defuse cards in deck (Max 8, default auto)'}
                    </div>
                  </div>
                </div>
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
                  className="pixel-input w-full py-2"
                />
              </div>
              <div className="flex flex-col gap-2 w-1/2">
                <div className="flex items-center gap-1">
                  <span className="font-pixel-title text-[10px] text-[#1A1C1C] uppercase tracking-wider">
                    {language === 'vi' ? 'SỐ BOMB' : 'CUSTOM BOMBS'}
                  </span>
                  <div className="relative group cursor-help text-xs font-bold text-slate-500 hover:text-black">
                    <span className="inline-block bg-slate-200 border-2 border-[#1A1C1C] w-3.5 h-3.5 rounded-full text-center leading-3 font-mono text-[9px]">i</span>
                    <div className="hidden group-hover:block absolute bottom-[130%] left-1/2 transform -translate-x-1/2 w-48 bg-white border-3 border-[#1A1C1C] p-2 text-[10px] font-pixel-body text-[#1A1C1C] shadow-[3px_3px_0_#1A1C1C] z-30 pointer-events-none uppercase tracking-wide normal-case text-center">
                      {language === 'vi' ? 'Số lượng thẻ kích nổ có trong bộ bài (Tối đa 8, mặc định tự động)' : 'Number of exploding bomb cards in deck (Max 8, default auto)'}
                    </div>
                  </div>
                </div>
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
                  className="pixel-input w-full py-2"
                />
              </div>
            </div>
          </div>

          {/* GROUP 3: BETTING */}
          <div className="flex flex-col gap-4 border-b-4 border-dashed border-[#1A1C1C]/15 pb-4">
            <div className="flex items-center gap-2">
              <span className="font-pixel-title text-[10px] text-white bg-[#1A1C1C] px-2 py-0.5 uppercase">BETTING</span>
            </div>

            <div className="flex justify-between items-start gap-4">
              {/* Current Bet Box */}
              <div className="flex flex-col gap-1 flex-1">
                <span className="font-pixel-title text-[9px] text-[#1A1C1C]/60 uppercase tracking-wider">
                  {language === 'vi' ? 'TIỀN CƯỢC HIỆN TẠI' : 'CURRENT BET'}
                </span>
                <div className="bg-[#1A1C1C] border-3 border-[#1A1C1C] p-3 text-center flex items-center justify-center gap-2 shadow-[2px_2px_0_rgba(0,0,0,0.15)]">
                  <CoinIcon className="w-5 h-5" />
                  <span className="font-pixel-title text-base text-[#FFD54A] font-black">
                    {lobbyBetAmount}
                  </span>
                </div>
              </div>

              {/* Player Balance Box */}
              <div className="flex flex-col gap-1 flex-1">
                <span className="font-pixel-title text-[9px] text-[#1A1C1C]/60 uppercase tracking-wider">
                  {language === 'vi' ? 'SỐ DƯ CỦA BẠN' : 'YOUR BALANCE'}
                </span>
                <div className="bg-[#F8FAFC] border-3 border-[#1A1C1C]/15 p-3 text-center flex items-center justify-center gap-2 shadow-[2px_2px_0_rgba(0,0,0,0.05)]">
                  <CoinIcon className="w-5 h-5" />
                  <span className="font-pixel-title text-sm text-[#1A1C1C] font-black">
                    {userProfile?.coins?.toLocaleString() ?? 0}
                  </span>
                </div>
              </div>
            </div>

            {/* Circular Poker Bet Chips */}
            <div className="flex flex-col gap-2">
              <span className="font-pixel-title text-[9px] text-[#1A1C1C]/70 uppercase tracking-wider">
                {language === 'vi' ? 'QUÂN CHIP CƯỢC NHANH' : 'QUICK BET CHIPS'}
              </span>
              <div className="flex justify-between gap-1 mt-1">
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
                      className={`pixel-chip
                        ${isPressed ? 'chip-press' : ''}
                        ${isSelected ? 'pixel-chip-selected' : ''}
                        ${isAffordable ? '' : 'pixel-chip-disabled'}`}
                    >
                      {val}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Information cards */}
            <div className="grid grid-cols-2 gap-2 mt-1">
              <div className="pixel-info-card flex flex-col gap-0.5">
                <span className="font-pixel-title text-[8px] text-[#1A1C1C]/50 uppercase">{language === 'vi' ? 'ƯỚC TÍNH QUỸ THƯỞNG' : 'EST. PRIZE POOL'}</span>
                <span className="font-pixel-title text-[11px] text-emerald-600 flex items-center gap-1 font-black">
                  <CoinIcon className="w-3.5 h-3.5" /> {prizePool}
                </span>
              </div>
              <div className="pixel-info-card flex flex-col gap-0.5">
                <span className="font-pixel-title text-[8px] text-[#1A1C1C]/50 uppercase">{language === 'vi' ? 'PHẦN THƯỞNG TỐI ĐA' : 'POTENTIAL REWARD'}</span>
                <span className="font-pixel-title text-[11px] text-amber-500 flex items-center gap-1 font-black">
                  <CoinIcon className="w-3.5 h-3.5" /> {prizePool} <span className="text-[7px] text-[#1A1C1C]/40">(100% PAYOUT)</span>
                </span>
              </div>
            </div>

            {/* Bet Feedback Badges */}
            <div className="flex flex-col gap-1.5 select-none">
              {!isAffordable && (
                <div className="border-3 border-[#E63946] bg-[#FFECEF] text-[#E63946] p-2.5 text-center font-pixel-title text-[9px] uppercase tracking-wider shadow-[2px_2px_0_rgba(0,0,0,0.05)] animate-pulse">
                  ⚠️ {language === 'vi' ? 'Số dư không đủ để đặt cược!' : 'Insufficient balance for this bet!'}
                </div>
              )}
              {lobbyBetAmount === 0 && (
                <div className="border-3 border-sky-500 bg-[#EBF8FF] text-sky-600 p-2 text-center font-pixel-title text-[8px] uppercase tracking-wider">
                  ℹ️ {language === 'vi' ? 'ĐANG CHỌN MỨC CƯỢC TỐI THIỂU' : 'MINIMUM BET LEVEL SELECTED'}
                </div>
              )}
              {lobbyBetAmount === 1000 && (
                <div className="border-3 border-amber-500 bg-[#FFFDF0] text-amber-600 p-2 text-center font-pixel-title text-[8px] uppercase tracking-wider animate-bounce-short">
                  🔥 {language === 'vi' ? 'ĐANG CHỌN MỨC CƯỢC TỐI ĐA!' : 'MAXIMUM MATCH BET SELECTED!'}
                </div>
              )}
            </div>
          </div>

          {/* GROUP 4: EXTRAS */}
          <div className="flex justify-between items-center pt-2">
            <div className="flex flex-col text-left">
              <span className="font-pixel-title text-[10px] uppercase tracking-wider text-[#1A1C1C]">
                {t('voice_chat')}
              </span>
              <span className="text-[9px] font-bold text-[#1A1C1C]/60 font-pixel-body leading-tight mt-0.5">
                {language === 'vi' ? 'Đàm thoại nhóm trực tiếp' : 'In-game group voice chat'}
              </span>
            </div>

            {/* Modern Custom Toggle Switch */}
            <button
              type="button"
              onClick={() => setVoiceChatEnabled(!voiceChatEnabled)}
              className={`pixel-switch flex items-center px-0.5 rounded-none cursor-pointer focus:outline-none transition-colors
                ${voiceChatEnabled ? 'pixel-switch-active' : ''}`}
            >
              <div className={`pixel-switch-thumb rounded-none shadow-[1px_1px_0_rgba(0,0,0,0.15)]
                ${voiceChatEnabled ? 'pixel-switch-thumb-active bg-[#FFF]' : 'bg-[#FFF]'}`}
              />
            </button>
          </div>
        </div>

        {/* Room Summary Receipt Ticket */}
        <div className="room-summary-ticket flex flex-col gap-2 mt-1 text-[11px] font-mono text-left bg-[#FFFDF0]">
          <div className="border-b-2 border-dashed border-[#1A1C1C]/25 pb-1 flex justify-between font-black uppercase text-[9px] text-[#1A1C1C]/60">
            <span>RECEIPT: ROOM SETUP</span>
            <span>#{(visibleEdition || 'original').substring(0, 3).toUpperCase()}</span>
          </div>
          <div className="flex justify-between text-[11px]">
            <span className="text-[#1A1C1C]/60">EDITION:</span>
            <span className="font-black text-[#1A1C1C] uppercase">{getEditionDetails(lobbyEdition).name}</span>
          </div>
          <div className="flex justify-between text-[11px]">
            <span className="text-[#1A1C1C]/60">MAX PLAYERS:</span>
            <span className="font-black text-[#1A1C1C]">{lobbyMaxPlayers} Players</span>
          </div>
          <div className="flex justify-between text-[11px]">
            <span className="text-[#1A1C1C]/60">BET SIZE:</span>
            <span className="font-black text-[#ff5722]">{lobbyBetAmount} Gold</span>
          </div>
          <div className="flex justify-between text-[11px]">
            <span className="text-[#1A1C1C]/60">VISIBILITY:</span>
            <span className="font-black text-[#1A1C1C] uppercase">{roomPrivacy === 'private' ? 'Private' : 'Public'}</span>
          </div>
          <div className="flex justify-between text-[11px]">
            <span className="text-[#1A1C1C]/60">VOICE CHAT:</span>
            <span className="font-black text-[#1A1C1C] uppercase">{voiceChatEnabled ? 'Enabled' : 'Disabled'}</span>
          </div>
        </div>

        {/* Detonate CREATE ROOM button */}
        <button
          disabled={!isAffordable}
          onClick={() => {
            const defuses = lobbyCustomDefuses === '' ? undefined : parseInt(lobbyCustomDefuses, 10);
            const kittens = lobbyCustomExplodingKittens === '' ? undefined : parseInt(lobbyCustomExplodingKittens, 10);
            createRoom(createPassword, lobbyEdition, lobbyMaxPlayers, lobbyBetAmount, defuses, kittens);
            setIsCreatingRoom(false);
          }}
          className={`w-full btn-retro-pixel btn-shine-container btn-cta-glow py-4 text-white font-pixel-title uppercase text-sm tracking-widest hover:translate-y-[-3px] active:translate-y-[3px] active:shadow-[1px_1px_0_#1A1C1C] transition-colors mt-2
            ${isAffordable
              ? 'bg-[#E63946] hover:bg-[#ff4d5a] cursor-pointer'
              : 'bg-[#64748B] opacity-50 cursor-not-allowed shadow-none hover:translate-y-0'}`}
          style={{ textShadow: '1.5px 1.5px 0px #1a1c1c' }}
        >
          💥 {language === 'vi' ? 'KÍCH NỔ / TẠO PHÒNG' : 'DETONATE / CREATE ROOM'} 💥
        </button>
      </div>
    </div>
  </div>
);
}
