export const VFX_ASSETS = {
  skipArrow: '/vfx/skip-arrow.png',
  reverseArrow: '/vfx/reverse-arrow.png',
  nopeStamp: '/vfx/nope-stamp.png',
  explosionSheet: '/vfx/explosion-sheet.png',
  defuse: '/vfx/defuse.png',
  slash: '/vfx/slash.png',
  alterFuture: '/vfx/alter_the_future.png',
  seeFuture: '/vfx/see_the_future.png',
  shuffle: '/vfx/shuffle.png',
  smokeSheet: '/vfx/smoke-sheet.png',
  pixelBurst: '/vfx/pixel-burst.png',
  spark: '/vfx/spark.png',
  legacySlash: '/vfx/slash.png',
  legacyShield: null,
};

export const REQUIRED_VFX_ASSET_URLS = [
  VFX_ASSETS.skipArrow,
  VFX_ASSETS.reverseArrow,
  VFX_ASSETS.nopeStamp,
  VFX_ASSETS.explosionSheet,
  VFX_ASSETS.defuse,
  VFX_ASSETS.slash,
  VFX_ASSETS.alterFuture,
  VFX_ASSETS.seeFuture,
  VFX_ASSETS.shuffle,
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
};
