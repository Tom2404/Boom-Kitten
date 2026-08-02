import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useAdminApi } from './useAdminApi.js';
import { buildRoutineAdminPayload, createAdminOperationRequestId } from './adminMutation.js';
import { buildTournamentCreatePayload, buildTournamentPayoutPayload, buildTournamentTransitionPayload, tournamentStatusTone } from './adminTournament.js';
import { AdminCard, Alert, Button, ConfirmDialog, EmptyState, Field, Pagination, SectionHeader, SkeletonBlock, StatusBadge, inputClass } from './ui.jsx';

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
    if (created) { setForm(initialForm); await loadDetail(created._id); }
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
    <div className="flex flex-col gap-5">
      <SectionHeader title="Tournament Operations" description="Quản lý lịch, đăng ký, bracket, hoàn Coin, payout và audit theo luật Tournament v1." actions={<Button onClick={() => loadList(pagination.page)}>Làm mới</Button>} />
      {message && <Alert tone={message.tone}>{message.text}</Alert>}
      {!canWrite && <Alert tone="info">Chế độ chỉ đọc: bạn có thể theo dõi giải, người tham gia, bracket và audit.</Alert>}

      {canWrite && <CreateTournamentForm form={form} setForm={setForm} onSubmit={createTournament} busy={busy} />}

      <div className="grid gap-5 xl:grid-cols-[minmax(320px,0.75fr)_minmax(0,1.5fr)]">
        <AdminCard className="p-4">
          <div className="grid gap-3 sm:grid-cols-2"><Field label="Tìm kiếm"><input className={inputClass} value={filters.search} onChange={(event) => setFilters({ ...filters, search: event.target.value })} placeholder="Tên Tournament" /></Field><Field label="Trạng thái"><select className={inputClass} value={filters.status} onChange={(event) => setFilters({ ...filters, status: event.target.value })}><option value="">Tất cả</option><option value="registration">Registration</option><option value="active">Active</option><option value="completed">Completed</option><option value="cancelled">Cancelled</option></select></Field><Field label="Payout"><select className={inputClass} value={filters.payoutState} onChange={(event) => setFilters({ ...filters, payoutState: event.target.value })}><option value="">Tất cả</option><option value="pending">Pending</option><option value="processing">Processing</option><option value="completed">Completed</option><option value="failed">Failed</option></select></Field><Field label="Refund"><select className={inputClass} value={filters.refundState} onChange={(event) => setFilters({ ...filters, refundState: event.target.value })}><option value="">Tất cả</option><option value="pending">Pending</option><option value="processing">Processing</option><option value="completed">Completed</option><option value="failed">Failed</option></select></Field></div>
          <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-[var(--admin-text-muted)]">{pagination.total} Tournament</p>
          <div className="mt-3 grid gap-3">{loading ? <SkeletonBlock rows={4} /> : items.length === 0 ? <EmptyState title="Chưa có Tournament" description="Điều chỉnh bộ lọc hoặc tạo giải đầu tiên." /> : items.map((item) => <TournamentListItem key={item._id} item={item} selected={detail?.tournament?._id === item._id} onClick={() => loadDetail(item._id)} />)}</div>
          <div className="mt-4"><Pagination page={pagination.page} totalPages={pagination.pages} onPageChange={loadList} /></div>
        </AdminCard>

        <div className="min-w-0">{detailLoading ? <AdminCard className="p-4"><SkeletonBlock rows={6} /></AdminCard> : !detail ? <AdminCard className="p-4"><EmptyState title="Chọn một Tournament" description="Chi tiết người tham gia, bracket, payout và audit sẽ hiện ở đây." /></AdminCard> : <TournamentDetail detail={detail} auditLogs={auditLogs} canWrite={canWrite} canOverride={canOverride} canRefund={canRefund} canPayout={canPayout} reason={reason} setReason={setReason} participantId={participantId} setParticipantId={setParticipantId} registerParticipant={registerParticipant} overrideScore={overrideScore} setConfirmAction={setConfirmAction} previewPayout={previewPayout} previewRefund={previewRefund} retryRefund={retryRefund} busy={busy} />} </div>
      </div>

      <ConfirmDialog open={!!confirmAction} title={`Chuyển trạng thái sang ${confirmAction}?`} description="Thao tác được khóa bằng state version và ghi đầy đủ vào audit log." confirmLabel="Xác nhận chuyển" confirmDisabled={!!busy || !reason.trim()} onConfirm={() => transition(confirmAction)} onClose={() => setConfirmAction(null)}><Field label="Lý do audit"><textarea className={inputClass} rows="3" value={reason} onChange={(event) => setReason(event.target.value)} /></Field></ConfirmDialog>
      <ConfirmDialog open={!!payoutPreview} title="Xác nhận payout Tournament" description={`Sẽ cộng ${payoutPreview?.totals?.coins || 0} Coin cho ${payoutPreview?.rows?.length || 0} người.`} confirmLabel="Thực hiện payout" confirmDisabled={!!busy || confirmationUsername.trim() !== adminUsername} onConfirm={executePayout} onClose={() => { setPayoutPreview(null); setConfirmationUsername(''); }}><Field label={`Nhập username để xác nhận: ${adminUsername}`}><input className={inputClass} value={confirmationUsername} onChange={(event) => setConfirmationUsername(event.target.value)} autoComplete="off" /></Field></ConfirmDialog>
      <ConfirmDialog open={!!refundPreview} title="Xác nhận retry refund" description={`Sẽ hoàn ${refundPreview?.totalCoins || 0} Coin cho ${refundPreview?.recipients || 0} người còn entry chưa hoàn.`} confirmLabel="Retry refund" onConfirm={retryRefund} onClose={() => setRefundPreview(null)} />
    </div>
  );
}

