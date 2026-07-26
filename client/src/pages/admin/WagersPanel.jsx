import React, { useCallback, useEffect, useState } from 'react';
import { AdminCard, Alert, Button, EmptyState, Field, Pagination, SectionHeader, SkeletonBlock, StatusBadge, inputClass } from './ui.jsx';
import { createAdminOperationRequestId } from './adminMutation.js';
import { useAdminApi } from './useAdminApi.js';

function wagerTone(state) {
  if (state === 'settled' || state === 'refunded') return 'success';
  if (state === 'review_required') return 'danger';
  return 'warning';
}

export default function WagersPanel({ permissions }) {
  const { request } = useAdminApi();
  const canResolve = permissions.includes('wagers.resolve');
  const [state, setState] = useState('');
  const [items, setItems] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [selected, setSelected] = useState(null);
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState(null);

  const load = useCallback(async (page = 1) => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: '20' });
    if (state) params.set('state', state);
    const response = await request(`/api/admin/wagers?${params}`);
    setLoading(false);
    if (!response.ok) return setMessage({ tone: 'danger', text: response.data?.error?.message || 'Không thể tải wager ledger.' });
    setItems(response.data.data.items || []);
    setPagination(response.data.data.pagination || { page, pages: 1, total: 0 });
  }, [request, state]);

  useEffect(() => { load(1); }, [load]);

  const inspect = async (id) => {
    const response = await request(`/api/admin/wagers/${id}`);
    if (!response.ok) return setMessage({ tone: 'danger', text: response.data?.error?.message || 'Không thể tải chi tiết wager.' });
    setSelected(response.data.data);
    setReason('');
  };

  const refund = async () => {
    if (!reason.trim()) return setMessage({ tone: 'danger', text: 'Lý do hoàn tiền là bắt buộc.' });
    setBusy(true);
    const response = await request(`/api/admin/wagers/${selected._id}/refund`, {
      method: 'POST',
      body: JSON.stringify({ reason: reason.trim(), requestId: createAdminOperationRequestId() }),
    });
    setBusy(false);
    if (!response.ok) return setMessage({ tone: 'danger', text: response.data?.error?.message || response.data?.message || 'Hoàn tiền thất bại.' });
    setSelected(response.data.data);
    setMessage({ tone: 'success', text: 'Đã hoàn toàn bộ Coin đã khóa và ghi audit.' });
    await load(pagination.page);
  };

  return <div className="flex flex-col gap-5">
    <SectionHeader title="Wager Ledger" description="Theo dõi Coin đã khóa, payout và các phòng cần xử lý thủ công." actions={<Button onClick={() => load(pagination.page)}>Làm mới</Button>} />
    {message && <Alert tone={message.tone}>{message.text}</Alert>}
    <AdminCard className="p-4">
      <div className="max-w-xs"><Field label="Trạng thái"><select className={inputClass} value={state} onChange={(event) => setState(event.target.value)}><option value="">Tất cả</option>{['created', 'locked', 'settled', 'refunded', 'review_required'].map((value) => <option key={value} value={value}>{value}</option>)}</select></Field></div>
      <p className="mt-3 text-xs font-semibold uppercase text-[var(--admin-text-muted)]">{pagination.total} wager</p>
      {loading ? <div className="mt-3"><SkeletonBlock rows={5} /></div> : items.length === 0 ? <div className="mt-3"><EmptyState title="Không có wager phù hợp" /></div> : <div className="mt-3 overflow-auto"><table className="w-full min-w-[720px] text-sm"><thead><tr className="bg-black text-left text-white"><th className="p-3">Phòng / reference</th><th className="p-3">Stake</th><th className="p-3">Người</th><th className="p-3">Trạng thái</th><th className="p-3">Tạo lúc</th><th className="p-3" /></tr></thead><tbody>{items.map((item) => <tr key={item._id} className="border-b border-[var(--admin-border)]"><td className="p-3"><strong>{item.roomCode}</strong><p className="font-mono text-xs text-[var(--admin-text-muted)]">{item.reference}</p></td><td className="p-3 font-mono">{item.stake} Coin</td><td className="p-3 font-mono">{item.participants?.length || 0}</td><td className="p-3"><StatusBadge tone={wagerTone(item.state)}>{item.state}</StatusBadge></td><td className="p-3">{new Date(item.createdAt).toLocaleString('vi-VN')}</td><td className="p-3"><Button onClick={() => inspect(item._id)}>Chi tiết</Button></td></tr>)}</tbody></table></div>}
      <div className="mt-4"><Pagination page={pagination.page} totalPages={pagination.pages} onPageChange={load} /></div>
    </AdminCard>
    {selected && <AdminCard className="p-4"><div className="flex flex-wrap items-center justify-between gap-3"><div><h3 className="font-sans text-lg font-semibold">Wager {selected.roomCode}</h3><p className="font-mono text-xs text-[var(--admin-text-muted)]">{selected.reference}</p></div><StatusBadge tone={wagerTone(selected.state)}>{selected.state}</StatusBadge></div><div className="mt-4 overflow-auto"><table className="w-full min-w-[520px] text-sm"><thead><tr className="text-left"><th className="p-2">Người chơi</th><th className="p-2">Đã khóa</th><th className="p-2">Payout</th><th className="p-2">Vị trí</th></tr></thead><tbody>{selected.participants?.map((participant) => <tr key={participant.userId?._id || participant.userId} className="border-t border-[var(--admin-border)]"><td className="p-2">{participant.userId?.username || participant.userId}</td><td className="p-2">{participant.lockedCoins} Coin</td><td className="p-2">{participant.payoutCoins || 0} Coin</td><td className="p-2">{participant.placement || '—'}</td></tr>)}</tbody></table></div>{canResolve && ['locked', 'review_required'].includes(selected.state) && <div className="mt-4 grid gap-3 border-t border-[var(--admin-border)] pt-4"><Alert tone="warning">Hoàn tiền là thao tác toàn phần và idempotent; không thể hoàn riêng một người.</Alert><Field label="Lý do audit"><textarea className={inputClass} rows="3" value={reason} onChange={(event) => setReason(event.target.value)} /></Field><Button variant="danger" disabled={busy || !reason.trim()} onClick={refund}>Hoàn toàn bộ Coin</Button></div>}</AdminCard>}
  </div>;
}
