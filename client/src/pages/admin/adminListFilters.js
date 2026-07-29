const includes = (value, search) => String(value || '').toLocaleLowerCase().includes(search.trim().toLocaleLowerCase());
const matchesStatus = (item, status) => !status || (status === 'active' ? item.isActive !== false : item.isActive === false);

export function filterCatalog(items, filters) {
  return items.filter((item) => (
    (!filters.search || includes(item.name, filters.search))
    && (!filters.type || item.type === filters.type)
    && (!filters.rarity || item.rarity === filters.rarity)
    && matchesStatus(item, filters.status)
  ));
}

export function getCatalogSummary(items) {
  const active = items.filter((item) => item.isActive !== false).length;
  return { total: items.length, active, inactive: items.length - active };
}

export function filterQuests(items, filters) {
  return items.filter((item) => (
    (!filters.search || includes(item.title, filters.search))
    && (!filters.actionType || item.actionType === filters.actionType)
    && matchesStatus(item, filters.status)
  ));
}

export function getQuestSummary(items) {
  const active = items.filter((item) => item.isActive !== false).length;
  return {
    total: items.length,
    active,
    inactive: items.length - active,
    rewardCoins: items.reduce((sum, item) => sum + (Number(item.reward?.coins) || 0), 0),
  };
}