function CreateTournamentForm({ form, setForm, onSubmit, busy }) {
  const updateReward = (index, field, value) => setForm({ ...form, cosmeticRewards: form.cosmeticRewards.map((reward, rewardIndex) => rewardIndex === index ? { ...reward, [field]: value } : reward) });
  return <AdminCard className="p-4"><h3 className="font-sans text-base font-semibold">Tạo Tournament v1</h3><form onSubmit={onSubmit} className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4"><Field label="Tên giải"><input className={inputClass} value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /></Field><Field label="Mở đăng ký"><input className={inputClass} type="datetime-local" value={form.registrationOpensAt} onChange={(event) => setForm({ ...form, registrationOpensAt: event.target.value })} /></Field><Field label="Bắt đầu"><input className={inputClass} type="datetime-local" value={form.startTime} onChange={(event) => setForm({ ...form, startTime: event.target.value })} /></Field><Field label="Đóng đăng ký"><input className={inputClass} type="datetime-local" value={form.registrationClosesAt} onChange={(event) => setForm({ ...form, registrationClosesAt: event.target.value })} /></Field><Field label="Format"><input className={inputClass} value="8 người · 2 bảng · Chung kết" readOnly /></Field><Field label="Entry fee (Coin)"><input className={inputClass} type="number" min="0" value={form.entryFee} onChange={(event) => setForm({ ...form, entryFee: event.target.value })} /></Field><Field label="Prize pool (Coin)"><input className={inputClass} type="number" min="0" value={form.prizeCoins} onChange={(event) => setForm({ ...form, prizeCoins: event.target.value })} /></Field>{form.cosmeticRewards.map((reward, index) => <Field key={reward.rank} label={`Cosmetic hạng ${reward.rank}`}><div className="flex gap-2"><select className={`${inputClass} w-36`} value={reward.type} onChange={(event) => updateReward(index, 'type', event.target.value)}><option value="skin">Skin</option><option value="emote">Emote</option><option value="avatar_frame">Avatar frame</option></select><input className={inputClass} value={reward.itemId} onChange={(event) => updateReward(index, 'itemId', event.target.value)} placeholder="Item ID" /></div></Field>)}<Field label="Mô tả"><input className={inputClass} value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} /></Field><Field label="Lý do audit"><input className={inputClass} value={form.reason} onChange={(event) => setForm({ ...form, reason: event.target.value })} /></Field><Button type="submit" variant="primary" disabled={!!busy} className="md:col-span-2 xl:col-span-4">Tạo Tournament</Button></form></AdminCard>;
}

