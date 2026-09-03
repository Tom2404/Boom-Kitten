import React, { useEffect, useState } from 'react';
import { Alert, Button, Field, inputClass, StatusBadge } from './ui.jsx';
import {
  DEFAULT_ASSET_TRANSFORM,
  isSafeAssetUrl,
  normalizeAssetTransform,
  resolveAssetUrl,
  sanitizeAssetUrl,
} from '../../utils/shopEquipment.js';
import AssetUploader from './AssetUploader.jsx';
import AssetLibraryModal from './AssetLibraryModal.jsx';
import AssetPositionEditor from './AssetPositionEditor.jsx';

const RARITY_OPTIONS = [
  { value: 'common', label: 'Common (Thường)', color: 'neutral' },
  { value: 'rare', label: 'Rare (Hiếm)', color: 'info' },
  { value: 'epic', label: 'Epic (Sử thi)', color: 'warning' },
  { value: 'legendary', label: 'Legendary (Huyền thoại)', color: 'danger' },
];

const TYPE_OPTIONS = [
  { value: 'protector', label: 'Bọc bài (Protector)', framed: true },
  { value: 'avatar_frame', label: 'Khung avatar (Avatar Frame)', framed: true },
  { value: 'field', label: 'Bàn đấu (Field)', framed: true },
  { value: 'skin', label: 'Skin bài (Legacy)', framed: false },
  { value: 'emote', label: 'Biểu cảm (Legacy)', framed: false },
];

