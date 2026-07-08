import React from 'react';
import { useGameContext } from '../GameContext.jsx';

export default function WaitingRoomView() {
  const props = useGameContext();
  const {
    CheckIcon,
    CoinIcon,
    CrownIcon,
    LogoutIcon,
    copied,
    copyIcon,
    doorIcon,
    errorToast,
    getAvatarBgColor,
    getCardImageUrl,
    handleCopyCode,
    handleLeaveConfirm,
    isEditRoomModalOpen,
    isHost,
    kickPlayer,
    language,
    lobbyBetAmount,
    lobbyCustomDefuses,
    lobbyCustomExplodingKittens,
    lobbyEdition,
    lobbyMaxPlayers,
    myUser,
    roomState,
    setIsEditRoomModalOpen,
    setLobbyBetAmount,
    setLobbyCustomDefuses,
    setLobbyCustomExplodingKittens,
    setLobbyEdition,
    setLobbyMaxPlayers,
    startGame,
    t,
    toggleReady,
    updateRoomSettings,
  } = props;

  if (roomState.status === 'waiting') {
    return (
      <div className="w-full min-h-[calc(100vh-4rem)] flex justify-center items-center p-5 bg-[var(--pop-black)] text-[var(--pop-black)] animate-fade-in relative z-10 overflow-hidden">
        {errorToast}
        {/* Floating Background Cards */}
        <div className="absolute inset-0 pointer-events-none z-0 opacity-30">
          <img src={getCardImageUrl('defuse')} className="absolute top-10 left-10 w-32 md:w-48 rotate-[-15deg] drop-shadow-xl" alt="" />
          <img src={getCardImageUrl('exploding')} className="absolute bottom-10 left-20 w-36 md:w-56 rotate-[20deg] drop-shadow-xl" alt="" />
          <img src={getCardImageUrl('attack')} className="absolute top-20 right-10 w-40 md:w-52 rotate-[10deg] drop-shadow-xl" alt="" />
          <img src={getCardImageUrl('skip')} className="absolute bottom-20 right-32 w-28 md:w-40 rotate-[-30deg] drop-shadow-xl" alt="" />
          <img src={getCardImageUrl('shuffle')} className="absolute top-1/2 left-5 w-24 md:w-32 rotate-[-45deg] drop-shadow-xl" alt="" />
          <img src={getCardImageUrl('favor')} className="absolute top-1/2 right-10 w-24 md:w-32 rotate-[45deg] drop-shadow-xl" alt="" />
        </div>

        {/* LOBBY CONTAINER */}
        <div className="bg-[var(--pop-cream)] border-[6px] border-white rounded-lg p-5 w-full max-w-[1000px] shadow-[8px_8px_0_white] flex flex-col gap-5 relative z-10">

          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between items-center border-b-4 border-dashed border-[var(--pop-black)] pb-3 gap-4">
            <h1 className="font-pop-display font-black text-3xl md:text-4xl m-0 text-white uppercase tracking-wider" style={{ textShadow: '3px 3px 0px var(--pop-black), -2px -2px 0px var(--pop-black), 2px -2px 0px var(--pop-black), -2px 2px 0px var(--pop-black)' }}>
              MÈO NỔ - SẢNH CHỜ
            </h1>

            <div className="flex items-center gap-4 text-xl font-pop-accent font-black">
              <span className="flex items-center gap-2">
                MÃ PHÒNG:
                <span className="bg-white px-3 py-1 border-2 border-[var(--pop-black)] shadow-[2px_2px_0_var(--pop-black)] text-[var(--pop-black)] flex items-center gap-2">
                  {roomState.code}
                  <button
                    onClick={() => handleCopyCode(roomState.code)}
                    className="hover:scale-110 transition-transform"
                    title="Sao chép"
                  >
                    {copied ? (
                      <CheckIcon className="w-4 h-4 text-[var(--pop-green)]" strokeWidth={4} />
                    ) : (
                      <img src={copyIcon} className="w-5 h-5 object-contain opacity-80 hover:opacity-100" alt="Copy" />
                    )}
                  </button>
                </span>
              </span>
              <span className="text-sm bg-[var(--pop-black)] text-white px-2 py-1 rounded-sm shadow-[2px_2px_0_white]">
                {t('edition_' + roomState.edition + '_name') || roomState.edition}
              </span>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex flex-col lg:flex-row gap-5">

            {/* Player List */}
            <div className="flex-[2] grid grid-cols-1 sm:grid-cols-2 gap-4 content-start">

              {roomState.players.map((player) => {
                const isMe = player.userId === myUser.id;
                const isPlayerHost = roomState.host === player.userId;

                return (
                  <div
                    key={player.userId}
                    className={`bg-white border-4 p-3 flex items-center gap-4 shadow-[inset_-3px_-3px_0_rgba(0,0,0,0.05),4px_4px_0_rgba(0,0,0,0.2)] relative transition-transform ${isMe ? 'border-[var(--pop-amber)] scale-[1.02]' : 'border-[var(--pop-black)] hover:scale-[1.02]'}`}
                  >
                    <div
                      className="w-[50px] h-[50px] bg-[#ddd] border-2 border-[var(--pop-black)] flex justify-center items-center font-pop-display font-black text-2xl uppercase shrink-0"
                      style={{ backgroundColor: getAvatarBgColor(player.username || player.userId) }}
                    >
                      {player.username ? player.username.slice(0, 2) : player.userId.slice(0, 2)}
                    </div>

                    <div className="flex-1 overflow-hidden">
                      <div className="flex items-center gap-2">
                        <h3 className="font-pop-accent font-black text-lg m-0 truncate text-[var(--pop-black)]">
                          {player.username || player.userId}
                        </h3>
                        {isPlayerHost && <CrownIcon className="w-4 h-4 text-[var(--pop-amber)] shrink-0" strokeWidth={3} title="Trưởng phòng" />}
                      </div>
                      <p className="font-pop-body text-[10px] uppercase m-0 mt-0.5 text-[var(--pop-black)]/70">
                        {isMe ? 'Bạn' + (isPlayerHost ? ' (Chủ phòng)' : '') : (isPlayerHost ? 'Chủ phòng' : 'Người chơi')}
                      </p>
                      <p className={`font-pop-display font-black text-xs uppercase m-0 mt-1 ${player.isReady ? 'text-[var(--pop-green)]' : 'text-[var(--pop-red)]'}`}>
                        {player.isReady ? 'SẴN SÀNG ✔' : 'CHƯA SẴN SÀNG ✖'}
                      </p>
                    </div>

                    {isHost && !isMe && (
                      <button
                        onClick={() => kickPlayer(player.userId)}
                        className="absolute -top-2 -right-2 bg-[var(--pop-red)] text-white p-1 border-2 border-[var(--pop-black)] rounded-full hover:scale-110 active:scale-95 shadow-[2px_2px_0_var(--pop-black)]"
                        title="Mời ra ngoài"
                      >
                        <LogoutIcon className="w-3 h-3" strokeWidth={3} />
                      </button>
                    )}
                  </div>
                );
              })}

              {/* Empty Slots */}
              {Array.from({ length: (roomState.edition === '2_player' ? 2 : (roomState.edition === 'imploding' ? 6 : 5)) - roomState.players.length }).map((_, i) => (
                <div key={`empty-${i}`} className="bg-white/50 border-4 border-dashed border-[var(--pop-black)]/40 p-3 flex items-center justify-center h-[82px]">
                  <p className="font-pop-accent font-black text-[var(--pop-black)]/60 uppercase m-0 text-sm">Đang chờ...</p>
                </div>
              ))}

            </div>

            {/* Sidebar */}
            <div className="flex-[1] flex flex-col gap-4 content-start">

              {/* Cài đặt phòng */}
              <div className="bg-white border-4 border-[var(--pop-black)] p-4 shadow-[4px_4px_0_rgba(0,0,0,0.2)]">
                <div className="flex justify-between items-center border-b-2 border-[var(--pop-black)] pb-2 mb-3">
                  <h3 className="font-pop-display font-black text-sm uppercase m-0 text-[var(--pop-black)]">
                    CÀI ĐẶT PHÒNG
                  </h3>
                  {isHost && (
                    <button
                      onClick={() => {
                        setLobbyEdition(roomState.edition || 'original');
                        setLobbyMaxPlayers(roomState.maxPlayers || 5);
                        setLobbyCustomDefuses(roomState.customDefuses ?? '');
                        setLobbyCustomExplodingKittens(roomState.customExplodingKittens ?? '');
                        setLobbyBetAmount(roomState.betAmount ?? 50);
                        setIsEditRoomModalOpen(true);
                      }}
                      className="bg-[var(--pop-amber)] text-[var(--pop-black)] border-2 border-[var(--pop-black)] px-2 py-0.5 text-xs font-black shadow-[2px_2px_0_var(--pop-black)] hover:translate-y-[1px] hover:shadow-[1px_1px_0_var(--pop-black)] active:shadow-none"
                    >
                      SỬA
                    </button>
                  )}
                </div>

                <div className="flex flex-col gap-2 text-sm font-pop-accent text-[var(--pop-black)]">
                  <div className="flex justify-between items-center">
                    <span>Thời gian:</span>
                    <strong className="bg-[var(--pop-cream)] border-2 border-[var(--pop-black)] px-2 py-0.5 text-xs">30s/lượt</strong>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Chế độ:</span>
                    <strong className="bg-[var(--pop-cream)] border-2 border-[var(--pop-black)] px-2 py-0.5 text-xs truncate max-w-[150px]">{t('edition_' + roomState.edition + '_name') || roomState.edition}</strong>
                  </div>
                  <div className="flex justify-between items-center mt-2 pt-2 border-t border-dashed border-[var(--pop-black)]/50">
                    <span className="flex items-center gap-1">
                      <CoinIcon className="w-4 h-4 text-[var(--pop-amber)]" /> Cược:
                    </span>
                    <strong className="text-[var(--pop-amber)] text-lg font-black" style={{ textShadow: '1px 1px 0 var(--pop-black)' }}>{roomState.betAmount || 50}</strong>
                  </div>
                </div>
              </div>

              {/* Chat */}
              <div className="bg-white border-4 border-[var(--pop-black)] p-4 shadow-[4px_4px_0_rgba(0,0,0,0.2)] flex flex-col flex-grow min-h-[220px]">
                <h3 className="font-pop-display font-black text-sm uppercase m-0 text-[var(--pop-black)] border-b-2 border-[var(--pop-black)] pb-2 mb-3">
                  CHAT
                </h3>

                <div className="bg-[var(--pop-cream)] border-[3px] border-inset border-[var(--pop-black)] p-2 h-[120px] overflow-y-auto font-pop-body text-xs flex flex-col gap-1 mb-2 shadow-inner">
                  <div className="text-[var(--pop-black)]/50 italic text-center py-2">Tính năng chat sắp ra mắt...</div>
                </div>

                <form className="flex gap-2" onSubmit={(e) => e.preventDefault()}>
                  <input
                    type="text"
                    className="w-full box-border border-[3px] border-[var(--pop-black)] p-1.5 font-pop-body text-sm outline-none focus:bg-[#fdf2e9]"
                    placeholder="Nhập tin nhắn..."
                    disabled
                  />
                  <button type="button" className="bg-[var(--pop-black)] text-white border-[3px] border-[var(--pop-black)] px-3 font-pop-accent font-black text-xs uppercase hover:bg-slate-800" disabled>
                    GỬI
                  </button>
                </form>
              </div>

            </div>
          </div>

          {/* Footer (Buttons) */}
          <div className="flex justify-center flex-wrap gap-5 mt-3 pt-4 border-t-4 border-dashed border-[var(--pop-black)]">

            {!isHost ? (
              <button
                onClick={() => toggleReady(!roomState.players.find(p => p.userId === myUser?.id)?.isReady)}
                className={`font-pop-display font-black text-xl md:text-2xl px-6 py-3 border-[4px] border-[var(--pop-black)] uppercase shadow-[0_6px_0_var(--pop-black)] transition-all hover:brightness-110 active:shadow-[0_0px_0_var(--pop-black)] active:translate-y-[6px] ${roomState.players.find(p => p.userId === myUser?.id)?.isReady ? 'bg-[var(--pop-red)] text-white' : 'bg-[var(--pop-green)] text-white'}`}
              >
                {roomState.players.find(p => p.userId === myUser?.id)?.isReady ? 'HỦY SẴN SÀNG' : 'SẴN SÀNG'}
              </button>
            ) : null}

            {isHost ? (
              <button
                onClick={startGame}
                disabled={roomState.players.length < 2 || roomState.players.some(p => p.userId !== roomState.host && !p.isReady)}
                className={`font-pop-display font-black text-xl md:text-2xl px-6 py-3 border-[4px] border-[var(--pop-black)] uppercase transition-all ${(roomState.players.length < 2 || roomState.players.some(p => p.userId !== roomState.host && !p.isReady)) ? 'bg-slate-400 text-white cursor-not-allowed shadow-[0_6px_0_#475569]' : 'bg-[var(--pop-green)] text-white shadow-[0_6px_0_var(--pop-black)] hover:brightness-110 active:shadow-[0_0px_0_var(--pop-black)] active:translate-y-[6px]'}`}
              >
                BẮT ĐẦU ({roomState.players.filter(p => p.isReady).length}/{roomState.players.length})
              </button>
            ) : null}

            {/* Thoát phòng */}
            <button
              onClick={handleLeaveConfirm}
              className="absolute top-2 right-2 md:static font-pop-display font-black text-sm px-4 py-2 border-[3px] border-[var(--pop-black)] bg-white text-[var(--pop-black)] uppercase shadow-[0_4px_0_var(--pop-black)] transition-all hover:bg-[var(--pop-cream)] active:shadow-[0_0px_0_var(--pop-black)] active:translate-y-[4px] flex items-center gap-2"
            >
      <img src={doorIcon} className="w-5 h-5 object-contain" alt="Exit" />
      <span>THOÁT</span>
    </button>

          </div>

        </div>

        {/* Edit Room Modal */}
        {isEditRoomModalOpen && isHost && (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
            <div className="bg-[var(--pop-cream)] border-[6px] border-[var(--pop-black)] shadow-[8px_8px_0_var(--pop-black)] p-6 w-full max-w-md flex flex-col gap-5 relative text-[var(--pop-black)]">
              <button
                onClick={() => setIsEditRoomModalOpen(false)}
                className="absolute -top-4 -right-4 bg-[var(--pop-red)] text-white w-10 h-10 border-4 border-[var(--pop-black)] rounded-full font-pop-display font-black text-xl flex justify-center items-center hover:scale-110 active:scale-95 shadow-[2px_2px_0_var(--pop-black)]"
              >
                X
              </button>

              <div className="border-b-4 border-dashed border-[var(--pop-black)] pb-3 text-center">
                <h3 className="font-pop-display font-black text-2xl uppercase tracking-tight m-0 text-white" style={{ textShadow: '2px 2px 0px var(--pop-black), -2px -2px 0px var(--pop-black), 2px -2px 0px var(--pop-black), -2px 2px 0px var(--pop-black)' }}>CÀI ĐẶT PHÒNG</h3>
                <p className="text-xs font-pop-accent font-black text-[var(--pop-black)]/80 mt-1 uppercase">Người chơi khác sẽ bị huỷ sẵn sàng.</p>
              </div>

              <div className="flex flex-col gap-4 bg-white border-4 border-[var(--pop-black)] p-4 shadow-[inset_2px_2px_0_rgba(0,0,0,0.1)]">

                {/* Edition Select */}
                <div className="flex flex-col gap-2">
                  <span className="font-pop-accent font-black text-sm uppercase">
                    {language === 'vi' ? 'Chế độ chơi' : 'Edition'}
                  </span>
                  <select
                    value={lobbyEdition}
                    onChange={(e) => {
                      setLobbyEdition(e.target.value);
                      const maxL = e.target.value === '2_player' ? 2 : (e.target.value === 'imploding' ? 6 : 5);
                      if (lobbyMaxPlayers > maxL || e.target.value === '2_player') {
                        setLobbyMaxPlayers(maxL);
                      }
                    }}
                    className="bg-white border-[3px] border-[var(--pop-black)] px-2 py-2 text-sm font-black w-full outline-none focus:bg-[var(--pop-cream)]"
                  >
                    <option value="original">{t('edition_original_name')}</option>
                    <option value="imploding">{t('edition_imploding_name')}</option>
                    <option value="streaking">{t('edition_streaking_name')}</option>
                    <option value="zombie">{t('edition_zombie_name')}</option>
                    <option value="barking">{t('edition_barking_name')}</option>
                    <option value="good_vs_evil">{t('edition_good_vs_evil_name')}</option>
                    <option value="2_player">{t('edition_2_player_name')}</option>
                  </select>
                </div>

                {/* Max Players */}
                <div className="flex flex-col gap-2">
                  <span className="font-pop-accent font-black text-sm uppercase">
                    {language === 'vi' ? 'Số người chơi tối đa' : 'Max Players'}
                  </span>
                  <input
                    type="range"
                    min="2"
                    max={lobbyEdition === '2_player' ? 2 : (lobbyEdition === 'imploding' ? 6 : 5)}
                    value={lobbyMaxPlayers}
                    onChange={(e) => setLobbyMaxPlayers(Number(e.target.value))}
                    className="brutal-slider"
                  />
                  <div className="text-center font-pop-display font-black text-xl text-[var(--pop-amber)]" style={{ textShadow: '1px 1px 0 var(--pop-black)' }}>{lobbyMaxPlayers} NGƯỜI</div>
                </div>

                {/* Bet Amount */}
                <div className="flex flex-col gap-2">
                  <span className="font-pop-accent font-black text-sm uppercase">
                    {language === 'vi' ? 'Mức cược' : 'Bet Amount'}
                  </span>
                  <div className="flex gap-2 items-center">
                    <input
                      type="number"
                      min={0}
                      step={10}
                      value={lobbyBetAmount}
                      onChange={(e) => setLobbyBetAmount(Number(e.target.value))}
                      className="bg-white border-[3px] border-[var(--pop-black)] px-3 py-2 text-xl font-black w-full outline-none focus:bg-[var(--pop-cream)] font-pop-display"
                    />
                    <span className="font-pop-accent font-black text-[var(--pop-black)]">
                      <span className="text-yellow-500 material-symbols-outlined text-3xl drop-shadow-[1px_1px_0_var(--pop-black)]">monetization_on</span>
                    </span>
                  </div>
                </div>

                {/* Custom Difficulties */}
                <div className="flex gap-4">
                  <div className="flex flex-col gap-2 w-1/2">
                    <span className="font-pop-accent font-black text-[10px] uppercase leading-tight">
                      {language === 'vi' ? 'Số Defuse (Tùy chọn)' : 'Custom Defuses'}
                    </span>
                    <input
                      type="number"
                      min={0}
                      max={8}
                      placeholder="Mặc định"
                      value={lobbyCustomDefuses}
                      onChange={(e) => setLobbyCustomDefuses(e.target.value)}
                      className="bg-white border-[3px] border-[var(--pop-black)] px-2 py-2 text-sm font-black w-full text-center outline-none focus:bg-[var(--pop-cream)]"
                    />
                  </div>
                  <div className="flex flex-col gap-2 w-1/2">
                    <span className="font-pop-accent font-black text-[10px] uppercase leading-tight">
                      {language === 'vi' ? 'Số Bomb (Tùy chọn)' : 'Custom Bombs'}
                    </span>
                    <input
                      type="number"
                      min={0}
                      max={8}
                      placeholder="Mặc định"
                      value={lobbyCustomExplodingKittens}
                      onChange={(e) => setLobbyCustomExplodingKittens(e.target.value)}
                      className="bg-white border-[3px] border-[var(--pop-black)] px-2 py-2 text-sm font-black w-full text-center outline-none focus:bg-[var(--pop-cream)]"
                    />
                  </div>
                </div>

              </div>

              <button
                onClick={() => {
                  const defuses = lobbyCustomDefuses === '' ? undefined : parseInt(lobbyCustomDefuses, 10);
                  const kittens = lobbyCustomExplodingKittens === '' ? undefined : parseInt(lobbyCustomExplodingKittens, 10);
                  updateRoomSettings({
                    edition: lobbyEdition,
                    maxPlayers: lobbyMaxPlayers,
                    betAmount: lobbyBetAmount,
                    customDefuses: defuses,
                    customExplodingKittens: kittens,
                  });
                  setIsEditRoomModalOpen(false);
                }}
                className="w-full bg-[var(--pop-amber)] text-white border-[4px] border-[var(--pop-black)] py-3 font-pop-display font-black uppercase text-xl shadow-[0_6px_0_var(--pop-black)] hover:brightness-110 active:shadow-[0_0px_0_var(--pop-black)] active:translate-y-[6px] transition-all"
                style={{ textShadow: '2px 2px 0 var(--pop-black)' }}
              >
                LƯU CÀI ĐẶT
              </button>
            </div>
          </div>
        )}

      </div>
    );
  }

  return null;
}
