const TYPE_TO_SLOT = Object.freeze({
  protector: 'protector',
  avatar_frame: 'avatarFrame',
  field: 'field',
});

const RARITY_ORDER = Object.freeze({ common: 0, rare: 1, epic: 2, legendary: 3 });

const getId = (value) => String(value?.id || value?._id || '');

export function mergeWardrobeItems({
  catalogItems = [],
  ownedItems = [],
  ownedItemIds = [],
  equipped = {},
} = {}) {
  const byId = new Map();

  catalogItems.forEach((item, index) => {
    const id = getId(item);
    if (id) byId.set(id, { ...item, _id: id, isCatalogItem: true, wardrobeOrder: index });
  });

  ownedItems.forEach((item, index) => {
    const id = getId(item);
    if (!id) return;
    const current = byId.get(id);
    byId.set(id, {
      ...current,
      ...item,
      _id: id,
      isCatalogItem: Boolean(current?.isCatalogItem),
      wardrobeOrder: current?.wardrobeOrder ?? catalogItems.length + index,
    });
  });

  const ownedIds = new Set([...ownedItemIds.map(String), ...ownedItems.map(getId)]);

  return [...byId.values()].map((item) => {
    const slot = TYPE_TO_SLOT[item.type];
    const isOwned = ownedIds.has(item._id);
    return {
      ...item,
      isOwned,
      isEquipped: Boolean(slot) && getId(equipped?.[slot]) === item._id,
      isLocked: !isOwned,
      isLimited: Boolean(item.isLimited),
    };
  });
}

export function filterWardrobeItems(items = [], filters = {}) {
  const {
    type,
    query = '',
    rarity = 'all',
    ownership = 'all',
    sort = 'default',
  } = filters;
  const normalizedQuery = query.trim().toLocaleLowerCase();
  const filtered = items.filter((item) => {
    if (type && item.type !== type) return false;
    if (normalizedQuery && !item.name?.toLocaleLowerCase().includes(normalizedQuery)) return false;
    if (rarity !== 'all' && item.rarity !== rarity) return false;
    if (ownership === 'owned' && !item.isOwned) return false;
    if (ownership === 'locked' && !item.isLocked) return false;
    if (ownership === 'equipped' && !item.isEquipped) return false;
    return true;
  });

  if (sort === 'name') return filtered.sort((a, b) => a.name.localeCompare(b.name));
  if (sort === 'rarity') {
    return filtered.sort((a, b) => (
      (RARITY_ORDER[b.rarity] ?? -1) - (RARITY_ORDER[a.rarity] ?? -1)
      || a.wardrobeOrder - b.wardrobeOrder
    ));
  }
  return filtered.sort((a, b) => a.wardrobeOrder - b.wardrobeOrder);
}

export function getWardrobeCounts(items = []) {
  return items.reduce((counts, item) => {
    if (Object.hasOwn(counts, item.type)) counts[item.type] += 1;
    return counts;
  }, { protector: 0, avatar_frame: 0, field: 0 });
}

export function paginateWardrobeItems(items = [], requestedPage = 1, pageSize = 10) {
  const safePageSize = Math.max(1, Number(pageSize) || 10);
  const totalPages = Math.max(1, Math.ceil(items.length / safePageSize));
  const page = Math.min(totalPages, Math.max(1, Number(requestedPage) || 1));
  const start = (page - 1) * safePageSize;
  return { items: items.slice(start, start + safePageSize), page, totalPages };
}
