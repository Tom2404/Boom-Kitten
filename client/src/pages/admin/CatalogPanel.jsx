import React, { useEffect, useState } from 'react';
import { useAdminApi } from './useAdminApi.js';
import { Alert, Button, ConfirmDialog, EmptyState, Field, inputClass, SectionHeader, SkeletonBlock, StatusBadge } from './ui.jsx';
import { formatNumber } from './utils.js';

const blankItem = { name: '', description: '', type: 'skin', rarity: 'common', priceCoins: 0, priceGems: 0, imageUrl: '', isActive: true, sortOrder: 0 };

export default function CatalogPanel() {
  const { request } = useAdminApi();
  const [catalog, setCatalog] = useState([]);
  const [form, setForm] = useState(blankItem);
  const [editing, setEditing] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ tone: '', text: '' });

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
    price: { coins: Number(item.priceCoins), gems: Number(item.priceGems) },
    imageUrl: item.imageUrl,
    isActive: item.isActive,
    sortOrder: Number(item.sortOrder),
  });

  const submitItem = async (event) => {
    event.preventDefault();
    setMessage({ tone: '', text: '' });
    if (!activeForm.name || !activeForm.imageUrl) return setMessage({ tone: 'danger', text: 'Tên vật phẩm và URL hình ảnh là bắt buộc.' });
    const endpoint = editing ? `/api/shop/items/${editing._id}` : '/api/shop/items';
    const res = await request(endpoint, { method: editing ? 'PUT' : 'POST', body: JSON.stringify(toPayload(activeForm)) });
    if (res.ok) {
      setMessage({ tone: 'success', text: editing ? 'Đã cập nhật vật phẩm.' : 'Đã thêm vật phẩm mới.' });
      setForm(blankItem);
      setEditing(null);
      loadCatalog();
    } else {
      setMessage({ tone: 'danger', text: res.data?.message || res.error || 'Không thể lưu vật phẩm.' });
    }
  };

  const toggleItem = async (item) => {
    const res = await request(`/api/shop/items/${item._id}/status`, { method: 'PATCH', body: JSON.stringify({ isActive: !item.isActive }) });
    if (res.ok) {
      setMessage({ tone: 'success', text: `Đã ${item.isActive === false ? 'bật' : 'tắt'} ${item.name}.` });
      loadCatalog();
    } else setMessage({ tone: 'danger', text: res.data?.message || 'Đổi trạng thái thất bại.' });
  };

  const deleteItem = async () => {
    if (!deleteTarget) return;
    const res = await request(`/api/shop/items/${deleteTarget._id}`, { method: 'DELETE' });
    if (res.ok) {
      setMessage({ tone: 'success', text: 'Đã xóa vật phẩm.' });
      setDeleteTarget(null);
      loadCatalog();
    } else setMessage({ tone: 'danger', text: res.data?.message || 'Không thể xóa vật phẩm.' });
  };

  return (
    <div className="flex flex-col gap-5">
      <SectionHeader title="Shop game" description="Quản lý vật phẩm, giá, độ hiếm, ảnh và trạng thái bán trong shop." actions={<Button onClick={loadCatalog}>Làm mới</Button>} />
      {message.text && <Alert tone={message.tone}>{message.text}</Alert>}
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[360px_1fr]">
        <form onSubmit={submitItem} className="border-[3px] border-[var(--pop-black)] bg-[#fffdf5] p-4 shadow-[4px_4px_0_var(--pop-black)]">
          <h3 className="font-pop-display text-base font-black text-slate-950">{editing ? 'Sửa vật phẩm' : 'Thêm vật phẩm'}</h3>
          <div className="mt-4 grid gap-3">
            <Field label="Tên vật phẩm"><input className={inputClass} value={activeForm.name} onChange={(event) => setActiveForm({ ...activeForm, name: event.target.value })} /></Field>
            <Field label="Mô tả"><textarea className={inputClass} rows="3" value={activeForm.description} onChange={(event) => setActiveForm({ ...activeForm, description: event.target.value })} /></Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Loại"><select className={inputClass} value={activeForm.type} onChange={(event) => setActiveForm({ ...activeForm, type: event.target.value })}><option value="skin">Skin bài</option><option value="emote">Biểu cảm</option><option value="avatar_frame">Khung avatar</option></select></Field>
              <Field label="Độ hiếm"><select className={inputClass} value={activeForm.rarity} onChange={(event) => setActiveForm({ ...activeForm, rarity: event.target.value })}><option value="common">Common</option><option value="rare">Rare</option><option value="epic">Epic</option><option value="legendary">Legendary</option></select></Field>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="GoldCoin"><input className={inputClass} type="number" min="0" value={activeForm.priceCoins} onChange={(event) => setActiveForm({ ...activeForm, priceCoins: event.target.value })} /></Field>
              <Field label="PinkCoin"><input className={inputClass} type="number" min="0" value={activeForm.priceGems} onChange={(event) => setActiveForm({ ...activeForm, priceGems: event.target.value })} /></Field>
            </div>
            <Field label="URL hình ảnh"><input className={inputClass} value={activeForm.imageUrl} onChange={(event) => setActiveForm({ ...activeForm, imageUrl: event.target.value })} placeholder="https://..." /></Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Sort order"><input className={inputClass} type="number" value={activeForm.sortOrder} onChange={(event) => setActiveForm({ ...activeForm, sortOrder: event.target.value })} /></Field>
              <Field label="Trạng thái"><select className={inputClass} value={activeForm.isActive ? 'true' : 'false'} onChange={(event) => setActiveForm({ ...activeForm, isActive: event.target.value === 'true' })}><option value="true">Active</option><option value="false">Inactive</option></select></Field>
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <Button type="submit" variant="primary" className="flex-1">{editing ? 'Lưu thay đổi' : 'Thêm vật phẩm'}</Button>
            {editing && <Button type="button" variant="secondary" onClick={() => setEditing(null)}>Hủy</Button>}
          </div>
        </form>

        <section>
          {loading ? <SkeletonBlock rows={5} /> : catalog.length === 0 ? (
            <EmptyState title="Shop chưa có vật phẩm" description="Thêm vật phẩm đầu tiên bằng form bên trái." />
          ) : (
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {catalog.map((item) => (
                <article key={item._id} className="border-[3px] border-[var(--pop-black)] bg-[#fffdf5] p-4 shadow-[4px_4px_0_var(--pop-black)]">
                  <div className="flex gap-3">
                    <div className="flex h-16 w-16 shrink-0 items-center justify-center border-[3px] border-[var(--pop-black)] bg-[#f5e7c8]">
                      {item.imageUrl ? <img src={item.imageUrl} alt={item.name} className="h-14 w-14 object-contain" /> : <span className="text-xs font-bold text-slate-400">No img</span>}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-pop-display font-black text-slate-950">{item.name}</h3>
                        <StatusBadge tone={item.isActive === false ? 'neutral' : 'success'}>{item.isActive === false ? 'Inactive' : 'Active'}</StatusBadge>
                      </div>
                      <p className="mt-1 line-clamp-2 text-sm font-semibold text-slate-500">{item.description || 'Chưa có mô tả.'}</p>
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t-[3px] border-[var(--pop-black)] pt-3">
                    <p className="text-sm font-black text-slate-700">{formatNumber(item.price?.coins)} Gold / {formatNumber(item.price?.gems)} Pink</p>
                    <div className="flex flex-wrap gap-2">
                      <Button variant="subtle" onClick={() => setEditing({ _id: item._id, name: item.name, description: item.description || '', type: item.type, rarity: item.rarity, priceCoins: item.price?.coins || 0, priceGems: item.price?.gems || 0, imageUrl: item.imageUrl || '', isActive: item.isActive !== false, sortOrder: item.sortOrder || 0 })}>Sửa</Button>
                      <Button variant="secondary" onClick={() => toggleItem(item)}>{item.isActive === false ? 'Bật' : 'Tắt'}</Button>
                      <Button variant="danger" onClick={() => setDeleteTarget(item)}>Xóa</Button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
      <ConfirmDialog open={!!deleteTarget} title="Xóa vật phẩm?" description={`Vật phẩm "${deleteTarget?.name}" sẽ bị xóa vĩnh viễn. Nếu đã có người mua, nên tắt thay vì xóa.`} confirmLabel="Xóa" onConfirm={deleteItem} onClose={() => setDeleteTarget(null)} />
    </div>
  );
}
