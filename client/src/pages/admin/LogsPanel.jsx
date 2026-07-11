import React, { useEffect, useState } from 'react';
import { useAdminApi } from './useAdminApi.js';
import { Alert, DataTable, EmptyState, Field, inputClass, Pagination, SectionHeader, SkeletonBlock, StatusBadge, Toolbar } from './ui.jsx';
import { formatDateTime } from './utils.js';

export default function LogsPanel({ language = 'vi' }) {
  const en = language === 'en';
  const { request } = useAdminApi();
  const [logs, setLogs] = useState([]);
  const [logType, setLogType] = useState('transaction');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [userId, setUserId] = useState('');
  const [type, setType] = useState('');
  const [currency, setCurrency] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const timer = setTimeout(async () => {
      setLoading(true);
      setError('');
      const query = new URLSearchParams({ page, limit: 15, logType, userId, type, currency });
      const res = await request(`/api/admin/transactions?${query}`);
      if (res.ok && res.data?.success) {
        setLogs(res.data.data.logs || []);
        setTotalPages(res.data.data.pagination?.totalPages || 1);
      } else {
        setError(res.data?.message || res.error || 'Không thể tải nhật ký.');
      }
      setLoading(false);
    }, 250);
    return () => clearTimeout(timer);
  }, [request, page, logType, userId, type, currency]);

  return (
    <div className="flex flex-col gap-5">
      <SectionHeader title={en ? 'System logs' : 'Nhật ký hệ thống'} description={en ? 'Review economy transactions and administrative audit logs.' : 'Tra cứu giao dịch số dư và audit log cho các thao tác quản trị.'} />
      {error && <Alert tone="danger">{error}</Alert>}

      <Toolbar>
        <Field label={en ? 'Log type' : 'Loại nhật ký'}>
          <select className={inputClass} value={logType} onChange={(event) => { setLogType(event.target.value); setPage(1); setType(''); }}>
            <option value="transaction">{en ? 'Economy transactions' : 'Giao dịch số dư'}</option>
            <option value="audit">{en ? 'Admin audit' : 'Audit admin'}</option>
          </select>
        </Field>
        <Field label={en ? 'User / Admin' : 'Người dùng / Admin'}>
          <input className={inputClass} type="search" value={userId} onChange={(event) => { setUserId(event.target.value); setPage(1); }} placeholder="Username, email hoặc ID" />
        </Field>
        <Field label={logType === 'transaction' ? (en ? 'Transaction type' : 'Loại giao dịch') : (en ? 'Action' : 'Hành động')}>
          <select className={inputClass} value={type} onChange={(event) => { setType(event.target.value); setPage(1); }}>
            <option value="">{en ? 'All' : 'Tất cả'}</option>
            {logType === 'transaction' ? (
              <>
                <option value="purchase">Mua hàng</option>
                <option value="earn">Nhận thưởng</option>
                <option value="spend">Tiêu dùng</option>
                <option value="admin_adjust">Admin sửa</option>
                <option value="season_reward">Quà mùa giải</option>
                <option value="elo_adjust">Sửa ELO</option>
              </>
            ) : (
              <>
                <option value="USER_BAN">Khóa User</option>
                <option value="ROLE_CHANGE">Đổi quyền</option>
                <option value="CURRENCY_ADJUST">Sửa tiền</option>
                <option value="ELO_ADJUST">Sửa ELO</option>
                <option value="SHOP_ITEM_CREATE">Tạo item</option>
                <option value="SHOP_ITEM_UPDATE">Sửa item</option>
                <option value="SHOP_ITEM_DELETE">Xóa item</option>
                <option value="QUEST_CREATE">Tạo quest</option>
                <option value="QUEST_UPDATE">Sửa quest</option>
                <option value="QUEST_DELETE">Xóa quest</option>
                <option value="ANNOUNCEMENT_BROADCAST">Phát live</option>
                <option value="SEASON_RESET">Reset mùa</option>
              </>
            )}
          </select>
        </Field>
        {logType === 'transaction' && (
          <Field label={en ? 'Currency' : 'Loại ví'}>
            <select className={inputClass} value={currency} onChange={(event) => { setCurrency(event.target.value); setPage(1); }}>
              <option value="">{en ? 'All' : 'Tất cả'}</option>
              <option value="coin">GoldCoin</option>
              <option value="gem">PinkCoin</option>
              <option value="elo">ELO</option>
            </select>
          </Field>
        )}
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
                  <td className={`px-4 py-3 font-black ${log.amount >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>{log.amount >= 0 ? `+${log.amount}` : log.amount} {log.currency}</td>
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
              <article key={log._id} className="border-[3px] border-[var(--pop-black)] bg-[#fffdf5] p-4 shadow-[4px_4px_0_var(--pop-black)]">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-black text-slate-900">{log.userId?.username || 'Hệ thống'}</p>
                    <p className="text-xs font-semibold text-slate-500">{formatDateTime(log.createdAt)}</p>
                  </div>
                  <StatusBadge>{log.type}</StatusBadge>
                </div>
                <p className={`mt-3 text-lg font-black ${log.amount >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>{log.amount >= 0 ? `+${log.amount}` : log.amount} {log.currency}</p>
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
                  <td className="px-4 py-3 font-bold">{log.adminId?.username || 'Admin'}</td>
                  <td className="px-4 py-3"><StatusBadge tone="warning">{log.action}</StatusBadge></td>
                  <td className="px-4 py-3 font-mono text-xs text-slate-500">{log.targetType} ({log.targetId || '-'})</td>
                  <td className="max-w-[180px] truncate px-4 py-3 font-mono text-xs text-slate-500">{log.before ? JSON.stringify(log.before) : '-'}</td>
                  <td className="max-w-[180px] truncate px-4 py-3 font-mono text-xs text-slate-700">{log.after ? JSON.stringify(log.after) : '-'}</td>
                  <td className="px-4 py-3 font-semibold text-slate-600">{log.reason || '-'}</td>
                </tr>
              ))}
            </DataTable>
          </div>
          <div className="grid gap-3 lg:hidden">
            {logs.map((log) => (
              <article key={log._id} className="border-[3px] border-[var(--pop-black)] bg-[#fffdf5] p-4 shadow-[4px_4px_0_var(--pop-black)]">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-black text-slate-900">{log.adminId?.username || 'Admin'}</p>
                    <p className="text-xs font-semibold text-slate-500">{formatDateTime(log.createdAt)}</p>
                  </div>
                  <StatusBadge tone="warning">{log.action}</StatusBadge>
                </div>
                <p className="mt-2 font-mono text-xs font-semibold text-slate-500">{log.targetType} ({log.targetId || '-'})</p>
                <p className="mt-2 text-sm font-semibold text-slate-700">{log.reason || '-'}</p>
              </article>
            ))}
          </div>
        </>
      )}

      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
    </div>
  );
}