function TournamentListItem({ item, selected, onClick }) {
  return <button type="button" onClick={onClick} className={`w-full border p-3 text-left transition focus:outline-none focus:ring-2 focus:ring-[var(--admin-focus)] ${selected ? 'border-[var(--admin-border)] bg-[var(--admin-accent-soft)]' : 'border-[var(--admin-border)] bg-[var(--admin-surface)] hover:bg-[var(--admin-surface-muted)]'}`}><div className="flex items-start justify-between gap-2"><strong className="font-sans text-sm">{item.name}</strong><StatusBadge tone={tournamentStatusTone(item.status)}>{item.status}</StatusBadge></div><p className="mt-2 text-xs font-bold text-[var(--admin-text-muted)]">{item.registeredCount || 0}/{item.maxParticipants || 8} người · {item.entryFee} Coin</p><p className="mt-1 text-xs font-semibold text-[var(--admin-text-muted)]">{formatDate(item.startTime)}</p></button>;
}

function TournamentDetail({ detail, auditLogs, canWrite, canOverride, canRefund, canPayout, reason, setReason, participantId, setParticipantId, registerParticipant, overrideScore, setConfirmAction, previewPayout, previewRefund, retryRefund, busy }) {
  const { tournament, participants = [] } = detail;
  return <div className="grid gap-5"><AdminCard className="p-4"><div className="flex flex-wrap items-start justify-between gap-3"><div><h3 className="font-sans text-xl font-semibold">{tournament.name}</h3><p className="mt-1 text-sm font-semibold text-[var(--admin-text-muted)]">{tournament.description || 'Không có mô tả'}</p></div><StatusBadge tone={tournamentStatusTone(tournament.status)}>{tournament.status}</StatusBadge></div><div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">{[['Người chơi', `${tournament.registeredCount || 0}/8`], ['Entry', `${tournament.entryFee} Coin`], ['Prize', `${tournament.prizePool?.coins || 0} Coin`], ['State', tournament.stateVersion]].map(([label, value]) => <div key={label} className="border border-[var(--admin-border)] bg-[var(--admin-surface-muted)] p-3"><p className="text-xs font-semibold uppercase text-[var(--admin-text-muted)]">{label}</p><p className="mt-1 font-mono font-semibold">{value}</p></div>)}</div><p className="mt-3 text-sm font-bold">Bắt đầu: {formatDate(tournament.startTime)} · Đóng đăng ký: {formatDate(tournament.registrationClosesAt)}</p><div className="mt-4 flex flex-wrap gap-2"><StatusBadge tone={tournament.payoutState === 'completed' ? 'success' : tournament.payoutState === 'failed' ? 'danger' : 'warning'}>Payout: {tournament.payoutState}</StatusBadge><StatusBadge tone={tournament.refundState === 'completed' ? 'success' : tournament.refundState === 'failed' ? 'danger' : 'warning'}>Refund: {tournament.refundState}</StatusBadge></div>{(canWrite || canRefund || canPayout || canOverride) && <div className="mt-4 grid gap-3 border-t border-[var(--admin-border)] pt-4"><Field label="Lý do audit"><input className={inputClass} value={reason} onChange={(event) => setReason(event.target.value)} /></Field><div className="flex flex-wrap gap-2">{canWrite && nextTransitions(tournament.status).map((status) => <Button key={status} variant={status === 'cancelled' ? 'danger' : 'primary'} onClick={() => setConfirmAction(status)} disabled={!!busy}>Chuyển {status}</Button>)}{canPayout && tournament.status === 'completed' && tournament.payoutState !== 'completed' && <Button variant="success" onClick={previewPayout} disabled={!!busy}>Preview payout</Button>}{canRefund && tournament.status === 'cancelled' && <><Button onClick={previewRefund} disabled={!!busy}>Preview refund</Button><Button variant="danger" onClick={retryRefund} disabled={!!busy || tournament.refundState === 'completed'}>Retry refund</Button></>}</div></div>}</AdminCard>{canWrite && tournament.status === 'registration' && <AdminCard className="p-4"><form onSubmit={registerParticipant} className="flex flex-col gap-3 md:flex-row md:items-end"><Field label="Đăng ký Player ID"><input className={inputClass} value={participantId} onChange={(event) => setParticipantId(event.target.value)} placeholder="Mongo ObjectId" /></Field><Button type="submit" variant="primary" disabled={!!busy}>Đăng ký và thu phí</Button></form></AdminCard>}<AdminCard className="p-4"><h3 className="font-sans font-semibold">Người tham gia</h3>{participants.length === 0 ? <EmptyState title="Chưa có người đăng ký" /> : <div className="mt-3 overflow-auto"><table className="w-full min-w-[680px] border-collapse text-sm"><thead><tr className="bg-black text-left text-white"><th className="p-3">Người chơi</th><th className="p-3">Thanh toán</th><th className="p-3">Điểm</th><th className="p-3">Hạng</th><th className="p-3">Payout</th></tr></thead><tbody>{participants.map((participant) => <ParticipantRow key={participant._id} participant={participant} active={tournament.status === 'active'} canOverride={canOverride} overrideScore={overrideScore} />)}</tbody></table></div>}</AdminCard><BracketPanel bracket={tournament.bracket} /><AdminCard className="p-4"><h3 className="font-sans font-semibold">Audit timeline</h3>{auditLogs.length ? <div className="mt-3 grid gap-2">{auditLogs.map((log) => <div key={log._id} className="border-l border-[var(--admin-accent)] pl-3 text-sm"><strong>{log.action}</strong><p className="text-xs text-[var(--admin-text-muted)]">{formatDate(log.createdAt)} · {log.actorUsername || log.adminId} · {log.reason}</p></div>)}</div> : <EmptyState title="Chưa có audit log" description="Các thao tác Tournament sẽ hiện tại đây." />}</AdminCard></div>;
}

