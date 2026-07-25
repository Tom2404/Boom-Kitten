import React, { useCallback, useEffect, useState } from 'react';
import { useAdminApi } from './useAdminApi.js';
import { buildRoutineAdminPayload, createAdminOperationRequestId } from './adminMutation.js';
import { AdminCard, Alert, Button, EmptyState, Field, Pagination, SectionHeader, SkeletonBlock, StatusBadge, inputClass } from './ui.jsx';

function tone(severity) { return severity === 'critical' || severity === 'high' ? 'danger' : severity === 'medium' ? 'warning' : 'info'; }
function apiError(response) { return response.data?.error?.message || response.data?.message || response.error || 'Thao tác incident thất bại.'; }

export default function IncidentsPanel({ permissions, adminId, onNavigate }) {
  const { request } = useAdminApi();
  const canWrite = permissions.includes('incidents.write');
  const [filters, setFilters] = useState({ status: 'open', severity: '', type: '', assignee: '' });
  const [items, setItems] = useState([]); const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [detail, setDetail] = useState(null); const [loading, setLoading] = useState(true); const [detailLoading, setDetailLoading] = useState(false);
  const [reason, setReason] = useState(''); const [note, setNote] = useState(''); const [busy, setBusy] = useState(''); const [message, setMessage] = useState(null);

  const load = useCallback(async (page = 1) => {
    setLoading(true); const params = new URLSearchParams({ page: String(page), limit: '20' }); Object.entries(filters).forEach(([key, value]) => value && params.set(key, value));
    const response = await request(`/api/admin/incidents?${params}`); setLoading(false);
    if (!response.ok) return setMessage({ tone: 'danger', text: apiError(response) });
    setItems(response.data.data.items || []); setPagination(response.data.data.pagination || { page, pages: 1, total: 0 });
  }, [filters, request]);

  const loadDetail = useCallback(async (id) => { setDetailLoading(true); const response = await request(`/api/admin/incidents/${id}`); setDetailLoading(false); if (!response.ok) return setMessage({ tone: 'danger', text: apiError(response) }); setDetail(response.data.data); }, [request]);
  useEffect(() => { load(1); }, [load]);

  const update = async (patch, success) => {
    if (!reason.trim()) return setMessage({ tone: 'danger', text: 'Lý do audit là bắt buộc.' });
    setBusy('update'); const body = buildRoutineAdminPayload({ ...patch, expectedVersion: detail.__v, reason: reason.trim() }, createAdminOperationRequestId());
    const response = await request(`/api/admin/incidents/${detail._id}`, { method: 'PATCH', body: JSON.stringify(body) }); setBusy('');
    if (!response.ok) return setMessage({ tone: 'danger', text: apiError(response) });
    setMessage({ tone: 'success', text: success }); setDetail(response.data.data); await load(pagination.page);
  };

  const addNote = async (event) => {
    event.preventDefault(); if (!note.trim()) return;
    setBusy('note'); const body = buildRoutineAdminPayload({ body: note.trim(), expectedVersion: detail.__v }, createAdminOperationRequestId());
    const response = await request(`/api/admin/incidents/${detail._id}/notes`, { method: 'POST', body: JSON.stringify(body) }); setBusy('');
    if (!response.ok) return setMessage({ tone: 'danger', text: apiError(response) });
    setDetail(response.data.data); setNote(''); setMessage({ tone: 'success', text: 'Đã thêm internal note.' });
  };

  const openRelated = (related) => {
    const url = new URL(window.location.href); url.searchParams.set('adminTab', related.adminTab); url.searchParams.set(`${related.kind}Id`, related.id); window.history.replaceState({}, '', url); onNavigate(related.adminTab);
  };

  return <div className="flex flex-col gap-5">
    <SectionHeader title="Incident Center" description="Incident chỉ được tạo từ signal ứng dụng đo được: stale room, Admin 5xx, failed job và announcement quá hạn." actions={<Button onClick={() => load(pagination.page)}>Làm mới</Button>} />
    {message && <Alert tone={message.tone}>{message.text}</Alert>}
    {!canWrite && <Alert tone="info">Chế độ chỉ đọc đã ẩn internal note và danh tính actor khỏi timeline.</Alert>}
    <AdminCard className="p-4"><div className="grid gap-3 md:grid-cols-4"><Field label="Status"><select className={inputClass} value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })}><option value="">Tất cả</option><option value="open">Open</option><option value="acknowledged">Acknowledged</option><option value="resolved">Resolved</option></select></Field><Field label="Severity"><select className={inputClass} value={filters.severity} onChange={(e) => setFilters({ ...filters, severity: e.target.value })}><option value="">Tất cả</option>{['low', 'medium', 'high', 'critical'].map((value) => <option key={value}>{value}</option>)}</select></Field><Field label="Signal"><select className={inputClass} value={filters.type} onChange={(e) => setFilters({ ...filters, type: e.target.value })}><option value="">Tất cả</option><option value="room_stale">Stale room</option><option value="admin_error_rate">Admin 5xx rate</option><option value="job_failed">Failed job</option><option value="announcement_overdue">Overdue announcement</option></select></Field><Field label="Assignee"><select className={inputClass} value={filters.assignee} onChange={(e) => setFilters({ ...filters, assignee: e.target.value })}><option value="">Tất cả</option><option value="me">Của tôi</option><option value="unassigned">Chưa assign</option></select></Field></div></AdminCard>
    <div className="grid gap-5 xl:grid-cols-[minmax(330px,0.8fr)_minmax(0,1.4fr)]"><AdminCard className="p-4"><p className="text-xs font-semibold uppercase text-[var(--admin-text-muted)]">{pagination.total} incidents</p><div className="mt-3 grid gap-3">{loading ? <SkeletonBlock rows={5} /> : items.length === 0 ? <EmptyState title="Không có incident phù hợp" description="Đây không phải tuyên bố health hạ tầng; chỉ là không có signal ứng dụng khớp bộ lọc." /> : items.map((item) => <button type="button" key={item._id} onClick={() => loadDetail(item._id)} className={`border p-3 text-left focus:outline-none focus:ring-2 focus:ring-[var(--admin-focus)] ${detail?._id === item._id ? 'border-[var(--admin-border)] bg-[var(--admin-accent-soft)] shadow-[0_1px_2px_rgba(32,35,31,0.03)]' : 'border-[var(--admin-border)] bg-[var(--admin-surface)] hover:bg-[var(--admin-surface-muted)]'}`}><div className="flex items-start justify-between gap-2"><strong className="text-sm">{item.title}</strong><StatusBadge tone={tone(item.severity)}>{item.severity}</StatusBadge></div><p className="mt-2 line-clamp-2 text-xs font-semibold text-[var(--admin-text-muted)]">{item.summary}</p><div className="mt-2 flex justify-between text-xs font-semibold"><span>{item.status}</span><span>{item.signalCount} signals</span></div></button>)}</div><div className="mt-4"><Pagination page={pagination.page} totalPages={pagination.pages} onPageChange={load} /></div></AdminCard>
      <div>{detailLoading ? <AdminCard className="p-4"><SkeletonBlock rows={7} /></AdminCard> : detail ? <IncidentDetail incident={detail} canWrite={canWrite} adminId={adminId} reason={reason} setReason={setReason} note={note} setNote={setNote} update={update} addNote={addNote} openRelated={openRelated} busy={busy} /> : <AdminCard className="p-4"><EmptyState title="Chọn một incident" description="Timeline, signal và liên kết đối tượng sẽ hiển thị ở đây." /></AdminCard>}</div></div>
  </div>;
}

