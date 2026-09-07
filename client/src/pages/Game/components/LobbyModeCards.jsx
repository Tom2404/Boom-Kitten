import React from 'react';
import { useGameContext } from '../GameContext.jsx';
import pixelRadarScan from '../../../assets/ui/pixel_radar_scan.jpg';

export default function LobbyModeCards() {
  const props = useGameContext();
  const {
    PlayModeCard,
    createRoomIcon,
    handleQuickPlay,
    idRoomImg,
    isQuickPlaySearching,
    joinRoom,
    language,
    quickplayIcon,
    roomInput,
    setCreatePassword,
    setCreateRoomStep,
    setIsCreatingRoom,
    setLobbyEdition,
    setLobbyMaxPlayers,
    setRoomInput,
    setRoomPrivacy,
  } = props;

  return (
    <>
      {/* Quick Actions rail: horizontal on tablet, vertical column on desktop */}
      <div className="vf-mode-rail flex flex-col md:flex-row lg:flex-col justify-center items-stretch w-full">
        {/* Card 1: QUICK PLAY */}
        <PlayModeCard
          compact
          title={language === 'vi' ? 'CHƠI NHANH' : 'QUICK PLAY'}
          subtitle={language === 'vi' ? 'Tìm trận tức thì' : 'Instant matchmaking'}
          description={language === 'vi' ? 'Vào trận ngay lập tức và so tài trực tiếp cùng các đối thủ trực tuyến.' : 'Instantly join a matching public game and play with other online players.'}
          illustrationSrc={quickplayIcon}
          bgClass="bg-sunburst"
          isPrimary={true}
          badgeText={language === 'vi' ? 'KHUYÊN DÙNG' : 'POPULAR'}
          isDisabled={isQuickPlaySearching}
          imageClass="w-full h-full object-contain p-1"
          onClick={handleQuickPlay}
          buttonText={isQuickPlaySearching ? (language === 'vi' ? 'ĐANG TÌM...' : 'SEARCHING...') : (language === 'vi' ? 'BẮT ĐẦU CHƠI' : 'PLAY NOW')}
          buttonBgClass="bg-[var(--pop-amber)] hover:bg-white text-[var(--pop-black)] shadow-[4px_4px_0_var(--pop-black)]"
          extraContent={isQuickPlaySearching && (
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center p-1 bg-black/75 backdrop-blur-[1px]">
              <div className="relative w-12 h-12 rounded-full border-2 border-emerald-400 p-0.5 overflow-hidden shadow-[0_0_12px_rgba(52,211,153,0.85)]">
                <img
                  src={pixelRadarScan}
                  alt="Radar Searching"
                  className="w-full h-full object-contain rounded-full animate-spin"
                  style={{ animationDuration: '4s', imageRendering: 'pixelated' }}
                />
              </div>
              <span className="font-pixel font-black text-[10px] text-emerald-400 uppercase tracking-widest mt-1.5 bg-black/90 px-2 py-0.5 rounded border border-emerald-500/60 shadow-[1px_1px_0_#000] animate-pulse">
                {language === 'vi' ? '[ QUÉT TRẬN... ]' : '[ SCANNING... ]'}
              </span>
            </div>
          )}
        />

        {/* Card 2: CREATE PRIVATE ROOM */}
        <PlayModeCard
          compact
          title={language === 'vi' ? 'TẠO PHÒNG' : 'CREATE ROOM'}
          subtitle={language === 'vi' ? 'Mời bạn bè tham gia' : 'Invite your friends'}
          description={language === 'vi' ? 'Tạo một phòng đấu mới của riêng bạn để tùy chỉnh luật chơi và rủ bạn bè.' : 'Set up a custom room with your preferred rules and challenge your friends.'}
          illustrationSrc={createRoomIcon}
          bgClass="bg-halftone"
          isPrimary={false}
          imageClass="w-full h-full object-contain p-1"
          onClick={() => {
            setIsCreatingRoom(true);
            setLobbyEdition('original');
            setLobbyMaxPlayers(5);
            setCreatePassword('');
            setCreateRoomStep(1);
            setRoomPrivacy('public');
          }}
          buttonText={language === 'vi' ? 'TẠO PHÒNG' : 'CREATE ROOM'}
          buttonBgClass="bg-[var(--pop-green)] hover:bg-white text-[var(--pop-black)] shadow-[4px_4px_0_var(--pop-black)]"
        />

        {/* Card 3: JOIN VIA CODE */}
        <PlayModeCard
          compact
          title={language === 'vi' ? 'VÀO BẰNG MÃ' : 'JOIN BY CODE'}
          subtitle={language === 'vi' ? 'Nhập mã phòng đấu' : 'Enter a room code'}
          description={language === 'vi' ? 'Nhập mã phòng gồm 6 ký tự được bạn bè chia sẻ để tham gia phòng đấu.' : 'Enter a 6-character invitation room code to connect and play with others.'}
          illustrationSrc={idRoomImg}
          bgClass="bg-retro-grid"
          isPrimary={false}
          isDisabled={roomInput.length !== 6}
          imageClass="w-full h-full object-contain"
          enableWiggle={false}
          onClick={() => joinRoom(roomInput)}
          buttonText={language === 'vi' ? 'VÀO PHÒNG' : 'JOIN ROOM'}
          buttonBgClass="bg-[var(--pop-blue)] hover:bg-white text-[var(--pop-black)] shadow-[4px_4px_0_var(--pop-black)]"
          extraContent={
            <div className="absolute inset-0 flex flex-col items-center justify-center p-2 z-20">
              <input
                type="text"
                placeholder={language === 'vi' ? 'NHẬP MÃ' : 'ENTER CODE'}
                value={roomInput}
                onChange={(e) => setRoomInput(e.target.value.toUpperCase())}
                maxLength={6}
                className="w-4/5 max-w-[140px] bg-white/95 border-2 border-[var(--pop-black)] rounded-md px-2 py-1 text-[var(--pop-black)] font-headline font-black uppercase tracking-widest text-center text-xs sm:text-sm focus:outline-none focus:bg-white transition-all shadow-[2px_2px_0_var(--pop-black)]"
              />
            </div>
          }
        />
      </div>
    </>
  );
}
