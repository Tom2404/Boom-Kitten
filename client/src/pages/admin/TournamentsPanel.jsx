import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useAdminApi } from './useAdminApi.js';
import { createAdminOperationRequestId, buildRoutineAdminPayload } from './adminMutation.js';
import { buildTournamentCreatePayload, buildTournamentPayoutPayload, buildTournamentTransitionPayload, tournamentStatusTone } from './adminTournament.js';
import { AdminCard, Alert, Button, ConfirmDialog, EmptyState, Field, Pagination, SectionHeader, SkeletonBlock, StatusBadge, inputClass } from './ui.jsx';

const initialForm = { name: '', description: '', entryFee: 50, minEloRequired: 1000, maxParticipants: 16, prizeCoins: 500, prizeGems: 10, startTime: '', registrationClosesAt: '', reason: '' };

function errorText(response, fallback) {
  return response.data?.error?.message || response.data?.message || response.error || fallback;
}

function formatDate(value) {
  if (!value) return '—';
  return new Intl.DateTimeFormat('vi-VN', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
}

export default function TournamentsPanel({ permissions, adminUsername }) {
  const { request } = useAdminApi();
  const canWrite = permissions.includes('tournaments.write');
  const canPayout = permissions.includes('tournaments.payout');
  const [items, setItems] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [filters, setFilters] = useState({ search: '', status: '' });
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [form, setForm] = useState(initialForm);
  const [participantId, setParticipantId] = useState('');
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState('');
  const [payoutPreview, setPayoutPreview] = useState(null);
  const [confirmationUsername, setConfirmationUsername] = useState('');
  const [confirmAction, setConfirmAction] = useState(null);

  const loadList = useCallback(async (page = 1) => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: '20' });
    if (filters.search.trim()) params.set('search', filters.search.trim());
    if (filters.status) params.set('status', filters.status);
    const response = await request(`/api/admin/tournaments?${params}`);
    setLoading(false);
    if (!response.ok) return setMessage({ tone: 'danger', text: errorText(response, 'Không thể tải giải đấu.') });
    setItems(response.data.data.items || []);
    setPagination(response.data.data.pagination || { page, pages: 1, total: 0 });
  }, [filters.search, filters.status, request]);

  const loadDetail = useCallback(async (id, updateUrl = true) => {
    setDetailLoading(true);
    const response = await request(`/api/admin/tournaments/${id}`);
    setDetailLoading(false);
    if (!response.ok) return setMessage({ tone: 'danger', text: errorText(response, 'Không thể tải chi tiết giải đấu.') });
    setDetail(response.data.data);
    setPayoutPreview(null);
    if (updateUrl) {
      const url = new URL(window.location.href);
      url.searchParams.set('tournamentId', id);
      window.history.replaceState({}, '', url);
    }
  }, [request]);

  useEffect(() => { loadList(1); }, [loadList]);
  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get('tournamentId');
    if (id) loadDetail(id, false);
  }, [loadDetail]);

  const mutate = async (endpoint, body, success, method = 'POST') => {
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
    if (!form.name.trim() || !form.startTime || !form.reason.trim()) return setMessage({ tone: 'danger', text: 'Tên, thời gian bắt đầu và lý do audit là bắt buộc.' });
    let payload;
    try { payload = buildTournamentCreatePayload(form, createAdminOperationRequestId()); }
    catch { return setMessage({ tone: 'danger', text: 'Thời gian giải đấu không hợp lệ.' }); }
    const created = await mutate('/api/admin/tournaments', payload, 'Đã tạo giải đấu.', 'POST');
    if (created) { setForm(initialForm); await loadDetail(created._id); }
  };

  const registerParticipant = async (event) => {
    event.preventDefault();
    if (!participantId.trim() || !reason.trim()) return setMessage({ tone: 'danger', text: 'Player ID và lý do audit là bắt buộc.' });
    const body = buildRoutineAdminPayload({ userId: participantId.trim(), reason: reason.trim() }, createAdminOperationRequestId());
    const result = await mutate(`/api/admin/tournaments/${detail.tournament._id}/participants`, body, 'Đã đăng ký người chơi và thu entry fee.');
    if (result) setParticipantId('');
  };

  const updateScore = async (participant, score) => {
    if (!reason.trim()) return setMessage({ tone: 'danger', text: 'Nhập lý do audit trước khi cập nhật điểm.' });
    const body = buildRoutineAdminPayload({ score: Number(score), expectedVersion: participant.__v, reason: reason.trim() }, createAdminOperationRequestId());
    await mutate(`/api/admin/tournaments/${detail.tournament._id}/participants/${participant._id}`, body, 'Đã cập nhật điểm.', 'PATCH');
  };

  const transition = async (nextStatus) => {
    if (!reason.trim()) return setMessage({ tone: 'danger', text: 'Lý do audit là bắt buộc.' });
    const body = buildTournamentTransitionPayload({ nextStatus, expectedVersion: detail.tournament.stateVersion, reason, requestId: createAdminOperationRequestId() });
    const result = await mutate(`/api/admin/tournaments/${detail.tournament._id}/transitions`, body, `Đã chuyển giải đấu sang ${nextStatus}.`);
    if (result) setConfirmAction(null);
  };

  const previewPayout = async () => {
    if (!reason.trim()) return setMessage({ tone: 'danger', text: 'Lý do audit là bắt buộc.' });
    const body = buildRoutineAdminPayload({ expectedVersion: detail.tournament.stateVersion, reason: reason.trim() }, createAdminOperationRequestId());
    const result = await mutate(`/api/admin/tournaments/${detail.tournament._id}/payouts/preview`, body, 'Đã khóa preview payout trong 15 phút.');
    if (result) setPayoutPreview(result);
  };

  const executePayout = async () => {
    if (confirmationUsername.trim() !== adminUsername) return;
    const body = buildTournamentPayoutPayload({ previewToken: payoutPreview.previewToken, expectedVersion: payoutPreview.stateVersion, reason, confirmationUsername, requestId: createAdminOperationRequestId() });
    const result = await mutate(`/api/admin/tournaments/${detail.tournament._id}/payouts`, body, 'Đã xử lý payout giải đấu.');
    if (result) { setPayoutPreview(null); setConfirmationUsername(''); }
  };

  const nextTransitions = useMemo(() => {
    const status = detail?.tournament?.status;
    if (status === 'registration') return ['active', 'cancelled'];
    if (status === 'active') return ['completed', 'cancelled'];
    return [];
  }, [detail]);

  return (
    <div className="flex flex-col gap-5">
      <SectionHeader title="Tournament Operations" description="Quản lý đăng ký, entry fee, bracket, trạng thái và payout có preview, optimistic locking và audit." actions={<Button onClick={() => loadList(pagination.page)}>Làm mới</Button>} />
      {message && <Alert tone={message.tone}>{message.text}</Alert>}
      {!canWrite && <Alert tone="info">Chế độ chỉ đọc: bạn có thể theo dõi giải đấu, người tham gia và bracket.</Alert>}

      {canWrite && <AdminCard className="p-4">
        <h3 className="font-sans text-base font-semibold">Tạo giải đấu</h3>
        <form onSubmit={createTournament} className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <Field label="Tên giải"><input className={inputClass} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
          <Field label="Bắt đầu"><input className={inputClass} type="datetime-local" value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })} /></Field>
          <Field label="Đóng đăng ký"><input className={inputClass} type="datetime-local" value={form.registrationClosesAt} onChange={(e) => setForm({ ...form, registrationClosesAt: e.target.value })} /></Field>
          <Field label="Sức chứa"><input className={inputClass} type="number" min="2" max="128" value={form.maxParticipants} onChange={(e) => setForm({ ...form, maxParticipants: e.target.value })} /></Field>
          <Field label="Entry fee (coin)"><input className={inputClass} type="number" min="0" value={form.entryFee} onChange={(e) => setForm({ ...form, entryFee: e.target.value })} /></Field>
          <Field label="ELO tối thiểu"><input className={inputClass} type="number" min="0" value={form.minEloRequired} onChange={(e) => setForm({ ...form, minEloRequired: e.target.value })} /></Field>
          <Field label="Prize coin"><input className={inputClass} type="number" min="0" value={form.prizeCoins} onChange={(e) => setForm({ ...form, prizeCoins: e.target.value })} /></Field>
          <Field label="Prize gem"><input className={inputClass} type="number" min="0" value={form.prizeGems} onChange={(e) => setForm({ ...form, prizeGems: e.target.value })} /></Field>
          <div className="md:col-span-2"><Field label="Mô tả"><input className={inputClass} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></Field></div>
          <div className="md:col-span-2"><Field label="Lý do audit"><input className={inputClass} value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} placeholder="Ví dụ: Lịch giải tháng 7" /></Field></div>
          <Button type="submit" variant="primary" disabled={!!busy} className="md:col-span-2 xl:col-span-4">Tạo giải đấu</Button>
        </form>
      </AdminCard>}

      <div className="grid gap-5 xl:grid-cols-[minmax(320px,0.75fr)_minmax(0,1.5fr)]">
        <AdminCard className="p-4">
          <div className="grid gap-3 sm:grid-cols-[1fr_160px]">
            <Field label="Tìm kiếm"><input className={inputClass} value={filters.search} onChange={(e) => setFilters({ ...filters, search: e.target.value })} placeholder="Tên giải đấu" /></Field>
            <Field label="Trạng thái"><select className={inputClass} value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })}><option value="">Tất cả</option><option value="registration">Registration</option><option value="active">Active</option><option value="completed">Completed</option><option value="cancelled">Cancelled</option></select></Field>
          </div>
          <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-[var(--admin-text-muted)]">{pagination.total} giải đấu</p>
          <div className="mt-3 grid gap-3">
            {loading ? <SkeletonBlock rows={4} /> : items.length === 0 ? <EmptyState title="Chưa có giải đấu" description="Điều chỉnh bộ lọc hoặc tạo giải đấu đầu tiên." /> : items.map((item) => (
              <button key={item._id} type="button" onClick={() => loadDetail(item._id)} className={`border p-3 text-left transition focus:outline-none focus:ring-2 focus:ring-[var(--admin-focus)] ${detail?.tournament?._id === item._id ? 'border-[var(--admin-border)] bg-[var(--admin-accent-soft)] shadow-[0_1px_2px_rgba(32,35,31,0.03)]' : 'border-[var(--admin-border)] bg-[var(--admin-surface)] hover:bg-[var(--admin-surface-muted)]'}`}>
                <div className="flex items-start justify-between gap-2"><strong className="font-sans text-sm">{item.name}</strong><StatusBadge tone={tournamentStatusTone(item.status)}>{item.status}</StatusBadge></div>
                <p className="mt-2 text-xs font-bold text-[var(--admin-text-muted)]">{item.registeredCount}/{item.maxParticipants} người · {item.entryFee} coin</p>
                <p className="mt-1 text-xs font-semibold text-[var(--admin-text-muted)]">{formatDate(item.startTime)}</p>
              </button>
            ))}
          </div>
          <div className="mt-4"><Pagination page={pagination.page} totalPages={pagination.pages} onPageChange={loadList} /></div>
        </AdminCard>

        <div className="min-w-0">
          {detailLoading ? <AdminCard className="p-4"><SkeletonBlock rows={6} /></AdminCard> : !detail ? <AdminCard className="p-4"><EmptyState title="Chọn một giải đấu" description="Chi tiết đăng ký, bracket và payout sẽ hiển thị tại đây." /></AdminCard> : (
            <TournamentDetail detail={detail} canWrite={canWrite} canPayout={canPayout} reason={reason} setReason={setReason} participantId={participantId} setParticipantId={setParticipantId} registerParticipant={registerParticipant} updateScore={updateScore} nextTransitions={nextTransitions} setConfirmAction={setConfirmAction} previewPayout={previewPayout} payoutPreview={payoutPreview} busy={busy} />
          )}
        </div>
      </div>

      <ConfirmDialog open={!!confirmAction} title={`Chuyển trạng thái sang ${confirmAction}?`} description="State transition được khóa theo phiên bản hiện tại và ghi đầy đủ vào audit log." confirmLabel="Xác nhận chuyển" confirmDisabled={!!busy || !reason.trim()} onConfirm={() => transition(confirmAction)} onClose={() => setConfirmAction(null)}><Field label="Lý do audit"><textarea className={inputClass} rows="3" value={reason} onChange={(e) => setReason(e.target.value)} /></Field></ConfirmDialog>
      <ConfirmDialog open={!!payoutPreview} title="Xác nhận payout giải đấu" description={`Sẽ cộng ${payoutPreview?.totals?.coins || 0} coin và ${payoutPreview?.totals?.gems || 0} gem cho ${payoutPreview?.rows?.length || 0} người. Preview hết hạn lúc ${formatDate(payoutPreview?.expiresAt)}.`} confirmLabel="Thực hiện payout" confirmDisabled={!!busy || confirmationUsername.trim() !== adminUsername} onConfirm={executePayout} onClose={() => { setPayoutPreview(null); setConfirmationUsername(''); }}>
        <div className="grid gap-3"><Field label={`Nhập username để xác nhận: ${adminUsername}`}><input className={inputClass} value={confirmationUsername} onChange={(e) => setConfirmationUsername(e.target.value)} autoComplete="off" /></Field><div className="max-h-40 overflow-auto border border-[var(--admin-border)] bg-[var(--admin-surface)] p-2 text-sm">{payoutPreview?.rows?.map((row) => <p key={row.participantId} className="font-mono">#{row.rank} {row.username}: +{row.coins} coin, +{row.gems} gem</p>)}</div></div>
      </ConfirmDialog>
    </div>
  );
}

