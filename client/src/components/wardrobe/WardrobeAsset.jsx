import React from 'react';
import {
  PixelCardBackIcon,
  PixelFieldIcon,
  PixelFrameIcon,
} from '../PixelIcons.jsx';
import { getAssetTransformStyle, getEquippedAssetUrl } from '../../utils/shopEquipment.js';

export const WARDROBE_ITEM_META = Object.freeze({
  protector: { labelKey: 'wardrobe_slot_protector', Icon: PixelCardBackIcon, aspect: 'aspect-[5/7]' },
  avatar_frame: { labelKey: 'wardrobe_slot_avatar_frame', Icon: PixelFrameIcon, aspect: 'aspect-square' },
  field: { labelKey: 'wardrobe_slot_field', Icon: PixelFieldIcon, aspect: 'aspect-video' },
});

export default function WardrobeAsset({ item, type, alt = '', className = '', decorative = false }) {
  const meta = WARDROBE_ITEM_META[type] || WARDROBE_ITEM_META.protector;
  const assetUrl = getEquippedAssetUrl(item);
  const fit = type === 'field' ? 'object-cover' : 'object-contain';

  return (
    <span className={`wardrobe-asset relative flex h-full w-full items-center justify-center overflow-hidden ${className}`}>
      <meta.Icon size={type === 'field' ? 38 : 42} className="text-[var(--pop-black)]/25" aria-hidden="true" />
      {assetUrl && (
        <img
          src={assetUrl}
          alt={decorative ? '' : alt}
          style={getAssetTransformStyle(item.assetTransform)}
          className={`absolute inset-0 h-full w-full ${fit}`}
          loading="lazy"
          onError={(event) => { event.currentTarget.hidden = true; }}
        />
      )}
    </span>
  );
}
