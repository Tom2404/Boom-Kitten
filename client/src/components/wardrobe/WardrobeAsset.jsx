import React, { useState } from 'react';
import {
  PixelBombIcon,
  PixelCardBackIcon,
  PixelFieldIcon,
  PixelFrameIcon,
  PixelSkullIcon,
  PixelStarIcon,
} from '../PixelIcons.jsx';
import { getAssetTransformStyle, getEquippedAssetUrl } from '../../utils/shopEquipment.js';

export const WARDROBE_ITEM_META = Object.freeze({
  protector: { labelKey: 'wardrobe_slot_protector', Icon: PixelCardBackIcon, aspect: 'aspect-[5/7]' },
  avatar_frame: { labelKey: 'wardrobe_slot_avatar_frame', Icon: PixelFrameIcon, aspect: 'aspect-square' },
  field: { labelKey: 'wardrobe_slot_field', Icon: PixelFieldIcon, aspect: 'aspect-video' },
});

function VectorCardBack({ item, rarity }) {
  const name = item?.name?.toLowerCase() || '';
  const isLegendary = rarity === 'legendary';
  const isEpic = rarity === 'epic';
  const isRare = rarity === 'rare';

  let bgGradient = 'from-red-600 via-rose-500 to-amber-500';
  let innerBorder = 'border-amber-300';
  let accentColor = '#FAC775';

  if (isLegendary) {
    bgGradient = 'from-amber-600 via-yellow-500 to-orange-600';
    innerBorder = 'border-yellow-200';
    accentColor = '#FFE885';
  } else if (isEpic) {
    bgGradient = 'from-purple-700 via-fuchsia-600 to-indigo-800';
    innerBorder = 'border-fuchsia-300';
    accentColor = '#E879F9';
  } else if (isRare) {
    bgGradient = 'from-cyan-700 via-blue-600 to-sky-500';
    innerBorder = 'border-cyan-200';
    accentColor = '#38BDF8';
  }

  return (
    <div className={`relative h-full w-full overflow-hidden border-2 border-[var(--pop-black)] bg-gradient-to-br ${bgGradient} p-1.5 shadow-[inset_0_0_8px_rgba(0,0,0,0.4)]`}>
      {/* Halftone / geometric background pattern */}
      <div
        className="pointer-events-none absolute inset-0 opacity-25"
        style={{
          backgroundImage: 'radial-gradient(circle, #fff 1.5px, transparent 1.5px)',
          backgroundSize: '8px 8px',
        }}
        aria-hidden="true"
      />

      {/* Inner ornate border frame */}
      <div className={`relative flex h-full w-full flex-col items-center justify-between border-2 border-dashed ${innerBorder} p-1`}>
        {/* Top corner stars */}
        <div className="flex w-full justify-between px-0.5 text-white/90">
          <PixelStarIcon size={10} />
          <PixelStarIcon size={10} />
        </div>

        {/* Center icon / illustration badge */}
        <div className="relative flex flex-col items-center justify-center">
          <div className="relative flex h-14 w-14 items-center justify-center rounded-full border-2 border-[var(--pop-black)] bg-white shadow-[2px_2px_0_var(--pop-black)]">
            {name.includes('dog') || name.includes('chó') ? (
              <span className="text-2xl" role="img" aria-label="dog">🐶</span>
            ) : name.includes('arisa') ? (
              <span className="text-2xl" role="img" aria-label="arisa">🦊</span>
            ) : isLegendary ? (
              <span className="text-2xl" role="img" aria-label="crown">👑</span>
            ) : isEpic ? (
              <PixelBombIcon size={26} className="text-purple-600" />
            ) : isRare ? (
              <PixelSkullIcon size={24} className="text-cyan-600" />
            ) : (
              <span className="text-2xl" role="img" aria-label="cat">😼</span>
            )}
          </div>
          <span
            className="mt-1 max-w-[5.5rem] truncate font-pixel text-[9px] font-black uppercase text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]"
            style={{ color: accentColor }}
          >
            {item?.name || 'BOOM KITTEN'}
          </span>
        </div>

        {/* Bottom corner stars */}
        <div className="flex w-full justify-between px-0.5 text-white/90">
          <PixelStarIcon size={10} />
          <PixelStarIcon size={10} />
        </div>
      </div>
    </div>
  );
}

