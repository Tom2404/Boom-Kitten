import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useAdminApi } from './useAdminApi.js';
import { buildRoutineAdminPayload, createAdminOperationRequestId } from './adminMutation.js';
import { buildLiveOpsCriticalPayload, buildLiveOpsDraftPayload, SAFE_LIVE_OPS_FALLBACK } from './adminLiveOps.js';
import { AdminCard, Alert, Button, ConfirmDialog, EmptyState, Field, SectionHeader, SkeletonBlock, StatusBadge, inputClass } from './ui.jsx';

function apiError(response, fallback) { return response.data?.error?.message || response.data?.message || response.error || fallback; }

export default function LiveOpsPanel({ permissions, adminUsername }) {
  const { request } = useAdminApi();
  const canDraft = permissions.includes('live_ops.draft');
  const canPublish = permissions.includes('live_ops.publish');
  const canRollback = permissions.includes('live_ops.rollback');
  const [items, setItems] = useState([]);
  const [state, setState] = useState({ activeVersion: 0, stateVersion: 0 });
  const [config, setConfig] = useState({ ...SAFE_LIVE_OPS_FALLBACK, features: { ...SAFE_LIVE_OPS_FALLBACK.features } });
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState('');
  const [message, setMessage] = useState(null);
  const [confirmation, setConfirmation] = useState('');
  const [critical, setCritical] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    const response = await request('/api/admin/live-ops/configs');
    setLoading(false);
    if (!response.ok) return setMessage({ tone: 'danger', text: apiError(response, 'Không thể tải Live Ops configs.') });
    const data = response.data.data;
    setItems(data.items || []);
    setState(data.state || { activeVersion: 0, stateVersion: 0 });
    const active = data.items?.find((item) => item.version === data.state?.activeVersion);
    if (active?.config) setConfig({ ...active.config, features: { ...active.config.features } });
  }, [request]);

  useEffect(() => { load(); }, [load]);
  const active = useMemo(() => items.find((item) => item.version === state.activeVersion), [items, state.activeVersion]);

  const send = async (endpoint, body, success) => {
    setBusy(endpoint);
    const response = await request(endpoint, { method: 'POST', body: JSON.stringify(body) });
    setBusy('');
    if (!response.ok) { setMessage({ tone: 'danger', text: apiError(response, 'Thao tác Live Ops thất bại.') }); return null; }
    setMessage({ tone: 'success', text: success });
    await load();
    return response.data.data;
  };

  const createDraft = async (event) => {
    event.preventDefault();
    if (!reason.trim()) return setMessage({ tone: 'danger', text: 'Lý do audit là bắt buộc.' });
    await send('/api/admin/live-ops/configs', buildLiveOpsDraftPayload(config, reason, createAdminOperationRequestId()), 'Đã tạo draft immutable mới.');
  };

  const validateDraft = async (item) => {
    if (!reason.trim()) return setMessage({ tone: 'danger', text: 'Lý do audit là bắt buộc.' });
    await send(`/api/admin/live-ops/configs/${item._id}/validate`, buildRoutineAdminPayload({ expectedVersion: item.__v, reason: reason.trim() }, createAdminOperationRequestId()), `Version ${item.version} đã được validate.`);
  };

  const runCritical = async () => {
    if (!critical || confirmation.trim() !== adminUsername) return;
    const common = { expectedStateVersion: state.stateVersion, reason, confirmationUsername: confirmation, requestId: createAdminOperationRequestId() };
    if (critical.type === 'publish') {
      await send(`/api/admin/live-ops/configs/${critical.item._id}/publish`, buildLiveOpsCriticalPayload({ ...common, expectedVersion: critical.item.__v }), `Đã publish version ${critical.item.version}.`);
    } else {
      await send(`/api/admin/live-ops/configs/${critical.item._id}/rollback`, buildLiveOpsCriticalPayload({ ...common, targetVersion: critical.item.version }), `Đã rollback từ version ${critical.item.version} thành một version mới.`);
    }
    setCritical(null); setConfirmation('');
  };

  const updateFeature = (key, value) => setConfig((current) => ({ ...current, features: { ...current.features, [key]: value } }));

  return <div className="flex flex-col gap-5">
    <SectionHeader title="Live Ops Control Plane" description="Cấu hình runtime có schema/version, draft → validate → publish → rollback; production chỉ đổi qua critical confirmation." actions={<Button onClick={load}>Làm mới</Button>} />
    {message && <Alert tone={message.tone}>{message.text}</Alert>}
    <div className="grid gap-3 sm:grid-cols-3">
      <AdminCard className="p-4"><p className="text-xs font-semibold uppercase text-[var(--admin-text-muted)]">Active version</p><p className="mt-2 font-sans text-3xl font-semibold text-[var(--admin-danger-text)]">v{state.activeVersion || 0}</p></AdminCard>
      <AdminCard className="p-4"><p className="text-xs font-semibold uppercase text-[var(--admin-text-muted)]">State version</p><p className="mt-2 font-sans text-3xl font-semibold">{state.stateVersion || 0}</p></AdminCard>
      <AdminCard className="p-4"><p className="text-xs font-semibold uppercase text-[var(--admin-text-muted)]">Runtime</p><div className="mt-2"><StatusBadge tone={active?.config?.maintenanceMode ? 'danger' : 'success'}>{active?.config?.maintenanceMode ? 'Maintenance' : 'Operational'}</StatusBadge></div></AdminCard>
    </div>

    {canDraft ? <AdminCard className="p-4"><h3 className="font-sans font-semibold">Soạn draft từ cấu hình hiện tại</h3><form onSubmit={createDraft} className="mt-4 grid gap-4 md:grid-cols-3">
      <Field label="Giới hạn phòng active"><input className={inputClass} type="number" min="1" max="10000" value={config.maxActiveRooms} onChange={(e) => setConfig({ ...config, maxActiveRooms: e.target.value })} /></Field>
      <Field label="Reward multiplier"><input className={inputClass} type="number" min="0" max="10" step="0.1" value={config.rewardMultiplier} onChange={(e) => setConfig({ ...config, rewardMultiplier: e.target.value })} /></Field>
      <label className="flex items-center gap-3 border border-[var(--admin-border)] bg-[var(--admin-danger-bg)] p-3 font-semibold"><input type="checkbox" className="h-5 w-5 accent-[var(--admin-accent)]" checked={config.maintenanceMode} onChange={(e) => setConfig({ ...config, maintenanceMode: e.target.checked })} /> Maintenance mode</label>
      {Object.keys(config.features).map((key) => <label key={key} className="flex items-center gap-3 border border-[var(--admin-border)] bg-[var(--admin-surface-muted)] p-3 font-semibold"><input type="checkbox" className="h-5 w-5 accent-blue-600" checked={config.features[key]} onChange={(e) => updateFeature(key, e.target.checked)} /> Feature: {key}</label>)}
      <div className="md:col-span-3"><Field label="Lý do audit"><input className={inputClass} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Ví dụ: Giảm giới hạn phòng trong giờ bảo trì" /></Field></div>
      <Button type="submit" variant="primary" disabled={!!busy} className="md:col-span-3">Tạo draft mới</Button>
    </form></AdminCard> : <Alert tone="info">Chế độ chỉ đọc: chỉ super admin có thể publish/rollback; operator có thể tạo và validate draft.</Alert>}

    <AdminCard className="p-4"><h3 className="font-sans font-semibold">Lịch sử version</h3>{loading ? <div className="mt-4"><SkeletonBlock rows={5} /></div> : items.length === 0 ? <div className="mt-4"><EmptyState title="Chưa có Live Ops config" description="Runtime đang dùng fallback an toàn v0." /></div> : <div className="mt-4 grid gap-3">{items.map((item) => <article key={item._id} className={`rounded-lg border border-[var(--admin-border)] p-4 ${item.version === state.activeVersion ? 'bg-[var(--admin-success-bg)] shadow-[0_1px_2px_rgba(32,35,31,0.03)]' : 'bg-[var(--admin-surface)]'}`}>
      <div className="flex flex-wrap items-start justify-between gap-3"><div><p className="font-sans text-lg font-semibold">Version {item.version} {item.rollbackOf ? `· rollback of v${item.rollbackOf}` : ''}</p><p className="mt-1 text-xs font-bold text-[var(--admin-text-muted)]">Schema v{item.schemaVersion} · created {new Date(item.createdAt).toLocaleString('vi-VN')}</p></div><div className="flex gap-2"><StatusBadge tone={item.version === state.activeVersion ? 'success' : item.status === 'validated' ? 'warning' : 'neutral'}>{item.version === state.activeVersion ? 'active' : item.status}</StatusBadge>{item.validation && <StatusBadge tone={item.validation.valid ? 'success' : 'danger'}>{item.validation.valid ? 'valid' : 'invalid'}</StatusBadge>}</div></div>
      <div className="mt-3 grid gap-2 text-sm sm:grid-cols-2 lg:grid-cols-4"><span><b>Maintenance:</b> {String(item.config.maintenanceMode)}</span><span><b>Max rooms:</b> {item.config.maxActiveRooms}</span><span><b>Reward:</b> ×{item.config.rewardMultiplier}</span><span><b>Flags:</b> {Object.entries(item.config.features).filter(([, on]) => on).map(([key]) => key).join(', ') || 'none'}</span></div>
      {item.validation?.errors?.length > 0 && <Alert tone="danger">{item.validation.errors.join(' · ')}</Alert>}
      <div className="mt-3 flex flex-wrap gap-2">{canDraft && item.status !== 'published' && <Button onClick={() => validateDraft(item)} disabled={!!busy || !reason.trim()}>Validate</Button>}{canPublish && item.status === 'validated' && <Button variant="success" onClick={() => setCritical({ type: 'publish', item })} disabled={!!busy || !reason.trim()}>Publish</Button>}{canRollback && item.status === 'published' && item.version !== state.activeVersion && <Button variant="danger" onClick={() => setCritical({ type: 'rollback', item })} disabled={!!busy || !reason.trim()}>Rollback tới đây</Button>}</div>
    </article>)}</div>}</AdminCard>

    <ConfirmDialog open={!!critical} title={critical?.type === 'publish' ? `Publish version ${critical?.item?.version}?` : `Rollback về nội dung version ${critical?.item?.version}?`} description="Thao tác thay đổi runtime production ngay lập tức. Rollback sẽ tạo một version mới để lịch sử luôn tăng đơn điệu." confirmLabel={critical?.type === 'publish' ? 'Publish production' : 'Rollback production'} confirmDisabled={!!busy || confirmation.trim() !== adminUsername} onConfirm={runCritical} onClose={() => { setCritical(null); setConfirmation(''); }}><div className="grid gap-3"><Field label="Lý do audit"><textarea className={inputClass} rows="3" value={reason} onChange={(e) => setReason(e.target.value)} /></Field><Field label={`Nhập username để xác nhận: ${adminUsername}`}><input className={inputClass} value={confirmation} onChange={(e) => setConfirmation(e.target.value)} autoComplete="off" /></Field></div></ConfirmDialog>
  </div>;
}
