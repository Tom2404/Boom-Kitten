import React, { useState } from 'react';
import { PRESET_AVATARS } from '../PlayerAvatar.jsx';
import { PixelWardrobeIcon } from '../PixelIcons.jsx';
import { EQUIPMENT_SLOTS } from '../../utils/shopEquipment.js';
import { useLanguage } from '../../context/LanguageContext.jsx';
import WardrobeAsset, { WARDROBE_ITEM_META } from './WardrobeAsset.jsx';

const getId = (item) => String(item?.id || item?._id || '');

function PlayerPortrait({ profile, frame }) {
  const avatar = profile.avatar;
  const initials = profile.username?.slice(0, 2).toUpperCase() || 'BK';

  return (
    <div className="relative z-20 h-40 w-40 sm:h-44 sm:w-44">
      <div className="absolute inset-3 flex items-center justify-center overflow-hidden border-3 border-[var(--pop-black)] bg-[var(--pop-cream)] shadow-[4px_4px_0_var(--pop-black)]">
        {avatar && PRESET_AVATARS[avatar] ? (
          <span className="text-6xl" aria-hidden="true">{PRESET_AVATARS[avatar]}</span>
        ) : avatar ? (
          <img src={avatar} alt="" className="h-full w-full object-cover" onError={(event) => { event.currentTarget.hidden = true; }} />
        ) : (
          <span className="font-pixel text-3xl font-black">{initials}</span>
        )}
      </div>
      {frame && (
        <WardrobeAsset item={frame} type="avatar_frame" decorative className="absolute inset-0 z-10" />
      )}
    </div>
  );
}

function ProtectorStack({ protector }) {
  return (
    <div className="absolute bottom-6 left-6 z-20 h-24 w-20 sm:h-28 sm:w-24" aria-hidden="true">
      {[0, 1, 2].map((index) => (
        <div
          key={index}
          className="absolute bottom-0 left-1/2 aspect-[5/7] h-20 origin-bottom -translate-x-1/2 border-2 border-[var(--pop-black)] bg-[var(--pop-cream)] shadow-[2px_2px_0_var(--pop-black)] sm:h-24"
          style={{ transform: `translateX(-50%) rotate(${(index - 1) * 7}deg) translateX(${(index - 1) * 11}px)` }}
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
}) {
  const { t } = useLanguage();
  const [expanded, setExpanded] = useState(true);
  const pinnedSlot = EQUIPMENT_SLOTS.find(({ type }) => type === pinnedItem?.type)?.slot;
  const pinnedIsEquipped = pinnedSlot && getId(equipped[pinnedSlot]) === getId(pinnedItem);

  return (
    <aside className="wardrobe-panel overflow-hidden lg:sticky lg:top-[76px]" aria-labelledby="wardrobe-preview-heading">
      <div className="flex items-center justify-between border-b-3 border-[var(--pop-black)] bg-[var(--pop-red)] px-4 py-3 text-white">
        <h2 id="wardrobe-preview-heading" className="flex items-center gap-2 font-pixel text-sm font-black uppercase tracking-wide">
          <PixelWardrobeIcon size={17} aria-hidden="true" />
          {t('wardrobe_preview_title')}
        </h2>
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

      <div id="wardrobe-preview-content" className={`${expanded ? 'block' : 'hidden'} lg:block`}>
        <div className="wardrobe-preview-stage relative isolate flex aspect-[5/4] min-h-80 items-end justify-center overflow-hidden border-b-3 border-[var(--pop-black)] bg-[#312337] p-5">
          {previewLoadout.field && (
            <WardrobeAsset item={previewLoadout.field} type="field" decorative className="absolute inset-0 z-0" />
          )}
          <div className="absolute inset-0 z-10 bg-gradient-to-t from-black/55 via-transparent to-black/15" aria-hidden="true" />
          <span className="wardrobe-preview-spotlight" aria-hidden="true" />
          <ProtectorStack protector={previewLoadout.protector} />
          <div className="wardrobe-preview-focus relative z-20 mb-4 flex w-full flex-col items-center">
            <PlayerPortrait profile={profile} frame={previewLoadout.avatarFrame} />
            <div className="mt-2 flex w-full max-w-sm items-center justify-center gap-2 px-3">
              <p className="min-w-0 flex-1 truncate border-2 border-[var(--pop-black)] bg-[var(--pop-cream)] px-3 py-1.5 text-center font-pixel text-sm font-black shadow-[2px_2px_0_var(--pop-black)]">
                {profile.username}
              </p>
              <span className={`wardrobe-preview-status wardrobe-status-badge ${previewItem ? 'bg-cyan-500' : 'bg-[var(--pop-green)]'}`}>
                {previewItem ? t('wardrobe_previewing') : t('wardrobe_equipped_label')}
              </span>
            </div>
          </div>
        </div>

        <div className="space-y-2 p-3 sm:p-4">
          <h3 className="font-pixel text-xs font-black uppercase text-[var(--pop-black)]/65">{t('wardrobe_loadout_title')}</h3>
          {EQUIPMENT_SLOTS.map(({ slot, type }) => {
            const item = previewLoadout[slot];
            const canonicalItem = equipped[slot];
            const meta = WARDROBE_ITEM_META[type];
            const isPreviewSlot = previewItem?.type === type && getId(previewItem) === getId(item);
            return (
              <article key={slot} className="wardrobe-loadout-slot grid grid-cols-[3.5rem_minmax(0,1fr)_auto] items-center gap-3">
                <div className="h-14 w-14 overflow-hidden border-2 border-[var(--pop-black)] bg-[var(--pop-cream)]">
                  <WardrobeAsset item={item} type={type} decorative />
                </div>
                <div className="min-w-0">
                  <h4 className="font-pixel text-xs font-black uppercase">{t(meta.labelKey)}</h4>
                  <p className="truncate text-sm font-bold">{item?.name || t('shop_default')}</p>
                  <p className="font-pixel text-[10px] font-black uppercase text-[var(--pop-black)]/55">
                    {isPreviewSlot ? t('wardrobe_previewing') : item ? t(`wardrobe_rarity_${item.rarity || 'common'}`) : t('shop_default')}
                  </p>
                </div>
                <div className="flex items-center gap-1.5">
                  <button type="button" onClick={() => onChangeType(type)} className="wardrobe-slot-button">
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

        {pinnedItem && (
          <div className="wardrobe-action-dock flex gap-2 border-t-3 border-[var(--pop-black)] bg-[var(--pop-cream)] p-3">
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