function IncidentDetail({ incident, canWrite, adminId, reason, setReason, note, setNote, update, addNote, openRelated, busy }) {
  return <div className="grid gap-5"><AdminCard className="p-4"><div className="flex flex-wrap items-start justify-between gap-3"><div><h3 className="font-sans text-xl font-semibold">{incident.title}</h3><p className="mt-2 font-semibold leading-6 text-[var(--admin-text-muted)]">{incident.summary}</p></div><div className="flex gap-2"><StatusBadge tone={tone(incident.severity)}>{incident.severity}</StatusBadge><StatusBadge tone={incident.status === 'resolved' ? 'success' : 'warning'}>{incident.status}</StatusBadge></div></div><dl className="mt-4 grid gap-2 text-sm sm:grid-cols-2"><div><dt className="font-semibold">First seen</dt><dd>{new Date(incident.firstSeenAt).toLocaleString('vi-VN')}</dd></div><div><dt className="font-semibold">Last seen</dt><dd>{new Date(incident.lastSeenAt).toLocaleString('vi-VN')}</dd></div><div><dt className="font-semibold">Assignee</dt><dd>{incident.assigneeId?.username || 'Unassigned'}</dd></div><div><dt className="font-semibold">Fingerprint</dt><dd className="break-all font-mono text-xs">{incident.fingerprint}</dd></div></dl>{incident.related?.length > 0 && <div className="mt-4 flex flex-wrap gap-2">{incident.related.map((item) => <Button key={`${item.kind}-${item.id}`} onClick={() => openRelated(item)}>Mở {item.label}</Button>)}</div>}{canWrite && incident.status !== 'resolved' && <div className="mt-4 grid gap-3 border-t border-[var(--admin-border)] pt-4"><Field label="Lý do audit"><input className={inputClass} value={reason} onChange={(e) => setReason(e.target.value)} /></Field><div className="flex flex-wrap gap-2">{String(incident.assigneeId?._id || incident.assigneeId || '') !== String(adminId) && <Button onClick={() => update({ assigneeId: adminId }, 'Incident đã assign cho bạn.')} disabled={!!busy}>Assign to me</Button>}{incident.status === 'open' && <Button variant="primary" onClick={() => update({ status: 'acknowledged' }, 'Incident đã acknowledge.')} disabled={!!busy}>Acknowledge</Button>}<Button variant="success" onClick={() => update({ status: 'resolved' }, 'Incident đã resolve và dedupe key được giải phóng.')} disabled={!!busy}>Resolve</Button></div></div>}</AdminCard>
    <AdminCard className="p-4"><h3 className="font-sans font-semibold">Timeline</h3><ol className="mt-4 grid gap-3">{[...(incident.timeline || [])].reverse().map((entry, index) => <li key={`${entry.at}-${index}`} className="border-l border-[var(--admin-info-text)] pl-3"><div className="flex flex-wrap justify-between gap-2"><strong className="uppercase">{entry.type}</strong><time className="font-mono text-xs">{new Date(entry.at).toLocaleString('vi-VN')}</time></div><p className="mt-1 text-sm font-semibold">{entry.message}</p>{entry.actorUsername && <p className="text-xs text-[var(--admin-text-muted)]">by {entry.actorUsername}</p>}</li>)}</ol></AdminCard>
    {canWrite && incident.status !== 'resolved' && <AdminCard className="p-4"><form onSubmit={addNote}><Field label="Internal note"><textarea className={inputClass} rows="4" maxLength="2000" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Điều tra, giả thuyết, bước xử lý..." /></Field><Button type="submit" variant="primary" className="mt-3" disabled={!!busy || !note.trim()}>Thêm note</Button></form>{incident.internalNotes?.length > 0 && <div className="mt-4 grid gap-2">{[...incident.internalNotes].reverse().map((entry, index) => <article key={`${entry.at}-${index}`} className="rounded-lg border border-[var(--admin-border)] bg-[var(--admin-surface-muted)] p-3"><p className="text-sm font-semibold">{entry.body}</p><p className="mt-2 text-xs font-bold text-[var(--admin-text-muted)]">{entry.actorUsername} · {new Date(entry.at).toLocaleString('vi-VN')}</p></article>)}</div>}</AdminCard>}
  </div>;
}
