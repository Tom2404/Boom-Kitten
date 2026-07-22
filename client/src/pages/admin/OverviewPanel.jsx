import React, { useEffect, useState } from 'react';
import { useAdminApi } from './useAdminApi.js';
import { AdminCard, Button, DataTable, EmptyState, SectionHeader, SkeletonBlock, StatusBadge } from './ui.jsx';
import { formatDateTime, formatNumber } from './utils.js';

function StatCard({ label, value, detail, tone = 'neutral' }) {
  const tones = {
    neutral: 'bg-[#fffdf5]',
    success: 'bg-[#d9f99d]',
    warning: 'bg-[var(--pop-amber)]',
    danger: 'bg-[#fecaca]',
    info: 'bg-[#bae6fd]',
  };

  return (
    <AdminCard className={`p-4 ${tones[tone]}`}>
      <p className="font-sans text-sm font-black uppercase tracking-wider text-[#65483d]">{label}</p>
      <p className="mt-2 font-pop-display text-3xl font-black text-[var(--pop-black)]">{value}</p>
      {detail && <p className="mt-1 font-sans text-sm font-semibold text-[#65483d]">{detail}</p>}
    </AdminCard>
  );
}

export default function OverviewPanel({ onNavigate, language = 'vi' }) {
  const en = language === 'en';
  const { request } = useAdminApi();
  const [stats, setStats] = useState(null);
  const [logs, setLogs] = useState([]);
  const [seasons, setSeasons] = useState([]);
  const [economy, setEconomy] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadOverview = async () => {
    setLoading(true);
    const [statsRes, economyRes, seasonsRes, logsRes] = await Promise.all([
      request('/api/admin/overview'),
      request('/api/admin/stats'),
      request('/api/admin/seasons'),
      request('/api/admin/transactions?page=1&limit=5&logType=audit&userId=&type=&currency='),
    ]);
    if (statsRes.ok) setStats(statsRes.data?.data || {});
    if (economyRes.ok) setEconomy(economyRes.data || {});
    if (seasonsRes.ok) setSeasons(seasonsRes.data?.seasons || []);
    if (logsRes.ok && logsRes.data?.success) setLogs(logsRes.data.data.logs || []);
    setLoading(false);
  };

  useEffect(() => {
    loadOverview();
  }, [request]);

  const activeSeasons = seasons.filter((season) => season.status === 'active').length;

  return (
    <div className="flex flex-col gap-5">
      <SectionHeader
        title={en ? 'Operations overview' : 'Tổng quan vận hành'}
        description={en ? 'Actionable metrics for online players, active rooms, accounts, economy, seasons, and recent audits.' : 'Các chỉ số có thể hành động ngay: người chơi online, phòng đang chạy, tài khoản bị khóa, kinh tế, mùa giải và audit gần đây.'}
        actions={<Button onClick={loadOverview}>{en ? 'Refresh' : 'Làm mới'}</Button>}
      />

      {loading ? (
        <SkeletonBlock rows={4} />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
            <StatCard label="Total Players" value={formatNumber(stats?.totalUsers)} detail={en ? 'Registered accounts' : 'Đã đăng ký'} />
            <StatCard label="Online" value={formatNumber(stats?.activeUsers)} detail={en ? 'Socket connections' : 'Đang kết nối socket'} tone={stats?.activeUsers > 0 ? 'success' : 'warning'} />
            <StatCard label="Active Rooms" value={formatNumber(stats?.activeRooms)} detail={en ? 'Battle rooms' : 'Phòng đang chơi'} tone="info" />
            <StatCard label="Active Seasons" value={formatNumber(activeSeasons)} detail={en ? `${seasons.length} seasons created` : `${seasons.length} mùa đã tạo`} tone="warning" />
            <StatCard label="Banned Accounts" value={formatNumber(stats?.bannedUsers)} detail={stats?.bannedUsers > 0 ? (en ? 'Needs attention' : 'Cần theo dõi') : (en ? 'No warnings' : 'Không có cảnh báo')} tone={stats?.bannedUsers > 0 ? 'danger' : 'success'} />
            <StatCard label="Gold Purchases" value={formatNumber(economy?.coinRevenue)} detail={`${formatNumber(economy?.gemRevenue)} Pink ${en ? 'lifetime' : 'toàn thời gian'}`} tone="warning" />
          </div>

          <AdminCard className="p-4">
            <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
              <div>
                <h3 className="font-pop-display text-base font-black uppercase text-slate-950">{en ? 'Quick actions' : 'Tác vụ nhanh'}</h3>
                <p className="mt-1 text-sm font-semibold text-[#65483d]">{en ? 'Jump to frequently used operations.' : 'Đi thẳng đến các khu vực vận hành thường dùng.'}</p>
              </div>
              <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap xl:justify-end">
                <Button variant="secondary" onClick={() => onNavigate('players')}>{en ? 'Players' : 'Người chơi'}</Button>
                <Button variant="secondary" onClick={() => onNavigate('catalog')}>{en ? 'Shop settings' : 'Cấu hình shop'}</Button>
                <Button variant="secondary" onClick={() => onNavigate('announcements')}>{en ? 'Send announcement' : 'Gửi thông báo'}</Button>
                <Button variant="danger" onClick={() => onNavigate('seasons')}>{en ? 'Seasons' : 'Mùa giải'}</Button>
              </div>
            </div>
          </AdminCard>

          <AdminCard className="p-4">
              <div className="mb-3 flex items-center justify-between gap-3">
                <h3 className="font-pop-display text-base font-black text-slate-950">{en ? 'Recent audits' : 'Audit gần đây'}</h3>
                <Button variant="subtle" onClick={() => onNavigate('logs')}>{en ? 'View all' : 'Xem toàn bộ'}</Button>
              </div>
              {logs.length === 0 ? (
                <EmptyState title={en ? 'No audit logs yet' : 'Chưa có audit log'} description={en ? 'Administrative activity will appear here.' : 'Khi admin thao tác, lịch sử sẽ xuất hiện tại đây.'} />
              ) : (
                <DataTable columns={en ? ['Time', 'Admin', 'Action', 'Reason'] : ['Thời gian', 'Admin', 'Hành động', 'Lý do']}>
                  {logs.map((log) => (
                    <tr key={log._id}>
                      <td className="px-4 py-3 font-semibold text-slate-500">{formatDateTime(log.createdAt)}</td>
                      <td className="px-4 py-3 font-bold text-slate-800">{log.adminId?.username || 'Admin'}</td>
                      <td className="px-4 py-3"><StatusBadge tone="warning">{log.action}</StatusBadge></td>
                      <td className="px-4 py-3 font-semibold text-slate-600">{log.reason || '-'}</td>
                    </tr>
                  ))}
                </DataTable>
              )}
          </AdminCard>
        </>
      )}
    </div>
  );
}
