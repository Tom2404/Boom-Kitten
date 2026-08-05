import React, { useEffect, useMemo, useState } from 'react';
import { useAdminApi } from './useAdminApi.js';
import { Alert, Button, ConfirmDialog, EmptyState, Field, inputClass, SectionHeader, SkeletonBlock, StatusBadge, Toolbar } from './ui.jsx';
import { formatNumber } from './utils.js';
import { getAdminPanelAccess } from './adminPanelAccess.js';
import { buildDeleteAdminPayload, buildRoutineAdminPayload, createAdminOperationRequestId } from './adminMutation.js';
import { filterCatalog, getCatalogSummary } from './adminListFilters.js';
import { DEFAULT_ASSET_TRANSFORM, normalizeAssetTransform, resolveAssetUrl } from '../../utils/shopEquipment.js';
import AssetPositionEditor from './AssetPositionEditor.jsx';
import AssetUploader from './AssetUploader.jsx';
import AssetLibraryModal from './AssetLibraryModal.jsx';

const blankItem = { name: '', description: '', type: 'protector', rarity: 'common', priceCoins: 0, imageUrl: '', previewUrl: '', assetTransform: DEFAULT_ASSET_TRANSFORM, isActive: true, sortOrder: 0 };
const framedTypes = new Set(['protector', 'avatar_frame', 'field']);
const responseMessage = (response, fallback) => response.data?.error?.message || response.data?.message || response.error || fallback;

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
  const [assetCheck, setAssetCheck] = useState({ status: 'idle', requiresFraming: false, url: '', type: '' });
  const [fitConfirmed, setFitConfirmed] = useState(false);
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);
  const [filters, setFilters] = useState({ search: '', type: '', rarity: '', status: '' });
  const { canWriteCatalog } = getAdminPanelAccess(permissions);
  const summary = useMemo(() => getCatalogSummary(catalog), [catalog]);
  const visibleCatalog = useMemo(() => filterCatalog(catalog, filters), [catalog, filters]);
  const filtersActive = Object.values(filters).some(Boolean);

  const loadCatalog = async () => {
    setLoading(true);
    const res = await request('/api/shop/catalog');
    if (res.ok) setCatalog(Array.isArray(res.data) ? res.data : []);
    else setMessage({ tone: 'danger', text: responseMessage(res, 'Không thể tải shop.') });
    setLoading(false);
  };

  useEffect(() => { loadCatalog(); }, [request]);

  const activeForm = editing || form;
  const setActiveForm = (next) => (editing ? setEditing(next) : setForm(next));
  const previewAssetUrl = activeForm.previewUrl || activeForm.imageUrl;
  const supportsFraming = framedTypes.has(activeForm.type);

  const updateAssetSource = (field, value) => {
    setActiveForm({ ...activeForm, [field]: value, assetTransform: DEFAULT_ASSET_TRANSFORM });
    setAssetCheck({ status: 'loading', requiresFraming: false, url: '', type: '' });
    setFitConfirmed(false);
  };

  const toPayload = (item) => ({
    name: item.name,
    description: item.description,
    type: item.type,
    rarity: item.rarity,
    price: { coins: Number(item.priceCoins) },
    imageUrl: item.imageUrl,
    previewUrl: item.previewUrl,
    assetTransform: item.assetTransform,
    isActive: item.isActive,
    sortOrder: Number(item.sortOrder),
  });

  const submitItem = async (event) => {
    event.preventDefault();
    if (saving) return;
    setMessage({ tone: '', text: '' });
    if (!activeForm.name || !activeForm.imageUrl) return setMessage({ tone: 'danger', text: 'Tên vật phẩm và URL hình ảnh là bắt buộc.' });
    const checkedCurrentAsset = assetCheck.url === previewAssetUrl && assetCheck.type === activeForm.type;
    if (supportsFraming && (!checkedCurrentAsset || assetCheck.status !== 'ready')) return setMessage({ tone: 'danger', text: 'Asset phải tải thành công như một hình ảnh trước khi lưu.' });
    if (supportsFraming && assetCheck.requiresFraming && !fitConfirmed) return setMessage({ tone: 'danger', text: 'Hãy căn và xác nhận asset trong khung chuẩn trước khi lưu.' });
    const endpoint = editing ? `/api/shop/items/${editing._id}` : '/api/shop/items';
    setSaving(true);
    const res = await request(endpoint, { method: editing ? 'PUT' : 'POST', body: JSON.stringify(buildRoutineAdminPayload(toPayload(activeForm), formRequestId)) });
    setSaving(false);
    if (res.ok) {
      setMessage({ tone: 'success', text: editing ? 'Đã cập nhật vật phẩm.' : 'Đã thêm vật phẩm mới.' });
      setForm(blankItem);
      setEditing(null);
      setAssetCheck({ status: 'idle', requiresFraming: false, url: '', type: '' });
      setFitConfirmed(false);
      setFormRequestId(createAdminOperationRequestId());
      loadCatalog();
    } else {
      setMessage({ tone: 'danger', text: responseMessage(res, 'Không thể lưu vật phẩm.') });
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
    } else setMessage({ tone: 'danger', text: responseMessage(res, 'Đổi trạng thái thất bại.') });
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
    } else setMessage({ tone: 'danger', text: responseMessage(res, 'Không thể xóa vật phẩm.') });
  };

  const startEditing = (item) => {
    setEditing({
      _id: item._id,
      name: item.name,
      description: item.description || '',
      type: item.type,
      rarity: item.rarity,
      priceCoins: item.price?.coins || 0,
      imageUrl: item.imageUrl || '',
      previewUrl: item.previewUrl || '',
      assetTransform: normalizeAssetTransform(item.assetTransform),
      isActive: item.isActive !== false,
      sortOrder: item.sortOrder || 0,
    });
    setAssetCheck({ status: 'loading', requiresFraming: false, url: '', type: '' });
    setFitConfirmed(true);
    setFormRequestId(createAdminOperationRequestId());
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
        <Field label="Loại"><select className={inputClass} value={filters.type} onChange={(event) => setFilters({ ...filters, type: event.target.value })}><option value="">Tất cả</option><option value="protector">Protector</option><option value="avatar_frame">Khung avatar</option><option value="field">Field</option><option value="skin">Skin (legacy)</option><option value="emote">Emote (legacy)</option></select></Field>
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
              <Field label="Loại"><select className={inputClass} value={activeForm.type} onChange={(event) => updateAssetSource('type', event.target.value)}><option value="protector">Protector</option><option value="avatar_frame">Khung avatar</option><option value="field">Field</option><option value="skin">Skin bài (legacy)</option><option value="emote">Biểu cảm (legacy)</option></select></Field>
              <Field label="Độ hiếm"><select className={inputClass} value={activeForm.rarity} onChange={(event) => setActiveForm({ ...activeForm, rarity: event.target.value })}><option value="common">Common</option><option value="rare">Rare</option><option value="epic">Epic</option><option value="legendary">Legendary</option></select></Field>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="GoldCoin"><input className={inputClass} type="number" min="0" value={activeForm.priceCoins} onChange={(event) => setActiveForm({ ...activeForm, priceCoins: event.target.value })} /></Field>
            </div>
            <div className="flex items-center justify-between gap-2">
              <Field label="Tải ảnh lên từ thiết bị (Tự động nén WebP)" className="flex-1">
                <AssetUploader
                  category={activeForm.type}
                  onUploaded={(asset) => {
                    setActiveForm({
                      ...activeForm,
                      imageUrl: asset.fullUrl,
                      previewUrl: asset.fullUrl,
                      assetTransform: DEFAULT_ASSET_TRANSFORM,
                    });
                    setAssetCheck({ status: 'loading', requiresFraming: false, url: '', type: '' });
                    setFitConfirmed(false);
                  }}
                />
              </Field>
            </div>
            <div className="flex justify-end">
              <Button type="button" variant="secondary" className="text-xs" onClick={() => setIsLibraryOpen(true)}>
                🖼️ Mở Thư Viện Asset (Media Library)
              </Button>
            </div>
            <AssetLibraryModal
              isOpen={isLibraryOpen}
              activeCategory={activeForm.type}
              onClose={() => setIsLibraryOpen(false)}
              onSelect={(asset) => {
                const targetUrl = asset.variants?.fullUrl || asset.fullUrl;
                setActiveForm({
                  ...activeForm,
                  imageUrl: targetUrl,
                  previewUrl: targetUrl,
                  assetTransform: DEFAULT_ASSET_TRANSFORM,
                });
                setAssetCheck({ status: 'loading', requiresFraming: false, url: '', type: '' });
                setFitConfirmed(false);
              }}
            />
            <Field label="Đường dẫn hình ảnh nội bộ"><input className={inputClass} value={activeForm.imageUrl} onChange={(event) => updateAssetSource('imageUrl', event.target.value)} placeholder="/assets/... hoặc /uploads/..." /></Field>
            <Field label="Đường dẫn asset trang bị nội bộ"><input className={inputClass} value={activeForm.previewUrl} onChange={(event) => updateAssetSource('previewUrl', event.target.value)} placeholder="/assets/... hoặc /uploads/..." /></Field>
            {previewAssetUrl && supportsFraming && <AssetPositionEditor
              confirmed={fitConfirmed}
              onChange={(assetTransform) => setActiveForm({ ...activeForm, assetTransform })}
              onConfirmedChange={setFitConfirmed}
              onValidationChange={(next) => setAssetCheck({ ...next, url: previewAssetUrl, type: activeForm.type })}
              type={activeForm.type}
              url={previewAssetUrl}
              value={activeForm.assetTransform}
            />}
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
                      {item.imageUrl ? <img src={resolveAssetUrl(item.imageUrl)} alt={item.name} loading="lazy" className="h-14 w-14 object-contain" /> : <span className="text-xs font-bold text-slate-400">No img</span>}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-sans font-semibold text-slate-950">{item.name}</h3>
                        <StatusBadge tone="neutral">{['skin', 'emote'].includes(item.type) ? `${item.type} · legacy` : item.type}</StatusBadge>
                        <StatusBadge tone={item.isActive === false ? 'neutral' : 'success'}>{item.isActive === false ? 'Inactive' : 'Active'}</StatusBadge>
                      </div>
                      <p className="mt-1 line-clamp-2 text-sm font-semibold text-slate-500">{item.description || 'Chưa có mô tả.'}</p>
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-[var(--admin-border)] pt-3">
                    <p className="text-sm font-semibold text-slate-700">{formatNumber(item.price?.coins)} Coin</p>
                    {canWriteCatalog && <div className="flex flex-wrap gap-2">
                      <Button variant="subtle" disabled={!!pendingItemId} onClick={() => startEditing(item)}>Sửa</Button>
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
