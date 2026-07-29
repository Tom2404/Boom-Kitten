const ROLE_MIGRATION = Object.freeze({
  super_admin: 'super_admin',
  admin: 'super_admin',
  operator: 'admin',
  moderator: 'user',
  analyst: 'user',
  user: 'user',
});

function getMigratedAdminRole(role) {
  return ROLE_MIGRATION[role] || 'user';
}

module.exports = { ROLE_MIGRATION, getMigratedAdminRole };
