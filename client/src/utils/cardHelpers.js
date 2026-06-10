// Helper utilities for card metadata and display names.
export const cardNameMap = {
  exploding_kitten: 'Exploding Kitten',
  defuse: 'Defuse',
  nope: 'Nope',
  attack: 'Attack',
  skip: 'Skip',
  see_the_future: 'See The Future',
  shuffle: 'Shuffle',
  favor: 'Favor',
};

export function formatCardName(type) {
  return cardNameMap[type] ?? type.replaceAll('_', ' ');
}
