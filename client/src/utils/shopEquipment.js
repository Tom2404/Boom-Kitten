export const EQUIPMENT_SLOTS = Object.freeze([
  { slot: 'protector', type: 'protector' },
  { slot: 'avatarFrame', type: 'avatar_frame' },
  { slot: 'field', type: 'field' },
]);

export const TYPE_TO_SLOT = Object.freeze(
  Object.fromEntries(EQUIPMENT_SLOTS.map(({ slot, type }) => [type, slot])),
);

export const DEFAULT_ASSET_TRANSFORM = Object.freeze({ scale: 1, x: 0, y: 0 });

const SLOT_ASPECT_RATIOS = Object.freeze({
  protector: 5 / 7,
  avatar_frame: 1,
  field: 16 / 9,
});

export function isSafeAssetUrl(value) {
  if (typeof value !== 'string' || !value.trim()) return false;
  const url = value.trim();
  return url.startsWith('/') && !url.startsWith('//') && !url.split('/').includes('..');
}

export function sanitizeAssetUrl(value) {
  if (!value || typeof value !== 'string') return '';
  let url = value.trim();
  try {
    if (url.startsWith('http://') || url.startsWith('https://')) {
      const parsed = new URL(url);
      if (parsed.pathname.startsWith('/assets/') || parsed.pathname.startsWith('/uploads/')) {
        return `${parsed.pathname}${parsed.search}`;
      }
    }
  } catch {
    // ignore invalid URL strings
  }
  if (url.startsWith('assets/') || url.startsWith('uploads/')) {
    url = `/${url}`;
  }
  return url;
}

function clamp(value, min, max, fallback) {
  const number = Number(value);
  return Number.isFinite(number) ? Math.min(max, Math.max(min, number)) : fallback;
}

export function normalizeAssetTransform(value) {
  return {
    scale: clamp(value?.scale, 0.5, 3, DEFAULT_ASSET_TRANSFORM.scale),
    x: clamp(value?.x, -50, 50, DEFAULT_ASSET_TRANSFORM.x),
    y: clamp(value?.y, -50, 50, DEFAULT_ASSET_TRANSFORM.y),
  };
}

export function getAssetTransformStyle(value) {
  const transform = normalizeAssetTransform(value);
  return {
    objectPosition: '50% 50%',
    transform: `translate(${transform.x}%, ${transform.y}%) scale(${transform.scale})`,
    transformOrigin: 'center',
  };
}

export function getFieldTransformStyle(value) {
  const transform = normalizeAssetTransform(value);
  return {
    '--game-field-position': `${50 + transform.x}% ${50 + transform.y}%`,
    '--game-field-size': transform.scale === 1 ? 'cover' : `${transform.scale * 100}% auto`,
  };
}

export function needsAssetFraming(type, width, height, tolerance = 0.05) {
  const targetRatio = SLOT_ASPECT_RATIOS[type];
  if (!targetRatio || !Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) return false;
  return Math.abs((width / height) / targetRatio - 1) > tolerance;
}

export function isOwnedItem(item, ownedItemIds = []) {
  return ownedItemIds.some((id) => String(id) === String(item?._id));
}

export function getEquipmentAction(item, owned = {}) {
  if (!isOwnedItem(item, owned.ownedItemIds)) return 'buy';
  const slot = TYPE_TO_SLOT[item.type];
  return String(owned.equipped?.[slot]?.id || owned.equipped?.[slot]?._id || '') === String(item._id)
    ? 'equipped'
    : 'equip';
}

const API_URL = import.meta.env?.VITE_API_URL ?? 'http://localhost:5000';

export function resolveAssetUrl(url) {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) {
    return url;
  }
  return url.startsWith('/') ? `${API_URL}${url}` : `${API_URL}/${url}`;
}

export function getEquippedAssetUrl(item) {
  return item?.assetUrl || item?.previewUrl || item?.imageUrl || '';
}

export function getProtectorStackSize(handCount) {
  const count = Number(handCount);
  return Number.isFinite(count) && count > 0 ? Math.min(Math.floor(count), 3) : 0;
}
