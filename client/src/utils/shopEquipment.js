export const EQUIPMENT_SLOTS = Object.freeze([
  { slot: 'protector', type: 'protector' },
  { slot: 'avatarFrame', type: 'avatar_frame' },
  { slot: 'field', type: 'field' },
]);

export const TYPE_TO_SLOT = Object.freeze(
  Object.fromEntries(EQUIPMENT_SLOTS.map(({ slot, type }) => [type, slot])),
);

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

export function getEquippedAssetUrl(item) {
  return item?.assetUrl || item?.previewUrl || item?.imageUrl || '';
}

export function getProtectorStackSize(handCount) {
  const count = Number(handCount);
  return Number.isFinite(count) && count > 0 ? Math.min(Math.floor(count), 3) : 0;
}
