import React from 'react';
import { PixelIcon } from './PixelIcon';

export function CrownIcon(props) { return <PixelIcon name="crown" {...props} />; }
export function CheckCircleIcon(props) { return <PixelIcon name="check_circle" {...props} />; }
export function RocketIcon(props) { return <PixelIcon name="rocket" {...props} />; }
export function LogoutIcon(props) { return <PixelIcon name="logout" {...props} />; }
export function CopyIcon(props) { return <PixelIcon name="copy" {...props} />; }
export function CheckIcon(props) { return <PixelIcon name="check" {...props} />; }
export function RefreshIcon(props) { return <PixelIcon name="refresh" {...props} />; }
export function BoltIcon(props) { return <PixelIcon name="bolt" {...props} />; }
export function KeyIcon(props) { return <PixelIcon name="key" {...props} />; }
export function LockIcon(props) { return <PixelIcon name="lock" {...props} />; }
export function PublicIcon(props) { return <PixelIcon name="public" {...props} />; }
export function ExtensionIcon(props) { return <PixelIcon name="extension" {...props} />; }
export function ArrowForwardIcon(props) { return <PixelIcon name="arrow_forward" {...props} />; }
export function ListIcon(props) { return <PixelIcon name="list" {...props} />; }
export function GearIcon(props) { return <PixelIcon name="gear" {...props} />; }
export function HelpIcon(props) { return <PixelIcon name="help" {...props} />; }
export function SoundIcon(props) { return <PixelIcon name="sound" {...props} />; }
export function SmileIcon(props) { return <PixelIcon name="smile" {...props} />; }
export function CardDrawerIcon(props) { return <PixelIcon name="card_drawer" {...props} />; }

// Badges
export function BronzeBadge(props) { return <PixelIcon name="badge_bronze" {...props} />; }
export function SilverBadge(props) { return <PixelIcon name="badge_silver" {...props} />; }
export function GoldBadge(props) { return <PixelIcon name="badge_gold" {...props} />; }
export function PlatinumBadge(props) { return <PixelIcon name="badge_platinum" {...props} />; }
export function DiamondBadge(props) { return <PixelIcon name="badge_diamond" {...props} />; }
export function LegendBadge(props) { return <PixelIcon name="badge_legend" {...props} />; }

export function RankBadge({ rank = "Bronze II", className = "w-5 h-5", showText = false }) {
  if (rank.startsWith('Bronze')) return <BronzeBadge className={className} />;
  if (rank.startsWith('Silver')) return <SilverBadge className={className} />;
  if (rank.startsWith('Gold')) return <GoldBadge className={className} />;
  if (rank.startsWith('Platinum')) return <PlatinumBadge className={className} />;
  if (rank.startsWith('Diamond')) return <DiamondBadge className={className} />;
  if (rank.startsWith('Legend')) return <LegendBadge className={className} />;
  return <PixelIcon name="badge_default" className={className} />;
}
