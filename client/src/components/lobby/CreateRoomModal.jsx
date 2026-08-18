import React, { useState } from 'react';
import { useLanguage } from '../../context/LanguageContext.jsx';
import { CoinIcon } from '../CoinDisplay.jsx';

export default function CreateRoomModal({ isOpen, onClose, onCreateRoom, userCoins = 0 }) {
  const { language } = useLanguage();
  const [edition, setEdition] = useState('original');
  const [maxPlayers, setMaxPlayers] = useState(5);
  const [betAmount, setBetAmount] = useState(50);
  const [password, setPassword] = useState('');
  const [turnTime, setTurnTime] = useState(30);

  if (!isOpen) return null;

  const EDITIONS = [
    { key: 'original', labelVi: 'Mèo Nguyên Bản', labelEn: 'Original Edition', icon: '🌟', color: 'from-amber-500 to-yellow-400', desc: 'Luật chơi chuẩn truyền thống' },
    { key: 'imploding', labelVi: 'Mèo Sập (Nổ Tung)', labelEn: 'Imploding Kittens', icon: '💣', color: 'from-purple-600 to-indigo-500', desc: 'Lá Nổ Tung lật ngửa tàn khốc' },
    { key: 'zombie', labelVi: 'Mèo Zombie', labelEn: 'Zombie Kittens', icon: '🧟', color: 'from-emerald-500 to-teal-400', desc: 'Hồi sinh từ mộ và trả thù' },
    { key: 'good_vs_evil', labelVi: 'Thiện vs Ác', labelEn: 'Good vs Evil', icon: '😇', color: 'from-rose-500 to-red-400', desc: 'Trận chiến Thiên đường & Địa ngục' },
    { key: 'streaking', labelVi: 'Mèo Con Sọc', labelEn: 'Streaking Kittens', icon: '🐯', color: 'from-orange-500 to-amber-400', desc: 'Giữ lá nổ trực tiếp trên tay' },
    { key: '2_player', labelVi: '2 Người Chơi (Duel)', labelEn: '2 Player Duel', icon: '⚔️', color: 'from-sky-500 to-blue-400', desc: 'Đấu súng 1v1 tốc độ cao' },
  ];

  const BET_OPTIONS = [0, 25, 50, 100, 250, 500];

  const [error, setError] = useState('');

  const handleConfirm = () => {
    if (betAmount > userCoins) {
      setError(language === 'vi' ? 'Bạn không đủ Coins để đặt cược mức này!' : 'Insufficient coins balance!');
      return;
    }
    setError('');
    onCreateRoom({ edition, maxPlayers, betAmount, password, turnTime });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-[#130d24] border-3 border-[#a855f7] rounded-none p-6 md:p-8 max-w-2xl w-full shadow-[0_0_35px_rgba(168,85,247,0.35)] text-left text-white font-pop-body max-h-[90vh] overflow-y-auto custom-scrollbar">
        {/* Header */}
        <div className="flex justify-between items-center border-b-2 border-[#a855f7]/40 pb-4 mb-6">
          <div className="flex items-center gap-3">
            <span className="text-3xl">➕</span>
            <div>
              <h2 className="font-pop-display font-black text-2xl uppercase tracking-wider text-amber-300">
                {language === 'vi' ? 'TẠO PHÒNG MỚI' : 'CREATE CUSTOM ROOM'}
              </h2>
              <p className="text-xs text-purple-300/80 uppercase font-mono tracking-wide">
                {language === 'vi' ? 'Tùy chỉnh chế độ chơi và thiết lập cược' : 'Customize match rules and bet stake'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 flex items-center justify-center bg-[#251842] border-2 border-purple-400/50 hover:border-red-400 hover:bg-red-500/20 text-purple-200 hover:text-red-400 font-bold transition-all text-xl"
          >
            ✕
          </button>
        </div>

        {error && (
          <div className="mb-5 p-3.5 bg-rose-950/80 border-2 border-rose-500 text-rose-200 text-xs font-bold flex items-center gap-2.5 animate-bounce">
            <span className="text-base">⚠️</span>
            <span>{error}</span>
          </div>
        )}

        <div className="space-y-6">
          {/* Edition / Chế độ chơi Selection */}
          <div>
            <label className="block text-xs font-black uppercase text-purple-300 tracking-wider mb-3">
              1. {language === 'vi' ? 'CHỌN CHẾ ĐỘ CHƠI (EDITION)' : 'SELECT GAME EDITION'}
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {EDITIONS.map((ed) => {
                const isSelected = edition === ed.key;
                return (
                  <button
                    key={ed.key}
                    type="button"
                    onClick={() => setEdition(ed.key)}
                    className={`p-3.5 border-2 text-left transition-all flex flex-col justify-between gap-1.5 cursor-pointer relative overflow-hidden ${
                      isSelected
                        ? 'bg-[#251846] border-amber-400 shadow-[0_0_15px_rgba(251,191,36,0.3)] translate-x-[-1px] translate-y-[-1px]'
                        : 'bg-[#1a1233] border-purple-900/60 hover:border-purple-500/60 hover:bg-[#20163f]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-pop-display font-black text-sm text-white flex items-center gap-2">
                        <span>{ed.icon}</span>
                        <span>{language === 'vi' ? ed.labelVi : ed.labelEn}</span>
                      </span>
                      {isSelected && (
                        <span className="bg-amber-400 text-black text-[9px] font-black px-2 py-0.5 uppercase tracking-wider">
                          ✓ ACTIVE
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-purple-300/70 font-mono leading-tight">{ed.desc}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Bet Amount Coins */}
          <div className="bg-[#1c1339] border-2 border-purple-800/60 p-4">
            <div className="flex justify-between items-center mb-3">
              <label className="text-xs font-black uppercase text-purple-300 tracking-wider flex items-center gap-2">
                <span>2. {language === 'vi' ? 'MỨC CƯỢC COINS' : 'BET STAKE'}</span>
                <CoinIcon className="w-4 h-4" />
              </label>
              <span className="text-xs text-amber-300 font-mono font-bold">
                {language === 'vi' ? 'Ví hiện tại:' : 'Your Coins:'} {userCoins.toLocaleString()} 🪙
              </span>
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {BET_OPTIONS.map((amt) => {
                const isSelected = betAmount === amt;
                const isDisabled = amt > userCoins;
                return (
                  <button
                    key={amt}
                    type="button"
                    disabled={isDisabled}
                    onClick={() => setBetAmount(amt)}
                    className={`py-2 px-3 border-2 font-mono font-bold text-xs transition-all ${
                      isSelected
                        ? 'bg-amber-400 border-amber-300 text-black shadow-[0_0_10px_rgba(251,191,36,0.5)]'
                        : isDisabled
                        ? 'bg-purple-950/40 border-purple-950/60 text-purple-600 cursor-not-allowed opacity-50'
                        : 'bg-[#150d2c] border-purple-800/80 text-amber-300 hover:border-amber-400/80'
                    }`}
                  >
                    {amt === 0 ? (language === 'vi' ? 'MIỄN PHÍ' : 'FREE') : `${amt} 🪙`}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Players count & Turn Time */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Max Players */}
            <div className="bg-[#1c1339] border-2 border-purple-800/60 p-4">
              <label className="block text-xs font-black uppercase text-purple-300 tracking-wider mb-2">
                3. {language === 'vi' ? 'SỐ NGƯỜI CHƠI TỐI ĐA' : 'MAX PLAYERS'}
              </label>
              <div className="flex gap-2">
                {[2, 3, 4, 5, 6].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setMaxPlayers(num)}
                    className={`flex-1 py-2 border-2 font-mono font-bold text-sm transition-all ${
                      maxPlayers === num
                        ? 'bg-emerald-400 border-emerald-300 text-black shadow-[0_0_10px_rgba(52,211,153,0.5)]'
                        : 'bg-[#150d2c] border-purple-800 text-emerald-300 hover:border-emerald-400'
                    }`}
                  >
                    {num} P
                  </button>
                ))}
              </div>
            </div>

            {/* Turn Time */}
            <div className="bg-[#1c1339] border-2 border-purple-800/60 p-4">
              <label className="block text-xs font-black uppercase text-purple-300 tracking-wider mb-2">
                4. {language === 'vi' ? 'THỜI GIAN LƯỢT ĐỊ' : 'TURN TIMEOUT'}
              </label>
              <div className="flex gap-2">
                {[15, 30, 45, 60].map((sec) => (
                  <button
                    key={sec}
                    type="button"
                    onClick={() => setTurnTime(sec)}
                    className={`flex-1 py-2 border-2 font-mono font-bold text-xs transition-all ${
                      turnTime === sec
                        ? 'bg-sky-400 border-sky-300 text-black shadow-[0_0_10px_rgba(56,189,248,0.5)]'
                        : 'bg-[#150d2c] border-purple-800 text-sky-300 hover:border-sky-400'
                    }`}
                  >
                    {sec}s
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Password (Optional) */}
          <div className="bg-[#1c1339] border-2 border-purple-800/60 p-4">
            <label className="block text-xs font-black uppercase text-purple-300 tracking-wider mb-2">
              5. {language === 'vi' ? 'MẬT KHẨU PHÒNG (TÙY CHỌN 🔒)' : 'ROOM PASSWORD (OPTIONAL 🔒)'}
            </label>
            <input
              type="password"
              placeholder={language === 'vi' ? 'Để trống nếu muốn phòng công khai...' : 'Leave empty for public room...'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-[#130c27] border-2 border-purple-700/80 px-4 py-2.5 text-sm text-amber-200 font-mono tracking-wider focus:outline-none focus:border-amber-400 focus:bg-[#191033] transition-all"
            />
          </div>
        </div>

        {/* Footer actions */}
        <div className="flex flex-col sm:flex-row justify-end gap-3 border-t-2 border-[#a855f7]/40 pt-6 mt-6">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-3 bg-[#241744] border-2 border-purple-600/60 hover:bg-purple-900/40 text-purple-200 font-bold uppercase text-xs tracking-wider transition-all"
          >
            {language === 'vi' ? 'HỦY BỎ' : 'CANCEL'}
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="px-8 py-3 bg-emerald-500 hover:bg-emerald-400 border-2 border-emerald-300 text-black font-pop-display font-black uppercase text-sm tracking-wider shadow-[0_0_20px_rgba(16,185,129,0.5)] hover:shadow-[0_0_30px_rgba(16,185,129,0.8)] active:translate-y-0.5 transition-all flex items-center justify-center gap-2"
          >
            <span>➕</span>
            <span>{language === 'vi' ? 'TẠO PHÒNG NGAY' : 'CREATE ROOM NOW'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
