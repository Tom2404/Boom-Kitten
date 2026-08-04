export function createInteractionExpiry(timeoutMs, now = Date.now()) {
  const duration = Number.isFinite(timeoutMs) ? Math.max(0, timeoutMs) : 0;
  return now + duration;
}

export function getInteractionClock(expiresAt, now = Date.now(), durationMs = 0) {
  const milliseconds = Number.isFinite(expiresAt)
    ? Math.max(0, expiresAt - now)
    : 0;
  const duration = Number.isFinite(durationMs) ? Math.max(0, durationMs) : 0;

  return {
    milliseconds,
    seconds: Math.ceil(milliseconds / 1_000),
    progress: duration > 0
      ? Math.max(0, Math.min(100, (milliseconds / duration) * 100))
      : 0,
  };
}

export function moveCardByOffset(cards, index, offset) {
  if (!Array.isArray(cards) || !Number.isInteger(index) || !Number.isInteger(offset)) {
    return Array.isArray(cards) ? [...cards] : [];
  }

  const destination = index + offset;
  if (index < 0 || index >= cards.length || destination < 0 || destination >= cards.length) {
    return [...cards];
  }

  const next = [...cards];
  [next[index], next[destination]] = [next[destination], next[index]];
  return next;
}
