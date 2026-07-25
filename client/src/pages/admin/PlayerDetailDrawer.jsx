import React, { useEffect, useRef, useState } from 'react';
import { Alert, Button, EmptyState, SkeletonBlock, StatusBadge } from './ui.jsx';
import { formatDateTime, formatNumber } from './utils.js';

const TABS = ['profile', 'games', 'economy', 'timeline'];

function initialTab() {
  if (typeof window === 'undefined') return 'profile';
  const value = new URLSearchParams(window.location.search).get('playerTab');
  return TABS.includes(value) ? value : 'profile';
}

export default function PlayerDetailDrawer({ playerId, request, permissions = [], language = 'vi', onClose, onAction }) {
  const en = language === 'en';
  const drawerRef = useRef(null);
  const [tab, setTab] = useState(initialTab);
  const [state, setState] = useState({ loading: true, data: null, error: '' });

  useEffect(() => {
    let active = true;
    setState({ loading: true, data: null, error: '' });
    request(`/api/admin/users/${playerId}/overview`).then((response) => {
      if (!active) return;
      if (response.ok) setState({ loading: false, data: response.data?.data, error: '' });
      else setState({ loading: false, data: null, error: response.data?.error?.message || response.data?.message || response.error || 'Không thể tải hồ sơ.' });
    });
    return () => { active = false; };
  }, [playerId, request]);

  useEffect(() => {
    const previousFocus = document.activeElement;
    const drawer = drawerRef.current;
    drawer?.querySelector('button')?.focus();
    const onKeyDown = (event) => {
      if (event.key === 'Escape') onClose();
      if (event.key !== 'Tab') return;
      const focusable = drawer?.querySelectorAll('button, a, input, select, textarea, [tabindex]:not([tabindex="-1"])');
      if (!focusable?.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => { document.removeEventListener('keydown', onKeyDown); previousFocus?.focus?.(); };
  }, [onClose]);

  const selectTab = (nextTab) => {
    setTab(nextTab);
    const url = new URL(window.location.href);
    url.searchParams.set('playerTab', nextTab);
    window.history.replaceState({}, '', url);
  };

  const user = state.data?.user;
  const has = (permission) => permissions.includes(permission);
  const tabs = en ? { profile: 'Profile', games: 'Matches', economy: 'Economy', timeline: 'Timeline' } : { profile: 'Hồ sơ', games: 'Trận đấu', economy: 'Kinh tế', timeline: 'Timeline' };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/45 backdrop-blur-[2px]" role="dialog" aria-modal="true" aria-labelledby="player-drawer-title" aria-describedby="player-drawer-description" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <aside ref={drawerRef} className="h-full w-full max-w-2xl overflow-y-auto border-l border-[var(--admin-border)] bg-[var(--admin-surface)] p-4 shadow-[-20px_0_60px_rgba(15,23,42,0.12)] sm:p-6">
        <div className="flex items-start justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-widest text-[var(--admin-danger-text)]">Player 360°</p><h2 id="player-drawer-title" className="mt-1 font-sans text-2xl font-semibold text-slate-950">{user?.username || (en ? 'Player profile' : 'Hồ sơ người chơi')}</h2><p id="player-drawer-description" className="mt-1 text-sm font-semibold text-slate-500">{user ? `${user.email} · ID ${user._id}` : (en ? 'Loading player details.' : 'Đang tải thông tin người chơi.')}</p></div><Button variant="secondary" onClick={onClose} aria-label={en ? 'Close player profile' : 'Đóng hồ sơ'}>✕</Button></div>
        {state.loading ? <div className="mt-6"><SkeletonBlock rows={7} /></div> : state.error ? <div className="mt-6"><Alert tone="danger">{state.error}</Alert></div> : <>
          <div className="mt-5 flex flex-wrap gap-2" role="tablist" aria-label="Player profile sections">{TABS.map((item) => <Button key={item} variant={tab === item ? 'primary' : 'secondary'} role="tab" aria-selected={tab === item} onClick={() => selectTab(item)}>{tabs[item]}</Button>)}</div>
          <div className="mt-5" role="tabpanel">
            {tab === 'profile' && <ProfileTab user={user} en={en} />}
            {tab === 'games' && <GamesTab games={state.data.recentGames || []} en={en} />}
            {tab === 'economy' && <EconomyTab transactions={state.data.transactions || []} en={en} />}
            {tab === 'timeline' && <TimelineTab items={state.data.timeline || []} en={en} />}
          </div>
          <section className="mt-6 border border-[var(--admin-border)] bg-[var(--admin-surface-muted)] p-4"><h3 className="font-sans font-semibold">{en ? 'Actions in context' : 'Thao tác trong hồ sơ'}</h3><p className="mt-1 text-sm font-semibold text-slate-600">{en ? 'Confirmation dialogs show current values before applying changes.' : 'Hộp xác nhận hiển thị giá trị hiện tại trước khi áp dụng thay đổi.'}</p><div className="mt-3 flex flex-wrap gap-2">{has('economy.adjust') && <Button variant="secondary" onClick={() => onAction('currency', user)}>{en ? 'Adjust wallet' : 'Điều chỉnh ví'}</Button>}{has('players.elo.write') && <Button variant="secondary" onClick={() => onAction('elo', user)}>ELO</Button>}{has('players.status.write') && <Button variant="danger" onClick={() => onAction('status', user)}>{user.isBanned ? 'Unban' : 'Ban'}</Button>}{has('players.role.write') && <Button variant="danger" onClick={() => onAction('role', user)}>{en ? 'Change role' : 'Đổi role'}</Button>}</div></section>
        </>}
      </aside>
    </div>
  );
}

function ProfileTab({ user, en }) {
  const inventory = [['Skins', user.ownedSkins], ['Emotes', user.ownedEmotes], ['Frames', user.ownedAvatarFrames]];
  return <div className="grid gap-4"><div className="grid grid-cols-2 gap-3 sm:grid-cols-4"><Metric label="Status" value={user.isBanned ? 'Banned' : user.isOnline ? 'Online' : 'Offline'} /><Metric label="Role" value={user.role} /><Metric label="Rank / ELO" value={`${user.rank || 'Bronze II'} · ${formatNumber(user.eloPoints)}`} /><Metric label={en ? 'Matches' : 'Số trận'} value={formatNumber(user.stats?.totalGames)} /></div><dl className="grid gap-3 border border-[var(--admin-border)] bg-[var(--admin-surface)] p-4 sm:grid-cols-2"><Info label="Gold / Pink" value={`${formatNumber(user.coins)} / ${formatNumber(user.gems)}`} /><Info label={en ? 'Last login' : 'Đăng nhập gần nhất'} value={formatDateTime(user.lastLoginDate)} /><Info label={en ? 'Created' : 'Ngày tạo'} value={formatDateTime(user.createdAt)} /><Info label={en ? 'Win / loss' : 'Thắng / thua'} value={`${formatNumber(user.stats?.wins)} / ${formatNumber(user.stats?.losses)}`} /></dl><div className="grid grid-cols-3 gap-3">{inventory.map(([label, values]) => <Metric key={label} label={label} value={formatNumber(values?.length)} />)}</div></div>;
}

function GamesTab({ games, en }) { return games.length ? <div className="grid gap-3">{games.map((game) => <article key={game.id} className="rounded-lg border border-[var(--admin-border)] bg-[var(--admin-surface)] p-3"><div className="flex justify-between gap-3"><strong>Room {game.roomId}</strong><StatusBadge tone={game.result === 'win' ? 'success' : 'danger'}>{game.result || game.status}</StatusBadge></div><p className="mt-2 text-sm font-semibold text-slate-600">{formatDateTime(game.playedAt)} · {game.playerCount} {en ? 'players' : 'người'} · ELO {game.eloChange > 0 ? '+' : ''}{game.eloChange ?? 0}</p></article>)}</div> : <EmptyState title={en ? 'No recent matches' : 'Chưa có trận gần đây'} description={en ? 'The latest 20 matches will appear here.' : '20 trận gần nhất sẽ xuất hiện tại đây.'} />; }

function EconomyTab({ transactions, en }) { return transactions.length ? <div className="grid gap-3">{transactions.map((item) => <article key={item._id} className="flex items-start justify-between gap-3 border border-[var(--admin-border)] bg-[var(--admin-surface)] p-3"><div><strong>{item.description}</strong><p className="mt-1 text-xs font-bold text-slate-500">{formatDateTime(item.createdAt)} · {item.type}</p></div><span className="font-mono font-semibold">{formatNumber(item.amount)} {item.currency}</span></article>)}</div> : <EmptyState title={en ? 'No transactions' : 'Chưa có giao dịch'} description={en ? 'The latest 20 transactions will appear here.' : '20 giao dịch gần nhất sẽ xuất hiện tại đây.'} />; }

function TimelineTab({ items, en }) { return items.length ? <ol className="border-l-[3px] border-[var(--admin-border)] pl-5">{items.map((item) => <li key={item.id} className="relative mb-4 border border-[var(--admin-border)] bg-[var(--admin-surface)] p-3 before:absolute before:-left-[31px] before:top-4 before:h-4 before:w-4 before:border before:border-[var(--admin-border)] before:bg-[var(--admin-warning-bg)]"><div className="flex flex-wrap items-center justify-between gap-2"><StatusBadge>{item.kind}</StatusBadge><time className="text-xs font-bold text-slate-500">{formatDateTime(item.at)}</time></div><strong className="mt-2 block">{item.title}</strong>{item.detail && <p className="mt-1 text-sm font-semibold text-slate-600">{item.detail}</p>}</li>)}</ol> : <EmptyState title={en ? 'No timeline activity' : 'Timeline trống'} description={en ? 'Login, match, economy, and admin events will be merged here.' : 'Đăng nhập, trận đấu, kinh tế và thao tác Admin sẽ được hợp nhất tại đây.'} />; }

function Metric({ label, value }) { return <div className="rounded-lg border border-[var(--admin-border)] bg-[var(--admin-surface-muted)] p-3"><p className="text-xs font-semibold uppercase text-slate-500">{label}</p><p className="mt-1 break-words font-semibold text-slate-950">{value ?? '—'}</p></div>; }
function Info({ label, value }) { return <div><dt className="text-xs font-semibold uppercase text-slate-500">{label}</dt><dd className="mt-1 font-bold text-slate-900">{value || '—'}</dd></div>; }
