import React, { useCallback, useEffect, useState } from 'react';
import { PRESET_AVATARS } from '../components/PlayerAvatar.jsx';
import { PixelFriendsIcon, PixelSearchIcon } from '../components/PixelIcons.jsx';
import { useLanguage } from '../context/LanguageContext.jsx';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:5000';

function FriendRow({ person, actions, statusBadge }) {
  return (
    <li className="flex items-center gap-3 border-2 border-[var(--pop-black)] bg-white p-3 sm:p-3.5 shadow-[3px_3px_0_var(--pop-black)] rounded-xl transition-all hover:translate-y-[-1px]">
      <span className="grid h-12 w-12 place-items-center border-2 border-[var(--pop-black)] bg-[var(--pop-cream)] text-2xl rounded-xl shrink-0 shadow-[1px_1px_0_var(--pop-black)] overflow-hidden" aria-hidden="true">
        {PRESET_AVATARS[person.avatar] || person.username?.slice(0, 2).toUpperCase()}
      </span>
      <div className="min-w-0 flex-1 flex flex-col">
        <strong className="truncate font-pop-accent text-sm sm:text-base font-black uppercase text-[var(--pop-black)] leading-tight">
          {person.username}
        </strong>
        {statusBadge && <div className="mt-1">{statusBadge}</div>}
      </div>
      {actions && <span className="flex flex-wrap items-center gap-2 shrink-0">{actions}</span>}
    </li>
  );
}

