import React, { useEffect, useState } from 'react';
import { useAdminApi } from './useAdminApi.js';
import { Alert, Button, DataTable, EmptyState, Field, inputClass, Pagination, SectionHeader, SkeletonBlock, StatusBadge, Toolbar } from './ui.jsx';
import { formatDateTime } from './utils.js';
import { createAdminOperationRequestId } from './adminMutation.js';
import SavedViewsBar from './SavedViewsBar.jsx';

const toIsoOrEmpty = (value) => value ? new Date(value).toISOString() : '';

export default function LogsPanel({ language = 'vi', permissions = [], onNavigate }) {
  const en = language === 'en';
  const { request } = useAdminApi();
  const [logs, setLogs] = useState([]);
  const [logType, setLogType] = useState('transaction');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [userId, setUserId] = useState('');
  const [type, setType] = useState('');
  const [currency, setCurrency] = useState('');
  const [targetType, setTargetType] = useState('');
  const [targetId, setTargetId] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [exporting, setExporting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const timer = setTimeout(async () => {
      setLoading(true);
      setError('');
      const query = logType === 'audit'
        ? new URLSearchParams({ page, limit: 15, actorId: userId, targetType, targetId, action: type, from: toIsoOrEmpty(from), to: toIsoOrEmpty(to) })
        : new URLSearchParams({ page, limit: 15, logType, userId, type, currency });
      const res = await request(logType === 'audit' ? `/api/admin/audit-logs?${query}` : `/api/admin/transactions?${query}`);
      if (res.ok && res.data?.success) {
        setLogs(res.data.data.items || res.data.data.logs || []);
        setTotalPages(res.data.data.pagination?.totalPages || 1);
      } else {
        setError(res.data?.error?.message || res.data?.message || res.error || 'Không thể tải nhật ký.');
      }
      setLoading(false);
    }, 250);
    return () => clearTimeout(timer);
  }, [request, page, logType, userId, type, currency, targetType, targetId, from, to]);

  const exportAudit = async () => {
    setExporting(true);
    const response = await request('/api/admin/audit-logs/exports', { method: 'POST', body: JSON.stringify({ actorId: userId, targetType, targetId, action: type, from: toIsoOrEmpty(from), to: toIsoOrEmpty(to), requestId: createAdminOperationRequestId() }) });
    setExporting(false);
    if (response.ok) onNavigate?.('jobs');
    else setError(response.data?.error?.message || (en ? 'Could not queue audit export.' : 'Không thể tạo audit export job.'));
  };

  return (
    <div className="flex flex-col gap-5">
      <SectionHeader title={en ? 'System logs' : 'Nhật ký hệ thống'} description={en ? 'Review economy transactions and append-only administrative audit logs.' : 'Tra cứu giao dịch số dư và audit log append-only cho thao tác quản trị.'} actions={logType === 'audit' && permissions.includes('audit.export') ? <Button disabled={exporting} onClick={exportAudit}>{exporting ? 'Queuing…' : (en ? 'Export current filter' : 'Export bộ lọc')}</Button> : null} />
      {error && <Alert tone="danger">{error}</Alert>}
      <SavedViewsBar scope="logs" language={language} filters={{ logType, userId, type, currency, targetType, targetId, from, to }} onApply={(saved) => { setLogType(saved.logType || 'transaction'); setUserId(saved.userId || saved.actorId || ''); setType(saved.type || saved.action || ''); setCurrency(saved.currency || ''); setTargetType(saved.targetType || ''); setTargetId(saved.targetId || ''); setFrom(saved.from || ''); setTo(saved.to || ''); setPage(1); }} />

      <Toolbar>
        <Field label={en ? 'Log type' : 'Loại nhật ký'}>
          <select className={inputClass} value={logType} onChange={(event) => { setLogType(event.target.value); setPage(1); setType(''); }}>
            <option value="transaction">{en ? 'Economy transactions' : 'Giao dịch số dư'}</option>
            <option value="audit">{en ? 'Admin audit' : 'Audit admin'}</option>
          </select>
        </Field>
        <Field label={logType === 'audit' ? 'Actor ID' : (en ? 'User / Admin' : 'Người dùng / Admin')}>
          <input className={inputClass} type="search" value={userId} onChange={(event) => { setUserId(event.target.value); setPage(1); }} placeholder={logType === 'audit' ? 'Mongo actor ID' : 'Username, email hoặc ID'} />
        </Field>
        <Field label={logType === 'transaction' ? (en ? 'Transaction type' : 'Loại giao dịch') : (en ? 'Action' : 'Hành động')}>
          {logType === 'audit' ? <input className={inputClass} value={type} onChange={(event) => { setType(event.target.value); setPage(1); }} placeholder="PLAYER_CURRENCY_ADJUSTED" /> : <select className={inputClass} value={type} onChange={(event) => { setType(event.target.value); setPage(1); }}>
            <option value="">{en ? 'All' : 'Tất cả'}</option>
              <>
                <option value="purchase">Mua hàng</option>
                <option value="earn">Nhận thưởng</option>
                <option value="spend">Tiêu dùng</option>
                <option value="admin_adjust">Admin sửa</option>
              </>
          </select>}
        </Field>
        {logType === 'transaction' && (
          <Field label={en ? 'Currency' : 'Loại ví'}>
            <select className={inputClass} value={currency} onChange={(event) => { setCurrency(event.target.value); setPage(1); }}>
              <option value="">{en ? 'All' : 'Tất cả'}</option>
              <option value="coin">GoldCoin</option>
              <option value="gem">PinkCoin</option>
            </select>
          </Field>
        )}
        {logType === 'audit' && <><Field label={en ? 'Target type' : 'Loại đối tượng'}><input className={inputClass} value={targetType} onChange={(event) => { setTargetType(event.target.value); setPage(1); }} placeholder="user, room, tournament…" /></Field><Field label="Target ID"><input className={inputClass} value={targetId} onChange={(event) => { setTargetId(event.target.value); setPage(1); }} /></Field><Field label={en ? 'From' : 'Từ'}><input className={inputClass} type="datetime-local" value={from} onChange={(event) => { setFrom(event.target.value); setPage(1); }} /></Field><Field label={en ? 'To' : 'Đến'}><input className={inputClass} type="datetime-local" value={to} onChange={(event) => { setTo(event.target.value); setPage(1); }} /></Field></>}
      </Toolbar>

      {loading ? <SkeletonBlock rows={5} /> : logs.length === 0 ? (
        <EmptyState title={en ? 'No matching logs' : 'Không có nhật ký phù hợp'} description={en ? 'Try changing the filters or search value.' : 'Thử đổi bộ lọc hoặc kiểm tra lại ID.'} />
      ) : logType === 'transaction' ? (
        <>
          <div className="hidden lg:block">
            <DataTable columns={en ? ['Time', 'Account', 'Type', 'Change', 'Balance', 'Description', 'Actor'] : ['Thời gian', 'Tài khoản', 'Loại', 'Biến động', 'Số dư', 'Mô tả', 'Tác nhân']}>
              {logs.map((log) => (
                <tr key={log._id}>
                  <td className="px-4 py-3 font-semibold text-slate-500">{formatDateTime(log.createdAt)}</td>
                  <td className="px-4 py-3 font-bold">{log.userId?.username || 'Hệ thống'}</td>
                  <td className="px-4 py-3"><StatusBadge>{log.type}</StatusBadge></td>
                  <td className={`px-4 py-3 font-semibold ${log.amount >= 0 ? 'text-[var(--admin-success-text)]' : 'text-[var(--admin-danger-text)]'}`}>{log.amount >= 0 ? `+${log.amount}` : log.amount} {log.currency}</td>
                  <td className="px-4 py-3 font-semibold text-slate-600">
                    {log.balanceBefore ?? '-'} <span className="text-slate-300">to</span> {log.balanceAfter ?? '-'}
                  </td>
                  <td className="px-4 py-3 font-semibold text-slate-600">{log.description}</td>
                  <td className="px-4 py-3 font-semibold text-slate-500">{log.createdBy || 'system'}</td>
                </tr>
              ))}
            </DataTable>
          </div>
          <div className="grid gap-3 lg:hidden">
            {logs.map((log) => (
              <article key={log._id} className="rounded-lg border border-[var(--admin-border)] bg-[var(--admin-surface)] p-4 shadow-[0_1px_2px_rgba(32,35,31,0.03)]">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{log.userId?.username || 'Hệ thống'}</p>
                    <p className="text-xs font-semibold text-slate-500">{formatDateTime(log.createdAt)}</p>
                  </div>
                  <StatusBadge>{log.type}</StatusBadge>
                </div>
                <p className={`mt-3 text-lg font-semibold ${log.amount >= 0 ? 'text-[var(--admin-success-text)]' : 'text-[var(--admin-danger-text)]'}`}>{log.amount >= 0 ? `+${log.amount}` : log.amount} {log.currency}</p>
                <p className="mt-1 text-sm font-semibold text-slate-600">{log.description}</p>
                <p className="mt-2 text-xs font-bold text-slate-400">Số dư: {log.balanceBefore ?? '-'} to {log.balanceAfter ?? '-'} · {log.createdBy || 'system'}</p>
              </article>
            ))}
          </div>
        </>
      ) : (
        <>
          <div className="hidden lg:block">
            <DataTable columns={en ? ['Time', 'Admin', 'Action', 'Target', 'Before', 'After', 'Reason'] : ['Thời gian', 'Admin', 'Hành động', 'Đối tượng', 'Trước', 'Sau', 'Lý do']}>
              {logs.map((log) => (
                <tr key={log._id}>
                  <td className="px-4 py-3 font-semibold text-slate-500">{formatDateTime(log.createdAt)}</td>
                  <td className="px-4 py-3 font-bold">{log.actorUsername || log.adminId?.username || 'Admin'}<span className="block font-mono text-[10px] text-slate-400">{log.actorRole}</span></td>
                  <td className="px-4 py-3"><StatusBadge tone="warning">{log.action}</StatusBadge></td>
                  <td className="px-4 py-3 font-mono text-xs text-slate-500">{log.targetType} ({log.targetId || '-'})</td>
                  <td className="max-w-[240px] px-4 py-3 font-mono text-xs text-slate-500"><details><summary className="cursor-pointer font-sans font-bold">{en ? 'View before' : 'Xem trước'}</summary><pre className="mt-2 max-h-48 overflow-auto whitespace-pre-wrap">{log.before ? JSON.stringify(log.before, null, 2) : '-'}</pre></details></td>
                  <td className="max-w-[240px] px-4 py-3 font-mono text-xs text-slate-700"><details><summary className="cursor-pointer font-sans font-bold">{en ? 'View after' : 'Xem sau'}</summary><pre className="mt-2 max-h-48 overflow-auto whitespace-pre-wrap">{log.after ? JSON.stringify(log.after, null, 2) : '-'}</pre></details></td>
                  <td className="px-4 py-3 font-semibold text-slate-600">{log.reason || '-'}</td>
                </tr>
              ))}
            </DataTable>
          </div>
          <div className="grid gap-3 lg:hidden">
            {logs.map((log) => (
              <article key={log._id} className="rounded-lg border border-[var(--admin-border)] bg-[var(--admin-surface)] p-4 shadow-[0_1px_2px_rgba(32,35,31,0.03)]">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{log.actorUsername || log.adminId?.username || 'Admin'}</p>
                    <p className="text-xs font-semibold text-slate-500">{formatDateTime(log.createdAt)}</p>
                  </div>
                  <StatusBadge tone="warning">{log.action}</StatusBadge>
                </div>
                <p className="mt-2 font-mono text-xs font-semibold text-slate-500">{log.targetType} ({log.targetId || '-'})</p>
                <p className="mt-2 text-sm font-semibold text-slate-700">{log.reason || '-'}</p>
                <details className="mt-2 text-xs"><summary className="cursor-pointer font-bold">Diff</summary><pre className="mt-2 overflow-auto whitespace-pre-wrap bg-[var(--admin-surface-muted)] p-2">{JSON.stringify({ before: log.before, after: log.after }, null, 2)}</pre></details>
              </article>
            ))}
          </div>
        </>
      )}

      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
    </div>
  );
}
