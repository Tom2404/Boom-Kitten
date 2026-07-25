export const ADMIN_NAV_GROUPS = [
  {
    id: 'observe',
    vi: 'Quan sát',
    en: 'Observe',
    items: [
      { id: 'overview', permission: 'dashboard.read', icon: 'monitoring', vi: ['Tổng quan', 'Chỉ số vận hành'], en: ['Overview', 'Operations metrics'] },
      { id: 'analytics', permission: 'analytics.read', icon: 'query_stats', vi: ['Phân tích', 'Funnel và retention'], en: ['Analytics', 'Funnel and retention'] },
      { id: 'rooms', permission: 'rooms.read', icon: 'stadia_controller', vi: ['Phòng trực tiếp', 'Giám sát và can thiệp'], en: ['Live rooms', 'Monitor and intervene'] },
      { id: 'logs', permission: 'audit.read', icon: 'receipt_long', vi: ['Nhật ký', 'Audit và giao dịch'], en: ['Logs', 'Audit and transactions'] },
      { id: 'jobs', permission: 'jobs.read', icon: 'work_history', vi: ['Admin Jobs', 'Tiến độ và file kết quả'], en: ['Admin Jobs', 'Progress and result files'] },
    ],
  },
  {
    id: 'protect',
    vi: 'Bảo vệ',
    en: 'Protect',
    items: [
      { id: 'moderation', permission: 'moderation.read', icon: 'shield_person', vi: ['Moderation', 'Report và case'], en: ['Moderation', 'Reports and cases'] },
      { id: 'incidents', permission: 'incidents.read', icon: 'emergency_home', vi: ['Incident Center', 'Signal và timeline'], en: ['Incident Center', 'Signals and timeline'] },
    ],
  },
  {
    id: 'govern',
    vi: 'Điều phối',
    en: 'Govern',
    items: [
      { id: 'live_ops', permission: 'live_ops.read', icon: 'tune', vi: ['Live Ops', 'Config và feature flags'], en: ['Live Ops', 'Config and feature flags'] },
    ],
  },
  {
    id: 'operate',
    vi: 'Vận hành',
    en: 'Operate',
    items: [
      { id: 'players', permission: 'players.read', icon: 'group', vi: ['Người chơi', 'Tài khoản, ví, ELO'], en: ['Players', 'Accounts, wallet, ELO'] },
      { id: 'catalog', permission: 'catalog.read', icon: 'storefront', vi: ['Shop', 'Vật phẩm và trạng thái'], en: ['Shop', 'Items and availability'] },
      { id: 'quests', permission: 'quests.read', icon: 'flag', vi: ['Nhiệm vụ', 'Mục tiêu và thưởng'], en: ['Quests', 'Goals and rewards'] },
      { id: 'announcements', permission: 'announcements.read', icon: 'campaign', vi: ['Thông báo', 'Broadcast trực tiếp'], en: ['Announcements', 'Live broadcasts'] },
      { id: 'seasons', permission: 'seasons.read', icon: 'emoji_events', vi: ['Mùa giải', 'Reset và lịch mùa'], en: ['Seasons', 'Reset and scheduling'] },
      { id: 'tournaments', permission: 'tournaments.read', icon: 'trophy', vi: ['Giải đấu', 'Bracket và payout'], en: ['Tournaments', 'Brackets and payouts'] },
    ],
  },
];

export function getVisibleAdminNavigation(permissions = []) {
  const permissionSet = new Set(permissions);
  return ADMIN_NAV_GROUPS
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => permissionSet.has(item.permission)),
    }))
    .filter((group) => group.items.length > 0);
}

export function resolveAdminTab(requestedTab, groups) {
  const visibleItems = groups.flatMap((group) => group.items);
  if (visibleItems.some((item) => item.id === requestedTab)) return requestedTab;
  return visibleItems[0]?.id ?? null;
}
