require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const AuditLog = require('../models/AuditLog');
const {
  GEM_CONVERSION_VERSION,
  planGemConversion,
  summarizeGemConversions,
} = require('../services/admin/currencyMigrationService');

async function applyPlan(plan, adminId) {
  const session = await mongoose.startSession();
  try {
    let applied = false;
    await session.withTransaction(async () => {
      const user = await User.findOneAndUpdate({
        _id: plan.userId,
        currencyMigrationVersion: { $ne: GEM_CONVERSION_VERSION },
        coins: plan.coinsBefore,
        gems: plan.gemsBefore,
      }, {
        $set: { gems: 0, currencyMigrationVersion: GEM_CONVERSION_VERSION },
        $inc: { coins: plan.coinsIssued },
      }, { new: true, session });
      if (!user) return;
      await Transaction.create([{
        userId: plan.userId,
        type: 'gem_conversion',
        amount: plan.coinsIssued,
        currency: 'coin',
        balanceBefore: plan.coinsBefore,
        balanceAfter: plan.coinsAfter,
        source: GEM_CONVERSION_VERSION,
        createdBy: 'migration',
        description: `Converted ${plan.gemsBefore} legacy gems at 1:50`,
      }], { session });
      await AuditLog.create([{
        adminId,
        actorUsername: 'migration',
        actorRole: 'super_admin',
        action: 'GEMS_CONVERTED_TO_COINS',
        targetType: 'user',
        targetId: plan.userId,
        before: { coins: plan.coinsBefore, gems: plan.gemsBefore },
        after: { coins: plan.coinsAfter, gems: 0, currencyMigrationVersion: GEM_CONVERSION_VERSION },
        reason: 'Coin-only economy migration at 1 gem = 50 coins',
        requestId: `${GEM_CONVERSION_VERSION}:${plan.userId}`,
      }], { session });
      applied = true;
    });
    return applied;
  } finally {
    await session.endSession();
  }
}

async function main() {
  const apply = process.argv.includes('--apply');
  const adminArg = process.argv.find((arg) => arg.startsWith('--admin-id='));
  const adminId = adminArg?.slice('--admin-id='.length);
  if (apply && !mongoose.Types.ObjectId.isValid(adminId)) {
    throw new Error('--apply requires a valid --admin-id=<ObjectId> for audit ownership');
  }
  if (!process.env.MONGO_URI) throw new Error('MONGO_URI is required');
  await mongoose.connect(process.env.MONGO_URI);
  const users = await User.find({}).select('_id coins gems currencyMigrationVersion').lean();
  const summary = summarizeGemConversions(users);
  if (!apply) {
    process.stdout.write(`${JSON.stringify({ mode: 'dry-run', ...summary }, null, 2)}\n`);
    return;
  }
  if (summary.invalidUsers.length) throw new Error(`Refusing apply: ${summary.invalidUsers.length} invalid user balances`);
  let appliedUsers = 0;
  for (const user of users) {
    const plan = planGemConversion(user);
    if (plan.shouldConvert && await applyPlan(plan, adminId)) appliedUsers += 1;
  }
  process.stdout.write(`${JSON.stringify({ mode: 'apply', ...summary, appliedUsers }, null, 2)}\n`);
}

main()
  .catch((error) => {
    process.stderr.write(`${error.stack || error.message}\n`);
    process.exitCode = 1;
  })
  .finally(() => mongoose.disconnect());
