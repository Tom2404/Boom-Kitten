import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Button, ConfirmDialog, Field, inputClass, Toolbar } from './ui.jsx';
import { createAdminOperationRequestId } from './adminMutation.js';
import { buildSavedViewMutation } from './adminSavedViews.js';
import { useAdminApi } from './useAdminApi.js';

export default function SavedViewsBar({ scope, filters, onApply, language = 'vi' }) {
  const en = language === 'en';
  const { request } = useAdminApi();
  const [items, setItems] = useState([]);
  const [selectedId, setSelectedId] = useState('');
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const selected = useMemo(() => items.find((item) => item._id === selectedId), [items, selectedId]);

  const load = useCallback(async () => {
    setError('');
    const response = await request(`/api/admin/saved-views?scope=${encodeURIComponent(scope)}`);
    if (response.ok) setItems(response.data?.data?.items || []);
    else setError(response.data?.error?.message || (en ? 'Could not load saved views.' : 'Không thể tải saved views.'));
  }, [en, request, scope]);

  useEffect(() => { load(); }, [load]);

  const save = async () => {
    if (!name.trim()) return;
    setBusy(true); setError('');
    const body = buildSavedViewMutation({ scope, name, filters, requestId: createAdminOperationRequestId() });
    const response = await request('/api/admin/saved-views', { method: 'POST', body: JSON.stringify(body) });
    if (response.ok) { setName(''); await load(); setSelectedId(response.data?.data?._id || ''); }
    else setError(response.data?.error?.message || (en ? 'Could not save this view.' : 'Không thể lưu bộ lọc.'));
    setBusy(false);
  };

  const remove = async () => {
    if (!selected) return;
    setBusy(true); setError(''); setConfirmDelete(false);
    const response = await request(`/api/admin/saved-views/${selected._id}`, { method: 'DELETE', body: JSON.stringify({ scope, version: selected.__v, requestId: createAdminOperationRequestId() }) });
    if (response.ok) { setSelectedId(''); await load(); }
    else setError(response.data?.error?.message || (en ? 'Could not delete this view.' : 'Không thể xóa saved view.'));
    setBusy(false);
  };

  return <>
    <Toolbar>
      <Field label={en ? 'Saved view' : 'Bộ lọc đã lưu'}><select className={inputClass} value={selectedId} onChange={(event) => setSelectedId(event.target.value)} disabled={busy}><option value="">{en ? 'Choose a view…' : 'Chọn saved view…'}</option>{items.map((item) => <option key={item._id} value={item._id}>{item.name}</option>)}</select></Field>
      <Button type="button" variant="secondary" disabled={!selected || busy} onClick={() => onApply(selected.filters || {})}>{en ? 'Apply' : 'Áp dụng'}</Button>
      <Button type="button" variant="danger" disabled={!selected || busy} onClick={() => setConfirmDelete(true)}>{en ? 'Delete' : 'Xóa'}</Button>
      <Field label={en ? 'Save current filters as' : 'Lưu bộ lọc hiện tại'}><input className={inputClass} value={name} maxLength={80} onChange={(event) => setName(event.target.value)} placeholder={en ? 'View name' : 'Tên bộ lọc'} /></Field>
      <Button type="button" variant="primary" disabled={!name.trim() || busy} onClick={save}>{busy ? '…' : (en ? 'Save' : 'Lưu')}</Button>
    </Toolbar>
    {error && <Alert tone="danger">{error}</Alert>}
    <ConfirmDialog open={confirmDelete} title={en ? 'Delete saved view?' : 'Xóa saved view?'} description={selected ? `${selected.name} · ${scope}` : ''} confirmLabel={en ? 'Delete' : 'Xóa'} onClose={() => setConfirmDelete(false)} onConfirm={remove} confirmDisabled={busy} />
  </>;
}
