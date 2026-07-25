import React, { useEffect, useState } from 'react';
import { useAdminApi } from './useAdminApi.js';
import { AdminCard, Alert, Button, DataTable, EmptyState, SectionHeader, SkeletonBlock, StatusBadge } from './ui.jsx';
import { formatDateTime, formatNumber } from './utils.js';

function getInitialRange() {
  if (typeof window === 'undefined') return '7d';
  return new URLSearchParams(window.location.search).get('range') === '30d' ? '30d' : '7d';
}

function formatDuration(seconds, en) {
  if (!Number.isFinite(seconds)) return en ? 'Unavailable' : 'Chưa đủ dữ liệu';
  const minutes = Math.floor(seconds / 60);
  const remainder = Math.round(seconds % 60);
  return `${minutes}m ${remainder}s`;
}

function formatPercent(value, en) {
  return Number.isFinite(value) ? `${value}%` : (en ? 'Collecting' : 'Đang thu thập');
}

function changeLabel(metric, en) {
  if (metric?.changePercent === null || metric?.changePercent === undefined) return en ? 'No comparable baseline' : 'Chưa có kỳ gốc để so sánh';
  const prefix = metric.changePercent > 0 ? '+' : '';
  return `${prefix}${metric.changePercent}% ${en ? 'vs previous period' : 'so với kỳ trước'}`;
}

function StatCard({ label, value, detail, tone = 'neutral' }) {
  const tones = {
    neutral: 'border-l-[3px] border-l-[var(--admin-border-strong)]',
    success: 'border-l-[3px] border-l-[var(--admin-success-text)]',
    warning: 'border-l-[3px] border-l-[var(--admin-warning-text)]',
    danger: 'border-l-[3px] border-l-[var(--admin-danger-text)]',
    info: 'border-l-[3px] border-l-[var(--admin-info-text)]',
  };
  return <AdminCard className={`p-4 ${tones[tone]}`}><p className="text-xs font-semibold tracking-[0.04em] text-[var(--admin-text-muted)]">{label}</p><p className="mt-2 text-3xl font-semibold tracking-[-0.03em] text-[var(--admin-text)]">{value}</p>{detail && <p className="mt-1 text-sm text-[var(--admin-text-muted)]">{detail}</p>}</AdminCard>;
}

function Trend({ title, values, en }) {
  const maximum = Math.max(1, ...values.map((item) => item.value));
  return (
    <AdminCard className="p-4">
      <h3 className="text-base font-semibold text-[var(--admin-text)]">{title}</h3>
      <div className="mt-4 flex h-36 items-end gap-1" role="img" aria-label={`${title}: ${values.map((item) => `${item.date} ${item.value}`).join(', ')}`}>
        {values.map((item) => <div key={item.date} className="group flex min-w-0 flex-1 flex-col items-center justify-end gap-1"><span className="text-[10px] font-semibold text-[var(--admin-text-muted)] opacity-0 group-hover:opacity-100 group-focus-within:opacity-100">{item.value}</span><div className="w-full rounded-t-sm bg-[var(--admin-accent)] opacity-80 transition-opacity group-hover:opacity-100" style={{ height: `${Math.max(4, (item.value / maximum) * 100)}%` }} title={`${item.date}: ${item.value}`} /><span className="hidden text-[10px] font-medium text-[var(--admin-text-muted)] sm:block">{item.date.slice(5)}</span></div>)}
      </div>
      <p className="mt-2 text-xs font-semibold text-slate-500">{en ? 'UTC calendar days' : 'Ngày theo múi giờ UTC'}</p>
    </AdminCard>
  );
}

