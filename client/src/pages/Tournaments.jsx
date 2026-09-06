import React, { useEffect, useMemo, useState } from 'react';
import { CoinIcon } from '../components/CoinDisplay.jsx';
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

  return (
    <div className="grid gap-6 font-pop-body lg:grid-cols-[minmax(290px,0.8fr)_minmax(0,1.5fr)]">
      <section className="border-3 border-[var(--pop-black)] bg-white p-5 shadow-[5px_5px_0_var(--pop-black)]">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] opacity-55">Competitive mode</p>
            <h1 className="font-pop-display text-3xl font-black uppercase">Tournament</h1>
          </div>
          {token && <span className="flex items-center gap-1 border-2 border-[var(--pop-black)] bg-[var(--pop-cream)] px-2 py-1 text-xs font-black"><CoinIcon className="h-4 w-4" /> {walletCoins === null ? '…' : walletCoins}</span>}
        </div>
        <p className="mt-2 text-sm font-bold opacity-65">8 người · 2 bảng · Chung kết · Coin và cosmetic độc quyền.</p>
        {(error || message) && <div role={error ? 'alert' : 'status'} className={`mt-4 border-2 border-[var(--pop-black)] p-3 text-sm font-bold ${error ? 'bg-[var(--pop-red)] text-white' : 'bg-[var(--pop-amber)]'}`}>{error || message}</div>}
        <div className="mt-5 grid gap-3" aria-busy={loading}>
          {loading && <LoadingList />}
          {!loading && error && <button type="button" onClick={loadList} className="border-2 border-[var(--pop-black)] bg-[var(--pop-cream)] p-3 text-sm font-black uppercase">Thử tải lại</button>}
          {!loading && !error && items.map((item) => <TournamentCard key={item._id} item={item} now={now} selected={detail?.tournament?._id === item._id} onOpen={open} />)}
          {!loading && !error && !items.length && <p className="border-2 border-dashed border-[var(--pop-black)] p-8 text-center text-sm font-bold opacity-55">Chưa có Tournament đang mở.</p>}
        </div>
      </section>

      <section className="min-w-0 border-3 border-[var(--pop-black)] bg-white p-5 shadow-[5px_5px_0_var(--pop-black)]">
        {detailLoading && <LoadingDetail />}
        {!detailLoading && !detail && <p className="py-16 text-center font-bold opacity-50">Chọn một giải đấu để xem luật, phần thưởng và bảng điểm.</p>}
        {!detailLoading && detail && <TournamentDetail detail={detail} now={now} blockReason={blockReason} isRegistered={isRegistered} mutating={mutating} onMutate={mutate} onEnter={enterMatch} />}
      </section>
    </div>
  );
}

function LoadingList() {
  return <div className="space-y-3" aria-label="Đang tải Tournament"><div className="h-20 animate-pulse border-2 border-[var(--pop-black)] bg-[var(--pop-cream)]" /><div className="h-20 animate-pulse border-2 border-[var(--pop-black)] bg-[var(--pop-cream)]" /></div>;
}

function LoadingDetail() {
  return <div className="space-y-4" aria-label="Đang tải chi tiết Tournament"><div className="h-12 animate-pulse bg-[var(--pop-cream)]" /><div className="h-32 animate-pulse bg-[var(--pop-cream)]" /><div className="h-56 animate-pulse bg-[var(--pop-cream)]" /></div>;
}

function TournamentCard({ item, now, selected, onOpen }) {
  const deadline = getTournamentDeadline(item);
  return (
    <button type="button" onClick={() => onOpen(item._id)} className={`border-2 border-[var(--pop-black)] p-3 text-left shadow-[2px_2px_0_var(--pop-black)] transition hover:-translate-y-0.5 hover:bg-[var(--pop-cream)] focus:outline-none focus:ring-2 focus:ring-[var(--pop-red)] ${selected ? 'bg-[var(--pop-cream)]' : 'bg-white'}`}>
      <div className="flex items-start justify-between gap-2"><strong className="uppercase">{item.name}</strong><span className={statusClass(item.status)}>{getTournamentStatusLabel(item.status)}</span></div>
      <div className="mt-2 grid gap-1 text-xs font-bold opacity-75">
        <span className="flex items-center gap-1"><CoinIcon className="h-4 w-4" /> Entry {item.entryFee} · Prize {item.prizePool?.coins || 0} Coin</span>
        <span>{item.registeredCount || 0}/{item.maxParticipants || 8} người · {formatDate(item.startTime)}</span>
        {deadline && item.status !== 'completed' && item.status !== 'cancelled' && <span className="text-[var(--pop-red)]">{item.status === 'registration' ? 'Đóng đăng ký' : 'Bắt đầu'} sau {formatCountdown(deadline, now)}</span>}
      </div>
    </button>
  );
}

