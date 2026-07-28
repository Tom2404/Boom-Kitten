import React, { useEffect, useState } from 'react';
import { useAdminApi } from './useAdminApi.js';
import { AdminCard, Alert, Button, SectionHeader, SkeletonBlock } from './ui.jsx';
import { formatNumber } from './utils.js';

function StatCard({ label, value, detail }) {
  return (
    <AdminCard className="border-l-[3px] border-l-[var(--admin-accent)] p-4">
      <p className="text-xs font-semibold tracking-[0.04em] text-[var(--admin-text-muted)]">{label}</p>
      <p className="mt-2 text-3xl font-semibold tracking-[-0.03em] text-[var(--admin-text)]">{formatNumber(value)}</p>
      <p className="mt-1 text-sm text-[var(--admin-text-muted)]">{detail}</p>
    </AdminCard>
  );
}

export default function OverviewPanel({ onNavigate, language = 'vi' }) {
  const en = language === 'en';
  const { request } = useAdminApi();
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadOverview = async () => {
    setLoading(true);
    setError('');
    const response = await request('/api/admin/overview');
    if (response.ok) setDashboard(response.data?.data || null);
    else setError(response.data?.error?.message || response.error || (en ? 'Overview could not be loaded.' : 'Không thể tải tổng quan.'));
    setLoading(false);
  };

  useEffect(() => { loadOverview(); }, [request]);

  return (
    <div className="flex flex-col gap-5">
      <SectionHeader
        title={en ? 'Management overview' : 'Tổng quan quản lý'}
        description={en ? 'Users, game resources, and tournaments in one place.' : 'Theo dõi người dùng, tài nguyên trò chơi và giải đấu tại một nơi.'}
        actions={<Button onClick={loadOverview}>{en ? 'Refresh' : 'Làm mới'}</Button>}
      />
      {error && <Alert tone="danger">{error}</Alert>}
      {loading ? <SkeletonBlock rows={4} /> : dashboard && (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard label={en ? 'Users' : 'Người dùng'} value={dashboard.totalUsers} detail={`${formatNumber(dashboard.activeUsers)} ${en ? 'online' : 'đang online'}`} />
            <StatCard label={en ? 'Restricted users' : 'Tài khoản bị khóa'} value={dashboard.bannedUsers} detail={en ? 'Ban or suspension' : 'Bị cấm hoặc tạm khóa'} />
            <StatCard label={en ? 'Shop items' : 'Vật phẩm Shop'} value={dashboard.totalShopItems} detail={`${formatNumber(dashboard.activeShopItems)} ${en ? 'active' : 'đang hoạt động'}`} />
            <StatCard label={en ? 'Quests' : 'Nhiệm vụ'} value={dashboard.totalMissions} detail={`${formatNumber(dashboard.activeMissions)} ${en ? 'active' : 'đang hoạt động'}`} />
          </div>
          <AdminCard className="bg-[var(--admin-accent-soft)] p-4">
            <h2 className="text-base font-semibold text-[var(--admin-text)]">{en ? 'Quick actions' : 'Tác vụ nhanh'}</h2>
            <div className="mt-3 grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
              <Button variant="secondary" onClick={() => onNavigate('players')}>{en ? 'Users' : 'Người dùng'}</Button>
              <Button variant="secondary" onClick={() => onNavigate('catalog')}>Shop</Button>
              <Button variant="secondary" onClick={() => onNavigate('quests')}>{en ? 'Quests' : 'Nhiệm vụ'}</Button>
              <Button variant="secondary" onClick={() => onNavigate('tournaments')}>{en ? 'Tournaments' : 'Giải đấu'}</Button>
            </div>
          </AdminCard>
        </>
      )}
    </div>
  );
}
