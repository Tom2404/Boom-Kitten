import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useAdminApi } from './useAdminApi.js';
import { AdminCard, Alert, Button, EmptyState, SectionHeader, SkeletonBlock, StatusBadge } from './ui.jsx';
import { formatNumber } from './utils.js';

const NAV_ITEMS = [
  { id: 'players', permission: 'players.read', icon: 'group', vi: 'Người dùng', en: 'Users' },
  { id: 'catalog', permission: 'catalog.read', icon: 'storefront', vi: 'Shop', en: 'Shop' },
  { id: 'quests', permission: 'quests.read', icon: 'flag', vi: 'Nhiệm vụ', en: 'Quests' },
  { id: 'tournaments', permission: 'tournaments.read', icon: 'trophy', vi: 'Giải đấu', en: 'Tournaments' },
];

function periodDetail(period, en) {
  if (!period) return '';
  if (period.changePercent === null) return en ? 'No prior-period baseline' : 'Chưa có dữ liệu kỳ trước';
  const sign = period.changePercent > 0 ? '+' : '';
  return `${sign}${period.changePercent}% ${en ? 'vs prior period' : 'so với kỳ trước'}`;
}

function StatCard({ label, value, detail, tone = 'accent' }) {
  const border = tone === 'warning' ? 'border-l-[var(--admin-warning-text)]' : 'border-l-[var(--admin-accent)]';
  return (
    <AdminCard className={`border-l-[3px] ${border} p-4`}>
      <p className="text-xs font-semibold tracking-[0.04em] text-[var(--admin-text-muted)]">{label}</p>
      <p className="mt-2 text-3xl font-semibold tracking-[-0.03em] text-[var(--admin-text)]">{formatNumber(value)}</p>
      <p className="mt-1 text-sm text-[var(--admin-text-muted)]">{detail}</p>
    </AdminCard>
  );
}

function GamesTrend({ items = [], en }) {
  const width = 720;
  const height = 180;
  const peak = Math.max(0, ...items.map((item) => item.count));
  const scaleMax = Math.max(1, peak);
  const points = items.map((item, index) => ({
    ...item,
    x: items.length === 1 ? width / 2 : (index / (items.length - 1)) * width,
    y: height - 16 - (item.count / scaleMax) * (height - 32),
  }));
  const path = points.map((point, index) => `${index ? 'L' : 'M'} ${point.x} ${point.y}`).join(' ');
  const total = items.reduce((sum, item) => sum + item.count, 0);
  const dateFormatter = new Intl.DateTimeFormat(en ? 'en-US' : 'vi-VN', { day: 'numeric', month: 'short', timeZone: 'UTC' });

  return (
    <AdminCard className="min-w-0 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="font-semibold text-[var(--admin-text)]">{en ? 'Completed matches by day' : 'Trận hoàn thành theo ngày'}</h3>
          <p className="mt-1 text-sm text-[var(--admin-text-muted)]">{formatNumber(total)} {en ? 'matches in this period' : 'trận trong kỳ này'}</p>
        </div>
        <StatusBadge>{en ? `Peak ${formatNumber(peak)}/day` : `Cao nhất ${formatNumber(peak)}/ngày`}</StatusBadge>
      </div>
      <div className="mt-4 overflow-hidden" aria-hidden={items.length === 0}>
        {items.length > 0 && (
          <svg viewBox={`0 0 ${width} ${height}`} className="h-48 w-full" role="img" aria-labelledby="games-trend-title games-trend-description">
            <title id="games-trend-title">{en ? 'Daily completed matches' : 'Số trận hoàn thành mỗi ngày'}</title>
            <desc id="games-trend-description">{en ? `${total} matches across ${items.length} days, with a peak of ${peak}.` : `${total} trận trong ${items.length} ngày, cao nhất ${peak} trận.`}</desc>
            {[0.25, 0.5, 0.75].map((ratio) => <line key={ratio} x1="0" x2={width} y1={height * ratio} y2={height * ratio} stroke="var(--admin-border)" strokeWidth="1" />)}
            <path d={path} fill="none" stroke="var(--admin-accent)" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
            {points.map((point) => <circle key={point.date} cx={point.x} cy={point.y} r="4" fill="var(--admin-surface)" stroke="var(--admin-accent)" strokeWidth="3" />)}
          </svg>
        )}
      </div>
      <details className="mt-2 border-t border-[var(--admin-border)] pt-3">
        <summary className="cursor-pointer text-sm font-semibold text-[var(--admin-accent)]">{en ? 'View data table' : 'Xem bảng dữ liệu'}</summary>
        <div className="mt-3 max-h-56 overflow-auto rounded-md border border-[var(--admin-border)]">
          <table className="w-full text-left text-sm">
            <thead className="sticky top-0 bg-[var(--admin-surface-muted)]"><tr><th className="px-3 py-2">{en ? 'Date' : 'Ngày'}</th><th className="px-3 py-2 text-right">{en ? 'Matches' : 'Số trận'}</th></tr></thead>
            <tbody className="divide-y divide-[var(--admin-border)]">{items.map((item) => <tr key={item.date}><td className="px-3 py-2">{dateFormatter.format(new Date(`${item.date}T00:00:00Z`))}</td><td className="px-3 py-2 text-right font-mono">{formatNumber(item.count)}</td></tr>)}</tbody>
          </table>
        </div>
      </details>
    </AdminCard>
  );
}

