const ADMIN_ROLES = new Set(['admin', 'super_admin', 'operator', 'moderator', 'analyst']);

export function isAdminRole(role) {
  return ADMIN_ROLES.has(role);
}
