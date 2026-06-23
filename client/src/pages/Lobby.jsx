import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext.jsx';

export default function Lobby({ setPage }) {
  const { language, t } = useLanguage();
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEdition, setSelectedEdition] = useState('all');
  const [directCode, setDirectCode] = useState('');

  const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:5000';

  const fetchRooms = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/rooms`);
      if (res.ok) {
        const data = await res.json();
        setRooms(data);
      }
    } catch (e) {
      console.error('Error fetching rooms:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRooms();
    const interval = setInterval(fetchRooms, 6000);
    return () => clearInterval(interval);
  }, []);

  const handleJoinRoom = (code, password) => {
    localStorage.setItem('autoJoinRoomCode', code);
    if (password) {
      const pwd = window.prompt(language === 'vi' ? 'Nhập mật khẩu phòng:' : 'Enter room password:') || '';
      localStorage.setItem('autoJoinRoomPassword', pwd);
    }
    setPage('Game');
  };

  const handleDirectJoin = () => {
    if (directCode.length === 4) {
      localStorage.setItem('autoJoinRoomCode', directCode);
      setPage('Game');
    }
  };

  // Filter and search logic
  const filteredRooms = rooms.filter((room) => {
    const matchesSearch = room.code.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesEdition = selectedEdition === 'all' || room.edition === selectedEdition;
    return matchesSearch && matchesEdition;
  });

  return (
    <div className="bg-white border-3 border-[var(--pop-black)] shadow-[6px_6px_0_var(--pop-black)] rounded-none p-6 md:p-8 flex flex-col gap-6 w-full max-w-5xl mx-auto my-6 text-left font-pop-body text-[var(--pop-black)]">
      
      {/* Header section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b-3 border-[var(--pop-black)] pb-4 gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="font-pop-display font-black text-4xl md:text-5xl text-[var(--pop-black)] uppercase tracking-tight py-1 select-none">
              SẢNH CHỜ
            </h1>
            <div 
              className="font-pop-display font-black text-4xl md:text-5xl bg-[var(--pop-amber)] text-[var(--pop-black)] px-4 py-1.5 border-3 border-[var(--pop-black)] shadow-[4px_4px_0_var(--pop-black)] tracking-tight transform -rotate-2 select-none"
            >
              ARENA
            </div>
          </div>
          <p className="text-xs font-bold text-[var(--pop-black)]/60 mt-3 max-w-xl leading-relaxed uppercase tracking-wider">
            {language === 'vi' 
              ? 'Tìm phòng chơi công khai, gia nhập trận chiến mèo nổ hoặc tự tạo phòng đấu riêng.' 
              : 'Find public rooms, join the exploding kittens warfare, or launch your custom arena.'}
          </p>
        </div>
        <button
          onClick={() => setPage('Game')}
          className="bg-[var(--pop-red)] text-white border-3 border-[var(--pop-black)] px-5 py-3 shadow-[3px_3px_0_var(--pop-black)] text-xs font-pop-accent font-black hover:translate-y-[-2px] hover:shadow-[4.5px_4.5px_0_var(--pop-black)] active:translate-y-0.5 active:shadow-none transition-all uppercase cursor-pointer"
        >
          {language === 'vi' ? 'Tạo phòng của bạn ➕' : 'Create Room ➕'}
        </button>
      </div>

      {/* Inputs, search, and direct entry */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-stretch">
        {/* Quick Join box */}
        <div className="md:col-span-4 bg-[var(--pop-cream)] border-3 border-[var(--pop-black)] p-5 shadow-[4px_4px_0_var(--pop-black)] flex flex-col justify-between gap-4">
          <div>
            <h3 className="font-pop-display font-black text-sm text-[var(--pop-black)] uppercase border-b-2 border-[var(--pop-black)] pb-1.5 mb-3">
              {language === 'vi' ? 'VÀO NHANH BẰNG MÃ' : 'QUICK JOIN BY CODE'}
            </h3>
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-pop-accent font-black text-[var(--pop-black)] uppercase tracking-wider">
                {language === 'vi' ? 'Mã phòng (4 ký tự)' : 'Room Code (4 chars)'}
              </label>
              <input
                type="text"
                placeholder="E.g. A1B2"
                value={directCode}
                onChange={(e) => setDirectCode(e.target.value.toUpperCase().slice(0, 4))}
                className="bg-white border-3 border-[var(--pop-black)] rounded-none px-3 py-2 text-sm text-[var(--pop-black)] font-bold focus:outline-none focus:bg-[var(--pop-cream)] shadow-[2px_2px_0_var(--pop-black)] focus:shadow-[4px_4px_0_var(--pop-black)] focus:-translate-y-0.5 focus:-translate-x-0.5 transition-all text-center tracking-widest font-mono"
              />
            </div>
          </div>
          <button
            onClick={handleDirectJoin}
            disabled={directCode.length < 4}
            className="w-full py-2.5 bg-[var(--pop-red)] text-white border-3 border-[var(--pop-black)] shadow-[3px_3px_0_var(--pop-black)] font-pop-accent font-black uppercase text-xs cursor-pointer hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[4px_4px_0_var(--pop-black)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {language === 'vi' ? 'GIA NHẬP PHÒNG 🚀' : 'JOIN ROOM 🚀'}
          </button>
        </div>

        {/* Search filters */}
        <div className="md:col-span-8 bg-white border-3 border-[var(--pop-black)] p-5 shadow-[4px_4px_0_var(--pop-black)] flex flex-col justify-between gap-4">
          <div>
            <h3 className="font-pop-display font-black text-sm text-[var(--pop-black)] uppercase border-b-2 border-[var(--pop-black)] pb-1.5 mb-3">
              {language === 'vi' ? 'BỘ LỌC PHÒNG CHƠI' : 'ROOM FILTERS'}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-pop-accent font-black text-[var(--pop-black)] uppercase tracking-wider">
                  {language === 'vi' ? 'Tìm theo mã' : 'Search by code'}
                </label>
                <input
                  type="text"
                  placeholder={language === 'vi' ? 'Tìm phòng...' : 'Search rooms...'}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-white border-3 border-[var(--pop-black)] rounded-none px-3 py-2 text-xs text-[var(--pop-black)] font-bold focus:outline-none focus:bg-[var(--pop-cream)] shadow-[2px_2px_0_var(--pop-black)] focus:shadow-[4px_4px_0_var(--pop-black)] focus:-translate-y-0.5 focus:-translate-x-0.5 transition-all"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-pop-accent font-black text-[var(--pop-black)] uppercase tracking-wider">
                  {language === 'vi' ? 'Phiên bản' : 'Edition'}
                </label>
                <select
                  value={selectedEdition}
                  onChange={(e) => setSelectedEdition(e.target.value)}
                  className="bg-white border-3 border-[var(--pop-black)] rounded-none px-3 py-2 text-xs text-[var(--pop-black)] font-bold focus:outline-none focus:bg-[var(--pop-cream)] shadow-[2px_2px_0_var(--pop-black)] focus:shadow-[4px_4px_0_var(--pop-black)] focus:-translate-y-0.5 focus:-translate-x-0.5 transition-all"
                >
                  <option value="all">{language === 'vi' ? 'Tất Cả Phiên Bản' : 'All Editions'}</option>
                  <option value="original">{language === 'vi' ? 'Phiên Bản Gốc' : 'Original Edition'}</option>
                  <option value="2_player">{language === 'vi' ? '2 Người Chơi' : '2 Player'}</option>
                  <option value="zombie">{language === 'vi' ? 'Zombie' : 'Zombie'}</option>
                  <option value="barking">{language === 'vi' ? 'Barking' : 'Barking'}</option>
                  <option value="good_vs_evil">{language === 'vi' ? 'Thiện vs Ác' : 'Good vs Evil'}</option>
                  <option value="imploding">{language === 'vi' ? 'Nổ Tung' : 'Imploding'}</option>
                  <option value="streaking">{language === 'vi' ? 'Mèo Con Sọc' : 'Streaking'}</option>
                </select>
              </div>
            </div>
          </div>
          <div className="flex justify-end">
            <button
              onClick={fetchRooms}
              className="px-4 py-2 bg-white border-3 border-[var(--pop-black)] shadow-[2px_2px_0_var(--pop-black)] text-xs font-pop-accent font-black uppercase hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[3px_3px_0_var(--pop-black)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all cursor-pointer"
            >
              {language === 'vi' ? 'LÀM MỚI DANH SÁCH 🔄' : 'REFRESH LIST 🔄'}
            </button>
          </div>
        </div>
      </div>

      {/* Active rooms list */}
      <div className="flex flex-col gap-4">
        <h3 className="font-pop-display font-black text-lg text-[var(--pop-black)] uppercase border-b-3 border-[var(--pop-black)] pb-1.5 mt-2">
          {language === 'vi' ? 'CÁC PHÒNG ĐANG HOẠT ĐỘNG' : 'ACTIVE ROOMS'}
        </h3>

        {loading ? (
          <p className="text-center py-12 font-pop-accent font-black uppercase text-sm animate-pulse">
            {language === 'vi' ? 'Đang tìm kiếm phòng chơi...' : 'Loading active rooms...'}
          </p>
        ) : filteredRooms.length === 0 ? (
          <div className="border-3 border-dashed border-[var(--pop-black)]/30 rounded-none p-12 text-center bg-white flex flex-col items-center gap-3">
            <span className="text-5xl">🙀</span>
            <p className="font-pop-accent font-black text-sm uppercase text-[var(--pop-black)]/60">
              {language === 'vi' ? 'Không tìm thấy phòng chơi nào!' : 'No public rooms found!'}
            </p>
            <button
              onClick={() => setPage('Game')}
              className="mt-2 px-5 py-2.5 bg-[var(--pop-amber)] text-[var(--pop-black)] border-3 border-[var(--pop-black)] shadow-[3px_3px_0_var(--pop-black)] font-pop-accent font-black uppercase text-xs hover:translate-x-[-1px] hover:translate-y-[-1px] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all cursor-pointer"
            >
              {language === 'vi' ? 'TẠO PHÒNG MỚI NGAY' : 'CREATE ROOM NOW'}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredRooms.map((room, idx) => {
              const colors = ['bg-[var(--pop-cream)]', 'bg-white', 'bg-white'];
              const cardBg = colors[idx % colors.length];
              const isFull = room.players.length >= room.maxPlayers;
              const isPlaying = room.status === 'playing';

              return (
                <div
                  key={room.code}
                  className={`border-3 border-[var(--pop-black)] rounded-none p-5 flex flex-col justify-between gap-4 shadow-[4px_4px_0_var(--pop-black)] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[5px_5px_0_var(--pop-black)] transition-all ${cardBg}`}
                >
                  <div className="text-left">
                    <div className="flex justify-between items-center border-b-2 border-[var(--pop-black)] pb-1.5 mb-2">
                      <span className="font-pop-display font-black text-sm text-[var(--pop-black)] tracking-wider">
                        ROOM: {room.code}
                      </span>
                      {isPlaying ? (
                        <span className="bg-[var(--pop-red)] text-white text-[8px] font-pop-accent font-black px-2 py-0.5 rounded-none border-2 border-[var(--pop-black)] uppercase shadow-[1px_1px_0_var(--pop-black)]">
                          {language === 'vi' ? 'Đang chơi' : 'In Game'}
                        </span>
                      ) : isFull ? (
                        <span className="bg-[var(--pop-black)] text-white text-[8px] font-pop-accent font-black px-2 py-0.5 rounded-none border-2 border-[var(--pop-black)] uppercase shadow-[1px_1px_0_var(--pop-black)]">
                          {language === 'vi' ? 'Đầy phòng' : 'Full'}
                        </span>
                      ) : (
                        <span className="bg-emerald-400 text-[var(--pop-black)] text-[8px] font-pop-accent font-black px-2 py-0.5 rounded-none border-2 border-[var(--pop-black)] uppercase shadow-[1px_1px_0_var(--pop-black)]">
                          {language === 'vi' ? 'Đang chờ' : 'Waiting'}
                        </span>
                      )}
                    </div>

                    <p className="text-[10px] font-pop-accent font-black text-[var(--pop-black)]/60 uppercase tracking-wider mt-1">
                      {language === 'vi' ? 'Phiên bản:' : 'Edition:'} <span className="text-[var(--pop-red)]">{t('edition_' + room.edition + '_name') || room.edition}</span>
                    </p>
                    <p className="text-[10px] font-pop-accent font-black text-[var(--pop-black)]/60 uppercase tracking-wider mt-0.5">
                      {language === 'vi' ? 'Người chơi:' : 'Players:'} <span className="text-[var(--pop-black)]">{room.players.length} / {room.maxPlayers}</span>
                    </p>
                  </div>

                  <button
                    onClick={() => handleJoinRoom(room.code, room.password)}
                    disabled={isPlaying || isFull}
                    className={`w-full py-2 border-2 border-[var(--pop-black)] shadow-[2.5px_2.5px_0_var(--pop-black)] font-pop-accent font-black uppercase text-[10px] cursor-pointer hover:translate-x-[-1px] hover:translate-y-[-1px] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all disabled:opacity-40 disabled:cursor-not-allowed
                      ${isPlaying || isFull ? 'bg-white text-[var(--pop-black)]/40 shadow-none' : 'bg-[var(--pop-amber)] text-[var(--pop-black)]'}`}
                  >
                    {isPlaying 
                      ? (language === 'vi' ? 'ĐANG CHƠI 🎮' : 'PLAYING 🎮') 
                      : isFull 
                        ? (language === 'vi' ? 'ĐẦY PHÒNG 🚫' : 'FULL 🚫') 
                        : (language === 'vi' ? 'GIA NHẬP 🚀' : 'JOIN ROOM 🚀')}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
}
