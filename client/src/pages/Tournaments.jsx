import React, { useEffect, useRef, useState } from 'react';
import { CoinIcon } from '../components/CoinDisplay.jsx';
import Pager from '../components/ui/Pager.jsx';
import {
  formatCountdown,
  getMatchStatusLabel,
  getRegistrationBlockReason,
  getTournamentDeadline,
  getTournamentStatusLabel,
  getTournamentStatusTone,
} from './tournamentUi.js';
import { refreshAccessToken } from '../utils/authSession.js';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:5000';
const TOURNAMENTS_PER_PAGE = 4;
const requestId = (prefix) => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}`;

async function readResponse(response) {
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.error?.message || body.message || 'Không thể hoàn thành thao tác.');
  return body.data ?? body;
}

function formatDate(value) {
  if (!value) return '—';
  return new Date(value).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' });
}

function statusClass(status) {
  return `border-2 border-[var(--pop-black)] px-2 py-1 text-[10px] font-black uppercase ${getTournamentStatusTone(status)}`;
}

export default function Tournaments({ setPage }) {
  const [token, setToken] = useState(() => localStorage.getItem('accessToken'));
  const [items, setItems] = useState([]);
  const [profile, setProfile] = useState(null);
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [mutating, setMutating] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [now, setNow] = useState(Date.now());
  const [listPage, setListPage] = useState(0);

  const loadList = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/tournaments`);
      setItems(await readResponse(response) || []);
      setError('');
    } catch (loadError) {
      setError(loadError.message);
    } finally {
      setLoading(false);
    }
  };

  const loadProfile = async () => {
    let activeToken = localStorage.getItem('accessToken');
    if (!activeToken) return;
    const fetchMe = (bearer) => fetch(`${API_URL}/api/users/me`, { headers: { Authorization: `Bearer ${bearer}` } });
    try {
      let response = await fetchMe(activeToken);
      if (response.status === 401) {
        // Expired access token would otherwise leave the wallet at 0 and mislabel the button.
        const renewed = await refreshAccessToken();
        if (!renewed) {
          setProfile(null);
          return;
        }
        localStorage.setItem('accessToken', renewed);
        window.dispatchEvent(new Event('auth:changed'));
        activeToken = renewed;
        setToken(renewed);
        response = await fetchMe(renewed);
      }
      if (response.ok) setProfile(await response.json());
    } catch {
      // Tournament discovery remains available if the wallet request fails.
    }
  };

  const open = async (id) => {
    if (!token) {
      setMessage('Hãy đăng nhập để xem chi tiết và đăng ký giải đấu.');
      return;
    }
    setDetailLoading(true);
    setError('');
    try {
      const response = await fetch(`${API_URL}/api/tournaments/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      setDetail(await readResponse(response));
    } catch (loadError) {
      setError(loadError.message);
    } finally {
      setDetailLoading(false);
    }
  };

  const mutate = async (action) => {
    if (!detail || mutating) return;
    const copy = action === 'register'
      ? `Bạn sẽ trả ${detail.tournament.entryFee} Coin để tham gia giải này.`
      : 'Bạn sẽ được hoàn lại 100% entry fee vì đang rút trước khi đóng đăng ký.';
    if (!window.confirm(copy)) return;
    setMutating(action);
    setError('');
    setMessage('');
    try {
      const response = await fetch(`${API_URL}/api/tournaments/${detail.tournament._id}/${action}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId: requestId(`tournament-${action}`) }),
      });
      await readResponse(response);
      setMessage(action === 'register' ? 'Đăng ký Tournament thành công.' : 'Đã rút đăng ký và hoàn Coin.');
      await Promise.all([open(detail.tournament._id), loadList(), loadProfile()]);
    } catch (mutationError) {
      setError(mutationError.message);
    } finally {
      setMutating('');
    }
  };

  const enterMatch = async () => {
    if (!detail?.nextMatch || mutating) return;
    setMutating('enter');
    try {
      const response = await fetch(`${API_URL}/api/tournaments/${detail.tournament._id}/matches/room`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ matchReference: detail.nextMatch.matchReference }),
      });
      const body = await readResponse(response);
      localStorage.setItem('autoJoinRoomCode', body.roomCode);
      setPage('Game');
    } catch (mutationError) {
      setError(mutationError.message);
    } finally {
      setMutating('');
    }
  };

  useEffect(() => {
    void Promise.all([loadList(), loadProfile()]);
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const walletCoins = profile ? Number(profile.coins ?? 0) : null;
  const registration = detail?.registration;
  const isRegistered = registration?.paymentStatus === 'paid';
  const blockReason = detail ? getRegistrationBlockReason(detail.tournament, walletCoins, now) : 'closed';
  const listPageCount = Math.max(1, Math.ceil(items.length / TOURNAMENTS_PER_PAGE));
  const safeListPage = Math.min(listPage, listPageCount - 1);
  const visibleItems = items.slice(safeListPage * TOURNAMENTS_PER_PAGE, safeListPage * TOURNAMENTS_PER_PAGE + TOURNAMENTS_PER_PAGE);

  return (
    <div className="vf-page font-pop-body">
      <header className="flex flex-wrap items-center justify-between gap-3 border-3 border-[var(--pop-black)] bg-white px-4 py-2.5 shadow-[5px_5px_0_var(--pop-black)]">
        <div className="flex flex-wrap items-baseline gap-3">
          <h1 className="vf-title font-pop-display font-black uppercase text-slate-950">Tournament</h1>
          <p className="text-xs font-headline font-bold uppercase tracking-[0.14em] text-slate-700">8 người · 2 bảng · Chung kết</p>
        </div>
        {token && (
          <span className="flex items-center gap-1.5 border-2 border-[var(--pop-black)] bg-[var(--pop-cream)] px-3 py-1 text-xs font-headline font-black text-slate-950 shadow-[2px_2px_0_var(--pop-black)]">
            <CoinIcon className="h-4 w-4" /> <span className="tabular-nums">{walletCoins === null ? '…' : walletCoins}</span> Coin
          </span>
        )}
        {(error || message) && (
          <div role={error ? 'alert' : 'status'} className={`w-full border-2 border-[var(--pop-black)] p-2.5 text-xs font-headline font-black uppercase shadow-[2px_2px_0_var(--pop-black)] ${error ? 'bg-[var(--pop-red)] text-white' : 'bg-[var(--pop-amber)] text-slate-950'}`}>
            {error || message}
          </div>
        )}
      </header>

      <div className="vf-body grid gap-4 lg:grid-cols-[minmax(290px,0.85fr)_minmax(0,1.5fr)]">
        {/* Left column: Tournament discovery list */}
        <section className="flex min-h-0 flex-col border-3 border-[var(--pop-black)] bg-white shadow-[6px_6px_0_var(--pop-black)] rounded-2xl overflow-hidden">
          <div className="bg-slate-900 px-4 py-2.5 flex items-center justify-between text-white border-b-3 border-[var(--pop-black)] shrink-0">
            <h2 className="font-headline font-black text-xs uppercase tracking-wider">
              DANH SÁCH GIẢI ĐẤU
            </h2>
            <span className="text-[10px] font-bold text-slate-300">
              {items.length} giải
            </span>
          </div>
          {/* Scroll owner for tournament list */}
          <div className="flex min-h-0 flex-1 flex-col overflow-y-auto p-3 gap-3" aria-busy={loading}>
            {loading && <LoadingList />}
            {!loading && error && (
              <button type="button" onClick={loadList} className="border-2 border-[var(--pop-black)] bg-[var(--pop-cream)] p-3 text-xs font-headline font-black uppercase shadow-[2px_2px_0_var(--pop-black)] hover:bg-white">
                Thử tải lại
              </button>
            )}
            {!loading && !error && visibleItems.map((item) => (
              <TournamentCard key={item._id} item={item} now={now} selected={detail?.tournament?._id === item._id} onOpen={open} />
            ))}
            {!loading && !error && items.length > 0 && items.length < 3 && (
              <div className="mt-1 border-2 border-dashed border-slate-300 bg-[radial-gradient(#FAC775_1px,transparent_1px)] [background-size:10px_10px] bg-[var(--pop-cream)]/30 p-3 rounded-xl text-center flex flex-col items-center gap-1">
                <span className="text-base" aria-hidden="true">⚔️</span>
                <span className="font-headline font-black text-[11px] text-slate-800 uppercase">Sắp mở thêm giải đấu</span>
                <p className="font-sans text-[10px] font-bold text-slate-500">Các mùa giải Boom Kitten tiếp theo sẽ được cập nhật hàng tuần!</p>
              </div>
            )}
            {!loading && !error && !items.length && (
              <div className="my-auto flex flex-col items-center justify-center gap-2 py-8 px-4 text-center bg-[radial-gradient(#FAC775_1px,transparent_1px)] [background-size:12px_12px] bg-[var(--pop-cream)]/30 border-2 border-dashed border-slate-300 rounded-xl">
                <div className="relative grid h-12 w-12 place-items-center rounded-xl border-2 border-[var(--pop-black)] bg-[var(--pop-cream)] text-2xl shadow-[2px_2px_0_var(--pop-black)] mb-1">
                  <span aria-hidden="true">😿</span>
                </div>
                <p className="font-headline font-black text-xs text-slate-900 uppercase">
                  Chưa có Tournament đang mở
                </p>
                <p className="font-sans text-[11px] text-slate-600 font-bold">
                  Hãy quay lại sau hoặc tham gia các trận tại Arena!
                </p>
              </div>
            )}
          </div>
          <div className="border-t-2 border-slate-100 p-2 shrink-0">
            <Pager
              page={safeListPage}
              pageCount={listPageCount}
              onChange={setListPage}
              label="Phân trang danh sách giải đấu"
              status={`${visibleItems.length}/${items.length} giải`}
            />
          </div>
        </section>

        {/* Right column: Tournament details and bracket */}
        <section className="flex min-w-0 flex-col overflow-hidden border-3 border-[var(--pop-black)] bg-white p-4 shadow-[6px_6px_0_var(--pop-black)] rounded-2xl">
          {detailLoading && <LoadingDetail />}
          {!detailLoading && !detail && (
            <div className="my-auto flex flex-col items-center justify-center gap-3 py-16 px-6 text-center bg-[radial-gradient(#FAC775_1px,transparent_1px)] [background-size:12px_12px] bg-[var(--pop-cream)]/30 border-2 border-dashed border-slate-300 rounded-xl">
              <div className="relative grid h-16 w-16 place-items-center rounded-2xl border-3 border-[var(--pop-black)] bg-[var(--pop-cream)] text-3xl shadow-[4px_4px_0_var(--pop-black)] mb-1">
                <span aria-hidden="true">🏆</span>
              </div>
              <h2 className="font-pop-display font-black text-base text-slate-900 uppercase tracking-tight">
                Chọn một giải đấu để xem chi tiết
              </h2>
              <p className="font-sans text-xs text-slate-600 font-bold max-w-sm">
                Xem thông tin luật chơi, cơ cấu giải thưởng, lịch thi đấu vòng bảng và bảng điểm trực tiếp.
              </p>
            </div>
          )}
          {!detailLoading && detail && (
            <TournamentDetail
              detail={detail}
              now={now}
              blockReason={blockReason}
              isRegistered={isRegistered}
              mutating={mutating}
              onMutate={mutate}
              onEnter={enterMatch}
              currentUsername={profile?.username}
            />
          )}
        </section>
      </div>
    </div>
  );
}

function LoadingList() {
  return (
    <div className="flex flex-col gap-3 p-1 animate-pulse" aria-label="Đang tải Tournament">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="border-2 border-slate-200 bg-slate-50 p-3.5 rounded-xl flex flex-col gap-2">
          <div className="flex justify-between items-center">
            <div className="h-5 w-32 bg-slate-200 rounded" />
            <div className="h-4 w-16 bg-slate-200 rounded" />
          </div>
          <div className="h-4 w-44 bg-slate-200 rounded" />
          <div className="h-4 w-28 bg-slate-200 rounded" />
        </div>
      ))}
    </div>
  );
}

