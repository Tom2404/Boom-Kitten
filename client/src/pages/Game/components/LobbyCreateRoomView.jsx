import React from 'react';
import { useGameContext } from '../GameContext.jsx';
import CreateRoomDesktopLayout from './CreateRoomDesktopLayout.jsx';
import CreateRoomMobileLayout from './CreateRoomMobileLayout.jsx';

export default function LobbyCreateRoomView() {
  const { errorToast, language, setIsCreatingRoom } = useGameContext();

  return (
    <div className="w-full max-w-6xl mx-auto my-6 flex flex-col gap-6 animate-fade-in text-left bg-[#FFF5C3] border-4 border-[#1A1C1C] shadow-[8px_8px_0px_#1A1C1C] p-6 md:p-8 text-[#1A1C1C] font-pixel-body select-none">
      {errorToast}
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b-4 border-[#1A1C1C] pb-3 gap-3">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="font-pixel-title text-2xl md:text-4xl text-[#1A1C1C] uppercase tracking-tight py-1 select-none">
              CREATE
            </h1>
            <div
              className="font-pixel-title text-2xl md:text-4xl bg-[#E63946] text-white px-3.5 py-1 rounded-none border-4 border-[#1A1C1C] shadow-[4px_4px_0_#1A1C1C] tracking-tight transform rotate-2 select-none"
              style={{ textShadow: '1.5px 1.5px 0px #1a1c1c' }}
            >
              ROOM
            </div>
          </div>
          <p className="text-[10px] md:text-[11px] font-bold text-[#1A1C1C]/80 mt-2 max-w-xl leading-relaxed">
            {language === 'vi'
              ? 'Tập hợp các chiến binh mèo của bạn và chuẩn bị cho sự hỗn loạn bùng nổ. Chọn phiên bản hủy diệt bên dưới.'
              : 'Assemble your feline warriors and prepare for explosive chaos. Choose your flavor of destruction below.'}
          </p>
        </div>
        <button
          onClick={() => setIsCreatingRoom(false)}
          className="btn-retro-pixel bg-[#4CC9F0] text-[#1A1C1C] font-pixel-title text-[9px] px-4 py-2 uppercase tracking-wider text-center shadow-[3px_3px_0_#1A1C1C] hover:translate-y-[-1.5px] hover:shadow-[4.5px_4.5px_0_#1A1C1C] active:translate-y-[1.5px] active:shadow-[1px_1px_0_#1A1C1C]"
        >
          {language === 'vi' ? '← SẢNH CHỜ' : '← BACK TO LOBBY'}
        </button>
      </div>

      {/* Responsive Layout Switcher */}
      <CreateRoomDesktopLayout />
      <CreateRoomMobileLayout />
    </div>
  );
}
