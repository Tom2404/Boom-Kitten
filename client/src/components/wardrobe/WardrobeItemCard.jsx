import React, { useRef, useState } from 'react';
import { PixelLockIcon, PixelStarIcon } from '../PixelIcons.jsx';
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
  const cardRef = useRef(null);
  const [tiltStyle, setTiltStyle] = useState({});
  const meta = WARDROBE_ITEM_META[item.type];
  const rarity = item.rarity || 'common';
  const isLegendary = rarity === 'legendary';
  const isEpic = rarity === 'epic';

  const limitedUntil = item.availableUntil
    ? new Intl.DateTimeFormat(language === 'en' ? 'en-US' : 'vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(item.availableUntil))
    : '';

  const handleMouseMove = (event) => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || !cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const rotateX = ((y - centerY) / centerY) * -7;
    const rotateY = ((x - centerX) / centerX) * 7;

    setTiltStyle({
      transform: `perspective(600px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) translateY(-4px)`,
    });
  };

  const handleMouseLeave = () => {
    setTiltStyle({});
    onTransient(null);
  };

  const clearTransientWhenLeaving = (event) => {
    if (!event.currentTarget.contains(event.relatedTarget)) {
      setTiltStyle({});
      onTransient(null);
    }
  };

  return (
    <article
      ref={cardRef}
      className="wardrobe-item-card wardrobe-item group relative flex min-w-0 flex-col border-3 border-[var(--pop-black)] bg-[var(--wardrobe-surface)] p-2.5 shadow-[4px_4px_0_var(--pop-black)] transition-all duration-150"
      style={tiltStyle}
      data-rarity={rarity}
      data-previewed={isPinned || isTransient ? 'true' : 'false'}
      data-locked={item.isLocked ? 'true' : 'false'}
      data-equipped={item.isEquipped ? 'true' : 'false'}
      onMouseEnter={() => onTransient(item)}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onFocus={() => onTransient(item)}
      onBlur={clearTransientWhenLeaving}
    >
      {/* Holographic foil overlay on hover */}
      {(isLegendary || isEpic) && <div className="wardrobe-holo-foil" aria-hidden="true" />}

      {/* Top Left Badges */}
      {item.isEquipped && (
        <span className="wardrobe-status-badge absolute -left-1.5 top-2.5 z-20 flex items-center gap-1 bg-[var(--pop-green)]">
          <span className="h-1.5 w-1.5 rounded-full bg-white animate-ping" />
          {t('shop_equipped')}
        </span>
      )}
      {(isPinned || isTransient) && !item.isEquipped && (
        <span className="wardrobe-status-badge absolute -left-1.5 top-2.5 z-20 flex items-center gap-1 bg-cyan-500">
          <PixelStarIcon size={10} className="text-white" />
          {t('wardrobe_previewing')}
        </span>
      )}
      {item.isLimited && (
        <span className="wardrobe-status-badge absolute -right-1.5 top-2.5 z-20 bg-[var(--pop-amber)] text-[var(--pop-black)]">
          {t('wardrobe_limited')}
        </span>
      )}

      {/* Main Card Action Area */}
      <button
        type="button"
        onClick={() => (item.isEquipped ? onUnequip(item) : onPin(isPinned ? null : item))}
        disabled={pending}
        aria-pressed={item.isEquipped ? undefined : isPinned}
        className="flex flex-1 flex-col text-left focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-cyan-600"
      >
        {/* Asset Showcase Frame */}
        <span className="relative flex h-36 items-center justify-center overflow-hidden border-2 border-[var(--pop-black)] bg-[var(--pop-cream)] p-2 transition-transform duration-150 group-hover:scale-[1.02]">
          <span className={`${meta.aspect} block ${item.type === 'protector' ? 'h-full w-auto' : 'w-full max-w-[9rem]'}`}>
            <WardrobeAsset item={item} type={item.type} alt={item.name} />
          </span>
          {item.isLocked && (
            <span className="absolute left-1/2 top-1/2 flex h-12 w-12 -translate-x-1/2 -translate-y-1/2 items-center justify-center border-2 border-[var(--pop-black)] bg-[var(--pop-black)] text-white shadow-[3px_3px_0_var(--pop-red)]" aria-hidden="true">
              <PixelLockIcon size={23} />
            </span>
          )}
        </span>

        {/* Item Details */}
        <span className="mt-2.5 flex min-w-0 flex-1 flex-col items-center text-center">
          <span className="wardrobe-rarity-label font-pixel text-[11px] font-black uppercase">
            {t(`wardrobe_rarity_${rarity}`)}
          </span>
          <span className="mt-1.5 line-clamp-2 font-pop-accent text-[15px] font-black leading-tight text-[var(--pop-black)]">
            {item.name}
          </span>
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

        {/* Primary Card Button */}
        <span className={`wardrobe-card-action mt-2.5 w-full transition-colors duration-150 ${item.isEquipped ? 'bg-[var(--pop-green)] text-white hover:bg-emerald-600' : isPinned ? 'bg-cyan-500 text-white' : 'bg-white hover:bg-[#fbe1d8]'}`}>
          {item.isEquipped ? t('shop_unequip') : isPinned ? t('wardrobe_preview_cancel') : t('wardrobe_try_on')}
        </span>
      </button>

      {/* Shop Link for locked items */}
      {item.isLocked && (
        <button
          type="button"
          onClick={onShop}
          className="mt-2 border-2 border-[var(--pop-black)] bg-[var(--pop-red)] px-2 py-2 font-pixel text-xs font-black uppercase text-white shadow-[2px_2px_0_var(--pop-black)] transition-transform duration-100 hover:scale-[1.02] active:translate-x-0.5 active:translate-y-0.5"
        >
          {item.price?.coins ? t('wardrobe_shop_price', { coins: item.price.coins }) : t('wardrobe_shop_cta')}
        </button>
      )}

      {/* Loading Overlay */}
      {pending && <span className="absolute inset-0 z-30 cursor-wait bg-[var(--pop-cream)]/70" aria-hidden="true" />}
    </article>
  );
}
