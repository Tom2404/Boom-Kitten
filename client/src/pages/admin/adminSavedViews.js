export function materializeSavedViewFilters(defaults, savedFilters = {}) {
  return Object.fromEntries(Object.keys(defaults).map((key) => [key, savedFilters[key] ?? defaults[key]]));
}

export function buildSavedViewMutation({ scope, name, filters, requestId }) {
  const compactFilters = Object.fromEntries(Object.entries(filters || {}).filter(([, value]) => value !== '' && value !== null && value !== undefined));
  return { scope, name: name.trim(), filters: compactFilters, schemaVersion: 1, requestId };
}
