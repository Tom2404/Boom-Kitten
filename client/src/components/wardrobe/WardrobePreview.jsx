import React, { useState } from 'react';
import { PRESET_AVATARS } from '../PlayerAvatar.jsx';
import { PixelStarIcon, PixelWardrobeIcon } from '../PixelIcons.jsx';
import { EQUIPMENT_SLOTS } from '../../utils/shopEquipment.js';
import { useLanguage } from '../../context/LanguageContext.jsx';
import WardrobeAsset, { WARDROBE_ITEM_META } from './WardrobeAsset.jsx';

const getId = (item) => String(item?.id || item?._id || '');

function PlayerPortrait({ profile, frame }) {
  const avatar = profile.avatar;
  const initials = profile.username?.slice(0, 2).toUpperCase() || 'BK';
  const rarity = frame?.rarity || 'common';

  let auraGlow = '';
  if (rarity === 'legendary') auraGlow = 'ring-4 ring-yellow-400 shadow-[0_0_24px_rgba(250,204,21,0.9)]';
  else if (rarity === 'epic') auraGlow = 'ring-4 ring-purple-500 shadow-[0_0_20px_rgba(168,85,247,0.85)]';
  else if (rarity === 'rare') auraGlow = 'ring-4 ring-cyan-400 shadow-[0_0_16px_rgba(6,182,212,0.8)]';

  return (
    <div className="relative z-20 h-36 w-36 sm:h-40 sm:w-40 transition-transform duration-200 hover:scale-105">
      {/* Dynamic Rarity Aura behind portrait */}
      <div className={`absolute inset-2 flex items-center justify-center overflow-hidden border-3 border-[var(--pop-black)] bg-[var(--pop-cream)] shadow-[4px_4px_0_var(--pop-black)] ${auraGlow}`}>
        {avatar && PRESET_AVATARS[avatar] ? (
          <span className="text-5xl sm:text-6xl" aria-hidden="true">{PRESET_AVATARS[avatar]}</span>
        ) : avatar ? (
          <img src={avatar} alt="" className="h-full w-full object-cover" onError={(event) => { event.currentTarget.hidden = true; }} />
        ) : (
          <span className="font-pixel text-3xl font-black text-[var(--pop-black)]">{initials}</span>
        )}
      </div>

      {/* Frame overlay */}
      {frame && (
        <WardrobeAsset item={frame} type="avatar_frame" decorative className="absolute inset-0 z-10" />
      )}
    </div>
  );
}

function ProtectorStack({ protector }) {
  return (
    <div className="absolute bottom-5 left-5 z-20 h-24 w-20 sm:h-28 sm:w-24 group cursor-pointer" aria-hidden="true" title="Card Protector Stack">
      {[0, 1, 2].map((index) => (
        <div
          key={index}
          className="absolute bottom-0 left-1/2 aspect-[5/7] h-20 origin-bottom -translate-x-1/2 border-2 border-[var(--pop-black)] bg-[var(--pop-cream)] shadow-[3px_3px_0_var(--pop-black)] transition-transform duration-200 group-hover:scale-110 sm:h-24"
          style={{
            transform: `translateX(-50%) rotate(${(index - 1) * 9}deg) translateX(${(index - 1) * 14}px)`,
          }}
        >
          <WardrobeAsset item={protector} type="protector" decorative />
        </div>
      ))}
    </div>
  );
}

