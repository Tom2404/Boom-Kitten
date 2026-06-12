import React, { useState, useEffect } from 'react';
import { PRESET_AVATARS } from '../components/PlayerAvatar.jsx';

export default function Leaderboard() {
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);

  const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:5000';

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const res = await fetch(`${API_URL}/api/leaderboard`);
        const data = await res.json();
        if (res.ok) {
          setPlayers(data);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
  }, []);

  const getRankEmoji = (index) => {
    if (index === 0) return '👑 Quyết Chiến';
    if (index === 1) return '🥈 Á Quân';
    if (index === 2) return '🥉 Hạng 3';
    return `#${index + 1}`;
  };

  const getRankBg = (index) => {
    if (index === 0) return 'bg-yellow-400 text-slate-950 font-black';
    if (index === 1) return 'bg-slate-200 text-slate-950 font-black';
    if (index === 2) return 'bg-orange-200 text-slate-950 font-black';
    return 'bg-surface-container text-on-surface font-bold';
  };

  return (
    <div className="max-w-3xl mx-auto bg-white border-4 border-on-surface shadow-[8px_8px_0px_0px_rgba(26,28,28,1)] rounded-3xl p-6 md:p-8 flex flex-col gap-6">
      <div className="text-center flex flex-col items-center">
        <span className="text-5xl animate-bounce">🏆</span>
        <h2 className="text-2xl md:text-3xl font-headline font-black text-on-surface uppercase mt-4">
          Bảng Xếp Hạng Cao Thủ
        </h2>
        <p className="text-xs font-bold text-on-surface-variant mt-1">
          Bảng vinh danh những người chơi có tỷ lệ thắng cao nhất (Tối thiểu 10 trận).
        </p>
      </div>

      <div className="flex flex-col gap-4 mt-4">
        {loading ? (
          <p className="text-center font-headline font-black text-lg py-12 animate-pulse">
            Đang thống kê xếp hạng...
          </p>
        ) : players.length === 0 ? (
          <div className="text-center py-12 border-4 border-dashed border-on-surface-variant rounded-2xl bg-surface">
            <span className="text-4xl">😿</span>
            <p className="font-headline font-black uppercase mt-3">Chưa có ai lọt top!</p>
            <p className="text-xs text-on-surface-variant font-bold mt-1 px-4">
              Cần chơi tối thiểu 10 trận đấu để xuất hiện trên bảng xếp hạng.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {players.map((player, index) => (
              <div
                key={player._id}
                className="border-3 border-on-surface rounded-2xl p-4 flex flex-col sm:flex-row justify-between items-center gap-4 shadow-[2px_2px_0px_0px_rgba(26,28,28,1)] bg-surface hover:translate-x-1 transition-transform"
              >
                <div className="flex items-center gap-4 flex-1">
                  {/* Rank badge */}
                  <span className={`px-4 py-1.5 rounded-xl border-2 border-on-surface text-xs uppercase shadow-[1.5px_1.5px_0px_0px_#1a1c1c] ${getRankBg(index)}`}>
                    {getRankEmoji(index)}
                  </span>
                  
                  {/* Avatar & Username */}
                  <div className="h-10 w-10 rounded-full flex items-center justify-center text-lg font-headline font-black bg-primary-fixed border-2 border-on-surface overflow-hidden">
                    {player.avatar && PRESET_AVATARS[player.avatar] ? (
                      <span>{PRESET_AVATARS[player.avatar]}</span>
                    ) : player.avatar ? (
                      <img src={player.avatar} alt={player.username} className="h-full w-full object-cover" />
                    ) : (
                      <span>{player.username.slice(0, 2).toUpperCase()}</span>
                    )}
                  </div>
                  
                  <div>
                    <h3 className="font-headline font-black text-sm uppercase text-on-surface">
                      {player.username}
                    </h3>
                    <span className="text-[10px] text-primary font-headline font-black uppercase">
                      {player.rank}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-6 text-right">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-headline font-black text-on-surface-variant uppercase">Tỷ Lệ Thắng</span>
                    <span className="font-headline font-black text-emerald-600 text-sm">
                      {(player.winRate * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] font-headline font-black text-on-surface-variant uppercase">Điểm ELO</span>
                    <span className="font-headline font-black text-primary text-sm">
                      🔥 {player.eloPoints}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
