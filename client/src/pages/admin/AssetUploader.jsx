import React, { useRef, useState } from 'react';
import { Button } from './ui.jsx';

const API_URL = import.meta.env?.VITE_API_URL ?? 'http://localhost:5000';

export default function AssetUploader({ category = 'misc', onUploaded, disabled = false, allowMultiple = true }) {
  const fileInputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState('');
  const [statusMessage, setStatusMessage] = useState('');

  const handleFileSelect = async (files) => {
    if (!files || files.length === 0 || disabled) return;
    setError('');
    setStatusMessage('');

    const fileList = Array.from(files);

    // Validate size (max 5MB each)
    const invalidFile = fileList.find((f) => f.size > 5 * 1024 * 1024);
    if (invalidFile) {
      return setError(`Tệp ${invalidFile.name} vượt quá 5MB. Vui lòng chọn tệp nhỏ hơn.`);
    }

    const formData = new FormData();
    fileList.forEach((file) => formData.append('files', file));
    formData.append('category', category);

    setUploading(true);
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`${API_URL}/api/admin/assets`, {
        method: 'POST',
        headers: {
          Authorization: token ? `Bearer ${token}` : '',
        },
        body: formData,
      });

      const data = await response.json();
      setUploading(false);

      if (response.ok && data.success) {
        const resultData = data.data;
        const count = Array.isArray(resultData) ? resultData.length : 1;
        const mainAsset = Array.isArray(resultData) ? resultData[0] : resultData;

        // Attach cache busting timestamp versioning
        const versionedAsset = {
          ...mainAsset,
          fullUrl: `${mainAsset.fullUrl}?v=${Date.now()}`,
          thumbUrl: `${mainAsset.thumbUrl}?v=${Date.now()}`,
        };

        setStatusMessage(
          count > 1
            ? `Đã tải lên thành công ${count} tệp!`
            : mainAsset.reused
            ? 'Đã tìm thấy asset tương đương!'
            : 'Upload thành công!'
        );

        if (onUploaded) {
          onUploaded(versionedAsset, resultData);
        }
      } else {
        setError(data.error?.message || data.message || 'Tải tệp lên thất bại.');
      }
    } catch (err) {
      setUploading(false);
      setError('Lỗi kết nối máy chủ khi upload tệp.');
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer?.files?.length) {
      handleFileSelect(e.dataTransfer.files);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        className={`flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-4 text-center transition-colors ${
          dragOver
            ? 'border-[var(--admin-primary,#2563eb)] bg-blue-50/50'
            : 'border-[var(--admin-border,#cbd5e1)] bg-[var(--admin-surface-muted,#f8fafc)]'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple={allowMultiple}
          accept="image/png,image/jpeg,image/webp,image/svg+xml,image/gif"
          className="hidden"
          onChange={(e) => handleFileSelect(e.target.files)}
          disabled={disabled || uploading}
        />
        <div className="text-xs text-slate-600">
          Kéo thả tệp ảnh vào đây hoặc{' '}
          <button
            type="button"
            className="font-semibold text-blue-600 underline hover:text-blue-700"
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled || uploading}
          >
            chọn từ thiết bị {allowMultiple ? '(Hỗ trợ chọn nhiều file)' : ''}
          </button>
        </div>
        <div className="mt-1 text-[11px] text-slate-400">
          PNG, JPG, WebP, SVG, GIF (Tối đa 5MB / file)
        </div>
        {uploading && (
          <div className="mt-2 text-xs font-semibold text-blue-600 animate-pulse">
            Đang xử lý & nén WebP hàng loạt...
          </div>
        )}
      </div>
      {statusMessage && (
        <div className="text-xs font-medium text-emerald-600">{statusMessage}</div>
      )}
      {error && <div className="text-xs font-medium text-rose-600">{error}</div>}
    </div>
  );
}
