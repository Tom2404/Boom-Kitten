const GEM_CONVERSION_RATE = 50;
const GEM_CONVERSION_VERSION = 'gems-to-coins-v1';

function balance(value, field) {
  const normalized = value ?? 0;
  if (!Number.isSafeInteger(normalized) || normalized < 0) {
    throw new TypeError(`${field} must be a non-negative safe integer`);
  }
  return normalized;
}

function planGemConversion(user) {
  const coinsBefore = balance(user.coins, 'coins');
  const gemsBefore = balance(user.gems, 'gems');
  const alreadyConverted = user.currencyMigrationVersion === GEM_CONVERSION_VERSION;
  const coinsIssued = alreadyConverted ? 0 : gemsBefore * GEM_CONVERSION_RATE;
  const coinsAfter = coinsBefore + coinsIssued;
  if (!Number.isSafeInteger(coinsAfter)) throw new RangeError('converted balance must be a safe integer');

  return {
    userId: String(user._id),
    version: GEM_CONVERSION_VERSION,
    gemsBefore,
    coinsBefore,
    coinsIssued,
    coinsAfter,
    shouldConvert: !alreadyConverted,
  };
}

function summarizeGemConversions(users) {
  const summary = {
    version: GEM_CONVERSION_VERSION,
    scannedUsers: users.length,
    affectedUsers: 0,
    gemsRetired: 0,
    coinsIssued: 0,
    invalidUsers: [],
  };
  for (const user of users) {
    try {
      const plan = planGemConversion(user);
      if (!plan.shouldConvert) continue;
      summary.affectedUsers += 1;
      summary.gemsRetired += plan.gemsBefore;
      summary.coinsIssued += plan.coinsIssued;
    } catch (error) {
      summary.invalidUsers.push({ userId: String(user?._id), error: error.message });
    }
  }
  return summary;
}

module.exports = {
  GEM_CONVERSION_RATE,
  GEM_CONVERSION_VERSION,
  planGemConversion,
  summarizeGemConversions,
};
