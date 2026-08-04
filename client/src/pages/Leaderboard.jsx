import { useEffect, useState } from 'react';
import { PRESET_AVATARS } from '../components/PlayerAvatar.jsx';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:5000';

export default function Leaderboard() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    fetch(`${API_URL}/api/leaderboard`)
      .then(async (response) => {
        const body = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(body.message || 'Không thể tải bảng xếp hạng.');
        return body.data || [];
      })
      .then((data) => {
        if (!cancelled) setRows(data);
      })
      .catch((loadError) => {
        if (!cancelled) setError(loadError.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  return (
    <section className="mx-auto w-full max-w-5xl font-pop-body" aria-labelledby="leaderboard-title">
      <header className="mb-6 border-3 border-[var(--pop-black)] bg-[var(--pop-amber)] p-5 shadow-[6px_6px_0_var(--pop-black)]">
        <p className="text-xs font-black uppercase tracking-[0.22em]">Xếp hạng toàn cầu</p>
        <h1 id="leaderboard-title" className="font-pop-display text-4xl font-black uppercase md:text-6xl">Top 20</h1>
        <p className="mt-2 max-w-2xl font-bold">Xếp theo điểm kỹ năng, sau đó là số trận thắng. Chỉ người chơi đã hoàn thành ít nhất một trận được hiển thị.</p>
      </header>

      {loading && <p className="border-2 border-[var(--pop-black)] bg-white p-6 text-center font-black">Đang tải bảng xếp hạng...</p>}
      {error && <p role="alert" className="border-2 border-[var(--pop-black)] bg-[var(--pop-red)] p-4 font-black text-white">{error}</p>}
      {!loading && !error && rows.length === 0 && <p className="border-2 border-[var(--pop-black)] bg-white p-6 text-center font-black">Chưa có người chơi đủ điều kiện xếp hạng.</p>}

      {!loading && !error && rows.length > 0 && (
        <div className="overflow-hidden border-3 border-[var(--pop-black)] bg-white shadow-[6px_6px_0_var(--pop-black)]">
          <div className="hidden grid-cols-[72px_1fr_110px_90px_90px_90px] gap-3 border-b-3 border-[var(--pop-black)] bg-[var(--pop-black)] px-4 py-3 text-xs font-black uppercase text-white md:grid">
            <span>Hạng</span><span>Người chơi</span><span>Rating</span><span>Thắng</span><span>Thua</span><span>Tỷ lệ</span>
          </div>
          <ol>
            {rows.map((row) => (
              <li key={row.userId} className="grid grid-cols-[52px_1fr_auto] items-center gap-3 border-b-2 border-[var(--pop-black)] px-4 py-4 last:border-b-0 md:grid-cols-[72px_1fr_110px_90px_90px_90px]">
                <strong className={`text-2xl ${row.rank <= 3 ? 'text-[var(--pop-red)]' : ''}`}>#{row.rank}</strong>
                <span className="flex min-w-0 items-center gap-3 font-black">
                  <span className="grid h-10 w-10 shrink-0 place-items-center border-2 border-[var(--pop-black)] bg-[var(--pop-cream)] text-xl" aria-hidden="true">{PRESET_AVATARS[row.avatar] || '🐱'}</span>
                  <span className="truncate">{row.username}</span>
                </span>
                <strong className="text-right md:text-left">{row.rating}</strong>
                <span className="col-start-2 text-xs font-bold md:col-auto md:text-base">{row.wins} thắng</span>
                <span className="text-right text-xs font-bold md:text-left md:text-base">{row.losses} thua</span>
                <span className="col-span-2 col-start-2 text-xs font-black text-[var(--pop-red)] md:col-auto md:text-base">{row.winRate}% · {row.totalGames} trận</span>
              </li>
            ))}
          </ol>
        </div>
      )}
    </section>
  );
}
