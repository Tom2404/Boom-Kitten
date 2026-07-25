import React, { useEffect, useState } from 'react';
import { Alert, Button, ConfirmDialog, EmptyState, Field, inputClass, Pagination, SectionHeader, SkeletonBlock, StatusBadge, Toolbar } from './ui.jsx';
import { createAdminOperationRequestId } from './adminMutation.js';
import { formatDateTime } from './utils.js';
import { useAdminApi } from './useAdminApi.js';
import SavedViewsBar from './SavedViewsBar.jsx';

export default function ModerationPanel({ permissions = [], adminId = '', language = 'vi' }) {
  const en = language === 'en';
  const { request } = useAdminApi();
  const [filters, setFilters] = useState({ status: '', category: '', priority: '' });
  const [cases, setCases] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedId, setSelectedId] = useState(() => typeof window === 'undefined' ? null : new URLSearchParams(window.location.search).get('caseId'));
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [message, setMessage] = useState({ tone: '', text: '' });
  const [note, setNote] = useState('');
  const [sanction, setSanction] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const has = (permission) => permissions.includes(permission);

  const loadCases = async () => {
    setLoading(true);
    const query = new URLSearchParams({ page, limit: 20, ...filters });
    const response = await request(`/api/admin/moderation/cases?${query}`);
    if (response.ok) { setCases(response.data?.data?.items || []); setTotalPages(response.data?.data?.pagination?.totalPages || 1); }
    else setMessage({ tone: 'danger', text: response.data?.error?.message || response.data?.message || 'Không thể tải moderation inbox.' });
    setLoading(false);
  };

  const loadDetail = async (caseId = selectedId) => {
    if (!caseId) return setDetail(null);
    setDetailLoading(true);
    const response = await request(`/api/admin/moderation/cases/${caseId}`);
    if (response.ok) setDetail(response.data?.data || null);
    else setMessage({ tone: 'danger', text: response.data?.error?.message || 'Không thể tải case.' });
    setDetailLoading(false);
  };

  useEffect(() => { loadCases(); }, [page, filters.status, filters.category, filters.priority, request]);
  useEffect(() => { loadDetail(); }, [selectedId, request]);

  const selectCase = (caseId) => {
    setSelectedId(caseId);
    const url = new URL(window.location.href);
    url.searchParams.set('caseId', caseId);
    window.history.replaceState({}, '', url);
  };

  const mutateCase = async (payload, successText) => {
    setSubmitting(true);
    const response = await request(`/api/admin/moderation/cases/${detail._id}`, { method: 'PATCH', body: JSON.stringify({ ...payload, requestId: createAdminOperationRequestId() }) });
    setSubmitting(false);
    if (response.ok) { setMessage({ tone: 'success', text: successText }); await Promise.all([loadCases(), loadDetail()]); }
    else setMessage({ tone: 'danger', text: response.data?.error?.message || response.data?.message || 'Cập nhật case thất bại.' });
  };

  const addNote = async (event) => {
    event.preventDefault();
    if (!note.trim()) return;
    setSubmitting(true);
    const response = await request(`/api/admin/moderation/cases/${detail._id}/notes`, { method: 'POST', body: JSON.stringify({ content: note.trim(), requestId: createAdminOperationRequestId() }) });
    setSubmitting(false);
    if (response.ok) { setNote(''); setMessage({ tone: 'success', text: 'Đã thêm ghi chú nội bộ.' }); loadDetail(); }
    else setMessage({ tone: 'danger', text: response.data?.error?.message || 'Không thể thêm ghi chú.' });
  };

  const submitSanction = async () => {
    if (!sanction?.reason.trim()) return;
    setSubmitting(true);
    const response = await request(`/api/admin/moderation/cases/${detail._id}/sanctions`, { method: 'POST', body: JSON.stringify({ type: sanction.type, expiresAt: sanction.type === 'suspension' ? new Date(sanction.expiresAt).toISOString() : undefined, reason: sanction.reason.trim(), requestId: sanction.requestId }) });
    setSubmitting(false);
    if (response.ok) { setSanction(null); setMessage({ tone: 'success', text: 'Đã áp dụng sanction và ghi audit.' }); await Promise.all([loadCases(), loadDetail()]); }
    else setMessage({ tone: 'danger', text: response.data?.error?.message || response.data?.message || 'Áp dụng sanction thất bại.' });
  };

  const openSanction = (type) => setSanction({ type, reason: '', expiresAt: '', requestId: createAdminOperationRequestId() });

  return <div className="flex flex-col gap-5">
    <SectionHeader title={en ? 'Moderation inbox' : 'Hộp thư moderation'} description={en ? 'Investigate reports, assign cases, record decisions, and apply linked sanctions.' : 'Điều tra report, nhận case, ghi quyết định và áp dụng sanction có liên kết.'} actions={<Button onClick={loadCases}>{en ? 'Refresh' : 'Làm mới'}</Button>} />
    {message.text && <Alert tone={message.tone}>{message.text}</Alert>}
    <SavedViewsBar scope="reports" language={language} filters={filters} onApply={(saved) => { setFilters({ status: saved.status || '', category: saved.category || '', priority: saved.priority || '' }); setPage(1); }} />
    <Toolbar><Field label="Status"><select className={inputClass} value={filters.status} onChange={(event) => { setFilters({ ...filters, status: event.target.value }); setPage(1); }}><option value="">All</option><option>OPEN</option><option>INVESTIGATING</option><option>RESOLVED</option><option>DISMISSED</option></select></Field><Field label="Category"><select className={inputClass} value={filters.category} onChange={(event) => { setFilters({ ...filters, category: event.target.value }); setPage(1); }}><option value="">All</option><option value="harassment">Harassment</option><option value="cheating">Cheating</option><option value="inappropriate_name">Name</option><option value="spam">Spam</option><option value="other">Other</option></select></Field><Field label="Priority"><select className={inputClass} value={filters.priority} onChange={(event) => { setFilters({ ...filters, priority: event.target.value }); setPage(1); }}><option value="">All</option><option>low</option><option>normal</option><option>high</option><option>critical</option></select></Field></Toolbar>
    <div className="grid gap-5 xl:grid-cols-[minmax(320px,0.8fr)_minmax(0,1.4fr)]">
      <section aria-label="Moderation cases">{loading ? <SkeletonBlock rows={6} /> : cases.length === 0 ? <EmptyState title={en ? 'No matching cases' : 'Không có case phù hợp'} description={en ? 'New player reports will appear here.' : 'Report mới của người chơi sẽ xuất hiện tại đây.'} /> : <div className="grid gap-3">{cases.map((item) => <button key={item._id} type="button" onClick={() => selectCase(item._id)} className={`border p-3 text-left  ${selectedId === item._id ? 'border-[var(--admin-border)] bg-[var(--admin-warning-bg)]' : 'border-[var(--admin-border)] bg-[var(--admin-surface)]'}`}><div className="flex flex-wrap items-center justify-between gap-2"><StatusBadge tone={item.status === 'OPEN' ? 'danger' : item.status === 'INVESTIGATING' ? 'warning' : 'success'}>{item.status}</StatusBadge><StatusBadge>{item.priority}</StatusBadge></div><strong className="mt-2 block">{item.targetPlayerId?.username || item.targetPlayerId}</strong><p className="mt-1 text-sm font-semibold text-slate-600">{item.category} · {item.reportIds?.length || 0} report</p><p className="mt-2 text-xs font-bold text-slate-500">{formatDateTime(item.createdAt)} · {item.assigneeId?.username || 'Unassigned'}</p></button>)}</div>}<div className="mt-4"><Pagination page={page} totalPages={totalPages} onPageChange={setPage} /></div></section>
      <section>{!selectedId ? <EmptyState title={en ? 'Select a case' : 'Chọn một case'} description={en ? 'Case evidence and workflow will appear here.' : 'Evidence và workflow của case sẽ xuất hiện tại đây.'} /> : detailLoading ? <SkeletonBlock rows={8} /> : detail && <CaseDetail detail={detail} has={has} adminId={adminId} submitting={submitting} note={note} setNote={setNote} addNote={addNote} mutateCase={mutateCase} openSanction={openSanction} en={en} />}</section>
    </div>
    <ConfirmDialog open={!!sanction} title={`${sanction?.type || ''} player?`} description="Sanction này sẽ được liên kết với case và ghi vào audit log." confirmLabel={submitting ? 'Đang xử lý...' : 'Áp dụng'} confirmDisabled={submitting || !sanction?.reason.trim() || (sanction?.type === 'suspension' && !sanction?.expiresAt)} onConfirm={submitSanction} onClose={() => !submitting && setSanction(null)}>{sanction?.type === 'suspension' && <Field label="Đình chỉ đến"><input className={inputClass} type="datetime-local" value={sanction.expiresAt} onChange={(event) => setSanction({ ...sanction, expiresAt: event.target.value })} /></Field>}<div className={sanction?.type === 'suspension' ? 'mt-3' : ''}><Field label="Lý do"><textarea className={inputClass} rows="3" value={sanction?.reason || ''} onChange={(event) => setSanction({ ...sanction, reason: event.target.value })} /></Field></div></ConfirmDialog>
  </div>;
}

