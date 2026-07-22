import React, { useEffect, useState } from 'react';
import { useAdminApi } from './useAdminApi.js';
import { Alert, Button, ConfirmDialog, EmptyState, Field, inputClass, SectionHeader, SkeletonBlock, StatusBadge } from './ui.jsx';
import { formatNumber } from './utils.js';

const blankQuest = { title: '', description: '', actionType: 'play_game', targetCount: 1, coinReward: 0, gemReward: 0, isActive: true };

export default function QuestsPanel() {
  const { request } = useAdminApi();
  const [quests, setQuests] = useState([]);
  const [form, setForm] = useState(blankQuest);
  const [editingId, setEditingId] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ tone: '', text: '' });

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
  };

  const editQuest = (quest) => {
    setEditingId(quest._id);
    setForm({
      title: quest.title || '',
      description: quest.description || '',
      actionType: quest.actionType || 'play_game',
      targetCount: quest.targetCount || 1,
      coinReward: quest.reward?.coins || 0,
      gemReward: quest.reward?.gems || 0,
      isActive: quest.isActive !== false,
    });
  };

  const submitQuest = async (event) => {
    event.preventDefault();
    if (!form.title || !form.description) return setMessage({ tone: 'danger', text: 'Tiêu đề và mô tả không được để trống.' });
    const payload = {
      title: form.title,
      description: form.description,
      actionType: form.actionType,
      targetCount: Number(form.targetCount),
      reward: { coins: Number(form.coinReward), gems: Number(form.gemReward) },
      isActive: form.isActive,
    };
    const res = await request(editingId ? `/api/admin/quests/${editingId}` : '/api/admin/quests', {
      method: editingId ? 'PUT' : 'POST',
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      setMessage({ tone: 'success', text: editingId ? 'Đã cập nhật nhiệm vụ.' : 'Đã tạo nhiệm vụ mới.' });
      resetForm();
      loadQuests();
    } else setMessage({ tone: 'danger', text: res.data?.message || res.error || 'Không thể lưu nhiệm vụ.' });
  };

  const deleteQuest = async () => {
    if (!deleteTarget) return;
    const res = await request(`/api/admin/quests/${deleteTarget._id}`, { method: 'DELETE' });
    if (res.ok) {
      setMessage({ tone: 'success', text: 'Đã xóa nhiệm vụ.' });
      if (editingId === deleteTarget._id) resetForm();
      setDeleteTarget(null);
      loadQuests();
    } else setMessage({ tone: 'danger', text: res.data?.message || 'Không thể xóa nhiệm vụ.' });
  };

  return (
    <div className="flex flex-col gap-5">
      <SectionHeader title="Nhiệm vụ" description="Tạo và chỉnh sửa nhiệm vụ người chơi, mục tiêu hoàn thành và phần thưởng." />
      {message.text && <Alert tone={message.tone}>{message.text}</Alert>}
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[360px_1fr]">
        <form onSubmit={submitQuest} className="border-[3px] border-[var(--pop-black)] bg-[#fffdf5] p-4 shadow-[4px_4px_0_var(--pop-black)]">
          <h3 className="font-pop-display text-base font-black text-slate-950">{editingId ? 'Sửa nhiệm vụ' : 'Tạo nhiệm vụ'}</h3>
          <div className="mt-4 grid gap-3">
            <Field label="Tiêu đề"><input className={inputClass} value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} /></Field>
            <Field label="Mô tả"><textarea className={inputClass} rows="3" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} /></Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Loại hành động"><select className={inputClass} value={form.actionType} onChange={(event) => setForm({ ...form, actionType: event.target.value })}><option value="play_game">Chơi trận</option><option value="win_game">Thắng trận</option><option value="draw_card">Rút bài</option><option value="buy_item">Mua hàng</option></select></Field>
              <Field label="Mục tiêu"><input className={inputClass} type="number" min="1" value={form.targetCount} onChange={(event) => setForm({ ...form, targetCount: event.target.value })} /></Field>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Gold thưởng"><input className={inputClass} type="number" min="0" value={form.coinReward} onChange={(event) => setForm({ ...form, coinReward: event.target.value })} /></Field>
              <Field label="Pink thưởng"><input className={inputClass} type="number" min="0" value={form.gemReward} onChange={(event) => setForm({ ...form, gemReward: event.target.value })} /></Field>
            </div>
            <Field label="Trạng thái"><select className={inputClass} value={form.isActive ? 'true' : 'false'} onChange={(event) => setForm({ ...form, isActive: event.target.value === 'true' })}><option value="true">Active</option><option value="false">Inactive</option></select></Field>
          </div>
          <div className="mt-4 flex gap-2">
            <Button type="submit" variant="primary" className="flex-1">{editingId ? 'Lưu thay đổi' : 'Tạo nhiệm vụ'}</Button>
            {editingId && <Button type="button" variant="secondary" onClick={resetForm}>Hủy</Button>}
          </div>
        </form>

        <section>
          {loading ? <SkeletonBlock rows={5} /> : quests.length === 0 ? (
            <EmptyState title="Chưa có nhiệm vụ" description="Tạo nhiệm vụ đầu tiên bằng form bên trái." />
          ) : (
            <div className="grid gap-3">
              {quests.map((quest) => (
                <article key={quest._id} className="border-[3px] border-[var(--pop-black)] bg-[#fffdf5] p-4 shadow-[4px_4px_0_var(--pop-black)]">
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <StatusBadge>{quest.actionType}</StatusBadge>
                        <StatusBadge tone={quest.isActive ? 'success' : 'neutral'}>{quest.isActive ? 'Active' : 'Inactive'}</StatusBadge>
                      </div>
                      <h3 className="mt-2 font-pop-display font-black text-slate-950">{quest.title}</h3>
                      <p className="mt-1 text-sm font-semibold text-slate-500">{quest.description}</p>
                      <p className="mt-2 text-sm font-bold text-slate-700">Mục tiêu: {formatNumber(quest.targetCount)} · Thưởng: {formatNumber(quest.reward?.coins)} Gold / {formatNumber(quest.reward?.gems)} Pink</p>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="secondary" onClick={() => editQuest(quest)}>Sửa</Button>
                      <Button variant="danger" onClick={() => setDeleteTarget(quest)}>Xóa</Button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
      <ConfirmDialog open={!!deleteTarget} title="Xóa nhiệm vụ?" description={`Nhiệm vụ "${deleteTarget?.title}" sẽ bị xóa khỏi hệ thống.`} confirmLabel="Xóa" onConfirm={deleteQuest} onClose={() => setDeleteTarget(null)} />
    </div>
  );
}
