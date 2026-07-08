import React from 'react';
import { useGameContext } from '../GameContext.jsx';

export default function PublicRoomList() {
  const props = useGameContext();
  const {
    LockIcon,
    PixelBombIcon,
    PixelSkullIcon,
    PixelStarIcon,
    handleJoinRoomCode,
    language,
    publicRooms,
    setCreatePassword,
    setCreateRoomStep,
    setIsCreatingRoom,
    setLobbyEdition,
    setLobbyMaxPlayers,
    setRoomPrivacy,
    t,
  } = props;

  return (
    <>
      {/* Active Games List Table */}
      <div className="bg-white border-3 border-on-surface shadow-[6px_6px_0px_0px_#1a1c1c] rounded-2xl overflow-hidden mb-6">
        <div className="bg-on-surface px-6 py-4 flex items-center text-white border-b-3 border-on-surface">
          <h3 className="font-headline font-black text-sm uppercase tracking-wider">
            ACTIVE GAMES
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b-3 border-on-surface bg-slate-50 text-[10px] font-headline font-black uppercase text-on-surface">
                <th className="py-3.5 px-6">ROOM CODE</th>
                <th className="py-3.5 px-6">HOST</th>
                <th className="py-3.5 px-6">EDITION</th>
                <th className="py-3.5 px-6 text-center">BET</th>
                <th className="py-3.5 px-6 text-center">PLAYERS</th>
                <th className="py-3.5 px-6 text-center">STATUS</th>
                <th className="py-3.5 px-6 text-right">ACTION</th>
              </tr>
            </thead>
            <tbody className="divide-y-2 divide-slate-100 font-sans font-bold text-xs text-on-surface">
              {publicRooms.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-12 px-6 text-center bg-slate-50/50">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <span className="material-symbols-outlined text-5xl text-[var(--pop-red)] animate-bounce">
                        sentiment_dissatisfied
                      </span>
                      <h4 className="font-pop-display font-black text-lg text-on-surface uppercase tracking-tight">
                        {language === 'vi' ? 'Không có phòng nào đang mở' : 'No Active Rooms'}
                      </h4>
                      <p className="font-pop-body text-xs text-on-surface/60 max-w-sm font-semibold">
                        {language === 'vi'
                          ? 'Không có phòng công khai nào đang chờ... Hãy tự tạo phòng đấu của riêng bạn để cùng chiến!'
                          : 'No public games are currently waiting. Create your own room and invite your friends!'}
                      </p>
                      <button
                        onClick={() => {
                          setIsCreatingRoom(true);
                          setLobbyEdition('original');
                          setLobbyMaxPlayers(5);
                          setCreatePassword('');
                          setCreateRoomStep(1);
                          setRoomPrivacy('public');
                        }}
                        className="btn-retro-pixel btn-shine-container px-4 py-2 mt-2 bg-[var(--pop-green)] text-xs text-[var(--pop-black)] shadow-[3px_3px_0_var(--pop-black)] font-black"
                      >
                        {language === 'vi' ? 'TẠO PHÒNG NGAY' : 'CREATE ROOM NOW'}
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                publicRooms.map((room) => {
                  const isFull = room.players.length >= room.maxPlayers;

                  const renderEditionBadge = (edition) => {
                    let icon = null;
                    let colorClass = "";
                    if (edition === 'zombie') {
                      icon = <PixelSkullIcon size={12} className="mr-1 text-emerald-600" />;
                      colorClass = "bg-emerald-50 border-emerald-200 text-emerald-800";
                    } else if (edition === 'imploding') {
                      icon = <PixelBombIcon size={12} className="mr-1 text-rose-600" />;
                      colorClass = "bg-rose-50 border-rose-200 text-rose-800";
                    } else {
                      icon = <PixelStarIcon size={12} className="mr-1 text-amber-500" />;
                      colorClass = "bg-amber-50 border-amber-200 text-amber-800";
                    }

                    return (
                      <span className={`inline-flex items-center text-[10px] font-pop-accent font-black border-2 px-2.5 py-0.5 rounded-lg uppercase tracking-wide ${colorClass}`}>
                        {icon}
                        {t('edition_' + edition + '_name') || edition}
                      </span>
                    );
                  };

                  return (
                    <tr
                      key={room.code}
                      onClick={() => !isFull && handleJoinRoomCode(room.code, room.password)}
                      className="hover:bg-slate-50/80 transition-colors cursor-pointer"
                    >
                      <td className="py-4 px-6 font-headline font-black text-primary uppercase text-sm flex items-center gap-2">
                        {room.code}
                        {room.hasPassword && <LockIcon className="w-4 h-4 text-slate-400" strokeWidth={2.5} />}
                      </td>
                      <td className="py-4 px-6 font-bold">{room.players[0]?.username || 'Ẩn danh'}</td>
                      <td className="py-4 px-6">
                        {renderEditionBadge(room.edition)}
                      </td>
                      <td className="py-4 px-6 text-center font-black text-[#ff5722]">
                        {room.betAmount || 50}
                      </td>
                      <td className="py-4 px-6 text-center">
                        <div className="flex flex-col items-center justify-center">
                          <span className={`font-headline font-black text-xs ${isFull ? 'text-rose-600' : 'text-on-surface'}`}>
                            {room.players.length}/{room.maxPlayers}
                          </span>
                          <div className="flex items-center gap-0.5 mt-1">
                            {Array.from({ length: room.maxPlayers }).map((_, i) => (
                              <div
                                key={i}
                                className={`w-1.5 h-3 rounded-[1px] border border-[#1a1c1c]
                                  ${i < room.players.length ? 'bg-[var(--pop-green)]' : 'bg-slate-200'}`}
                              />
                            ))}
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-center">
                        <span className={`inline-block px-2.5 py-0.5 text-[9px] font-headline font-black rounded-md border-2
                          ${isFull
                            ? 'bg-rose-100 border-rose-300 text-rose-700'
                            : 'bg-emerald-100 border-emerald-300 text-emerald-700'}`}
                        >
                          {isFull ? 'FULL' : 'WAITING'}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-right" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => handleJoinRoomCode(room.code, room.password)}
                          disabled={isFull}
                          className={`btn-retro-pixel px-4 py-1.5 font-headline font-black uppercase text-[10px] tracking-wider
                            ${isFull
                              ? 'bg-neutral-100 border-neutral-300 text-neutral-400 cursor-not-allowed shadow-none translate-y-[3px]'
                              : 'bg-yellow-400 border-on-surface text-slate-950 shadow-[2px_2px_0px_0px_#1a1c1c] active:translate-y-[2px] active:shadow-[1px_1px_0px_0px_#1a1c1c]'}`}
                        >
                          {isFull ? 'FULL' : 'JOIN'}
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