export default function OverviewPanel({ onNavigate, language = 'vi' }) {
  const en = language === 'en';
  const { request } = useAdminApi();
  const [range, setRange] = useState(getInitialRange);
  const [dashboard, setDashboard] = useState(null);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadOverview = async () => {
    setLoading(true);
    setError('');
    const [dashboardRes, logsRes] = await Promise.all([
      request(`/api/admin/overview-v2?range=${range}`),
      request('/api/admin/transactions?page=1&limit=5&logType=audit&userId=&type=&currency='),
    ]);
    if (dashboardRes.ok) setDashboard(dashboardRes.data?.data || null);
    else setError(dashboardRes.data?.error?.message || dashboardRes.data?.message || dashboardRes.error || (en ? 'Operational metrics could not be loaded.' : 'Không thể tải chỉ số vận hành.'));
    if (logsRes.ok && logsRes.data?.success) setLogs(logsRes.data.data.logs || []);
    setLoading(false);
  };

  useEffect(() => { loadOverview(); }, [request, range]);

  const selectRange = (nextRange) => {
    setRange(nextRange);
    const url = new URL(window.location.href);
    url.searchParams.set('range', nextRange);
    window.history.replaceState({}, '', url);
  };

  const kpis = dashboard?.kpis;

  return (
    <div className="flex flex-col gap-5">
      <SectionHeader title={en ? 'Operations overview' : 'Tổng quan vận hành'} description={en ? 'Measured player activity, live rooms, completed games, duration, and currency flow.' : 'Hoạt động người chơi, phòng trực tiếp, trận hoàn tất, thời lượng và dòng tiền được đo từ dữ liệu thật.'} actions={<div className="flex gap-2"><div className="flex" role="group" aria-label={en ? 'Dashboard range' : 'Khoảng thời gian dashboard'}><Button variant={range === '7d' ? 'primary' : 'secondary'} onClick={() => selectRange('7d')} aria-pressed={range === '7d'}>7D</Button><Button variant={range === '30d' ? 'primary' : 'secondary'} onClick={() => selectRange('30d')} aria-pressed={range === '30d'}>30D</Button></div><Button onClick={loadOverview}>{en ? 'Refresh' : 'Làm mới'}</Button></div>} />
      {error && <Alert tone="danger">{error}</Alert>}
      {dashboard?.dataQuality?.warnings?.length > 0 && <Alert tone="warning"><strong>{en ? 'Partial data:' : 'Dữ liệu chưa đầy đủ:'}</strong><ul className="mt-1 list-disc pl-5">{dashboard.dataQuality.warnings.map((warning) => <li key={warning}>{warning}</li>)}</ul></Alert>}

      {loading ? <SkeletonBlock rows={6} /> : dashboard && <>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label="DAU" value={formatNumber(kpis?.dau?.value)} detail={changeLabel(kpis?.dau, en)} tone="success" />
          <StatCard label="WAU" value={formatNumber(kpis?.wau?.value)} detail={changeLabel(kpis?.wau, en)} tone="info" />
          <StatCard label={en ? 'Online now' : 'Đang online'} value={formatNumber(kpis?.online?.value)} detail={en ? 'Database presence signal' : 'Tín hiệu presence trong DB'} tone="success" />
          <StatCard label={en ? 'Live rooms' : 'Phòng trực tiếp'} value={formatNumber((kpis?.rooms?.waiting || 0) + (kpis?.rooms?.playing || 0))} detail={`${kpis?.rooms?.waiting || 0} waiting · ${kpis?.rooms?.playing || 0} playing`} tone="info" />
          <StatCard label={en ? 'Completed games' : 'Trận hoàn tất'} value={formatNumber(kpis?.gamesCompleted?.value)} detail={changeLabel(kpis?.gamesCompleted, en)} tone="warning" />
          <StatCard label={en ? 'Completion rate' : 'Tỷ lệ hoàn tất'} value={formatPercent(kpis?.completionRate?.value, en)} detail={`${formatNumber(kpis?.completionRate?.completed)} / ${formatNumber(kpis?.completionRate?.started)} ${en ? 'instrumented starts' : 'trận đã ghi nhận bắt đầu'}`} tone={kpis?.completionRate?.value === null ? 'danger' : 'success'} />
          <StatCard label={en ? 'Median duration' : 'Thời lượng trung vị'} value={formatDuration(kpis?.medianDurationSeconds?.value, en)} detail={changeLabel(kpis?.medianDurationSeconds, en)} tone={kpis?.medianDurationSeconds?.value === null ? 'danger' : 'neutral'} />
        </div>

        <div className="grid gap-4 xl:grid-cols-2"><Trend title={en ? 'Completed games trend' : 'Xu hướng trận hoàn tất'} values={dashboard.trends?.gamesCompleted || []} en={en} /><Trend title={en ? 'Login activity trend' : 'Xu hướng đăng nhập'} values={dashboard.trends?.logins || []} en={en} /></div>

        <AdminCard className="p-4"><h3 className="text-base font-semibold text-[var(--admin-text)]">{en ? 'Economy flow' : 'Dòng tiền trong kỳ'}</h3><div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4"><StatCard label="Gold generated" value={formatNumber(kpis?.economy?.coin?.generated?.value)} detail={changeLabel(kpis?.economy?.coin?.generated, en)} tone="warning" /><StatCard label="Gold consumed" value={formatNumber(kpis?.economy?.coin?.consumed?.value)} detail={changeLabel(kpis?.economy?.coin?.consumed, en)} /><StatCard label="Pink generated" value={formatNumber(kpis?.economy?.gem?.generated?.value)} detail={changeLabel(kpis?.economy?.gem?.generated, en)} tone="danger" /><StatCard label="Pink consumed" value={formatNumber(kpis?.economy?.gem?.consumed?.value)} detail={changeLabel(kpis?.economy?.gem?.consumed, en)} /></div></AdminCard>

        <AdminCard className="bg-[var(--admin-accent-soft)] p-4"><div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between"><div><h3 className="text-base font-semibold text-[var(--admin-text)]">{en ? 'Quick actions' : 'Tác vụ nhanh'}</h3><p className="mt-1 text-sm text-[var(--admin-text-muted)]">{en ? `Generated ${formatDateTime(dashboard.generatedAt)}` : `Cập nhật ${formatDateTime(dashboard.generatedAt)}`}</p></div><div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap"><Button variant="secondary" onClick={() => onNavigate('players')}>{en ? 'Players' : 'Người chơi'}</Button><Button variant="secondary" onClick={() => onNavigate('catalog')}>{en ? 'Shop settings' : 'Cấu hình shop'}</Button><Button variant="secondary" onClick={() => onNavigate('announcements')}>{en ? 'Announcements' : 'Thông báo'}</Button><Button variant="danger" onClick={() => onNavigate('seasons')}>{en ? 'Seasons' : 'Mùa giải'}</Button></div></div></AdminCard>

        <AdminCard className="p-4"><div className="mb-3 flex items-center justify-between gap-3"><h3 className="text-base font-semibold text-[var(--admin-text)]">{en ? 'Recent audits' : 'Audit gần đây'}</h3><Button variant="subtle" onClick={() => onNavigate('logs')}>{en ? 'View all' : 'Xem toàn bộ'}</Button></div>{logs.length === 0 ? <EmptyState title={en ? 'No audit logs yet' : 'Chưa có audit log'} description={en ? 'Administrative activity will appear here.' : 'Khi admin thao tác, lịch sử sẽ xuất hiện tại đây.'} /> : <DataTable columns={en ? ['Time', 'Admin', 'Action', 'Reason'] : ['Thời gian', 'Admin', 'Hành động', 'Lý do']}>{logs.map((log) => <tr key={log._id}><td className="px-4 py-3 text-[var(--admin-text-muted)]">{formatDateTime(log.createdAt)}</td><td className="px-4 py-3 font-semibold text-[var(--admin-text)]">{log.adminId?.username || log.actorUsername || 'Admin'}</td><td className="px-4 py-3"><StatusBadge tone="warning">{log.action}</StatusBadge></td><td className="px-4 py-3 text-[var(--admin-text-muted)]">{log.reason || '-'}</td></tr>)}</DataTable>}</AdminCard>
      </>}
    </div>
  );
}
