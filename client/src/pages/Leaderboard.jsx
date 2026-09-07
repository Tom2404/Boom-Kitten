import { useEffect, useState } from 'react';
import { PRESET_AVATARS } from '../components/PlayerAvatar.jsx';
import Pager from '../components/ui/Pager.jsx';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:5000';
const PAGE_SIZE = 10;

function renderRankBadge(rank) {
  if (rank === 1) {
    return (
      <span className="inline-flex items-center justify-center gap-1 bg-amber-300 border-2 border-amber-600 text-amber-950 font-headline font-black text-xs px-2.5 py-1 rounded-md shadow-[2px_2px_0_var(--pop-black)]">
        <span aria-hidden="true">🥇</span>
        <span className="tabular-nums">#1</span>
      </span>
    );
  }
  if (rank === 2) {
    return (
      <span className="inline-flex items-center justify-center gap-1 bg-slate-200 border-2 border-slate-500 text-slate-900 font-headline font-black text-xs px-2.5 py-1 rounded-md shadow-[2px_2px_0_var(--pop-black)]">
        <span aria-hidden="true">🥈</span>
        <span className="tabular-nums">#2</span>
      </span>
    );
  }
  if (rank === 3) {
    return (
      <span className="inline-flex items-center justify-center gap-1 bg-amber-100 border-2 border-amber-700 text-amber-950 font-headline font-black text-xs px-2.5 py-1 rounded-md shadow-[2px_2px_0_var(--pop-black)]">
        <span aria-hidden="true">🥉</span>
        <span className="tabular-nums">#3</span>
      </span>
    );
  }
  return (
    <span className="inline-flex items-center justify-center font-headline font-black text-xs text-slate-800 tabular-nums px-2 py-1 rounded border border-slate-300 bg-slate-100">
      #{rank}
    </span>
  );
}

function rowBgClass(rank, isMe) {
  if (isMe) {
    return 'bg-amber-100/80 border-l-4 border-l-[var(--pop-red)] hover:bg-amber-100';
  }
  if (rank === 1) {
    return 'bg-amber-50/70 border-l-4 border-l-amber-500 hover:bg-amber-100/60';
  }
  if (rank === 2) {
    return 'bg-slate-50/90 border-l-4 border-l-slate-400 hover:bg-slate-100/80';
  }
  if (rank === 3) {
    return 'bg-orange-50/50 border-l-4 border-l-amber-700 hover:bg-orange-100/50';
  }
  return 'hover:bg-slate-50/80';
}

function LeaderboardSkeleton() {
  return (
    <div className="flex min-h-0 flex-1 flex-col p-4 gap-3 bg-white animate-pulse" aria-label="Đang tải bảng xếp hạng">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="flex items-center justify-between gap-4 border-2 border-slate-200 bg-slate-50/80 p-3 rounded-xl">
          <div className="h-7 w-10 bg-slate-200 rounded" />
          <div className="h-8 w-8 rounded bg-slate-200" />
          <div className="h-5 flex-1 bg-slate-200 rounded max-w-xs" />
          <div className="h-5 w-16 bg-slate-200 rounded" />
          <div className="h-5 w-20 bg-slate-200 rounded hidden sm:block" />
        </div>
      ))}
    </div>
  );
}