function VectorAvatarFrame({ item, rarity }) {
  const isLegendary = rarity === 'legendary';
  const isEpic = rarity === 'epic';
  const isRare = rarity === 'rare';

  let borderColor = 'border-amber-400';
  let glowStyle = 'shadow-[0_0_12px_rgba(251,191,36,0.8)]';

  if (isLegendary) {
    borderColor = 'border-yellow-400';
    glowStyle = 'shadow-[0_0_16px_rgba(234,179,8,0.9)] ring-2 ring-amber-300';
  } else if (isEpic) {
    borderColor = 'border-purple-500';
    glowStyle = 'shadow-[0_0_14px_rgba(168,85,247,0.85)] ring-2 ring-fuchsia-400';
  } else if (isRare) {
    borderColor = 'border-cyan-400';
    glowStyle = 'shadow-[0_0_10px_rgba(6,182,212,0.8)] ring-2 ring-cyan-300';
  }

  return (
    <div className={`pointer-events-none absolute inset-0 rounded-none border-4 ${borderColor} ${glowStyle} flex items-center justify-center`}>
      {/* Corner rivet accents */}
      <span className="absolute -left-1 -top-1 h-2.5 w-2.5 border border-black bg-white" />
      <span className="absolute -right-1 -top-1 h-2.5 w-2.5 border border-black bg-white" />
      <span className="absolute -bottom-1 -left-1 h-2.5 w-2.5 border border-black bg-white" />
      <span className="absolute -bottom-1 -right-1 h-2.5 w-2.5 border border-black bg-white" />
      {isLegendary && (
        <span className="absolute -top-3 z-30 flex items-center justify-center rounded-full border border-black bg-amber-400 px-1 text-xs shadow-sm">
          👑
        </span>
      )}
    </div>
  );
}

function VectorFieldBackdrop({ item, rarity }) {
  const isLegendary = rarity === 'legendary';
  const isEpic = rarity === 'epic';
  const isRare = rarity === 'rare';

  let bgClass = 'bg-[#08704F]'; // classic casino felt
  if (isLegendary) bgClass = 'bg-gradient-to-tr from-[#1a1205] via-[#4a2e0a] to-[#78350f]';
  else if (isEpic) bgClass = 'bg-gradient-to-tr from-[#1e1035] via-[#3b0764] to-[#581c87]';
  else if (isRare) bgClass = 'bg-gradient-to-tr from-[#042f2e] via-[#0f766e] to-[#115e59]';

  return (
    <div className={`relative h-full w-full overflow-hidden border-2 border-[var(--pop-black)] ${bgClass} p-2`}>
      {/* Grid overlay */}
      <div
        className="pointer-events-none absolute inset-0 opacity-20"
        style={{
          backgroundImage: 'linear-gradient(to right, #fff 1px, transparent 1px), linear-gradient(to bottom, #fff 1px, transparent 1px)',
          backgroundSize: '16px 16px',
        }}
      />
      {/* Rail & stadium border */}
      <div className="relative flex h-full w-full items-center justify-center rounded-lg border-2 border-white/30 bg-black/20 p-2">
        <span className="font-pixel text-[11px] font-black uppercase tracking-widest text-white/80 drop-shadow">
          {item?.name || 'BATTLE ARENA'}
        </span>
      </div>
    </div>
  );
}

export default function WardrobeAsset({ item, type, alt = '', className = '', decorative = false }) {
  const [imgError, setImgError] = useState(false);
  const meta = WARDROBE_ITEM_META[type] || WARDROBE_ITEM_META.protector;
  const assetUrl = getEquippedAssetUrl(item);
  const fit = type === 'field' ? 'object-cover' : 'object-contain';
  const rarity = item?.rarity || 'common';

  const shouldRenderImage = assetUrl && !imgError;

  return (
    <span className={`wardrobe-asset relative flex h-full w-full items-center justify-center overflow-hidden ${className}`}>
      {shouldRenderImage ? (
        <img
          src={assetUrl}
          alt={decorative ? '' : alt || item?.name || ''}
          style={getAssetTransformStyle(item?.assetTransform)}
          className={`absolute inset-0 h-full w-full ${fit}`}
          loading="lazy"
          onError={() => setImgError(true)}
        />
      ) : (
        /* Rich Pop-Art Vector fallback illustration */
        <div className="h-full w-full">
          {type === 'protector' && <VectorCardBack item={item} rarity={rarity} />}
          {type === 'avatar_frame' && <VectorAvatarFrame item={item} rarity={rarity} />}
          {type === 'field' && <VectorFieldBackdrop item={item} rarity={rarity} />}
        </div>
      )}
    </span>
  );
}
