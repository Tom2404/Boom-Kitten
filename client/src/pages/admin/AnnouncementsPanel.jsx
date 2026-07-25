import React, { useEffect, useState } from 'react';
import { useAdminApi } from './useAdminApi.js';
import { Alert, Button, ConfirmDialog, EmptyState, Field, inputClass, SectionHeader, StatusBadge } from './ui.jsx';
import { getAdminPanelAccess } from './adminPanelAccess.js';
import { buildDeleteAdminPayload, buildRoutineAdminPayload, createAdminOperationRequestId } from './adminMutation.js';
import { formatDateTime } from './utils.js';

export default function AnnouncementsPanel({ permissions = [] }) {
  const { request } = useAdminApi();
  const [title, setTitle] = useState('Thông Báo Hệ Thống');
  const [message, setMessage] = useState('');
  const [type, setType] = useState('info');
  const [duration, setDuration] = useState(30);
  const [sendMode, setSendMode] = useState('now');
  const [scheduledFor, setScheduledFor] = useState('');
  const [audienceType, setAudienceType] = useState('all_online');
  const [roles, setRoles] = useState(['user']);
  const [minElo, setMinElo] = useState(1000);
  const [maxElo, setMaxElo] = useState(3000);
  const [operationRequestId, setOperationRequestId] = useState(createAdminOperationRequestId);
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [cancelTarget, setCancelTarget] = useState(null);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelRequestId, setCancelRequestId] = useState(null);
  const [cancelling, setCancelling] = useState(false);
  const [result, setResult] = useState({ tone: '', text: '' });
  const [sending, setSending] = useState(false);
  const { canWriteAnnouncements } = getAdminPanelAccess(permissions);
  const canSchedule = permissions.includes('announcements.schedule');
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  const loadHistory = async () => {
    setHistoryLoading(true);
    const res = await request('/api/admin/announcements?limit=20');
    if (res.ok) setHistory(res.data?.data?.items || []);
    setHistoryLoading(false);
  };

  useEffect(() => { loadHistory(); }, [request]);

  const submitAnnouncement = async (event) => {
    event.preventDefault();
    if (!message.trim()) return setResult({ tone: 'danger', text: 'Nội dung thông báo không được để trống.' });
    setSending(true);
    if (sendMode === 'scheduled' && !scheduledFor) {
      setSending(false);
      return setResult({ tone: 'danger', text: 'Chọn thời điểm phát thông báo.' });
    }
    const audience = audienceType === 'role'
      ? { type: 'role', roles }
      : audienceType === 'rank_range'
        ? { type: 'rank_range', minElo: Number(minElo), maxElo: Number(maxElo) }
        : { type: 'all_online' };
    const res = await request('/api/admin/announcements', {
      method: 'POST',
      body: JSON.stringify(buildRoutineAdminPayload({ title: title.trim(), message: message.trim(), type, durationSeconds: Number(duration), sendMode, scheduledFor: sendMode === 'scheduled' ? new Date(scheduledFor).toISOString() : undefined, audience }, operationRequestId)),
    });
    if (res.ok) {
      setResult({ tone: 'success', text: sendMode === 'now' ? 'Đã phát thông báo đến người chơi phù hợp.' : sendMode === 'scheduled' ? 'Đã lên lịch thông báo.' : 'Đã lưu bản nháp.' });
      setMessage('');
      setOperationRequestId(createAdminOperationRequestId());
      loadHistory();
    } else setResult({ tone: 'danger', text: res.data?.error?.message || res.data?.message || res.error || 'Gửi thông báo thất bại.' });
    setSending(false);
  };

  const openCancel = (announcement) => {
    setCancelTarget(announcement);
    setCancelReason('');
    setCancelRequestId(createAdminOperationRequestId());
  };

  const cancelAnnouncement = async () => {
    if (!cancelTarget || !cancelReason.trim()) return;
    setCancelling(true);
    const res = await request(`/api/admin/announcements/${cancelTarget._id}/cancel`, { method: 'POST', body: JSON.stringify(buildDeleteAdminPayload(cancelReason, cancelRequestId)) });
    setCancelling(false);
    if (res.ok) {
      setResult({ tone: 'success', text: 'Đã hủy lịch thông báo.' });
      setCancelTarget(null);
      setCancelReason('');
      setCancelRequestId(null);
      loadHistory();
    } else setResult({ tone: 'danger', text: res.data?.error?.message || res.data?.message || 'Không thể hủy lịch.' });
  };

  return (
    <div className="flex flex-col gap-5">
      <SectionHeader title="Thông báo live" description="Soạn và gửi broadcast ngắn đến toàn bộ người chơi đang online." />
      {result.text && <Alert tone={result.tone}>{result.text}</Alert>}
      {!canWriteAnnouncements && <Alert tone="info">Chế độ chỉ đọc: bạn không có quyền phát thông báo live.</Alert>}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {canWriteAnnouncements && <form onSubmit={submitAnnouncement} className="rounded-lg border border-[var(--admin-border)] bg-[var(--admin-surface)] p-4 shadow-[0_1px_2px_rgba(32,35,31,0.03)]">
          <div className="grid gap-4">
            <Field label="Tiêu đề"><input className={inputClass} value={title} onChange={(event) => setTitle(event.target.value)} /></Field>
            <Field label="Nội dung"><textarea className={inputClass} rows="5" value={message} onChange={(event) => setMessage(event.target.value)} placeholder="Thông báo bảo trì, sự kiện, quà tặng..." /></Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Loại thông báo"><select className={inputClass} value={type} onChange={(event) => setType(event.target.value)}><option value="info">Thông tin</option><option value="warning">Cảnh báo</option><option value="event">Sự kiện</option></select></Field>
              <Field label="Thời lượng giây"><input className={inputClass} type="number" min="5" max="300" value={duration} onChange={(event) => setDuration(event.target.value)} /></Field>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Chế độ"><select className={inputClass} value={sendMode} onChange={(event) => setSendMode(event.target.value)}><option value="now">Gửi ngay</option><option value="draft">Lưu nháp</option>{canSchedule && <option value="scheduled">Lên lịch</option>}</select></Field>
              <Field label="Audience"><select className={inputClass} value={audienceType} onChange={(event) => setAudienceType(event.target.value)}><option value="all_online">Tất cả online</option><option value="role">Theo role</option><option value="rank_range">Theo khoảng ELO</option></select></Field>
            </div>
            {sendMode === 'scheduled' && <Field label={`Thời điểm phát (${timezone})`}><input className={inputClass} type="datetime-local" value={scheduledFor} onChange={(event) => setScheduledFor(event.target.value)} /></Field>}
            {audienceType === 'role' && <Field label="Role người nhận"><select multiple className={inputClass} value={roles} onChange={(event) => setRoles(Array.from(event.target.selectedOptions, (option) => option.value))}><option value="user">User</option><option value="operator">Operator</option><option value="moderator">Moderator</option><option value="analyst">Analyst</option><option value="super_admin">Super admin</option></select></Field>}
            {audienceType === 'rank_range' && <div className="grid grid-cols-2 gap-3"><Field label="ELO tối thiểu"><input className={inputClass} type="number" min="0" value={minElo} onChange={(event) => setMinElo(event.target.value)} /></Field><Field label="ELO tối đa"><input className={inputClass} type="number" min="0" value={maxElo} onChange={(event) => setMaxElo(event.target.value)} /></Field></div>}
          </div>
          <Button type="submit" variant="primary" className="mt-4 w-full" disabled={sending}>{sending ? 'Đang gửi...' : 'Phát thông báo'}</Button>
        </form>}

        <section className="rounded-lg border border-[var(--admin-border)] bg-[var(--admin-surface)] p-4 shadow-[0_1px_2px_rgba(32,35,31,0.03)]">
          <div className="flex items-center justify-between gap-3">
            <h3 className="font-sans text-base font-semibold text-slate-950">Preview</h3>
            <StatusBadge tone={type === 'warning' ? 'danger' : type === 'event' ? 'warning' : 'info'}>{type}</StatusBadge>
          </div>
          <div className={`mt-5 border border-[var(--admin-border)] p-4  ${type === 'warning' ? 'bg-[var(--admin-danger-bg)] text-[var(--admin-danger-text)]' : type === 'event' ? 'bg-[var(--admin-warning-bg)] text-[var(--admin-warning-text)]' : 'bg-[var(--admin-info-bg)] text-[var(--admin-info-text)]'}`}>
            <p className="text-xs font-semibold uppercase tracking-wide opacity-70">{title || 'Thông Báo Hệ Thống'}</p>
            <p className="mt-2 text-sm font-bold leading-6">{message || 'Nội dung thông báo sẽ hiển thị tại đây trước khi phát live.'}</p>
          </div>
          <p className="mt-3 text-sm font-semibold text-slate-500">Thời lượng hiển thị: {duration} giây</p>
        </section>
      </div>
      <section className="rounded-lg border border-[var(--admin-border)] bg-[var(--admin-surface)] p-4 shadow-[0_1px_2px_rgba(32,35,31,0.03)]">
        <div className="flex items-center justify-between gap-3"><h3 className="font-sans text-base font-semibold text-slate-950">Lịch sử thông báo</h3><Button variant="secondary" onClick={loadHistory}>Làm mới</Button></div>
        {historyLoading ? <p className="mt-4 font-bold text-slate-500">Đang tải...</p> : history.length === 0 ? <div className="mt-4"><EmptyState title="Chưa có thông báo" description="Thông báo đã lưu, lên lịch hoặc gửi sẽ xuất hiện tại đây." /></div> : <div className="mt-4 grid gap-3">{history.map((item) => <article key={item._id} className="rounded-lg border border-[var(--admin-border)] bg-[var(--admin-surface-muted)] p-3"><div className="flex flex-wrap items-start justify-between gap-3"><div><div className="flex flex-wrap gap-2"><StatusBadge>{item.status}</StatusBadge><StatusBadge tone="info">{item.audience?.type || 'all_online'}</StatusBadge></div><h4 className="mt-2 font-semibold text-slate-950">{item.title}</h4><p className="mt-1 text-sm font-semibold text-slate-600">{item.message}</p><p className="mt-2 text-xs font-bold text-slate-500">Tạo bởi {item.createdByUsername} · {formatDateTime(item.createdAt)}{item.scheduledFor ? ` · Phát ${formatDateTime(item.scheduledFor)}` : ''} · {item.recipientCount || 0} người nhận</p></div>{item.status === 'scheduled' && canSchedule && <Button variant="danger" onClick={() => openCancel(item)}>Hủy lịch</Button>}</div></article>)}</div>}
      </section>
      <ConfirmDialog open={!!cancelTarget} title="Hủy lịch thông báo?" description={`Thông báo “${cancelTarget?.title}” sẽ không được phát.`} confirmLabel={cancelling ? 'Đang hủy...' : 'Hủy lịch'} confirmDisabled={cancelling || !cancelReason.trim()} onConfirm={cancelAnnouncement} onClose={() => !cancelling && setCancelTarget(null)}><Field label="Lý do hủy"><textarea className={inputClass} rows="3" value={cancelReason} onChange={(event) => setCancelReason(event.target.value)} /></Field></ConfirmDialog>
    </div>
  );
}
