import React, { useState, useRef, useEffect } from 'react';
import { useLanguage } from '../../context/LanguageContext.jsx';

export default function JoinByCodeModal({ isOpen, onClose, onJoinRoom }) {
  const { language } = useLanguage();
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setCode('');
      setPassword('');
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const [error, setError] = useState('');

  const handleCodeChange = (e) => {
    const val = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6);
    setCode(val);
    if (error) setError('');
  };

  const handleConfirm = () => {
    if (code.length < 4) {
      setError(language === 'vi' ? 'Mã phòng phải từ 4 đến 6 ký tự!' : 'Room code must be 4 to 6 characters!');
      return;
    }
    setError('');
    onJoinRoom(code, password);
    onClose();
  };

  const chars = code.padEnd(4, '').split('');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-[#130d24] border-3 border-purple-500 rounded-none p-6 md:p-8 max-w-md w-full shadow-[0_0_35px_rgba(168,85,247,0.4)] text-center text-white font-pop-body">
        {/* Header */}
        <div className="flex justify-between items-center border-b-2 border-purple-500/40 pb-4 mb-6">
          <div className="flex items-center gap-3 text-left">
            <span className="text-3xl">🔑</span>
            <div>
              <h2 className="font-pop-display font-black text-xl uppercase tracking-wider text-purple-300">
                {language === 'vi' ? 'VÀO BẰNG MÃ PHÒNG' : 'JOIN ROOM BY CODE'}
              </h2>
              <p className="text-[11px] text-purple-300/70 font-mono">
                {language === 'vi' ? 'Nhập mã gồm 4 - 6 ký tự để tham gia' : 'Enter 4-6 character room PIN code'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center bg-[#251842] border-2 border-purple-400/50 hover:border-red-400 hover:bg-red-500/20 text-purple-200 hover:text-red-400 font-bold transition-all"
          >
            ✕
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-rose-950/80 border-2 border-rose-500 text-rose-200 text-xs font-bold flex items-center justify-center gap-2 animate-bounce">
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        {/* PIN Code Box */}
        <div className="mb-6">
          <label className="block text-xs font-black uppercase text-purple-300 tracking-wider mb-3">
            {language === 'vi' ? 'NHẬP MÃ PHÒNG' : 'ENTER ROOM CODE'}
          </label>

          {/* Hidden Input for Keyboard Focus */}
          <input
            ref={inputRef}
            type="text"
            value={code}
            onChange={handleCodeChange}
            maxLength={6}
            className="sr-only"
          />

          {/* Visual PIN Slots */}
          <div
            onClick={() => inputRef.current?.focus()}
            className="flex justify-center gap-2 sm:gap-3 cursor-pointer py-2"
          >
            {[0, 1, 2, 3, 4, 5].slice(0, Math.max(4, code.length)).map((idx) => {
              const char = chars[idx] || '';
              const isFilled = !!char;
              return (
                <div
                  key={idx}
                  className={`w-12 h-14 sm:w-14 sm:h-16 border-3 flex items-center justify-center text-2xl font-mono font-black transition-all ${
                    isFilled
                      ? 'bg-purple-900/60 border-amber-400 text-amber-300 shadow-[0_0_15px_rgba(251,191,36,0.4)] scale-105'
                      : 'bg-[#18112e] border-purple-800 text-purple-600'
                  }`}
                >
                  {char || '_'}
                </div>
              );
            })}
          </div>

          <p className="text-[10px] text-purple-400/60 font-mono mt-2">
            {language === 'vi' ? 'Chạm vào ô trên để mở bàn phím' : 'Tap boxes above to open keyboard'}
          </p>
        </div>

        {/* Password Optional Input */}
        <div className="bg-[#1c1339] border-2 border-purple-800/60 p-4 mb-6 text-left">
          <label className="block text-[11px] font-black uppercase text-purple-300 tracking-wider mb-1.5">
            {language === 'vi' ? 'MẬT KHẨU PHÒNG (NẾU CÓ 🔒)' : 'ROOM PASSWORD (IF PROTECTED 🔒)'}
          </label>
          <input
            type="password"
            placeholder={language === 'vi' ? 'Nhập mật khẩu...' : 'Enter room password...'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-[#130c27] border-2 border-purple-700/80 px-3 py-2 text-xs text-amber-200 font-mono focus:outline-none focus:border-purple-400"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 bg-[#241744] border-2 border-purple-600/60 hover:bg-purple-900/40 text-purple-200 font-bold uppercase text-xs tracking-wider transition-all"
          >
            {language === 'vi' ? 'HỦY BỎ' : 'CANCEL'}
          </button>
          <button
            type="button"
            disabled={code.length < 4}
            onClick={handleConfirm}
            className={`flex-1 py-3 border-2 font-pop-display font-black uppercase text-xs tracking-wider transition-all flex items-center justify-center gap-1.5 ${
              code.length >= 4
                ? 'bg-purple-600 hover:bg-purple-500 border-purple-300 text-white shadow-[0_0_20px_rgba(168,85,247,0.6)] cursor-pointer'
                : 'bg-purple-950/40 border-purple-900/40 text-purple-700 cursor-not-allowed'
            }`}
          >
            <span>🚀</span>
            <span>{language === 'vi' ? 'GIA NHẬP' : 'JOIN ROOM'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
