import React, { useEffect, useRef, useState } from 'react';
import { Alert, Button, Field, inputClass, StatusBadge } from './ui.jsx';
import { createAdminOperationRequestId } from './adminMutation.js';
import { buildBulkExecutionPayload, buildBulkPreviewPayload } from './adminBulkJob.js';
import { formatNumber } from './utils.js';

const initialForm = { type: 'currency', currency: 'coin', operation: 'add', amount: 100, reason: '' };

export default function BulkAdjustmentDialog({ filters, language = 'vi', onClose, onQueued, request }) {
  const en = language === 'en';
  const panelRef = useRef(null);
  const busyRef = useRef(false);
  const [form, setForm] = useState(initialForm);
  const [preview, setPreview] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  busyRef.current = busy;

  useEffect(() => {
    const previousFocus = document.activeElement;
    const panel = panelRef.current;
    panel?.querySelector('button, input, select')?.focus();
    const onKeyDown = (event) => {
      if (event.key === 'Escape' && !busyRef.current) onClose();
      if (event.key !== 'Tab') return;
      const focusable = panel?.querySelectorAll('button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled)');
      if (!focusable?.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => { document.removeEventListener('keydown', onKeyDown); previousFocus?.focus?.(); };
  }, [onClose]);

  const updateForm = (patch) => { setForm((current) => ({ ...current, ...patch })); setPreview(null); setError(''); };

  const loadPreview = async () => {
    setBusy(true); setError('');
    try {
      const payload = buildBulkPreviewPayload({ filters, form, requestId: createAdminOperationRequestId() });
      const response = await request('/api/admin/jobs', { method: 'POST', body: JSON.stringify(payload) });
      if (!response.ok) throw new Error(response.data?.error?.message || (en ? 'Preview failed.' : 'Không thể tạo preview.'));
      setPreview(response.data?.data);
    } catch (previewError) { setError(previewError.message); }
    finally { setBusy(false); }
  };

  const queueExecution = async () => {
    setBusy(true); setError('');
    try {
      const payload = buildBulkExecutionPayload({ previewToken: preview?.previewToken, reason: form.reason, requestId: createAdminOperationRequestId() });
      const response = await request('/api/admin/jobs', { method: 'POST', body: JSON.stringify(payload) });
      if (!response.ok) throw new Error(response.data?.error?.message || (en ? 'Could not queue job.' : 'Không thể đưa job vào hàng đợi.'));
      onQueued(response.data?.data);
    } catch (executionError) { setError(executionError.message); setBusy(false); }
  };

  const summary = preview?.resultSummary || {};
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-3 backdrop-blur-[2px]" role="dialog" aria-modal="true" aria-labelledby="bulk-adjust-title" aria-describedby="bulk-adjust-description">
      <section ref={panelRef} className="max-h-[94vh] w-full max-w-3xl overflow-y-auto rounded-xl border border-[var(--admin-border)] bg-[var(--admin-surface)] p-4 shadow-[0_24px_60px_rgba(15,23,42,0.16)] sm:p-6">
        <div className="flex items-start justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-widest text-[var(--admin-danger-text)]">Select by query · Admin Job</p><h2 id="bulk-adjust-title" className="mt-1 font-sans text-xl font-semibold">{en ? 'Bulk player adjustment' : 'Điều chỉnh hàng loạt người chơi'}</h2><p id="bulk-adjust-description" className="mt-1 text-sm font-semibold text-[var(--admin-text-muted)]">{en ? 'The preview freezes every target matching the current filters before execution.' : 'Preview sẽ chụp cố định toàn bộ người chơi khớp bộ lọc hiện tại trước khi chạy.'}</p></div><Button type="button" variant="secondary" onClick={onClose} disabled={busy} aria-label={en ? 'Close bulk dialog' : 'Đóng bulk dialog'}>✕</Button></div>
        {error && <div className="mt-4"><Alert tone="danger">{error}</Alert></div>}
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <Field label={en ? 'Wallet' : 'Ví'}><input className={inputClass} value="Coin" readOnly /></Field>
          <Field label={en ? 'Operation' : 'Phép tính'}><select className={inputClass} value={form.operation} onChange={(event) => updateForm({ operation: event.target.value })}><option value="add">Add</option><option value="subtract">Subtract</option><option value="set">Set</option></select></Field>
          <Field label={en ? 'Amount' : 'Số lượng'}><input className={inputClass} type="number" min="0" value={form.amount} onChange={(event) => updateForm({ amount: event.target.value })} /></Field>
          <div className="sm:col-span-2"><Field label={en ? 'Audit reason' : 'Lý do ghi audit'}><input className={inputClass} value={form.reason} onChange={(event) => updateForm({ reason: event.target.value })} placeholder="Ticket BK-1234" /></Field></div>
        </div>
        <div className="mt-4 border border-[var(--admin-border)] bg-[var(--admin-surface-muted)] p-3"><strong className="text-xs uppercase">{en ? 'Current query' : 'Query hiện tại'}</strong><p className="mt-1 break-all font-mono text-xs">{Object.entries(filters).filter(([, value]) => value).map(([key, value]) => `${key}=${value}`).join(' · ') || (en ? 'All players' : 'Tất cả người chơi')}</p></div>
        {preview && <section className="mt-5" aria-live="polite"><div className="grid grid-cols-2 gap-3 sm:grid-cols-4"><Metric label="Targets" value={preview.targetCount} /><Metric label="Valid" value={summary.validTargets} /><Metric label="Invalid" value={summary.invalidTargets} /><Metric label="Total |Δ|" value={formatNumber(summary.totalAbsoluteDelta)} /></div><div className="mt-4 overflow-x-auto rounded-lg border border-[var(--admin-border)]"><table className="w-full min-w-[520px] text-left text-sm"><thead className="bg-[var(--admin-surface-muted)] text-[var(--admin-text-muted)]"><tr><th className="p-2">Player</th><th className="p-2">Before</th><th className="p-2">After</th><th className="p-2">Status</th></tr></thead><tbody>{(preview.targetSample || []).map((item) => <tr key={item.id} className="border-t border-[var(--admin-border)]"><td className="p-2 font-semibold">{item.username || item.id}</td><td className="p-2 font-mono">{item.before ?? '—'}</td><td className="p-2 font-mono">{item.after ?? '—'}</td><td className="p-2"><StatusBadge tone={item.valid ? 'success' : 'danger'}>{item.valid ? 'ready' : 'invalid'}</StatusBadge>{item.error && <small className="ml-2 text-[var(--admin-danger-text)]">{item.error}</small>}</td></tr>)}</tbody></table></div><div className="mt-4"><Alert tone="warning">{en ? 'Execution is not atomic. Completed rows remain applied if the job is cancelled or partially fails.' : 'Job không giả lập atomicity. Các dòng đã hoàn tất vẫn được giữ nếu job bị hủy hoặc lỗi một phần.'}</Alert></div></section>}
        <div className="mt-5 flex flex-wrap justify-end gap-2"><Button type="button" variant="secondary" onClick={onClose} disabled={busy}>{en ? 'Cancel' : 'Hủy'}</Button>{preview ? <Button type="button" variant="danger" onClick={queueExecution} disabled={busy || summary.validTargets === 0}>{busy ? (en ? 'Queueing…' : 'Đang xếp hàng…') : (en ? `Run for ${preview.targetCount} targets` : `Chạy cho ${preview.targetCount} targets`)}</Button> : <Button type="button" variant="primary" onClick={loadPreview} disabled={busy || !form.reason.trim()}>{busy ? (en ? 'Previewing…' : 'Đang preview…') : (en ? 'Preview full query' : 'Preview toàn bộ query')}</Button>}</div>
      </section>
    </div>
  );
}

function Metric({ label, value }) { return <div className="rounded-lg border border-[var(--admin-border)] bg-[var(--admin-surface)] p-3"><span className="text-[10px] font-semibold uppercase text-[var(--admin-text-muted)]">{label}</span><strong className="mt-1 block font-mono text-lg">{value ?? 0}</strong></div>; }
