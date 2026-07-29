export function calculatePlayerAdjustmentPreview(player, adjustment, policy = {}) {
  if (!player || adjustment?.type !== 'currency' || adjustment.currency !== 'coin') return { valid: false };
  const before = Number(player.coins || 0);
  const amount = Number(adjustment.amount);
  if (!Number.isSafeInteger(amount) || amount < 0) return { valid: false };
  const after = adjustment.operation === 'add'
    ? before + amount
    : adjustment.operation === 'subtract'
      ? before - amount
      : adjustment.operation === 'set' ? amount : Number.NaN;
  if (!Number.isSafeInteger(after) || after < 0) return { before, after, valid: false };
  const delta = after - before;
  const threshold = policy.maxCurrencyAdjustment?.coin ?? null;
  return { before, after, delta, threshold, exceedsThreshold: threshold !== null && Math.abs(delta) > threshold, valid: true };
}
