import React, { useEffect, useMemo, useState } from 'react';
import { useAdminApi } from './useAdminApi.js';
import {
  AdminCard,
  Alert,
  Button,
  ConfirmDialog,
  DataTable,
  EmptyState,
  Field,
  inputClass,
  SectionHeader,
  SkeletonBlock,
  StatusBadge,
  Toolbar,
} from './ui.jsx';
import { formatNumber } from './utils.js';
import { getAdminPanelAccess } from './adminPanelAccess.js';
import { buildDeleteAdminPayload, buildRoutineAdminPayload, createAdminOperationRequestId } from './adminMutation.js';
import { filterCatalog, getCatalogSummary } from './adminListFilters.js';
import { DEFAULT_ASSET_TRANSFORM, normalizeAssetTransform, resolveAssetUrl } from '../../utils/shopEquipment.js';
import AssetPositionEditor from './AssetPositionEditor.jsx';
import ItemEditorModal from './ItemEditorModal.jsx';

const blankItem = {
  name: '',
  description: '',
  type: 'protector',
  rarity: 'common',
  priceCoins: 0,
  imageUrl: '',
  previewUrl: '',
  assetTransform: DEFAULT_ASSET_TRANSFORM,
  isActive: true,
  sortOrder: 0,
};

const framedTypes = new Set(['protector', 'avatar_frame', 'field']);
const responseMessage = (response, fallback) => {
  const errorObj = response.data?.error;
  if (errorObj) {
    let msg = errorObj.message || 'Lỗi xử lý';
    if (errorObj.details?.fields) {
      const fieldDetails = Object.entries(errorObj.details.fields)
        .map(([field, reason]) => `${field}: ${reason}`)
        .join('; ');
      if (!msg.includes(fieldDetails)) {
        msg = `${msg} [${fieldDetails}]`;
      }
    }
    return msg;
  }
  return response.data?.message || response.error || fallback;
};

const rarityBadgeTones = {
  common: 'neutral',
  rare: 'info',
  epic: 'warning',
  legendary: 'danger',
};

