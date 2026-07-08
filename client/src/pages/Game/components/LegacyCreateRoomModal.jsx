import React from 'react';
import { useGameContext } from '../GameContext.jsx';

export default function LegacyCreateRoomModal() {
  const props = useGameContext();
  const {
    CheckIcon,
    ExtensionIcon,
    ImageButton,
    LockIcon,
    createPassword,
    createRoom,
    editionsList,
    isCreateModalOpen,
    isEditionDropdownOpen,
    lobbyBetAmount,
    lobbyEdition,
    setCreatePassword,
    setIsCreateModalOpen,
    setIsEditionDropdownOpen,
    setLobbyBetAmount,
    setLobbyEdition,
    t,
  } = props;

  return (
    <>
      {/* Modal tạo phòng */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
          <div className="bg-white border-4 border-on-surface shadow-[8px_8px_0px_0px_#1a1c1c] rounded-3xl p-6 w-full max-w-md flex flex-col gap-5 relative text-left">
            <button
              onClick={() => setIsCreateModalOpen(false)}
              className="absolute top-4 right-4 font-headline font-black text-on-surface hover:scale-110 active:scale-95 text-lg"
            >
              x
            </button>

            <div>
              <h3 className="font-headline font-black text-xl text-on-surface uppercase tracking-tight">TẠO PHÒNG MỚI</h3>
              <p className="text-[10px] font-bold text-on-surface-variant mt-0.5">Thiết lập các thông số đấu trường của bạn.</p>
            </div>

            <div className="flex flex-col gap-4 border-2 border-on-surface bg-slate-50 p-4 rounded-2xl shadow-[2.5px_2.5px_0px_0px_#1a1c1c]">
              <div className="flex justify-between items-center text-xs font-bold text-on-surface relative">
                <span className="flex items-center gap-1.5"><ExtensionIcon className="w-4 h-4 text-on-surface" strokeWidth={2.5} /> Phiên bản:</span>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setIsEditionDropdownOpen(!isEditionDropdownOpen)}
                    className="bg-white border-2 border-on-surface px-3 py-1.5 rounded-xl text-xs font-headline font-black focus:outline-none flex items-center gap-1.5 hover:bg-slate-100 transition-all shadow-[1.5px_1.5px_0px_0px_#1a1c1c] active:translate-y-0.5 active:shadow-none min-w-[155px] justify-between text-slate-950"
                  >
                    <span>{t('edition_' + lobbyEdition + '_name')}</span>
                    <span className={`text-[9px] transition-transform duration-200 ${isEditionDropdownOpen ? 'rotate-180' : ''}`}>▼</span>
                  </button>
                  {isEditionDropdownOpen && (
                    <>
                      <div
                        className="fixed inset-0 z-40"
                        onClick={() => setIsEditionDropdownOpen(false)}
                      />
                      <div className="absolute right-0 mt-2 w-60 bg-white border-2 border-on-surface rounded-2xl shadow-[4px_4px_0px_0px_#1a1c1c] z-50 overflow-hidden py-1 max-h-64 overflow-y-auto animate-fade-in custom-scrollbar">
                        {editionsList.map((key) => (
                          <button
                            key={key}
                            type="button"
                            onClick={() => {
                              setLobbyEdition(key);
                              setIsEditionDropdownOpen(false);
                            }}
                            className={`w-full text-left px-4 py-2.5 text-xs font-headline font-black hover:bg-[#b7131a] hover:text-white transition-all flex items-center justify-between uppercase tracking-wider text-slate-900
                              ${lobbyEdition === key ? 'bg-slate-100 text-[#b7131a] border-l-4 border-[#b7131a]' : ''}`}
                          >
                            <span>{t('edition_' + key + '_name')}</span>
                            {lobbyEdition === key && <CheckIcon className="w-3.5 h-3.5 text-[#b7131a]" strokeWidth={3.5} />}
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </div>

              <div className="flex flex-col gap-1.5 text-xs font-bold text-on-surface">
                <span className="flex items-center gap-1.5"><LockIcon className="w-4 h-4 text-on-surface" strokeWidth={2.5} /> Mật khẩu phòng (nếu muốn):</span>
                <input
                  type="password"
                  placeholder="Nhập mật khẩu..."
                  value={createPassword}
                  onChange={(e) => setCreatePassword(e.target.value)}
                  className="bg-white border-2 border-on-surface px-3 py-2 rounded-xl text-xs font-bold focus:outline-none focus:bg-slate-100 transition-all w-full"
                />
              </div>

              <div className="flex flex-col gap-1.5 text-xs font-bold text-on-surface mt-2">
                <span className="flex items-center gap-1.5">Tiền cược (GoldCoin):</span>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min="0"
                    max="1000"
                    step="10"
                    value={lobbyBetAmount}
                    onChange={(e) => setLobbyBetAmount(Number(e.target.value))}
                    className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                  />
                  <span className="font-bold text-[#ff5722] min-w-[40px] text-right">{lobbyBetAmount}</span>
                </div>
              </div>
            </div>

            <ImageButton
              variant="primary"
              size="lg"
              onClick={() => {
                createRoom(createPassword, lobbyEdition, 5, lobbyBetAmount);
                setIsCreateModalOpen(false);
              }}
              className="w-full font-headline font-black uppercase text-xs"
            >
              XÁC NHẬN TẠO PHÒNG
            </ImageButton>
          </div>
        </div>
      )}
    </>
  );
}
