export const ADMIN_NAV_GROUPS = [
  {
    id: 'manage',
    vi: 'Quản lý',
    en: 'Manage',
    items: [
      { id: 'overview', permission: 'dashboard.read', icon: 'monitoring', vi: ['Tổng quan', 'Tình trạng hệ thống'], en: ['Overview', 'System status'] },
      { id: 'players', permission: 'players.read', icon: 'group', vi: ['Người dùng', 'Tài khoản và ví Coin'], en: ['Users', 'Accounts and Coin wallet'] },
    ],
  },
  {
    id: 'resources',
    vi: 'Tài nguyên',
    en: 'Resources',
    items: [
      { id: 'catalog', permission: 'catalog.read', icon: 'storefront', vi: ['Shop', 'Vật phẩm và trạng thái'], en: ['Shop', 'Items and availability'] },
      { id: 'quests', permission: 'quests.read', icon: 'flag', vi: ['Nhiệm vụ', 'Mục tiêu và thưởng'], en: ['Quests', 'Goals and rewards'] },
    ],
  },
  {
    id: 'competition',
    vi: 'Thi đấu',
    en: 'Competition',
    items: [
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