function TournamentDetail({ detail, canWrite, canPayout, reason, setReason, participantId, setParticipantId, registerParticipant, updateScore, nextTransitions, setConfirmAction, previewPayout, payoutPreview, busy }) {
  const { tournament, participants } = detail;
  return <div className="grid gap-5">
    <AdminCard className="p-4">
      <div className="flex flex-wrap items-start justify-between gap-3"><div><h3 className="font-sans text-xl font-semibold">{tournament.name}</h3><p className="mt-1 text-sm font-semibold text-[var(--admin-text-muted)]">{tournament.description || 'Không có mô tả'}</p></div><StatusBadge tone={tournamentStatusTone(tournament.status)}>{tournament.status}</StatusBadge></div>
      <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">{[['Người chơi', `${tournament.registeredCount}/${tournament.maxParticipants}`], ['Entry fee', `${tournament.entryFee} coin`], ['Prize', `${tournament.prizePool?.coins || 0} coin · ${tournament.prizePool?.gems || 0} gem`], ['State version', tournament.stateVersion]].map(([label, value]) => <div key={label} className="rounded-lg border border-[var(--admin-border)] bg-[var(--admin-surface-muted)] p-3"><p className="text-xs font-semibold uppercase text-[var(--admin-text-muted)]">{label}</p><p className="mt-1 font-mono font-semibold">{value}</p></div>)}</div>
      <p className="mt-3 text-sm font-bold">Bắt đầu: {formatDate(tournament.startTime)} · Đóng đăng ký: {formatDate(tournament.registrationClosesAt)}</p>
      {canWrite && <div className="mt-4 grid gap-3 border-t border-[var(--admin-border)] pt-4"><Field label="Lý do audit cho thao tác bên dưới"><input className={inputClass} value={reason} onChange={(e) => setReason(e.target.value)} /></Field><div className="flex flex-wrap gap-2">{nextTransitions.map((status) => <Button key={status} variant={status === 'cancelled' ? 'danger' : 'primary'} onClick={() => setConfirmAction(status)} disabled={!!busy}>Chuyển {status}</Button>)}{canPayout && tournament.status === 'completed' && tournament.payoutState !== 'completed' && <Button variant="success" onClick={previewPayout} disabled={!!busy || !!payoutPreview}>Preview payout</Button>} {tournament.payoutState && <StatusBadge tone={tournament.payoutState === 'completed' ? 'success' : tournament.payoutState === 'failed' ? 'danger' : 'warning'}>Payout: {tournament.payoutState}</StatusBadge>}</div></div>}
    </AdminCard>

    {canWrite && tournament.status === 'registration' && <AdminCard className="p-4"><form onSubmit={registerParticipant} className="flex flex-col gap-3 md:flex-row md:items-end"><Field label="Đăng ký Player ID"><input className={inputClass} value={participantId} onChange={(e) => setParticipantId(e.target.value)} placeholder="Mongo ObjectId" /></Field><Button type="submit" variant="primary" disabled={!!busy}>Đăng ký & thu phí</Button></form></AdminCard>}

    <AdminCard className="p-4"><h3 className="font-sans font-semibold">Người tham gia</h3>{participants.length === 0 ? <div className="mt-3"><EmptyState title="Chưa có người đăng ký" /></div> : <div className="mt-3 overflow-auto"><table className="w-full min-w-[680px] border-collapse text-sm"><thead><tr className="bg-black text-left text-white"><th className="p-3">Người chơi</th><th className="p-3">ELO</th><th className="p-3">Thanh toán</th><th className="p-3">Điểm</th><th className="p-3">Hạng</th><th className="p-3">Payout</th></tr></thead><tbody>{participants.map((participant) => <ParticipantRow key={participant._id} participant={participant} active={tournament.status === 'active'} canWrite={canWrite} updateScore={updateScore} />)}</tbody></table></div>}</AdminCard>

    <AdminCard className="p-4"><h3 className="font-sans font-semibold">Bracket</h3>{!tournament.bracket?.rounds?.length ? <div className="mt-3"><EmptyState title="Bracket chưa được tạo" description="Bracket được seed tự động khi chuyển từ registration sang active." /></div> : <div className="mt-4 grid gap-4 md:grid-cols-2">{tournament.bracket.rounds.flatMap((round) => round.matches.map((match) => <article key={match.id} className="rounded-lg border border-[var(--admin-border)] bg-[var(--admin-surface-muted)] p-3"><p className="font-mono text-xs font-semibold uppercase">{round.name} · {match.id}</p><div className="mt-2 grid gap-2">{match.participants.map((person) => <div key={person.participantId} className={`rounded-lg border border-[var(--admin-border)] p-2 font-bold ${match.winnerParticipantId === person.participantId ? 'bg-[var(--admin-success-bg)]' : 'bg-[var(--admin-surface)]'}`}>{person.username}</div>)}{match.bye && <StatusBadge tone="warning">Bye</StatusBadge>}</div></article>))}</div>}</AdminCard>
  </div>;
}

