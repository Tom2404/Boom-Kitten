import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useAdminApi } from './useAdminApi.js';
import { buildRoutineAdminPayload, createAdminOperationRequestId } from './adminMutation.js';
import { buildTournamentCreatePayload, buildTournamentPayoutPayload, buildTournamentTransitionPayload, tournamentStatusTone } from './adminTournament.js';
import { AdminCard, Alert, Button, ConfirmDialog, EmptyState, Field, Pagination, SectionHeader, SkeletonBlock, StatusBadge, inputClass } from './ui.jsx';
import goldCoinIcon from '../../assets/currencies/goldcoin.png';

const initialForm = {
  name: '', description: '', entryFee: 50, prizeCoins: 500, registrationOpensAt: '', startTime: '', registrationClosesAt: '', reason: '',
  cosmeticRewards: [{ rank: 1, type: 'skin', itemId: '' }, { rank: 2, type: 'emote', itemId: '' }, { rank: 3, type: 'avatar_frame', itemId: '' }],
};

function errorText(response, fallback) {
  return response.data?.error?.message || response.data?.message || response.error || fallback;
}

function formatDate(value) {
  if (!value) return '—';
  return new Intl.DateTimeFormat('vi-VN', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
}

function nextTransitions(status) {
  if (status === 'registration') return ['active', 'cancelled'];
  if (status === 'active') return ['cancelled'];
  return [];
}

export default function TournamentsPanel({ permissions, adminUsername }) {
  const { request } = useAdminApi();
  const canWrite = permissions.includes('tournaments.write');
  const canOverride = permissions.includes('tournaments.override');
  const canRefund = permissions.includes('tournaments.refund');
  const canPayout = permissions.includes('tournaments.payout');
  const [items, setItems] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [filters, setFilters] = useState({ search: '', status: '', payoutState: '', refundState: '' });
  const [detail, setDetail] = useState(null);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [participantId, setParticipantId] = useState('');
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState('');
  const [message, setMessage] = useState(null);
  const [confirmAction, setConfirmAction] = useState(null);
  const [payoutPreview, setPayoutPreview] = useState(null);
  const [refundPreview, setRefundPreview] = useState(null);
  const [confirmationUsername, setConfirmationUsername] = useState('');

  const loadList = useCallback(async (page = 1) => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: '20' });
    Object.entries(filters).forEach(([key, value]) => { if (value.trim()) params.set(key, value.trim()); });
    const response = await request(`/api/admin/tournaments?${params}`);
    setLoading(false);
    if (!response.ok) return setMessage({ tone: 'danger', text: errorText(response, 'Không thể tải Tournament.') });
    setItems(response.data.data.items || []);
    setPagination(response.data.data.pagination || { page, pages: 1, total: 0 });
  }, [filters, request]);

  const loadDetail = useCallback(async (id, updateUrl = true) => {
    setDetailLoading(true);
    const [response, auditResponse] = await Promise.all([
      request(`/api/admin/tournaments/${id}`),
      request(`/api/admin/tournaments/${id}/audit`),
    ]);
    setDetailLoading(false);
    if (!response.ok) return setMessage({ tone: 'danger', text: errorText(response, 'Không thể tải chi tiết Tournament.') });
    setDetail(response.data.data);
    setAuditLogs(auditResponse.ok ? auditResponse.data.data || [] : []);
    setPayoutPreview(null);
    setRefundPreview(null);
    if (updateUrl) {
      const url = new URL(window.location.href);
      url.searchParams.set('tournamentId', id);
      window.history.replaceState({}, '', url);
    }
  }, [request]);

  useEffect(() => { void loadList(1); }, [loadList]);
  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get('tournamentId');
    if (id) void loadDetail(id, false);
  }, [loadDetail]);

  const mutate = async (endpoint, body, success, method = 'POST') => {
    if (busy) return null;
    setBusy(endpoint);
    const response = await request(endpoint, { method, body: JSON.stringify(body) });
    setBusy('');
    if (!response.ok) {
      setMessage({ tone: 'danger', text: errorText(response, 'Thao tác thất bại.') });
      return null;
    }
    setMessage({ tone: 'success', text: success });
    await loadList(pagination.page);
    if (detail?.tournament?._id) await loadDetail(detail.tournament._id, false);
    return response.data.data;
  };

  const createTournament = async (event) => {
    event.preventDefault();
    if (!form.name.trim() || !form.startTime || !form.registrationClosesAt || !form.reason.trim()) {
      setMessage({ tone: 'danger', text: 'Tên, thời gian, đóng đăng ký và lý do audit là bắt buộc.' });
      return;
    }
    let payload;
    try { payload = buildTournamentCreatePayload(form, createAdminOperationRequestId()); }
    catch { setMessage({ tone: 'danger', text: 'Thời gian Tournament không hợp lệ.' }); return; }
    const created = await mutate('/api/admin/tournaments', payload, 'Đã tạo Tournament.', 'POST');
    if (created) { setForm(initialForm); setShowCreateForm(false); await loadDetail(created._id); }
  };

  const registerParticipant = async (event) => {
    event.preventDefault();
    if (!participantId.trim() || !reason.trim()) return setMessage({ tone: 'danger', text: 'Player ID và lý do audit là bắt buộc.' });
    const body = buildRoutineAdminPayload({ userId: participantId.trim(), reason: reason.trim() }, createAdminOperationRequestId());
    const result = await mutate(`/api/admin/tournaments/${detail.tournament._id}/participants`, body, 'Đã đăng ký người chơi và thu entry fee.');
    if (result) setParticipantId('');
  };

  const overrideScore = async (participant, score) => {
    if (!reason.trim()) return setMessage({ tone: 'danger', text: 'Nhập lý do audit trước khi override.' });
    const body = buildRoutineAdminPayload({ score: Number(score), expectedVersion: participant.__v, reason: reason.trim() }, createAdminOperationRequestId());
    await mutate(`/api/admin/tournaments/${detail.tournament._id}/participants/${participant._id}`, body, 'Đã override điểm Tournament.', 'PATCH');
  };

  const transition = async (nextStatus) => {
    if (!reason.trim()) return setMessage({ tone: 'danger', text: 'Lý do audit là bắt buộc.' });
    const body = buildTournamentTransitionPayload({ nextStatus, expectedVersion: detail.tournament.stateVersion, reason, requestId: createAdminOperationRequestId() });
    const result = await mutate(`/api/admin/tournaments/${detail.tournament._id}/transitions`, body, `Đã chuyển Tournament sang ${nextStatus}.`);
    if (result) setConfirmAction(null);
  };

  const previewPayout = async () => {
    if (!reason.trim()) return setMessage({ tone: 'danger', text: 'Nhập lý do audit trước khi preview payout.' });
    const body = buildRoutineAdminPayload({ expectedVersion: detail.tournament.stateVersion, reason: reason.trim() }, createAdminOperationRequestId());
    const result = await mutate(`/api/admin/tournaments/${detail.tournament._id}/payouts/preview`, body, 'Đã khóa preview payout trong 15 phút.');
    if (result) setPayoutPreview(result);
  };

  const executePayout = async () => {
    if (!payoutPreview || confirmationUsername.trim() !== adminUsername) return;
    const body = buildTournamentPayoutPayload({ previewToken: payoutPreview.previewToken, expectedVersion: payoutPreview.stateVersion, reason, confirmationUsername, requestId: createAdminOperationRequestId() });
    const result = await mutate(`/api/admin/tournaments/${detail.tournament._id}/payouts`, body, 'Đã xử lý payout Tournament.');
    if (result) { setPayoutPreview(null); setConfirmationUsername(''); }
  };

  const previewRefund = async () => {
    if (!reason.trim()) return setMessage({ tone: 'danger', text: 'Nhập lý do audit trước khi preview refund.' });
    const body = buildRoutineAdminPayload({ reason: reason.trim() }, createAdminOperationRequestId());
    const result = await mutate(`/api/admin/tournaments/${detail.tournament._id}/refunds/preview`, body, 'Đã tạo preview hoàn Coin.');
    if (result) setRefundPreview(result);
  };

  const retryRefund = async () => {
    if (!reason.trim()) return setMessage({ tone: 'danger', text: 'Nhập lý do audit trước khi retry refund.' });
    const body = buildRoutineAdminPayload({ reason: reason.trim() }, createAdminOperationRequestId());
    const result = await mutate(`/api/admin/tournaments/${detail.tournament._id}/refunds/retry`, body, 'Đã retry hoàn Coin.');
    if (result) setRefundPreview(null);
  };

  return (
    <div className="flex flex-col gap-6">
      <SectionHeader
        title="Tournament Operations"
        description="Quản lý lịch, đăng ký, bracket, hoàn Coin, payout và audit theo luật Tournament v1."
        actions={
          <div className="flex items-center gap-2">
            {canWrite && (
              <Button
                variant={showCreateForm ? 'secondary' : 'primary'}
                className="min-h-9 text-xs"
                onClick={() => setShowCreateForm(!showCreateForm)}
              >
                <span className="material-symbols-outlined mr-1 text-base" aria-hidden="true">
                  {showCreateForm ? 'close' : 'emoji_events'}
                </span>
                {showCreateForm ? 'Đóng Form' : 'Tạo Tournament'}
              </Button>
            )}
            <Button variant="secondary" className="min-h-9 text-xs" onClick={() => loadList(pagination.page)}>
              <span className="material-symbols-outlined mr-1 text-base" aria-hidden="true">refresh</span>
              Làm mới
            </Button>
          </div>
        }
      />
      {message && <Alert tone={message.tone}>{message.text}</Alert>}
      {!canWrite && <Alert tone="info">Chế độ chỉ đọc: bạn có thể theo dõi giải, người tham gia, bracket và audit.</Alert>}

      {canWrite && showCreateForm && (
        <CreateTournamentForm form={form} setForm={setForm} onSubmit={createTournament} busy={busy} onClose={() => setShowCreateForm(false)} />
      )}

      <div className="grid gap-6 xl:grid-cols-[minmax(340px,0.8fr)_minmax(0,1.5fr)]">
        <AdminCard className="p-5">
          <div className="border-b border-[var(--admin-border)] pb-4">
            <h3 className="text-xs font-bold uppercase tracking-[0.08em] text-[var(--admin-text-muted)]">Bộ lọc & Tìm kiếm</h3>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <Field label="Tìm kiếm">
                <input className={inputClass} value={filters.search} onChange={(event) => setFilters({ ...filters, search: event.target.value })} placeholder="Tên Tournament..." />
              </Field>
              <Field label="Trạng thái">
                <select className={inputClass} value={filters.status} onChange={(event) => setFilters({ ...filters, status: event.target.value })}>
                  <option value="">Tất cả</option>
                  <option value="registration">Registration (Mở đăng ký)</option>
                  <option value="active">Active (Đang thi đấu)</option>
                  <option value="completed">Completed (Kết thúc)</option>
                  <option value="cancelled">Cancelled (Đã hủy)</option>
                </select>
              </Field>
              <Field label="Payout">
                <select className={inputClass} value={filters.payoutState} onChange={(event) => setFilters({ ...filters, payoutState: event.target.value })}>
                  <option value="">Tất cả</option>
                  <option value="pending">Pending</option>
                  <option value="processing">Processing</option>
                  <option value="completed">Completed</option>
                  <option value="failed">Failed</option>
                </select>
              </Field>
              <Field label="Refund">
                <select className={inputClass} value={filters.refundState} onChange={(event) => setFilters({ ...filters, refundState: event.target.value })}>
                  <option value="">Tất cả</option>
                  <option value="pending">Pending</option>
                  <option value="processing">Processing</option>
                  <option value="completed">Completed</option>
                  <option value="failed">Failed</option>
                </select>
              </Field>
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-wider text-[var(--admin-text-muted)]">{pagination.total} Tournament</p>
          </div>
          <div className="mt-3 grid gap-3">
            {loading ? (
              <SkeletonBlock rows={4} />
            ) : items.length === 0 ? (
              <EmptyState title="Chưa có Tournament" description="Điều chỉnh bộ lọc hoặc bấm nút Tạo Tournament để tạo giải đầu tiên." />
            ) : (
              items.map((item) => (
                <TournamentListItem key={item._id} item={item} selected={detail?.tournament?._id === item._id} onClick={() => loadDetail(item._id)} />
              ))
            )}
          </div>
          <div className="mt-4 border-t border-[var(--admin-border)] pt-3">
            <Pagination page={pagination.page} totalPages={pagination.pages} onPageChange={loadList} />
          </div>
        </AdminCard>

        <div className="min-w-0">
          {detailLoading ? (
            <AdminCard className="p-6"><SkeletonBlock rows={8} /></AdminCard>
          ) : !detail ? (
            <AdminCard className="p-12 text-center border-dashed">
              <span className="material-symbols-outlined text-4xl text-[var(--admin-accent)]/60">emoji_events</span>
              <h3 className="mt-2 text-base font-bold text-[var(--admin-text)]">Chọn một Tournament</h3>
              <p className="mt-1 text-sm text-[var(--admin-text-muted)]">Chi tiết người tham gia, bracket thi đấu, payout và audit timeline sẽ hiển thị ở đây.</p>
            </AdminCard>
          ) : (
            <TournamentDetail
              detail={detail}
              auditLogs={auditLogs}
              canWrite={canWrite}
              canOverride={canOverride}
              canRefund={canRefund}
              canPayout={canPayout}
              reason={reason}
              setReason={setReason}
              participantId={participantId}
              setParticipantId={setParticipantId}
              registerParticipant={registerParticipant}
              overrideScore={overrideScore}
              setConfirmAction={setConfirmAction}
              previewPayout={previewPayout}
              previewRefund={previewRefund}
              retryRefund={retryRefund}
              busy={busy}
            />
          )}
        </div>
      </div>

      <ConfirmDialog open={!!confirmAction} title={`Chuyển trạng thái sang ${confirmAction}?`} description="Thao tác được khóa bằng state version và ghi đầy đủ vào audit log." confirmLabel="Xác nhận chuyển" confirmDisabled={!!busy || !reason.trim()} onConfirm={() => transition(confirmAction)} onClose={() => setConfirmAction(null)}>
        <Field label="Lý do audit"><textarea className={inputClass} rows="3" value={reason} onChange={(event) => setReason(event.target.value)} /></Field>
      </ConfirmDialog>
      <ConfirmDialog open={!!payoutPreview} title="Xác nhận payout Tournament" description={`Sẽ cộng ${payoutPreview?.totals?.coins || 0} Coin cho ${payoutPreview?.rows?.length || 0} người.`} confirmLabel="Thực hiện payout" confirmDisabled={!!busy || confirmationUsername.trim() !== adminUsername} onConfirm={executePayout} onClose={() => { setPayoutPreview(null); setConfirmationUsername(''); }}>
        <Field label={`Nhập username để xác nhận: ${adminUsername}`}><input className={inputClass} value={confirmationUsername} onChange={(event) => setConfirmationUsername(event.target.value)} autoComplete="off" /></Field>
      </ConfirmDialog>
      <ConfirmDialog open={!!refundPreview} title="Xác nhận retry refund" description={`Sẽ hoàn ${refundPreview?.totalCoins || 0} Coin cho ${refundPreview?.recipients || 0} người còn entry chưa hoàn.`} confirmLabel="Retry refund" onConfirm={retryRefund} onClose={() => setRefundPreview(null)} />
    </div>
  );
}

