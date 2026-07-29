import React, { useEffect, useMemo, useState } from 'react';
import { useAdminApi } from './useAdminApi.js';
import { Alert, Button, ConfirmDialog, EmptyState, Field, inputClass, SectionHeader, SkeletonBlock, StatusBadge, Toolbar } from './ui.jsx';
import { formatNumber } from './utils.js';
import { getAdminPanelAccess } from './adminPanelAccess.js';
import { buildDeleteAdminPayload, buildRoutineAdminPayload, createAdminOperationRequestId } from './adminMutation.js';
import { filterQuests, getQuestSummary } from './adminListFilters.js';

const blankQuest = { title: '', description: '', actionType: 'play_game', targetCount: 1, coinReward: 0, isActive: true };
const actionOptions = [
  ['play_game', 'Chơi trận'],
  ['win_game', 'Thắng trận'],
  ['draw_card', 'Rút bài'],
  ['buy_item', 'Mua hàng'],
  ['nope_card', 'Dùng Nope'],
  ['defuse_kitten', 'Gỡ Exploding Kitten'],
  ['steal_card', 'Cướp bài'],
];

export default function QuestsPanel({ permissions = [] }) {
  const { request } = useAdminApi();
  const [quests, setQuests] = useState([]);
  const [form, setForm] = useState(blankQuest);
  const [editingId, setEditingId] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formRequestId, setFormRequestId] = useState(() => createAdminOperationRequestId());
  const [deleteReason, setDeleteReason] = useState('');
  const [deleteRequestId, setDeleteRequestId] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [message, setMessage] = useState({ tone: '', text: '' });
  const [filters, setFilters] = useState({ search: '', actionType: '', status: '' });
  const { canWriteQuests } = getAdminPanelAccess(permissions);
  const summary = useMemo(() => getQuestSummary(quests), [quests]);
  const visibleQuests = useMemo(() => filterQuests(quests, filters), [quests, filters]);
  const filtersActive = Object.values(filters).some(Boolean);

  const loadQuests = async () => {
    setLoading(true);
    const res = await request('/api/admin/quests');
    if (res.ok) setQuests(Array.isArray(res.data) ? res.data : []);
    else setMessage({ tone: 'danger', text: res.data?.message || res.error || 'Không thể tải nhiệm vụ.' });
    setLoading(false);
  };

  useEffect(() => { loadQuests(); }, [request]);

  const resetForm = () => {
    setForm(blankQuest);
    setEditingId(null);
    setFormRequestId(createAdminOperationRequestId());
  };

  const editQuest = (quest) => {
    setEditingId(quest._id);
    setForm({
      title: quest.title || '',
      description: quest.description || '',
      actionType: quest.actionType || 'play_game',
      targetCount: quest.targetCount || 1,
      coinReward: quest.reward?.coins || 0,
      isActive: quest.isActive !== false,
    });
    setFormRequestId(createAdminOperationRequestId());
  };

  const openDeleteDialog = (quest) => {
    setDeleteTarget(quest);
    setDeleteReason('');
    setDeleteRequestId(createAdminOperationRequestId());
  };

  const closeDeleteDialog = () => {
    if (deleting) return;
    setDeleteTarget(null);
    setDeleteReason('');
    setDeleteRequestId(null);
  };

  const submitQuest = async (event) => {
    event.preventDefault();
    if (!form.title || !form.description) return setMessage({ tone: 'danger', text: 'Tiêu đề và mô tả không được để trống.' });
    const payload = {
      title: form.title,
      description: form.description,
      actionType: form.actionType,
      targetCount: Number(form.targetCount),
      reward: { coins: Number(form.coinReward) },
      isActive: form.isActive,
    };
    setSaving(true);
    try {
      const res = await request(editingId ? `/api/admin/quests/${editingId}` : '/api/admin/quests', {
        method: editingId ? 'PUT' : 'POST',
        body: JSON.stringify(buildRoutineAdminPayload(payload, formRequestId)),
      });
      if (res.ok) {
        setMessage({ tone: 'success', text: editingId ? 'Đã cập nhật nhiệm vụ.' : 'Đã tạo nhiệm vụ mới.' });
        resetForm();
        loadQuests();
      } else setMessage({ tone: 'danger', text: res.data?.error?.message || res.data?.message || res.error || 'Không thể lưu nhiệm vụ.' });
    } finally {
      setSaving(false);
    }
  };

  const deleteQuest = async () => {
    if (!deleteTarget) return;
    if (!deleteReason.trim() || !deleteRequestId) return;
    setDeleting(true);
    try {
      const res = await request(`/api/admin/quests/${deleteTarget._id}`, {
        method: 'DELETE',
        body: JSON.stringify(buildDeleteAdminPayload(deleteReason, deleteRequestId)),
      });
      if (res.ok) {
        setMessage({ tone: 'success', text: 'Đã xóa nhiệm vụ.' });
        if (editingId === deleteTarget._id) resetForm();
        setDeleteTarget(null);
        setDeleteReason('');
        setDeleteRequestId(null);
        loadQuests();
      } else setMessage({ tone: 'danger', text: res.data?.error?.message || res.data?.message || 'Không thể xóa nhiệm vụ.' });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="flex flex-col gap-5">
      <SectionHeader title="Nhiệm vụ" description="Tạo và chỉnh sửa nhiệm vụ người chơi, mục tiêu hoàn thành và phần thưởng." />
      {message.text && <Alert tone={message.tone}>{message.text}</Alert>}
      {!canWriteQuests && <Alert tone="info">Chế độ chỉ đọc: bạn có thể xem nhiệm vụ nhưng không thể tạo, sửa hoặc xóa.</Alert>}
      <dl className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {[['Tổng nhiệm vụ', summary.total], ['Hoạt động', summary.active], ['Đang tắt', summary.inactive], ['Ngân sách Coin', summary.rewardCoins]].map(([label, value]) => <div key={label} className="rounded-lg border border-[var(--admin-border)] bg-[var(--admin-surface)] p-3"><dt className="text-xs font-semibold text-[var(--admin-text-muted)]">{label}</dt><dd className="mt-1 font-mono text-xl font-semibold">{formatNumber(value)}</dd></div>)}
      </dl>
      <Toolbar>
        <Field label="Tìm nhiệm vụ"><input className={`${inputClass} md:min-w-56`} type="search" value={filters.search} onChange={(event) => setFilters({ ...filters, search: event.target.value })} placeholder="Tiêu đề nhiệm vụ" /></Field>
        <Field label="Hành động"><select className={inputClass} value={filters.actionType} onChange={(event) => setFilters({ ...filters, actionType: event.target.value })}><option value="">Tất cả</option>{actionOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></Field>
        <Field label="Trạng thái"><select className={inputClass} value={filters.status} onChange={(event) => setFilters({ ...filters, status: event.target.value })}><option value="">Tất cả</option><option value="active">Active</option><option value="inactive">Inactive</option></select></Field>
        <Button type="button" variant="secondary" disabled={!filtersActive} onClick={() => setFilters({ search: '', actionType: '', status: '' })}>Đặt lại</Button>
      </Toolbar>
      <div className={`grid grid-cols-1 gap-5 ${canWriteQuests ? 'xl:grid-cols-[360px_1fr]' : ''}`}>
        {canWriteQuests && <form onSubmit={submitQuest} className="rounded-lg border border-[var(--admin-border)] bg-[var(--admin-surface)] p-4 shadow-[0_1px_2px_rgba(32,35,31,0.03)]">
          <h3 className="font-sans text-base font-semibold text-slate-950">{editingId ? 'Sửa nhiệm vụ' : 'Tạo nhiệm vụ'}</h3>
          <div className="mt-4 grid gap-3">
            <Field label="Tiêu đề"><input className={inputClass} value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} /></Field>
            <Field label="Mô tả"><textarea className={inputClass} rows="3" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} /></Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Loại hành động"><select className={inputClass} value={form.actionType} onChange={(event) => setForm({ ...form, actionType: event.target.value })}>{actionOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></Field>
              <Field label="Mục tiêu"><input className={inputClass} type="number" min="1" value={form.targetCount} onChange={(event) => setForm({ ...form, targetCount: event.target.value })} /></Field>
            </div>
            <Field label="Coin thưởng"><input className={inputClass} type="number" min="0" value={form.coinReward} onChange={(event) => setForm({ ...form, coinReward: event.target.value })} /></Field>
            <Field label="Trạng thái"><select className={inputClass} value={form.isActive ? 'true' : 'false'} onChange={(event) => setForm({ ...form, isActive: event.target.value === 'true' })}><option value="true">Active</option><option value="false">Inactive</option></select></Field>
          </div>
          <div className="mt-4 flex gap-2">
            <Button type="submit" variant="primary" className="flex-1" disabled={saving}>{saving ? 'Đang lưu...' : editingId ? 'Lưu thay đổi' : 'Tạo nhiệm vụ'}</Button>
            {editingId && <Button type="button" variant="secondary" onClick={resetForm} disabled={saving}>Hủy</Button>}
          </div>
        </form>}

        <section>
          {loading ? <SkeletonBlock rows={5} /> : quests.length === 0 ? (
            <EmptyState title="Chưa có nhiệm vụ" description="Tạo nhiệm vụ đầu tiên bằng form bên trái." />
          ) : visibleQuests.length === 0 ? (
            <EmptyState title="Không có nhiệm vụ phù hợp" description="Thử đổi hoặc đặt lại bộ lọc." action={<Button variant="secondary" onClick={() => setFilters({ search: '', actionType: '', status: '' })}>Đặt lại bộ lọc</Button>} />
          ) : (
            <div className="grid gap-3">
              {visibleQuests.map((quest) => (
                <article key={quest._id} className="rounded-lg border border-[var(--admin-border)] bg-[var(--admin-surface)] p-4 shadow-[0_1px_2px_rgba(32,35,31,0.03)]">
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <StatusBadge>{quest.actionType}</StatusBadge>
                        <StatusBadge tone={quest.isActive ? 'success' : 'neutral'}>{quest.isActive ? 'Active' : 'Inactive'}</StatusBadge>
                      </div>
                      <h3 className="mt-2 font-sans font-semibold text-slate-950">{quest.title}</h3>
                      <p className="mt-1 text-sm font-semibold text-slate-500">{quest.description}</p>
                      <p className="mt-2 text-sm font-bold text-slate-700">Mục tiêu: {formatNumber(quest.targetCount)} · Thưởng: {formatNumber(quest.reward?.coins)} Coin</p>
                    </div>
                    {canWriteQuests && <div className="flex gap-2">
                      <Button variant="secondary" onClick={() => editQuest(quest)}>Sửa</Button>
                      <Button variant="danger" onClick={() => openDeleteDialog(quest)}>Xóa</Button>
                    </div>}
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
      {canWriteQuests && <ConfirmDialog
        open={!!deleteTarget}
        title="Xóa nhiệm vụ?"
        description={`Nhiệm vụ "${deleteTarget?.title}" sẽ bị xóa khỏi hệ thống.`}
        confirmLabel={deleting ? 'Đang xóa...' : 'Xóa'}
        confirmDisabled={deleting || !deleteReason.trim()}
        onConfirm={deleteQuest}
        onClose={closeDeleteDialog}
      >
        <Field label="Lý do xóa"><textarea className={inputClass} rows="3" value={deleteReason} onChange={(event) => setDeleteReason(event.target.value)} placeholder="Nhập lý do để lưu vào audit log" /></Field>
      </ConfirmDialog>}
    </div>
  );
}
