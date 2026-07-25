const hasPermission = (permissions, permission) => permissions.includes(permission);

export function getAdminPanelAccess(permissions = []) {
  return {
    canWriteCatalog: hasPermission(permissions, 'catalog.write'),
    canWriteQuests: hasPermission(permissions, 'quests.write'),
    canWriteAnnouncements: hasPermission(permissions, 'announcements.write'),
  };
}

export function getSeasonPanelAccess(permissions = []) {
  const canWrite = hasPermission(permissions, 'seasons.write');
  return {
    canCreate: canWrite,
    canDelete: canWrite,
    canReset: hasPermission(permissions, 'seasons.reset'),
  };
}