function CreateTournamentForm({ form, setForm, onSubmit, busy, onClose }) {
  const updateReward = (index, field, value) => setForm({ ...form, cosmeticRewards: form.cosmeticRewards.map((reward, rewardIndex) => rewardIndex === index ? { ...reward, [field]: value } : reward) });

  return (
    <AdminCard className="relative overflow-hidden border border-amber-400/40 bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent p-6 shadow-md">
      <div className="flex items-center justify-between border-b border-amber-300/40 pb-4">
        <div className="flex items-center gap-2.5">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-amber-500 text-white shadow-sm">
            <span className="material-symbols-outlined text-xl">emoji_events</span>
          </span>
          <div>
            <h3 className="text-base font-bold text-[var(--admin-text)]">Tạo Tournament v1</h3>
            <p className="text-xs text-[var(--admin-text-muted)]">Cấu hình thông số giải đấu, phí đăng ký, giải thưởng Coin và vật phẩm thưởng.</p>
          </div>
        </div>
        <button type="button" onClick={onClose} className="rounded-lg p-1 text-[var(--admin-text-muted)] hover:bg-amber-500/10 hover:text-[var(--admin-text)]">
          <span className="material-symbols-outlined text-xl">close</span>
        </button>
      </div>

      <form onSubmit={onSubmit} className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Field label="Tên giải">
          <input className={inputClass} value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="VD: Giải Kitten Championship..." />
        </Field>
        <Field label="Mở đăng ký">
          <input className={inputClass} type="datetime-local" value={form.registrationOpensAt} onChange={(event) => setForm({ ...form, registrationOpensAt: event.target.value })} />
        </Field>
        <Field label="Bắt đầu">
          <input className={inputClass} type="datetime-local" value={form.startTime} onChange={(event) => setForm({ ...form, startTime: event.target.value })} />
        </Field>
        <Field label="Đóng đăng ký">
          <input className={inputClass} type="datetime-local" value={form.registrationClosesAt} onChange={(event) => setForm({ ...form, registrationClosesAt: event.target.value })} />
        </Field>
        <Field label="Format">
          <input className={inputClass} value="8 người · 2 bảng · Chung kết" readOnly />
        </Field>
        <Field label="Entry fee (Coin)">
          <div className="relative">
            <input className={`${inputClass} pr-10`} type="number" min="0" value={form.entryFee} onChange={(event) => setForm({ ...form, entryFee: event.target.value })} />
            <img src={goldCoinIcon} alt="Coin" className="absolute right-3 top-2.5 h-5 w-5 object-contain mix-blend-multiply" />
          </div>
        </Field>
        <Field label="Prize pool (Coin)">
          <div className="relative">
            <input className={`${inputClass} pr-10`} type="number" min="0" value={form.prizeCoins} onChange={(event) => setForm({ ...form, prizeCoins: event.target.value })} />
            <img src={goldCoinIcon} alt="Coin" className="absolute right-3 top-2.5 h-5 w-5 object-contain mix-blend-multiply" />
          </div>
        </Field>
        {form.cosmeticRewards.map((reward, index) => (
          <Field key={reward.rank} label={`Cosmetic hạng ${reward.rank}`}>
            <div className="flex gap-2">
              <select className={`${inputClass} w-36`} value={reward.type} onChange={(event) => updateReward(index, 'type', event.target.value)}>
                <option value="skin">Skin</option>
                <option value="emote">Emote</option>
                <option value="avatar_frame">Avatar frame</option>
              </select>
              <input className={inputClass} value={reward.itemId} onChange={(event) => updateReward(index, 'itemId', event.target.value)} placeholder="Item ID" />
            </div>
          </Field>
        ))}
        <Field label="Mô tả">
          <input className={inputClass} value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} placeholder="Mô tả giải đấu..." />
        </Field>
        <Field label="Lý do audit">
          <input className={inputClass} value={form.reason} onChange={(event) => setForm({ ...form, reason: event.target.value })} placeholder="Lý do khởi tạo..." />
        </Field>
        <div className="md:col-span-2 xl:col-span-4 flex justify-end gap-2 pt-2 border-t border-amber-300/30">
          <Button type="button" variant="secondary" onClick={onClose}>Hủy</Button>
          <Button type="submit" variant="primary" disabled={!!busy} className="bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 border-none shadow-md">
            <span className="material-symbols-outlined mr-1 text-base">emoji_events</span>
            Tạo Tournament
          </Button>
        </div>
      </form>
    </AdminCard>
  );
}

