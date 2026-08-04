require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const ShopItem = require('../models/ShopItem');
const {
  COSMETIC_INVENTORY_MIGRATION_VERSION,
  summarizeCosmeticInventoryMigration,
} = require('../services/cosmeticInventoryMigrationService');

async function main() {
  const apply = process.argv.includes('--apply');
  if (!process.env.MONGO_URI) throw new Error('MONGO_URI is required');

  await mongoose.connect(process.env.MONGO_URI);
  const [users, frames] = await Promise.all([
    User.find({}).select('_id ownedAvatarFrames activeAvatarFrame ownedItemIds equippedCosmetics cosmeticInventoryMigrationVersion').lean(),
    ShopItem.find({ type: 'avatar_frame' }).select('_id type name').lean(),
  ]);
  const summary = summarizeCosmeticInventoryMigration(users, frames);
  const output = {
    mode: apply ? 'apply' : 'dry-run',
    version: COSMETIC_INVENTORY_MIGRATION_VERSION,
    totalUsers: summary.totalUsers,
    usersToUpdate: summary.usersToUpdate,
    ownershipLinksToAdd: summary.ownershipLinksToAdd,
    equipmentChanges: summary.equipmentChanges,
    issues: summary.issues,
  };

  if (!apply) {
    process.stdout.write(`${JSON.stringify(output, null, 2)}\n`);
    return;
  }
  if (summary.issues.length) {
    throw new Error(`Refusing apply: ${summary.issues.length} unresolved legacy frame references`);
  }

  let appliedUsers = 0;
  for (const plan of summary.plans.filter((entry) => entry.shouldUpdate)) {
    const result = await User.updateOne(
      { _id: plan.userId, cosmeticInventoryMigrationVersion: { $ne: COSMETIC_INVENTORY_MIGRATION_VERSION } },
      {
        $set: {
          ownedItemIds: plan.ownedItemIds,
          'equippedCosmetics.avatarFrame': plan.avatarFrameId,
          cosmeticInventoryMigrationVersion: COSMETIC_INVENTORY_MIGRATION_VERSION,
        },
      },
    );
    appliedUsers += result.modifiedCount;
  }
  process.stdout.write(`${JSON.stringify({ ...output, appliedUsers }, null, 2)}\n`);
}

main()
  .catch((error) => {
    process.stderr.write(`${error.stack || error.message}\n`);
    process.exitCode = 1;
  })
  .finally(() => mongoose.disconnect());
