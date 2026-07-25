import React, { useCallback, useEffect, useState } from 'react';
import { Alert, Button, EmptyState, Field, inputClass, Pagination, SectionHeader, SkeletonBlock, StatusBadge, Toolbar } from './ui.jsx';
import { createAdminOperationRequestId } from './adminMutation.js';
import { formatDateTime } from './utils.js';
import { useAdminApi } from './useAdminApi.js';

export default function JobsPanel({ permissions = [], language = 'vi' }) {
  const en = language === 'en';
  const { download, request } = useAdminApi();
  const [items, setItems] = useState([]);
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ tone: '', text: '' });
  const has = (permission) => permissions.includes(permission);
  const linkedJobId = typeof window === 'undefined' ? '' : new URLSearchParams(window.location.search).get('jobId') || '';

  const load = useCallback(async ({ quiet = false } = {}) => {
    if (!quiet) setLoading(true);
    const query = new URLSearchParams({ page, limit: 20, status });
    const response = await request(`/api/admin/jobs?${query}`);
    if (response.ok) { setItems(response.data?.data?.items || []); setTotalPages(response.data?.data?.pagination?.totalPages || 1); }
    else setMessage({ tone: 'danger', text: response.data?.error?.message || (en ? 'Could not load jobs.' : 'Không thể tải job.') });
    if (!quiet) setLoading(false);
  }, [en, page, request, status]);

  useEffect(() => { load(); const timer = window.setInterval(() => load({ quiet: true }), 3000); return () => window.clearInterval(timer); }, [load]);

  const cancel = async (job) => {
    const reason = window.prompt(en ? 'Reason for cancelling this job:' : 'Lý do hủy job:');
    if (!reason?.trim()) return;
    const response = await request(`/api/admin/jobs/${job._id}/cancel`, { method: 'POST', body: JSON.stringify({ reason: reason.trim(), requestId: createAdminOperationRequestId() }) });
    setMessage(response.ok ? { tone: 'success', text: en ? 'Cancellation requested. Completed rows are not rolled back.' : 'Đã yêu cầu hủy. Các dòng hoàn tất không được rollback.' } : { tone: 'danger', text: response.data?.error?.message || 'Cancel failed.' });
    load();
  };

  return <div className="flex flex-col gap-5"><SectionHeader title={en ? 'Admin Job Center' : 'Trung tâm Admin Job'} description={en ? 'Durable background work with explicit progress, result files, and partial-failure reporting.' : 'Công việc nền bền vững với tiến độ, file kết quả và báo cáo partial failure rõ ràng.'} actions={<Button onClick={() => load()}>{en ? 'Refresh' : 'Làm mới'}</Button>} />{message.text && <Alert tone={message.tone}>{message.text}</Alert>}<Toolbar><Field label="Status"><select className={inputClass} value={status} onChange={(event) => { setStatus(event.target.value); setPage(1); }}><option value="">All</option>{['preview', 'queued', 'running', 'completed', 'failed', 'cancelled'].map((value) => <option key={value}>{value}</option>)}</select></Field><p className="self-center text-xs font-bold text-[var(--admin-text-muted)]">{en ? 'Auto-refresh every 3 seconds' : 'Tự làm mới mỗi 3 giây'}</p></Toolbar>{loading ? <SkeletonBlock rows={6} /> : items.length === 0 ? <EmptyState title={en ? 'No jobs found' : 'Chưa có job'} /> : <div className="grid gap-3">{items.map((job) => { const progress = job.progress || {}; const percent = progress.total ? Math.round((progress.processed || 0) / progress.total * 100) : job.status === 'completed' ? 100 : 0; return <article key={job._id} className={`rounded-lg border border-[var(--admin-border)] p-4 shadow-[0_1px_2px_rgba(32,35,31,0.03)] ${linkedJobId === job._id ? 'bg-[var(--admin-accent-soft)] ring-2 ring-[var(--admin-focus)]' : 'bg-[var(--admin-surface)]'}`}><div className="flex flex-wrap items-start justify-between gap-3"><div><strong className="font-sans">{job.type.replaceAll('_', ' ')}</strong><p className="mt-1 text-xs font-bold text-[var(--admin-text-muted)]">{job.actorUsername} · {formatDateTime(job.createdAt)} · {job._id}</p></div><StatusBadge tone={job.status === 'completed' ? 'success' : job.status === 'failed' ? 'danger' : job.status === 'running' ? 'warning' : 'neutral'}>{job.status}</StatusBadge></div><div className="mt-3 h-4 border border-[var(--admin-border)] bg-[var(--admin-surface-muted)]"><div className="h-full bg-[var(--admin-accent)]" style={{ width: `${percent}%` }} /></div><div className="mt-2 flex flex-wrap items-center justify-between gap-3 text-xs font-bold"><span>{progress.processed || 0}/{progress.total || job.targetCount || 0} · {progress.succeeded || 0} ok · {progress.failed || 0} failed</span><div className="flex gap-2">{job.output?.available && <Button onClick={() => download(`/api/admin/jobs/${job._id}/output`, job.output.filename)}>{en ? 'Result file' : 'File kết quả'}</Button>}{job.errorOutput?.available && <Button variant="danger" onClick={() => download(`/api/admin/jobs/${job._id}/errors`, job.errorOutput.filename)}>{en ? 'Error file' : 'File lỗi'}</Button>}{has('jobs.cancel') && ['queued', 'running'].includes(job.status) && <Button variant="danger" onClick={() => cancel(job)}>{en ? 'Cancel' : 'Hủy'}</Button>}</div></div>{job.error?.message && <p className="mt-3 border-l border-[var(--admin-danger-text)] bg-[var(--admin-danger-bg)] p-2 text-sm font-bold text-[var(--admin-danger-text)]">{job.error.message}</p>}</article>; })}</div>}<Pagination page={page} totalPages={totalPages} onPageChange={setPage} /></div>;
}