function LoadingDetail() {
  return (
    <div className="flex flex-col gap-4 p-2 animate-pulse" aria-label="Đang tải chi tiết Tournament">
      <div className="flex justify-between items-center">
        <div className="h-7 w-48 bg-slate-200 rounded" />
        <div className="h-6 w-24 bg-slate-200 rounded" />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-16 bg-slate-200 rounded-lg" />
        ))}
      </div>
      <div className="h-10 bg-slate-200 rounded-lg" />
      <div className="h-52 bg-slate-200 rounded-xl" />
    </div>
  );
}

function renderStatusBadge(item, now) {
  const deadline = getTournamentDeadline(item);
  const isClosed = deadline && new Date(deadline).getTime() <= now;
  const isFull = (item.registeredCount || 0) >= (item.maxParticipants || 8);

  if (item.status === 'registration') {
    if (isClosed) {
      return (
        <span className="border-2 border-[var(--pop-black)] px-2 py-0.5 text-[10px] font-headline font-black uppercase bg-slate-800 text-white shadow-[1px_1px_0_var(--pop-black)]">
          ĐÃ ĐÓNG CỔNG
        </span>
      );
    }
    if (isFull) {
      return (
        <span className="border-2 border-[var(--pop-black)] px-2 py-0.5 text-[10px] font-headline font-black uppercase bg-amber-400 text-amber-950 shadow-[1px_1px_0_var(--pop-black)]">
          ĐÃ ĐỦ NGƯỜI
        </span>
      );
    }
    return (
      <span className="border-2 border-[var(--pop-black)] px-2 py-0.5 text-[10px] font-headline font-black uppercase bg-[var(--pop-green)] text-emerald-950 shadow-[1px_1px_0_var(--pop-black)]">
        MỞ ĐĂNG KÝ
      </span>
    );
  }
  return <span className={statusClass(item.status)}>{getTournamentStatusLabel(item.status)}</span>;
}