export default function ItemEditorModal({
  isOpen,
  editingItem = null,
  onClose,
  onSave,
  saving = false,
}) {
  const [formData, setFormData] = useState({
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
  });

  const [assetTab, setAssetTab] = useState('upload'); // 'upload' | 'library' | 'url'
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [fitConfirmed, setFitConfirmed] = useState(false);
  const [assetCheck, setAssetCheck] = useState({ status: 'idle', requiresFraming: false, url: '', type: '' });
  const [validationError, setValidationError] = useState('');

  // Sync state when modal opens or item changes
  useEffect(() => {
    if (!isOpen) return;
    setValidationError('');
    if (editingItem) {
      setFormData({
        _id: editingItem._id,
        name: editingItem.name || '',
        description: editingItem.description || '',
        type: editingItem.type || 'protector',
        rarity: editingItem.rarity || 'common',
        priceCoins: editingItem.price?.coins ?? editingItem.priceCoins ?? 0,
        imageUrl: editingItem.imageUrl || '',
        previewUrl: editingItem.previewUrl || editingItem.imageUrl || '',
        assetTransform: normalizeAssetTransform(editingItem.assetTransform),
        isActive: editingItem.isActive !== false,
        sortOrder: editingItem.sortOrder || 0,
      });
      setFitConfirmed(true);
      setAssetCheck({ status: 'ready', requiresFraming: false, url: editingItem.imageUrl || '', type: editingItem.type });
      setAssetTab(editingItem.imageUrl ? 'url' : 'upload');
    } else {
      setFormData({
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
      });
      setFitConfirmed(false);
      setAssetCheck({ status: 'idle', requiresFraming: false, url: '', type: '' });
      setAssetTab('upload');
    }
  }, [isOpen, editingItem]);

  if (!isOpen) return null;

  const currentTypeConfig = TYPE_OPTIONS.find((t) => t.value === formData.type) || TYPE_OPTIONS[0];
  const supportsFraming = currentTypeConfig.framed;
  const activeAssetUrl = formData.previewUrl || formData.imageUrl;

  // Handle setting an asset URL from any of the 3 mechanisms (Upload, Library, or Direct URL)
  const applyAssetUrl = (rawUrl) => {
    const url = sanitizeAssetUrl(rawUrl);
    setFormData((prev) => ({
      ...prev,
      imageUrl: url,
      // Default previewUrl matches imageUrl unless customized in advanced
      previewUrl: prev.previewUrl && prev.previewUrl !== prev.imageUrl ? prev.previewUrl : url,
      assetTransform: DEFAULT_ASSET_TRANSFORM,
    }));
    setAssetCheck({ status: 'loading', requiresFraming: false, url, type: formData.type });
    // Auto-confirm standard fit to avoid blocking friction, user can still adjust framing
    setFitConfirmed(true);
    setValidationError('');
  };

  const handleClearAsset = () => {
    setFormData((prev) => ({
      ...prev,
      imageUrl: '',
      previewUrl: '',
      assetTransform: DEFAULT_ASSET_TRANSFORM,
    }));
    setAssetCheck({ status: 'idle', requiresFraming: false, url: '', type: '' });
    setFitConfirmed(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (saving) return;

    if (!formData.name.trim()) {
      setValidationError('Tên vật phẩm không được để trống.');
      return;
    }
    if (!formData.imageUrl.trim()) {
      setValidationError('Vui lòng chọn hoặc nhập hình ảnh cho vật phẩm (qua Upload, Thư viện hoặc URL).');
      return;
    }

    if (!isSafeAssetUrl(formData.imageUrl)) {
      setValidationError(
        `URL hình ảnh '${formData.imageUrl}' không hợp lệ. Đường dẫn phải bắt đầu bằng dấu gạch chéo "/" (ví dụ: /assets/... hoặc /uploads/...). Không hỗ trợ link ngoài (http/https) hoặc chuỗi base64.`,
      );
      return;
    }

    if (formData.previewUrl && !isSafeAssetUrl(formData.previewUrl)) {
      setValidationError(
        `URL asset trang bị '${formData.previewUrl}' không hợp lệ. Đường dẫn phải bắt đầu bằng dấu gạch chéo "/" (ví dụ: /assets/... hoặc /uploads/...).`,
      );
      return;
    }

    if (Number(formData.priceCoins) < 0 || isNaN(Number(formData.priceCoins))) {
      setValidationError('Giá Coin phải là số dương hoặc 0.');
      return;
    }

    // Auto-confirm framing if ready so admin is not blocked by minor framing warnings
    if (supportsFraming && !fitConfirmed && assetCheck.status === 'ready') {
      setFitConfirmed(true);
    }

    onSave({
      ...formData,
      priceCoins: Number(formData.priceCoins),
      sortOrder: Number(formData.sortOrder) || 0,
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-3 sm:p-4 backdrop-blur-sm overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="item-modal-title"
    >
      <div className="relative w-full max-w-4xl max-h-[92vh] flex flex-col rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-surface)] shadow-[0_20px_60px_rgba(0,0,0,0.18)]">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-[var(--admin-border)] px-6 py-4">
          <div>
            <h2 id="item-modal-title" className="text-lg font-semibold tracking-tight text-[var(--admin-text)]">
              {editingItem ? 'Chỉnh sửa vật phẩm' : 'Thêm vật phẩm mới'}
            </h2>
            <p className="text-xs text-[var(--admin-text-muted)] mt-0.5">
              {editingItem ? `Cập nhật thông tin cho "${editingItem.name}"` : 'Tạo vật phẩm mới cho Shop game với đầy đủ asset và thuộc tính.'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-[var(--admin-surface-muted)] hover:text-slate-700 transition-colors"
            title="Đóng"
          >
            ✕
          </button>
        </div>

        {/* Modal Body: 2 Columns */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6">
          {validationError && (
            <div className="mb-4">
              <Alert tone="danger">{validationError}</Alert>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-6 items-start">
            {/* Left Column: Core Details */}
            <div className="flex flex-col gap-4">
              <Field label="Tên vật phẩm *">
                <input
                  className={inputClass}
                  value={formData.name}
                  onChange={(e) => {
                    setFormData({ ...formData, name: e.target.value });
                    if (validationError) setValidationError('');
                  }}
                  placeholder="Ví dụ: Bọc bài Mèo Lửa, Khung Tân Binh..."
                  autoFocus
                  required
                />
              </Field>

              <div className="grid grid-cols-2 gap-3">
                <Field label="Loại vật phẩm">
                  <select
                    className={inputClass}
                    value={formData.type}
                    onChange={(e) => {
                      const nextType = e.target.value;
                      setFormData({
                        ...formData,
                        type: nextType,
                        assetTransform: DEFAULT_ASSET_TRANSFORM,
                      });
                      setAssetCheck({ status: 'loading', requiresFraming: false, url: activeAssetUrl, type: nextType });
                      setFitConfirmed(true);
                    }}
                  >
                    {TYPE_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </Field>

                <Field label="Độ hiếm (Rarity)">
                  <select
                    className={inputClass}
                    value={formData.rarity}
                    onChange={(e) => setFormData({ ...formData, rarity: e.target.value })}
                  >
                    {RARITY_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Field label="Giá bán (GoldCoin)">
                  <div className="relative">
                    <input
                      className={`${inputClass} pr-12`}
                      type="number"
                      min="0"
                      step="10"
                      value={formData.priceCoins}
                      onChange={(e) => setFormData({ ...formData, priceCoins: e.target.value })}
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-amber-600 pointer-events-none">
                      Coin
                    </span>
                  </div>
                </Field>

                <Field label="Thứ tự hiển thị (Sort Order)">
                  <input
                    className={inputClass}
                    type="number"
                    value={formData.sortOrder}
                    onChange={(e) => setFormData({ ...formData, sortOrder: e.target.value })}
                    placeholder="0"
                  />
                </Field>
              </div>

              <Field label="Mô tả vật phẩm">
                <textarea
                  className={inputClass}
                  rows="3"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Mô tả hiệu ứng, cốt truyện hoặc nguồn gốc vật phẩm..."
                />
              </Field>

              <Field label="Trạng thái kinh doanh">
                <div className="flex items-center gap-4 pt-1">
                  <label className="flex items-center gap-2 cursor-pointer text-sm font-medium text-[var(--admin-text)]">
                    <input
                      type="radio"
                      name="isActiveRadio"
                      checked={formData.isActive === true}
                      onChange={() => setFormData({ ...formData, isActive: true })}
                      className="accent-[var(--admin-accent)] h-4 w-4"
                    />
                    <span>Đang bán (Active)</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-sm font-medium text-[var(--admin-text-muted)]">
                    <input
                      type="radio"
                      name="isActiveRadio"
                      checked={formData.isActive === false}
                      onChange={() => setFormData({ ...formData, isActive: false })}
                      className="accent-[var(--admin-accent)] h-4 w-4"
                    />
                    <span>Tạm ẩn / Chưa bán (Inactive)</span>
                  </label>
                </div>
              </Field>

              {/* Advanced Collapsible */}
              <div className="mt-2 border-t border-[var(--admin-border)] pt-3">
                <button
                  type="button"
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  className="flex items-center gap-1.5 text-xs font-semibold text-[var(--admin-text-muted)] hover:text-[var(--admin-text)]"
                >
                  <span>{showAdvanced ? '▾ Thu gọn' : '▸ Cài đặt asset nâng cao (Optional)'}</span>
                </button>
                {showAdvanced && (
                  <div className="mt-3 grid gap-3 rounded-lg border border-[var(--admin-border)] bg-[var(--admin-surface-muted)] p-3">
                    <Field label="Đường dẫn hình ảnh catalog (imageUrl)">
                      <input
                        className={inputClass}
                        value={formData.imageUrl}
                        onChange={(e) => applyAssetUrl(e.target.value)}
                        placeholder="/assets/... hoặc /uploads/..."
                      />
                    </Field>
                    <Field label="Đường dẫn asset trang bị in-game (previewUrl riêng biệt)">
                      <input
                        className={inputClass}
                        value={formData.previewUrl}
                        onChange={(e) => setFormData({ ...formData, previewUrl: e.target.value })}
                        placeholder="Để trống nếu dùng chung với ảnh catalog"
                      />
                    </Field>
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: Unified Asset Picker & Live Preview */}
            <div className="flex flex-col gap-4 rounded-xl border border-[var(--admin-border)] bg-[var(--admin-surface-muted)]/50 p-4">
              <div className="flex items-center justify-between border-b border-[var(--admin-border)] pb-2.5">
                <span className="text-xs font-bold uppercase tracking-wider text-[var(--admin-text)]">
                  Hình ảnh & Hiển thị
                </span>
                {formData.imageUrl && (
                  <StatusBadge tone="success">✓ Đã chọn ảnh</StatusBadge>
                )}
              </div>

              {/* Unified 3-Tab Asset Selector (Chỉ cần 1 trong 3 thoả mãn) */}
              <div className="flex flex-col gap-3">
                <div className="flex rounded-lg border border-[var(--admin-border)] bg-[var(--admin-surface)] p-1 text-xs">
                  <button
                    type="button"
                    onClick={() => setAssetTab('upload')}
                    className={`flex-1 py-1.5 px-2 rounded-md font-semibold transition-all ${
                      assetTab === 'upload'
                        ? 'bg-[var(--admin-accent)] text-white shadow-xs'
                        : 'text-[var(--admin-text-muted)] hover:text-[var(--admin-text)]'
                    }`}
                  >
                    📤 Tải lên từ máy
                  </button>
                  <button
                    type="button"
                    onClick={() => setAssetTab('library')}
                    className={`flex-1 py-1.5 px-2 rounded-md font-semibold transition-all ${
                      assetTab === 'library'
                        ? 'bg-[var(--admin-accent)] text-white shadow-xs'
                        : 'text-[var(--admin-text-muted)] hover:text-[var(--admin-text)]'
                    }`}
                  >
                    🖼️ Thư viện Media
                  </button>
                  <button
                    type="button"
                    onClick={() => setAssetTab('url')}
                    className={`flex-1 py-1.5 px-2 rounded-md font-semibold transition-all ${
                      assetTab === 'url'
                        ? 'bg-[var(--admin-accent)] text-white shadow-xs'
                        : 'text-[var(--admin-text-muted)] hover:text-[var(--admin-text)]'
                    }`}
                  >
                    🔗 Nhập URL
                  </button>
                </div>

                {/* Tab 1: Upload */}
                {assetTab === 'upload' && (
                  <div className="rounded-lg bg-[var(--admin-surface)] p-3 border border-[var(--admin-border)]">
                    <AssetUploader
                      category={formData.type}
                      allowMultiple={false}
                      onUploaded={(asset) => {
                        applyAssetUrl(asset.fullUrl);
                      }}
                    />
                  </div>
                )}

                {/* Tab 2: Library */}
                {assetTab === 'library' && (
                  <div className="flex flex-col gap-2 rounded-lg bg-[var(--admin-surface)] p-4 border border-[var(--admin-border)] text-center">
                    <p className="text-xs text-[var(--admin-text-muted)]">
                      Chọn nhanh từ kho asset đồ họa đã tải lên trước đó.
                    </p>
                    <Button
                      type="button"
                      variant="secondary"
                      className="w-full text-xs"
                      onClick={() => setIsLibraryOpen(true)}
                    >
                      🖼️ Duyệt Thư Viện Asset
                    </Button>
                  </div>
                )}

                {/* Tab 3: Direct URL */}
                {assetTab === 'url' && (
                  <div className="flex flex-col gap-2 rounded-lg bg-[var(--admin-surface)] p-3 border border-[var(--admin-border)]">
                    <label className="text-xs font-semibold text-[var(--admin-text-muted)]">
                      Đường dẫn tệp nội bộ
                    </label>
                    <input
                      className={inputClass}
                      value={formData.imageUrl}
                      onChange={(e) => applyAssetUrl(e.target.value)}
                      placeholder="/assets/protectors/card_back_01.png hoặc /uploads/..."
                    />
                    {formData.imageUrl && !isSafeAssetUrl(formData.imageUrl) && (
                      <p className="text-[11px] text-rose-600 font-medium leading-relaxed">
                        ⚠️ URL không hợp lệ: Phải bắt đầu bằng "/" (ví dụ: <code className="font-mono">/assets/...</code> hoặc <code className="font-mono">/uploads/...</code>). Không hỗ trợ link ngoài http/https.
                      </p>
                    )}
                    <p className="text-[11px] text-slate-400">
                      💡 Mẹo: Hệ thống chỉ lưu trữ file cùng domain. Nếu bạn có file ảnh trên máy tính, vui lòng chuyển qua tab <strong>"Tải lên từ máy"</strong> để tự động nén WebP và lấy URL chuẩn.
                    </p>
                  </div>
                )}

                {/* Library Modal */}
                <AssetLibraryModal
                  isOpen={isLibraryOpen}
                  activeCategory={formData.type}
                  onClose={() => setIsLibraryOpen(false)}
                  onSelect={(asset) => {
                    const targetUrl = asset.variants?.fullUrl || asset.fullUrl;
                    applyAssetUrl(targetUrl);
                    setIsLibraryOpen(false);
                  }}
                />
              </div>

              {/* Active Asset Info & Actions */}
              {activeAssetUrl ? (
                <div className="flex flex-col gap-3 rounded-xl border border-[var(--admin-border)] bg-[var(--admin-surface)] p-3 shadow-2xs">
                  <div className="flex items-center justify-between gap-2 border-b border-[var(--admin-border)] pb-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-xs font-semibold text-slate-800 truncate">
                        Ảnh đã chọn
                      </span>
                      <span className="text-[11px] font-mono text-slate-400 truncate max-w-[140px]">
                        {activeAssetUrl}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={handleClearAsset}
                      className="text-xs font-semibold text-rose-600 hover:text-rose-700 transition-colors cursor-pointer"
                    >
                      Gỡ ảnh
                    </button>
                  </div>

                  {/* Framing Editor & Preview if type supports framing */}
                  {supportsFraming ? (
                    <div className="mt-1">
                      {formData.type === 'protector' && (
                        <div className="mb-2 flex items-center justify-between rounded-lg bg-blue-50/70 px-3 py-1.5 border border-blue-200/60">
                          <span className="text-[11px] font-semibold text-blue-700 flex items-center gap-1.5">
                            <span className="h-2 w-2 rounded-full bg-blue-500" />
                            Khung thẻ bài chuẩn (Tỉ lệ 0.716 : 1)
                          </span>
                          <span className="text-[10px] font-mono text-blue-600 bg-white px-1.5 py-0.5 rounded border border-blue-200">
                            Hiển thị toàn bộ thẻ bài
                          </span>
                        </div>
                      )}
                      <AssetPositionEditor
                        confirmed={fitConfirmed}
                        onChange={(assetTransform) => {
                          setFormData((prev) => ({ ...prev, assetTransform }));
                          setFitConfirmed(true);
                        }}
                        onConfirmedChange={setFitConfirmed}
                        onValidationChange={(next) =>
                          setAssetCheck({ ...next, url: activeAssetUrl, type: formData.type })
                        }
                        type={formData.type}
                        url={activeAssetUrl}
                        value={formData.assetTransform}
                      />
                    </div>
                  ) : (
                    /* Simple image preview for legacy skin / emote */
                    <div className="flex flex-col items-center justify-center p-4 bg-[var(--admin-surface-muted)] rounded-lg">
                      <img
                        src={resolveAssetUrl(activeAssetUrl)}
                        alt={formData.name || 'Preview'}
                        className="max-h-40 max-w-full object-contain"
                      />
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center p-8 rounded-xl border border-dashed border-[var(--admin-border-strong)] text-center text-[var(--admin-text-muted)] bg-[var(--admin-surface)]">
                  <span className="text-3xl mb-2">🖼️</span>
                  <span className="text-xs font-semibold">Chưa có ảnh vật phẩm</span>
                  <span className="text-[11px] text-slate-400 mt-1">
                    Tải ảnh lên hoặc chọn từ thư viện để xem trước và căn khung.
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Modal Footer */}
          <div className="mt-6 flex items-center justify-end gap-3 border-t border-[var(--admin-border)] pt-4">
            <Button type="button" variant="secondary" onClick={onClose} disabled={saving}>
              Hủy
            </Button>
            <Button type="submit" variant="primary" disabled={saving}>
              {saving
                ? 'Đang lưu...'
                : editingItem
                ? 'Cập nhật vật phẩm'
                : 'Thêm vật phẩm'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