export default function WardrobePreview({
  profile,
  equipped,
  previewLoadout,
  previewItem,
  pinnedItem,
  pendingItemId,
  onApply,
  onCancelPreview,
  onChangeType,
  onUnequip,
  onShop,
  onRandomize,
  presets = [],
  onSavePreset,
  onApplyPreset,
  onDeletePreset,
}) {
  const { t } = useLanguage();
  const [expanded, setExpanded] = useState(true);
  const [showPresetModal, setShowPresetModal] = useState(false);
  const [newPresetName, setNewPresetName] = useState('');

  const pinnedSlot = EQUIPMENT_SLOTS.find(({ type }) => type === pinnedItem?.type)?.slot;
  const pinnedIsEquipped = pinnedSlot && getId(equipped[pinnedSlot]) === getId(pinnedItem);

  const handleSavePresetSubmit = (e) => {
    e.preventDefault();
    if (!newPresetName.trim() || !onSavePreset) return;
    onSavePreset(newPresetName.trim());
    setNewPresetName('');
  };

  return (
    <aside className="wardrobe-panel overflow-hidden lg:sticky lg:top-[76px]" aria-labelledby="wardrobe-preview-heading">
      {/* Header Bar */}
      <div className="flex items-center justify-between border-b-3 border-[var(--pop-black)] bg-[var(--pop-red)] px-4 py-3 text-white">
        <h2 id="wardrobe-preview-heading" className="flex items-center gap-2 font-pixel text-sm font-black uppercase tracking-wide">
          <PixelWardrobeIcon size={18} aria-hidden="true" />
          {t('wardrobe_preview_title')}
        </h2>
        <div className="flex items-center gap-2">
          {onRandomize && (
            <button
              type="button"
              onClick={onRandomize}
              className="border-2 border-white bg-amber-400 px-2 py-0.5 font-pixel text-[11px] font-black uppercase text-[var(--pop-black)] shadow-[1px_1px_0_var(--pop-black)] transition-transform hover:scale-105 active:translate-x-0.5 active:translate-y-0.5"
              title={t('wardrobe_randomize')}
            >
              🎲 {t('wardrobe_randomize')}
            </button>
          )}
          <button
            type="button"
            onClick={() => setExpanded((value) => !value)}
            className="border-2 border-white/80 px-2 py-1 font-pixel text-[10px] font-black uppercase lg:hidden"
            aria-expanded={expanded}
            aria-controls="wardrobe-preview-content"
          >
            {expanded ? t('wardrobe_collapse') : t('wardrobe_expand')}
          </button>
        </div>
      </div>

      <div id="wardrobe-preview-content" className={`${expanded ? 'block' : 'hidden'} lg:block`}>
        {/* Live Match Stage Showcase */}
        <div className="wardrobe-preview-stage relative isolate flex aspect-[5/4] min-h-80 items-end justify-center overflow-hidden border-b-3 border-[var(--pop-black)] bg-[#1e1424] p-5">
          {/* Field Background */}
          {previewLoadout.field && (
            <WardrobeAsset item={previewLoadout.field} type="field" decorative className="absolute inset-0 z-0" />
          )}

          {/* Table Vignette and Spotlight */}
          <div className="absolute inset-0 z-10 bg-gradient-to-t from-black/70 via-black/20 to-black/30" aria-hidden="true" />
          <span className="wardrobe-preview-spotlight" aria-hidden="true" />

          {/* 3D Card Stack on left */}
          <ProtectorStack protector={previewLoadout.protector} />

          {/* Character & Nameplate in center */}
          <div className="wardrobe-preview-focus relative z-20 mb-3 flex w-full flex-col items-center">
            <PlayerPortrait profile={profile} frame={previewLoadout.avatarFrame} />

            <div className="mt-2.5 flex w-full max-w-sm items-center justify-center gap-2 px-3">
              <p className="min-w-0 flex-1 truncate border-2 border-[var(--pop-black)] bg-[var(--pop-cream)] px-3 py-1.5 text-center font-pixel text-sm font-black text-[var(--pop-black)] shadow-[3px_3px_0_var(--pop-black)]">
                {profile.username}
              </p>
              <span className={`wardrobe-preview-status wardrobe-status-badge ${previewItem ? 'bg-cyan-500 text-white' : 'bg-[var(--pop-green)] text-white'}`}>
                {previewItem ? t('wardrobe_previewing') : t('wardrobe_equipped_label')}
              </span>
            </div>
          </div>
        </div>

        {/* Loadout Slots List */}
        <div className="space-y-2.5 p-3.5 sm:p-4">
          <div className="flex items-center justify-between">
            <h3 className="font-pixel text-xs font-black uppercase text-[var(--pop-black)]/70">{t('wardrobe_loadout_title')}</h3>
            <button
              type="button"
              onClick={() => setShowPresetModal((val) => !val)}
              className="flex items-center gap-1 border-2 border-[var(--pop-black)] bg-white px-2 py-0.5 font-pixel text-[10px] font-black uppercase shadow-[1px_1px_0_var(--pop-black)] hover:bg-[#fbe1d8]"
            >
              <PixelStarIcon size={10} className="text-amber-500" />
              {t('wardrobe_presets_title')}
            </button>
          </div>

          {/* Preset Management Drawer / Section */}
          {showPresetModal && (
            <div className="border-2 border-[var(--pop-black)] bg-[var(--pop-cream)] p-3 shadow-[2px_2px_0_var(--pop-black)]">
              <form onSubmit={handleSavePresetSubmit} className="flex gap-2">
                <input
                  type="text"
                  value={newPresetName}
                  onChange={(e) => setNewPresetName(e.target.value)}
                  placeholder={t('wardrobe_preset_name_placeholder')}
                  className="h-8 flex-1 border-2 border-[var(--pop-black)] bg-white px-2 text-xs font-bold outline-none"
                  maxLength={24}
                />
                <button
                  type="submit"
                  disabled={!newPresetName.trim()}
                  className="border-2 border-[var(--pop-black)] bg-[var(--pop-red)] px-2.5 font-pixel text-[10px] font-black uppercase text-white shadow-[1px_1px_0_var(--pop-black)] disabled:opacity-50"
                >
                  {t('wardrobe_preset_save')}
                </button>
              </form>

              {presets.length > 0 ? (
                <div className="mt-2.5 max-h-36 space-y-1.5 overflow-y-auto">
                  {presets.map((preset) => (
                    <div key={preset.id} className="flex items-center justify-between border border-[var(--pop-black)] bg-white p-1.5 text-xs">
                      <span className="truncate font-pixel font-bold">{preset.name}</span>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => onApplyPreset && onApplyPreset(preset)}
                          className="border border-[var(--pop-black)] bg-[var(--pop-green)] px-1.5 py-0.5 font-pixel text-[9px] font-black uppercase text-white"
                        >
                          {t('wardrobe_preset_apply')}
                        </button>
                        <button
                          type="button"
                          onClick={() => onDeletePreset && onDeletePreset(preset.id)}
                          className="border border-[var(--pop-black)] bg-stone-100 px-1 py-0.5 font-pixel text-[9px] font-black text-rose-600 hover:bg-rose-100"
                          title={t('wardrobe_preset_delete')}
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mt-2 font-pixel text-[11px] text-[var(--pop-black)]/60 text-center">
                  {t('wardrobe_preset_empty')}
                </p>
              )}
            </div>
          )}

          {/* Slot Cards */}
          {EQUIPMENT_SLOTS.map(({ slot, type }) => {
            const item = previewLoadout[slot];
            const canonicalItem = equipped[slot];
            const meta = WARDROBE_ITEM_META[type];
            const isPreviewSlot = previewItem?.type === type && getId(previewItem) === getId(item);
            return (
              <article key={slot} className="wardrobe-loadout-slot grid grid-cols-[3.5rem_minmax(0,1fr)_auto] items-center gap-3 border-2 border-[var(--pop-black)] bg-white p-2.5 shadow-[3px_3px_0_var(--pop-black)]">
                <div className="h-14 w-14 overflow-hidden border-2 border-[var(--pop-black)] bg-[var(--pop-cream)]">
                  <WardrobeAsset item={item} type={type} decorative />
                </div>
                <div className="min-w-0">
                  <h4 className="font-pixel text-xs font-black uppercase text-[var(--pop-black)]/60">{t(meta.labelKey)}</h4>
                  <p className="truncate text-sm font-black text-[var(--pop-black)]">{item?.name || t('shop_default')}</p>
                  <p className="font-pixel text-[10px] font-black uppercase text-[var(--pop-black)]/60">
                    {isPreviewSlot ? t('wardrobe_previewing') : item ? t(`wardrobe_rarity_${item.rarity || 'common'}`) : t('shop_default')}
                  </p>
                </div>
                <div className="flex items-center gap-1.5">
                  <button type="button" onClick={() => onChangeType(type)} className="wardrobe-slot-button hover:bg-[#fbe1d8]">
                    {t('wardrobe_change')}
                  </button>
                  {canonicalItem && (
                    <button type="button" disabled={Boolean(pendingItemId)} onClick={() => onUnequip(slot, canonicalItem)} className="wardrobe-slot-button wardrobe-slot-button--muted disabled:opacity-50">
                      {pendingItemId === `unequip:${slot}` ? t('shop_unequipping') : t('shop_unequip')}
                    </button>
                  )}
                </div>
              </article>
            );
          })}
        </div>

        {/* Pinned / Preview Action Dock */}
        {pinnedItem && (
          <div className="wardrobe-action-dock flex gap-2 border-t-3 border-[var(--pop-black)] bg-[var(--pop-cream)] p-3 sm:p-4">
            <button type="button" onClick={onCancelPreview} className="wardrobe-secondary-button flex-1">
              {t('wardrobe_preview_cancel')}
            </button>
            {pinnedItem.isLocked ? (
              <button type="button" onClick={onShop} className="wardrobe-primary-button flex-[1.4]">
                {t('wardrobe_shop_cta')}
              </button>
            ) : pinnedIsEquipped ? (
              <button type="button" disabled={Boolean(pendingItemId)} onClick={() => onUnequip(pinnedSlot, pinnedItem)} className="wardrobe-primary-button flex-[1.4] disabled:opacity-50">
                {pendingItemId ? t('shop_unequipping') : t('shop_unequip')}
              </button>
            ) : (
              <button type="button" disabled={Boolean(pendingItemId)} onClick={() => onApply(pinnedItem)} className="wardrobe-primary-button flex-[1.4] disabled:opacity-50">
                {pendingItemId ? t('shop_equipping') : t('wardrobe_preview_apply')}
              </button>
            )}
          </div>
        )}
      </div>
    </aside>
  );
}