function TournamentCard({ item, now, selected, onOpen }) {
  const deadline = getTournamentDeadline(item);
  const isClosed = deadline && new Date(deadline).getTime() <= now;

  return (
    <button
      type="button"
      onClick={() => onOpen(item._id)}
      className={`border-2 border-[var(--pop-black)] p-3 text-left rounded-xl transition-all ${
        selected
          ? 'bg-[var(--pop-cream)] border-l-6 border-l-[var(--pop-red)] shadow-[4px_4px_0_var(--pop-black)] -translate-y-0.5'
          : 'bg-white hover:bg-slate-50 shadow-[2px_2px_0_var(--pop-black)]'
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <strong className="font-headline font-black text-sm uppercase tracking-tight text-slate-950">{item.name}</strong>
        {renderStatusBadge(item, now)}
      </div>
      <div className="mt-2 grid gap-1 text-xs font-bold text-slate-700">
        <span className="flex items-center gap-1.5">
          <CoinIcon className="h-4 w-4" /> Entry <span className="font-black tabular-nums text-slate-950">{item.entryFee}</span> · Thưởng <span className="font-black text-amber-700 tabular-nums">{item.prizePool?.coins || 0}</span> Coin
        </span>
        <span className="flex items-center gap-1.5">
          <span aria-hidden="true">👥</span> <span className="font-black text-slate-950 tabular-nums">{item.registeredCount || 0}/{item.maxParticipants || 8}</span> người · {formatDate(item.startTime)}
        </span>
        {deadline && item.status !== 'completed' && item.status !== 'cancelled' && (
          <span className={`inline-flex items-center gap-1 text-[11px] font-black px-2 py-0.5 rounded border border-[var(--pop-black)] tabular-nums w-fit ${
            isClosed ? 'bg-slate-200 text-slate-700' : 'bg-rose-50 text-[var(--pop-red)]'
          }`}>
            <span aria-hidden="true">⏱</span> {isClosed ? 'Đã hết hạn nhận đơn' : `${item.status === 'registration' ? 'Đóng đăng ký' : 'Bắt đầu'} sau ${formatCountdown(deadline, now)}`}
          </span>
        )}
      </div>
    </button>
  );
}

const BLOCK_LABEL = { coins: 'Không đủ Coin', full: 'Giải đã đầy', closed: 'Đã đóng đăng ký' };

const TABS = [
  { id: 'rules', label: 'Luật & thưởng' },
  { id: 'bracket', label: 'Lịch đấu' },
  { id: 'standings', label: 'Bảng điểm' },
];

function TournamentDetail({ detail, now, blockReason, isRegistered, mutating, onMutate, onEnter, currentUsername }) {
  const { tournament, standings = [], nextMatch } = detail;
  const rules = tournament.rules || { groupMatches: 3, finalMatches: 5, matchGraceMinutes: 5, placementPoints: { 1: 5, 2: 3, 3: 1, 4: 0 } };
  const [tab, setTab] = useState('rules');
  const tabRefs = useRef({});

  const deadline = getTournamentDeadline(tournament);
  const isClosed = deadline && new Date(deadline).getTime() <= now;

  // Arrow keys move between tabs, as required for the tablist pattern.
  const onTabKeyDown = (event) => {
    const step = event.key === 'ArrowRight' ? 1 : event.key === 'ArrowLeft' ? -1 : 0;
    if (!step) return;
    event.preventDefault();
    const index = TABS.findIndex((entry) => entry.id === tab);
    const next = TABS[(index + step + TABS.length) % TABS.length];
    setTab(next.id);
    tabRefs.current[next.id]?.focus();
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex flex-wrap items-start justify-between gap-3 shrink-0">
        <div>
          <h2 className="font-pop-display text-xl sm:text-2xl font-black uppercase text-slate-950 tracking-tight">{tournament.name}</h2>
          <p className="mt-1 max-w-2xl truncate text-xs sm:text-sm font-medium text-slate-700">{tournament.description || 'Giải đấu 8 người dành cho những tay chơi sống sót giỏi nhất.'}</p>
        </div>
        {renderStatusBadge(tournament, now)}
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2.5 sm:gap-3 md:grid-cols-4 shrink-0">
        <Metric label="Phí tham gia" value={`${tournament.entryFee} Coin`} icon={<CoinIcon className="h-4 w-4" />} tone="cream" />
        <Metric label="Tổng giải thưởng" value={`${tournament.prizePool?.coins || 0} Coin`} icon={<CoinIcon className="h-4 w-4" />} tone="gold" />
        <Metric label="Người chơi" value={`${tournament.registeredCount || 0}/${tournament.maxParticipants || 8}`} icon={<span aria-hidden="true">👥</span>} tone="cream" />
        <Metric label="Bắt đầu" value={formatDate(tournament.startTime)} icon={<span aria-hidden="true">⏰</span>} tone="cream" />
      </div>

      {tournament.status === 'registration' && (
        <div className={`mt-3 border-2 border-[var(--pop-black)] p-2.5 rounded-xl text-xs font-headline font-black shadow-[2px_2px_0_var(--pop-black)] shrink-0 flex flex-wrap items-center justify-between gap-2 ${
          isClosed ? 'bg-slate-100 text-slate-700' : 'bg-[var(--pop-cream)] text-slate-900'
        }`}>
          <span className="flex items-center gap-1.5">
            <span aria-hidden="true">⏱</span> Đóng đăng ký: <span className="tabular-nums font-bold text-slate-950">{formatDate(tournament.registrationClosesAt)}</span>
          </span>
          <span className={`px-2 py-0.5 rounded border border-[var(--pop-black)] text-[11px] tabular-nums font-black ${
            isClosed ? 'bg-slate-300 text-slate-800' : 'bg-rose-100 text-[var(--pop-red)]'
          }`}>
            {isClosed ? 'ĐÃ HẾT HẠN NHẬN ĐƠN' : `Còn ${formatCountdown(tournament.registrationClosesAt || tournament.startTime, now)}`}
          </span>
        </div>
      )}

      {nextMatch && (
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-2 border-[var(--pop-black)] bg-[var(--pop-amber)] p-3 rounded-xl shadow-[2px_2px_0_var(--pop-black)] shrink-0">
          <div>
            <p className="text-[10px] font-headline font-black uppercase text-slate-800 tracking-wider">Trận kế tiếp · {nextMatch.stage}</p>
            <strong className="font-headline font-black text-sm sm:text-base text-slate-950">{nextMatch.id}</strong>
          </div>
          <button
            type="button"
            onClick={onEnter}
            disabled={!!mutating}
            className="btn-retro-pixel px-4 py-2 text-xs font-headline font-black uppercase text-white bg-[var(--pop-red)] shadow-[3px_3px_0_var(--pop-black)] disabled:opacity-50"
          >
            {mutating === 'enter' ? 'Đang vào…' : 'Vào trận'}
          </button>
        </div>
      )}

      {tournament.status === 'registration' && !isRegistered && (
        <div className="mt-3 flex flex-wrap items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() => onMutate('register')}
            disabled={!!blockReason || !!mutating || isClosed}
            className={`btn-retro-pixel px-5 py-2.5 text-xs font-headline font-black uppercase border-2 border-[var(--pop-black)] ${
              blockReason === 'closed' || isClosed
                ? 'bg-neutral-800 text-white cursor-not-allowed shadow-none'
                : blockReason === 'full'
                ? 'bg-amber-400 text-amber-950 cursor-not-allowed shadow-none'
                : blockReason
                ? 'bg-slate-300 text-slate-700 cursor-not-allowed shadow-none'
                : 'bg-[var(--pop-red)] text-white shadow-[3px_3px_0_var(--pop-black)] hover:bg-rose-600'
            }`}
          >
            {mutating === 'register' ? 'Đang đăng ký…' : (blockReason === 'closed' || isClosed) ? 'ĐÃ ĐÓNG ĐĂNG KÝ' : blockReason ? BLOCK_LABEL[blockReason] : 'Đăng ký Tournament'}
          </button>
          {blockReason === 'coins' && !isClosed && (
            <span className="text-xs font-bold text-slate-700">
              Cần <span className="font-black text-slate-950 tabular-nums">{tournament.entryFee} Coin</span> trước khi đóng đăng ký.
            </span>
          )}
        </div>
      )}

      {isRegistered && (
        <div className="mt-3 flex flex-wrap items-center gap-3 shrink-0">
          <span className="border-2 border-[var(--pop-black)] bg-emerald-100 text-emerald-950 px-3 py-1.5 text-xs font-headline font-black uppercase rounded shadow-[1px_1px_0_var(--pop-black)]">
            ✓ Bạn đã đăng ký
          </span>
          {tournament.status === 'registration' && (
            <button
              type="button"
              onClick={() => onMutate('withdraw')}
              disabled={!!mutating}
              className="border-2 border-[var(--pop-black)] bg-white px-3 py-1.5 text-xs font-headline font-black uppercase rounded shadow-[2px_2px_0_var(--pop-black)] hover:bg-slate-50 disabled:opacity-40"
            >
              {mutating === 'withdraw' ? 'Đang xử lý…' : 'Rút và hoàn Coin'}
            </button>
          )}
        </div>
      )}

      {/* Tabs Header */}
      <div role="tablist" aria-label="Nội dung giải đấu" onKeyDown={onTabKeyDown} className="mt-4 flex flex-wrap gap-2 border-b-2 border-slate-200 pb-2 shrink-0">
        {TABS.map((entry) => (
          <button
            key={entry.id}
            ref={(node) => { tabRefs.current[entry.id] = node; }}
            type="button"
            role="tab"
            id={`tournament-tab-${entry.id}`}
            aria-selected={tab === entry.id}
            aria-controls={`tournament-panel-${entry.id}`}
            tabIndex={tab === entry.id ? 0 : -1}
            onClick={() => setTab(entry.id)}
            className={`vf-pager-button border-2 border-[var(--pop-black)] px-4 py-1.5 text-xs font-headline font-black uppercase rounded-lg shadow-[2px_2px_0_var(--pop-black)] transition-all ${
              tab === entry.id
                ? 'bg-[var(--pop-red)] text-white translate-y-0.5 shadow-none'
                : 'bg-white hover:bg-slate-100 text-slate-900'
            }`}
          >
            {entry.label}
          </button>
        ))}
      </div>

      {/* The single scroll owner for tournament detail content */}
      <div
        role="tabpanel"
        id={`tournament-panel-${tab}`}
        aria-labelledby={`tournament-tab-${tab}`}
        tabIndex={0}
        className="vf-body min-h-0 flex-1 overflow-y-auto mt-3 pr-1"
      >
        {tab === 'rules' && <RulesPanel rules={rules} rewards={tournament.cosmeticRewards} prizePool={tournament.prizePool?.coins || 0} />}
        {tab === 'bracket' && (tournament.bracket?.rounds?.length
          ? <BracketPanel rounds={tournament.bracket.rounds} />
          : (
            <div className="flex flex-col items-center justify-center gap-2 py-10 px-4 text-center bg-[radial-gradient(#FAC775_1px,transparent_1px)] [background-size:12px_12px] bg-[var(--pop-cream)]/30 border-2 border-dashed border-slate-300 rounded-xl">
              <div className="relative grid h-12 w-12 place-items-center rounded-xl border-2 border-[var(--pop-black)] bg-amber-100 text-2xl shadow-[2px_2px_0_var(--pop-black)] mb-1">
                <span aria-hidden="true">📅</span>
              </div>
              <p className="font-headline font-black text-xs text-slate-900 uppercase">
                Lịch thi đấu sẽ xuất hiện khi giải bắt đầu
              </p>
            </div>
          ))}
        {tab === 'standings' && <StandingsPanel standings={standings} currentUsername={currentUsername} />}
      </div>
    </div>
  );
}

function RulesPanel({ rules, rewards, prizePool }) {
  const p1 = Math.round(prizePool * 0.6);
  const p2 = Math.round(prizePool * 0.3);
  const p3 = Math.round(prizePool * 0.1);

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <section className="border-2 border-[var(--pop-black)] bg-white p-3.5 rounded-xl shadow-[2px_2px_0_var(--pop-black)]">
        <h3 className="border-b-2 border-[var(--pop-black)] pb-2 font-headline font-black text-xs uppercase text-slate-950 tracking-wide flex items-center gap-1.5">
          <span aria-hidden="true">📜</span> Luật thi đấu
        </h3>
        <ul className="mt-3 grid gap-2 font-sans font-bold text-xs text-slate-800 leading-relaxed">
          <li className="flex items-start gap-2">
            <span className="text-[var(--pop-red)] font-black">▪</span>
            <span>8 người · 2 bảng 4 người · mỗi bảng thi đấu <span className="font-headline font-black text-slate-950">{rules.groupMatches} ván</span>.</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-[var(--pop-red)] font-black">▪</span>
            <span>Top 2 mỗi bảng tiến vào Chung kết <span className="font-headline font-black text-slate-950">{rules.finalMatches} ván</span>.</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-[var(--pop-red)] font-black">▪</span>
            <span>Hệ thống điểm: Hạng 1 = <b className="text-amber-700">{rules.placementPoints?.[1] ?? 5}đ</b>, Hạng 2 = <b className="text-slate-700">{rules.placementPoints?.[2] ?? 3}đ</b>, Hạng 3 = <b className="text-amber-900">{rules.placementPoints?.[3] ?? 1}đ</b>, Hạng 4 = 0đ.</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-[var(--pop-red)] font-black">▪</span>
            <span>Không vào phòng đấu sau <span className="font-headline font-black text-rose-700">{rules.matchGraceMinutes || 5} phút</span> tính từ thời điểm mở phòng sẽ bị xử thua.</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-[var(--pop-red)] font-black">▪</span>
            <span>Trang phục & phụ kiện (Cosmetic) hoàn toàn để trang trí, không tăng bất kỳ chỉ số nào.</span>
          </li>
        </ul>
      </section>

      <section className="border-2 border-[var(--pop-black)] bg-white p-3.5 rounded-xl shadow-[2px_2px_0_var(--pop-black)]">
        <h3 className="border-b-2 border-[var(--pop-black)] pb-2 font-headline font-black text-xs uppercase text-slate-950 tracking-wide flex items-center gap-1.5">
          <span aria-hidden="true">🏆</span> Cơ cấu phần thưởng
        </h3>
        <div className="mt-3 grid gap-2.5 font-sans font-bold text-xs text-slate-800">
          <div className="flex items-center justify-between bg-amber-100 border-2 border-amber-500 p-2.5 rounded-lg shadow-[2px_2px_0_var(--pop-black)]">
            <span className="font-headline font-black text-xs uppercase text-slate-950 flex items-center gap-1.5">
              <CoinIcon className="h-4 w-4" /> Tổng giải thưởng
            </span>
            <span className="font-headline font-black text-base text-amber-900 tabular-nums">{prizePool} Coin</span>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center text-xs font-headline font-black">
            <div className="bg-amber-300 border-2 border-amber-600 p-2 rounded-xl text-amber-950 shadow-[2px_2px_0_var(--pop-black)] flex flex-col items-center">
              <span className="text-base" aria-hidden="true">🥇</span>
              <span className="block text-[10px] uppercase font-black">Hạng 1</span>
              <span className="text-sm font-black text-amber-950">60%</span>
              <span className="text-[10px] font-bold text-amber-900 tabular-nums">({p1} Coin)</span>
            </div>
            <div className="bg-slate-200 border-2 border-slate-500 p-2 rounded-xl text-slate-900 shadow-[2px_2px_0_var(--pop-black)] flex flex-col items-center">
              <span className="text-base" aria-hidden="true">🥈</span>
              <span className="block text-[10px] uppercase font-black">Hạng 2</span>
              <span className="text-sm font-black text-slate-900">30%</span>
              <span className="text-[10px] font-bold text-slate-700 tabular-nums">({p2} Coin)</span>
            </div>
            <div className="bg-amber-100 border-2 border-amber-500 p-2 rounded-xl text-amber-950 shadow-[2px_2px_0_var(--pop-black)] flex flex-col items-center">
              <span className="text-base" aria-hidden="true">🥉</span>
              <span className="block text-[10px] uppercase font-black">Hạng 3</span>
              <span className="text-sm font-black text-amber-900">10%</span>
              <span className="text-[10px] font-bold text-amber-800 tabular-nums">({p3} Coin)</span>
            </div>
          </div>
          {(rewards || []).map((reward) => (
            <div key={`${reward.rank}-${reward.type}-${reward.itemId}`} className="flex items-center justify-between border border-slate-200 p-2 rounded-lg bg-slate-50">
              <span className="font-headline font-black text-xs text-slate-900">Quà Hạng #{reward.rank}</span>
              <span className="font-sans font-bold text-xs text-slate-700">{reward.itemId} ({reward.type})</span>
            </div>
          ))}
          <p className="text-[11px] text-slate-500 font-bold mt-1">
            * Rút đăng ký trước khi đóng cổng giải sẽ được hoàn trả 100% entry fee.
          </p>
        </div>
      </section>
    </div>
  );
}

function BracketPanel({ rounds }) {
  return (
    <section aria-label="Lịch thi đấu các vòng">
      <div className="grid gap-3 md:grid-cols-3">
        {rounds.map((round) => (
          <div key={round.round} className="border-2 border-[var(--pop-black)] bg-[var(--pop-cream)] p-3 rounded-xl shadow-[2px_2px_0_var(--pop-black)] flex flex-col gap-2">
            <div className="flex items-center justify-between gap-2 border-b-2 border-[var(--pop-black)] pb-1.5">
              <strong className="font-headline font-black text-xs uppercase text-slate-950">{round.name}</strong>
              <span className="text-[10px] font-headline font-black px-1.5 py-0.5 bg-white border border-[var(--pop-black)] rounded">{round.matches.length} ván</span>
            </div>
            <div className="grid gap-2">
              {round.matches.map((match) => (
                <div key={match.id} className="border-2 border-[var(--pop-black)] bg-white p-2.5 rounded-lg shadow-[1px_1px_0_var(--pop-black)] text-xs">
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span className="font-headline font-black text-slate-950">{match.id}</span>
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-headline font-black uppercase border ${
                      match.status === 'completed'
                        ? 'bg-emerald-100 border-emerald-500 text-emerald-950'
                        : match.status === 'pending'
                        ? 'bg-amber-100 border-amber-500 text-amber-950'
                        : 'bg-slate-100 border-slate-300 text-slate-700'
                    }`}>
                      {getMatchStatusLabel(match.status)}
                    </span>
                  </div>
                  {match.roomCode && (
                    <p className="font-mono text-[10px] font-bold text-slate-600 mb-1">Mã phòng: <span className="text-slate-950 font-black">{match.roomCode}</span></p>
                  )}
                  <div className="grid gap-1 mt-1 border-t border-slate-100 pt-1">
                    {(match.participants || []).map((person) => {
                      const result = match.result?.find((r) => r.participantId === person.participantId);
                      return (
                        <div key={person.participantId} className="flex justify-between items-center gap-2 text-[11px] font-bold">
                          <span className="truncate text-slate-800">{person.username}</span>
                          <span className="tabular-nums shrink-0 font-headline font-black">
                            {result ? (
                              <span className={result.forfeit ? 'text-rose-700' : 'text-slate-950'}>
                                #{result.placement} · {result.points}đ{result.forfeit ? ' (XỬ THUA)' : ''}
                              </span>
                            ) : (
                              <span className="text-slate-400">—</span>
                            )}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function StandingsPanel({ standings, currentUsername }) {
  // ponytail: tournament standings top-3 highlights use static medal thresholds; upgrade to dynamic tier badges if bracket structure expands beyond 8 players.
  if (!standings.length) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-10 px-4 text-center bg-[radial-gradient(#FAC775_1px,transparent_1px)] [background-size:12px_12px] bg-[var(--pop-cream)]/30 border-2 border-dashed border-slate-300 rounded-xl">
        <div className="relative grid h-12 w-12 place-items-center rounded-xl border-2 border-[var(--pop-black)] bg-[var(--pop-cream)] text-2xl shadow-[2px_2px_0_var(--pop-black)] mb-1">
          <span aria-hidden="true">😿</span>
        </div>
        <p className="font-headline font-black text-xs text-slate-900 uppercase">
          Chưa có dữ liệu bảng điểm
        </p>
        <p className="font-sans text-[11px] text-slate-600 font-bold">
          Bảng điểm sẽ tự động cập nhật khi có người đăng ký tham gia.
        </p>
      </div>
    );
  }

  const renderStandingBadge = (rank) => {
    if (rank === 1) {
      return (
        <span className="inline-flex items-center gap-1 bg-amber-300 border border-amber-600 text-amber-950 font-headline font-black text-xs px-2 py-0.5 rounded shadow-[1px_1px_0_var(--pop-black)]">
          <span aria-hidden="true">🥇</span> #1
        </span>
      );
    }
    if (rank === 2) {
      return (
        <span className="inline-flex items-center gap-1 bg-slate-200 border border-slate-400 text-slate-900 font-headline font-black text-xs px-2 py-0.5 rounded shadow-[1px_1px_0_var(--pop-black)]">
          <span aria-hidden="true">🥈</span> #2
        </span>
      );
    }
    if (rank === 3) {
      return (
        <span className="inline-flex items-center gap-1 bg-amber-100 border border-amber-700 text-amber-950 font-headline font-black text-xs px-2 py-0.5 rounded shadow-[1px_1px_0_var(--pop-black)]">
          <span aria-hidden="true">🥉</span> #3
        </span>
      );
    }
    return <span className="font-headline font-black text-xs text-slate-700">#{rank}</span>;
  };

  return (
    <div className="overflow-x-auto rounded-xl border-2 border-[var(--pop-black)] bg-white shadow-[2px_2px_0_var(--pop-black)]">
      <table className="w-full text-left border-collapse" aria-label="Bảng điểm giải đấu">
        <thead className="vf-sticky-head">
          <tr className="border-b-2 border-[var(--pop-black)] bg-slate-100 text-[10px] font-headline font-black uppercase text-slate-800 tracking-wider">
            <th scope="col" className="py-2.5 px-3 text-center w-20">Hạng</th>
            <th scope="col" className="py-2.5 px-3">Người chơi</th>
            <th scope="col" className="py-2.5 px-3 text-center w-24">Điểm số</th>
            <th scope="col" className="py-2.5 px-3 text-right w-28">Trạng thái</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 font-sans text-xs">
          {standings.map((row, index) => {
            const rank = row.finalRank || index + 1;
            const isMe = currentUsername && row.username === currentUsername;
            return (
              <tr
                key={row.id || row.userId || index}
                className={`transition-colors ${
                  isMe
                    ? 'bg-amber-100/80 border-l-4 border-l-[var(--pop-red)] font-black'
                    : rank === 1
                    ? 'bg-amber-50/70 border-l-4 border-l-amber-500 font-bold'
                    : rank === 2
                    ? 'bg-slate-50/80 border-l-4 border-l-slate-400 font-bold'
                    : rank === 3
                    ? 'bg-orange-50/50 border-l-4 border-l-amber-700 font-bold'
                    : 'hover:bg-slate-50'
                }`}
              >
                <td className="py-2.5 px-3 text-center">
                  {renderStandingBadge(rank)}
                </td>
                <td className="py-2.5 px-3 font-headline font-black text-slate-900">
                  <div className="flex items-center gap-1.5">
                    <span>{row.username}</span>
                    {isMe && (
                      <span className="px-1 py-0.2 bg-[var(--pop-red)] text-white text-[9px] rounded font-black uppercase">
                        Bạn
                      </span>
                    )}
                  </div>
                </td>
                <td className="py-2.5 px-3 text-center font-headline font-black text-sm tabular-nums text-slate-950">
                  {row.score || 0}
                </td>
                <td className="py-2.5 px-3 text-right">
                  {row.status === 'winner' ? (
                    <span className="inline-flex items-center gap-0.5 px-2 py-0.5 bg-[var(--pop-green)] text-[var(--pop-black)] text-[10px] font-headline font-black uppercase rounded border border-[var(--pop-black)]">
                      🏆 VÔ ĐỊCH
                    </span>
                  ) : (
                    <span className="text-slate-600 font-bold text-[11px]">
                      {row.status === 'eliminated' ? 'Bị loại' : 'Đang thi đấu'}
                    </span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function Metric({ label, value, icon, tone = 'cream' }) {
  const toneClass = tone === 'gold'
    ? 'bg-amber-100 border-amber-500 shadow-[2px_2px_0_var(--pop-black)]'
    : 'bg-[var(--pop-cream)] border-[var(--pop-black)] shadow-[2px_2px_0_var(--pop-black)]';

  return (
    <div className={`border-2 p-2.5 sm:p-3 rounded-xl ${toneClass}`}>
      <div className="flex items-center justify-between gap-1">
        <span className="block text-[10px] font-headline font-black uppercase text-slate-700 tracking-wider truncate">{label}</span>
        {icon && <span className="shrink-0 text-xs">{icon}</span>}
      </div>
      <strong className="mt-1 block text-sm sm:text-base font-headline font-black text-slate-950 tabular-nums truncate">{value}</strong>
    </div>
  );
}
