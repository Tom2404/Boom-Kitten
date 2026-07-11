const LEGACY_RANKS = {
  Bronze: 'Bronze II',
  'Bronze IV': 'Bronze II',
  'Bronze III': 'Bronze II',
  Silver: 'Silver III',
  'Silver IV': 'Silver III',
  Gold: 'Gold III',
  'Gold IV': 'Gold III',
  Platinum: 'Platinum IV',
  Diamond: 'Diamond IV',
};

function normalizeLegacyRank(rank) {
  if (!rank) return 'Bronze II';
  return LEGACY_RANKS[rank] || rank;
}

module.exports = { normalizeLegacyRank };
