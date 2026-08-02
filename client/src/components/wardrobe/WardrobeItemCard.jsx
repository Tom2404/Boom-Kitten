import React from 'react';
import { PixelLockIcon } from '../PixelIcons.jsx';
import { useLanguage } from '../../context/LanguageContext.jsx';
import WardrobeAsset, { WARDROBE_ITEM_META } from './WardrobeAsset.jsx';

export default function WardrobeItemCard({
  item,
  isPinned,
  isTransient,
  pending,
  onPin,
  onTransient,
  onShop,
  onUnequip,
}) {
  const { t, language } = useLanguage();
  const meta = WARDROBE_ITEM_META[item.type];
  const limitedUntil = item.availableUntil
    ? new Intl.DateTimeFormat(language === 'en' ? 'en-US' : 'vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(item.availableUntil))
    : '';

  const clearTransientWhenLeaving = (event) => {
    if (!event.currentTarget.contains(event.relatedTarget)) onTransient(null);
  };

  return (
    <article
      className="wardrobe-item-card wardrobe-item relative flex min-w-0 flex-col border-2 border-[var(--pop-black)] bg-[var(--wardrobe-surface)] p-2 shadow-[3px_3px_0_var(--pop-black)]"
      data-rarity={item.rarity || 'common'}
      data-previewed={isPinned || isTransient ? 'true' : 'false'}
      data-locked={item.isLocked ? 'true' : 'false'}
      data-equipped={item.isEquipped ? 'true' : 'false'}
      onMouseEnter={() => onTransient(item)}
      onMouseLeave={() => onTransient(null)}
      onFocus={() => onTransient(item)}
      onBlur={clearTransientWhenLeaving}
    >
      {item.isEquipped && (
        <span className="wardrobe-status-badge absolute -left-1 top-2 z-20 bg-[var(--pop-green)]">
          {t('shop_equipped')}
        </span>
      )}
      {(isPinned || isTransient) && !item.isEquipped && (
        <span className="wardrobe-status-badge absolute -left-1 top-2 z-20 bg-cyan-500">
          {t('wardrobe_previewing')}
        </span>
      )}
      {item.isLimited && (
        <span className="wardrobe-status-badge absolute -right-1 top-2 z-20 bg-[var(--pop-amber)] text-[var(--pop-black)]">
          {t('wardrobe_limited')}
        </span>
      )}

      <button
        type="button"
        onClick={() => (item.isEquipped ? onUnequip(item) : onPin(isPinned ? null : item))}
        disabled={pending}
        aria-pressed={item.isEquipped ? undefined : isPinned}
        className="flex flex-1 flex-col text-left focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-cyan-600"
      >
        <span className="relative flex h-36 items-center justify-center overflow-hidden border-2 border-[var(--pop-black)] bg-[var(--pop-cream)] p-2">
          <span className={`${meta.aspect} block ${item.type === 'protector' ? 'h-full w-auto' : 'w-full max-w-[9rem]'}`}>
            <WardrobeAsset item={item} type={item.type} alt={item.name} />
          </span>
          {item.isLocked && (
            <span className="absolute left-1/2 top-1/2 flex h-12 w-12 -translate-x-1/2 -translate-y-1/2 items-center justify-center border-2 border-[var(--pop-black)] bg-[var(--pop-black)] text-white shadow-[3px_3px_0_var(--pop-red)]" aria-hidden="true">
              <PixelLockIcon size={23} />
            </span>
          )}
        </span>

        <span className="mt-2 flex min-w-0 flex-1 flex-col items-center text-center">
          <span className="wardrobe-rarity-label font-pixel text-[11px] font-black uppercase">
            {t(`wardrobe_rarity_${item.rarity || 'common'}`)}
          </span>
          <span className="mt-1 line-clamp-2 font-pop-accent text-[15px] font-black leading-tight">{item.name}</span>
          {item.isLocked && (
            <span className="mt-1 flex items-center gap-1 text-[10px] font-bold text-[var(--pop-black)]/60">
              <PixelLockIcon size={10} aria-hidden="true" /> {t('wardrobe_locked')}
            </span>
          )}
          {item.isLimited && limitedUntil && (
            <span className="mt-1 text-[9px] font-bold text-[var(--pop-black)]/55">
              {t('wardrobe_available_until', { date: limitedUntil })}
            </span>
          )}
        </span>

        <span className={`wardrobe-card-action mt-2 w-full ${item.isEquipped ? 'bg-[var(--pop-green)] text-white' : 'bg-white'}`}>
          {item.isEquipped ? t('shop_unequip') : isPinned ? t('wardrobe_preview_cancel') : t('wardrobe_try_on')}
        </span>
      </button>

      {item.isLocked && (
        <button type="button" onClick={onShop} className="mt-2 border-2 border-[var(--pop-black)] bg-[var(--pop-red)] px-2 py-2 font-pixel text-xs font-black uppercase text-white shadow-[2px_2px_0_var(--pop-black)]">
          {item.price?.coins ? t('wardrobe_shop_price', { coins: item.price.coins }) : t('wardrobe_shop_cta')}
        </button>
      )}
      {pending && <span className="absolute inset-0 z-30 cursor-wait bg-[var(--pop-cream)]/60" aria-hidden="true" />}
    </article>
  );
}