const BLOCK_LABEL = { coins: 'Không đủ Coin', full: 'Giải đã đầy', closed: 'Đã đóng đăng ký' };

function TournamentDetail({ detail, now, blockReason, isRegistered, mutating, onMutate, onEnter }) {
  const { tournament, standings = [], nextMatch } = detail;
  const rules = tournament.rules || { groupMatches: 3, finalMatches: 5, matchGraceMinutes: 5, placementPoints: { 1: 5, 2: 3, 3: 1, 4: 0 } };
  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div><p className="text-xs font-black uppercase tracking-[0.16em] opacity-55">Tournament detail</p><h2 className="font-pop-display text-2xl font-black uppercase">{tournament.name}</h2><p className="mt-1 max-w-2xl text-sm font-medium opacity-75">{tournament.description || 'Giải đấu 8 người dành cho những tay chơi sống sót giỏi nhất.'}</p></div>
        <span className={statusClass(tournament.status)}>{getTournamentStatusLabel(tournament.status)}</span>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4">
        <Metric label="Entry fee" value={`${tournament.entryFee} Coin`} />
        <Metric label="Prize pool" value={`${tournament.prizePool?.coins || 0} Coin`} />
        <Metric label="Người chơi" value={`${tournament.registeredCount || 0}/${tournament.maxParticipants || 8}`} />
        <Metric label="Bắt đầu" value={formatDate(tournament.startTime)} />
      </div>

      {tournament.status === 'registration' && <div className="mt-4 border-2 border-[var(--pop-black)] bg-[var(--pop-cream)] p-3 text-sm font-bold">Đóng đăng ký: {formatDate(tournament.registrationClosesAt)} · Còn {formatCountdown(tournament.registrationClosesAt || tournament.startTime, now)}</div>}
      {nextMatch && <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-2 border-[var(--pop-black)] bg-[var(--pop-amber)] p-3"><div><p className="text-xs font-black uppercase">Trận kế tiếp · {nextMatch.stage}</p><strong>{nextMatch.id}</strong><p className="text-xs font-bold">Vào phòng để giữ chỗ trong grace period 5 phút.</p></div><button type="button" onClick={onEnter} disabled={!!mutating} className="border-2 border-[var(--pop-black)] bg-[var(--pop-red)] px-4 py-3 text-xs font-black uppercase text-white shadow-[3px_3px_0_var(--pop-black)] disabled:opacity-50">{mutating === 'enter' ? 'Đang vào…' : 'Vào trận'}</button></div>}

      {tournament.status === 'registration' && !isRegistered && <div className="mt-4 flex flex-wrap items-center gap-3"><button type="button" onClick={() => onMutate('register')} disabled={!!blockReason || !!mutating} className="border-2 border-[var(--pop-black)] bg-[var(--pop-red)] px-5 py-3 text-xs font-black uppercase text-white shadow-[3px_3px_0_var(--pop-black)] disabled:cursor-not-allowed disabled:opacity-40">{mutating === 'register' ? 'Đang đăng ký…' : blockReason ? BLOCK_LABEL[blockReason] : 'Đăng ký Tournament'}</button>{blockReason === 'coins' && <span className="text-xs font-bold opacity-65">Cần {tournament.entryFee} Coin trước khi đóng đăng ký.</span>}</div>}
      {isRegistered && <div className="mt-4 flex flex-wrap items-center gap-3"><span className="border-2 border-[var(--pop-black)] bg-[var(--pop-green,#65c18c)] px-3 py-2 text-xs font-black uppercase">Bạn đã đăng ký</span>{tournament.status === 'registration' && <button type="button" onClick={() => onMutate('withdraw')} disabled={!!mutating} className="border-2 border-[var(--pop-black)] bg-white px-4 py-2 text-xs font-black uppercase disabled:opacity-40">{mutating === 'withdraw' ? 'Đang xử lý…' : 'Rút và hoàn Coin'}</button>}</div>}

      <RulesPanel rules={rules} rewards={tournament.cosmeticRewards} prizePool={tournament.prizePool?.coins || 0} />
      {!!tournament.bracket?.rounds?.length && <BracketPanel rounds={tournament.bracket.rounds} />}
      <StandingsPanel standings={standings} />
    </div>
  );
}

