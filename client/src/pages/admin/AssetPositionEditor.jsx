import React, { useEffect, useRef, useState } from 'react';
import {
  DEFAULT_ASSET_TRANSFORM,
  getAssetTransformStyle,
  needsAssetFraming,
  normalizeAssetTransform,
  resolveAssetUrl,
} from '../../utils/shopEquipment.js';
import { Alert, Button, inputClass } from './ui.jsx';

const frameClass = {
  protector: 'aspect-[5/7] max-w-48',
  avatar_frame: 'aspect-square max-w-64',
  field: 'aspect-video max-w-full',
};

export default function AssetPositionEditor({
  confirmed,
  onChange,
  onConfirmedChange,
  onValidationChange,
  type,
  url,
  value,
}) {
  const drag = useRef(null);
  const [state, setState] = useState({ status: 'loading', requiresFraming: false, dimensions: '' });
  const transform = normalizeAssetTransform(value);

  useEffect(() => {
    const next = { status: url ? 'loading' : 'idle', requiresFraming: false, dimensions: '' };
    setState(next);
    onValidationChange(next);
  }, [type, url]); // onValidationChange is intentionally excluded: URL/type own validation lifecycle.

  const update = (patch) => {
    onChange(normalizeAssetTransform({ ...transform, ...patch }));
    onConfirmedChange(false);
  };

  const handleLoad = (event) => {
    const { naturalWidth: width, naturalHeight: height } = event.currentTarget;
    const next = {
      status: 'ready',
      requiresFraming: needsAssetFraming(type, width, height),
      dimensions: `${width} × ${height}px`,
    };
    setState(next);
    onValidationChange(next);
  };

  const handleError = () => {
    const next = { status: 'error', requiresFraming: false, dimensions: '' };
    setState(next);
    onValidationChange(next);
    onConfirmedChange(false);
  };

  const onPointerDown = (event) => {
    if (state.status !== 'ready') return;
    event.currentTarget.setPointerCapture(event.pointerId);
    drag.current = { pointerId: event.pointerId, clientX: event.clientX, clientY: event.clientY, ...transform };
  };

  const onPointerMove = (event) => {
    if (!drag.current || drag.current.pointerId !== event.pointerId) return;
    const { width, height } = event.currentTarget.getBoundingClientRect();
    update({
      x: drag.current.x + ((event.clientX - drag.current.clientX) / width) * 100,
      y: drag.current.y + ((event.clientY - drag.current.clientY) / height) * 100,
    });
  };

  const stopDragging = (event) => {
    if (drag.current?.pointerId === event.pointerId) drag.current = null;
  };

  return (
    <section className="grid gap-3" aria-labelledby="asset-framing-title">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h4 id="asset-framing-title" className="text-sm font-semibold text-[var(--admin-text)]">
            {type === 'protector' ? 'Căn khung thẻ bài (Tỉ lệ chuẩn 0.716 : 1)' : 'Căn asset trong khung chuẩn'}
          </h4>
          <p className="mt-1 text-xs text-[var(--admin-text-muted)]">
            {type === 'protector' ? 'Toàn bộ thẻ bài hiển thị đúng tỉ lệ 0.716 : 1. Kéo để chỉnh vị trí hoặc zoom nếu cần.' : 'Kéo ảnh để đổi vị trí, sau đó chỉnh zoom nếu cần.'}
          </p>
        </div>
        {state.dimensions && <span className="font-mono text-xs text-[var(--admin-text-muted)]">{state.dimensions}</span>}
      </div>

      <div
        className={`relative mx-auto w-full touch-none cursor-move overflow-hidden rounded-xl border border-[var(--admin-border-strong)] bg-[var(--admin-surface-muted)] shadow-xs ${frameClass[type] || frameClass.protector}`}
        style={type === 'protector' ? { aspectRatio: '0.716 / 1', maxWidth: '13rem' } : undefined}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={stopDragging}
        onPointerCancel={stopDragging}
      >
        <span className="absolute inset-0 grid place-items-center text-xs font-medium text-[var(--admin-text-muted)]">Đang tải preview…</span>
        <img
          key={`${type}:${url}`}
          src={resolveAssetUrl(url)}
          alt=""
          draggable="false"
          className={`absolute inset-0 h-full w-full select-none ${type === 'avatar_frame' ? 'object-contain' : 'object-cover'}`}
          style={getAssetTransformStyle(transform)}
          onLoad={handleLoad}
          onError={handleError}
        />
        <span className="pointer-events-none absolute inset-0 border border-dashed border-white/70" aria-hidden="true" />
      </div>

      {state.status === 'error' && <Alert tone="danger">Không thể tải asset như một hình ảnh hợp lệ. Kiểm tra lại URL hoặc định dạng file.</Alert>}
      {state.requiresFraming && !confirmed && <Alert tone="warning">Ảnh không khớp tỉ lệ khung. Hãy kéo/zoom rồi xác nhận căn khung trước khi lưu.</Alert>}
      {state.requiresFraming && confirmed && <Alert tone="success">Đã xác nhận vùng hiển thị cho asset.</Alert>}

      <div className="grid gap-3 sm:grid-cols-3">
        {[['Zoom', 'scale', 0.5, 3, 0.05], ['Vị trí X', 'x', -50, 50, 1], ['Vị trí Y', 'y', -50, 50, 1]].map(([label, key, min, max, step]) => (
          <label key={key} className="grid gap-1 text-xs font-medium text-[var(--admin-text)]">
            <span className="flex justify-between"><span>{label}</span><output>{transform[key]}</output></span>
            <input className={inputClass} type="range" min={min} max={max} step={step} value={transform[key]} onChange={(event) => update({ [key]: Number(event.target.value) })} />
          </label>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="secondary" onClick={() => update(DEFAULT_ASSET_TRANSFORM)}>Đặt lại</Button>
        {state.requiresFraming && <Button type="button" variant="primary" onClick={() => onConfirmedChange(true)}>Xác nhận căn khung</Button>}
      </div>
    </section>
  );
}
