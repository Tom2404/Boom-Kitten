import React, { useEffect, useState } from 'react';
import { CoinIcon } from '../components/CoinDisplay.jsx';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:5000';
const requestId = (prefix) => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}`;

export default function Tournaments({ setPage }) {
  const [items, setItems] = useState([]);
  const [detail, setDetail] = useState(null);
  const [message, setMessage] = useState('');
  const token = localStorage.getItem('accessToken');

  const loadList = async () => {
    const response = await fetch(`${API_URL}/api/tournaments`);
    const body = await response.json();
    if (response.ok) setItems(body.data || []);
  };

  const open = async (id) => {
    if (!token) return setMessage('Hãy đăng nhập để xem và đăng ký giải đấu.');
    const response = await fetch(`${API_URL}/api/tournaments/${id}`, { headers: { Authorization: `Bearer ${token}` } });
    const body = await response.json();
    if (response.ok) setDetail(body.data);
    else setMessage(body.message || 'Không thể tải giải đấu.');
  };

  const mutate = async (action) => {
    const response = await fetch(`${API_URL}/api/tournaments/${detail.tournament._id}/${action}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ requestId: requestId(action) }),
    });
    const body = await response.json();
    setMessage(response.ok ? (action === 'register' ? 'Đăng ký thành công.' : 'Đã rút và hoàn Coin.') : (body.error?.message || body.message || 'Thao tác thất bại.'));
    if (response.ok) { await open(detail.tournament._id); await loadList(); }
  };

  const enterMatch = async () => {
    const response = await fetch(`${API_URL}/api/tournaments/${detail.tournament._id}/matches/room`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ matchReference: detail.nextMatch.matchReference }),
    });
    const body = await response.json();
    if (!response.ok) return setMessage(body.error?.message || body.message || 'Không thể tạo phòng Tournament.');
    localStorage.setItem('autoJoinRoomCode', body.data.roomCode);
    setPage('Game');
  };

  useEffect(() => { loadList(); }, []);

  return (
    <div className="grid gap-6 font-pop-body lg:grid-cols-[minmax(280px,0.8fr)_minmax(0,1.5fr)]">
      <section className="border-3 border-[var(--pop-black)] bg-white p-5 shadow-[5px_5px_0_var(--pop-black)]">
        <h1 className="font-pop-display text-3xl font-black uppercase">Tournament</h1>
        <p className="mt-2 text-sm font-bold opacity-60">Tranh tài để nhận Coin và vật phẩm độc quyền. Không yêu cầu thứ hạng.</p>
        {message && <p className="mt-4 border-2 border-[var(--pop-black)] bg-[var(--pop-amber)] p-3 text-sm font-bold">{message}</p>}
        <div className="mt-5 grid gap-3">
          {items.map((item) => (
            <button key={item._id} onClick={() => open(item._id)} className="border-2 border-[var(--pop-black)] p-3 text-left shadow-[2px_2px_0_var(--pop-black)] hover:bg-[var(--pop-cream)]">
              <strong className="block uppercase">{item.name}</strong>
              <span className="mt-1 flex items-center gap-1 text-xs font-bold"><CoinIcon className="h-4 w-4" /> {item.entryFee} entry · {item.registeredCount}/{item.maxParticipants}</span>
            </button>
          ))}
          {!items.length && <p className="py-8 text-center text-sm font-bold opacity-50">Chưa có giải đấu đang mở.</p>}
        </div>
      </section>

      <section className="border-3 border-[var(--pop-black)] bg-white p-5 shadow-[5px_5px_0_var(--pop-black)]">
        {!detail ? <p className="py-16 text-center font-bold opacity-50">Chọn một giải đấu để xem lịch, phần thưởng và bảng điểm.</p> : (
          <>
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div><h2 className="font-pop-display text-2xl font-black uppercase">{detail.tournament.name}</h2><p className="mt-1 text-sm">{detail.tournament.description}</p></div>
              <span className="border-2 border-[var(--pop-black)] bg-[var(--pop-red)] px-3 py-1 text-xs font-black uppercase text-white">{detail.tournament.status}</span>
            </div>
            <div className="mt-5 grid grid-cols-2 gap-3">
              <Metric label="Entry fee" value={`${detail.tournament.entryFee} Coin`} />
              <Metric label="Prize pool" value={`${detail.tournament.prizePool.coins} Coin`} />
              <Metric label="Bắt đầu" value={new Date(detail.tournament.startTime).toLocaleString()} />
              <Metric label="Người chơi" value={`${detail.tournament.registeredCount}/${detail.tournament.maxParticipants}`} />
            </div>
            {!!detail.tournament.cosmeticRewards?.length && <div className="mt-4 border-2 border-[var(--pop-black)] p-3"><strong className="uppercase">Vật phẩm độc quyền</strong>{detail.tournament.cosmeticRewards.map((reward) => <p key={`${reward.rank}-${reward.type}-${reward.itemId}`} className="mt-1 text-sm">#{reward.rank}: {reward.itemId} ({reward.type})</p>)}</div>}
            <div className="mt-5 flex gap-3">
              {detail.nextMatch && <button onClick={enterMatch} className="border-2 border-[var(--pop-black)] bg-[var(--pop-amber)] px-5 py-3 font-black uppercase shadow-[3px_3px_0_var(--pop-black)]">Vào trận · {detail.nextMatch.stage}</button>}
              {!detail.registration || detail.registration.paymentStatus === 'refunded'
                ? <button onClick={() => mutate('register')} className="border-2 border-[var(--pop-black)] bg-[var(--pop-red)] px-5 py-3 font-black uppercase text-white shadow-[3px_3px_0_var(--pop-black)]">Đăng ký</button>
                : <button onClick={() => mutate('withdraw')} disabled={detail.tournament.status !== 'registration'} className="border-2 border-[var(--pop-black)] bg-white px-5 py-3 font-black uppercase shadow-[3px_3px_0_var(--pop-black)] disabled:opacity-40">Rút đăng ký</button>}
            </div>
            {!!detail.tournament.bracket?.rounds?.length && <div className="mt-7">
              <h3 className="border-b-2 border-[var(--pop-black)] pb-2 font-black uppercase">Lịch thi đấu</h3>
              <div className="mt-3 grid gap-3">{detail.tournament.bracket.rounds.map((round) => <div key={round.round} className="border-2 border-[var(--pop-black)] p-3"><strong className="uppercase">{round.name}</strong><div className="mt-2 grid gap-1">{round.matches.map((match) => <div key={match.id} className="flex justify-between text-sm"><span>{match.id}</span><b>{match.status}</b></div>)}</div></div>)}</div>
            </div>}
            <h3 className="mt-7 border-b-2 border-[var(--pop-black)] pb-2 font-black uppercase">Bảng điểm</h3>
            <div className="mt-3 grid gap-2">{detail.standings.map((row, index) => <div key={row.id} className="flex justify-between border border-[var(--pop-black)] p-2 text-sm"><span>#{row.finalRank || index + 1} {row.username}</span><strong>{row.score} điểm</strong></div>)}</div>
          </>
        )}
      </section>
    </div>
  );
}

function Metric({ label, value }) {
  return <div className="border-2 border-[var(--pop-black)] bg-[var(--pop-cream)] p-3"><span className="block text-[10px] font-black uppercase opacity-60">{label}</span><strong className="mt-1 block text-sm">{value}</strong></div>;
}