function TournamentListItem({ item, selected, onClick }) {
  const registeredCount = item.registeredCount || 0;
  const maxCount = item.maxParticipants || 8;
  const progressPercent = Math.min(100, Math.round((registeredCount / maxCount) * 100));

  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative w-full rounded-xl border p-4 text-left transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-[var(--admin-focus)] ${
        selected
          ? 'border-amber-400 bg-amber-500/10 shadow-sm before:absolute before:bottom-3 before:left-0 before:top-3 before:w-1.5 before:rounded-r-full before:bg-amber-500'
          : 'border-[var(--admin-border)] bg-[var(--admin-surface)] hover:bg-[var(--admin-surface-muted)]'
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <strong className="font-bold text-sm text-[var(--admin-text)] truncate">{item.name}</strong>
        <StatusBadge tone={tournamentStatusTone(item.status)}>{item.status}</StatusBadge>
      </div>

      <div className="mt-3 flex items-center justify-between text-xs font-semibold text-[var(--admin-text-muted)]">
        <span className="flex items-center gap-1 font-mono text-[var(--admin-text)]">
          <img src={goldCoinIcon} alt="Coin" className="h-4 w-4 object-contain mix-blend-multiply" />
          {item.entryFee} / {item.prizePool?.coins || item.prizeCoins || 0}
        </span>
        <span className="font-mono">{registeredCount}/{maxCount} người</span>
      </div>

      <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
        <div className="h-full bg-amber-500 transition-all duration-300" style={{ width: `${progressPercent}%` }} />
      </div>

      <p className="mt-2 text-[11px] font-semibold text-[var(--admin-text-muted)] flex items-center gap-1">
        <span className="material-symbols-outlined text-xs">schedule</span>
        {formatDate(item.startTime)}
      </p>
    </button>
  );
}

