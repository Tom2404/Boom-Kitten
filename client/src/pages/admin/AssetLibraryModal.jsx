import React, { useEffect, useState } from 'react';
import { Alert, Button, Field, inputClass } from './ui.jsx';
import { formatNumber } from './utils.js';
import { resolveAssetUrl } from '../../utils/shopEquipment.js';

const API_URL = import.meta.env?.VITE_API_URL ?? 'http://localhost:5000';

export default function AssetLibraryModal({ isOpen, onClose, onSelect, activeCategory = '' }) {
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState(activeCategory || 'all');
  const [sort, setSort] = useState('newest');
  const [viewMode, setViewMode] = useState('grid');
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [usageData, setUsageData] = useState(null);
  const [loadingUsage, setLoadingUsage] = useState(false);
  const [actionMessage, setActionMessage] = useState({ tone: '', text: '' });

  const loadAssets = async () => {
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('accessToken');
      const params = new URLSearchParams({
        category,
        search,
        sort,
        limit: '40',
      });

      const res = await fetch(`${API_URL}/api/admin/assets?${params.toString()}`, {
        headers: { Authorization: token ? `Bearer ${token}` : '' },
      });
      const json = await res.json();
      setLoading(false);

      if (res.ok && json.data) {
        setAssets(json.data);
      } else {
        setError(json.error?.message || json.message || 'Không thể tải thư viện tài nguyên.');
      }
    } catch (err) {
      setLoading(false);
      setError('Lỗi kết nối máy chủ khi lấy danh sách tài nguyên.');
    }
  };

  useEffect(() => {
    if (isOpen) {
      setCategory(activeCategory || 'all');
      loadAssets();
    }
  }, [isOpen, category, sort]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadAssets();
  };

  const inspectAsset = async (asset) => {
    setSelectedAsset(asset);
    setUsageData(null);
    setLoadingUsage(true);
    setActionMessage({ tone: '', text: '' });

    try {
      const token = localStorage.getItem('accessToken');
      const res = await fetch(`${API_URL}/api/admin/assets/${asset._id}/usage`, {
        headers: { Authorization: token ? `Bearer ${token}` : '' },
      });
      const json = await res.json();
      setLoadingUsage(false);

      if (res.ok) {
        setUsageData(json);
      }
    } catch (err) {
      setLoadingUsage(false);
    }
  };

  const archiveAsset = async (assetId) => {
    if (!window.confirm('Bạn có chắc chắn muốn lưu trữ (soft delete) tài nguyên này?')) return;
    try {
      const token = localStorage.getItem('accessToken');
      const res = await fetch(`${API_URL}/api/admin/assets/${assetId}`, {
        method: 'DELETE',
        headers: { Authorization: token ? `Bearer ${token}` : '' },
      });
      const json = await res.json();

      if (res.ok) {
        setActionMessage({ tone: 'success', text: json.message || 'Đã lưu trữ tài nguyên.' });
        loadAssets();
        if (selectedAsset?._id === assetId) {
          setSelectedAsset(null);
        }
      } else {
        setActionMessage({ tone: 'danger', text: json.error?.message || 'Không thể lưu trữ tài nguyên.' });
      }
    } catch (err) {
      setActionMessage({ tone: 'danger', text: 'Lỗi máy chủ khi lưu trữ tài nguyên.' });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="flex h-[90vh] w-full max-w-5xl flex-col rounded-xl border border-[var(--admin-border,#e2e8f0)] bg-white shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 bg-slate-50">
          <div>
            <h2 className="font-sans text-lg font-bold text-slate-900">Thư Viện Tài Nguyên Media (Asset Library)</h2>
            <p className="text-xs text-slate-500">Tra cứu, tái sử dụng và quản lý tài nguyên ảnh đã tải lên</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200 hover:text-slate-700"
          >
            ✕
          </button>
        </div>

        {/* Filters Toolbar */}
        <div className="flex flex-wrap items-center gap-3 border-b border-slate-200 bg-white px-6 py-3">
          <form onSubmit={handleSearchSubmit} className="flex-1 md:min-w-48">
            <input
              type="search"
              className={inputClass}
              placeholder="Tìm theo tên asset..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </form>
          <select className={inputClass} value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="all">Tất cả phân loại</option>
            <option value="protector">Protector</option>
            <option value="avatar_frame">Khung avatar</option>
            <option value="field">Field</option>
            <option value="skin">Skin bài</option>
            <option value="emote">Biểu cảm</option>
            <option value="misc">Khác</option>
          </select>
          <select className={inputClass} value={sort} onChange={(e) => setSort(e.target.value)}>
            <option value="newest">Mới nhất</option>
            <option value="oldest">Cũ nhất</option>
            <option value="name">Tên A-Z</option>
            <option value="usage">Dùng nhiều nhất</option>
          </select>
          <div className="flex rounded-md border border-slate-300 p-0.5">
            <button
              type="button"
              className={`px-2.5 py-1 text-xs font-semibold rounded ${viewMode === 'grid' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
              onClick={() => setViewMode('grid')}
            >
              Lưới
            </button>
            <button
              type="button"
              className={`px-2.5 py-1 text-xs font-semibold rounded ${viewMode === 'list' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
              onClick={() => setViewMode('list')}
            >
              Danh sách
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex flex-1 overflow-hidden">
          {/* Main Grid/List View */}
          <div className="flex-1 overflow-y-auto p-6">
            {actionMessage.text && (
              <div className="mb-4">
                <Alert tone={actionMessage.tone}>{actionMessage.text}</Alert>
              </div>
            )}
            {error && <Alert tone="danger">{error}</Alert>}
            {loading ? (
              <div className="flex h-48 items-center justify-center text-sm text-slate-500 animate-pulse">
                Đang tải thư viện tài nguyên...
              </div>
            ) : assets.length === 0 ? (
              <div className="flex h-48 flex-col items-center justify-center text-center text-slate-400">
                <p className="text-sm font-medium">Chưa có tài nguyên nào phù hợp</p>
                <p className="text-xs">Thử thay đổi từ khóa hoặc bộ lọc tìm kiếm.</p>
              </div>
            ) : viewMode === 'grid' ? (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                {assets.map((asset) => {
                  const thumb = resolveAssetUrl(asset.variants?.thumbUrl || asset.variants?.fullUrl);
                  return (
                    <div
                      key={asset._id}
                      className={`group relative flex flex-col justify-between rounded-lg border p-2 transition-all hover:border-slate-400 hover:shadow-md ${
                        selectedAsset?._id === asset._id ? 'border-blue-600 bg-blue-50/30 ring-2 ring-blue-500/20' : 'border-slate-200 bg-white'
                      }`}
                    >
                      <div
                        className="flex h-28 w-full items-center justify-center rounded bg-slate-100 p-2 cursor-pointer"
                        onClick={() => inspectAsset(asset)}
                      >
                        <img
                          src={thumb}
                          alt={asset.originalName}
                          loading="lazy"
                          className="max-h-full max-w-full object-contain"
                        />
                      </div>
                      <div className="mt-2 flex flex-col gap-1">
                        <div className="truncate text-xs font-semibold text-slate-800" title={asset.originalName}>
                          {asset.originalName}
                        </div>
                        <div className="flex items-center justify-between text-[11px] text-slate-400">
                          <span className="uppercase">{asset.category}</span>
                          <span>{(asset.size / 1024).toFixed(0)} KB</span>
                        </div>
                        <div className="mt-1 flex gap-1">
                          <Button
                            variant="primary"
                            className="w-full text-[11px] py-1"
                            onClick={() => {
                              onSelect(asset);
                              onClose();
                            }}
                          >
                            Chọn asset
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col divide-y divide-slate-100 rounded-lg border border-slate-200">
                {assets.map((asset) => {
                  const thumb = resolveAssetUrl(asset.variants?.thumbUrl || asset.variants?.fullUrl);
                  return (
                    <div
                      key={asset._id}
                      className="flex items-center justify-between p-3 hover:bg-slate-50"
                    >
                      <div className="flex items-center gap-3 cursor-pointer" onClick={() => inspectAsset(asset)}>
                        <div className="h-12 w-12 shrink-0 rounded border border-slate-200 bg-slate-100 p-1">
                          <img src={thumb} alt={asset.originalName} className="h-full w-full object-contain" />
                        </div>
                        <div>
                          <div className="text-xs font-semibold text-slate-900">{asset.originalName}</div>
                          <div className="text-[11px] text-slate-400">
                            {asset.category} • {asset.width}x{asset.height}px • {(asset.size / 1024).toFixed(0)} KB
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="secondary" className="text-xs" onClick={() => inspectAsset(asset)}>Chi tiết</Button>
                        <Button
                          variant="primary"
                          className="text-xs"
                          onClick={() => {
                            onSelect(asset);
                            onClose();
                          }}
                        >
                          Chọn
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Inspector Side Drawer */}
          {selectedAsset && (
            <div className="w-80 border-l border-slate-200 bg-slate-50/50 p-4 flex flex-col justify-between overflow-y-auto">
              <div>
                <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                  <h3 className="text-xs font-bold uppercase text-slate-700">Chi tiết Asset</h3>
                  <button onClick={() => setSelectedAsset(null)} className="text-slate-400 hover:text-slate-600">✕</button>
                </div>
                <div className="mt-4 flex h-40 w-full items-center justify-center rounded-lg border border-slate-200 bg-white p-3">
                  <img
                    src={resolveAssetUrl(selectedAsset.variants?.fullUrl)}
                    alt={selectedAsset.originalName}
                    className="max-h-full max-w-full object-contain"
                  />
                </div>
                <dl className="mt-4 grid gap-2 text-xs">
                  <div><dt className="text-slate-400">Tên gốc:</dt><dd className="font-semibold text-slate-800 break-all">{selectedAsset.originalName}</dd></div>
                  <div><dt className="text-slate-400">Độ phân giải:</dt><dd className="font-mono">{selectedAsset.width} x {selectedAsset.height} px</dd></div>
                  <div><dt className="text-slate-400">Dung lượng:</dt><dd className="font-mono">{(selectedAsset.size / 1024).toFixed(1)} KB</dd></div>
                  <div><dt className="text-slate-400">Định dạng:</dt><dd className="font-mono">{selectedAsset.mimeType}</dd></div>
                  <div><dt className="text-slate-400">Đường dẫn đầy đủ:</dt><dd className="font-mono text-[10px] break-all text-blue-600">{selectedAsset.variants?.fullUrl}</dd></div>
                </dl>

                {/* Usage Detection section */}
                <div className="mt-4 rounded-lg border border-slate-200 bg-white p-3">
                  <h4 className="text-xs font-semibold text-slate-800">Theo dõi sử dụng (Usage Detection)</h4>
                  {loadingUsage ? (
                    <div className="mt-2 text-[11px] text-slate-400 animate-pulse">Đang kiểm tra shop item...</div>
                  ) : usageData ? (
                    <div className="mt-2">
                      <div className="text-xs font-bold text-slate-700">
                        {usageData.usageCount > 0 ? `Đang dùng tại ${usageData.usageCount} vật phẩm:` : 'Chưa được dùng ở vật phẩm nào.'}
                      </div>
                      {usageData.usedByItems?.length > 0 && (
                        <ul className="mt-1 max-h-24 overflow-y-auto divide-y divide-slate-100 text-[11px]">
                          {usageData.usedByItems.map((item) => (
                            <li key={item._id} className="py-1 text-slate-600">
                              • <strong className="text-slate-900">{item.name}</strong> ({item.type})
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ) : null}
                </div>
              </div>

              <div className="mt-4 flex flex-col gap-2 border-t border-slate-200 pt-3">
                <Button
                  variant="primary"
                  className="w-full text-xs"
                  onClick={() => {
                    onSelect(selectedAsset);
                    onClose();
                  }}
                >
                  Chọn Asset Này
                </Button>
                <Button
                  variant="danger"
                  className="w-full text-xs"
                  onClick={() => archiveAsset(selectedAsset._id)}
                >
                  Lưu Trữ (Soft Delete)
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