function ParticipantRow({ participant, active, canWrite, updateScore }) {
  const [score, setScore] = useState(participant.score || 0);
  useEffect(() => setScore(participant.score || 0), [participant.score]);
  return <tr className="border-b border-[var(--admin-border)] odd:bg-[var(--admin-surface)] even:bg-[var(--admin-surface-muted)]"><td className="p-3"><strong>{participant.userId?.username || 'Unknown'}</strong><p className="font-mono text-xs text-[var(--admin-text-muted)]">{participant.userId?._id || participant.userId}</p></td><td className="p-3 font-mono">{participant.userId?.eloPoints ?? '—'}</td><td className="p-3"><StatusBadge tone={participant.paymentStatus === 'paid' ? 'success' : 'danger'}>{participant.paymentStatus}</StatusBadge><p className="mt-1 text-xs font-bold">{participant.entryFeePaid} coin</p></td><td className="p-3">{active && canWrite ? <div className="flex gap-2"><input className={`${inputClass} w-24`} type="number" min="0" value={score} onChange={(e) => setScore(e.target.value)} /><Button className="min-h-8 px-2 py-1" onClick={() => updateScore(participant, score)}>Lưu</Button></div> : <span className="font-mono font-semibold">{participant.score}</span>}</td><td className="p-3 font-mono font-semibold">{participant.finalRank || '—'}</td><td className="p-3"><StatusBadge tone={participant.payoutStatus === 'completed' ? 'success' : participant.payoutStatus === 'failed' ? 'danger' : 'warning'}>{participant.payoutStatus}</StatusBadge></td></tr>;
}
