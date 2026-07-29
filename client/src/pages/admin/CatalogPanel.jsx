import React, { useEffect, useMemo, useState } from 'react';
import { useAdminApi } from './useAdminApi.js';
import { Alert, Button, ConfirmDialog, EmptyState, Field, inputClass, SectionHeader, SkeletonBlock, StatusBadge, Toolbar } from './ui.jsx';
import { formatNumber } from './utils.js';
import { getAdminPanelAccess } from './adminPanelAccess.js';
import { buildDeleteAdminPayload, buildRoutineAdminPayload, createAdminOperationRequestId } from './adminMutation.js';
import { filterCatalog, getCatalogSummary } from './adminListFilters.js';

const blankItem = { name: '', description: '', type: 'skin', rarity: 'common', priceCoins: 0, imageUrl: '', isActive: true, sortOrder: 0 };

export default function CatalogPanel({ permissions = [] }) {
  const { request } = useAdminApi();
  const [catalog, setCatalog] = useState([]);
  const [form, setForm] = useState(blankItem);
  const [editing, setEditing] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ tone: '', text: '' });
  const [formRequestId, setFormRequestId] = useState(createAdminOperationRequestId);
  const [deleteReason, setDeleteReason] = useState('');
  const [deleteRequestId, setDeleteRequestId] = useState(createAdminOperationRequestId);
  const [saving, setSaving] = useState(false);
  const [pendingItemId, setPendingItemId] = useState(null);
  const [filters, setFilters] = useState({ search: '', type: '', rarity: '', status: '' });
  const { canWriteCatalog } = getAdminPanelAccess(permissions);
  const summary = useMemo(() => getCatalogSummary(catalog), [catalog]);
  const visibleCatalog = useMemo(() => filterCatalog(catalog, filters), [catalog, filters]);
  const filtersActive = Object.values(filters).some(Boolean);

  const loadCatalog = async () => {
    setLoading(true);
    const res = await request('/api/shop/items');
    if (res.ok) setCatalog(Array.isArray(res.data) ? res.data : []);
    else setMessage({ tone: 'danger', text: res.data?.message || res.error || 'Không thể tải shop.' });
    setLoading(false);
  };

  useEffect(() => { loadCatalog(); }, [request]);

  const activeForm = editing || form;
  const setActiveForm = (next) => (editing ? setEditing(next) : setForm(next));

  const toPayload = (item) => ({
    name: item.name,
    description: item.description,
    type: item.type,
    rarity: item.rarity,
    price: { coins: Number(item.priceCoins) },
    imageUrl: item.imageUrl,
    isActive: item.isActive,
    sortOrder: Number(item.sortOrder),
  });

  const submitItem = async (event) => {
    event.preventDefault();
    if (saving) return;
    setMessage({ tone: '', text: '' });
    if (!activeForm.name || !activeForm.imageUrl) return setMessage({ tone: 'danger', text: 'Tên vật phẩm và URL hình ảnh là bắt buộc.' });
    const endpoint = editing ? `/api/shop/items/${editing._id}` : '/api/shop/items';
    setSaving(true);
    const res = await request(endpoint, { method: editing ? 'PUT' : 'POST', body: JSON.stringify(buildRoutineAdminPayload(toPayload(activeForm), formRequestId)) });
    setSaving(false);
    if (res.ok) {
      setMessage({ tone: 'success', text: editing ? 'Đã cập nhật vật phẩm.' : 'Đã thêm vật phẩm mới.' });
      setForm(blankItem);
      setEditing(null);
      setFormRequestId(createAdminOperationRequestId());
      loadCatalog();
    } else {
      setMessage({ tone: 'danger', text: res.data?.message || res.error || 'Không thể lưu vật phẩm.' });
    }
  };

  const toggleItem = async (item) => {
    if (pendingItemId) return;
    setPendingItemId(item._id);
    const res = await request(`/api/shop/items/${item._id}/status`, { method: 'PATCH', body: JSON.stringify(buildRoutineAdminPayload({ isActive: !item.isActive }, createAdminOperationRequestId())) });
    setPendingItemId(null);
    if (res.ok) {
      setMessage({ tone: 'success', text: `Đã ${item.isActive === false ? 'bật' : 'tắt'} ${item.name}.` });
      loadCatalog();
    } else setMessage({ tone: 'danger', text: res.data?.message || 'Đổi trạng thái thất bại.' });
  };

  const deleteItem = async () => {
    if (!deleteTarget || !deleteReason.trim() || pendingItemId) return;
    setPendingItemId(deleteTarget._id);
    const res = await request(`/api/shop/items/${deleteTarget._id}`, { method: 'DELETE', body: JSON.stringify(buildDeleteAdminPayload(deleteReason, deleteRequestId)) });
    setPendingItemId(null);
    if (res.ok) {
      setMessage({ tone: 'success', text: 'Đã xóa vật phẩm.' });
      setDeleteTarget(null);
      setDeleteReason('');
      setDeleteRequestId(createAdminOperationRequestId());
      loadCatalog();
    } else setMessage({ tone: 'danger', text: res.data?.message || 'Không thể xóa vật phẩm.' });
  };

  return (
    <div className="flex flex-col gap-5">
      <SectionHeader title="Shop game" description="Quản lý vật phẩm, giá, độ hiếm, ảnh và trạng thái bán trong shop." actions={<Button onClick={loadCatalog}>Làm mới</Button>} />
      {message.text && <Alert tone={message.tone}>{message.text}</Alert>}
      {!canWriteCatalog && <Alert tone="info">Chế độ chỉ đọc: bạn có thể xem catalog nhưng không thể thay đổi vật phẩm.</Alert>}
      <dl className="grid grid-cols-3 gap-3">
        {[['Tổng vật phẩm', summary.total], ['Đang bán', summary.active], ['Đang tắt', summary.inactive]].map(([label, value]) => <div key={label} className="rounded-lg border border-[var(--admin-border)] bg-[var(--admin-surface)] p-3"><dt className="text-xs font-semibold text-[var(--admin-text-muted)]">{label}</dt><dd className="mt-1 font-mono text-xl font-semibold">{formatNumber(value)}</dd></div>)}
      </dl>
      <Toolbar>
        <Field label="Tìm vật phẩm"><input className={`${inputClass} md:min-w-56`} type="search" value={filters.search} onChange={(event) => setFilters({ ...filters, search: event.target.value })} placeholder="Tên vật phẩm" /></Field>
        <Field label="Loại"><select className={inputClass} value={filters.type} onChange={(event) => setFilters({ ...filters, type: event.target.value })}><option value="">Tất cả</option><option value="skin">Skin</option><option value="emote">Emote</option><option value="avatar_frame">Khung avatar</option></select></Field>
        <Field label="Độ hiếm"><select className={inputClass} value={filters.rarity} onChange={(event) => setFilters({ ...filters, rarity: event.target.value })}><option value="">Tất cả</option><option value="common">Common</option><option value="rare">Rare</option><option value="epic">Epic</option><option value="legendary">Legendary</option></select></Field>
        <Field label="Trạng thái"><select className={inputClass} value={filters.status} onChange={(event) => setFilters({ ...filters, status: event.target.value })}><option value="">Tất cả</option><option value="active">Active</option><option value="inactive">Inactive</option></select></Field>
        <Button type="button" variant="secondary" disabled={!filtersActive} onClick={() => setFilters({ search: '', type: '', rarity: '', status: '' })}>Đặt lại</Button>
      </Toolbar>
      <div className={`grid grid-cols-1 gap-5 ${canWriteCatalog ? 'xl:grid-cols-[360px_1fr]' : ''}`}>
        {canWriteCatalog && <form onSubmit={submitItem} className="rounded-lg border border-[var(--admin-border)] bg-[var(--admin-surface)] p-4 shadow-[0_1px_2px_rgba(32,35,31,0.03)]">
          <h3 className="font-sans text-base font-semibold text-slate-950">{editing ? 'Sửa vật phẩm' : 'Thêm vật phẩm'}</h3>
          <div className="mt-4 grid gap-3">
            <Field label="Tên vật phẩm"><input className={inputClass} value={activeForm.name} onChange={(event) => setActiveForm({ ...activeForm, name: event.target.value })} /></Field>
            <Field label="Mô tả"><textarea className={inputClass} rows="3" value={activeForm.description} onChange={(event) => setActiveForm({ ...activeForm, description: event.target.value })} /></Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Loại"><select className={inputClass} value={activeForm.type} onChange={(event) => setActiveForm({ ...activeForm, type: event.target.value })}><option value="skin">Skin bài</option><option value="emote">Biểu cảm</option><option value="avatar_frame">Khung avatar</option></select></Field>
              <Field label="Độ hiếm"><select className={inputClass} value={activeForm.rarity} onChange={(event) => setActiveForm({ ...activeForm, rarity: event.target.value })}><option value="common">Common</option><option value="rare">Rare</option><option value="epic">Epic</option><option value="legendary">Legendary</option></select></Field>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="GoldCoin"><input className={inputClass} type="number" min="0" value={activeForm.priceCoins} onChange={(event) => setActiveForm({ ...activeForm, priceCoins: event.target.value })} /></Field>
            </div>
            <Field label="URL hình ảnh"><input className={inputClass} value={activeForm.imageUrl} onChange={(event) => setActiveForm({ ...activeForm, imageUrl: event.target.value })} placeholder="https://..." /></Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Sort order"><input className={inputClass} type="number" value={activeForm.sortOrder} onChange={(event) => setActiveForm({ ...activeForm, sortOrder: event.target.value })} /></Field>
              <Field label="Trạng thái"><select className={inputClass} value={activeForm.isActive ? 'true' : 'false'} onChange={(event) => setActiveForm({ ...activeForm, isActive: event.target.value === 'true' })}><option value="true">Active</option><option value="false">Inactive</option></select></Field>
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <Button type="submit" variant="primary" className="flex-1" disabled={saving}>{saving ? 'Đang lưu...' : editing ? 'Lưu thay đổi' : 'Thêm vật phẩm'}</Button>
            {editing && <Button type="button" variant="secondary" onClick={() => { setEditing(null); setFormRequestId(createAdminOperationRequestId()); }}>Hủy</Button>}
          </div>
        </form>}

        <section>
          {loading ? <SkeletonBlock rows={5} /> : catalog.length === 0 ? (
            <EmptyState title="Shop chưa có vật phẩm" description="Thêm vật phẩm đầu tiên bằng form bên trái." />
          ) : visibleCatalog.length === 0 ? (
            <EmptyState title="Không có vật phẩm phù hợp" description="Thử đổi hoặc đặt lại bộ lọc." action={<Button variant="secondary" onClick={() => setFilters({ search: '', type: '', rarity: '', status: '' })}>Đặt lại bộ lọc</Button>} />
          ) : (
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {visibleCatalog.map((item) => (
                <article key={item._id} className="rounded-lg border border-[var(--admin-border)] bg-[var(--admin-surface)] p-4 shadow-[0_1px_2px_rgba(32,35,31,0.03)]">
                  <div className="flex gap-3">
                    <div className="flex h-16 w-16 shrink-0 items-center justify-center border border-[var(--admin-border)] bg-[var(--admin-surface-muted)]">
                      {item.imageUrl ? <img src={item.imageUrl} alt={item.name} loading="lazy" className="h-14 w-14 object-contain" /> : <span className="text-xs font-bold text-slate-400">No img</span>}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-sans font-semibold text-slate-950">{item.name}</h3>
                        <StatusBadge tone={item.isActive === false ? 'neutral' : 'success'}>{item.isActive === false ? 'Inactive' : 'Active'}</StatusBadge>
                      </div>
                      <p className="mt-1 line-clamp-2 text-sm font-semibold text-slate-500">{item.description || 'Chưa có mô tả.'}</p>
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-[var(--admin-border)] pt-3">
                    <p className="text-sm font-semibold text-slate-700">{formatNumber(item.price?.coins)} Coin</p>
                    {canWriteCatalog && <div className="flex flex-wrap gap-2">
                      <Button variant="subtle" disabled={!!pendingItemId} onClick={() => { setEditing({ _id: item._id, name: item.name, description: item.description || '', type: item.type, rarity: item.rarity, priceCoins: item.price?.coins || 0, imageUrl: item.imageUrl || '', isActive: item.isActive !== false, sortOrder: item.sortOrder || 0 }); setFormRequestId(createAdminOperationRequestId()); }}>Sửa</Button>
                      <Button variant="secondary" disabled={!!pendingItemId} onClick={() => toggleItem(item)}>{pendingItemId === item._id ? 'Đang xử lý...' : item.isActive === false ? 'Bật' : 'Tắt'}</Button>
                      <Button variant="danger" disabled={!!pendingItemId} onClick={() => { setDeleteTarget(item); setDeleteReason(''); setDeleteRequestId(createAdminOperationRequestId()); }}>Xóa</Button>
                    </div>}
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
      {canWriteCatalog && <ConfirmDialog open={!!deleteTarget} title="Xóa vật phẩm?" description={`Vật phẩm "${deleteTarget?.name}" sẽ bị xóa vĩnh viễn. Nếu đã có người mua, nên tắt thay vì xóa.`} confirmLabel={pendingItemId ? 'Đang xóa...' : 'Xóa'} confirmDisabled={!deleteReason.trim() || !!pendingItemId} onConfirm={deleteItem} onClose={() => { setDeleteTarget(null); setDeleteReason(''); }}><Field label="Lý do ghi audit"><input className={inputClass} value={deleteReason} onChange={(event) => setDeleteReason(event.target.value)} placeholder="Ví dụ: Trùng dữ liệu import" /></Field></ConfirmDialog>}
    </div>
  );
}