export default function CatalogPanel({ permissions = [] }) {
  const { request } = useAdminApi();
  const [catalog, setCatalog] = useState([]);
  const [editing, setEditing] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
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
  const [viewMode, setViewMode] = useState('table'); // 'table' | 'grid'
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

  useEffect(() => {
    loadCatalog();
  }, [request]);

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

  const handleSaveItem = async (itemData) => {
    if (saving) return;
    setMessage({ tone: '', text: '' });

    const previewAssetUrl = itemData.previewUrl || itemData.imageUrl;
    const supportsFraming = framedTypes.has(itemData.type);

    if (!itemData.name || !itemData.imageUrl) {
      setMessage({ tone: 'danger', text: 'Tên vật phẩm và URL hình ảnh là bắt buộc.' });
      return;
    }

    // Framing verification if required
    if (supportsFraming && assetCheck.requiresFraming && !fitConfirmed) {
      setMessage({ tone: 'danger', text: 'Hãy căn và xác nhận asset trong khung chuẩn trước khi lưu.' });
      return;
    }

    const currentRequestId = createAdminOperationRequestId();
    setFormRequestId(currentRequestId);

    const endpoint = editing ? `/api/shop/items/${editing._id}` : '/api/shop/items';
    setSaving(true);
    const res = await request(endpoint, {
      method: editing ? 'PUT' : 'POST',
      body: JSON.stringify(buildRoutineAdminPayload(toPayload(itemData), currentRequestId)),
    });
    setSaving(false);

    if (res.ok) {
      setMessage({ tone: 'success', text: editing ? 'Đã cập nhật vật phẩm.' : 'Đã thêm vật phẩm mới thành công.' });
      setIsModalOpen(false);
      setEditing(null);
      setAssetCheck({ status: 'idle', requiresFraming: false, url: '', type: '' });
      setFitConfirmed(false);
      setFormRequestId(createAdminOperationRequestId());
      loadCatalog();
    } else {
      setFormRequestId(createAdminOperationRequestId());
      setMessage({ tone: 'danger', text: responseMessage(res, 'Không thể lưu vật phẩm.') });
    }
  };

  const toggleItem = async (item) => {
    if (pendingItemId) return;
    setPendingItemId(item._id);
    const res = await request(`/api/shop/items/${item._id}/status`, {
      method: 'PATCH',
      body: JSON.stringify(
        buildRoutineAdminPayload({ isActive: !item.isActive }, createAdminOperationRequestId())
      ),
    });
    setPendingItemId(null);
    if (res.ok) {
      setMessage({ tone: 'success', text: `Đã ${item.isActive === false ? 'bật' : 'tắt'} ${item.name}.` });
      loadCatalog();
    } else setMessage({ tone: 'danger', text: responseMessage(res, 'Đổi trạng thái thất bại.') });
  };

  const deleteItem = async () => {
    if (!deleteTarget || !deleteReason.trim() || pendingItemId) return;
    setPendingItemId(deleteTarget._id);
    const res = await request(`/api/shop/items/${deleteTarget._id}`, {
      method: 'DELETE',
      body: JSON.stringify(buildDeleteAdminPayload(deleteReason, deleteRequestId)),
    });
    setPendingItemId(null);
    if (res.ok) {
      setMessage({ tone: 'success', text: 'Đã xóa vật phẩm.' });
      setDeleteTarget(null);
      setDeleteReason('');
      setDeleteRequestId(createAdminOperationRequestId());
      loadCatalog();
    } else setMessage({ tone: 'danger', text: responseMessage(res, 'Không thể xóa vật phẩm.') });
  };

  const openCreateModal = () => {
    setEditing(null);
    setAssetCheck({ status: 'idle', requiresFraming: false, url: '', type: '' });
    setFitConfirmed(false);
    setFormRequestId(createAdminOperationRequestId());
    setIsModalOpen(true);
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
    setIsModalOpen(true);
  };

  return (
    <div className="flex flex-col gap-5">
      {/* Section Header with Primary Add Button */}
      <SectionHeader
        title="Shop game & Catalog"
        description="Quản lý danh mục vật phẩm, trang bị, khung avatar, giá bán Coin và trạng thái hiển thị."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            {canWriteCatalog && (
              <Button variant="primary" onClick={openCreateModal} className="shadow-sm">
                <span className="mr-1 text-base leading-none">＋</span> Thêm vật phẩm
              </Button>
            )}
            <Button variant="secondary" onClick={loadCatalog}>
              Làm mới
            </Button>
          </div>
        }
      />

      {message.text && <Alert tone={message.tone}>{message.text}</Alert>}
      {!canWriteCatalog && (
        <Alert tone="warning">
          Chế độ chỉ đọc: Tài khoản của bạn hiện không có quyền ghi ('catalog.write') để thêm hoặc sửa vật phẩm. Nếu tài khoản vừa được cấp quyền Quản trị viên, vui lòng Đăng xuất và Đăng nhập lại để làm mới token và phiên làm việc.
        </Alert>
      )}

      {/* Summary KPI Cards */}
      <dl className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {[
          ['Tổng vật phẩm', summary.total],
          ['Đang bán (Active)', summary.active],
          ['Đang tắt (Inactive)', summary.inactive],
        ].map(([label, value]) => (
          <div
            key={label}
            className="rounded-xl border border-[var(--admin-border)] bg-[var(--admin-surface)] p-3.5 shadow-2xs"
          >
            <dt className="text-xs font-semibold text-[var(--admin-text-muted)]">{label}</dt>
            <dd className="mt-1 font-mono text-2xl font-bold tracking-tight text-[var(--admin-text)]">
              {formatNumber(value)}
            </dd>
          </div>
        ))}
      </dl>

      {/* Filter and View Switcher Toolbar */}
      <Toolbar>
        <div className="flex flex-1 flex-wrap items-center gap-3">
          <Field label="Tìm vật phẩm">
            <input
              className={`${inputClass} min-w-[200px] md:min-w-56`}
              type="search"
              value={filters.search}
              onChange={(event) => setFilters({ ...filters, search: event.target.value })}
              placeholder="Nhập tên vật phẩm..."
            />
          </Field>
          <Field label="Loại">
            <select
              className={inputClass}
              value={filters.type}
              onChange={(event) => setFilters({ ...filters, type: event.target.value })}
            >
              <option value="">Tất cả loại</option>
              <option value="protector">Bọc bài (Protector)</option>
              <option value="avatar_frame">Khung avatar</option>
              <option value="field">Bàn đấu (Field)</option>
              <option value="skin">Skin (legacy)</option>
              <option value="emote">Emote (legacy)</option>
            </select>
          </Field>
          <Field label="Độ hiếm">
            <select
              className={inputClass}
              value={filters.rarity}
              onChange={(event) => setFilters({ ...filters, rarity: event.target.value })}
            >
              <option value="">Tất cả độ hiếm</option>
              <option value="common">Common</option>
              <option value="rare">Rare</option>
              <option value="epic">Epic</option>
              <option value="legendary">Legendary</option>
            </select>
          </Field>
          <Field label="Trạng thái">
            <select
              className={inputClass}
              value={filters.status}
              onChange={(event) => setFilters({ ...filters, status: event.target.value })}
            >
              <option value="">Tất cả trạng thái</option>
              <option value="active">Đang bán (Active)</option>
              <option value="inactive">Đang tắt (Inactive)</option>
            </select>
          </Field>
          {filtersActive && (
            <div className="flex items-end self-end pb-0.5">
              <Button
                type="button"
                variant="subtle"
                onClick={() => setFilters({ search: '', type: '', rarity: '', status: '' })}
              >
                Đặt lại
              </Button>
            </div>
          )}
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center gap-1 self-end rounded-lg border border-[var(--admin-border)] bg-[var(--admin-surface-muted)] p-1 text-xs">
          <button
            type="button"
            onClick={() => setViewMode('table')}
            className={`flex items-center gap-1 rounded-md px-2.5 py-1.5 font-semibold transition-all ${
              viewMode === 'table'
                ? 'bg-[var(--admin-surface)] text-[var(--admin-text)] shadow-xs'
                : 'text-[var(--admin-text-muted)] hover:text-[var(--admin-text)]'
            }`}
          >
            📋 Bảng
          </button>
          <button
            type="button"
            onClick={() => setViewMode('grid')}
            className={`flex items-center gap-1 rounded-md px-2.5 py-1.5 font-semibold transition-all ${
              viewMode === 'grid'
                ? 'bg-[var(--admin-surface)] text-[var(--admin-text)] shadow-xs'
                : 'text-[var(--admin-text-muted)] hover:text-[var(--admin-text)]'
            }`}
          >
            ▦ Lưới
          </button>
        </div>
      </Toolbar>

      {/* Main Content Area */}
      <section>
        {loading ? (
          <SkeletonBlock rows={5} />
        ) : catalog.length === 0 ? (
          <EmptyState
            title="Shop chưa có vật phẩm"
            description="Hãy thêm vật phẩm đầu tiên để người chơi có thể mua sắm trong game."
            action={
              canWriteCatalog && (
                <Button variant="primary" onClick={openCreateModal}>
                  ＋ Thêm vật phẩm ngay
                </Button>
              )
            }
          />
        ) : visibleCatalog.length === 0 ? (
          <EmptyState
            title="Không có vật phẩm phù hợp"
            description="Thử thay đổi từ khóa hoặc đặt lại bộ lọc để xem toàn bộ danh mục."
            action={
              <Button variant="secondary" onClick={() => setFilters({ search: '', type: '', rarity: '', status: '' })}>
                Đặt lại bộ lọc
              </Button>
            }
          />
        ) : viewMode === 'table' ? (
          /* TABLE VIEW */
          <DataTable
            columns={['Ảnh', 'Tên vật phẩm', 'Loại', 'Độ hiếm', 'Giá Coin', 'Trạng thái', 'Thứ tự', 'Thao tác']}
          >
            {visibleCatalog.map((item) => (
              <tr key={item._id} className="text-sm">
                <td className="px-4 py-3">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-[var(--admin-border)] bg-[var(--admin-surface-muted)]">
                    {item.imageUrl ? (
                      <img
                        src={resolveAssetUrl(item.imageUrl)}
                        alt={item.name}
                        loading="lazy"
                        className="h-10 w-10 object-contain"
                      />
                    ) : (
                      <span className="text-[10px] font-bold text-slate-400">No img</span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3 font-medium">
                  <div className="font-semibold text-slate-950">{item.name}</div>
                  {item.description && (
                    <div className="line-clamp-1 max-w-xs text-xs text-slate-500 font-normal">{item.description}</div>
                  )}
                </td>
                <td className="px-4 py-3">
                  <StatusBadge tone="neutral">
                    {['skin', 'emote'].includes(item.type) ? `${item.type} (legacy)` : item.type}
                  </StatusBadge>
                </td>
                <td className="px-4 py-3">
                  <StatusBadge tone={rarityBadgeTones[item.rarity] || 'neutral'}>
                    {item.rarity || 'common'}
                  </StatusBadge>
                </td>
                <td className="px-4 py-3 font-mono font-semibold text-slate-900">
                  {formatNumber(item.price?.coins)} Coin
                </td>
                <td className="px-4 py-3">
                  {canWriteCatalog ? (
                    <button
                      type="button"
                      disabled={pendingItemId === item._id}
                      onClick={() => toggleItem(item)}
                      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold transition-all cursor-pointer ${
                        item.isActive !== false
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                          : 'bg-slate-100 text-slate-600 border border-slate-200 hover:bg-slate-200'
                      }`}
                    >
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${
                          item.isActive !== false ? 'bg-emerald-500' : 'bg-slate-400'
                        }`}
                      />
                      {item.isActive !== false ? 'Đang bán' : 'Tạm tắt'}
                    </button>
                  ) : (
                    <StatusBadge tone={item.isActive === false ? 'neutral' : 'success'}>
                      {item.isActive === false ? 'Inactive' : 'Active'}
                    </StatusBadge>
                  )}
                </td>
                <td className="px-4 py-3 font-mono text-xs text-slate-500">{item.sortOrder || 0}</td>
                <td className="px-4 py-3">
                  {canWriteCatalog && (
                    <div className="flex items-center gap-1.5">
                      <Button
                        variant="subtle"
                        className="h-8 px-2.5 text-xs"
                        disabled={!!pendingItemId}
                        onClick={() => startEditing(item)}
                      >
                        Sửa
                      </Button>
                      <Button
                        variant="danger"
                        className="h-8 px-2.5 text-xs"
                        disabled={!!pendingItemId}
                        onClick={() => {
                          setDeleteTarget(item);
                          setDeleteReason('');
                          setDeleteRequestId(createAdminOperationRequestId());
                        }}
                      >
                        Xóa
                      </Button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </DataTable>
        ) : (
          /* GRID VIEW */
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {visibleCatalog.map((item) => (
              <AdminCard key={item._id} className="flex flex-col p-4">
                <div className="flex gap-3">
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-[var(--admin-border)] bg-[var(--admin-surface-muted)]">
                    {item.imageUrl ? (
                      <img
                        src={resolveAssetUrl(item.imageUrl)}
                        alt={item.name}
                        loading="lazy"
                        className="h-14 w-14 object-contain"
                      />
                    ) : (
                      <span className="text-xs font-bold text-slate-400">No img</span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <h3 className="font-sans font-semibold text-slate-950 truncate">{item.name}</h3>
                    </div>
                    <div className="mt-1 flex flex-wrap gap-1">
                      <StatusBadge tone="neutral">{item.type}</StatusBadge>
                      <StatusBadge tone={rarityBadgeTones[item.rarity] || 'neutral'}>
                        {item.rarity}
                      </StatusBadge>
                    </div>
                    <p className="mt-1.5 line-clamp-2 text-xs text-slate-500">{item.description || 'Chưa có mô tả.'}</p>
                  </div>
                </div>

                <div className="mt-4 flex flex-1 items-end justify-between border-t border-[var(--admin-border)] pt-3">
                  <div>
                    <span className="text-[11px] text-slate-400 font-semibold block">Giá bán</span>
                    <span className="text-sm font-bold text-slate-900 font-mono">
                      {formatNumber(item.price?.coins)} Coin
                    </span>
                  </div>

                  {canWriteCatalog && (
                    <div className="flex items-center gap-1.5">
                      <Button
                        variant="secondary"
                        className="h-8 px-2 text-xs"
                        disabled={!!pendingItemId}
                        onClick={() => toggleItem(item)}
                      >
                        {item.isActive !== false ? 'Tắt' : 'Bật'}
                      </Button>
                      <Button
                        variant="subtle"
                        className="h-8 px-2 text-xs"
                        disabled={!!pendingItemId}
                        onClick={() => startEditing(item)}
                      >
                        Sửa
                      </Button>
                      <Button
                        variant="danger"
                        className="h-8 px-2 text-xs"
                        disabled={!!pendingItemId}
                        onClick={() => {
                          setDeleteTarget(item);
                          setDeleteReason('');
                          setDeleteRequestId(createAdminOperationRequestId());
                        }}
                      >
                        Xóa
                      </Button>
                    </div>
                  )}
                </div>
              </AdminCard>
            ))}
          </div>
        )}
      </section>

      {/* Item Create & Edit Modal */}
      {canWriteCatalog && (
        <ItemEditorModal
          isOpen={isModalOpen}
          editingItem={editing}
          onClose={() => {
            setIsModalOpen(false);
            setEditing(null);
          }}
          onSave={handleSaveItem}
          saving={saving}
        />
      )}

      {/* Delete Confirmation Dialog with Audit Reason */}
      {canWriteCatalog && (
        <ConfirmDialog
          open={!!deleteTarget}
          title="Xóa vĩnh viễn vật phẩm?"
          description={`Vật phẩm "${deleteTarget?.name}" sẽ bị xóa vĩnh viễn khỏi cơ sở dữ liệu. Nếu đã có người chơi sở hữu, hệ thống sẽ ngăn chặn việc xóa và khuyên bạn nên Tắt bán.`}
          confirmLabel={pendingItemId ? 'Đang xóa...' : 'Xác nhận xóa'}
          confirmDisabled={!deleteReason.trim() || !!pendingItemId}
          onConfirm={deleteItem}
          onClose={() => {
            setDeleteTarget(null);
            setDeleteReason('');
          }}
        >
          <Field label="Lý do ghi nhật ký Audit (Bắt buộc)">
            <input
              className={inputClass}
              value={deleteReason}
              onChange={(event) => setDeleteReason(event.target.value)}
              placeholder="Ví dụ: Xóa vật phẩm trùng lặp hoặc hết hạn sự kiện..."
              autoFocus
            />
          </Field>
        </ConfirmDialog>
      )}
    </div>
  );
}