function CaseDetail({ detail, has, adminId, submitting, note, setNote, addNote, mutateCase, openSanction, en }) {
  const target = detail.targetPlayerId;
  return <article className="rounded-lg border border-[var(--admin-border)] bg-[var(--admin-surface)] p-4 shadow-[0_8px_24px_rgba(32,35,31,0.06)]"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-widest text-[var(--admin-danger-text)]">Case {detail._id}</p><h3 className="mt-1 font-sans text-xl font-semibold">{target?.username || target}</h3><p className="text-sm font-semibold text-slate-500">{target?.email}</p></div><div className="flex gap-2"><StatusBadge>{detail.status}</StatusBadge><StatusBadge tone="warning">{detail.priority}</StatusBadge></div></div><div className="mt-4 grid gap-3 sm:grid-cols-3"><Info label="Category" value={detail.category} /><Info label="Assignee" value={detail.assigneeId?.username || 'Unassigned'} /><Info label="Warnings" value={target?.warningCount || 0} /></div>
    {has('moderation.assign') && <div className="mt-4 flex flex-wrap gap-2">{!detail.assigneeId && <Button variant="secondary" disabled={submitting} onClick={() => mutateCase({ assigneeId: adminId, reason: 'Nhận xử lý case' }, 'Đã nhận case.')}>{en ? 'Assign to me' : 'Nhận case'}</Button>}{detail.status === 'OPEN' && <Button variant="primary" disabled={submitting} onClick={() => mutateCase({ status: 'INVESTIGATING', reason: 'Bắt đầu điều tra' }, 'Case đang được điều tra.')}>{en ? 'Start investigation' : 'Bắt đầu điều tra'}</Button>}{detail.status === 'INVESTIGATING' && has('moderation.resolve') && <><Button variant="success" disabled={submitting} onClick={() => mutateCase({ status: 'RESOLVED', reason: 'Đã xử lý đầy đủ' }, 'Case đã resolved.')}>Resolve</Button><Button variant="secondary" disabled={submitting} onClick={() => mutateCase({ status: 'DISMISSED', reason: 'Không đủ bằng chứng' }, 'Case đã dismissed.')}>Dismiss</Button></>}</div>}
    <section className="mt-5"><h4 className="font-sans font-semibold">Reports</h4><div className="mt-2 grid gap-2">{detail.reportIds?.map((report) => <div key={report._id} className="rounded-lg border border-[var(--admin-border)] bg-[var(--admin-surface-muted)] p-3"><strong>{report.category}</strong><p className="mt-1 text-sm font-semibold text-slate-700">{report.description}</p><p className="mt-1 text-xs font-bold text-slate-500">Room {report.roomId || '—'} · Match {report.matchId || '—'}</p></div>)}</div></section>
    {has('moderation.assign') && <form onSubmit={addNote} className="mt-5"><Field label={en ? 'Internal note' : 'Ghi chú nội bộ'}><textarea className={inputClass} rows="3" value={note} onChange={(event) => setNote(event.target.value)} /></Field><Button type="submit" variant="secondary" className="mt-2" disabled={submitting || !note.trim()}>{en ? 'Add note' : 'Thêm ghi chú'}</Button></form>}
    {detail.notes?.length > 0 && <section className="mt-5"><h4 className="font-sans font-semibold">Internal notes</h4><div className="mt-2 grid gap-2">{detail.notes.map((item) => <div key={item._id} className="border-l border-[var(--admin-info-text)] bg-[var(--admin-info-bg)] p-3"><p className="font-semibold">{item.content}</p><p className="mt-1 text-xs font-bold text-slate-500">{item.actorUsername} · {formatDateTime(item.createdAt)}</p></div>)}</div></section>}
    <section className="mt-5 border-t border-[var(--admin-border)] pt-4"><h4 className="font-sans font-semibold">Sanctions</h4><div className="mt-2 flex flex-wrap gap-2">{has('moderation.sanction.warning') && <Button variant="secondary" onClick={() => openSanction('warning')}>Warning</Button>}{has('moderation.sanction.suspend') && <Button variant="danger" onClick={() => openSanction('suspension')}>Suspend</Button>}{has('moderation.sanction.ban') && <><Button variant="danger" onClick={() => openSanction('ban')}>Ban</Button>{(target?.isBanned || target?.suspendedUntil) && <Button variant="success" onClick={() => openSanction('unban')}>Unban</Button>}</>}</div></section>
  </article>;
}

function Info({ label, value }) { return <div className="rounded-lg border border-[var(--admin-border)] bg-[var(--admin-surface-muted)] p-3"><p className="text-xs font-semibold uppercase text-slate-500">{label}</p><p className="mt-1 break-words font-bold">{value ?? '—'}</p></div>; }