function ResourceCard({ title, icon, rows, action, en }) {
  return (
    <AdminCard className="p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2"><span className="material-symbols-outlined text-[var(--admin-accent)]" aria-hidden="true">{icon}</span><h3 className="font-semibold">{title}</h3></div>
        {action && <Button variant="subtle" className="min-h-11 px-2 py-1" onClick={action}>{en ? 'Open' : 'Mở'}<span className="material-symbols-outlined ml-1 text-base" aria-hidden="true">arrow_forward</span></Button>}
      </div>
      <dl className="mt-4 grid grid-cols-2 gap-3">{rows.map(([label, value]) => <div key={label}><dt className="text-xs font-semibold text-[var(--admin-text-muted)]">{label}</dt><dd className="mt-1 font-mono text-lg font-semibold">{formatNumber(value)}</dd></div>)}</dl>
    </AdminCard>
  );
}

export default function OverviewPanel({ onNavigate, language = 'vi', permissions = [] }) {
  const en = language === 'en';
  const { request } = useAdminApi();
  const [rangeDays, setRangeDays] = useState(30);
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const canOpen = useCallback((permission) => permissions.includes(permission), [permissions]);

  const loadOverview = useCallback(async () => {
    setLoading(true);
    setError('');
    const response = await request(`/api/admin/overview?range=${rangeDays}`);
    if (response.ok) setDashboard(response.data?.data || null);
    else setError(response.data?.error?.message || response.error || (en ? 'Overview could not be loaded.' : 'Không thể tải tổng quan.'));
    setLoading(false);
  }, [en, rangeDays, request]);

  useEffect(() => { loadOverview(); }, [loadOverview]);

  const quickActions = useMemo(() => NAV_ITEMS.filter(({ permission }) => permissions.includes(permission)), [permissions]);
  const updatedAt = dashboard?.generatedAt ? new Intl.DateTimeFormat(en ? 'en-US' : 'vi-VN', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(dashboard.generatedAt)) : '';
  const resources = dashboard?.resources;
  const attention = dashboard?.attention;

  return (
    <div className="flex flex-col gap-5">
      <SectionHeader
        title={en ? 'Management overview' : 'Tổng quan quản lý'}
        description={updatedAt ? `${en ? 'Updated' : 'Cập nhật'} ${updatedAt}` : (en ? 'Users, activity, resources, and tournaments in one place.' : 'Người dùng, hoạt động, tài nguyên và giải đấu tại một nơi.')}
        actions={<div className="flex flex-wrap gap-2" role="group" aria-label={en ? 'Overview period' : 'Khoảng thời gian tổng quan'}>{[7, 30].map((days) => <Button key={days} variant={rangeDays === days ? 'primary' : 'secondary'} aria-pressed={rangeDays === days} onClick={() => setRangeDays(days)}>{days} {en ? 'days' : 'ngày'}</Button>)}<Button onClick={loadOverview}><span className="material-symbols-outlined mr-1 text-lg" aria-hidden="true">refresh</span>{en ? 'Refresh' : 'Làm mới'}</Button></div>}
      />
      {error && <Alert tone="danger">{error}</Alert>}
      {loading ? <SkeletonBlock rows={6} label={en ? 'Loading overview data' : 'Đang tải dữ liệu tổng quan'} /> : !dashboard ? (
        <EmptyState title={en ? 'No overview data' : 'Chưa có dữ liệu tổng quan'} description={en ? 'Refresh to try loading the dashboard again.' : 'Làm mới để thử tải lại dashboard.'} action={<Button onClick={loadOverview}>{en ? 'Try again' : 'Thử lại'}</Button>} />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard label={en ? 'Users' : 'Người dùng'} value={dashboard.totalUsers} detail={`${formatNumber(dashboard.activeUsers)} ${en ? `online (${dashboard.onlineRate}%)` : `đang online (${dashboard.onlineRate}%)`}`} />
            <StatCard label={en ? 'New users' : 'Người dùng mới'} value={dashboard.newUsers?.current} detail={periodDetail(dashboard.newUsers, en)} />
            <StatCard label={en ? 'Completed matches' : 'Trận hoàn thành'} value={dashboard.gamesPlayed?.current} detail={periodDetail(dashboard.gamesPlayed, en)} />
            <StatCard tone="warning" label={en ? 'Restricted users' : 'Tài khoản hạn chế'} value={attention?.restrictedUsers ?? dashboard.bannedUsers} detail={en ? 'Banned or currently suspended' : 'Bị cấm hoặc đang tạm khóa'} />
          </div>

          <div className="grid gap-4 xl:grid-cols-[minmax(0,1.6fr)_minmax(280px,0.7fr)]">
            <GamesTrend items={dashboard.gamesByDay} en={en} />
            <AdminCard className="p-4">
              <h3 className="font-semibold">{en ? 'Needs attention' : 'Cần chú ý'}</h3>
              <p className="mt-1 text-sm text-[var(--admin-text-muted)]">{en ? 'Operational counts that may require review.' : 'Các chỉ số vận hành có thể cần kiểm tra.'}</p>
              <div className="mt-4 divide-y divide-[var(--admin-border)]">
                {[
                  [en ? 'Restricted users' : 'Tài khoản hạn chế', attention?.restrictedUsers, 'players', 'players.read'],
                  [en ? 'Inactive shop items' : 'Vật phẩm Shop đang tắt', attention?.inactiveShopItems, 'catalog', 'catalog.read'],
                  [en ? 'Inactive quests' : 'Nhiệm vụ đang tắt', attention?.inactiveMissions, 'quests', 'quests.read'],
                  [en ? 'Tournaments starting in 7 days' : 'Giải bắt đầu trong 7 ngày', attention?.tournamentsStartingSoon, 'tournaments', 'tournaments.read'],
                  [en ? 'Pending payouts' : 'Payout đang chờ', attention?.pendingPayouts, 'tournaments', 'tournaments.read'],
                ].map(([label, value, tab, permission]) => <div key={label} className="flex min-h-12 items-center justify-between gap-3 py-2"><span className="text-sm font-medium">{label}</span>{canOpen(permission) ? <Button variant="subtle" className="min-h-11 min-w-12 px-2 py-1 font-mono" onClick={() => onNavigate(tab)} aria-label={`${label}: ${formatNumber(value)}`}>{formatNumber(value)}</Button> : <strong className="font-mono">{formatNumber(value)}</strong>}</div>)}
              </div>
            </AdminCard>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <ResourceCard title="Shop" icon="storefront" en={en} action={canOpen('catalog.read') ? () => onNavigate('catalog') : null} rows={[[en ? 'Active' : 'Hoạt động', resources?.shop?.active], [en ? 'Inactive' : 'Đang tắt', resources?.shop?.inactive]]} />
            <ResourceCard title={en ? 'Quests' : 'Nhiệm vụ'} icon="flag" en={en} action={canOpen('quests.read') ? () => onNavigate('quests') : null} rows={[[en ? 'Active' : 'Hoạt động', resources?.quests?.active], [en ? 'Inactive' : 'Đang tắt', resources?.quests?.inactive]]} />
            <ResourceCard title={en ? 'Tournaments' : 'Giải đấu'} icon="trophy" en={en} action={canOpen('tournaments.read') ? () => onNavigate('tournaments') : null} rows={[[en ? 'Registration' : 'Đăng ký', resources?.tournaments?.registration], [en ? 'Active' : 'Đang diễn ra', resources?.tournaments?.active]]} />
          </div>

          <AdminCard className="bg-[var(--admin-accent-soft)] p-4">
            <h3 className="font-semibold">{en ? 'Quick navigation' : 'Điều hướng nhanh'}</h3>
            <div className="mt-3 flex flex-wrap gap-2">{quickActions.map((item) => <Button key={item.id} variant="secondary" onClick={() => onNavigate(item.id)}><span className="material-symbols-outlined mr-1 text-lg" aria-hidden="true">{item.icon}</span>{en ? item.en : item.vi}</Button>)}</div>
          </AdminCard>
        </>
      )}
    </div>
  );
}
