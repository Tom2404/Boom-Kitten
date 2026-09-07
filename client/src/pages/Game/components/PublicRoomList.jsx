import React, { useState } from 'react';
import { useGameContext } from '../GameContext.jsx';
import Pager from '../../../components/ui/Pager.jsx';
import pixelBombKitten from '../../../assets/ui/pixel_bomb_kitten.jpg';

const ROOMS_PER_PAGE = 8;

export default function PublicRoomList() {
  const props = useGameContext();
  const [page, setPage] = useState(0);
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

  const pageCount = Math.max(1, Math.ceil(publicRooms.length / ROOMS_PER_PAGE));
  const safePage = Math.min(page, pageCount - 1);
  const visibleRooms = publicRooms.slice(safePage * ROOMS_PER_PAGE, safePage * ROOMS_PER_PAGE + ROOMS_PER_PAGE);

  return (
    <>
      {/* Active Games List Table */}
      <div className="flex h-full min-h-0 flex-col bg-white border-3 border-on-surface shadow-[6px_6px_0px_0px_#1a1c1c] rounded-2xl overflow-hidden">
        <div className="bg-on-surface px-6 py-3 flex items-center justify-between text-white border-b-3 border-on-surface">
          <div className="flex items-center gap-2.5">
            <h3 className="font-headline font-black text-sm uppercase tracking-wider text-[var(--pop-amber)] drop-shadow-[1px_1px_0_#000]">
              ACTIVE GAMES
            </h3>
            <span className="inline-flex items-center gap-1 bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-[9px] font-pixel font-black px-2 py-0.5 rounded shadow-[1px_1px_0_#000]">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              LIVE
            </span>
          </div>
          <Pager
            page={safePage}
            pageCount={pageCount}
            onChange={setPage}
            label={language === 'vi' ? 'Phân trang danh sách phòng' : 'Room list pagination'}
            status={`${visibleRooms.length}/${publicRooms.length}`}
          />
        </div>
        {/* The one scroll owner of the Arena page: header stays put, rows scroll. */}
        <div className="flex min-h-0 flex-1 flex-col overflow-x-auto overflow-y-auto">
          {publicRooms.length === 0 ? (
            <div className="my-auto flex flex-col items-center justify-center gap-3 py-6 px-6 text-center bg-[radial-gradient(#FAC775_1px,transparent_1px)] [background-size:12px_12px] bg-[var(--pop-cream)]/20 rounded-2xl m-4 border-2 border-dashed border-slate-300">
              <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-2xl border-3 border-[var(--pop-black)] bg-[var(--pop-cream)] p-1 shadow-[4px_4px_0_var(--pop-black)] overflow-hidden">
                <img
                  src={pixelBombKitten}
                  alt="Empty room mascot"
                  className="w-full h-full object-cover rounded-xl"
                  style={{ imageRendering: 'pixelated' }}
                />
              </div>
              <h4 className="font-pop-display font-black text-lg text-on-surface uppercase tracking-tight">
                {language === 'vi' ? 'Không có phòng nào đang mở' : 'No Active Rooms'}
              </h4>
              <p className="font-pop-body text-xs text-on-surface/70 max-w-sm font-semibold">
                {language === 'vi'
                  ? 'Không có phòng công khai nào đang chờ... Hãy tự tạo phòng đấu của riêng bạn để cùng chiến!'
                  : 'No public games are currently waiting. Create your own room and invite your friends!'}
              </p>
              <button
                type="button"
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
          ) : (
            <table className="w-full text-left border-collapse">
              <thead className="vf-sticky-head">
                <tr className="border-b-3 border-on-surface bg-[#fff9ea] text-[10px] font-headline font-black uppercase text-on-surface">
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
                {visibleRooms.map((room) => {
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
                      className="hover:bg-amber-50/70 transition-colors cursor-pointer"
                    >
                      <td className="py-4 px-6 font-bold uppercase text-sm flex items-center gap-2">
                        <span className="font-pixel font-black text-xs text-[var(--pop-black)] bg-[var(--pop-cream)] px-2 py-0.5 rounded border border-[var(--pop-black)] shadow-[1.5px_1.5px_0_var(--pop-black)] tracking-wider">
                          #{room.code}
                        </span>
                        {room.hasPassword && <LockIcon className="w-4 h-4 text-slate-400" strokeWidth={2.5} />}
                      </td>
                      <td className="py-4 px-6 font-bold">{room.players[0]?.username || 'Ẩn danh'}</td>
                      <td className="py-4 px-6">
                        {renderEditionBadge(room.edition)}
                      </td>
                      <td className="py-4 px-6 text-center font-black text-[#ff5722]">
                        {room.betAmount ?? 50}
                      </td>
                      <td className="py-4 px-6 text-center">
                        <div className="flex flex-col items-center justify-center">
                          <span className={`font-pixel font-black text-xs ${isFull ? 'text-rose-600' : 'text-on-surface'}`}>
                            {room.players.length}/{room.maxPlayers}
                          </span>
                          <div className="flex items-center gap-1 mt-1">
                            {Array.from({ length: room.maxPlayers }).map((_, i) => (
                              <div
                                key={i}
                                className={`w-1.5 h-3 rounded-[1px] border border-[#1a1c1c] shadow-[0.5px_0.5px_0_#1a1c1c]
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
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </>
  );
}
