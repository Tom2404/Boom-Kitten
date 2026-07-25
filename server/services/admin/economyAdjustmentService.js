const { ApiError } = require('../../utils/apiResponse');
const { getRankFromElo } = require('../../utils/rankSystem');

const CURRENCY_FIELDS = Object.freeze({ coin: 'coins', gem: 'gems' });
const OPERATIONS = new Set(['add', 'subtract', 'set']);

function validation(message, fields) {
  return new ApiError(422, 'VALIDATION_ERROR', message, { fields });
}

function requireNonNegativeInteger(value, field) {
  const number = Number(value);
  if (!Number.isSafeInteger(number) || number < 0) throw validation('Giá trị phải là số nguyên không âm.', { [field]: 'Số nguyên không âm bắt buộc' });
  return number;
}

function previewCurrencyAdjustment({ currency, operation, amount, balances = {}, policy = {} }) {
  const field = CURRENCY_FIELDS[currency];
  if (!field) throw validation('Loại tiền không hợp lệ.', { currency: 'Chỉ hỗ trợ coin hoặc gem' });
  if (!OPERATIONS.has(operation)) throw validation('Hành động điều chỉnh không hợp lệ.', { operation: 'Chỉ hỗ trợ add, subtract hoặc set' });
  const normalizedAmount = requireNonNegativeInteger(amount, 'amount');
  const before = Number.isSafeInteger(balances[field]) ? balances[field] : 0;
  const after = operation === 'add' ? before + normalizedAmount : operation === 'subtract' ? before - normalizedAmount : normalizedAmount;
  if (!Number.isSafeInteger(after) || after < 0) throw validation('Số dư cuối cùng không hợp lệ.', { amount: 'Số dư cuối phải là số nguyên không âm' });
  const threshold = policy.maxCurrencyAdjustment?.[currency] ?? null;
  const impact = Math.abs(after - before);
  if (threshold !== null && impact > threshold) throw new ApiError(422, 'POLICY_LIMIT_EXCEEDED', `Vượt ngưỡng ${threshold} ${currency} cho vai trò hiện tại.`, { threshold, impact, currency });
  return { currency, field, operation, amount: normalizedAmount, before, after, exceedsThreshold: false };
}

function previewEloAdjustment({ elo, currentElo, policy = {} }) {
  const after = requireNonNegativeInteger(elo, 'elo');
  const before = Number.isSafeInteger(currentElo) ? currentElo : 1000;
  const delta = after - before;
  const threshold = policy.maxEloDelta ?? null;
  if (threshold !== null && Math.abs(delta) > threshold) throw new ApiError(422, 'POLICY_LIMIT_EXCEEDED', `Vượt ngưỡng thay đổi ${threshold} ELO cho vai trò hiện tại.`, { threshold, delta });
  return { before, after, delta, exceedsThreshold: false };
}

function buildEloSetFields(user, elo) {
  const value = requireNonNegativeInteger(elo, 'elo');
  return {
    eloPoints: value,
    rank: getRankFromElo(value),
    highestEloReached: Math.max(Number(user.highestEloReached) || 1000, value),
    seasonHighestElo: Math.max(Number(user.seasonHighestElo) || 1000, value),
    allTimeHighestElo: Math.max(Number(user.allTimeHighestElo) || 1000, value),
  };
}

module.exports = { CURRENCY_FIELDS, buildEloSetFields, previewCurrencyAdjustment, previewEloAdjustment };
