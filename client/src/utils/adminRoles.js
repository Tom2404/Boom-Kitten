const ADMIN_ROLES = new Set(['admin', 'super_admin']);

export function isAdminRole(role) {
  return ADMIN_ROLES.has(role);
}