function TournamentDetail({ detail, auditLogs, canWrite, canOverride, canRefund, canPayout, reason, setReason, participantId, setParticipantId, registerParticipant, overrideScore, setConfirmAction, previewPayout, previewRefund, retryRefund, busy }) {
  const { tournament, participants = [] } = detail;
  return (
    <div className="grid gap-6">
      <AdminCard className="p-6 border border-amber-400/30">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[var(--admin-border)] pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-amber-500 text-2xl">emoji_events</span>
              <h3 className="text-xl font-bold text-[var(--admin-text)]">{tournament.name}</h3>
            </div>
            <p className="mt-1 text-xs leading-5 text-[var(--admin-text-muted)]">{tournament.description || 'Không có mô tả'}</p>
          </div>
          <StatusBadge tone={tournamentStatusTone(tournament.status)}>{tournament.status}</StatusBadge>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            ['Người chơi', `${tournament.registeredCount || 0}/8`, 'group'],
            ['Phí tham gia', `${tournament.entryFee} Coin`, 'payments'],
            ['Giải thưởng', `${tournament.prizePool?.coins || 0} Coin`, 'military_tech'],
            ['Phiên trạng thái', `v${tournament.stateVersion}`, 'numbers'],
          ].map(([label, value, icon]) => (
            <div key={label} className="rounded-xl border border-[var(--admin-border)] bg-[var(--admin-surface-muted)]/70 p-3">
              <p className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-[var(--admin-text-muted)]">
                <span className="material-symbols-outlined text-sm">{icon}</span>
                {label}
              </p>
              <p className="mt-1 font-mono text-base font-bold text-[var(--admin-text)]">{value}</p>
            </div>
          ))}
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 rounded-xl bg-[var(--admin-surface-muted)]/50 p-3 text-xs font-semibold">
          <span className="text-[var(--admin-text-muted)]">Bắt đầu: <strong className="text-[var(--admin-text)]">{formatDate(tournament.startTime)}</strong></span>
          <span className="text-[var(--admin-text-muted)]">Đóng đăng ký: <strong className="text-[var(--admin-text)]">{formatDate(tournament.registrationClosesAt)}</strong></span>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <StatusBadge tone={tournament.payoutState === 'completed' ? 'success' : tournament.payoutState === 'failed' ? 'danger' : 'warning'}>Payout: {tournament.payoutState}</StatusBadge>
          <StatusBadge tone={tournament.refundState === 'completed' ? 'success' : tournament.refundState === 'failed' ? 'danger' : 'warning'}>Refund: {tournament.refundState}</StatusBadge>
        </div>

        {(canWrite || canRefund || canPayout || canOverride) && (
          <div className="mt-5 grid gap-3 border-t border-[var(--admin-border)] pt-4">
            <Field label="Lý do audit (Bắt buộc cho mọi thao tác chuyển trạng thái)">
              <input className={inputClass} value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Nhập lý do audit..." />
            </Field>
            <div className="flex flex-wrap gap-2 pt-1">
              {canWrite && nextTransitions(tournament.status).map((status) => (
                <Button key={status} variant={status === 'cancelled' ? 'danger' : 'primary'} onClick={() => setConfirmAction(status)} disabled={!!busy}>
                  Chuyển {status}
                </Button>
              ))}
              {canPayout && tournament.status === 'completed' && tournament.payoutState !== 'completed' && (
                <Button variant="success" onClick={previewPayout} disabled={!!busy}>Preview payout</Button>
              )}
              {canRefund && tournament.status === 'cancelled' && (
                <>
                  <Button onClick={previewRefund} disabled={!!busy}>Preview refund</Button>
                  <Button variant="danger" onClick={retryRefund} disabled={!!busy || tournament.refundState === 'completed'}>Retry refund</Button>
                </>
              )}
            </div>
          </div>
        )}
      </AdminCard>

      {canWrite && tournament.status === 'registration' && (
        <AdminCard className="p-5 border-l border-l-emerald-500">
          <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--admin-text-muted)] mb-3">Đăng ký thủ công cho người chơi</h4>
          <form onSubmit={registerParticipant} className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <Field label="Player ID (Mongo ObjectId)">
              <input className={inputClass} value={participantId} onChange={(event) => setParticipantId(event.target.value)} placeholder="65a..." />
            </Field>
            <Button type="submit" variant="primary" disabled={!!busy} className="min-h-10 px-4 text-xs whitespace-nowrap">
              Đăng ký & Thu phí
            </Button>
          </form>
        </AdminCard>
      )}

      <AdminCard className="p-5">
        <h3 className="font-bold text-sm text-[var(--admin-text)]">Danh sách người tham gia ({participants.length}/8)</h3>
        {participants.length === 0 ? (
          <EmptyState title="Chưa có người đăng ký" description="Chờ người chơi đăng ký hoặc thực hiện đăng ký thủ công ở trên." />
        ) : (
          <div className="mt-3 overflow-auto rounded-xl border border-[var(--admin-border)]">
            <table className="w-full min-w-[680px] border-collapse text-xs">
              <thead className="bg-[var(--admin-surface-muted)] text-[11px] font-bold uppercase text-[var(--admin-text-muted)]">
                <tr>
                  <th className="p-3 text-left">Người chơi</th>
                  <th className="p-3 text-left">Thanh toán</th>
                  <th className="p-3 text-left">Điểm</th>
                  <th className="p-3 text-left">Hạng</th>
                  <th className="p-3 text-left">Payout</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--admin-border)]">
                {participants.map((participant) => (
                  <ParticipantRow key={participant._id} participant={participant} active={tournament.status === 'active'} canOverride={canOverride} overrideScore={overrideScore} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </AdminCard>

      <BracketPanel bracket={tournament.bracket} />

      <AdminCard className="p-5">
        <h3 className="font-bold text-sm text-[var(--admin-text)]">Audit timeline</h3>
        {auditLogs.length ? (
          <div className="mt-3 grid gap-2.5">
            {auditLogs.map((log) => (
              <div key={log._id} className="border-l border-[var(--admin-accent)] bg-[var(--admin-surface-muted)]/40 p-3 rounded-r-lg text-xs">
                <div className="flex items-center justify-between font-semibold">
                  <span className="font-bold text-[var(--admin-text)]">{log.action}</span>
                  <span className="text-[11px] text-[var(--admin-text-muted)]">{formatDate(log.createdAt)}</span>
                </div>
                <p className="mt-1 text-[var(--admin-text-muted)]">Actor: <strong>{log.actorUsername || log.adminId}</strong> · Lý do: {log.reason}</p>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState title="Chưa có audit log" description="Các thao tác thay đổi trạng thái Tournament sẽ ghi log tại đây." />
        )}
      </AdminCard>
    </div>
  );
}

function ParticipantRow({ participant, active, canOverride, overrideScore }) {
  const [score, setScore] = useState(participant.score || 0);
  useEffect(() => setScore(participant.score || 0), [participant.score]);
  return (
    <tr className="transition-colors hover:bg-[var(--admin-surface-muted)]/50">
      <td className="p-3">
        <strong className="font-bold text-xs text-[var(--admin-text)]">{participant.userId?.username || 'Unknown'}</strong>
        <p className="font-mono text-[10px] text-[var(--admin-text-muted)]">{participant.userId?._id || participant.userId}</p>
      </td>
      <td className="p-3">
        <StatusBadge tone={participant.paymentStatus === 'paid' ? 'success' : 'danger'}>{participant.paymentStatus}</StatusBadge>
        <p className="mt-1 flex items-center gap-1 font-mono text-[11px] font-bold text-[var(--admin-text)]">
          <img src={goldCoinIcon} alt="Coin" className="h-3.5 w-3.5 object-contain mix-blend-multiply" />
          {participant.entryFeePaid}
        </p>
      </td>
      <td className="p-3">
        {active && canOverride ? (
          <div className="flex items-center gap-2">
            <input aria-label="Điểm override" className={`${inputClass} min-h-8 w-20 text-xs px-2`} type="number" min="0" value={score} onChange={(event) => setScore(event.target.value)} />
            <Button className="min-h-8 px-2 py-0.5 text-xs" onClick={() => overrideScore(participant, score)}>Override</Button>
          </div>
        ) : (
          <span className="font-mono font-bold text-xs text-[var(--admin-text)]">{participant.score || 0}</span>
        )}
      </td>
      <td className="p-3 font-mono font-bold text-xs">{participant.finalRank || '—'}</td>
      <td className="p-3">
        <StatusBadge tone={participant.payoutStatus === 'completed' ? 'success' : 'danger'}>{participant.payoutStatus}</StatusBadge>
      </td>
    </tr>
  );
}

function BracketPanel({ bracket }) {
  if (!bracket?.rounds?.length) {
    return (
      <AdminCard className="p-5 border-dashed">
        <EmptyState title="Bracket chưa được tạo" description="Bracket được tạo tự động khi đủ 8 người và giải chuyển sang trạng thái Active." />
      </AdminCard>
    );
  }
  return (
    <AdminCard className="p-5">
      <div className="flex items-center gap-2 border-b border-[var(--admin-border)] pb-3">
        <span className="material-symbols-outlined text-amber-500">alt_route</span>
        <h3 className="font-bold text-sm text-[var(--admin-text)]">Lịch thi đấu & Bracket tự động</h3>
      </div>
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        {bracket.rounds.flatMap((round) =>
          round.matches.map((match) => (
            <article key={match.id} className="rounded-xl border border-[var(--admin-border)] bg-[var(--admin-surface-muted)]/50 p-3.5">
              <div className="flex justify-between gap-2">
                <p className="font-mono text-xs font-bold uppercase tracking-wider text-[var(--admin-text)]">{round.name} · {match.id}</p>
                <StatusBadge tone={match.status === 'completed' ? 'success' : match.status === 'pending' ? 'warning' : 'neutral'}>{match.status}</StatusBadge>
              </div>
              {match.roomCode && <p className="mt-1 font-mono text-xs font-semibold text-[var(--admin-accent)]">Room: {match.roomCode}</p>}
              <div className="mt-2.5 grid gap-2">
                {(match.participants || []).map((person) => {
                  const result = match.result?.find((row) => row.participantId === person.participantId);
                  return (
                    <div key={person.participantId} className="flex items-center justify-between rounded-lg border border-[var(--admin-border)] bg-[var(--admin-surface)] p-2.5 text-xs font-bold">
                      <span className="text-[var(--admin-text)]">{person.username}</span>
                      {result && (
                        <span className="font-mono text-[11px] text-[var(--admin-text-muted)]">
                          #{result.placement} · {result.points}đ{result.forfeit ? ' (xử thua)' : ''}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </article>
          ))
        )}
      </div>
    </AdminCard>
  );
}
