import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Button, ConfirmDialog, EmptyState, Field, inputClass, SectionHeader, SkeletonBlock, StatusBadge, Toolbar } from './ui.jsx';
import { buildCriticalAdminPayload, createAdminOperationRequestId } from './adminMutation.js';
import { formatDateTime } from './utils.js';
import { useAdminApi } from './useAdminApi.js';
import SavedViewsBar from './SavedViewsBar.jsx';

function duration(ms) {
  if (!Number.isFinite(ms)) return '—';
  const minutes = Math.floor(ms / 60000);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h ${minutes % 60}m`;
}

export default function RoomsPanel({ permissions = [], adminUsername = '', language = 'vi' }) {
  const en = language === 'en';
  const { request } = useAdminApi();
  const [rooms, setRooms] = useState([]);
  const [summary, setSummary] = useState({ total: 0, waiting: 0, playing: 0, stale: 0 });
  const [selectedCode, setSelectedCode] = useState(() => typeof window === 'undefined' ? null : new URLSearchParams(window.location.search).get('roomId'));
  const [detail, setDetail] = useState(null);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ tone: '', text: '' });
  const [critical, setCritical] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const has = (permission) => permissions.includes(permission);

  const loadRooms = useCallback(async ({ quiet = false } = {}) => {
    if (!quiet) setLoading(true);
    const response = await request('/api/admin/rooms');
    if (response.ok) {
      setRooms(response.data?.data?.items || []);
      setSummary(response.data?.data?.summary || {});
    } else setMessage({ tone: 'danger', text: response.data?.error?.message || (en ? 'Could not load active rooms.' : 'Không thể tải danh sách phòng.') });
    if (!quiet) setLoading(false);
  }, [en, request]);

  const loadDetail = useCallback(async (roomCode) => {
    if (!roomCode) return setDetail(null);
    const response = await request(`/api/admin/rooms/${encodeURIComponent(roomCode)}`);
    if (response.ok) setDetail(response.data?.data || null);
    else {
      setDetail(null);
      setSelectedCode(null);
      setMessage({ tone: 'warning', text: response.data?.error?.message || (en ? 'The room is no longer active.' : 'Phòng không còn hoạt động.') });
    }
  }, [en, request]);

  useEffect(() => {
    loadRooms();
    const timer = window.setInterval(() => loadRooms({ quiet: true }), 10000);
    return () => window.clearInterval(timer);
  }, [loadRooms]);
  useEffect(() => { loadDetail(selectedCode); }, [loadDetail, selectedCode]);

  const visibleRooms = useMemo(() => rooms.filter((room) => filter === 'all' || (filter === 'stale' ? room.stale : room.status === filter)), [filter, rooms]);

  const openCritical = (type, userId = null) => setCritical({ type, userId, reason: '', confirmationUsername: '', requestId: createAdminOperationRequestId() });
  const submitCritical = async () => {
    const path = critical.type === 'force-close'
      ? `/api/admin/rooms/${encodeURIComponent(detail.code)}/force-close`
      : `/api/admin/rooms/${encodeURIComponent(detail.code)}/players/${encodeURIComponent(critical.userId)}/disconnect`;
    setSubmitting(true);
    const response = await request(path, { method: 'POST', body: JSON.stringify(buildCriticalAdminPayload(critical)) });
    setSubmitting(false);
    if (response.ok) {
      setCritical(null);
      setMessage({ tone: 'success', text: critical.type === 'force-close' ? (en ? 'Room force-closed and audited.' : 'Đã force-close phòng và ghi audit.') : (en ? 'Player disconnected and audited.' : 'Đã ngắt kết nối người chơi và ghi audit.') });
      if (critical.type === 'force-close') { setSelectedCode(null); setDetail(null); }
      await loadRooms();
      if (critical.type !== 'force-close') await loadDetail(detail.code);
    } else setMessage({ tone: 'danger', text: response.data?.error?.message || (en ? 'Intervention failed.' : 'Can thiệp thất bại.') });
  };

  return <div className="flex flex-col gap-5">
    <SectionHeader title={en ? 'Live room monitor' : 'Giám sát phòng trực tiếp'} description={en ? 'Read-only operational state. Card hands, deck contents, passwords, and private choices are never exposed.' : 'Trạng thái vận hành chỉ đọc. Hand, nội dung deck, mật khẩu và lựa chọn riêng tư không bao giờ được hiển thị.'} actions={<Button onClick={() => loadRooms()}>{en ? 'Refresh' : 'Làm mới'}</Button>} />
    {message.text && <Alert tone={message.tone}>{message.text}</Alert>}
    <SavedViewsBar scope="rooms" language={language} filters={{ status: filter === 'all' ? '' : filter }} onApply={(saved) => setFilter(saved.status || 'all')} />
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">{[['Total', summary.total], ['Waiting', summary.waiting], ['Playing', summary.playing], ['Stale', summary.stale]].map(([label, value]) => <div key={label} className="rounded-lg border border-[var(--admin-border)] bg-[var(--admin-surface)] p-3 "><p className="text-xs font-semibold uppercase text-[var(--admin-text-muted)]">{label}</p><p className="mt-1 font-mono text-2xl font-semibold">{value || 0}</p></div>)}</div>
    <Toolbar><Field label={en ? 'State filter' : 'Lọc trạng thái'}><select className={inputClass} value={filter} onChange={(event) => setFilter(event.target.value)}><option value="all">All</option><option value="waiting">Waiting</option><option value="playing">Playing</option><option value="stale">Stale</option></select></Field><p className="self-center text-xs font-bold text-[var(--admin-text-muted)]">{en ? 'Auto-refresh every 10 seconds' : 'Tự làm mới mỗi 10 giây'}</p></Toolbar>
    <div className="grid gap-5 xl:grid-cols-[minmax(360px,0.9fr)_minmax(0,1.35fr)]">
      <section>{loading ? <SkeletonBlock rows={6} /> : visibleRooms.length === 0 ? <EmptyState title={en ? 'No matching active rooms' : 'Không có phòng phù hợp'} /> : <div className="grid gap-3">{visibleRooms.map((room) => <button key={room.code} type="button" onClick={() => setSelectedCode(room.code)} className={`border p-3 text-left  ${selectedCode === room.code ? 'bg-[var(--admin-warning-bg)]' : 'bg-[var(--admin-surface)]'}`}><div className="flex items-center justify-between gap-2"><strong className="font-mono text-lg">{room.code}</strong><div className="flex gap-2"><StatusBadge tone={room.status === 'playing' ? 'success' : 'info'}>{room.status}</StatusBadge>{room.stale && <StatusBadge tone="danger">stale</StatusBadge>}</div></div><p className="mt-2 text-sm font-bold">{room.host?.username || '—'} · {room.playerCount}/{room.maxPlayers} · {room.edition}</p><p className="mt-1 text-xs font-semibold text-[var(--admin-text-muted)]">{room.gameMode} · age {duration(room.ageMs)} · idle {duration(room.idleMs)}</p></button>)}</div>}</section>
      <section>{!selectedCode ? <EmptyState title={en ? 'Select a room' : 'Chọn một phòng'} description={en ? 'Safe operational detail will appear here.' : 'Chi tiết vận hành an toàn sẽ hiển thị tại đây.'} /> : !detail ? <SkeletonBlock rows={7} /> : <article className="rounded-lg border border-[var(--admin-border)] bg-[var(--admin-surface)] p-4 shadow-[0_8px_24px_rgba(32,35,31,0.06)]"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-widest text-[var(--admin-danger-text)]">Room {detail.code}</p><h3 className="mt-1 font-sans text-xl font-semibold">{detail.phase.replaceAll('_', ' ')}</h3><p className="mt-1 text-sm font-semibold text-[var(--admin-text-muted)]">Updated {formatDateTime(detail.updatedAt)} · idle {duration(detail.idleMs)}</p></div><div className="flex gap-2"><StatusBadge tone={detail.status === 'playing' ? 'success' : 'info'}>{detail.status}</StatusBadge>{detail.pendingInteraction && <StatusBadge tone="warning">pending</StatusBadge>}</div></div><div className="mt-4 grid gap-3 sm:grid-cols-3"><Info label="Mode" value={detail.gameMode} /><Info label="Edition" value={detail.edition} /><Info label="Current turn" value={detail.currentTurn?.username || '—'} /></div><h4 className="mt-5 font-sans font-semibold">Players</h4><div className="mt-2 grid gap-2">{detail.players.map((player) => <div key={player.userId} className="flex flex-wrap items-center justify-between gap-3 border border-[var(--admin-border)] bg-[var(--admin-surface-muted)] p-3"><div><strong>{player.username}</strong><p className="font-mono text-xs text-[var(--admin-text-muted)]">{player.userId}</p></div><div className="flex items-center gap-2"><StatusBadge tone={player.alive ? 'success' : 'danger'}>{player.alive ? 'alive' : 'out'}</StatusBadge><span className="text-xs font-semibold">{player.handCount} cards</span>{has('rooms.disconnect') && <Button variant="danger" onClick={() => openCritical('disconnect', player.userId)}>{en ? 'Disconnect' : 'Ngắt kết nối'}</Button>}</div></div>)}</div>{has('rooms.force_close') && <div className="mt-5 border-t border-[var(--admin-border)] pt-4"><Button variant="danger" onClick={() => openCritical('force-close')}>{en ? 'Force-close room' : 'Force-close phòng'}</Button></div>}</article>}</section>
    </div>
    <ConfirmDialog open={!!critical} title={critical?.type === 'force-close' ? (en ? 'Force-close this room?' : 'Force-close phòng này?') : (en ? 'Disconnect this player?' : 'Ngắt kết nối người chơi?')} description={en ? 'Critical action: enter a reason and your exact admin username. The action is idempotent and audited.' : 'Thao tác critical: nhập lý do và chính xác username Admin. Thao tác có idempotency và được ghi audit.'} confirmLabel={submitting ? (en ? 'Processing…' : 'Đang xử lý…') : (en ? 'Confirm intervention' : 'Xác nhận can thiệp')} onConfirm={submitCritical} onClose={() => !submitting && setCritical(null)} confirmDisabled={submitting || !critical?.reason.trim() || critical?.confirmationUsername.trim() !== adminUsername}><Field label={en ? 'Reason' : 'Lý do'}><textarea className={inputClass} rows="3" value={critical?.reason || ''} onChange={(event) => setCritical({ ...critical, reason: event.target.value })} /></Field><div className="mt-3"><Field label={`${en ? 'Admin username' : 'Username Admin'}: ${adminUsername}`}><input className={inputClass} value={critical?.confirmationUsername || ''} onChange={(event) => setCritical({ ...critical, confirmationUsername: event.target.value })} autoComplete="off" /></Field></div></ConfirmDialog>
  </div>;
}

function Info({ label, value }) { return <div className="rounded-lg border border-[var(--admin-border)] bg-[var(--admin-surface-muted)] p-3"><p className="text-xs font-semibold uppercase text-[var(--admin-text-muted)]">{label}</p><p className="mt-1 break-words font-bold">{value}</p></div>; }
