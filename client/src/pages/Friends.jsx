import React, { useCallback, useEffect, useState } from 'react';
import { PRESET_AVATARS } from '../components/PlayerAvatar.jsx';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:5000';

function FriendRow({ person, actions }) {
  return (
    <li className="flex items-center gap-3 border-2 border-[var(--pop-black)] bg-white p-3 shadow-[3px_3px_0_var(--pop-black)]">
      <span className="grid h-11 w-11 place-items-center border-2 border-[var(--pop-black)] bg-[var(--pop-cream)] text-2xl" aria-hidden="true">{PRESET_AVATARS[person.avatar] || person.username?.slice(0, 2).toUpperCase()}</span>
      <strong className="min-w-0 flex-1 truncate font-pop-accent">{person.username}</strong>
      <span className="flex flex-wrap gap-2">{actions}</span>
    </li>
  );
}

export default function Friends() {
  const [relationships, setRelationships] = useState({ friends: [], incoming: [], outgoing: [] });
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [state, setState] = useState({ loading: true, pendingId: '', message: '', error: false });
  const token = localStorage.getItem('accessToken');

  const request = useCallback(async (endpoint, options = {}) => {
    const response = await fetch(`${API_URL}${endpoint}`, { ...options, headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, ...(options.headers || {}) } });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error?.message || data.message || 'Thao tác thất bại.');
    return data;
  }, [token]);

  const load = useCallback(async () => {
    try {
      const data = await request('/api/users/me/friendships');
      setRelationships(data);
      setState((current) => ({ ...current, loading: false, pendingId: '' }));
    } catch (error) {
      setState({ loading: false, pendingId: '', message: error.message, error: true });
    }
  }, [request]);

  useEffect(() => { void load(); }, [load]);

  const mutate = async (personId, action, method = 'POST') => {
    setState((current) => ({ ...current, pendingId: personId, message: '', error: false }));
    try {
      await request(`/api/users/friends/${personId}${action}`, { method });
      setState((current) => ({ ...current, pendingId: '', message: 'Đã cập nhật danh sách bạn bè.', error: false }));
      await load();
    } catch (error) {
      setState((current) => ({ ...current, pendingId: '', message: error.message, error: true }));
    }
  };

  const search = async (event) => {
    event.preventDefault();
    if (query.trim().length < 2) return;
    try { setResults(await request(`/api/users/search?q=${encodeURIComponent(query.trim())}`)); }
    catch (error) { setState((current) => ({ ...current, message: error.message, error: true })); }
  };

  const button = 'border-2 border-[var(--pop-black)] bg-[var(--pop-amber)] px-3 py-2 text-xs font-pop-accent font-black uppercase shadow-[2px_2px_0_var(--pop-black)] disabled:opacity-50';

  return (
    <div className="grid gap-6 font-pop-body lg:grid-cols-2">
      <header className="lg:col-span-2"><h1 className="font-pop-display text-4xl font-black uppercase">Bạn bè</h1><p className="mt-2 font-bold text-[var(--pop-black)]/65">Quản lý lời mời và những người bạn có thể rủ vào phòng.</p></header>
      {state.message && <p className={`lg:col-span-2 border-2 border-[var(--pop-black)] p-3 font-bold ${state.error ? 'bg-[var(--pop-red)] text-white' : 'bg-[var(--pop-amber)]'}`} role={state.error ? 'alert' : 'status'}>{state.message}</p>}
      <section className="border-3 border-[var(--pop-black)] bg-[var(--pop-cream)] p-5 shadow-[5px_5px_0_var(--pop-black)]">
        <h2 className="font-pop-display text-xl font-black uppercase">Tìm người chơi</h2>
        <form onSubmit={search} className="mt-4 flex gap-2"><label className="sr-only" htmlFor="friend-search">Tên người chơi</label><input id="friend-search" value={query} onChange={(event) => setQuery(event.target.value)} minLength="2" maxLength="32" className="min-w-0 flex-1 border-3 border-[var(--pop-black)] px-3 py-2 font-bold" placeholder="Nhập ít nhất 2 ký tự" /><button className={button}>Tìm</button></form>
        <ul className="mt-4 grid gap-3">{results.map((person) => <FriendRow key={person._id} person={person} actions={<button className={button} disabled={state.pendingId === person._id} onClick={() => mutate(person._id, '/request')}>Kết bạn</button>} />)}</ul>
      </section>
      <section className="grid content-start gap-5">
        <div className="border-3 border-[var(--pop-black)] bg-white p-5 shadow-[5px_5px_0_var(--pop-black)]"><h2 className="font-pop-display text-xl font-black uppercase">Lời mời đến ({relationships.incoming.length})</h2><ul className="mt-4 grid gap-3">{relationships.incoming.map((person) => <FriendRow key={person._id} person={person} actions={<><button className={button} onClick={() => mutate(person._id, '/accept')}>Chấp nhận</button><button className={`${button} bg-white`} onClick={() => mutate(person._id, '/decline')}>Từ chối</button></>} />)}</ul></div>
        <div className="border-3 border-[var(--pop-black)] bg-white p-5 shadow-[5px_5px_0_var(--pop-black)]"><h2 className="font-pop-display text-xl font-black uppercase">Bạn bè ({relationships.friends.length})</h2>{state.loading ? <p className="mt-4 font-bold" role="status">Đang tải…</p> : relationships.friends.length === 0 ? <p className="mt-4 text-sm font-bold text-[var(--pop-black)]/60">Chưa có bạn bè.</p> : <ul className="mt-4 grid gap-3">{relationships.friends.map((person) => <FriendRow key={person._id} person={person} actions={<button className={`${button} bg-white`} onClick={() => mutate(person._id, '', 'DELETE')}>Xoá bạn</button>} />)}</ul>}</div>
        {relationships.outgoing.length > 0 && <div className="border-3 border-dashed border-[var(--pop-black)] p-5"><h2 className="font-pop-display text-lg font-black uppercase">Đang chờ phản hồi</h2><ul className="mt-3 grid gap-2">{relationships.outgoing.map((person) => <FriendRow key={person._id} person={person} />)}</ul></div>}
      </section>
    </div>
  );
}