function RulesPanel({ rules, rewards, prizePool }) {
  return <div className="mt-7 grid gap-4 md:grid-cols-2"><section className="border-2 border-[var(--pop-black)] p-3"><h3 className="border-b-2 border-[var(--pop-black)] pb-2 font-black uppercase">Luật chơi</h3><ul className="mt-3 grid gap-2 text-sm font-bold"><li>8 người · 2 bảng 4 người · mỗi bảng {rules.groupMatches} ván.</li><li>Top 2 mỗi bảng vào Chung kết {rules.finalMatches} ván.</li><li>Điểm: Hạng 1 = {rules.placementPoints?.[1] ?? 5}, Hạng 2 = {rules.placementPoints?.[2] ?? 3}, Hạng 3 = {rules.placementPoints?.[3] ?? 1}, Hạng 4 = {rules.placementPoints?.[4] ?? 0}.</li><li>Không vào trận sau {rules.matchGraceMinutes || 5} phút sẽ bị xử thua.</li><li>Cosmetic chỉ để trang trí, không tăng sức mạnh.</li></ul></section><section className="border-2 border-[var(--pop-black)] p-3"><h3 className="border-b-2 border-[var(--pop-black)] pb-2 font-black uppercase">Phần thưởng</h3><div className="mt-3 grid gap-2 text-sm font-bold"><p>Prize pool cố định: <span className="text-[var(--pop-red)]">{prizePool} Coin</span></p><p>Hạng 1: 60% · Hạng 2: 30% · Hạng 3: 10%</p>{(rewards || []).map((reward) => <p key={`${reward.rank}-${reward.type}-${reward.itemId}`}>#{reward.rank}: {reward.itemId} ({reward.type})</p>)}<p className="opacity-65">Rút trước khi đóng đăng ký được hoàn 100% entry fee.</p></div></section></div>;
}

function BracketPanel({ rounds }) {
  return <section className="mt-7"><h3 className="border-b-2 border-[var(--pop-black)] pb-2 font-black uppercase">Lịch thi đấu</h3><div className="mt-3 grid gap-3 md:grid-cols-3">{rounds.map((round) => <div key={round.round} className="border-2 border-[var(--pop-black)] bg-[var(--pop-cream)] p-3"><div className="flex items-center justify-between gap-2"><strong className="uppercase">{round.name}</strong><span className="text-[10px] font-black">{round.matches.length} ván</span></div><div className="mt-3 grid gap-2">{round.matches.map((match) => <div key={match.id} className="border border-[var(--pop-black)] bg-white p-2 text-xs"><div className="flex items-center justify-between gap-2"><span className="font-black">{match.id}</span><span className="font-black">{getMatchStatusLabel(match.status)}</span></div>{match.roomCode && <p className="mt-1 font-mono opacity-65">Room {match.roomCode}</p>}<div className="mt-2 grid gap-1">{(match.participants || []).map((person) => { const result = match.result?.find((row) => row.participantId === person.participantId); return <div key={person.participantId} className="flex justify-between gap-2 font-bold"><span>{person.username}</span><span>{result ? `#${result.placement} · ${result.points}đ${result.forfeit ? ' · xử thua' : ''}` : '—'}</span></div>; })}</div></div>)}</div></div>)}</div></section>;
}

function StandingsPanel({ standings }) {
  return <section className="mt-7"><h3 className="border-b-2 border-[var(--pop-black)] pb-2 font-black uppercase">Bảng điểm</h3><div className="mt-3 grid gap-2">{standings.length ? standings.map((row, index) => <div key={row.id} className="flex items-center justify-between gap-3 border-2 border-[var(--pop-black)] p-2 text-sm"><span><b>#{row.finalRank || index + 1}</b> {row.username}{row.status === 'winner' ? ' · VÔ ĐỊCH' : ''}</span><strong>{row.score || 0} điểm</strong></div>) : <p className="border-2 border-dashed border-[var(--pop-black)] p-5 text-sm font-bold opacity-55">Bảng điểm sẽ xuất hiện khi có người đăng ký.</p>}</div></section>;
}

function Metric({ label, value }) {
  return <div className="border-2 border-[var(--pop-black)] bg-[var(--pop-cream)] p-3"><span className="block text-[10px] font-black uppercase opacity-60">{label}</span><strong className="mt-1 block text-sm">{value}</strong></div>;
}
