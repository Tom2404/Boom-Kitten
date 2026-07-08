import React from 'react';
import { useGameContext } from '../GameContext.jsx';

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
      {/* Quick Actions Row */}
      <div className="flex flex-col md:flex-row flex-wrap lg:flex-nowrap justify-center items-stretch gap-6 md:gap-8 mb-8 mt-4 max-w-5xl mx-auto w-full">
        {/* Card 1: QUICK PLAY */}
        <PlayModeCard
          title={language === 'vi' ? 'CHƠI NHANH' : 'QUICK PLAY'}
          subtitle={language === 'vi' ? 'Tìm trận tức thì' : 'Instant matchmaking'}
          description={language === 'vi' ? 'Vào trận ngay lập tức và so tài trực tiếp cùng các đối thủ trực tuyến.' : 'Instantly join a matching public game and play with other online players.'}
          illustrationSrc={quickplayIcon}
          bgClass="bg-sunburst"
          isPrimary={true}
          badgeText={language === 'vi' ? 'KHUYÊN DÙNG' : 'POPULAR'}
          isDisabled={isQuickPlaySearching}
          onClick={handleQuickPlay}
          buttonText={isQuickPlaySearching ? (language === 'vi' ? 'ĐANG TÌM...' : 'SEARCHING...') : (language === 'vi' ? 'BẮT ĐẦU CHƠI' : 'PLAY NOW')}
          buttonBgClass="bg-[var(--pop-amber)] hover:bg-white text-[var(--pop-black)] shadow-[4px_4px_0_var(--pop-black)]"
          extraContent={isQuickPlaySearching && (
            <>
              <div className="radar-scan-line" />
              <div className="absolute inset-0 bg-red-500/10 animate-pulse z-10" />
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 z-20">
                <div className="w-10 h-10 border-4 border-[var(--pop-black)] border-t-transparent rounded-full animate-spin" />
                <span className="font-headline font-black text-xs text-[var(--pop-black)] uppercase tracking-wider bg-white/95 px-2 py-0.5 rounded border-2 border-[var(--pop-black)] shadow-[2px_2px_0_var(--pop-black)]">
                  {language === 'vi' ? 'Đang tìm...' : 'Searching...'}
                </span>
              </div>
            </>
          )}
        />

        {/* Card 2: CREATE PRIVATE ROOM */}
        <PlayModeCard
          title={language === 'vi' ? 'TẠO PHÒNG' : 'CREATE ROOM'}
          subtitle={language === 'vi' ? 'Mời bạn bè tham gia' : 'Invite your friends'}
          description={language === 'vi' ? 'Tạo một phòng đấu mới của riêng bạn để tùy chỉnh luật chơi và rủ bạn bè.' : 'Set up a custom room with your preferred rules and challenge your friends.'}
          illustrationSrc={createRoomIcon}
          bgClass="bg-halftone"
          isPrimary={false}
          imageClass="w-full h-full object-cover scale-125"
          imageStyle={{ '--wiggle-scale': 1.25 }}
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
            <div className="absolute inset-0 flex flex-col items-center justify-center pt-8 z-20">
              <input
                type="text"
                placeholder={language === 'vi' ? 'NHẬP MÃ' : 'ENTER CODE'}
                value={roomInput}
                onChange={(e) => setRoomInput(e.target.value.toUpperCase())}
                maxLength={6}
                className="w-3/4 max-w-[150px] bg-white/95 border-3 border-[var(--pop-black)] rounded-lg px-2.5 py-1.5 text-[var(--pop-black)] font-headline font-black uppercase tracking-widest text-center text-sm md:text-base focus:outline-none focus:bg-white focus:scale-105 transition-all shadow-[inset_2px_2px_0px_0px_#cbd5e1] focus:shadow-[3px_3px_0_var(--pop-black)]"
              />
            </div>
          }
        />
      </div>
    </>
  );
}