export default function Leaderboard() {
  const [rows, setRows] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const token = localStorage.getItem('accessToken');
    const loadData = async () => {
      try {
        const fetchLeaderboard = fetch(`${API_URL}/api/leaderboard`).then(async (response) => {
          const body = await response.json().catch(() => ({}));
          if (!response.ok) throw new Error(body.message || 'Không thể tải bảng xếp hạng.');
          return body.data || [];
        });

        const fetchUser = token
          ? fetch(`${API_URL}/api/users/me`, { headers: { Authorization: `Bearer ${token}` } })
              .then((res) => (res.ok ? res.json() : null))
              .catch(() => null)
          : Promise.resolve(null);

        const [leaderboardData, userData] = await Promise.all([fetchLeaderboard, fetchUser]);
        if (!cancelled) {
          setRows(leaderboardData);
          if (userData) setCurrentUser(userData);
        }
      } catch (loadError) {
        if (!cancelled) setError(loadError.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void loadData();
    return () => { cancelled = true; };
  }, []);

  // ponytail: user row match uses userId/username check from /api/users/me; upgrade to live socket rank updates if leaderboard becomes real-time.
  const myRow = currentUser
    ? rows.find((r) => r.userId === (currentUser._id || currentUser.id) || r.username === currentUser.username)
    : null;

  const pageCount = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount - 1);
  const visibleRows = rows.slice(safePage * PAGE_SIZE, safePage * PAGE_SIZE + PAGE_SIZE);
  const isMyRowVisible = myRow && visibleRows.some((r) => r.userId === myRow.userId);

  return (
    <section className="vf-page mx-auto w-full max-w-5xl font-pop-body" aria-labelledby="leaderboard-title">
      <header className="flex flex-wrap items-baseline justify-between gap-3 border-3 border-[var(--pop-black)] bg-[var(--pop-amber)] px-4 py-3 shadow-[6px_6px_0_var(--pop-black)]">
        <h1 id="leaderboard-title" className="vf-title font-pop-display font-black uppercase text-slate-950">Top 20</h1>
        <p className="text-xs font-headline font-black uppercase tracking-[0.18em] text-slate-900">Xếp theo điểm kỹ năng, sau đó là số trận thắng</p>
      </header>

      <div className="vf-body flex min-h-0 flex-1 flex-col">
        {loading && <LeaderboardSkeleton />}
        {error && (
          <div role="alert" className="border-3 border-[var(--pop-black)] bg-[var(--pop-red)] p-4 font-headline font-black text-white shadow-[4px_4px_0_var(--pop-black)] flex items-center justify-between">
            <span>{error}</span>
            <button type="button" onClick={() => window.location.reload()} className="px-3 py-1 bg-white text-[var(--pop-black)] border-2 border-[var(--pop-black)] text-xs font-black uppercase shadow-[2px_2px_0_var(--pop-black)]">
              Thử lại
            </button>
          </div>
        )}
        {!loading && !error && rows.length === 0 && (
          <div className="my-auto flex flex-col items-center justify-center gap-3 py-10 px-6 text-center bg-[radial-gradient(#FAC775_1px,transparent_1px)] [background-size:12px_12px] bg-[var(--pop-cream)]/30 border-3 border-[var(--pop-black)] rounded-2xl shadow-[6px_6px_0_var(--pop-black)]">
            <div className="relative grid h-16 w-16 place-items-center rounded-2xl border-3 border-[var(--pop-black)] bg-[var(--pop-cream)] text-3xl shadow-[4px_4px_0_var(--pop-black)] mb-1">
              <span aria-hidden="true">😿</span>
            </div>
            <h2 className="font-pop-display font-black text-lg text-slate-900 uppercase tracking-tight">
              Chưa có người chơi đủ điều kiện xếp hạng
            </h2>
            <p className="font-sans text-xs text-slate-600 max-w-md font-bold">
              Bảng xếp hạng sẽ tự động cập nhật ngay khi các cao thủ hoàn thành trận đấu tại Arena hoặc Tournament!
            </p>
          </div>
        )}

        {!loading && !error && rows.length > 0 && (
          <div className="flex h-full min-h-0 flex-col overflow-hidden border-3 border-[var(--pop-black)] bg-white shadow-[6px_6px_0_var(--pop-black)] rounded-2xl">
            {/* The single scroll owner */}
            <div className="flex min-h-0 flex-1 flex-col overflow-x-auto overflow-y-auto">
              <table className="w-full text-left border-collapse" aria-label="Bảng xếp hạng Top 20">
                <thead className="vf-sticky-head">
                  <tr className="border-b-3 border-[var(--pop-black)] bg-slate-900 text-[10px] sm:text-xs font-headline font-black uppercase text-white tracking-wider">
                    <th scope="col" className="py-3 px-3 sm:px-4 text-center w-16 sm:w-20">Hạng</th>
                    <th scope="col" className="py-3 px-3 sm:px-4 min-w-[160px]">Người chơi</th>
                    <th scope="col" className="py-3 px-3 sm:px-4 text-center w-24 sm:w-28">Rating</th>
                    <th scope="col" className="py-3 px-3 sm:px-4 text-center w-20 sm:w-24 hidden sm:table-cell">Thắng</th>
                    <th scope="col" className="py-3 px-3 sm:px-4 text-center w-20 sm:w-24 hidden sm:table-cell">Thua</th>
                    <th scope="col" className="py-3 px-3 sm:px-4 text-right w-28 sm:w-36">Tỷ lệ</th>
                  </tr>
                </thead>
                <tbody className="divide-y-2 divide-slate-100 font-sans font-bold text-xs text-slate-900">
                  {visibleRows.map((row) => {
                    const isMe = myRow && row.userId === myRow.userId;
                    return (
                      <tr key={row.userId} className={`transition-colors ${rowBgClass(row.rank, isMe)}`}>
                        <td className="py-3 px-3 sm:px-4 text-center">
                          {renderRankBadge(row.rank)}
                        </td>
                        <td className="py-3 px-3 sm:px-4">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <span className="grid h-8 w-8 sm:h-9 sm:w-9 shrink-0 place-items-center border-2 border-[var(--pop-black)] bg-[var(--pop-cream)] text-base sm:text-lg rounded shadow-[1px_1px_0_var(--pop-black)]" aria-hidden="true">
                              {PRESET_AVATARS[row.avatar] || '🐱'}
                            </span>
                            <span className="truncate font-headline font-black text-xs sm:text-sm text-slate-950">
                              {row.username}
                            </span>
                            {isMe && (
                              <span className="shrink-0 px-1.5 py-0.5 bg-[var(--pop-red)] text-white text-[9px] font-headline font-black uppercase rounded shadow-[1px_1px_0_var(--pop-black)]">
                                Bạn
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-3 sm:px-4 text-center font-headline font-black text-sm sm:text-base tabular-nums text-slate-950">
                          {row.rating}
                        </td>
                        <td className="py-3 px-3 sm:px-4 text-center font-sans font-bold text-xs sm:text-sm tabular-nums text-emerald-700 hidden sm:table-cell">
                          {row.wins} thắng
                        </td>
                        <td className="py-3 px-3 sm:px-4 text-center font-sans font-bold text-xs sm:text-sm tabular-nums text-slate-600 hidden sm:table-cell">
                          {row.losses} thua
                        </td>
                        <td className="py-3 px-3 sm:px-4 text-right">
                          <div className="font-sans font-black text-xs sm:text-sm text-[var(--pop-red)] tabular-nums">
                            {row.winRate}%
                          </div>
                          <span className="block text-[10px] font-bold text-slate-500 tabular-nums">
                            {row.totalGames} trận
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pinned row for current user when outside the visible view */}
            {myRow && !isMyRowVisible && (
              <div className="border-t-3 border-[var(--pop-black)] bg-amber-50 px-4 py-2.5 flex items-center justify-between shrink-0 shadow-[0_-3px_0_rgba(0,0,0,0.06)]" aria-label="Hạng của bạn ngoài trang hiện tại">
                <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                  <span className="px-2 py-0.5 bg-[var(--pop-red)] text-white font-headline font-black text-[10px] sm:text-xs uppercase border-2 border-[var(--pop-black)] shadow-[2px_2px_0_var(--pop-black)] shrink-0">
                    Bạn (Hạng #{myRow.rank})
                  </span>
                  <span className="grid h-7 w-7 shrink-0 place-items-center border-2 border-[var(--pop-black)] bg-[var(--pop-cream)] text-sm rounded shadow-[1px_1px_0_var(--pop-black)]" aria-hidden="true">
                    {PRESET_AVATARS[myRow.avatar] || '🐱'}
                  </span>
                  <span className="truncate font-headline font-black text-xs sm:text-sm text-slate-950">{myRow.username}</span>
                </div>
                <div className="flex items-center gap-3 text-xs sm:text-sm font-black tabular-nums shrink-0">
                  <span className="font-headline text-slate-950">{myRow.rating} RP</span>
                  <span className="text-emerald-700 hidden sm:inline">{myRow.wins}W</span>
                  <span className="text-slate-600 hidden sm:inline">{myRow.losses}L</span>
                  <span className="px-1.5 py-0.5 bg-white border border-[var(--pop-black)] text-[var(--pop-red)] rounded text-xs">
                    {myRow.winRate}%
                  </span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <Pager
        page={safePage}
        pageCount={pageCount}
        onChange={setPage}
        label="Phân trang bảng xếp hạng"
        status={`Hạng ${safePage * PAGE_SIZE + 1}–${safePage * PAGE_SIZE + visibleRows.length}`}
      />
    </section>
  );
}
