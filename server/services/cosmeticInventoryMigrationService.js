const COSMETIC_INVENTORY_MIGRATION_VERSION = 'shop-equipment-v1';

function idsEqual(left, right) {
  return String(left || '') === String(right || '');
}

function planCosmeticInventoryMigration(user, catalogItems) {
  const framesByName = new Map();
  for (const item of catalogItems.filter((entry) => entry.type === 'avatar_frame')) {
    const matches = framesByName.get(item.name) || [];
    matches.push(item);
    framesByName.set(item.name, matches);
  }

  const currentIds = (user.ownedItemIds || []).map(String);
  const ownedItemIds = [...currentIds];
  const issues = [];
  const issueKeys = new Set();
  const resolveFrame = (name) => {
    if (!name) return null;
    const matches = framesByName.get(name) || [];
    if (matches.length !== 1) {
      const reason = matches.length ? 'ambiguous' : 'missing';
      const issueKey = `${name}:${reason}`;
      if (!issueKeys.has(issueKey)) {
        issueKeys.add(issueKey);
        issues.push({ userId: String(user._id), itemName: name, reason });
      }
      return null;
    }
    return String(matches[0]._id);
  };

  for (const name of user.ownedAvatarFrames || []) {
    const id = resolveFrame(name);
    if (id && !ownedItemIds.includes(id)) ownedItemIds.push(id);
  }

  const currentFrameId = user.equippedCosmetics?.avatarFrame || null;
  const resolvedActiveFrameId = resolveFrame(user.activeAvatarFrame);
  if (resolvedActiveFrameId && !ownedItemIds.includes(resolvedActiveFrameId)) {
    ownedItemIds.push(resolvedActiveFrameId);
  }
  const avatarFrameId = resolvedActiveFrameId || (currentFrameId ? String(currentFrameId) : null);
  const changedOwnership = ownedItemIds.length !== currentIds.length;
  const changedEquipment = !idsEqual(currentFrameId, avatarFrameId);
  const changedVersion = user.cosmeticInventoryMigrationVersion !== COSMETIC_INVENTORY_MIGRATION_VERSION;
  const hasResolvableLegacyData = changedOwnership || changedEquipment;

  return {
    userId: String(user._id),
    version: COSMETIC_INVENTORY_MIGRATION_VERSION,
    ownedItemIds,
    addedOwnedItemIds: ownedItemIds.filter((id) => !currentIds.includes(id)),
    previousAvatarFrameId: currentFrameId ? String(currentFrameId) : null,
    avatarFrameId,
    issues,
    shouldUpdate: hasResolvableLegacyData || (changedVersion && issues.length === 0),
  };
}

function summarizeCosmeticInventoryMigration(users, catalogItems) {
  const plans = users.map((user) => planCosmeticInventoryMigration(user, catalogItems));
  const equipmentChanges = plans
    .filter((plan) => !idsEqual(plan.previousAvatarFrameId, plan.avatarFrameId))
    .map((plan) => ({
      userId: plan.userId,
      from: plan.previousAvatarFrameId,
      to: plan.avatarFrameId,
    }));
  return {
    totalUsers: users.length,
    usersToUpdate: plans.filter((plan) => plan.shouldUpdate).length,
    ownershipLinksToAdd: plans.reduce((total, plan) => total + plan.addedOwnedItemIds.length, 0),
    equipmentChanges,
    issues: plans.flatMap((plan) => plan.issues),
    plans,
  };
}

module.exports = {
  COSMETIC_INVENTORY_MIGRATION_VERSION,
  planCosmeticInventoryMigration,
  summarizeCosmeticInventoryMigration,
};
