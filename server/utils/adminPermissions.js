const ADMIN_ROLES = ['super_admin', 'operator', 'moderator', 'analyst'];

const READ_PERMISSIONS = [
  'dashboard.read',
  'analytics.read',
  'players.read',
  'rooms.read',
  'catalog.read',
  'quests.read',
  'announcements.read',
  'live_ops.read',
  'tournaments.read',
  'wagers.read',
];

const ROLE_PERMISSIONS = {
  analyst: [
    ...READ_PERMISSIONS,
    'players.export',
    'economy.read',
    'moderation.read',
    'audit.read',
    'audit.export',
    'jobs.read',
    'incidents.read',
  ],
  moderator: [
    ...READ_PERMISSIONS,
    'players.status.write',
    'moderation.read',
    'moderation.assign',
    'moderation.resolve',
    'moderation.sanction.warning',
    'moderation.sanction.suspend',
    'moderation.sanction.ban',
    'announcements.write',
    'audit.read',
    'jobs.read',
    'incidents.read',
    'incidents.write',
  ],
  operator: [
    ...READ_PERMISSIONS,
    'players.export',
    'players.status.write',
    'economy.read',
    'economy.adjust',
    'moderation.read',
    'moderation.assign',
    'moderation.resolve',
    'moderation.sanction.warning',
    'moderation.sanction.suspend',
    'rooms.intervene',
    'catalog.write',
    'quests.write',
    'announcements.write',
    'announcements.schedule',
    'audit.read',
    'audit.export',
    'jobs.read',
    'jobs.create',
    'jobs.cancel',
    'tournaments.write',
    'wagers.resolve',
    'live_ops.draft',
    'incidents.read',
    'incidents.write',
  ],
};

const SUPER_ADMIN_PERMISSIONS = [
  ...new Set([
    ...ROLE_PERMISSIONS.analyst,
    ...ROLE_PERMISSIONS.moderator,
    ...ROLE_PERMISSIONS.operator,
    'players.role.write',
    'tournaments.payout',
    'live_ops.publish',
    'live_ops.rollback',
    'rooms.force_close',
    'rooms.disconnect',
  ]),
];

ROLE_PERMISSIONS.super_admin = SUPER_ADMIN_PERMISSIONS;

const LIMITED_POLICY = Object.freeze({
  maxCurrencyAdjustment: Object.freeze({ coin: 10000 }),
  maxSuspensionDays: 30,
  maxBulkTargets: 1000,
});

const SUPER_ADMIN_POLICY = Object.freeze({
  maxCurrencyAdjustment: null,
  maxSuspensionDays: 365,
  maxBulkTargets: 10000,
});

function normalizeAdminRole(role) {
  return role === 'admin' ? 'super_admin' : role;
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