export default function Friends() {
  const { language } = useLanguage();
  const [relationships, setRelationships] = useState({ friends: [], incoming: [], outgoing: [] });
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [state, setState] = useState({ loading: true, pendingId: '', message: '', error: false });
  const token = localStorage.getItem('accessToken');

  const request = useCallback(async (endpoint, options = {}) => {
    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        ...(options.headers || {}),
      },
    });
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
    try {
      setResults(await request(`/api/users/search?q=${encodeURIComponent(query.trim())}`));
    } catch (error) {
      setState((current) => ({ ...current, message: error.message, error: true }));
    }
  };

  const buttonBase = 'border-2 border-[var(--pop-black)] px-4 py-2 text-xs font-pop-accent font-black uppercase shadow-[2px_2px_0_var(--pop-black)] rounded-xl transition-all cursor-pointer min-h-[38px] flex items-center justify-center disabled:opacity-50';

  return (
    <div className="flex flex-col gap-6 select-none text-left font-pop-body max-w-7xl mx-auto px-2 sm:px-4 py-3">
      {/* Header and Summary Badge */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div className="text-left">
          <h1 
            className="font-pop-display font-black text-4xl md:text-6xl text-white uppercase tracking-tight relative leading-none py-1 text-stroke-black-3"
            style={{
              textShadow: '4px 4px 0px var(--pop-orange)'
            }}
          >
            {language === 'en' ? 'Friends' : 'Bạn Bè'}
          </h1>
          <p className="text-xs sm:text-sm font-bold text-slate-800 mt-2 max-w-xl leading-relaxed">
            {language === 'en'
              ? 'Manage friend requests and connect with players to invite them into game rooms.'
              : 'Quản lý lời mời kết bạn và danh sách đồng đội để rủ vào phòng so tài.'}
          </p>
        </div>

        {/* Top-Right HUD Battle Badge */}
        <div className="bg-white border-3 border-[var(--pop-black)] px-5 py-3 rounded-2xl flex items-center gap-3.5 shadow-[4px_4px_0_var(--pop-black)]">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-rose-100 border-2 border-[var(--pop-black)]">
            <PixelFriendsIcon size={18} className="text-[var(--pop-red)]" />
          </div>
          <div className="flex flex-col">
            <span className="font-pixel text-[11px] font-black uppercase text-slate-600 leading-none">
              {language === 'en' ? 'Social Network' : 'Mạng lưới'}
            </span>
            <span className="font-pop-accent font-black text-sm sm:text-base text-[var(--pop-black)] tabular-nums leading-snug">
              {relationships.friends.length} {language === 'en' ? 'Friends' : 'Bạn bè'}
            </span>
          </div>
        </div>
      </div>

      {/* Notification Toast */}
      {state.message && (
        <div 
          className={`p-3.5 rounded-xl text-xs sm:text-sm font-pop-accent font-bold text-center border-3 border-[var(--pop-black)] shadow-[4px_4px_0_var(--pop-black)] ${
            state.error ? 'bg-[var(--pop-red)] text-white' : 'bg-amber-300 text-neutral-950'
          }`}
          role={state.error ? 'alert' : 'status'}
        >
          {state.message}
        </div>
      )}

      {/* Main 2-Column Neo-Brutalist Layout */}
      <div className="grid gap-6 font-pop-body lg:grid-cols-2">
        {/* Left Column: Player Search */}
        <section className="border-3 border-[var(--pop-black)] bg-[var(--pop-cream)] p-5 sm:p-6 shadow-[5px_5px_0_var(--pop-black)] rounded-2xl flex flex-col gap-4">
          <div className="flex items-center gap-2 border-b-3 border-[var(--pop-black)] pb-3">
            <PixelSearchIcon size={18} className="text-[var(--pop-black)]" />
            <h2 className="font-pop-display text-lg sm:text-xl font-black uppercase text-[var(--pop-black)]">
              {language === 'en' ? 'Find Players' : 'Tìm Người Chơi'}
            </h2>
          </div>

          <form onSubmit={search} className="flex gap-2">
            <label className="sr-only" htmlFor="friend-search">
              {language === 'en' ? 'Player username' : 'Tên người chơi'}
            </label>
            <input 
              id="friend-search" 
              value={query} 
              onChange={(event) => setQuery(event.target.value)} 
              minLength="2" 
              maxLength="32" 
              className="min-w-0 flex-1 border-3 border-[var(--pop-black)] px-4 py-2.5 font-bold text-sm bg-white rounded-xl shadow-[2px_2px_0_var(--pop-black)] focus:ring-2 focus:ring-cyan-600 outline-none" 
              placeholder={language === 'en' ? 'Enter at least 2 characters...' : 'Nhập ít nhất 2 ký tự...'} 
            />
            <button 
              type="submit"
              className={`${buttonBase} bg-[var(--pop-amber)] hover:bg-yellow-300 hover:translate-x-[-1px] hover:translate-y-[-1px] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none`}
            >
              {language === 'en' ? 'Search' : 'Tìm kiếm'}
            </button>
          </form>

          {results.length > 0 && (
            <div className="mt-2 flex flex-col gap-3">
              <span className="font-pixel text-xs font-black uppercase text-slate-700">
                {language === 'en' ? `Search Results (${results.length})` : `Kết quả tìm kiếm (${results.length})`}
              </span>
              <ul className="grid gap-3">
                {results.map((person) => (
                  <FriendRow 
                    key={person._id} 
                    person={person} 
                    actions={
                      <button 
                        type="button"
                        className={`${buttonBase} bg-[var(--pop-amber)] hover:bg-yellow-300`} 
                        disabled={state.pendingId === person._id} 
                        onClick={() => mutate(person._id, '/request')}
                      >
                        {state.pendingId === person._id ? '...' : (language === 'en' ? 'Add Friend' : 'Kết bạn')}
                      </button>
                    } 
                  />
                ))}
              </ul>
            </div>
          )}
        </section>

        {/* Right Column: Incoming, Friends List, and Outgoing */}
        <div className="grid content-start gap-6">
          {/* Incoming Requests */}
          <section className="border-3 border-[var(--pop-black)] bg-white p-5 sm:p-6 shadow-[5px_5px_0_var(--pop-black)] rounded-2xl flex flex-col gap-4">
            <div className="flex items-center justify-between border-b-3 border-[var(--pop-black)] pb-3">
              <h2 className="font-pop-display text-lg sm:text-xl font-black uppercase text-[var(--pop-black)]">
                {language === 'en' ? 'Incoming Requests' : 'Lời Mời Đến'}
              </h2>
              <span className="border-2 border-[var(--pop-black)] bg-[var(--pop-red)] px-2.5 py-0.5 font-pixel text-xs font-black uppercase text-white rounded-md shadow-[1px_1px_0_var(--pop-black)]">
                {relationships.incoming.length}
              </span>
            </div>

            {relationships.incoming.length === 0 ? (
              <p className="text-xs sm:text-sm font-bold text-slate-600 py-3 text-center">
                {language === 'en' ? 'No pending incoming friend requests.' : 'Không có lời mời kết bạn nào đang chờ.'}
              </p>
            ) : (
              <ul className="grid gap-3">
                {relationships.incoming.map((person) => (
                  <FriendRow 
                    key={person._id} 
                    person={person} 
                    actions={
                      <>
                        <button 
                          type="button"
                          className={`${buttonBase} bg-emerald-500 text-white hover:bg-emerald-600`} 
                          onClick={() => mutate(person._id, '/accept')}
                        >
                          {language === 'en' ? 'Accept' : 'Chấp nhận'}
                        </button>
                        <button 
                          type="button"
                          className={`${buttonBase} bg-white text-slate-800 hover:bg-stone-100`} 
                          onClick={() => mutate(person._id, '/decline')}
                        >
                          {language === 'en' ? 'Decline' : 'Từ chối'}
                        </button>
                      </>
                    } 
                  />
                ))}
              </ul>
            )}
          </section>

          {/* Friends List */}
          <section className="border-3 border-[var(--pop-black)] bg-white p-5 sm:p-6 shadow-[5px_5px_0_var(--pop-black)] rounded-2xl flex flex-col gap-4">
            <div className="flex items-center justify-between border-b-3 border-[var(--pop-black)] pb-3">
              <h2 className="font-pop-display text-lg sm:text-xl font-black uppercase text-[var(--pop-black)]">
                {language === 'en' ? 'Friend List' : 'Danh Sách Bạn Bè'}
              </h2>
              <span className="border-2 border-[var(--pop-black)] bg-amber-300 px-2.5 py-0.5 font-pixel text-xs font-black uppercase text-neutral-900 rounded-md shadow-[1px_1px_0_var(--pop-black)]">
                {relationships.friends.length}
              </span>
            </div>

            {state.loading ? (
              <p className="font-bold text-center py-6 animate-pulse" role="status">
                {language === 'en' ? 'Loading friends...' : 'Đang tải danh sách…'}
              </p>
            ) : relationships.friends.length === 0 ? (
              <div className="text-center py-8 bg-[var(--pop-cream)]/40 border-2 border-dashed border-[var(--pop-black)]/30 rounded-xl">
                <span className="text-3xl" role="img" aria-label="friends">🐱</span>
                <p className="font-pop-display font-black uppercase mt-2 text-[var(--pop-black)] text-sm">
                  {language === 'en' ? 'No friends yet' : 'Chưa có bạn bè'}
                </p>
                <p className="text-xs text-slate-700 font-bold mt-1">
                  {language === 'en' ? 'Search for players on the left to add friends!' : 'Tìm người chơi ở khung bên trái để kết bạn nhé!'}
                </p>
              </div>
            ) : (
              <ul className="grid gap-3">
                {relationships.friends.map((person) => (
                  <FriendRow 
                    key={person._id} 
                    person={person} 
                    actions={
                      <button 
                        type="button"
                        className={`${buttonBase} bg-white text-rose-700 hover:bg-rose-50`} 
                        onClick={() => mutate(person._id, '', 'DELETE')}
                      >
                        {language === 'en' ? 'Remove' : 'Xoá bạn'}
                      </button>
                    } 
                  />
                ))}
              </ul>
            )}
          </section>

          {/* Outgoing Requests */}
          {relationships.outgoing.length > 0 && (
            <section className="border-3 border-dashed border-[var(--pop-black)]/60 bg-amber-50/50 p-5 shadow-[3px_3px_0_var(--pop-black)] rounded-2xl flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <h2 className="font-pop-display text-base sm:text-lg font-black uppercase text-[var(--pop-black)]">
                  {language === 'en' ? 'Pending Responses' : 'Đang Chờ Phản Hồi'}
                </h2>
                <span className="border border-[var(--pop-black)] bg-amber-200 text-neutral-900 text-[10px] font-pixel font-black px-2 py-0.5 rounded-md">
                  {relationships.outgoing.length}
                </span>
              </div>
              <ul className="grid gap-2.5">
                {relationships.outgoing.map((person) => (
                  <FriendRow 
                    key={person._id} 
                    person={person} 
                    statusBadge={
                      <span className="text-[10px] font-pixel font-black uppercase text-amber-800 bg-amber-100 border border-amber-300 px-2 py-0.5 rounded">
                        {language === 'en' ? 'Request Sent' : 'Đã gửi lời mời'}
                      </span>
                    }
                  />
                ))}
              </ul>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
