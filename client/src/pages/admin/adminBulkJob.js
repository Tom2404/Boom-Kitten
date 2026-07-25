function compactFilters(filters = {}) {
  return Object.fromEntries(Object.entries(filters).filter(([, value]) => value !== '' && value !== undefined && value !== null));
}

function nonNegativeInteger(value, label) {
  const number = Number(value);
  if (!Number.isSafeInteger(number) || number < 0) throw new Error(`${label} phải là số nguyên không âm.`);
  return number;
}

export function buildBulkPreviewPayload({ filters, form, requestId }) {
  if (!form.reason?.trim()) throw new Error('Lý do bulk operation là bắt buộc.');
  const operation = form.type === 'currency'
    ? { type: 'currency', currency: form.currency, operation: form.operation, amount: nonNegativeInteger(form.amount, 'Số lượng') }
    : form.type === 'elo'
      ? { type: 'elo', elo: nonNegativeInteger(form.elo, 'ELO') }
      : null;
  if (!operation) throw new Error('Loại bulk operation không hợp lệ.');
  return {
    type: 'player_bulk_adjust',
    dryRun: true,
    query: compactFilters(filters),
    operation,
    reason: form.reason.trim(),
    requestId,
  };
}

export function buildBulkExecutionPayload({ previewToken, reason, requestId }) {
  if (!previewToken) throw new Error('Preview token không hợp lệ.');
  return { type: 'player_bulk_adjust', dryRun: false, previewToken, reason: reason.trim(), requestId };
}

export function calculatePlayerAdjustmentPreview(player, adjustment, policy = {}) {
  if (!player || !adjustment) return { valid: false };
  let before;
  let after;
  let threshold = null;
  if (adjustment.type === 'currency') {
    before = adjustment.currency === 'gem' ? Number(player.gems || 0) : Number(player.coins || 0);
    const amount = Number(adjustment.amount);
    if (!Number.isSafeInteger(amount) || amount < 0) return { valid: false };
    after = adjustment.operation === 'add' ? before + amount : adjustment.operation === 'subtract' ? before - amount : adjustment.operation === 'set' ? amount : Number.NaN;
    threshold = policy.maxCurrencyAdjustment?.[adjustment.currency] ?? null;
  } else if (adjustment.type === 'elo') {
    before = Number(player.eloPoints || 1000);
    after = Number(adjustment.elo);
    threshold = policy.maxEloDelta ?? null;
  } else return { valid: false };
  if (!Number.isSafeInteger(after) || after < 0) return { before, after, valid: false };
  const delta = after - before;
  return { before, after, delta, threshold, exceedsThreshold: threshold !== null && Math.abs(delta) > threshold, valid: true };
}
