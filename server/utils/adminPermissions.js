const ADMIN_ROLES = ['admin', 'super_admin'];

const ADMIN_PERMISSIONS = [
  'dashboard.read',
  'players.read',
  'players.create',
  'players.update',
  'players.delete',
  'players.status.write',
  'economy.adjust',
  'catalog.read',
  'catalog.write',
  'quests.read',
  'quests.write',
  'tournaments.read',
  'tournaments.write',
  'tournaments.refund',
  'moderation.read',
  'moderation.write',
];

const ROLE_PERMISSIONS = {
  admin: ADMIN_PERMISSIONS,
  super_admin: [
    ...ADMIN_PERMISSIONS,
    'players.role.write',
    'tournaments.override',
    'tournaments.payout',
  ],
};

const LIMITED_POLICY = Object.freeze({
  maxCurrencyAdjustment: Object.freeze({ coin: 10000 }),
  maxSuspensionDays: 30,
});

const SUPER_ADMIN_POLICY = Object.freeze({
  maxCurrencyAdjustment: null,
  maxSuspensionDays: 365,
});

function normalizeAdminRole(role) {
  return role;
}

function getAdminCapabilities(role) {
  const normalizedRole = normalizeAdminRole(role);
  return ROLE_PERMISSIONS[normalizedRole] ? [...ROLE_PERMISSIONS[normalizedRole]] : [];
}

function hasAdminPermission(role, permission) {
  return getAdminCapabilities(role).includes(permission);
}

function getAdminPolicy(role) {
  return normalizeAdminRole(role) === 'super_admin'
    ? { ...SUPER_ADMIN_POLICY }
    : { ...LIMITED_POLICY, maxCurrencyAdjustment: { ...LIMITED_POLICY.maxCurrencyAdjustment } };
}

module.exports = {
  ADMIN_ROLES,
  getAdminCapabilities,
  getAdminPolicy,
  hasAdminPermission,
  normalizeAdminRole,
};
