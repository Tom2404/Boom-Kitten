import React, { useCallback, useEffect, useState } from 'react';
import { useAdminApi } from './useAdminApi.js';
import { AdminCard, Alert, Button, EmptyState, Field, SectionHeader, SkeletonBlock, StatusBadge, Toolbar, inputClass } from './ui.jsx';

const tone = { OPEN: 'danger', INVESTIGATING: 'warning', RESOLVED: 'success', DISMISSED: 'neutral' };

export default function ModerationPanel({ permissions = [] }) {
  const { request } = useAdminApi();
  const canWrite = permissions.includes('moderation.write');
  const [filters, setFilters] = useState({ status: 'OPEN', priority: '' });
  const [state, setState] = useState({ loading: true, cases: [], error: '' });
  const [activeId, setActiveId] = useState('');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);

  const loadCases = useCallback(async () => {
    setState((current) => ({ ...current, loading: true, error: '' }));
    const params = new URLSearchParams(Object.entries(filters).filter(([, value]) => value));
    const response = await request(`/api/admin/moderation/cases?${params}`);
    if (!response.ok) {
      setState({ loading: false, cases: [], error: response.data?.error?.message || response.error || 'Không thể tải moderation inbox.' });
      return;
    }
    setState({ loading: false, cases: response.data?.data?.cases || [], error: '' });
  }, [filters, request]);

  useEffect(() => { void loadCases(); }, [loadCases]);

  const updateCase = async (caseId, payload) => {
    setBusy(true);
    const response = await request(`/api/admin/moderation/cases/${caseId}`, { method: 'PATCH', body: JSON.stringify(payload) });
    setBusy(false);
    if (!response.ok) {
      setState((current) => ({ ...current, error: response.data?.error?.message || 'Không thể cập nhật case.' }));
      return;
    }
    setNote('');
    await loadCases();
  };

  return (
    <div className="grid gap-5">
      <SectionHeader title="Moderation inbox" description="Tập trung báo cáo theo người chơi và loại vi phạm; ưu tiên case đang mở trước." actions={<Button onClick={loadCases}>Làm mới</Button>} />
      <Toolbar>
        <Field label="Trạng thái"><select className={inputClass} value={filters.status} onChange={(event) => setFilters({ ...filters, status: event.target.value })}><option value="">Tất cả</option>{['OPEN', 'INVESTIGATING', 'RESOLVED', 'DISMISSED'].map((value) => <option key={value}>{value}</option>)}</select></Field>
        <Field label="Ưu tiên"><select className={inputClass} value={filters.priority} onChange={(event) => setFilters({ ...filters, priority: event.target.value })}><option value="">Tất cả</option>{['critical', 'high', 'normal', 'low'].map((value) => <option key={value}>{value}</option>)}</select></Field>
      </Toolbar>
      {state.error && <Alert tone="danger">{state.error}</Alert>}
      {state.loading ? <SkeletonBlock rows={5} /> : state.cases.length === 0 ? <EmptyState title="Inbox đang trống" description="Không có case phù hợp với bộ lọc hiện tại." /> : (
        <div className="grid gap-3">
          {state.cases.map((item) => {
            const expanded = activeId === item._id;
            return (
              <AdminCard key={item._id} className="p-4">
                <button type="button" onClick={() => setActiveId(expanded ? '' : item._id)} className="flex w-full items-start justify-between gap-4 text-left" aria-expanded={expanded}>
                  <span><strong className="block text-base">{item.targetPlayerId?.username || 'Người chơi đã xoá'}</strong><span className="mt-1 block text-sm text-[var(--admin-text-muted)]">{item.category} · {item.reportIds?.length || 0} báo cáo · {item.assigneeId?.username || 'Chưa phân công'}</span></span>
                  <span className="flex gap-2"><StatusBadge tone={item.priority === 'critical' || item.priority === 'high' ? 'danger' : 'neutral'}>{item.priority}</StatusBadge><StatusBadge tone={tone[item.status]}>{item.status}</StatusBadge></span>
                </button>
                {expanded && (
                  <div className="mt-4 grid gap-4 border-t border-[var(--admin-border)] pt-4">
                    <div className="grid gap-2">{(item.reportIds || []).map((report) => <article key={report._id} className="rounded-lg border border-[var(--admin-border)] bg-[var(--admin-surface-muted)] p-3 text-sm"><strong>{report.reporterId?.username || 'Ẩn danh'}</strong><p className="mt-1 whitespace-pre-wrap">{report.description}</p><small className="text-[var(--admin-text-muted)]">Phòng {report.roomId || 'không rõ'} · {new Date(report.createdAt).toLocaleString()}</small></article>)}</div>
                    {canWrite && <><Field label="Ghi chú nội bộ"><textarea className={inputClass} rows="3" maxLength="1000" value={note} onChange={(event) => setNote(event.target.value)} /></Field><div className="flex flex-wrap gap-2"><Button disabled={busy} onClick={() => updateCase(item._id, { assignToMe: true })}>Nhận xử lý</Button><Button disabled={busy || !note.trim()} onClick={() => updateCase(item._id, { note })}>Thêm ghi chú</Button><Button variant="primary" disabled={busy} onClick={() => updateCase(item._id, { status: 'INVESTIGATING', assignToMe: true })}>Điều tra</Button><Button variant="success" disabled={busy} onClick={() => updateCase(item._id, { status: 'RESOLVED' })}>Hoàn tất</Button><Button disabled={busy} onClick={() => updateCase(item._id, { status: 'DISMISSED' })}>Bỏ qua</Button></div></>}
                  </div>
                )}
              </AdminCard>
            );
          })}
        </div>
      )}
    </div>
  );
}