function ParticipantRow({ participant, active, canOverride, overrideScore }) {
  const [score, setScore] = useState(participant.score || 0);
  useEffect(() => setScore(participant.score || 0), [participant.score]);
  return <tr className="border-b border-[var(--admin-border)] odd:bg-[var(--admin-surface)] even:bg-[var(--admin-surface-muted)]"><td className="p-3"><strong>{participant.userId?.username || 'Unknown'}</strong><p className="font-mono text-xs text-[var(--admin-text-muted)]">{participant.userId?._id || participant.userId}</p></td><td className="p-3"><StatusBadge tone={participant.paymentStatus === 'paid' ? 'success' : 'danger'}>{participant.paymentStatus}</StatusBadge><p className="mt-1 text-xs font-bold">{participant.entryFeePaid} Coin</p></td><td className="p-3">{active && canOverride ? <div className="flex gap-2"><input aria-label="Điểm override" className={`${inputClass} w-24`} type="number" min="0" value={score} onChange={(event) => setScore(event.target.value)} /><Button className="min-h-8 px-2 py-1" onClick={() => overrideScore(participant, score)}>Override</Button></div> : <span className="font-mono font-semibold">{participant.score || 0}</span>}</td><td className="p-3 font-mono font-semibold">{participant.finalRank || '—'}</td><td className="p-3"><StatusBadge tone={participant.payoutStatus === 'completed' ? 'success' : participant.payoutStatus === 'failed' ? 'danger' : 'warning'}>{participant.payoutStatus}</StatusBadge></td></tr>;
}

function BracketPanel({ bracket }) {
  if (!bracket?.rounds?.length) return <AdminCard className="p-4"><EmptyState title="Bracket chưa được tạo" description="Bracket được tạo tự động khi đủ 8 người và giải chuyển sang active." /></AdminCard>;
  return <AdminCard className="p-4"><h3 className="font-sans font-semibold">Lịch thi đấu tự động</h3><div className="mt-4 grid gap-4 md:grid-cols-2">{bracket.rounds.flatMap((round) => round.matches.map((match) => <article key={match.id} className="border border-[var(--admin-border)] bg-[var(--admin-surface-muted)] p-3"><div className="flex justify-between gap-2"><p className="font-mono text-xs font-semibold uppercase">{round.name} · {match.id}</p><StatusBadge tone={match.status === 'completed' ? 'success' : match.status === 'pending' ? 'warning' : 'neutral'}>{match.status}</StatusBadge></div>{match.roomCode && <p className="mt-1 font-mono text-xs">Room: {match.roomCode}</p>}<div className="mt-2 grid gap-2">{(match.participants || []).map((person) => { const result = match.result?.find((row) => row.participantId === person.participantId); return <div key={person.participantId} className="border border-[var(--admin-border)] bg-[var(--admin-surface)] p-2 text-sm font-bold">{person.username}{result ? ` · #${result.placement} · ${result.points}đ${result.forfeit ? ' · xử thua' : ''}` : ''}</div>; })}</div></article>))}</div></AdminCard>;
}
