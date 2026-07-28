export const VFX_ASSETS = {
  explosionSheet: '/vfx/explosion-sheet.png',
  smokeSheet: '/vfx/smoke-sheet.png',
  pixelBurst: '/vfx/pixel-burst.png',
  spark: '/vfx/spark.png',
};

export const REQUIRED_VFX_ASSET_URLS = [
  VFX_ASSETS.explosionSheet,
].filter(Boolean);

export const OPTIONAL_VFX_ASSET_URLS = [
  VFX_ASSETS.smokeSheet,
  VFX_ASSETS.pixelBurst,
  VFX_ASSETS.spark,
].filter(Boolean);

export const VFX_SOUND_IDS = {
  swoosh: 'sfx_swoosh',
  boom: 'sfx_boom',
  stamp: 'sfx_stamp',
  defuse: 'sfx_defuse',
  shuffle: 'sfx_shuffle',
  turn: 'sfx_turn',
  cardWhoosh: 'sfx_card_whoosh',
  cardDrop: 'sfx_card_drop',
};
