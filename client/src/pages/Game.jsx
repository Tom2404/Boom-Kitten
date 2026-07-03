
import createRoomIcon from '../assets/ui/icons/createRoom.png';
import quickplayIcon from '../assets/ui/icons/quickplay.png';
import copyIcon from '../assets/ui/icons/copy.png';
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useGame } from '../hooks/useGame.js';
import PlayerAvatar, { PRESET_AVATARS } from '../components/PlayerAvatar.jsx';
import PlayerHand from '../components/PlayerHand.jsx';
import DeckPile from '../components/DeckPile.jsx';
import DiscardPile from '../components/DiscardPile.jsx';
import Card, { CARD_THEMES } from '../components/Card.jsx';
import { getCardImageUrl } from '../utils/cardSkins.js';
import gsap from 'gsap';
import { ImageButton } from '../components/ui/ImageButton.jsx';
import fishboneIcon from '../assets/ui/icons/fishbone.png';
import idRoomImg from '../assets/ui/icons/IDRoom.png';
import doorIcon from '../assets/ui/icons/door.png';
import {
  SeeFutureModal,
  AlterFutureModal,
  FavorRequestModal,
  NopeCountdown,
  BuryPositionModal,
  GarbageSelectModal,
  ZombieReviveModal,
  DefusePositionModal,
  SelectTargetModal,
  FeedTheDeadModal,
  GraveRobberModal,
  DigDeeperModal,
  ArmageddonDistributeModal,
  ArmageddonDecisionModal,
  ClairvoyanceRevealModal,
  NopeResultToast,
  NowCardToast,
} from '../components/ActionModals.jsx';
import CustomDialog from '../components/CustomDialog.jsx';
import { CoinIcon, GemIcon } from '../components/CoinDisplay.jsx';
import {
  CrownIcon,
  CheckCircleIcon,
  RocketIcon,
  LogoutIcon,
  CopyIcon,
  CheckIcon,
  RefreshIcon,
  BoltIcon,
  KeyIcon,
  LockIcon,
  PublicIcon,
  ExtensionIcon,
  ArrowForwardIcon,
  ListIcon,
  GearIcon,
  HelpIcon,
  SoundIcon,
  SmileIcon,
  CardDrawerIcon,
} from '../components/Icons.jsx';
import DrawReveal from '../components/DrawReveal.jsx';
import { PixelStarIcon, PixelSkullIcon, PixelBombIcon } from '../components/PixelIcons.jsx';

/**
 * Renders custom pixel art artwork for each game edition/expansion
 */
const renderEditionArtwork = (key, size = 32) => {
  const props = { width: size, height: size, style: { shapeRendering: 'crispEdges' } };
  switch (key) {
    case 'original':
      return (
        <svg viewBox="0 0 16 16" {...props} className="text-amber-400 fill-current drop-shadow-[0_2px_4px_rgba(0,0,0,0.15)]">
          {/* Pixel Star 16x16 */}
          <path d="M7 1h2v2H7zM7 3h2v2H7zM3 5h10v2H3zM1 7h14v2H1zM3 9h10v2H3zM5 11h6v2H5zM4 13h2v2H4zM10 13h2v2H10z" />
        </svg>
      );
    case '2_player':
      return (
        <svg viewBox="0 0 16 16" {...props} className="text-sky-500 fill-current drop-shadow-[0_2px_4px_rgba(0,0,0,0.15)]">
          {/* Pixel Swords/Versus 16x16 */}
          <path d="M1 1h2v2H1zM3 3h2v2H3zM5 5h2v2H5zM2 7h2v2H2zM8 8h1v1H8zM13 1h2v2H13zM11 3h2v2H11zM9 5h2v2H9zM12 7h2v2H12zM5 11h2v2H5zM9 11h2v2H9zM7 13h2v2H7z" />
        </svg>
      );
    case 'zombie':
      return (
        <svg viewBox="0 0 16 16" {...props} className="text-emerald-500 fill-current drop-shadow-[0_2px_4px_rgba(0,0,0,0.15)]">
          {/* Pixel Skull 16x16 */}
          <path d="M4 1h8v1H4z M3 2h10v1H3z M2 3h12v5H2z M3 8h10v1H3z M4 9h2v1H4z M10 9h2v1H10z M4 10h8v4H4z M5 14h2v1H5z M9 14h2v1H9z" />
          <path d="M5 5h2v2H5z M9 5h2v2H9z" className="text-slate-900 fill-current" />
        </svg>
      );
    case 'barking':
      return (
        <svg viewBox="0 0 16 16" {...props} className="text-orange-500 fill-current drop-shadow-[0_2px_4px_rgba(0,0,0,0.15)]">
          {/* Pixel Paw print 16x16 */}
          <path d="M7 1h2v2H7zM3 4h2v2H3zM11 4h2v2H11zM2 8h3v2H2zM11 8h3v2H11zM5 10h6v5H5z" />
        </svg>
      );
    case 'good_vs_evil':
      return (
        <svg viewBox="0 0 16 16" {...props} className="text-purple-500 fill-current drop-shadow-[0_2px_4px_rgba(0,0,0,0.15)]">
          {/* Pixel Balance/Split Circle 16x16 */}
          <path d="M6 1h4v1H6zM4 2h8v1H4zM2 4h12v8H2zM4 12h8v1H4zM6 13h4v1H6z" />
          <path d="M8 2h4v1H8zM8 3h6v8H8zM8 11h4v1H8z" className="text-amber-400 fill-current" />
        </svg>
      );
    case 'imploding':
      return (
        <svg viewBox="0 0 16 16" {...props} className="text-rose-500 fill-current drop-shadow-[0_2px_4px_rgba(0,0,0,0.15)]">
          {/* Pixel Bomb 16x16 */}
          <path d="M7 1h2v1H7zM6 2h4v2H6zM3 5h10v1H3zM2 6h12v7H2zM3 13h10v1H3zM5 14h6v1H5z" />
          <path d="M12 1h1v1h-1zM11 2h1v1h-1zM10 3h1v1h-1z" className="text-yellow-400 fill-current" />
        </svg>
      );
    case 'streaking':
      return (
        <svg viewBox="0 0 16 16" {...props} className="text-yellow-400 fill-current drop-shadow-[0_2px_4px_rgba(0,0,0,0.15)]">
          {/* Pixel Lightning Bolt 16x16 */}
          <path d="M10 1h4v2h-2v2h-2v2h4v2H10v2H8v2H6v2H4v-4h2v-2h2v-2H4v-2h2V3h2V1z" />
        </svg>
      );
    default:
      return null;
  }
};

/**
 * Reusable PlayModeCard component for Lobby Play Mode Selection
 */
function PlayModeCard({
  title,
  subtitle,
  description,
  illustrationSrc,
  bgClass,
  isPrimary = false,
  isDisabled = false,
  onClick,
  buttonText,
  buttonBgClass,
  extraContent,
  badgeText,
  imageClass = "w-28 h-28 object-contain",
  enableWiggle = true,
  imageStyle
}) {
  return (
    <div 
      className={`card-brutalist bg-[var(--surface-dim)] flex flex-col items-center justify-between p-6 rounded-2xl flex-1 max-w-[320px] group w-full relative transition-all duration-300
        ${isPrimary 
          ? 'md:scale-105 border-4 card-primary-glow border-[#1a1c1c] z-10' 
          : 'border-3 border-[#1a1c1c]'
        }`}
    >
      {/* Decorative Screws in 4 Corners */}
      <div className="absolute top-2 left-2 w-2 h-2 rounded-full bg-slate-500/30 border border-[#1a1c1c]/40" />
      <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-slate-500/30 border border-[#1a1c1c]/40" />
      <div className="absolute bottom-2 left-2 w-2 h-2 rounded-full bg-slate-500/30 border border-[#1a1c1c]/40" />
      <div className="absolute bottom-2 right-2 w-2 h-2 rounded-full bg-slate-500/30 border border-[#1a1c1c]/40" />

      {/* Decorative Ribbon if any */}
      {badgeText && (
        <div className="retro-ribbon">
          {badgeText}
        </div>
      )}

      {/* Header Illustration Container */}
      <div className="h-40 w-full rounded-xl border-3 border-[var(--pop-black)] overflow-hidden relative flex items-center justify-center mb-4">
        {/* Background Pattern Layer */}
        <div className={`absolute inset-0 opacity-90 transition-transform duration-1000 ${bgClass}`} />
        
        {/* Sparkles */}
        <div className="pixel-sparkle sparkle-1">★</div>
        <div className="pixel-sparkle sparkle-2">★</div>
        <div className="pixel-sparkle sparkle-3">★</div>

        {/* Illustration Image */}
        <img
          src={illustrationSrc}
          style={imageStyle}
          className={`z-10 transition-transform duration-300 ${imageClass}
            ${enableWiggle ? 'group-hover-wiggle' : ''}
            ${isDisabled && buttonText !== 'Vào bằng mã' && buttonText !== 'VÀO PHÒNG' ? 'opacity-30' : ''}`}
          alt={title}
        />
        
        {/* Custom Extra Overlay (e.g. Radar Scanning for Quick Play or Code Input for Join Room) */}
        {extraContent}
      </div>

      {/* Title & Subtitle */}
      <div className="text-center flex-grow flex flex-col justify-between mb-4">
        <div>
          <h3 className="font-pop-display font-black text-xl text-[var(--pop-black)] uppercase tracking-tight leading-none mb-1">
            {title}
          </h3>
          <p className="font-pop-accent font-bold text-[10px] text-[var(--pop-red)] uppercase tracking-wider mb-2">
            {subtitle}
          </p>
        </div>
        <p className="font-pop-body text-xs text-[var(--pop-black)]/70 font-semibold px-2">
          {description}
        </p>
      </div>

      {/* Button */}
      <button
        onClick={onClick}
        disabled={isDisabled}
        className={`btn-retro-pixel btn-shine-container w-full py-2.5 rounded-xl text-center transition-colors
          ${buttonBgClass} disabled:opacity-50 disabled:cursor-not-allowed`}
      >
        <span className="font-headline font-black text-lg text-[var(--pop-black)] uppercase tracking-wider">
          {buttonText}
        </span>
      </button>
    </div>
  );
}

function FlyingCard({ id, type, cardType, startPos, endPos, centerPos, onComplete, playerName }) {
  const elementRef = useRef(null);
  const [isAtCenter, setIsAtCenter] = useState(false);
  const { t, language } = useLanguage();

  useEffect(() => {
    if (!elementRef.current) return;

    if (type === 'draw') {
      // Set initial state for draw
      gsap.set(elementRef.current, {
        x: startPos.x - 64, // center horizontally (w-32 is 128px)
        y: startPos.y - 88, // center vertically (h-44 is 176px)
        scale: 0.2,
        opacity: 0,
        rotation: 90,
      });

      // Animate draw to end position
      gsap.to(elementRef.current, {
        x: endPos.x - 64,
        y: endPos.y - 88,
        scale: 1,
        opacity: 1,
        rotation: 0,
        duration: 0.55,
        ease: 'power2.out',
        onComplete: () => {
          gsap.to(elementRef.current, {
            opacity: 0,
            scale: 0.8,
            duration: 0.15,
            onComplete,
          });
        },
      });
    } else {
      // Create timeline for multi-stage play animation
      const tl = gsap.timeline({
        onComplete: () => {
          onComplete();
        }
      });

      // 1. Initial set at start position (hand/avatar)
      tl.set(elementRef.current, {
        x: startPos.x - 64,
        y: startPos.y - 88,
        scale: 0.2,
        opacity: 0,
        rotation: 0,
      });

      // 2. Fly to center and zoom in
      const targetCenter = centerPos || { x: window.innerWidth / 2, y: window.innerHeight / 2 };
      tl.to(elementRef.current, {
        x: targetCenter.x - 64,
        y: targetCenter.y - 88,
        scale: 1.3,
        opacity: 1,
        rotation: 0,
        duration: 0.3,
        ease: 'power2.out',
        onComplete: () => {
          setIsAtCenter(true);
        },
      });

      // 3. Hover float effect in center (0.5s)
      tl.to(elementRef.current, {
        y: targetCenter.y - 88 - 8,
        yoyo: true,
        repeat: 1,
        duration: 0.25,
        ease: 'sine.inOut',
      });

      // 4. Fly to discard pile and shrink
      tl.to(elementRef.current, {
        x: endPos.x - 64,
        y: endPos.y - 88,
        scale: 1.0,
        rotation: Math.random() * 30 - 15,
        duration: 0.35,
        ease: 'power2.inOut',
        onStart: () => {
          setIsAtCenter(false);
        },
      });

      // 5. Fade out at discard pile
      tl.to(elementRef.current, {
        opacity: 0,
        scale: 1.1,
        duration: 0.1,
      });
    }
  }, [startPos, endPos, centerPos, type, onComplete]);

  if (type === 'draw') {
    return (
      <div
        ref={elementRef}
        className="absolute pointer-events-none z-[9999]"
        style={{ width: '128px', height: '176px' }}
      >
        <div className="h-full w-full rounded-xl border-3 border-on-surface bg-primary-container flex items-center justify-center p-3 select-none shadow-xl">
          <div className="absolute inset-1.5 border-2 border-dashed border-on-primary-container/30 rounded-lg flex flex-col items-center justify-center">
            <svg className="w-10 h-10 text-on-primary-container/20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="5" y="3" width="14" height="18" rx="2" ry="2" />
              <path d="M12 8v8M8 12h8" strokeDasharray="2 2" />
            </svg>
          </div>
        </div>
      </div>
    );
  }

  const theme = CARD_THEMES[cardType] || { name: cardType, icon: '🃏', color: 'bg-slate-300 text-slate-950' };
  const nameKey = `card_${cardType}_name`;
  const cardName = t(nameKey) !== nameKey ? t(nameKey) : theme.name;

  const getGlowColor = () => {
    if (cardType === 'defuse') return 'rgba(16, 185, 129, 0.6)'; // emerald
    if (cardType === 'nope') return 'rgba(244, 63, 94, 0.6)'; // rose
    if (cardType?.startsWith('attack')) return 'rgba(249, 115, 22, 0.6)'; // orange
    if (cardType === 'skip') return 'rgba(56, 189, 248, 0.6)'; // sky
    if (cardType === 'super_skip') return 'rgba(129, 140, 248, 0.6)'; // indigo
    if (cardType?.startsWith('see_the_future')) return 'rgba(168, 85, 247, 0.6)'; // fuchsia/purple
    if (cardType?.startsWith('alter_the_future')) return 'rgba(244, 114, 182, 0.6)'; // pink
    if (cardType === 'shuffle') return 'rgba(245, 158, 11, 0.6)'; // amber
    if (cardType === 'draw_from_bottom') return 'rgba(20, 184, 166, 0.6)'; // teal
    if (cardType === 'favor') return 'rgba(234, 179, 8, 0.6)'; // yellow
    if (cardType === 'zombie_kitten') return 'rgba(34, 197, 94, 0.6)'; // green
    return 'rgba(100, 116, 139, 0.6)'; // slate fallback
  };
  const glowColor = getGlowColor();

  return (
    <div
      ref={elementRef}
      className="absolute pointer-events-none z-[9999]"
      style={{ width: '128px', height: '176px' }}
    >
      {/* Glow Effect behind the card */}
      {isAtCenter && (
        <div 
          className="absolute inset-[-60px] rounded-full filter blur-xl opacity-80 animate-pulse pointer-events-none z-[-1]"
          style={{
            background: `radial-gradient(circle, ${glowColor} 0%, transparent 70%)`
          }}
        />
      )}

      {/* The actual Card component */}
      <div className="scale-90 shadow-2xl relative select-none">
        <Card type={cardType} disabled={false} hideInfo={true} />
      </div>
    </div>
  );
}

function ParticleExplosion({ startPos, onComplete }) {
  const containerRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const particles = containerRef.current.children;
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      const angle = Math.random() * Math.PI * 2;
      const distance = 40 + Math.random() * 100;
      const targetX = Math.cos(angle) * distance;
      const targetY = Math.sin(angle) * distance;

      gsap.set(p, {
        x: 0,
        y: 0,
        scale: 0.5 + Math.random() * 1.5,
        opacity: 1,
        backgroundColor: ['#ef4444', '#f59e0b', '#fbbf24', '#ff4500'][Math.floor(Math.random() * 4)],
      });

      gsap.to(p, {
        x: targetX,
        y: targetY,
        opacity: 0,
        scale: 0.1,
        duration: 0.8 + Math.random() * 0.4,
        ease: 'power3.out',
      });
    }

    const timer = setTimeout(onComplete, 1200);
    return () => clearTimeout(timer);
  }, [onComplete]);

  const particleArray = Array.from({ length: 20 });

  return (
    <div
      ref={containerRef}
      className="absolute pointer-events-none z-[9999]"
      style={{
        left: `${startPos.x}px`,
        top: `${startPos.y}px`,
      }}
    >
      {particleArray.map((_, idx) => (
        <div
          key={idx}
          className="absolute rounded-full"
          style={{
            width: '12px',
            height: '12px',
            transform: 'translate(-50%, -50%)',
          }}
        />
      ))}
    </div>
  );
}

import { useLanguage } from '../context/LanguageContext.jsx';
import {
  triggerScreenShake as coreScreenShake,
  spawnParticleBurst,
  playFlyingCard as corePlayFlyingCard,
  playSkipEffect,
  playNopeEffect,
  playAttackEffect,
  playExplosionEffect,
  playDefuseEffect,
  playCombo2Effect,
  playCombo3Effect,
  playCombo5Effect,
  playFavorEffect,
  playReverseEffect
} from '../utils/effectUtils.js';

const EMOTES_LIST = [
  { id: 'emote_smile', char: '😀' },
  { id: 'emote_laugh', char: '😂' },
  { id: 'emote_scared', char: '😱' },
  { id: 'emote_angry', char: '😡' },
  { id: 'emote_cool', char: '😎' },
  { id: 'emote_boom', char: '💥' },
  { id: 'emote_poop', char: '💩' },
  { id: 'emote_cry', char: '😭' },
];

const EDITIONS_MAP = {
  original: {
    badge: { vi: 'BẢN GỐC', en: 'BASE DECK' },
    badgeColor: 'bg-rose-500 text-white',
    rules: {
      vi: ['MÈO NỔ CƠ BẢN', 'GỠ MÌN BẮT BUỘC', 'TIÊN TRI TƯƠNG LAI'],
      en: ['EXPLODING KITTENS', 'DEFUSE KITS', 'FUTURE SIGHT']
    },
    exclusiveCards: [
      { type: 'defuse', name: { vi: 'GỠ MÌN BẰNG LASER', en: 'TACTICAL DEFUSE' } },
      { type: 'see_the_future_3', name: { vi: 'NHÌN THẤU TƯƠNG LAI', en: 'SEE THE FUTURE' } },
      { type: 'cat_taco', name: { vi: 'MÈO TACO THƯỜNG', en: 'CAT TACO' } },
      { type: 'skip', name: { vi: 'BỎ QUA LƯỢT CHƠI', en: 'EXTREME SKIP' } }
    ],
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <line x1="14.5" y1="17.5" x2="3" y2="6" />
        <line x1="3" y1="3" x2="6" y2="3" />
        <line x1="17.5" y1="14.5" x2="21" y2="21" />
        <polyline points="14 19 19 14" />
      </svg>
    )
  },
  '2_player': {
    badge: { vi: 'ĐỐI ĐẦU', en: 'DUEL PACK' },
    badgeColor: 'bg-sky-500 text-white',
    rules: {
      vi: ['ĐỐI KHÁNG TAY ĐÔI', 'BÀI SIÊU TINH GỌN', 'TỰ TẤN CÔNG'],
      en: ['HEAD TO HEAD', 'STREAMLINED DECK', 'PERSONAL ATTACK']
    },
    exclusiveCards: [
      { type: 'defuse', name: { vi: 'GỠ MÌN KHẨN CẤP', en: 'EMERGENCY DEFUSE' } },
      { type: 'personal_attack', name: { vi: 'TỰ TẤN CÔNG NHANH', en: 'PERSONAL ATTACK' } },
      { type: 'see_the_future_1', name: { vi: 'TIÊN TRI THU GỌN', en: 'FUTURE PEEK' } },
      { type: 'feral_cat', name: { vi: 'MÈO HOANG DÃ DỊ HÌNH', en: 'FERAL CAT' } }
    ],
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    )
  },
  zombie: {
    badge: { vi: 'THÂY MA', en: 'STANDALONE' },
    badgeColor: 'bg-emerald-500 text-white',
    rules: {
      vi: ['HỒI SINH TỪ CÕI CHẾT', 'CHƠI KHÔNG CẦN SỐNG', 'KỀ TRẠM MỘ & CÚNG'],
      en: ['ZOMBIE REVIVE', 'PLAY AFTER EXPLODING', 'GRAVE ROBBERS & FEEDS']
    },
    exclusiveCards: [
      { type: 'zombie_kitten', name: { vi: 'MÈO THÂY MA HỒI SINH', en: 'ZOMBIE KITTEN' } },
      { type: 'grave_robber', name: { vi: 'KẺ TRỘM MỘ BÀI BỎ', en: 'GRAVE ROBBER' } },
      { type: 'feed_the_dead', name: { vi: 'CÚNG CÔ HỒN ĐẮT GIÁ', en: 'FEED THE DEAD' } },
      { type: 'attack_of_the_dead', name: { vi: 'XÁC SỐNG TẤN CÔNG', en: 'ATTACK OF DEAD' } }
    ],
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 12h6M12 2C6.5 2 2 6.5 2 12c0 3.5 1.5 6 4.5 7.5V22h11v-2.5c3-1.5 4.5-4 4.5-7.5 0-5.5-4.5-10-10-10z" />
        <circle cx="8" cy="10" r="1" fill="currentColor" />
        <circle cx="16" cy="10" r="1" fill="currentColor" />
      </svg>
    )
  },
  barking: {
    badge: { vi: 'MÈO SỦA', en: 'EXPANSION' },
    badgeColor: 'bg-amber-500 text-white',
    rules: {
      vi: ['MÈO SỦA GHÉP CẶP', 'THIÊN NHÃN NHÌN BÀI', 'ĐỊNH ĐOẠT TƯƠNG LAI'],
      en: ['BARKING CAT COOPERATION', 'CLAIRVOYANCE SIGHT', 'FUTURE ALTERATION']
    },
    exclusiveCards: [
      { type: 'barking_kitten', name: { vi: 'MÈO SỦA ỒN ÀO', en: 'BARKING KITTEN' } },
      { type: 'clairvoyance', name: { vi: 'THIÊN NHÃN SẮC BÉN', en: 'CLAIRVOYANCE' } },
      { type: 'see_the_future_3_and_share', name: { vi: 'TIÊN TRI VÀ CHIA SẺ', en: 'SEE & SHARE FUTURE' } },
      { type: 'alter_the_future_3', name: { vi: 'ĐỊNH ĐOẠT 3 LÁ BÀI', en: 'ALTER THE FUTURE' } }
    ],
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 16v-2a8 8 0 1 1 16 0v2M2 12h2M20 12h2" />
        <circle cx="8" cy="12" r="1" fill="currentColor" />
        <circle cx="16" cy="12" r="1" fill="currentColor" />
        <path d="M9 16a3 3 0 0 0 6 0H9z" />
      </svg>
    )
  },
  good_vs_evil: {
    badge: { vi: 'THIỆN ÁC', en: 'STANDALONE' },
    badgeColor: 'bg-purple-500 text-white',
    rules: {
      vi: ['BẢN ĐỒ NGÀY TẬN THẾ', 'THẦN MÈO VẠN NĂNG', 'MÈO QUỶ HỦY DIỆT'],
      en: ['ARMAGEDDON SHOWDOWN', 'GODCAT COPY UTILITY', 'DEVILCAT TRAP']
    },
    exclusiveCards: [
      { type: 'godcat', name: { vi: 'THẦN MÈO VẠN NĂNG', en: 'GODCAT' } },
      { type: 'devilcat', name: { vi: 'MÈO QUỶ ĐỊA NGỤC', en: 'DEVILCAT' } },
      { type: 'armageddon', name: { vi: 'NGÀY TẬN THẾ ĐỐI ĐẦU', en: 'ARMAGEDDON' } },
      { type: 'reveal_the_future_3x', name: { vi: 'PHƠI BÀY TƯƠNG LAI', en: 'REVEAL THE FUTURE' } }
    ],
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <path d="M12 2v20" />
        <path d="M12 7a5 5 0 0 1 0 10" fill="currentColor" fillOpacity="0.3" />
      </svg>
    )
  },
  imploding: {
    badge: { vi: 'SẬP NGUỒN', en: 'EXPANSION' },
    badgeColor: 'bg-pink-500 text-white',
    rules: {
      vi: ['MÈO SẬP NGUỒN KHÔNG THỂ GỠ', 'ĐẢO CHIỀU VÒNG CHƠI', 'TẤN CÔNG ĐỊNH HƯỚNG'],
      en: ['IMPLODING BOMB UN-DEFUSABLE', 'REVERSE PLAY ORDER', 'TARGETED ATTACK']
    },
    exclusiveCards: [
      { type: 'imploding_kitten', name: { vi: 'MÈO SẬP NGUỒN VĨNH VIỄN', en: 'IMPLODING KITTEN' } },
      { type: 'reverse', name: { vi: 'ĐẢO CHIỀU CHƠI HỖN LOẠN', en: 'REVERSE PLAY' } },
      { type: 'target_attack_2x', name: { vi: 'TẤN CÔNG ĐỊNH HƯỚNG', en: 'TARGETED ATTACK' } },
      { type: 'catomic_bomb', name: { vi: 'BOM NGUYÊN TỬ MÈO', en: 'CATOMIC BOMB' } }
    ],
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15.5h-2v-2h2v2zm0-4.5h-2V7h2v6z" />
      </svg>
    )
  },
  streaking: {
    badge: { vi: 'VỆT ĐUÔI', en: 'EXPANSION' },
    badgeColor: 'bg-yellow-400 text-black',
    rules: {
      vi: ['GIỮ BOM TRONG TAY', 'THU GOM RÁC THẢI', 'ĐỔI ĐỔI ĐẦU ĐUÔI BỘ BÀI'],
      en: ['HOLD BOMB IN HAND', 'GARBAGE COLLECTION', 'SWAP TOP & BOTTOM']
    },
    exclusiveCards: [
      { type: 'streaking_kitten', name: { vi: 'MÈO VỆT ĐUÔI GIỮ BOMB', en: 'STREAKING KITTEN' } },
      { type: 'garbage_collection', name: { vi: 'THU GOM RÁC THẢI', en: 'GARBAGE COLLECTION' } },
      { type: 'mark', name: { vi: 'ĐÁNH DẤU LỘ DIỆN BÀI', en: 'MARK OPPONENT' } },
      { type: 'curse_of_the_cat_butt', name: { vi: 'LỜI NGUYỀN MÔNG MÈO', en: 'CURSE OF CAT BUTT' } }
    ],
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
      </svg>
    )
  }
};
const CARD_DESCRIPTIONS = {
  defuse: {
    en: "Defuse an exploding kitten to survive and put it back in the deck.",
    vi: "Gỡ mèo nổ để tiếp tục sinh tồn và đặt lại nó vào trong bộ bài."
  },
  see_the_future_3: {
    en: "Privately view the top 3 cards of the Draw Pile.",
    vi: "Nhìn lén 3 lá bài trên cùng của xấp bài rút mà không cho ai biết."
  },
  cat_taco: {
    en: "Play with another matching cat card to steal a card from a player.",
    vi: "Chơi cùng một lá mèo Taco khác để cướp 1 lá bài từ đối thủ."
  },
  skip: {
    en: "End your turn immediately without drawing a card.",
    vi: "Kết thúc lượt chơi ngay lập tức mà không cần rút bài."
  },
  personal_attack: {
    en: "Force yourself to take multiple turns in a row.",
    vi: "Bắt buộc bản thân phải thực hiện liên tiếp nhiều lượt chơi."
  },
  see_the_future_1: {
    en: "Privately view the top card of the Draw Pile.",
    vi: "Nhìn lén lá bài trên cùng của xấp bài rút."
  },
  feral_cat: {
    en: "Acts as any cat card (Taco, Melon, Beard, etc.) for combos.",
    vi: "Đóng vai trò là bất kỳ lá bài mèo nào để tạo tổ hợp bài."
  },
  zombie_kitten: {
    en: "Resurrect a dead player and defuse the exploding kitten.",
    vi: "Hồi sinh một người chơi đã chết và gỡ bỏ lá mèo nổ."
  },
  grave_robber: {
    en: "Take a card from the Discard Pile and put it in your hand.",
    vi: "Lấy một lá bài từ xấp bài bỏ và thêm vào tay của bạn."
  },
  feed_the_dead: {
    en: "Force an alive player to give a card to a dead player.",
    vi: "Bắt một người chơi còn sống phải dâng bài cho người chết."
  },
  attack_of_the_dead: {
    en: "Dead players attack alive players to steal turns.",
    vi: "Người chết trỗi dậy tấn công người sống để cướp lượt."
  },
  barking_kitten: {
    en: "Pair with another Barking Kitten to steal opponent's hand.",
    vi: "Ghép cặp với lá mèo sủa khác để cướp bài trên tay đối thủ."
  },
  clairvoyance: {
    en: "See where a player places the defused exploding kitten.",
    vi: "Nhìn thấu vị trí đối thủ đặt lại lá mèo nổ đã gỡ."
  },
  see_the_future_3_and_share: {
    en: "View top 3 cards, then show them to all other players.",
    vi: "Xem 3 lá bài trên cùng, sau đó công khai cho tất cả mọi người."
  },
  alter_the_future_3: {
    en: "View and rearrange the top 3 cards of the Draw Pile.",
    vi: "Xem và thay đổi thứ tự 3 lá bài trên cùng của xấp rút."
  },
  godcat: {
    en: "Play as any card in the game (the ultimate wild card).",
    vi: "Đóng vai trò là bất kỳ lá bài nào trong trò chơi."
  },
  devilcat: {
    en: "Explode immediately when drawn. Cannot be defused!",
    vi: "Nổ tung ngay lập tức khi rút phải. Không thể gỡ!"
  },
  armageddon: {
    en: "Force everyone to choose a card and showdown.",
    vi: "Ép buộc tất cả mọi người chọn một lá bài và đối mặt sinh tử."
  },
  reveal_the_future_3x: {
    en: "Reveal the top 3 cards of the deck to everyone.",
    vi: "Phơi bày 3 lá bài trên cùng của xấp rút cho cả bàn đấu."
  },
  imploding_kitten: {
    en: "Cannot be defused. Explodes instantly when drawn face-up.",
    vi: "Không thể gỡ. Nổ ngay lập tức khi rút trúng ở trạng thái lật."
  },
  reverse: {
    en: "Reverse the direction of play order.",
    vi: "Đảo ngược chiều lượt đi của bàn chơi."
  },
  target_attack_2x: {
    en: "Force a specific player to take 2 turns.",
    vi: "Chỉ định một người chơi cụ thể phải đi 2 lượt liên tiếp."
  },
  catomic_bomb: {
    en: "Remove all exploding kittens, shuffle the deck, and put them on top.",
    vi: "Rút hết mèo nổ ra, tráo bài và đặt các lá mèo nổ lên trên cùng."
  },
  streaking_kitten: {
    en: "Allows you to hold an exploding kitten in your hand.",
    vi: "Cho phép bạn giữ trực tiếp một lá mèo nổ trên tay."
  },
  garbage_collection: {
    en: "Everyone must insert 1 card from their hand into the deck.",
    vi: "Tất cả mọi người phải chọn 1 lá bài từ tay nhét lại vào xấp bài."
  },
  mark: {
    en: "Mark a card in opponent's hand so everyone can see it.",
    vi: "Đánh dấu và tiết lộ một lá bài trên tay đối thủ cho cả bàn xem."
  },
  curse_of_the_cat_butt: {
    en: "Make a player play blind (cards face down) until they draw a card.",
    vi: "Khiến đối thủ phải chơi mù (úp toàn bộ bài) cho tới khi rút bài."
  }
};

function ExclusiveCard({ cardType, name, skinIndex = 0, fanAngle = 0, fanY = 0 }) {
  const imageUrl = getCardImageUrl(cardType, skinIndex);
  const { language } = useLanguage();
  const desc = CARD_DESCRIPTIONS[cardType]
    ? (language === 'vi' ? CARD_DESCRIPTIONS[cardType].vi : CARD_DESCRIPTIONS[cardType].en)
    : '';

  return (
    <div 
      className="relative w-full aspect-[3/4] bg-[#1A1C1C] border-4 border-[#1A1C1C] rounded-none shadow-[4px_4px_0px_#1A1C1C] cursor-pointer exclusive-card-hover group z-10"
      style={{ '--fan-base': `rotate(${fanAngle}deg) translateY(${fanY}px)`, transform: `rotate(${fanAngle}deg) translateY(${fanY}px)` }}
    >
      {/* Main card wrapper */}
      <div className="w-full h-full overflow-hidden rounded-none bg-[#1A1C1C] flex items-center justify-center">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={name}
            className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="text-white/20 font-pixel-title text-xs tracking-widest select-none">BK</div>
        )}
      </div>

      {/* Rich Info Tooltip — image preview + description card */}
      {imageUrl && (
        <div className="absolute bottom-[108%] left-1/2 transform -translate-x-1/2 w-64 bg-white border-4 border-[#1A1C1C] rounded-none p-3.5 shadow-[6px_6px_0px_#1A1C1C] z-50 pointer-events-none opacity-0 group-hover:opacity-100 transition-all duration-200 scale-90 group-hover:scale-100 origin-bottom flex flex-col gap-2.5">
          <div className="w-full aspect-[4/3] overflow-hidden rounded-none border-2 border-[#1A1C1C] bg-[#1A1C1C] flex items-center justify-center">
            <img src={imageUrl} alt={name} className="w-full h-full object-cover object-top scale-110" />
          </div>
          <div className="flex flex-col gap-1 text-left">
            <h4 className="font-pixel-title text-[9px] text-[#1A1C1C] uppercase leading-none border-b-2 border-dashed border-[#1A1C1C]/25 pb-1">
              {name}
            </h4>
            {desc && (
              <p className="font-pixel-body text-[10px] leading-tight text-[#1A1C1C]/80 mt-0.5 whitespace-normal">
                {desc}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function Game() {
  const {
    socket,
    roomState,
    gameState,
    privateHand,
    nopeWindow,
    nopeResult,
    nowCardToast,
    seeTheFutureCards,
    setSeeTheFutureCards,
    alterFutureRequest,
    favorRequest,
    buryRequest,
    garbageRequest,
    potLuckRequest,
    zombieRequest,
    defuseRequest,
    selectTargetRequest,
    feedTheDeadRequest,
    graveRobberRequest,
    digDeeperRequest,
    armageddonRequest,
    clairvoyanceReveal,
    gameEnded,
    setGameEnded,
    chatMessages,
    statusMessage,
    setStatusMessage,
    createRoom,
    joinRoom,
    leaveRoom,
    startGame,
    drawCard,
    playCard,
    playNope,
    passNope,
    discardCard,
    respondFavor,
    respondAlterFuture,
    respondBury,
    respondGarbage,
    respondPotLuck,
    respondZombie,
    respondDefuse,
    respondSelectTarget,
    respondFeedTheDead,
    respondGraveRobber,
    respondDigDeeper,
    respondArmageddonDistribute,
    respondArmageddonDecision,
    playCombo,
    respondCombo5,
    sendChatMessage,
    sendEmote,
    actionLog,
    playAgain,
  } = useGame();

  const { t, language } = useLanguage();

  useEffect(() => {
    document.body.classList.add('pop-art-theme');
    return () => {
      document.body.classList.remove('pop-art-theme');
    };
  }, []);

  const editionsList = [
    'original',
    '2_player',
    'zombie',
    'barking',
    'good_vs_evil',
    'imploding',
    'streaking'
  ];

  const getEditionDetails = (key) => {
    return {
      name: t(`edition_${key}_name`),
      description: t(`edition_${key}_desc`),
      rules: t(`edition_${key}_rules`),
      features: [
        t(`edition_${key}_feat1`),
        t(`edition_${key}_feat2`),
        t(`edition_${key}_feat3`),
      ]
    };
  };

  const [roomInput, setRoomInput] = useState('');
  const [targetPlayerId, setTargetPlayerId] = useState(null);

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [lobbyMaxPlayers, setLobbyMaxPlayers] = useState(5);
  const [lobbyBetAmount, setLobbyBetAmount] = useState(50);
  const [lobbyMaxHandSize, setLobbyMaxHandSize] = useState(10);
  const [lobbyCustomDefuses, setLobbyCustomDefuses] = useState('');
  const [lobbyCustomExplodingKittens, setLobbyCustomExplodingKittens] = useState('');
  const [createPassword, setCreatePassword] = useState('');
  const [roomPrivacy, setRoomPrivacy] = useState('public'); // 'public' | 'private'
  const [joinPassword, setJoinPassword] = useState('');
  const [publicRooms, setPublicRooms] = useState([]);
  const [lobbyTab, setLobbyTab] = useState('list'); // 'list' | 'create'
  const [lobbyEdition, setLobbyEdition] = useState('original');
  const [isEditionDropdownOpen, setIsEditionDropdownOpen] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  
  const isDailyRewardClaimed = useMemo(() => {
    if (!userProfile?.lastDailyRewardDate) return false;
    const lastDate = new Date(userProfile.lastDailyRewardDate);
    const today = new Date();
    return lastDate.getDate() === today.getDate() &&
           lastDate.getMonth() === today.getMonth() &&
           lastDate.getFullYear() === today.getFullYear();
  }, [userProfile]);

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditRoomModalOpen, setIsEditRoomModalOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isCreatingRoom, setIsCreatingRoom] = useState(false);
  const [createRoomStep, setCreateRoomStep] = useState(1);
  const [isQuickPlaySearching, setIsQuickPlaySearching] = useState(false);
  const [quickPlayMsg, setQuickPlayMsg] = useState(null); // null | 'not_found' | 'error'
  const [hoveredEdition, setHoveredEdition] = useState(null);
  const [showPasswordInput, setShowPasswordInput] = useState(false);
  const [cosmeticRoomTitle, setCosmeticRoomTitle] = useState('MEOW MIXER #' + Math.floor(10 + Math.random() * 90));
  const [voiceChatEnabled, setVoiceChatEnabled] = useState(false);
  // For edition detail panel fade transition
  const [visibleEdition, setVisibleEdition] = useState('original');
  const [detailFading, setDetailFading] = useState(false);
  // For edition card snap animation
  const [lastClickedEdition, setLastClickedEdition] = useState(null);
  // For bet chip press animation
  const [pressedChip, setPressedChip] = useState(null);
  
  const [chatInput, setChatInput] = useState('');
  const [myUser, setMyUser] = useState(null);
  const [revealCard, setRevealCard] = useState(null);
  const prevHandRef = useRef([]);
  const [rightPanelTab, setRightPanelTab] = useState('chat');
  const [dialogState, setDialogState] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: null,
  });

  const [localClairvoyance, setLocalClairvoyance] = useState(null);
  const [drewKittenAlert, setDrewKittenAlert] = useState(null);
  const [nopeAlert, setNopeAlert] = useState(null);
  const [isRedFlashActive, setIsRedFlashActive] = useState(false);
  const [isImplodingActive, setIsImplodingActive] = useState(false);
  const [zombieFog, setZombieFog] = useState(false);

  const [hasUnreadMessages, setHasUnreadMessages] = useState(false);
  const prevMessagesLength = useRef(chatMessages.length);

  // Initialize game sounds
  const playSfx = (type) => {
    try {
      if (type === 'ting') {
        const audio = new window.Audio('/sounds/ting.mp3');
        audio.volume = 0.5;
        audio.play().catch(() => {});
      }
    } catch(err) {}
  };

  const prevReadyCountRef = useRef(0);
  useEffect(() => {
    if (roomState?.status === 'waiting') {
      const currentReadyCount = roomState.players.filter(p => p.isReady).length;
      if (currentReadyCount > prevReadyCountRef.current) {
        playSfx('ting');
      }
      prevReadyCountRef.current = currentReadyCount;
    }
  }, [roomState?.players, roomState?.status]);

  useEffect(() => {
    if (isSidebarOpen && rightPanelTab === 'chat') {
      setHasUnreadMessages(false);
    }
  }, [isSidebarOpen, rightPanelTab]);

  useEffect(() => {
    if (chatMessages.length > prevMessagesLength.current) {
      if (!isSidebarOpen || rightPanelTab !== 'chat') {
        setHasUnreadMessages(true);
      }
    }
    prevMessagesLength.current = chatMessages.length;
  }, [chatMessages, isSidebarOpen, rightPanelTab]);

  const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:5000';

  const fetchPublicRooms = async () => {
    try {
      const res = await fetch(`${API_URL}/api/rooms`);
      const data = await res.json();
      if (res.ok) {
        setPublicRooms(data);
      }
    } catch (e) {
      console.error('Lỗi khi tải danh sách phòng chờ:', e);
    }
  };

  const fetchUserProfile = async () => {
    const token = localStorage.getItem('accessToken');
    if (!token) return;
    try {
      const res = await fetch(`${API_URL}/api/users/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        setUserProfile(data);
      }
    } catch (e) {
      console.error('Lỗi khi tải thông tin người dùng:', e);
    }
  };

  useEffect(() => {
    fetchUserProfile();
  }, [roomState]);

  const handleQuickPlay = async () => {
    if (isQuickPlaySearching) return;
    setIsQuickPlaySearching(true);
    try {
      const res = await fetch(`${API_URL}/api/rooms`);
      const data = await res.json();
      if (res.ok && Array.isArray(data)) {
        // Chỉ tìm phòng CÔNG KHAI (không có password) và còn chỗ trống
        const availableRoom = data.find(
          (r) => !r.hasPassword && r.players.length < r.maxPlayers && r.status === 'waiting'
        );
        if (availableRoom) {
          joinRoom(availableRoom.code);
          return;
        }
      }
      // Không tìm thấy phòng phù hợp → thông báo dạng dialog rõ ràng
      setDialogState({
        isOpen: true,
        title: '😿 Không tìm thấy phòng trống',
        message: 'Hiện không có phòng chơi công khai nào còn trống.\nBạn có muốn tự tạo một phòng chơi mới không?',
        isConfirm: true,
        confirmText: 'Tạo phòng ngay',
        cancelText: 'Để sau',
        onConfirm: () => {
          setDialogState({ isOpen: false });
          // Mở modal tạo phòng
          setIsCreatingRoom(true);
          setLobbyEdition('original');
          setLobbyMaxPlayers(5);
          setCreatePassword('');
          setCreateRoomStep(1);
          setRoomPrivacy('public');
        }
      });
    } catch (e) {
      console.error('Lỗi khi chơi nhanh:', e);
      setDialogState({
        isOpen: true,
        title: '⚠️ Lỗi kết nối',
        message: 'Đã xảy ra lỗi trong quá trình tìm kiếm phòng chơi công khai. Vui lòng thử lại!',
        isConfirm: false,
        confirmText: 'Đóng',
        onConfirm: () => setDialogState({ isOpen: false })
      });
    } finally {
      setIsQuickPlaySearching(false);
    }
  };



  const handleDailyReward = async () => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      alert(language === 'vi' ? 'Vui lòng đăng nhập để nhận thưởng!' : 'Please login to claim reward!');
      return;
    }
    try {
      const res = await fetch(`${API_URL}/api/users/me/daily-reward`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.message || 'Có lỗi xảy ra');
        return;
      }
      const msg = language === 'vi' 
        ? `Nhận thành công ${data.rewardAmount} GoldCoin! (Chuỗi: ${data.consecutiveLoginDays + 1} ngày)`
        : `Successfully claimed ${data.rewardAmount} GoldCoins! (Streak: ${data.consecutiveLoginDays + 1} days)`;
      alert(msg);
      fetchUserProfile();
    } catch (e) {
      alert(language === 'vi' ? 'Lỗi kết nối' : 'Connection error');
    }
  };

  const handleCopyCode = (code) => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getAvatarBgColor = (name) => {
    if (!name) return '#eeeeee';
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const colors = [
      '#ffebee', '#f3e5f5', '#e8eaf6', '#e3f2fd', '#e0f2f1', '#e8f5e9', '#fffde7', '#fff3e0'
    ];
    return colors[Math.abs(hash) % colors.length];
  };

  const handleJoinRoomCode = (code, password) => {
    if (password) {
      const pwd = window.prompt("Nhập mật khẩu của phòng:") || '';
      joinRoom(code, pwd);
    } else {
      joinRoom(code);
    }
  };

  useEffect(() => {
    if (!roomState) {
      fetchPublicRooms();
      const interval = setInterval(fetchPublicRooms, 5000);
      return () => clearInterval(interval);
    }
  }, [roomState]);

  useEffect(() => {
    const code = localStorage.getItem('autoJoinRoomCode');
    const pwd = localStorage.getItem('autoJoinRoomPassword') || '';
    if (code) {
      localStorage.removeItem('autoJoinRoomCode');
      localStorage.removeItem('autoJoinRoomPassword');
      joinRoom(code, pwd);
    }
  }, [joinRoom]);

  useEffect(() => {
    if (clairvoyanceReveal && clairvoyanceReveal.active) {
      setLocalClairvoyance(clairvoyanceReveal);
    } else {
      setLocalClairvoyance(null);
    }
  }, [clairvoyanceReveal]);

  useEffect(() => {
    if (
      prevHandRef.current.length > 0 &&
      privateHand.length === prevHandRef.current.length + 1 &&
      gameState
    ) {
      const newCard = privateHand.find(
        (card) => !prevHandRef.current.some((prevCard) => prevCard.id === card.id)
      );
      if (newCard) {
        setRevealCard({ type: newCard.type, skinIndex: newCard.skinIndex ?? 0 });
      }
    }
    prevHandRef.current = privateHand;
  }, [privateHand, gameState]);

  const handleLeaveConfirm = () => {
    if (gameState) {
      setDialogState({
        isOpen: true,
        title: 'Rời trận đấu',
        message: 'Bạn có chắc chắn muốn rời khỏi trận đấu không? Trận đấu sẽ bị hủy!',
        onConfirm: () => {
          leaveRoom();
          setDialogState({ isOpen: false });
        },
      });
    } else {
      leaveRoom();
    }
  };

  const getStatusDisplay = () => {
    if (nopeWindow && nopeWindow.active) {
      return 'Đang chờ can thiệp...';
    }
    if (gameState) {
      if (gameState.pendingZombie) {
        const pName = gameState.players.find(p => p.userId === gameState.pendingZombie.playerId)?.username || gameState.pendingZombie.playerId;
        return `Zombie Kitten: Chờ ${pName} chọn người hồi sinh`;
      }
      if (gameState.pendingFavor) {
        const fromName = gameState.players.find(p => p.userId === gameState.pendingFavor.fromPlayerId)?.username || gameState.pendingFavor.fromPlayerId;
        const targetName = gameState.players.find(p => p.userId === gameState.pendingFavor.targetPlayerId)?.username || gameState.pendingFavor.targetPlayerId;
        return `Xin xỏ: Chờ ${targetName} tặng bài cho ${fromName}`;
      }
      if (gameState.pendingAlter) {
        const pName = gameState.players.find(p => p.userId === gameState.pendingAlter.playerId)?.username || gameState.pendingAlter.playerId;
        return `Thay đổi tương lai: Chờ ${pName} sắp xếp bài`;
      }
      if (gameState.pendingBury) {
        const pName = gameState.players.find(p => p.userId === gameState.pendingBury.playerId)?.username || gameState.pendingBury.playerId;
        return `Chôn bài: Chờ ${pName} chôn lá bài`;
      }
      if (gameState.pendingGarbage) {
        return `Thu gom rác thải: Chờ mọi người chọn lá bài`;
      }
      if (gameState.pendingPotLuck) {
        return `Pot Luck: Chờ mọi người chọn lá bài`;
      }
    }
    
    if (statusMessage && statusMessage !== 'Đang chờ can thiệp...') {
      return statusMessage;
    }
    
    if (gameState) {
      const activePlayer = gameState.players[gameState.currentPlayerIndex];
      if (activePlayer) {
        const isMe = activePlayer.userId === myUser?.id;
        const pName = isMe ? 'Bạn' : activePlayer.username;
        const draws = gameState.drawsRequired ?? 1;
        return `Lượt của: ${pName} (Cần bốc: ${draws} lá)`;
      }
    }
    return 'Ván đấu đã bắt đầu!';
  };

  const getOrderedOpponents = () => {
    if (!gameState || !gameState.players) return [];
    const myIndex = gameState.players.findIndex((p) => p.userId === myUser?.id);
    if (myIndex === -1) return gameState.players.filter((p) => p.userId !== myUser?.id);
    const ordered = [];
    const len = gameState.players.length;
    for (let i = 1; i < len; i += 1) {
      const p = gameState.players[(myIndex + i) % len];
      if (p.userId !== myUser?.id) {
        ordered.push(p);
      }
    }
    return ordered;
  };

  const getOpponentPositionClass = (index, total) => {
    let positionClass = '';
    if (total === 1) {
      positionClass = 'md:absolute md:top-4 md:left-1/2 md:transform md:-translate-x-1/2';
    } else if (total === 2) {
      if (index === 0) positionClass = 'md:absolute md:left-6 md:top-[40%] md:transform md:-translate-y-1/2';
      else positionClass = 'md:absolute md:right-6 md:top-[40%] md:transform md:-translate-y-1/2';
    } else if (total === 3) {
      if (index === 0) positionClass = 'md:absolute md:left-6 md:top-[40%] md:transform md:-translate-y-1/2';
      else if (index === 1) positionClass = 'md:absolute md:top-4 md:left-1/2 md:transform md:-translate-x-1/2';
      else positionClass = 'md:absolute md:right-6 md:top-[40%] md:transform md:-translate-y-1/2';
    } else {
      if (index === 0) positionClass = 'md:absolute md:left-6 md:bottom-24';
      else if (index === 1) positionClass = 'md:absolute md:left-24 md:top-4';
      else if (index === 2) positionClass = 'md:absolute md:right-24 md:top-4';
      else positionClass = 'md:absolute md:right-6 md:bottom-24';
    }
    return `${positionClass} flex-shrink-0`;
  };

  // Decode user data from access token
  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const payload = JSON.parse(window.atob(base64));
        setMyUser({ id: payload.sub, username: payload.username });
      } catch (e) {
        console.error('Failed decoding access token', e);
      }
    }
  }, [roomState]);

  const triggerConfetti = () => {
    const container = document.getElementById('confetti-container');
    if (!container) return;
    container.innerHTML = '';
    for (let i = 0; i < 80; i++) {
      const confetti = document.createElement('div');
      confetti.className = 'absolute w-3 h-3 rounded-sm pointer-events-none z-[999]';
      const colors = ['#facc15', '#f97316', '#ef4444', '#3b82f6', '#10b981', '#a855f7', '#ec4899'];
      confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
      confetti.style.left = `${Math.random() * 100}%`;
      confetti.style.top = `-5%`;
      container.appendChild(confetti);
      gsap.to(confetti, {
        y: window.innerHeight + 50,
        x: `+=${(Math.random() - 0.5) * 300}`,
        rotation: Math.random() * 720,
        duration: 1.8 + Math.random() * 2.2,
        ease: 'power1.out',
        onComplete: () => confetti.remove()
      });
    }
  };

  useEffect(() => {
    if (gameEnded) {
      gsap.fromTo('.ended-overlay-anim', 
        { scale: 0.4, rotation: -8, opacity: 0 },
        { scale: 1, rotation: 0, opacity: 1, duration: 0.65, ease: 'back.out(1.5)' }
      );
      if (gameEnded.winnerId === myUser?.id) {
        setTimeout(triggerConfetti, 100);
      }
    }
  }, [gameEnded, myUser]);

  const [numPlayAnims, setNumPlayAnims] = useState(0);
  const [nopeStamp, setNopeStamp] = useState(null);
  const canvasRef = useRef(null);
  const mainContainerRef = useRef(null);
  const particlesRef = useRef([]);
  const animFrameIdRef = useRef(null);

  // Clean up canvas animations on unmount
  useEffect(() => {
    return () => {
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
      }
    };
  }, []);

  // Canvas Particle System
  const spawnParticles = (x, y, paletteType) => {
    spawnParticleBurst(x, y, paletteType);
  };

  const getNextAlivePlayerId = () => {
    if (!gameState || !gameState.players) return null;
    const len = gameState.players.length;
    let idx = gameState.currentPlayerIndex;
    const dir = gameState.playDirection || 1;
    for (let i = 0; i < len; i++) {
      idx = (idx + dir + len) % len;
      if (gameState.players[idx].alive) {
        return gameState.players[idx].userId;
      }
    }
    return null;
  };

  const playZombieReviveAnimation = (targetUserId, activatorPlayerId) => {
    triggerScreenShake('light');

    const discardEl = document.getElementById('discard-pile-element');
    const targetEl = document.getElementById(`player-avatar-${targetUserId}`);
    if (!targetEl) return;

    const targetRect = targetEl.getBoundingClientRect();
    const targetX = targetRect.left + targetRect.width / 2;
    const targetY = targetRect.top + targetRect.height / 2;

    spawnParticles(targetX, targetY, 'zombie_revive');

    const overlay = document.createElement('div');
    overlay.style.position = 'fixed';
    overlay.style.top = `${targetRect.top}px`;
    overlay.style.left = `${targetRect.left}px`;
    overlay.style.width = `${targetRect.width}px`;
    overlay.style.height = `${targetRect.height}px`;
    overlay.style.zIndex = '150';
    overlay.style.pointerEvents = 'none';
    overlay.style.display = 'flex';
    overlay.style.alignItems = 'center';
    overlay.style.justifyContent = 'center';

    overlay.innerHTML = `
      <div class="relative w-20 h-20 flex items-center justify-center">
        <svg viewBox="0 0 64 64" class="w-full h-full drop-shadow-[4px_4px_0px_#1a1a1a] absolute" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 56V22C12 13 20 6 32 6C44 6 52 13 52 22V56H12Z" fill="#4b5563" stroke="#1a1a1a" stroke-width="3" stroke-linejoin="round" />
          <path d="M24 14L28 20L26 26" stroke="#1a1a1a" stroke-width="2" stroke-linecap="round" />
          <text x="32" y="38" text-anchor="middle" fill="#f3f4f6" font-size="9" font-weight="900" font-family="monospace">REVIVED</text>
          <path d="M6 56H58" stroke="#1a1a1a" stroke-width="3" stroke-linecap="round" />
        </svg>
        <div class="zombie-hand-container absolute bottom-4" style="width: 40px; height: 50px; overflow: visible;">
          <svg viewBox="0 0 40 50" class="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
            <g stroke="#ffffff" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M20 48V30" />
              <path d="M15 48V35" />
              <path d="M12 32C10 28 8 20 12 15" />
              <path d="M17 30C16 24 15 12 18 8" />
              <path d="M22 30C22 24 23 10 25 8" />
              <path d="M27 31C28 26 31 16 33 14" />
              <path d="M32 35C35 32 38 24 37 20" />
            </g>
            <g stroke="#1a1a1a" stroke-width="1" stroke-linecap="round" stroke-linejoin="round">
              <path d="M20 48V30" />
              <path d="M15 48V35" />
              <path d="M12 32C10 28 8 20 12 15" />
              <path d="M17 30C16 24 15 12 18 8" />
              <path d="M22 30C22 24 23 10 25 8" />
              <path d="M27 31C28 26 31 16 33 14" />
              <path d="M32 35C35 32 38 24 37 20" />
            </g>
          </svg>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);

    const hand = overlay.querySelector('.zombie-hand-container');
    gsap.fromTo(hand, 
      { y: 50, scaleY: 0.1, rotation: -10 },
      { 
        y: 0, 
        scaleY: 1, 
        rotation: 0,
        duration: 0.8, 
        ease: 'back.out(1.7)',
        onComplete: () => {
          gsap.to(overlay, {
            opacity: 0,
            scale: 0.8,
            duration: 0.5,
            delay: 0.8,
            ease: 'power2.in',
            onComplete: () => {
              if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
            }
          });
        }
      }
    );

    if (discardEl) {
      const discardRect = discardEl.getBoundingClientRect();
      const discX = discardRect.left + discardRect.width / 2;
      const discY = discardRect.top + discardRect.height / 2;

      for (let i = 0; i < 8; i++) {
        setTimeout(() => {
          const blob = document.createElement('div');
          blob.className = 'absolute rounded-full border border-slate-950';
          blob.style.left = `${discX}px`;
          blob.style.top = `${discY}px`;
          blob.style.width = '12px';
          blob.style.height = '12px';
          const colors = ['#10b981', '#047857', '#a3e635', '#34d399'];
          blob.style.backgroundColor = colors[i % colors.length];
          blob.style.zIndex = '145';
          blob.style.boxShadow = '2px 2px 0px #1a1a1a';
          document.body.appendChild(blob);

          const midX = (discX + targetX) / 2 + (Math.random() - 0.5) * 150;
          const midY = (discY + targetY) / 2 - 100 - Math.random() * 50;

          const pathObj = { t: 0 };
          gsap.to(pathObj, {
            t: 1,
            duration: 0.6 + Math.random() * 0.3,
            ease: 'power2.out',
            onUpdate: () => {
              const t = pathObj.t;
              const curX = (1 - t) * (1 - t) * discX + 2 * (1 - t) * t * midX + t * t * targetX;
              const curY = (1 - t) * (1 - t) * discY + 2 * (1 - t) * t * midY + t * t * targetY;
              blob.style.left = `${curX}px`;
              blob.style.top = `${curY}px`;
            },
            onComplete: () => {
              if (blob.parentNode) blob.parentNode.removeChild(blob);
              spawnParticles(targetX, targetY, 'zombie_revive');
            }
          });
        }, i * 80);
      }
    }
  };

  const playHordeAttackAnimation = (sourceUserIds, targetUserId) => {
    triggerScreenShake('heavy');
    setZombieFog(true);
    setTimeout(() => setZombieFog(false), 1250);

    const targetEl = document.getElementById(targetUserId === myUser?.id ? 'player-hand-container' : `player-avatar-${targetUserId}`);
    if (!targetEl) return;
    const targetRect = targetEl.getBoundingClientRect();
    const targetX = targetRect.left + targetRect.width / 2;
    const targetY = targetRect.top + targetRect.height / 2;

    let sources = sourceUserIds || [];
    if (sources.length === 0 && gameState?.players) {
      sources = gameState.players.filter(p => !p.alive).map(p => p.userId);
    }
    
    if (sources.length === 0) {
      sources = ['deck-pile-element'];
    }

    sources.forEach((srcId) => {
      const srcEl = document.getElementById(srcId.startsWith('player-avatar-') || srcId === 'deck-pile-element' ? srcId : `player-avatar-${srcId}`);
      if (!srcEl) return;
      const srcRect = srcEl.getBoundingClientRect();
      const srcX = srcRect.left + srcRect.width / 2;
      const srcY = srcRect.top + srcRect.height / 2;

      for (let i = 0; i < 2; i++) {
        setTimeout(() => {
          const skull = document.createElement('div');
          skull.style.position = 'fixed';
          skull.style.left = `${srcX - 24}px`;
          skull.style.top = `${srcY - 24}px`;
          skull.style.width = '48px';
          skull.style.height = '48px';
          skull.style.zIndex = '145';
          skull.style.pointerEvents = 'none';

          skull.innerHTML = `
            <svg viewBox="0 0 64 64" class="w-full h-full drop-shadow-[3px_3px_0px_#1a1a1a]" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M16 28C16 18 24 10 32 10C40 10 48 18 48 28C48 36 42 42 42 48H22C22 42 16 36 16 28Z" fill="#a3e635" stroke="#1a1a1a" stroke-width="3.5" />
              <path d="M26 48V54H38V48" fill="#a3e635" stroke="#1a1a1a" stroke-width="3.5" />
              <rect x="22" y="24" width="8" height="8" rx="2" fill="#1a1a1a" />
              <rect x="34" y="24" width="8" height="8" rx="2" fill="#1a1a1a" />
              <path d="M30 36L32 33L34 36H30Z" fill="#1a1a1a" />
            </svg>
          `;

          document.body.appendChild(skull);

          const midX = (srcX + targetX) / 2 + (Math.random() - 0.5) * 200;
          const midY = (srcY + targetY) / 2 - 150 - Math.random() * 100;

          const obj = { t: 0 };
          gsap.to(obj, {
            t: 1,
            duration: 0.7 + Math.random() * 0.3,
            ease: 'power2.inOut',
            onUpdate: () => {
              const t = obj.t;
              const curX = (1 - t) * (1 - t) * srcX + 2 * (1 - t) * t * midX + t * t * targetX;
              const curY = (1 - t) * (1 - t) * srcY + 2 * (1 - t) * t * midY + t * t * targetY;
              gsap.set(skull, {
                x: curX - srcX,
                y: curY - srcY,
                rotation: Math.sin(t * Math.PI * 2) * 15,
                scale: 1.0 + Math.sin(t * Math.PI) * 0.2
              });
            },
            onComplete: () => {
              if (skull.parentNode) skull.parentNode.removeChild(skull);
              spawnParticles(targetX, targetY, 'catomic');
            }
          });
        }, i * 200);
      }
    });
  };

  const playFeedTheDeadAnimation = (sourceUserIds, targetUserId) => {
    const targetEl = document.getElementById(`player-avatar-${targetUserId}`);
    if (!targetEl) return;
    const targetRect = targetEl.getBoundingClientRect();
    const targetX = targetRect.left + targetRect.width / 2;
    const targetY = targetRect.top + targetRect.height / 2;

    let sources = sourceUserIds || [];
    if (sources.length === 0 && gameState?.players) {
      sources = gameState.players.filter(p => p.alive).map(p => p.userId);
    }

    sources.forEach((srcId) => {
      const srcEl = document.getElementById(srcId === myUser?.id ? 'player-hand-container' : `player-avatar-${srcId}`);
      if (!srcEl) return;
      const srcRect = srcEl.getBoundingClientRect();
      const srcX = srcRect.left + srcRect.width / 2;
      const srcY = srcRect.top + srcRect.height / 2;

      const cardClone = document.createElement('div');
      cardClone.style.position = 'fixed';
      cardClone.style.left = `${srcX - 32}px`;
      cardClone.style.top = `${srcY - 44}px`;
      cardClone.style.width = '64px';
      cardClone.style.height = '88px';
      cardClone.style.zIndex = '145';
      cardClone.style.pointerEvents = 'none';

      cardClone.innerHTML = `
        <div class="h-full w-full rounded-none border-2 border-slate-900 bg-white flex flex-col justify-between p-1.5 shadow-[2px_2px_0px_#1a1a1a]">
          <div class="flex justify-between items-center border-b border-slate-900">
            <span class="text-[6px] font-black uppercase text-slate-900">GIFT</span>
            <span class="text-[6px] font-bold text-slate-500">🎁</span>
          </div>
          <div class="flex-grow flex items-center justify-center">
            <div class="w-6 h-6 border border-slate-900 bg-orange-400 flex items-center justify-center font-black text-xs text-slate-900 shadow-[1px_1px_0px_#1a1a1a]">
              ☠️
            </div>
          </div>
        </div>
      `;

      document.body.appendChild(cardClone);

      const midX = (srcX + targetX) / 2;
      const midY = (srcY + targetY) / 2 - 80;

      const obj = { t: 0 };
      gsap.to(obj, {
        t: 1,
        duration: 0.65,
        ease: 'power2.out',
        onUpdate: () => {
          const t = obj.t;
          const curX = (1 - t) * (1 - t) * srcX + 2 * (1 - t) * t * midX + t * t * targetX;
          const curY = (1 - t) * (1 - t) * srcY + 2 * (1 - t) * t * midY + t * t * targetY;
          gsap.set(cardClone, {
            x: curX - srcX,
            y: curY - srcY,
            rotation: t * 180,
            scale: 1.0 - t * 0.3
          });
        },
        onComplete: () => {
          if (cardClone.parentNode) cardClone.parentNode.removeChild(cardClone);
          spawnParticles(targetX, targetY, 'catomic');
        }
      });
    });
  };

  const playGraveRobberAnimation = (sourceUserIds) => {
    const deckEl = document.getElementById('deck-pile-element');
    if (!deckEl) return;
    const deckRect = deckEl.getBoundingClientRect();
    const deckX = deckRect.left + deckRect.width / 2;
    const deckY = deckRect.top + deckRect.height / 2;

    let sources = sourceUserIds || [];
    if (sources.length === 0 && gameState?.players) {
      sources = gameState.players.filter(p => !p.alive).map(p => p.userId);
    }

    if (sources.length === 0) {
      sources = ['board-center-target'];
    }

    sources.forEach((srcId) => {
      const srcEl = document.getElementById(`player-avatar-${srcId}`);
      if (!srcEl) return;
      const srcRect = srcEl.getBoundingClientRect();
      const srcX = srcRect.left + srcRect.width / 2;
      const srcY = srcRect.top + srcRect.height / 2;

      const card = document.createElement('div');
      card.style.position = 'fixed';
      card.style.left = `${srcX - 32}px`;
      card.style.top = `${srcY - 44}px`;
      card.style.width = '64px';
      card.style.height = '88px';
      card.style.zIndex = '145';
      card.style.pointerEvents = 'none';

      card.innerHTML = `
        <div class="h-full w-full rounded-none border-2 border-slate-900 bg-emerald-500 flex items-center justify-center p-1.5 shadow-[2px_2px_0px_#1a1a1a]">
          <span class="text-xs font-black text-white">🪦</span>
        </div>
      `;

      document.body.appendChild(card);

      const obj = { t: 0 };
      gsap.to(obj, {
        t: 1,
        duration: 0.85,
        ease: 'power2.inOut',
        onUpdate: () => {
          const t = obj.t;
          const baseX = (1 - t) * srcX + t * deckX;
          const baseY = (1 - t) * srcY + t * deckY;
          
          const angle = t * Math.PI * 4;
          const radius = (1 - t) * 60;
          const curX = baseX + Math.cos(angle) * radius;
          const curY = baseY + Math.sin(angle) * radius;

          gsap.set(card, {
            x: curX - srcX,
            y: curY - srcY,
            rotation: t * 360,
            scale: 1.0 - t * 0.4
          });
        },
        onComplete: () => {
          if (card.parentNode) card.parentNode.removeChild(card);
          spawnParticles(deckX, deckY, 'catomic');
        }
      });
    });
  };

  const playDigDeeperAnimation = () => {
    const deckEl = document.getElementById('deck-pile-element');
    if (!deckEl) return;
    const deckRect = deckEl.getBoundingClientRect();
    const deckX = deckRect.left + deckRect.width / 2;
    const deckY = deckRect.top + deckRect.height / 2;

    const shovel = document.createElement('div');
    shovel.style.position = 'fixed';
    shovel.style.left = `${deckX - 24}px`;
    shovel.style.top = `${deckY - 80}px`;
    shovel.style.width = '48px';
    shovel.style.height = '48px';
    shovel.style.zIndex = '150';
    shovel.style.pointerEvents = 'none';

    shovel.innerHTML = `
      <svg viewBox="0 0 64 64" class="w-full h-full drop-shadow-[3px_3px_0px_#1a1a1a]" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M48 16L32 32" stroke="#b45309" stroke-width="5" stroke-linecap="round" />
        <path d="M44 12L52 20" stroke="#b45309" stroke-width="5" stroke-linecap="round" />
        <path d="M28 28L12 44C12 44 14 50 20 50L36 34" fill="#9ca3af" stroke="#1a1a1a" stroke-width="3" stroke-linejoin="round" />
        <path d="M12 44L20 52" stroke="#1a1a1a" stroke-width="3" stroke-linecap="round" />
      </svg>
    `;

    document.body.appendChild(shovel);

    const tl = gsap.timeline({
      onComplete: () => {
        if (shovel.parentNode) shovel.parentNode.removeChild(shovel);
      }
    });

    tl.to(shovel, {
      y: 30,
      x: -15,
      rotation: -25,
      duration: 0.35,
      ease: 'power2.in',
      onComplete: () => {
        spawnParticles(deckX - 10, deckY + 10, 'dig_earth');
        triggerScreenShake('light');
      }
    })
    .to(shovel, {
      y: -10,
      x: 10,
      rotation: 15,
      duration: 0.3,
      ease: 'power2.out'
    })
    .to(shovel, {
      opacity: 0,
      y: -30,
      duration: 0.25,
      ease: 'power2.in'
    });
  };

  // Flying Card Clone animation
  const playFlyingCard = (sourceId, targetId, cardType) => {
    const cleanType = cardType.startsWith('discard_') ? cardType.replace('discard_', '') : cardType;
    const theme = CARD_THEMES[cleanType] || { name: cleanType, icon: '🃏', color: 'bg-slate-300 text-slate-950', desc: '' };
    const translatedName = t(`card_${cleanType}_name`) !== `card_${cleanType}_name` ? t(`card_${cleanType}_name`) : theme.name;
    const translatedDesc = t(`card_${cleanType}_desc`) !== `card_${cleanType}_desc` ? t(`card_${cleanType}_desc`) : theme.desc;

    corePlayFlyingCard({
      sourceId,
      targetId,
      cardType,
      imageUrl: getCardImageUrl(cleanType, 0),
      theme: { ...theme, name: translatedName, desc: translatedDesc },
      onStart: () => setNumPlayAnims(p => p + 1),
      onComplete: () => setNumPlayAnims(p => Math.max(0, p - 1))
    });
  };

  // Flying Draw Card animation
  const playDrawCard = (playerId) => {
    const startEl = document.getElementById('deck-pile-element');
    const targetId = playerId === myUser?.id ? 'player-hand-container' : `player-avatar-${playerId}`;
    const targetEl = document.getElementById(targetId);
    if (!startEl || !targetEl) return;

    const startRect = startEl.getBoundingClientRect();
    const targetRect = targetEl.getBoundingClientRect();

    const clone = document.createElement('div');
    clone.style.position = 'fixed';
    clone.style.top = `${startRect.top}px`;
    clone.style.left = `${startRect.left}px`;
    clone.style.width = '128px';
    clone.style.height = '176px';
    clone.style.zIndex = '140';
    clone.style.pointerEvents = 'none';

    clone.innerHTML = `
      <div class="h-full w-full rounded-none border-3 border-slate-900 bg-indigo-500 flex items-center justify-center p-3 select-none shadow-[4px_4px_0px_0px_#1a1a1a] scale-90">
        <div class="absolute inset-1.5 border-2 border-dashed border-white/20 rounded-none flex flex-col items-center justify-center">
          <svg class="w-10 h-10 text-white/40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
          </svg>
        </div>
      </div>
    `;

    document.body.appendChild(clone);

    const x1 = startRect.left + startRect.width / 2 - 64;
    const y1 = startRect.top + startRect.height / 2 - 88;
    const x2 = targetRect.left + targetRect.width / 2 - 64;
    const y2 = targetRect.top + targetRect.height / 2 - 88;

    gsap.to(clone, {
      x: x2 - x1,
      y: y2 - y1,
      scale: 0.6,
      rotation: 90,
      duration: 0.55,
      ease: 'power2.out',
      onComplete: () => {
        if (clone.parentNode) {
          clone.parentNode.removeChild(clone);
        }
      }
    });
  };

  // Screen Shake Wrapper Helper
  const triggerScreenShake = (type) => {
    coreScreenShake(type);
  };

  useEffect(() => {
    if (!socket) return;

    const handleCardDrawn = ({ playerId }) => {
      setTimeout(() => {
        playDrawCard(playerId);
      }, 50);
    };

    const handleCardPlayed = ({ playerId, cardType, targetPlayerId, displayCardType }) => {
      const sourceId = playerId === myUser?.id ? 'player-hand-container' : `player-avatar-${playerId}`;
      const triggerEl = document.getElementById(sourceId);

      if (cardType === 'nope') {
        playNopeEffect(triggerEl);
      } else if (cardType === 'skip' || cardType === 'super_skip') {
        playSkipEffect(triggerEl);
      } else if (cardType?.startsWith('attack')) {
        playAttackEffect(triggerEl, targetPlayerId);
      } else if (cardType === 'defuse') {
        playDefuseEffect(triggerEl);
      } else if (cardType === 'combo_2') {
        playCombo2Effect(targetPlayerId);
      } else if (cardType === 'combo_3') {
        playCombo3Effect(targetPlayerId);
      } else if (cardType === 'combo_5') {
        playCombo5Effect();
      } else if (cardType === 'favor') {
        playFavorEffect(targetPlayerId);
      } else if (cardType === 'reverse') {
        playReverseEffect();
      }

      setTimeout(() => {
        const targetId = 'discard-pile-element';
        playFlyingCard(sourceId, targetId, displayCardType || cardType);
      }, 50);

      // Special animations for Zombie Kitten edition cards
      if (cardType === 'attack_of_the_dead') {
        const nextTargetId = getNextAlivePlayerId();
        if (nextTargetId) {
          setTimeout(() => {
            playHordeAttackAnimation([], nextTargetId);
          }, 350);
        }
      } else if (cardType === 'grave_robber') {
        setTimeout(() => {
          playGraveRobberAnimation([]);
        }, 350);
      } else if (cardType === 'dig_deeper') {
        setTimeout(() => {
          playDigDeeperAnimation();
        }, 350);
      } else if (cardType === 'feed_the_dead' && targetPlayerId) {
        setTimeout(() => {
          playFeedTheDeadAnimation([], targetPlayerId);
        }, 350);
      }
    };

    const handleZombieRevived = ({ revivedPlayerId, activatorPlayerId }) => {
      setTimeout(() => {
        playZombieReviveAnimation(revivedPlayerId, activatorPlayerId);
      }, 50);
    };

    const handleNopeWindowForAnim = ({ cardType, targetPlayerId }) => {
      if (cardType === 'feed_the_dead' && targetPlayerId) {
        setTimeout(() => {
          playFeedTheDeadAnimation([], targetPlayerId);
        }, 50);
      }
    };

    const handleDrewKitten = ({ playerId, username, cardType }) => {
      triggerScreenShake('heavy');

      if (cardType === 'imploding_kitten') {
        setIsImplodingActive(true);
        setTimeout(() => {
          setIsImplodingActive(false);
        }, 2500);
      } else {
        setIsRedFlashActive(true);
        playExplosionEffect();
        setTimeout(() => {
          setIsRedFlashActive(false);
        }, 1500);
      }

      setDrewKittenAlert({ active: true, playerName: username, cardType });
      setTimeout(() => {
        setDrewKittenAlert(null);
      }, 1500);
    };

    const handleExploded = ({ playerId }) => {
      triggerScreenShake('heavy');

      setTimeout(() => {
        const targetId = playerId === myUser?.id ? 'player-hand-container' : `player-avatar-${playerId}`;
        const targetEl = document.getElementById(targetId);
        if (targetEl) {
          const rect = targetEl.getBoundingClientRect();
          const x = rect.left + rect.width / 2;
          const y = rect.top + rect.height / 2;
          spawnParticles(x, y, 'nope');
        }
      }, 50);
    };

    const handleBarkingKittenResolved = ({ attackerId, targetId, flow }) => {
      if ((flow === 2 || flow === 3 || flow === 4) && targetId) {
        setTimeout(() => {
          playFlyingCard(`player-avatar-${attackerId}`, `player-avatar-${targetId}`, 'barking_kitten');
        }, 50);
      }
    };

    socket.on('game:cardDrawn', handleCardDrawn);
    socket.on('game:drewKitten', handleDrewKitten);
    socket.on('game:cardPlayed', handleCardPlayed);
    socket.on('game:exploded', handleExploded);
    socket.on('game:zombieRevived', handleZombieRevived);
    socket.on('game:nopeWindow', handleNopeWindowForAnim);
    socket.on('game:barkingKitten:resolved', handleBarkingKittenResolved);

    return () => {
      socket.off('game:cardDrawn', handleCardDrawn);
      socket.off('game:drewKitten', handleDrewKitten);
      socket.off('game:cardPlayed', handleCardPlayed);
      socket.off('game:exploded', handleExploded);
      socket.off('game:zombieRevived', handleZombieRevived);
      socket.off('game:nopeWindow', handleNopeWindowForAnim);
      socket.off('game:barkingKitten:resolved', handleBarkingKittenResolved);
    };
  }, [socket, myUser]);

  if (!myUser) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center gap-6 bg-white border-4 border-on-surface shadow-[8px_8px_0px_0px_rgba(26,28,28,1)] rounded-3xl p-8 max-w-md mx-auto">
        <LockIcon className="w-16 h-16 text-on-surface animate-bounce" strokeWidth={2.5} />
        <h2 className="text-2xl font-headline font-black text-on-surface uppercase">Yêu Cầu Đăng Nhập</h2>
        <p className="text-xs font-bold text-on-surface-variant max-w-sm">
          Bạn cần đăng nhập tài khoản để có thể tạo phòng hoặc tham gia chơi bài Mèo Nổ.
        </p>
      </div>
    );
  }

  // ==========================================
  // VIEW 1: JOIN / CREATE ROOM
  // ==========================================
  // ==========================================
  // VIEW 1: JOIN / CREATE ROOM (LOBBY UPGRADE)
  // ==========================================
  if (!roomState) {
    if (isCreatingRoom) {
      const activeMeta = EDITIONS_MAP[lobbyEdition] || EDITIONS_MAP.original;
      const activeDetails = getEditionDetails(lobbyEdition);
      
      const renderDesktopLayout = () => {
        const activeMeta = EDITIONS_MAP[lobbyEdition] || EDITIONS_MAP.original;
        const activeDetails = getEditionDetails(lobbyEdition);
        
        // Calculate estimated prize pool
        const maxLimit = lobbyEdition === '2_player' ? 2 : (lobbyEdition === 'imploding' ? 6 : 5);
        const prizePool = lobbyBetAmount * lobbyMaxPlayers;
        
        // Bet validation alerts
        const isAffordable = !userProfile?.coins || userProfile.coins >= lobbyBetAmount;
        
        return (
          <div className="hidden md:flex flex-col gap-6 w-full">
            {/* Grid Edition Selection */}
            <div className="flex flex-col gap-2">
              <span className="font-pixel-title text-[10px] text-[#1A1C1C]/70 uppercase tracking-wider">
                {t('choose_edition')}
              </span>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 pt-1">
                {editionsList.map((key) => {
                  const isSelected = lobbyEdition === key;
                  const isSnapping = lastClickedEdition === key;
                  const details = getEditionDetails(key);
                  const meta = EDITIONS_MAP[key] || EDITIONS_MAP.original;
                  
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => {
                        // Trigger snap animation
                        setLastClickedEdition(key);
                        setTimeout(() => setLastClickedEdition(null), 250);
                        // Fade transition for detail panel
                        if (key !== lobbyEdition) {
                          setDetailFading(true);
                          setTimeout(() => {
                            setVisibleEdition(key);
                            setDetailFading(false);
                          }, 150);
                        }
                        setLobbyEdition(key);
                        const maxLimit = key === '2_player' ? 2 : (key === 'imploding' ? 6 : 5);
                        if (lobbyMaxPlayers > maxLimit || key === '2_player') {
                          setLobbyMaxPlayers(maxLimit);
                        }
                      }}
                      onMouseEnter={() => setHoveredEdition(key)}
                      onMouseLeave={() => setHoveredEdition(null)}
                      className={`w-full p-4 rounded-none border-4 border-[#1A1C1C] text-left flex flex-col justify-between gap-3 h-36 cursor-pointer relative overflow-hidden
                        ${isSnapping ? 'edition-snap' : ''}
                        ${isSelected 
                          ? 'bg-[#FFD54A] text-[#1A1C1C] translate-y-[2px] shadow-none edition-selected-glow' 
                          : 'bg-white text-[#1A1C1C] shadow-[4px_4px_0_#1A1C1C] hover:translate-y-[-2px] hover:shadow-[6px_6px_0_#1A1C1C] active:translate-y-0.5 active:shadow-none transition-all duration-150'
                        }`}
                    >
                      {/* Edition accent bar — colored per edition */}
                      <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${isSelected ? 'bg-[#E63946]' : 'bg-[#1A1C1C]/20'} transition-colors duration-150`} />

                      {/* Active Ribbon indicator */}
                      {isSelected && (
                        <div className="absolute top-0 right-0 bg-[#E63946] text-white border-b-3 border-l-3 border-[#1A1C1C] px-2 py-0.5 text-[8px] font-pixel-title uppercase tracking-widest z-20">
                          Active
                        </div>
                      )}
                      
                      {isSelected && <div className="absolute inset-0 pixel-scanline pointer-events-none opacity-20" />}
                      
                      <div className="flex justify-between items-start w-full pl-2">
                        <div className="flex flex-col gap-1 flex-grow pr-1">
                          <h3 className="font-pixel-title text-[10px] uppercase tracking-wider leading-none text-[#1A1C1C]">
                            {details.name}
                          </h3>
                          <span className="inline-block text-[7px] font-pixel-title bg-black/5 text-[#1A1C1C]/65 px-1 py-0.5 w-max">
                            {language === 'vi' ? meta.badge.vi : meta.badge.en}
                          </span>
                        </div>
                        <div className="flex-shrink-0">
                          {renderEditionArtwork(key, 32)}
                        </div>
                      </div>
                      <p className="text-[11px] font-bold leading-snug line-clamp-2 text-[#1A1C1C]/75 mt-auto pl-2">
                        {details.description}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Split Columns Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start mt-2">
              {/* Left Column: Active Edition Showcase */}
              <div className="lg:col-span-7 relative p-6 flex flex-col gap-6 text-left min-h-[420px] border-4 border-[#1A1C1C] rounded-none shadow-[6px_6px_0px_#1A1C1C] overflow-visible bg-[#0f172a]">
                {/* Screen backdrop with CRT effect */}
                <div className="absolute inset-0 pixel-crt pixel-scanline z-0 pointer-events-none" style={{ position: 'absolute', border: 'none' }} />
                
                {(() => {
                  const activeKey = visibleEdition;
                  const details = getEditionDetails(activeKey);
                  const meta = EDITIONS_MAP[activeKey] || EDITIONS_MAP.original;
                  const fanAngles = [-4, -1.5, 1.5, 4];
                  const fanYs = [3, 1, 1, 3];
                  return (
                    <div className={`relative z-10 flex flex-col gap-6 w-full h-full ${detailFading ? 'detail-fade-out' : 'detail-fade-in'}`}>
                      {/* Slanted Retro Badge */}
                      <div className="absolute top-5 right-5 rotate-6 z-20 select-none">
                        <div className={`font-pixel-title text-[8px] px-3.5 py-1.5 rounded-none border-3 border-[#1A1C1C] shadow-[2px_2px_0_#1A1C1C] uppercase tracking-wider ${meta.badgeColor}`}>
                          {language === 'vi' ? meta.badge.vi : meta.badge.en}
                        </div>
                      </div>

                      {/* Title & Description */}
                      <div className="pb-4 pr-24 border-b-2 border-dashed border-white/10">
                        <h3 className="font-pixel-title text-xl text-white uppercase tracking-tight">
                          {details.name}
                        </h3>
                        <p className="font-pixel-body text-sm text-[#86efac] mt-2 leading-relaxed opacity-90">
                          {details.description}
                        </p>
                      </div>

                      {/* Special Rules */}
                      <div className="flex flex-col gap-2">
                        <span className="font-pixel-title text-[9px] text-white/80 uppercase tracking-wider">
                          {language === 'vi' ? 'LUẬT CHƠI ĐẶC TRƯNG' : 'SPECIAL RULES'}
                        </span>
                        <div className="flex flex-wrap gap-2.5 mt-1 select-none">
                          {meta.rules[language].map((ruleText, idx) => (
                            <span 
                              key={idx} 
                              className="inline-flex items-center gap-1.5 bg-[#1e293b] text-[#86efac] border-2 border-[#86efac] px-3 py-1 text-[10px] font-pixel-title uppercase tracking-wider shadow-[2px_2px_0_rgba(0,0,0,0.5)]"
                            >
                              <span className="text-[10px] text-emerald-400 font-pixel-title">✓</span>
                              {ruleText}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Exclusive Cards — fan layout with natural spread */}
                      <div className="flex flex-col gap-3 pt-4 border-t-2 border-dashed border-white/10">
                        <span className="font-pixel-title text-[9px] text-white/80 uppercase tracking-wider">
                          {language === 'vi' ? 'THÀNH PHẦN THẺ BÀI TIÊU BIỂU' : 'FEATURED EXCLUSIVE CARDS'}
                        </span>
                        <div className="grid grid-cols-4 gap-4 mt-2" style={{ perspective: '800px' }}>
                          {meta.exclusiveCards.map((card, idx) => (
                            <ExclusiveCard 
                              key={idx} 
                              cardType={card.type} 
                              name={language === 'vi' ? card.name.vi : card.name.en}
                              fanAngle={fanAngles[idx] ?? 0}
                              fanY={fanYs[idx] ?? 0}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* Right Column: Lobby Settings Card */}
              <div className="lg:col-span-5 flex flex-col gap-6">
                <div className="pixel-card p-6 flex flex-col gap-5 text-left bg-white border-4 border-[#1A1C1C] shadow-[6px_6px_0_#1A1C1C]">
                  
                  {/* GROUP 1: ROOM */}
                  <div className="flex flex-col gap-4 border-b-4 border-dashed border-[#1A1C1C]/15 pb-4">
                    <div className="flex items-center gap-2">
                      <span className="font-pixel-title text-[10px] text-white bg-[#1A1C1C] px-2 py-0.5 uppercase">ROOM</span>
                    </div>

                    {/* Player count Stepper Selector */}
                    <div className="flex flex-col gap-2">
                      <span className="font-pixel-title text-[10px] text-[#1A1C1C] uppercase tracking-wider">
                        {t('max_players')}
                      </span>
                      {(() => {
                        const minLimit = 2;
                        const maxLimit = lobbyEdition === '2_player' ? 2 : (lobbyEdition === 'imploding' ? 6 : 5);
                        const isLocked = minLimit === maxLimit;
                        
                        return (
                          <div className="flex items-center gap-2 mt-1">
                            <button
                              type="button"
                              disabled={isLocked || lobbyMaxPlayers <= minLimit}
                              onClick={() => setLobbyMaxPlayers(p => Math.max(minLimit, p - 1))}
                              className="btn-retro-pixel w-10 h-10 bg-white hover:bg-slate-50 text-[#1A1C1C] font-pixel-title text-base flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none disabled:translate-y-0 shadow-[2px_2px_0_#1A1C1C]"
                            >
                              -
                            </button>
                            <div className="border-3 border-[#1A1C1C] bg-[#FFD54A] px-4 py-2 min-w-[120px] text-center font-pixel-title text-[11px] flex items-center justify-center h-10 shadow-[2px_2px_0_#1A1C1C] select-none">
                              {lobbyMaxPlayers} {language === 'vi' ? 'NGƯỜI' : 'PLAYERS'}
                            </div>
                            <button
                              type="button"
                              disabled={isLocked || lobbyMaxPlayers >= maxLimit}
                              onClick={() => setLobbyMaxPlayers(p => Math.min(maxLimit, p + 1))}
                              className="btn-retro-pixel w-10 h-10 bg-white hover:bg-slate-50 text-[#1A1C1C] font-pixel-title text-base flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none disabled:translate-y-0 shadow-[2px_2px_0_#1A1C1C]"
                            >
                              +
                            </button>
                          </div>
                        );
                      })()}
                    </div>

                    {/* Room Visibility Tab Buttons */}
                    <div className="flex flex-col gap-2">
                      <span className="font-pixel-title text-[10px] text-[#1A1C1C] uppercase tracking-wider">
                        {language === 'vi' ? 'Chế độ phòng' : 'Room Visibility'}
                      </span>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setRoomPrivacy('public');
                            setCreatePassword('');
                          }}
                          className={`pixel-tab-button flex-1 text-center py-2 ${roomPrivacy === 'public' ? 'pixel-tab-button-active' : ''}`}
                        >
                          🌐 {language === 'vi' ? 'Công khai' : 'Public'}
                        </button>
                        <button
                          type="button"
                          onClick={() => setRoomPrivacy('private')}
                          className={`pixel-tab-button flex-1 text-center py-2 ${roomPrivacy === 'private' ? 'pixel-tab-button-active' : ''}`}
                        >
                          🔒 {language === 'vi' ? 'Riêng tư' : 'Private'}
                        </button>
                      </div>
                    </div>

                    {/* Room Password field */}
                    {roomPrivacy === 'private' && (
                      <div className="flex flex-col gap-2 animate-fade-in">
                        <span className="font-pixel-title text-[10px] text-[#1A1C1C] uppercase tracking-wider">
                          {language === 'vi' ? 'Mật khẩu phòng' : 'Room Password'}
                        </span>
                        <div className="relative flex items-center">
                          <input
                            type={showPasswordInput ? "text" : "password"}
                            placeholder={language === 'vi' ? 'Nhập mật khẩu phòng' : 'Enter room password'}
                            value={createPassword}
                            onChange={(e) => setCreatePassword(e.target.value)}
                            maxLength={20}
                            className="pixel-input w-full pr-16"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPasswordInput(!showPasswordInput)}
                            className="absolute right-3 bg-white hover:bg-slate-100 border-2 border-[#1A1C1C] px-2 py-1 rounded-none text-[10px] font-pixel-title text-[#1A1C1C]"
                          >
                            {showPasswordInput ? '[-_-]' : '[O_O]'}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* GROUP 2: GAMEPLAY */}
                  <div className="flex flex-col gap-4 border-b-4 border-dashed border-[#1A1C1C]/15 pb-4">
                    <div className="flex items-center gap-2">
                      <span className="font-pixel-title text-[10px] text-white bg-[#1A1C1C] px-2 py-0.5 uppercase">GAMEPLAY</span>
                    </div>

                    <div className="flex gap-4">
                      <div className="flex flex-col gap-2 w-1/2">
                        <div className="flex items-center gap-1">
                          <span className="font-pixel-title text-[10px] text-[#1A1C1C] uppercase tracking-wider">
                            {language === 'vi' ? 'SỐ DEFUSE' : 'CUSTOM DEFUSES'}
                          </span>
                          <div className="relative group cursor-help text-xs font-bold text-slate-500 hover:text-black">
                            <span className="inline-block bg-slate-200 border-2 border-[#1A1C1C] w-3.5 h-3.5 rounded-full text-center leading-3 font-mono text-[9px]">i</span>
                            <div className="hidden group-hover:block absolute bottom-[130%] left-1/2 transform -translate-x-1/2 w-48 bg-white border-3 border-[#1A1C1C] p-2 text-[10px] font-pixel-body text-[#1A1C1C] shadow-[3px_3px_0_#1A1C1C] z-30 pointer-events-none uppercase tracking-wide normal-case text-center">
                              {language === 'vi' ? 'Số lượng thẻ gỡ bom có trong bộ bài (Tối đa 8, mặc định tự động)' : 'Number of defuse cards in deck (Max 8, default auto)'}
                            </div>
                          </div>
                        </div>
                        <input
                          type="number"
                          min={0}
                          max={8}
                          placeholder={language === 'vi' ? 'Mặc định' : 'Default'}
                          value={lobbyCustomDefuses}
                          onChange={(e) => {
                            const val = e.target.value === '' ? '' : Math.min(8, Math.max(0, parseInt(e.target.value, 10) || 0));
                            setLobbyCustomDefuses(val);
                          }}
                          className="pixel-input w-full py-2"
                        />
                      </div>
                      <div className="flex flex-col gap-2 w-1/2">
                        <div className="flex items-center gap-1">
                          <span className="font-pixel-title text-[10px] text-[#1A1C1C] uppercase tracking-wider">
                            {language === 'vi' ? 'SỐ BOMB' : 'CUSTOM BOMBS'}
                          </span>
                          <div className="relative group cursor-help text-xs font-bold text-slate-500 hover:text-black">
                            <span className="inline-block bg-slate-200 border-2 border-[#1A1C1C] w-3.5 h-3.5 rounded-full text-center leading-3 font-mono text-[9px]">i</span>
                            <div className="hidden group-hover:block absolute bottom-[130%] left-1/2 transform -translate-x-1/2 w-48 bg-white border-3 border-[#1A1C1C] p-2 text-[10px] font-pixel-body text-[#1A1C1C] shadow-[3px_3px_0_#1A1C1C] z-30 pointer-events-none uppercase tracking-wide normal-case text-center">
                              {language === 'vi' ? 'Số lượng thẻ kích nổ có trong bộ bài (Tối đa 8, mặc định tự động)' : 'Number of exploding bomb cards in deck (Max 8, default auto)'}
                            </div>
                          </div>
                        </div>
                        <input
                          type="number"
                          min={0}
                          max={8}
                          placeholder={language === 'vi' ? 'Mặc định' : 'Default'}
                          value={lobbyCustomExplodingKittens}
                          onChange={(e) => {
                            const val = e.target.value === '' ? '' : Math.min(8, Math.max(0, parseInt(e.target.value, 10) || 0));
                            setLobbyCustomExplodingKittens(val);
                          }}
                          className="pixel-input w-full py-2"
                        />
                      </div>
                    </div>
                  </div>

                  {/* GROUP 3: BETTING */}
                  <div className="flex flex-col gap-4 border-b-4 border-dashed border-[#1A1C1C]/15 pb-4">
                    <div className="flex items-center gap-2">
                      <span className="font-pixel-title text-[10px] text-white bg-[#1A1C1C] px-2 py-0.5 uppercase">BETTING</span>
                    </div>

                    <div className="flex justify-between items-start gap-4">
                      {/* Current Bet Box */}
                      <div className="flex flex-col gap-1 flex-1">
                        <span className="font-pixel-title text-[9px] text-[#1A1C1C]/60 uppercase tracking-wider">
                          {language === 'vi' ? 'TIỀN CƯỢC HIỆN TẠI' : 'CURRENT BET'}
                        </span>
                        <div className="bg-[#1A1C1C] border-3 border-[#1A1C1C] p-3 text-center flex items-center justify-center gap-2 shadow-[2px_2px_0_rgba(0,0,0,0.15)]">
                          <CoinIcon className="w-5 h-5" />
                          <span className="font-pixel-title text-base text-[#FFD54A] font-black">
                            {lobbyBetAmount}
                          </span>
                        </div>
                      </div>

                      {/* Player Balance Box */}
                      <div className="flex flex-col gap-1 flex-1">
                        <span className="font-pixel-title text-[9px] text-[#1A1C1C]/60 uppercase tracking-wider">
                          {language === 'vi' ? 'SỐ DƯ CỦA BẠN' : 'YOUR BALANCE'}
                        </span>
                        <div className="bg-[#F8FAFC] border-3 border-[#1A1C1C]/15 p-3 text-center flex items-center justify-center gap-2 shadow-[2px_2px_0_rgba(0,0,0,0.05)]">
                          <CoinIcon className="w-5 h-5" />
                          <span className="font-pixel-title text-sm text-[#1A1C1C] font-black">
                            {userProfile?.coins?.toLocaleString() ?? 0}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Circular Poker Bet Chips */}
                    <div className="flex flex-col gap-2">
                      <span className="font-pixel-title text-[9px] text-[#1A1C1C]/70 uppercase tracking-wider">
                        {language === 'vi' ? 'QUÂN CHIP CƯỢC NHANH' : 'QUICK BET CHIPS'}
                      </span>
                      <div className="flex justify-between gap-1 mt-1">
                        {[10, 50, 100, 250, 500, 1000].map((val) => {
                          const isSelected = lobbyBetAmount === val;
                          const isPressed = pressedChip === val;
                          const isAffordable = !userProfile?.coins || userProfile.coins >= val;
                          
                          return (
                            <button
                              key={val}
                              type="button"
                              disabled={!isAffordable}
                              onClick={() => {
                                setLobbyBetAmount(val);
                                setPressedChip(val);
                                setTimeout(() => setPressedChip(null), 220);
                              }}
                              className={`pixel-chip
                                ${isPressed ? 'chip-press' : ''}
                                ${isSelected ? 'pixel-chip-selected' : ''}
                                ${isAffordable ? '' : 'pixel-chip-disabled'}`}
                            >
                              {val}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Information cards */}
                    <div className="grid grid-cols-2 gap-2 mt-1">
                      <div className="pixel-info-card flex flex-col gap-0.5">
                        <span className="font-pixel-title text-[8px] text-[#1A1C1C]/50 uppercase">{language === 'vi' ? 'ƯỚC TÍNH QUỸ THƯỞNG' : 'EST. PRIZE POOL'}</span>
                        <span className="font-pixel-title text-[11px] text-emerald-600 flex items-center gap-1 font-black">
                          <CoinIcon className="w-3.5 h-3.5" /> {prizePool}
                        </span>
                      </div>
                      <div className="pixel-info-card flex flex-col gap-0.5">
                        <span className="font-pixel-title text-[8px] text-[#1A1C1C]/50 uppercase">{language === 'vi' ? 'PHẦN THƯỞNG TỐI ĐA' : 'POTENTIAL REWARD'}</span>
                        <span className="font-pixel-title text-[11px] text-amber-500 flex items-center gap-1 font-black">
                          <CoinIcon className="w-3.5 h-3.5" /> {prizePool} <span className="text-[7px] text-[#1A1C1C]/40">(100% PAYOUT)</span>
                        </span>
                      </div>
                    </div>

                    {/* Bet Feedback Badges */}
                    <div className="flex flex-col gap-1.5 select-none">
                      {!isAffordable && (
                        <div className="border-3 border-[#E63946] bg-[#FFECEF] text-[#E63946] p-2.5 text-center font-pixel-title text-[9px] uppercase tracking-wider shadow-[2px_2px_0_rgba(0,0,0,0.05)] animate-pulse">
                          ⚠️ {language === 'vi' ? 'Số dư không đủ để đặt cược!' : 'Insufficient balance for this bet!'}
                        </div>
                      )}
                      {lobbyBetAmount === 10 && (
                        <div className="border-3 border-sky-500 bg-[#EBF8FF] text-sky-600 p-2 text-center font-pixel-title text-[8px] uppercase tracking-wider">
                          ℹ️ {language === 'vi' ? 'ĐANG CHỌN MỨC CƯỢC TỐI THIỂU' : 'MINIMUM BET LEVEL SELECTED'}
                        </div>
                      )}
                      {lobbyBetAmount === 1000 && (
                        <div className="border-3 border-amber-500 bg-[#FFFDF0] text-amber-600 p-2 text-center font-pixel-title text-[8px] uppercase tracking-wider animate-bounce-short">
                          🔥 {language === 'vi' ? 'ĐANG CHỌN MỨC CƯỢC TỐI ĐA!' : 'MAXIMUM MATCH BET SELECTED!'}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* GROUP 4: EXTRAS */}
                  <div className="flex justify-between items-center pt-2">
                    <div className="flex flex-col text-left">
                      <span className="font-pixel-title text-[10px] uppercase tracking-wider text-[#1A1C1C]">
                        {t('voice_chat')}
                      </span>
                      <span className="text-[9px] font-bold text-[#1A1C1C]/60 font-pixel-body leading-tight mt-0.5">
                        {language === 'vi' ? 'Đàm thoại nhóm trực tiếp' : 'In-game group voice chat'}
                      </span>
                    </div>
                    
                    {/* Modern Custom Toggle Switch */}
                    <button
                      type="button"
                      onClick={() => setVoiceChatEnabled(!voiceChatEnabled)}
                      className={`pixel-switch flex items-center px-0.5 rounded-none cursor-pointer focus:outline-none transition-colors
                        ${voiceChatEnabled ? 'pixel-switch-active' : ''}`}
                    >
                      <div className={`pixel-switch-thumb rounded-none shadow-[1px_1px_0_rgba(0,0,0,0.15)]
                        ${voiceChatEnabled ? 'pixel-switch-thumb-active bg-[#FFF]' : 'bg-[#FFF]'}`}
                      />
                    </button>
                  </div>
                </div>

                {/* Room Summary Receipt Ticket */}
                <div className="room-summary-ticket flex flex-col gap-2 mt-1 text-[11px] font-mono text-left bg-[#FFFDF0]">
                  <div className="border-b-2 border-dashed border-[#1A1C1C]/25 pb-1 flex justify-between font-black uppercase text-[9px] text-[#1A1C1C]/60">
                    <span>RECEIPT: ROOM SETUP</span>
                    <span>#{(visibleEdition || 'original').substring(0, 3).toUpperCase()}</span>
                  </div>
                  <div className="flex justify-between text-[11px]">
                    <span className="text-[#1A1C1C]/60">EDITION:</span>
                    <span className="font-black text-[#1A1C1C] uppercase">{getEditionDetails(lobbyEdition).name}</span>
                  </div>
                  <div className="flex justify-between text-[11px]">
                    <span className="text-[#1A1C1C]/60">MAX PLAYERS:</span>
                    <span className="font-black text-[#1A1C1C]">{lobbyMaxPlayers} Players</span>
                  </div>
                  <div className="flex justify-between text-[11px]">
                    <span className="text-[#1A1C1C]/60">BET SIZE:</span>
                    <span className="font-black text-[#ff5722]">{lobbyBetAmount} Gold</span>
                  </div>
                  <div className="flex justify-between text-[11px]">
                    <span className="text-[#1A1C1C]/60">VISIBILITY:</span>
                    <span className="font-black text-[#1A1C1C] uppercase">{roomPrivacy === 'private' ? 'Private' : 'Public'}</span>
                  </div>
                  <div className="flex justify-between text-[11px]">
                    <span className="text-[#1A1C1C]/60">VOICE CHAT:</span>
                    <span className="font-black text-[#1A1C1C] uppercase">{voiceChatEnabled ? 'Enabled' : 'Disabled'}</span>
                  </div>
                </div>

                {/* Detonate CREATE ROOM button */}
                <button
                  disabled={!isAffordable}
                  onClick={() => {
                    const defuses = lobbyCustomDefuses === '' ? undefined : parseInt(lobbyCustomDefuses, 10);
                    const kittens = lobbyCustomExplodingKittens === '' ? undefined : parseInt(lobbyCustomExplodingKittens, 10);
                    createRoom(createPassword, lobbyEdition, lobbyMaxPlayers, lobbyBetAmount, defuses, kittens);
                    setIsCreatingRoom(false);
                  }}
                  className={`w-full btn-retro-pixel btn-shine-container btn-cta-glow py-4 text-white font-pixel-title uppercase text-sm tracking-widest hover:translate-y-[-3px] active:translate-y-[3px] active:shadow-[1px_1px_0_#1A1C1C] transition-colors mt-2
                    ${isAffordable 
                      ? 'bg-[#E63946] hover:bg-[#ff4d5a] cursor-pointer' 
                      : 'bg-[#64748B] opacity-50 cursor-not-allowed shadow-none hover:translate-y-0'}`}
                  style={{ textShadow: '1.5px 1.5px 0px #1a1c1c' }}
                >
                  💥 {language === 'vi' ? 'KÍCH NỔ / TẠO PHÒNG' : 'DETONATE / CREATE ROOM'} 💥
                </button>
              </div>
            </div>
          </div>
        );
      };

      const renderMobileLayout = () => {
        const activeMeta = EDITIONS_MAP[lobbyEdition] || EDITIONS_MAP.original;
        const activeDetails = getEditionDetails(lobbyEdition);
        const prizePool = lobbyBetAmount * lobbyMaxPlayers;
        const isAffordable = !userProfile?.coins || userProfile.coins >= lobbyBetAmount;
        
        return (
          <div className="flex md:hidden flex-col gap-4 w-full">
            {/* 5-Step indicator on Mobile */}
            <div className="flex items-center justify-between border-b-4 border-[#1A1C1C] pb-3 mb-2">
              <div className="flex flex-wrap gap-1 w-full justify-between">
                {[1, 2, 3, 4, 5].map((step) => {
                  const stepNames = {
                    1: { vi: 'BẢN', en: 'EDITION' },
                    2: { vi: 'PHÒNG', en: 'ROOM' },
                    3: { vi: 'CƯỢC', en: 'BET' },
                    4: { vi: 'DUYỆT', en: 'REVIEW' },
                    5: { vi: 'TẠO', en: 'CREATE' }
                  };
                  const isCurrent = createRoomStep === step;
                  const isCompleted = createRoomStep > step;
                  return (
                    <div 
                      key={step}
                      className={`flex-1 text-center py-1.5 text-[8px] font-pixel-title border-2 border-[#1A1C1C] transition-colors
                        ${isCurrent 
                          ? 'bg-[#FFD54A] font-black text-[#1A1C1C]' 
                          : isCompleted
                            ? 'bg-[#4CDE77] text-[#1A1C1C]' 
                            : 'bg-white text-slate-400'
                        }`}
                    >
                      {step}. {language === 'vi' ? stepNames[step].vi : stepNames[step].en}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* STEP 1: CHOOSE EDITION */}
            {createRoomStep === 1 && (
              <div className="flex flex-col gap-4">
                <span className="font-pixel-title text-[9px] text-[#1A1C1C]/70 uppercase tracking-wider text-center">
                  {t('choose_edition')}
                </span>
                <div className="flex flex-col gap-3">
                  {editionsList.map((key) => {
                    const isSelected = lobbyEdition === key;
                    const details = getEditionDetails(key);
                    const meta = EDITIONS_MAP[key] || EDITIONS_MAP.original;
                    
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => {
                          setLobbyEdition(key);
                          const maxLimit = key === '2_player' ? 2 : (key === 'imploding' ? 6 : 5);
                          if (lobbyMaxPlayers > maxLimit || key === '2_player') {
                            setLobbyMaxPlayers(maxLimit);
                          }
                        }}
                        className={`w-full p-4 rounded-none border-4 border-[#1A1C1C] text-left flex flex-col justify-between gap-2.5 h-32 cursor-pointer transition-all duration-150 relative overflow-hidden
                          ${isSelected 
                            ? 'bg-[#FFD54A] text-[#1A1C1C] translate-y-0.5 shadow-none ring-3 ring-[#ff5722]' 
                            : 'bg-white text-[#1A1C1C] shadow-[3px_3px_0_#1A1C1C]'
                          }`}
                      >
                        {isSelected && (
                          <div className="absolute top-0 right-0 bg-[#E63946] text-white border-b-3 border-l-3 border-[#1A1C1C] px-2 py-0.5 text-[8px] font-pixel-title uppercase z-20">
                            Active
                          </div>
                        )}
                        <div className="flex justify-between items-center w-full">
                          <div className="flex flex-col gap-1 pr-2">
                            <h3 className="font-pixel-title text-[9px] uppercase tracking-wider leading-none text-[#1A1C1C]">
                              {details.name}
                            </h3>
                            <span className="inline-block text-[7px] font-pixel-title bg-black/5 text-[#1A1C1C]/65 px-1 py-0.5 w-max">
                              {language === 'vi' ? meta.badge.vi : meta.badge.en}
                            </span>
                          </div>
                          <div>
                            {renderEditionArtwork(key, 28)}
                          </div>
                        </div>
                        <p className="text-[10px] font-bold leading-tight line-clamp-2 text-[#1A1C1C]/70">
                          {details.description}
                        </p>
                      </button>
                    );
                  })}
                </div>
                
                {/* Preview active showcase at bottom of step 1 */}
                <div className="bg-[#0f172a] text-white border-4 border-[#1A1C1C] p-4 text-left relative overflow-hidden mt-2">
                  <div className="absolute inset-0 pixel-crt pixel-scanline pointer-events-none" />
                  <span className="font-pixel-title text-[8px] text-[#86efac] block uppercase tracking-wider mb-2">
                    {language === 'vi' ? 'LÁ BÀI & LUẬT MỚI' : 'CARDS & RULES PREVIEW'}
                  </span>
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {activeMeta.rules[language].map((ruleText, idx) => (
                      <span key={idx} className="bg-slate-900 border border-[#86efac] text-[#86efac] text-[8px] font-pixel-title px-1.5 py-0.5">
                        ✓ {ruleText}
                      </span>
                    ))}
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    {activeMeta.exclusiveCards.map((card, idx) => (
                      <div key={idx} className="border border-white/20 aspect-[3/4] bg-slate-900 relative group overflow-hidden">
                        <img src={getCardImageUrl(card.type, 0)} alt="" className="w-full h-full object-cover" />
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Next button */}
                <button
                  type="button"
                  onClick={() => setCreateRoomStep(2)}
                  className="w-full btn-retro-pixel py-3.5 bg-[#4CC9F0] text-slate-950 font-pixel-title text-[9px] uppercase tracking-widest shadow-[3px_3px_0_#1A1C1C]"
                >
                  {language === 'vi' ? 'CÀI ĐẶT PHÒNG ➔' : 'ROOM SETTINGS ➔'}
                </button>
              </div>
            )}

            {/* STEP 2: CONFIGURE SETTINGS */}
            {createRoomStep === 2 && (
              <div className="flex flex-col gap-4 animate-fade-in">
                <div className="pixel-card p-5 flex flex-col gap-4 bg-white border-4 border-[#1A1C1C] shadow-[4px_4px_0_#1A1C1C] text-left">
                  <div className="border-b-2 border-dashed border-[#1A1C1C]/15 pb-2">
                    <span className="font-pixel-title text-[10px] text-white bg-[#1A1C1C] px-2 py-0.5">1. CONFIG ROOM</span>
                  </div>

                  {/* Player stepper */}
                  <div className="flex justify-between items-center gap-2">
                    <span className="font-pixel-title text-[9px] text-[#1A1C1C] uppercase tracking-wider">
                      {t('max_players')}
                    </span>
                    {(() => {
                      const minLimit = 2;
                      const maxLimit = lobbyEdition === '2_player' ? 2 : (lobbyEdition === 'imploding' ? 6 : 5);
                      const isLocked = minLimit === maxLimit;
                      
                      return (
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            disabled={isLocked || lobbyMaxPlayers <= minLimit}
                            onClick={() => setLobbyMaxPlayers(p => Math.max(minLimit, p - 1))}
                            className="btn-retro-pixel w-8 h-8 bg-white text-[#1A1C1C] font-pixel-title text-sm flex items-center justify-center shadow-[1.5px_1.5px_0_#1A1C1C] disabled:opacity-40"
                          >
                            -
                          </button>
                          <div className="border-2 border-[#1A1C1C] bg-[#FFD54A] px-2.5 py-1 text-center font-pixel-title text-[9px] flex items-center justify-center h-8">
                            {lobbyMaxPlayers}
                          </div>
                          <button
                            type="button"
                            disabled={isLocked || lobbyMaxPlayers >= maxLimit}
                            onClick={() => setLobbyMaxPlayers(p => Math.min(maxLimit, p + 1))}
                            className="btn-retro-pixel w-8 h-8 bg-white text-[#1A1C1C] font-pixel-title text-sm flex items-center justify-center shadow-[1.5px_1.5px_0_#1A1C1C] disabled:opacity-40"
                          >
                            +
                          </button>
                        </div>
                      );
                    })()}
                  </div>

                  {/* Room Visibility toggle */}
                  <div className="flex flex-col gap-2">
                    <span className="font-pixel-title text-[9px] text-[#1A1C1C] uppercase tracking-wider">
                      {language === 'vi' ? 'Chế độ phòng' : 'Room Visibility'}
                    </span>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setRoomPrivacy('public');
                          setCreatePassword('');
                        }}
                        className={`pixel-tab-button flex-1 text-center py-2 ${roomPrivacy === 'public' ? 'pixel-tab-button-active' : ''}`}
                      >
                        🌐 {language === 'vi' ? 'Công khai' : 'Public'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setRoomPrivacy('private')}
                        className={`pixel-tab-button flex-1 text-center py-2 ${roomPrivacy === 'private' ? 'pixel-tab-button-active' : ''}`}
                      >
                        🔒 {language === 'vi' ? 'Riêng tư' : 'Private'}
                      </button>
                    </div>
                  </div>

                  {/* Password field */}
                  {roomPrivacy === 'private' && (
                    <div className="flex flex-col gap-1.5 animate-fade-in">
                      <span className="font-pixel-title text-[9px] text-[#1A1C1C] uppercase tracking-wider">
                        {language === 'vi' ? 'Mật khẩu' : 'Password'}
                      </span>
                      <input
                        type="password"
                        placeholder={language === 'vi' ? 'Nhập mật khẩu' : 'Enter password'}
                        value={createPassword}
                        onChange={(e) => setCreatePassword(e.target.value)}
                        maxLength={20}
                        className="pixel-input w-full py-2 text-xs"
                      />
                    </div>
                  )}

                  {/* Custom Bombs & Defuses */}
                  <div className="flex gap-3 border-t border-dashed border-[#1A1C1C]/15 pt-3">
                    <div className="flex flex-col gap-1.5 w-1/2">
                      <span className="font-pixel-title text-[8px] text-[#1A1C1C] uppercase tracking-wider">
                        {language === 'vi' ? 'SỐ DEFUSE' : 'DEFUSES'}
                      </span>
                      <input
                        type="number"
                        min={0}
                        max={8}
                        placeholder={language === 'vi' ? 'Mặc định' : 'Default'}
                        value={lobbyCustomDefuses}
                        onChange={(e) => {
                          const val = e.target.value === '' ? '' : Math.min(8, Math.max(0, parseInt(e.target.value, 10) || 0));
                          setLobbyCustomDefuses(val);
                        }}
                        className="pixel-input w-full py-1.5 text-xs"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5 w-1/2">
                      <span className="font-pixel-title text-[8px] text-[#1A1C1C] uppercase tracking-wider">
                        {language === 'vi' ? 'SỐ BOMB' : 'BOMBS'}
                      </span>
                      <input
                        type="number"
                        min={0}
                        max={8}
                        placeholder={language === 'vi' ? 'Mặc định' : 'Default'}
                        value={lobbyCustomExplodingKittens}
                        onChange={(e) => {
                          const val = e.target.value === '' ? '' : Math.min(8, Math.max(0, parseInt(e.target.value, 10) || 0));
                          setLobbyCustomExplodingKittens(val);
                        }}
                        className="pixel-input w-full py-1.5 text-xs"
                      />
                    </div>
                  </div>

                  {/* Voice Chat Switch */}
                  <div className="flex justify-between items-center border-t border-dashed border-[#1A1C1C]/15 pt-3">
                    <span className="font-pixel-title text-[8px] uppercase tracking-wider text-[#1A1C1C]">
                      {t('voice_chat')}
                    </span>
                    <button
                      type="button"
                      onClick={() => setVoiceChatEnabled(!voiceChatEnabled)}
                      className={`pixel-switch flex items-center px-0.5 rounded-none cursor-pointer focus:outline-none transition-colors scale-90
                        ${voiceChatEnabled ? 'pixel-switch-active' : ''}`}
                    >
                      <div className={`pixel-switch-thumb rounded-none shadow-[1px_1px_0_rgba(0,0,0,0.15)]
                        ${voiceChatEnabled ? 'pixel-switch-thumb-active bg-[#FFF]' : 'bg-[#FFF]'}`}
                      />
                    </button>
                  </div>
                </div>

                {/* Navigation */}
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setCreateRoomStep(1)}
                    className="flex-1 btn-retro-pixel py-3 bg-white text-slate-950 font-pixel-title text-[8px] uppercase tracking-wider shadow-[3px_3px_0_#1A1C1C]"
                  >
                    {language === 'vi' ? '◀ QUAY LẠI' : '◀ BACK'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setCreateRoomStep(3)}
                    className="flex-1 btn-retro-pixel py-3 bg-[#4CC9F0] text-slate-950 font-pixel-title text-[8px] uppercase tracking-wider shadow-[3px_3px_0_#1A1C1C]"
                  >
                    {language === 'vi' ? 'TIẾP THEO ➔' : 'NEXT ➔'}
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3: BETTING */}
            {createRoomStep === 3 && (
              <div className="flex flex-col gap-4 animate-fade-in text-left">
                <div className="pixel-card p-5 flex flex-col gap-4 bg-white border-4 border-[#1A1C1C] shadow-[4px_4px_0_#1A1C1C]">
                  <div className="border-b-2 border-dashed border-[#1A1C1C]/15 pb-2">
                    <span className="font-pixel-title text-[10px] text-white bg-[#1A1C1C] px-2 py-0.5">2. CHOOSE BET</span>
                  </div>

                  <div className="flex justify-between items-center gap-2">
                    <div className="flex flex-col">
                      <span className="font-pixel-title text-[8px] text-[#1A1C1C]/50 uppercase">{language === 'vi' ? 'TIỀN CƯỢC' : 'BET AMOUNT'}</span>
                      <span className="font-pixel-title text-base text-[#ff5722] flex items-center gap-1 font-black">
                        <CoinIcon className="w-5.5 h-5.5" /> {lobbyBetAmount}
                      </span>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="font-pixel-title text-[8px] text-[#1A1C1C]/50 uppercase">{language === 'vi' ? 'SỐ DƯ CỦA BẠN' : 'YOUR COINS'}</span>
                      <span className="font-pixel-title text-xs text-[#1A1C1C] flex items-center gap-1 font-black">
                        <CoinIcon className="w-4 h-4" /> {userProfile?.coins ?? 0}
                      </span>
                    </div>
                  </div>

                  {/* Circular bet chips */}
                  <div className="flex flex-wrap gap-2 justify-center py-2">
                    {[10, 50, 100, 250, 500, 1000].map((val) => {
                      const isSelected = lobbyBetAmount === val;
                      const isPressed = pressedChip === val;
                      const isAffordable = !userProfile?.coins || userProfile.coins >= val;
                      return (
                        <button
                          key={val}
                          type="button"
                          disabled={!isAffordable}
                          onClick={() => {
                            setLobbyBetAmount(val);
                            setPressedChip(val);
                            setTimeout(() => setPressedChip(null), 220);
                          }}
                          className={`pixel-chip w-11 h-11 text-[9px]
                            ${isPressed ? 'chip-press' : ''}
                            ${isSelected ? 'pixel-chip-selected' : ''}
                            ${isAffordable ? '' : 'pixel-chip-disabled'}`}
                        >
                          {val}
                        </button>
                      );
                    })}
                  </div>

                  {/* Estimate Info cards */}
                  <div className="grid grid-cols-2 gap-2 mt-1">
                    <div className="pixel-info-card flex flex-col gap-0.5">
                      <span className="font-pixel-title text-[7px] text-[#1A1C1C]/50 uppercase">{language === 'vi' ? 'QUỸ THƯỞNG' : 'PRIZE POOL'}</span>
                      <span className="font-pixel-title text-[10px] text-emerald-600 flex items-center gap-1 font-black">
                        <CoinIcon className="w-3 h-3" /> {prizePool}
                      </span>
                    </div>
                    <div className="pixel-info-card flex flex-col gap-0.5">
                      <span className="font-pixel-title text-[7px] text-[#1A1C1C]/50 uppercase">{language === 'vi' ? 'PHẦN THƯỞNG' : 'MAX REWARD'}</span>
                      <span className="font-pixel-title text-[10px] text-amber-500 flex items-center gap-1 font-black">
                        <CoinIcon className="w-3 h-3" /> {prizePool}
                      </span>
                    </div>
                  </div>

                  {/* Bet validation messages */}
                  <div className="flex flex-col gap-1.5 select-none">
                    {!isAffordable && (
                      <div className="border-2 border-[#E63946] bg-[#FFECEF] text-[#E63946] p-2 text-center font-pixel-title text-[8px] uppercase tracking-wider animate-pulse">
                        ⚠️ {language === 'vi' ? 'Số dư không đủ!' : 'Insufficient balance!'}
                      </div>
                    )}
                    {lobbyBetAmount === 10 && (
                      <div className="border-2 border-sky-500 bg-[#EBF8FF] text-sky-600 p-1.5 text-center font-pixel-title text-[8px] uppercase tracking-wider">
                        ℹ️ {language === 'vi' ? 'Mức cược tối thiểu' : 'MINIMUM BET LEVEL'}
                      </div>
                    )}
                    {lobbyBetAmount === 1000 && (
                      <div className="border-2 border-amber-500 bg-[#FFFDF0] text-amber-600 p-1.5 text-center font-pixel-title text-[8px] uppercase tracking-wider animate-bounce-short">
                        🔥 {language === 'vi' ? 'MỨC CƯỢC TỐI ĐA!' : 'MAXIMUM BET LEVEL!'}
                      </div>
                    )}
                  </div>
                </div>

                {/* Navigation */}
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setCreateRoomStep(2)}
                    className="flex-1 btn-retro-pixel py-3 bg-white text-slate-950 font-pixel-title text-[8px] uppercase tracking-wider shadow-[3px_3px_0_#1A1C1C]"
                  >
                    {language === 'vi' ? '◀ QUAY LẠI' : '◀ BACK'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setCreateRoomStep(4)}
                    className="flex-1 btn-retro-pixel py-3 bg-[#4CC9F0] text-slate-950 font-pixel-title text-[8px] uppercase tracking-wider shadow-[3px_3px_0_#1A1C1C]"
                  >
                    {language === 'vi' ? 'TIẾP THEO ➔' : 'NEXT ➔'}
                  </button>
                </div>
              </div>
            )}

            {/* STEP 4: REVIEW */}
            {createRoomStep === 4 && (
              <div className="flex flex-col gap-4 animate-fade-in text-left">
                <span className="font-pixel-title text-[9px] text-[#1A1C1C]/70 uppercase tracking-wider text-center block">
                  {language === 'vi' ? 'XÁC NHẬN PHÒNG ĐẤU' : 'CONFIRM ROOM SETUP'}
                </span>

                {/* Receipt summary ticket */}
                <div className="room-summary-ticket flex flex-col gap-2.5 text-[11px] font-mono bg-[#FFFDF0]">
                  <div className="border-b-2 border-dashed border-[#1A1C1C]/25 pb-1 flex justify-between font-black uppercase text-[9px] text-[#1A1C1C]/60">
                    <span>RECEIPT: ROOM SETUP</span>
                    <span>#{(visibleEdition || 'original').substring(0, 3).toUpperCase()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#1A1C1C]/60">EDITION:</span>
                    <span className="font-black text-[#1A1C1C] uppercase">{getEditionDetails(lobbyEdition).name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#1A1C1C]/60">MAX PLAYERS:</span>
                    <span className="font-black text-[#1A1C1C]">{lobbyMaxPlayers} Players</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#1A1C1C]/60">BET SIZE:</span>
                    <span className="font-black text-[#ff5722]">{lobbyBetAmount} Gold</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#1A1C1C]/60">VISIBILITY:</span>
                    <span className="font-black text-[#1A1C1C] uppercase">{roomPrivacy === 'private' ? 'Private' : 'Public'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#1A1C1C]/60">VOICE CHAT:</span>
                    <span className="font-black text-[#1A1C1C] uppercase">{voiceChatEnabled ? 'Enabled' : 'Disabled'}</span>
                  </div>
                </div>

                {/* Navigation */}
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setCreateRoomStep(3)}
                    className="flex-1 btn-retro-pixel py-3 bg-white text-slate-950 font-pixel-title text-[8px] uppercase tracking-wider shadow-[3px_3px_0_#1A1C1C]"
                  >
                    {language === 'vi' ? '◀ QUAY LẠI' : '◀ BACK'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setCreateRoomStep(5)}
                    className="flex-1 btn-retro-pixel py-3 bg-[#4CC9F0] text-slate-950 font-pixel-title text-[8px] uppercase tracking-wider shadow-[3px_3px_0_#1A1C1C]"
                  >
                    {language === 'vi' ? 'TIẾP THEO ➔' : 'NEXT ➔'}
                  </button>
                </div>
              </div>
            )}

            {/* STEP 5: CREATE ROOM */}
            {createRoomStep === 5 && (
              <div className="flex flex-col gap-5 animate-fade-in text-center">
                {/* Decorative retro bomb graphic element */}
                <div className="border-4 border-[#1A1C1C] bg-[#1e293b] p-6 flex flex-col items-center justify-center gap-3 relative overflow-hidden shadow-[4px_4px_0px_#1A1C1C]">
                  <div className="absolute inset-0 pixel-crt pixel-scanline pointer-events-none" />
                  
                  {/* Small animated bomb icon using SVG */}
                  <svg viewBox="0 0 16 16" className="w-16 h-16 text-rose-500 fill-current animate-bounce-short drop-shadow-[0_2px_8px_rgba(244,63,94,0.4)]">
                    <path d="M7 1h2v1H7zM6 2h4v2H6zM3 5h10v1H3zM2 6h12v7H2zM3 13h10v1H3zM5 14h6v1H5z" />
                    <path d="M12 1h1v1h-1zM11 2h1v1h-1zM10 3h1v1h-1z" className="text-yellow-400 fill-current" />
                  </svg>
                  
                  <h3 className="font-pixel-title text-sm text-white uppercase tracking-wider select-none">
                    {language === 'vi' ? 'PHÒNG ĐÃ SẴN SÀNG!' : 'ROOM IS READY!'}
                  </h3>
                  <p className="font-pixel-body text-[10px] text-[#86efac] max-w-xs select-none">
                    {language === 'vi' 
                      ? 'Tất cả cấu hình đã hoàn tất. Kích nổ bom ngay để tạo phòng của riêng bạn!' 
                      : 'All configurations completed. Detonate the bomb now to establish your lobby!'}
                  </p>
                </div>

                {/* Detonate and Back buttons */}
                <div className="flex flex-col gap-3">
                  <button
                    disabled={!isAffordable}
                    onClick={() => {
                      const defuses = lobbyCustomDefuses === '' ? undefined : parseInt(lobbyCustomDefuses, 10);
                      const kittens = lobbyCustomExplodingKittens === '' ? undefined : parseInt(lobbyCustomExplodingKittens, 10);
                      createRoom(createPassword, lobbyEdition, lobbyMaxPlayers, lobbyBetAmount, defuses, kittens);
                      setIsCreatingRoom(false);
                    }}
                    className={`w-full btn-retro-pixel py-4 text-white font-pixel-title uppercase text-[10px] tracking-widest shadow-[4px_4px_0_#1A1C1C] active:translate-y-[2px]
                      ${isAffordable 
                        ? 'bg-[#E63946] active:translate-y-[2px]' 
                        : 'bg-[#64748B] opacity-50 cursor-not-allowed shadow-none active:translate-y-0'}`}
                    style={{ textShadow: '1px 1px 0px #1a1c1c' }}
                  >
                    💥 {language === 'vi' ? 'KÍCH NỔ / TẠO PHÒNG' : 'DETONATE / CREATE ROOM'} 💥
                  </button>
                  <button
                    type="button"
                    onClick={() => setCreateRoomStep(4)}
                    className="w-full btn-retro-pixel py-3 bg-white text-slate-950 font-pixel-title text-[8px] uppercase tracking-wider shadow-[3px_3px_0_#1A1C1C]"
                  >
                    {language === 'vi' ? '◀ QUAY LẠI TÓM TẮT' : '◀ BACK TO SUMMARY'}
                  </button>
                </div>
              </div>
            )}
          </div>
        );
      };

      return (
        <div className="w-full max-w-6xl mx-auto my-6 flex flex-col gap-6 animate-fade-in text-left bg-[#FFF5C3] border-4 border-[#1A1C1C] shadow-[8px_8px_0px_#1A1C1C] p-6 md:p-8 text-[#1A1C1C] font-pixel-body select-none">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b-4 border-[#1A1C1C] pb-3 gap-3">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="font-pixel-title text-2xl md:text-4xl text-[#1A1C1C] uppercase tracking-tight py-1 select-none">
                  CREATE
                </h1>
                <div 
                  className="font-pixel-title text-2xl md:text-4xl bg-[#E63946] text-white px-3.5 py-1 rounded-none border-4 border-[#1A1C1C] shadow-[4px_4px_0_#1A1C1C] tracking-tight transform rotate-2 select-none"
                  style={{ textShadow: '1.5px 1.5px 0px #1a1c1c' }}
                >
                  ROOM
                </div>
              </div>
              <p className="text-[10px] md:text-[11px] font-bold text-[#1A1C1C]/80 mt-2 max-w-xl leading-relaxed">
                {language === 'vi' 
                  ? 'Tập hợp các chiến binh mèo của bạn và chuẩn bị cho sự hỗn loạn bùng nổ. Chọn phiên bản hủy diệt bên dưới.' 
                  : 'Assemble your feline warriors and prepare for explosive chaos. Choose your flavor of destruction below.'}
              </p>
            </div>
            <button
              onClick={() => setIsCreatingRoom(false)}
              className="btn-retro-pixel bg-[#4CC9F0] text-[#1A1C1C] font-pixel-title text-[9px] px-4 py-2 uppercase tracking-wider text-center shadow-[3px_3px_0_#1A1C1C] hover:translate-y-[-1.5px] hover:shadow-[4.5px_4.5px_0_#1A1C1C] active:translate-y-[1.5px] active:shadow-[1px_1px_0_#1A1C1C]"
            >
              {language === 'vi' ? '◀ SẢNH CHỜ' : '◀ BACK TO LOBBY'}
            </button>
          </div>

          {/* Responsive Layout Switcher */}
          {renderDesktopLayout()}
          {renderMobileLayout()}
        </div>
      );
    }

    return (
      <div className="w-full max-w-5xl mx-auto my-6 flex flex-col gap-6 animate-fade-in">
        {/* Header with Coins, Gems and Daily Reward */}
        <div className="flex justify-end items-center gap-4 flex-wrap">
          {/* Daily Reward Widget */}
          <button
            onClick={handleDailyReward}
            disabled={isDailyRewardClaimed}
            className={`btn-retro-pixel px-4 py-1.5 flex items-center gap-2 text-xs font-headline font-black transition-all uppercase
              ${isDailyRewardClaimed 
                ? 'bg-neutral-200 text-neutral-400 border-neutral-400 shadow-none cursor-not-allowed translate-y-[3px]' 
                : 'bg-[var(--pop-red)] hover:bg-[#e64a19] text-white animate-bounce-short shadow-[3px_3px_0px_0px_#1a1c1c]'
              }`}
            title={isDailyRewardClaimed ? 'Already claimed today' : 'Claim Daily Reward'}
          >
            <span className="material-symbols-outlined text-[16px]">
              {isDailyRewardClaimed ? 'check_circle' : 'featured_seasonal'}
            </span>
            <span>
              {isDailyRewardClaimed 
                ? (language === 'vi' ? 'ĐÃ NHẬN QUÀ' : 'CLAIMED') 
                : (language === 'vi' ? 'NHẬN QUÀ HÀNG NGÀY' : 'DAILY REWARD')}
            </span>
          </button>

          {/* Gold Coin Badge */}
          <div 
            className="bg-white border-2 border-[var(--pop-black)] px-3 py-1.5 rounded-xl flex items-center gap-2 shadow-[2.5px_2.5px_0px_0px_#1a1c1c] text-xs font-headline font-black text-on-surface cursor-help relative group transition-all hover:translate-y-[-1px] hover:shadow-[3.5px_3.5px_0px_0px_#1a1c1c]"
          >
            <CoinIcon className="w-4 h-4" />
            <span>{userProfile?.coins?.toLocaleString() ?? 0}</span>
            {/* Tooltip */}
            <div className="hidden group-hover:block absolute top-[110%] right-0 bg-[var(--pop-black)] text-white text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 rounded-md border-2 border-white shadow-[2px_2px_0_var(--pop-black)] w-max z-50 pointer-events-none">
              {language === 'vi' ? 'Tiền vàng dùng để đặt cược khi vào trận' : 'Gold coins used for match bidding'}
            </div>
          </div>

          {/* Pink Coin Badge */}
          <div 
            className="bg-white border-2 border-[var(--pop-black)] px-3 py-1.5 rounded-xl flex items-center gap-2 shadow-[2.5px_2.5px_0px_0px_#1a1c1c] text-xs font-headline font-black text-on-surface cursor-help relative group transition-all hover:translate-y-[-1px] hover:shadow-[3.5px_3.5px_0px_0px_#1a1c1c]"
          >
            <GemIcon className="w-4 h-4" />
            <span>{userProfile?.gems?.toLocaleString() ?? 0}</span>
            {/* Tooltip */}
            <div className="hidden group-hover:block absolute top-[110%] right-0 bg-[var(--pop-black)] text-white text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 rounded-md border-2 border-white shadow-[2px_2px_0_var(--pop-black)] w-max z-50 pointer-events-none">
              {language === 'vi' ? 'Xu hồng dùng để mua sắm trong Cửa hàng' : 'Pink coins used for Shop purchases'}
            </div>
          </div>
        </div>

        {/* Title Section (Lobby Hero Banner) */}
        <div className="relative flex flex-col items-center md:items-start p-6 bg-[var(--surface-dim)] border-3 border-[#1a1c1c] rounded-2xl shadow-[4px_4px_0_#1a1c1c] overflow-hidden mb-2 mt-2">
          {/* Background Grid */}
          <div className="absolute inset-0 bg-retro-grid opacity-20 pointer-events-none" />
          
          {/* Sparkling Stars */}
          <div className="pixel-sparkle sparkle-1">★</div>
          <div className="pixel-sparkle sparkle-2">★</div>
          <div className="pixel-sparkle sparkle-3">🐾</div>
          
          <div className="relative z-10">
            <h1 
              className="font-headline font-black text-4xl md:text-5xl text-on-surface uppercase tracking-tight relative select-none leading-none py-1 animate-pulse-slow"
              style={{
                WebkitTextStroke: '2px #1a1c1c',
                textShadow: '4px 4px 0px #ff5722'
              }}
            >
              CHOOSE YOUR CHAOS
            </h1>
            <p className="mt-2 text-xs font-pop-accent font-black uppercase text-[var(--pop-black)]/70 tracking-wider">
              {language === 'vi' 
                ? '⚡ Chọn chế độ chơi và thể hiện trình độ mèo nổ của bạn!' 
                : '⚡ Choose your game mode and dominate the board!'}
            </p>
          </div>
        </div>

        {/* Quick Actions Row */}
        <div className="flex flex-col md:flex-row flex-wrap lg:flex-nowrap justify-center items-stretch gap-6 md:gap-8 mb-8 mt-4 max-w-5xl mx-auto w-full">
          {/* Card 1: QUICK PLAY */}
          <PlayModeCard
            title={language === 'vi' ? 'CHƠI NHANH' : 'QUICK PLAY'}
            subtitle={language === 'vi' ? 'Tìm trận tức thì' : 'Instant matchmaking'}
            description={language === 'vi' ? 'Vào trận ngay lập tức và so tài trực tiếp cùng các đối thủ trực tuyến.' : 'Instantly join a matching public game and play with other online players.'}
            illustrationSrc={quickplayIcon}
            bgClass="bg-sunburst"
            isPrimary={true}
            badgeText={language === 'vi' ? 'KHUYÊN DÙNG' : 'POPULAR'}
            isDisabled={isQuickPlaySearching}
            onClick={handleQuickPlay}
            buttonText={isQuickPlaySearching ? (language === 'vi' ? 'ĐANG TÌM...' : 'SEARCHING...') : (language === 'vi' ? 'BẮT ĐẦU CHƠI' : 'PLAY NOW')}
            buttonBgClass="bg-[var(--pop-amber)] hover:bg-white text-[var(--pop-black)] shadow-[4px_4px_0_var(--pop-black)]"
            extraContent={isQuickPlaySearching && (
              <>
                <div className="radar-scan-line" />
                <div className="absolute inset-0 bg-red-500/10 animate-pulse z-10" />
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 z-20">
                  <div className="w-10 h-10 border-4 border-[var(--pop-black)] border-t-transparent rounded-full animate-spin" />
                  <span className="font-headline font-black text-xs text-[var(--pop-black)] uppercase tracking-wider bg-white/95 px-2 py-0.5 rounded border-2 border-[var(--pop-black)] shadow-[2px_2px_0_var(--pop-black)]">
                    {language === 'vi' ? 'Đang tìm...' : 'Searching...'}
                  </span>
                </div>
              </>
            )}
          />

          {/* Card 2: CREATE PRIVATE ROOM */}
          <PlayModeCard
            title={language === 'vi' ? 'TẠO PHÒNG' : 'CREATE ROOM'}
            subtitle={language === 'vi' ? 'Mời bạn bè tham gia' : 'Invite your friends'}
            description={language === 'vi' ? 'Tạo một phòng đấu mới của riêng bạn để tùy chỉnh luật chơi và rủ bạn bè.' : 'Set up a custom room with your preferred rules and challenge your friends.'}
            illustrationSrc={createRoomIcon}
            bgClass="bg-halftone"
            isPrimary={false}
            imageClass="w-full h-full object-cover scale-125"
            imageStyle={{ '--wiggle-scale': 1.25 }}
            onClick={() => {
              setIsCreatingRoom(true);
              setLobbyEdition('original');
              setLobbyMaxPlayers(5);
              setCreatePassword('');
              setCreateRoomStep(1);
              setRoomPrivacy('public');
            }}
            buttonText={language === 'vi' ? 'TẠO PHÒNG' : 'CREATE ROOM'}
            buttonBgClass="bg-[var(--pop-green)] hover:bg-white text-[var(--pop-black)] shadow-[4px_4px_0_var(--pop-black)]"
          />

          {/* Card 3: JOIN VIA CODE */}
          <PlayModeCard
            title={language === 'vi' ? 'VÀO BẰNG MÃ' : 'JOIN BY CODE'}
            subtitle={language === 'vi' ? 'Nhập mã phòng đấu' : 'Enter a room code'}
            description={language === 'vi' ? 'Nhập mã phòng gồm 6 ký tự được bạn bè chia sẻ để tham gia phòng đấu.' : 'Enter a 6-character invitation room code to connect and play with others.'}
            illustrationSrc={idRoomImg}
            bgClass="bg-retro-grid"
            isPrimary={false}
            isDisabled={roomInput.length !== 6}
            imageClass="w-full h-full object-contain"
            enableWiggle={false}
            onClick={() => joinRoom(roomInput)}
            buttonText={language === 'vi' ? 'VÀO PHÒNG' : 'JOIN ROOM'}
            buttonBgClass="bg-[var(--pop-blue)] hover:bg-white text-[var(--pop-black)] shadow-[4px_4px_0_var(--pop-black)]"
            extraContent={
              <div className="absolute inset-0 flex flex-col items-center justify-center pt-8 z-20">
                <input
                  type="text"
                  placeholder={language === 'vi' ? 'NHẬP MÃ' : 'ENTER CODE'}
                  value={roomInput}
                  onChange={(e) => setRoomInput(e.target.value.toUpperCase())}
                  maxLength={6}
                  className="w-3/4 max-w-[150px] bg-white/95 border-3 border-[var(--pop-black)] rounded-lg px-2.5 py-1.5 text-[var(--pop-black)] font-headline font-black uppercase tracking-widest text-center text-sm md:text-base focus:outline-none focus:bg-white focus:scale-105 transition-all shadow-[inset_2px_2px_0px_0px_#cbd5e1] focus:shadow-[3px_3px_0_var(--pop-black)]"
                />
              </div>
            }
          />
        </div>

        {/* Active Games List Table */}
        <div className="bg-white border-3 border-on-surface shadow-[6px_6px_0px_0px_#1a1c1c] rounded-2xl overflow-hidden mb-6">
          <div className="bg-on-surface px-6 py-4 flex items-center text-white border-b-3 border-on-surface">
            <h3 className="font-headline font-black text-sm uppercase tracking-wider">
              ACTIVE GAMES
            </h3>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b-3 border-on-surface bg-slate-50 text-[10px] font-headline font-black uppercase text-on-surface">
                  <th className="py-3.5 px-6">ROOM CODE</th>
                  <th className="py-3.5 px-6">HOST</th>
                  <th className="py-3.5 px-6">EDITION</th>
                  <th className="py-3.5 px-6 text-center">BET</th>
                  <th className="py-3.5 px-6 text-center">PLAYERS</th>
                  <th className="py-3.5 px-6 text-center">STATUS</th>
                  <th className="py-3.5 px-6 text-right">ACTION</th>
                </tr>
              </thead>
              <tbody className="divide-y-2 divide-slate-100 font-sans font-bold text-xs text-on-surface">
                {publicRooms.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="py-12 px-6 text-center bg-slate-50/50">
                      <div className="flex flex-col items-center justify-center gap-3">
                        <span className="material-symbols-outlined text-5xl text-[var(--pop-red)] animate-bounce">
                          sentiment_dissatisfied
                        </span>
                        <h4 className="font-pop-display font-black text-lg text-on-surface uppercase tracking-tight">
                          {language === 'vi' ? 'Không có phòng nào đang mở' : 'No Active Rooms'}
                        </h4>
                        <p className="font-pop-body text-xs text-on-surface/60 max-w-sm font-semibold">
                          {language === 'vi' 
                            ? 'Không có phòng công khai nào đang chờ... Hãy tự tạo phòng đấu của riêng bạn để cùng chiến!' 
                            : 'No public games are currently waiting. Create your own room and invite your friends!'}
                        </p>
                        <button
                          onClick={() => {
                            setIsCreatingRoom(true);
                            setLobbyEdition('original');
                            setLobbyMaxPlayers(5);
                            setCreatePassword('');
                            setCreateRoomStep(1);
                            setRoomPrivacy('public');
                          }}
                          className="btn-retro-pixel btn-shine-container px-4 py-2 mt-2 bg-[var(--pop-green)] text-xs text-[var(--pop-black)] shadow-[3px_3px_0_var(--pop-black)] font-black"
                        >
                          {language === 'vi' ? 'TẠO PHÒNG NGAY' : 'CREATE ROOM NOW'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  publicRooms.map((room) => {
                    const isFull = room.players.length >= room.maxPlayers;
                    
                    // Edition badge with custom pixel art icon
                    const renderEditionBadge = (edition) => {
                      let icon = null;
                      let colorClass = "";
                      if (edition === 'zombie') {
                        icon = <PixelSkullIcon size={12} className="mr-1 text-emerald-600" />;
                        colorClass = "bg-emerald-50 border-emerald-200 text-emerald-800";
                      } else if (edition === 'imploding') {
                        icon = <PixelBombIcon size={12} className="mr-1 text-rose-600" />;
                        colorClass = "bg-rose-50 border-rose-200 text-rose-800";
                      } else {
                        icon = <PixelStarIcon size={12} className="mr-1 text-amber-500" />;
                        colorClass = "bg-amber-50 border-amber-200 text-amber-800";
                      }
                      
                      return (
                        <span className={`inline-flex items-center text-[10px] font-pop-accent font-black border-2 px-2.5 py-0.5 rounded-lg uppercase tracking-wide ${colorClass}`}>
                          {icon}
                          {t('edition_' + edition + '_name') || edition}
                        </span>
                      );
                    };

                    return (
                      <tr 
                        key={room.code} 
                        onClick={() => !isFull && handleJoinRoomCode(room.code, room.password)}
                        className="hover:bg-slate-50/80 transition-colors cursor-pointer"
                      >
                        <td className="py-4 px-6 font-headline font-black text-primary uppercase text-sm flex items-center gap-2">
                          {room.code}
                          {room.hasPassword && <LockIcon className="w-4 h-4 text-slate-400" strokeWidth={2.5} />}
                        </td>
                        <td className="py-4 px-6 font-bold">{room.players[0]?.username || 'Ẩn danh'}</td>
                        <td className="py-4 px-6">
                          {renderEditionBadge(room.edition)}
                        </td>
                        <td className="py-4 px-6 text-center font-black text-[#ff5722]">
                          {room.betAmount || 50}
                        </td>
                        <td className="py-4 px-6 text-center">
                          <div className="flex flex-col items-center justify-center">
                            <span className={`font-headline font-black text-xs ${isFull ? 'text-rose-600' : 'text-on-surface'}`}>
                              {room.players.length}/{room.maxPlayers}
                            </span>
                            <div className="flex items-center gap-0.5 mt-1">
                              {Array.from({ length: room.maxPlayers }).map((_, i) => (
                                <div 
                                  key={i} 
                                  className={`w-1.5 h-3 rounded-[1px] border border-[#1a1c1c]
                                    ${i < room.players.length ? 'bg-[var(--pop-green)]' : 'bg-slate-200'}`}
                                />
                              ))}
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-6 text-center">
                          <span className={`inline-block px-2.5 py-0.5 text-[9px] font-headline font-black rounded-md border-2
                            ${isFull 
                              ? 'bg-rose-100 border-rose-300 text-rose-700' 
                              : 'bg-emerald-100 border-emerald-300 text-emerald-700'}`}>
                            {isFull ? 'FULL' : 'WAITING'}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-right" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => handleJoinRoomCode(room.code, room.password)}
                            disabled={isFull}
                            className={`btn-retro-pixel px-4 py-1.5 font-headline font-black uppercase text-[10px] tracking-wider
                              ${isFull 
                                ? 'bg-neutral-100 border-neutral-300 text-neutral-400 cursor-not-allowed shadow-none translate-y-[3px]' 
                                : 'bg-yellow-400 border-on-surface text-slate-950 shadow-[2px_2px_0px_0px_#1a1c1c] active:translate-y-[2px] active:shadow-[1px_1px_0px_0px_#1a1c1c]'}`}
                          >
                            {isFull ? 'FULL' : 'JOIN'}
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal tạo phòng */}
        {isCreateModalOpen && (
          <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
            <div className="bg-white border-4 border-on-surface shadow-[8px_8px_0px_0px_#1a1c1c] rounded-3xl p-6 w-full max-w-md flex flex-col gap-5 relative text-left">
              <button 
                onClick={() => setIsCreateModalOpen(false)}
                className="absolute top-4 right-4 font-headline font-black text-on-surface hover:scale-110 active:scale-95 text-lg"
              >
                ✕
              </button>
              
              <div>
                <h3 className="font-headline font-black text-xl text-on-surface uppercase tracking-tight">TẠO PHÒNG MỚI</h3>
                <p className="text-[10px] font-bold text-on-surface-variant mt-0.5">Thiết lập các thông số đấu trường của bạn.</p>
              </div>

              <div className="flex flex-col gap-4 border-2 border-on-surface bg-slate-50 p-4 rounded-2xl shadow-[2.5px_2.5px_0px_0px_#1a1c1c]">


                <div className="flex justify-between items-center text-xs font-bold text-on-surface relative">
                  <span className="flex items-center gap-1.5"><ExtensionIcon className="w-4 h-4 text-on-surface" strokeWidth={2.5} /> Phiên bản:</span>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setIsEditionDropdownOpen(!isEditionDropdownOpen)}
                      className="bg-white border-2 border-on-surface px-3 py-1.5 rounded-xl text-xs font-headline font-black focus:outline-none flex items-center gap-1.5 hover:bg-slate-100 transition-all shadow-[1.5px_1.5px_0px_0px_#1a1c1c] active:translate-y-0.5 active:shadow-none min-w-[155px] justify-between text-slate-950"
                    >
                      <span>{t('edition_' + lobbyEdition + '_name')}</span>
                      <span className={`text-[9px] transition-transform duration-200 ${isEditionDropdownOpen ? 'rotate-180' : ''}`}>▼</span>
                    </button>
                    {isEditionDropdownOpen && (
                      <>
                        <div 
                          className="fixed inset-0 z-40" 
                          onClick={() => setIsEditionDropdownOpen(false)}
                        />
                        <div className="absolute right-0 mt-2 w-60 bg-white border-2 border-on-surface rounded-2xl shadow-[4px_4px_0px_0px_#1a1c1c] z-50 overflow-hidden py-1 max-h-64 overflow-y-auto animate-fade-in custom-scrollbar">
                          {editionsList.map((key) => (
                            <button
                              key={key}
                              type="button"
                              onClick={() => {
                                setLobbyEdition(key);
                                setIsEditionDropdownOpen(false);
                              }}
                              className={`w-full text-left px-4 py-2.5 text-xs font-headline font-black hover:bg-[#b7131a] hover:text-white transition-all flex items-center justify-between uppercase tracking-wider text-slate-900
                                ${lobbyEdition === key ? 'bg-slate-100 text-[#b7131a] border-l-4 border-[#b7131a]' : ''}`}
                            >
                              <span>{t('edition_' + key + '_name')}</span>
                              {lobbyEdition === key && <CheckIcon className="w-3.5 h-3.5 text-[#b7131a]" strokeWidth={3.5} />}
                            </button>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                </div>
                
                <div className="flex flex-col gap-1.5 text-xs font-bold text-on-surface">
                  <span className="flex items-center gap-1.5"><LockIcon className="w-4 h-4 text-on-surface" strokeWidth={2.5} /> Mật khẩu phòng (nếu muốn):</span>
                  <input
                    type="password"
                    placeholder="Nhập mật khẩu..."
                    value={createPassword}
                    onChange={(e) => setCreatePassword(e.target.value)}
                    className="bg-white border-2 border-on-surface px-3 py-2 rounded-xl text-xs font-bold focus:outline-none focus:bg-slate-100 transition-all w-full"
                  />
                </div>

                <div className="flex flex-col gap-1.5 text-xs font-bold text-on-surface mt-2">
                  <span className="flex items-center gap-1.5">Tiền cược (GoldCoin):</span>
                  <div className="flex items-center gap-3">
                    <input
                      type="range"
                      min="10"
                      max="1000"
                      step="10"
                      value={lobbyBetAmount}
                      onChange={(e) => setLobbyBetAmount(Number(e.target.value))}
                      className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                    />
                    <span className="font-bold text-[#ff5722] min-w-[40px] text-right">{lobbyBetAmount}</span>
                  </div>
                </div>
              </div>

              <ImageButton
                variant="primary"
                size="lg"
                onClick={() => {
                  createRoom(createPassword, lobbyEdition, 5, lobbyBetAmount);
                  setIsCreateModalOpen(false);
                }}
                className="w-full font-headline font-black uppercase text-xs"
              >
                XÁC NHẬN TẠO PHÒNG
              </ImageButton>
            </div>
          </div>
        )}
      </div>
    );
  }

  const isHost = roomState.host === myUser.id;

  // ==========================================
  // VIEW 2: LOBBY WAITING SCREEN
  // ==========================================
  if (roomState.status === 'waiting') {
    return (
      <div className="w-full min-h-[calc(100vh-4rem)] flex justify-center items-center p-5 bg-[var(--pop-black)] text-[var(--pop-black)] animate-fade-in relative z-10 overflow-hidden">
        
        {/* Floating Background Cards */}
        <div className="absolute inset-0 pointer-events-none z-0 opacity-30">
          <img src={getCardImageUrl('defuse')} className="absolute top-10 left-10 w-32 md:w-48 rotate-[-15deg] drop-shadow-xl" alt="" />
          <img src={getCardImageUrl('exploding')} className="absolute bottom-10 left-20 w-36 md:w-56 rotate-[20deg] drop-shadow-xl" alt="" />
          <img src={getCardImageUrl('attack')} className="absolute top-20 right-10 w-40 md:w-52 rotate-[10deg] drop-shadow-xl" alt="" />
          <img src={getCardImageUrl('skip')} className="absolute bottom-20 right-32 w-28 md:w-40 rotate-[-30deg] drop-shadow-xl" alt="" />
          <img src={getCardImageUrl('shuffle')} className="absolute top-1/2 left-5 w-24 md:w-32 rotate-[-45deg] drop-shadow-xl" alt="" />
          <img src={getCardImageUrl('favor')} className="absolute top-1/2 right-10 w-24 md:w-32 rotate-[45deg] drop-shadow-xl" alt="" />
        </div>

        {/* LOBBY CONTAINER */}
        <div className="bg-[var(--pop-cream)] border-[6px] border-white rounded-lg p-5 w-full max-w-[1000px] shadow-[8px_8px_0_white] flex flex-col gap-5 relative z-10">
          
          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between items-center border-b-4 border-dashed border-[var(--pop-black)] pb-3 gap-4">
            <h1 className="font-pop-display font-black text-3xl md:text-4xl m-0 text-white uppercase tracking-wider" style={{ textShadow: '3px 3px 0px var(--pop-black), -2px -2px 0px var(--pop-black), 2px -2px 0px var(--pop-black), -2px 2px 0px var(--pop-black)' }}>
              MÈO NỔ - SẢNH CHỜ
            </h1>
            
            <div className="flex items-center gap-4 text-xl font-pop-accent font-black">
              <span className="flex items-center gap-2">
                MÃ PHÒNG: 
                <span className="bg-white px-3 py-1 border-2 border-[var(--pop-black)] shadow-[2px_2px_0_var(--pop-black)] text-[var(--pop-black)] flex items-center gap-2">
                  {roomState.code}
                  <button 
                    onClick={() => handleCopyCode(roomState.code)} 
                    className="hover:scale-110 transition-transform"
                    title="Sao chép"
                  >
                    {copied ? (
                      <CheckIcon className="w-4 h-4 text-[var(--pop-green)]" strokeWidth={4} />
                    ) : (
                      <img src={copyIcon} className="w-5 h-5 object-contain opacity-80 hover:opacity-100" alt="Copy" />
                    )}
                  </button>
                </span>
              </span>
              <span className="text-sm bg-[var(--pop-black)] text-white px-2 py-1 rounded-sm shadow-[2px_2px_0_white]">
                {t('edition_' + roomState.edition + '_name') || roomState.edition}
              </span>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex flex-col lg:flex-row gap-5">
            
            {/* Player List */}
            <div className="flex-[2] grid grid-cols-1 sm:grid-cols-2 gap-4 content-start">
              
              {roomState.players.map((player) => {
                const isMe = player.userId === myUser.id;
                const isPlayerHost = roomState.host === player.userId;
                
                return (
                  <div
                    key={player.userId}
                    className={`bg-white border-4 p-3 flex items-center gap-4 shadow-[inset_-3px_-3px_0_rgba(0,0,0,0.05),4px_4px_0_rgba(0,0,0,0.2)] relative transition-transform ${isMe ? 'border-[var(--pop-amber)] scale-[1.02]' : 'border-[var(--pop-black)] hover:scale-[1.02]'}`}
                  >
                    <div 
                      className="w-[50px] h-[50px] bg-[#ddd] border-2 border-[var(--pop-black)] flex justify-center items-center font-pop-display font-black text-2xl uppercase shrink-0"
                      style={{ backgroundColor: getAvatarBgColor(player.username || player.userId) }}
                    >
                      {player.username ? player.username.slice(0, 2) : player.userId.slice(0, 2)}
                    </div>
                    
                    <div className="flex-1 overflow-hidden">
                      <div className="flex items-center gap-2">
                        <h3 className="font-pop-accent font-black text-lg m-0 truncate text-[var(--pop-black)]">
                          {player.username || player.userId}
                        </h3>
                        {isPlayerHost && <CrownIcon className="w-4 h-4 text-[var(--pop-amber)] shrink-0" strokeWidth={3} title="Trưởng phòng" />}
                      </div>
                      <p className="font-pop-body text-[10px] uppercase m-0 mt-0.5 text-[var(--pop-black)]/70">
                        {isMe ? 'Bạn' + (isPlayerHost ? ' (Chủ phòng)' : '') : (isPlayerHost ? 'Chủ phòng' : 'Người chơi')}
                      </p>
                      <p className={`font-pop-display font-black text-xs uppercase m-0 mt-1 ${player.isReady ? 'text-[var(--pop-green)]' : 'text-[var(--pop-red)]'}`}>
                        {player.isReady ? 'SẴN SÀNG ✔' : 'CHƯA SẴN SÀNG ✖'}
                      </p>
                    </div>

                    {isHost && !isMe && (
                      <button 
                        onClick={() => kickPlayer(player.userId)}
                        className="absolute -top-2 -right-2 bg-[var(--pop-red)] text-white p-1 border-2 border-[var(--pop-black)] rounded-full hover:scale-110 active:scale-95 shadow-[2px_2px_0_var(--pop-black)]"
                        title="Mời ra ngoài"
                      >
                        <LogoutIcon className="w-3 h-3" strokeWidth={3} />
                      </button>
                    )}
                  </div>
                );
              })}
              
              {/* Empty Slots */}
              {Array.from({ length: (roomState.edition === '2_player' ? 2 : (roomState.edition === 'imploding' ? 6 : 5)) - roomState.players.length }).map((_, i) => (
                <div key={`empty-${i}`} className="bg-white/50 border-4 border-dashed border-[var(--pop-black)]/40 p-3 flex items-center justify-center h-[82px]">
                  <p className="font-pop-accent font-black text-[var(--pop-black)]/60 uppercase m-0 text-sm">Đang chờ...</p>
                </div>
              ))}
              
            </div>

            {/* Sidebar */}
            <div className="flex-[1] flex flex-col gap-4 content-start">
              
              {/* Cài đặt phòng */}
              <div className="bg-white border-4 border-[var(--pop-black)] p-4 shadow-[4px_4px_0_rgba(0,0,0,0.2)]">
                <div className="flex justify-between items-center border-b-2 border-[var(--pop-black)] pb-2 mb-3">
                  <h3 className="font-pop-display font-black text-sm uppercase m-0 text-[var(--pop-black)]">
                    CÀI ĐẶT PHÒNG
                  </h3>
                  {isHost && (
                    <button 
                      onClick={() => {
                        setLobbyEdition(roomState.edition || 'original');
                        setLobbyMaxPlayers(roomState.maxPlayers || 5);
                        setLobbyCustomDefuses(roomState.customDefuses ?? '');
                        setLobbyCustomExplodingKittens(roomState.customExplodingKittens ?? '');
                        setIsEditRoomModalOpen(true);
                      }}
                      className="bg-[var(--pop-amber)] text-[var(--pop-black)] border-2 border-[var(--pop-black)] px-2 py-0.5 text-xs font-black shadow-[2px_2px_0_var(--pop-black)] hover:translate-y-[1px] hover:shadow-[1px_1px_0_var(--pop-black)] active:shadow-none"
                    >
                      SỬA
                    </button>
                  )}
                </div>
                
                <div className="flex flex-col gap-2 text-sm font-pop-accent text-[var(--pop-black)]">
                  <div className="flex justify-between items-center">
                    <span>Thời gian:</span>
                    <strong className="bg-[var(--pop-cream)] border-2 border-[var(--pop-black)] px-2 py-0.5 text-xs">30s/lượt</strong>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Chế độ:</span>
                    <strong className="bg-[var(--pop-cream)] border-2 border-[var(--pop-black)] px-2 py-0.5 text-xs truncate max-w-[150px]">{t('edition_' + roomState.edition + '_name') || roomState.edition}</strong>
                  </div>
                  <div className="flex justify-between items-center mt-2 pt-2 border-t border-dashed border-[var(--pop-black)]/50">
                    <span className="flex items-center gap-1">
                      <CoinIcon className="w-4 h-4 text-[var(--pop-amber)]" /> Cược:
                    </span>
                    <strong className="text-[var(--pop-amber)] text-lg font-black" style={{ textShadow: '1px 1px 0 var(--pop-black)' }}>{roomState.betAmount || 50}</strong>
                  </div>
                </div>
              </div>

              {/* Chat */}
              <div className="bg-white border-4 border-[var(--pop-black)] p-4 shadow-[4px_4px_0_rgba(0,0,0,0.2)] flex flex-col flex-grow min-h-[220px]">
                <h3 className="font-pop-display font-black text-sm uppercase m-0 text-[var(--pop-black)] border-b-2 border-[var(--pop-black)] pb-2 mb-3">
                  CHAT
                </h3>
                
                <div className="bg-[var(--pop-cream)] border-[3px] border-inset border-[var(--pop-black)] p-2 h-[120px] overflow-y-auto font-pop-body text-xs flex flex-col gap-1 mb-2 shadow-inner">
                  <div className="text-[var(--pop-black)]/50 italic text-center py-2">Tính năng chat sắp ra mắt...</div>
                </div>
                
                <form className="flex gap-2" onSubmit={(e) => e.preventDefault()}>
                  <input 
                    type="text" 
                    className="w-full box-border border-[3px] border-[var(--pop-black)] p-1.5 font-pop-body text-sm outline-none focus:bg-[#fdf2e9]" 
                    placeholder="Nhập tin nhắn..." 
                    disabled
                  />
                  <button type="button" className="bg-[var(--pop-black)] text-white border-[3px] border-[var(--pop-black)] px-3 font-pop-accent font-black text-xs uppercase hover:bg-slate-800" disabled>
                    GỬI
                  </button>
                </form>
              </div>

            </div>
          </div>

          {/* Footer (Buttons) */}
          <div className="flex justify-center flex-wrap gap-5 mt-3 pt-4 border-t-4 border-dashed border-[var(--pop-black)]">
            
            {!isHost ? (
              <button
                onClick={() => toggleReady(!roomState.players.find(p => p.userId === myUser.id)?.isReady)}
                className={`font-pop-display font-black text-xl md:text-2xl px-6 py-3 border-[4px] border-[var(--pop-black)] uppercase shadow-[0_6px_0_var(--pop-black)] transition-all hover:brightness-110 active:shadow-[0_0px_0_var(--pop-black)] active:translate-y-[6px] ${roomState.players.find(p => p.userId === myUser.id)?.isReady ? 'bg-[var(--pop-red)] text-white' : 'bg-[var(--pop-green)] text-white'}`}
              >
                {roomState.players.find(p => p.userId === myUser.id)?.isReady ? 'HỦY SẴN SÀNG' : 'SẴN SÀNG'}
              </button>
            ) : null}

            {isHost ? (
              <button
                onClick={startGame}
                disabled={roomState.players.length < 2 || roomState.players.some(p => p.userId !== roomState.host && !p.isReady)}
                className={`font-pop-display font-black text-xl md:text-2xl px-6 py-3 border-[4px] border-[var(--pop-black)] uppercase transition-all ${(roomState.players.length < 2 || roomState.players.some(p => p.userId !== roomState.host && !p.isReady)) ? 'bg-slate-400 text-white cursor-not-allowed shadow-[0_6px_0_#475569]' : 'bg-[var(--pop-green)] text-white shadow-[0_6px_0_var(--pop-black)] hover:brightness-110 active:shadow-[0_0px_0_var(--pop-black)] active:translate-y-[6px]'}`}
              >
                BẮT ĐẦU ({roomState.players.filter(p => p.isReady).length}/{roomState.players.length})
              </button>
            ) : null}
            
            {/* Thoát phòng */}
            <button
              onClick={handleLeaveConfirm}
              className="absolute top-2 right-2 md:static font-pop-display font-black text-sm px-4 py-2 border-[3px] border-[var(--pop-black)] bg-white text-[var(--pop-black)] uppercase shadow-[0_4px_0_var(--pop-black)] transition-all hover:bg-[var(--pop-cream)] active:shadow-[0_0px_0_var(--pop-black)] active:translate-y-[4px] flex items-center gap-2"
            >
      <img src={doorIcon} className="w-5 h-5 object-contain" alt="Exit" />
      <span>THOÁT</span>
    </button>
            
          </div>

        </div>

        {/* Edit Room Modal */}
        {isEditRoomModalOpen && isHost && (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
            <div className="bg-[var(--pop-cream)] border-[6px] border-[var(--pop-black)] shadow-[8px_8px_0_var(--pop-black)] p-6 w-full max-w-md flex flex-col gap-5 relative text-[var(--pop-black)]">
              <button 
                onClick={() => setIsEditRoomModalOpen(false)}
                className="absolute -top-4 -right-4 bg-[var(--pop-red)] text-white w-10 h-10 border-4 border-[var(--pop-black)] rounded-full font-pop-display font-black text-xl flex justify-center items-center hover:scale-110 active:scale-95 shadow-[2px_2px_0_var(--pop-black)]"
              >
                X
              </button>
              
              <div className="border-b-4 border-dashed border-[var(--pop-black)] pb-3 text-center">
                <h3 className="font-pop-display font-black text-2xl uppercase tracking-tight m-0 text-white" style={{ textShadow: '2px 2px 0px var(--pop-black), -2px -2px 0px var(--pop-black), 2px -2px 0px var(--pop-black), -2px 2px 0px var(--pop-black)' }}>CÀI ĐẶT PHÒNG</h3>
                <p className="text-xs font-pop-accent font-black text-[var(--pop-black)]/80 mt-1 uppercase">Người chơi khác sẽ bị huỷ sẵn sàng.</p>
              </div>

              <div className="flex flex-col gap-4 bg-white border-4 border-[var(--pop-black)] p-4 shadow-[inset_2px_2px_0_rgba(0,0,0,0.1)]">
                
                {/* Edition Select */}
                <div className="flex flex-col gap-2">
                  <span className="font-pop-accent font-black text-sm uppercase">
                    {language === 'vi' ? 'Chế độ chơi' : 'Edition'}
                  </span>
                  <select
                    value={lobbyEdition}
                    onChange={(e) => {
                      setLobbyEdition(e.target.value);
                      const maxL = e.target.value === '2_player' ? 2 : (e.target.value === 'imploding' ? 6 : 5);
                      if (lobbyMaxPlayers > maxL || e.target.value === '2_player') {
                        setLobbyMaxPlayers(maxL);
                      }
                    }}
                    className="bg-white border-[3px] border-[var(--pop-black)] px-2 py-2 text-sm font-black w-full outline-none focus:bg-[var(--pop-cream)]"
                  >
                    <option value="original">{t('edition_original_name')}</option>
                    <option value="imploding">{t('edition_imploding_name')}</option>
                    <option value="streaking">{t('edition_streaking_name')}</option>
                    <option value="zombie">{t('edition_zombie_name')}</option>
                    <option value="barking">{t('edition_barking_name')}</option>
                    <option value="good_vs_evil">{t('edition_good_vs_evil_name')}</option>
                    <option value="2_player">{t('edition_2_player_name')}</option>
                  </select>
                </div>

                {/* Max Players */}
                <div className="flex flex-col gap-2">
                  <span className="font-pop-accent font-black text-sm uppercase">
                    {language === 'vi' ? 'Số người chơi tối đa' : 'Max Players'}
                  </span>
                  <input
                    type="range"
                    min="2"
                    max={lobbyEdition === '2_player' ? 2 : (lobbyEdition === 'imploding' ? 6 : 5)}
                    value={lobbyMaxPlayers}
                    onChange={(e) => setLobbyMaxPlayers(Number(e.target.value))}
                    className="brutal-slider"
                  />
                  <div className="text-center font-pop-display font-black text-xl text-[var(--pop-amber)]" style={{ textShadow: '1px 1px 0 var(--pop-black)' }}>{lobbyMaxPlayers} NGƯỜI</div>
                </div>

                {/* Custom Difficulties */}
                <div className="flex gap-4">
                  <div className="flex flex-col gap-2 w-1/2">
                    <span className="font-pop-accent font-black text-[10px] uppercase leading-tight">
                      {language === 'vi' ? 'Số Defuse (Tùy chọn)' : 'Custom Defuses'}
                    </span>
                    <input
                      type="number"
                      min={0}
                      max={8}
                      placeholder="Mặc định"
                      value={lobbyCustomDefuses}
                      onChange={(e) => setLobbyCustomDefuses(e.target.value)}
                      className="bg-white border-[3px] border-[var(--pop-black)] px-2 py-2 text-sm font-black w-full text-center outline-none focus:bg-[var(--pop-cream)]"
                    />
                  </div>
                  <div className="flex flex-col gap-2 w-1/2">
                    <span className="font-pop-accent font-black text-[10px] uppercase leading-tight">
                      {language === 'vi' ? 'Số Bomb (Tùy chọn)' : 'Custom Bombs'}
                    </span>
                    <input
                      type="number"
                      min={0}
                      max={8}
                      placeholder="Mặc định"
                      value={lobbyCustomExplodingKittens}
                      onChange={(e) => setLobbyCustomExplodingKittens(e.target.value)}
                      className="bg-white border-[3px] border-[var(--pop-black)] px-2 py-2 text-sm font-black w-full text-center outline-none focus:bg-[var(--pop-cream)]"
                    />
                  </div>
                </div>

              </div>

              <button
                onClick={() => {
                  const defuses = lobbyCustomDefuses === '' ? undefined : parseInt(lobbyCustomDefuses, 10);
                  const kittens = lobbyCustomExplodingKittens === '' ? undefined : parseInt(lobbyCustomExplodingKittens, 10);
                  updateRoomSettings({
                    edition: lobbyEdition,
                    maxPlayers: lobbyMaxPlayers,
                    customDefuses: defuses,
                    customExplodingKittens: kittens,
                  });
                  setIsEditRoomModalOpen(false);
                }}
                className="w-full bg-[var(--pop-amber)] text-white border-[4px] border-[var(--pop-black)] py-3 font-pop-display font-black uppercase text-xl shadow-[0_6px_0_var(--pop-black)] hover:brightness-110 active:shadow-[0_0px_0_var(--pop-black)] active:translate-y-[6px] transition-all"
                style={{ textShadow: '2px 2px 0 var(--pop-black)' }}
              >
                LƯU CÀI ĐẶT
              </button>
            </div>
          </div>
        )}

      </div>
    );
  }

  // ==========================================
  // VIEW 3: ACTIVE GAME BOARD
  // ==========================================
  if (!gameState) return null;

  const myPlayerState = gameState.players.find((p) => p.userId === myUser.id);
  const opponents = gameState.players.filter((p) => p.userId !== myUser.id);
  const activePlayerId = gameState.players[gameState.currentPlayerIndex]?.userId;
  const isMyTurn = activePlayerId === myUser.id;

  const displayedDiscardPile = (gameState.discardPile && numPlayAnims > 0)
    ? gameState.discardPile.slice(0, Math.max(0, gameState.discardPile.length - numPlayAnims))
    : (gameState.discardPile || []);
  const getPlayerDisplayName = (playerId) => {
    if (playerId === myUser.id) return myUser.username || 'Bạn';
    const player =
      gameState.players.find((p) => p.userId === playerId) ||
      roomState?.players?.find((p) => p.userId === playerId);
    return player?.username || playerId;
  };

  const isOpponentTargetable = (oppId) => {
    if (!isMyTurn) return false;
    const opp = opponents.find((o) => o.userId === oppId);
    if (!opp) return false;
    if (gameState?.edition === 'zombie' && !opp.alive) {
      return true;
    }
    return opp.alive;
  };

  const hasNopeCard = privateHand.some((c) => c.type === 'nope');

  const handleSendChat = (e) => {
    e.preventDefault();
    if (chatInput.trim()) {
      sendChatMessage(chatInput.trim());
      setChatInput('');
    }
  };

  return (
    <div ref={mainContainerRef} className="relative flex flex-col gap-5 w-full select-none">
      {/* Top Header Bar matching Pop Art */}
      <div className="flex justify-between items-center bg-[var(--pop-cream)] border-4 border-[var(--pop-black)] rounded-none px-6 py-3 shadow-[6px_6px_0_var(--pop-black)] z-20">
        {/* Left: Title & Room ID */}
        <div className="flex items-center gap-3 md:gap-4 flex-wrap">
          <h1 className="font-pop-display text-2xl md:text-3xl italic font-black uppercase tracking-tight text-[var(--pop-red)]"
              style={{ WebkitTextStroke: '2px var(--pop-black)', textShadow: '3px 3px 0px var(--pop-black)' }}>
            ARENA BATTLE
          </h1>
          <div className="h-6 w-1 bg-[var(--pop-black)]/20 rounded-none hidden sm:block" />
          <span className="font-pop-accent font-black text-lg text-[var(--pop-black)]/40 uppercase tracking-widest hidden sm:block">
            _{roomState.code.slice(0, 3)}
          </span>
          <span className="text-[9px] font-pop-accent font-black bg-[var(--pop-cream)] border-2 border-[var(--pop-black)] text-[var(--pop-black)] px-2 py-0.5 rounded-none shadow-[1.5px_1.5px_0_var(--pop-black)] uppercase tracking-wide">
            {t('edition_' + roomState.edition + '_name') || roomState.edition}
          </span>
        </div>

        {/* Right: Header Buttons & Toggle */}
        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-2 bg-[var(--pop-amber)] text-[var(--pop-black)] font-pop-display font-black text-xs px-3.5 py-1.5 rounded-none border-2 border-[var(--pop-black)] shadow-[2px_2px_0_var(--pop-black)]">
            <span>ROOM: {roomState.code}</span>
          </div>
          
          <button
            onClick={() => {
              setIsSidebarOpen(prev => !prev);
              if (!isSidebarOpen) {
                setRightPanelTab('chat');
              }
            }}
            className={`relative font-pop-accent font-black border-2 border-[var(--pop-black)] shadow-[2px_2px_0_var(--pop-black)] px-3.5 py-1.5 rounded-none text-xs active:translate-y-0.5 active:shadow-none transition-all uppercase ${
              hasUnreadMessages && !isSidebarOpen
                ? 'bg-[var(--pop-red)] text-white shadow-[2px_2px_0_var(--pop-black)]' 
                : 'bg-white text-[var(--pop-black)] hover:bg-[var(--pop-cream)]'
            }`}
          >
            {isSidebarOpen ? "Ẩn Chat" : "Hiện Chat"}
            {hasUnreadMessages && !isSidebarOpen && (
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-none bg-[var(--pop-amber)] opacity-75 border-2 border-[var(--pop-black)]"></span>
                <span className="relative inline-flex rounded-none h-3 w-3 bg-[var(--pop-amber)] border-2 border-[var(--pop-black)]"></span>
              </span>
            )}
          </button>

          <button className="p-1.5 rounded-none border-2 border-[var(--pop-black)] bg-white shadow-[2px_2px_0_var(--pop-black)] hover:translate-y-[-1px] hover:shadow-[3px_3px_0_var(--pop-black)] active:translate-y-0.5 active:shadow-none transition-all text-[var(--pop-black)]" title="Cài đặt">
            <GearIcon className="w-5 h-5" />
          </button>
          <button className="p-1.5 rounded-none border-2 border-[var(--pop-black)] bg-white shadow-[2px_2px_0_var(--pop-black)] hover:translate-y-[-1px] hover:shadow-[3px_3px_0_var(--pop-black)] active:translate-y-0.5 active:shadow-none transition-all text-[var(--pop-black)]" title="Hướng dẫn">
            <HelpIcon className="w-5 h-5" />
          </button>
          <button className="p-1.5 rounded-none border-2 border-[var(--pop-black)] bg-white shadow-[2px_2px_0_var(--pop-black)] hover:translate-y-[-1px] hover:shadow-[3px_3px_0_var(--pop-black)] active:translate-y-0.5 active:shadow-none transition-all text-[var(--pop-black)]" title="Âm thanh">
            <SoundIcon className="w-5 h-5" />
          </button>

          <ImageButton
            variant="quit"
            size="md"
            onClick={handleLeaveConfirm}
            className="px-3.5 py-1.5 uppercase"
          >
            Thoát
          </ImageButton>
        </div>
      </div>

      <div className="relative min-h-[75vh] grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Game Board (Left 3 or 4 columns depending on sidebar toggle) */}
        <div id="game-board-container" className={`${isSidebarOpen ? 'md:col-span-3' : 'md:col-span-4'} flex flex-col justify-between gap-0 border-4 border-[var(--pop-black)] rounded-none shadow-[8px_8px_0_var(--pop-black)] overflow-hidden bg-[var(--pop-cream)]`}>
          
          {/* Subheader: Turn indicator status */}
          <div className="flex justify-between items-center bg-white border-b-3 border-[var(--pop-black)] px-6 py-2.5 z-10">
            <div className="flex items-center gap-1.5">
              <span className="text-[9px] font-pop-accent font-black text-[var(--pop-black)]/70 uppercase tracking-widest">Trận đấu đang chơi</span>
              <span className="h-2 w-2 rounded-none bg-[var(--pop-amber)] animate-pulse border-2 border-[var(--pop-black)]" />
            </div>
            {isMyTurn ? (
              <span className="bg-[var(--pop-amber)] text-[var(--pop-black)] font-pop-accent font-black text-[10px] px-3.5 py-1.5 rounded-none border-2 border-[var(--pop-black)] shadow-[1.5px_1.5px_0_var(--pop-black)] animate-pulse">
                LƯỢT CỦA BẠN: CẦN BỐC {gameState.drawsRequired} LÁ!
              </span>
            ) : (
              gameState.drawsRequired > 1 && (
                <span className="bg-[var(--pop-red)] text-white font-pop-accent font-black text-[10px] px-3.5 py-1.5 rounded-none border-2 border-[var(--pop-black)] shadow-[1.5px_1.5px_0_var(--pop-black)] animate-bounce">
                  LƯỢT DỒN BỐC: {gameState.drawsRequired} LẦN!
                </span>
              )
            )}
          </div>

          {/* Game Canvas Container */}
          <div className="flex-grow flex flex-col justify-between dotted-grid-bg p-6 relative select-none min-h-[460px]">
            
            {/* Opponents Row at the top (Horizontal layout) */}
            <div className="flex justify-center items-center gap-5 md:gap-10 w-[calc(100%+3rem)] -mx-6 -mt-6 py-3.5 z-10 border-b-3 border-[var(--pop-black)] bg-white/90 shadow-[0_4px_0_var(--pop-black)] mb-4">
              {getOrderedOpponents().map((opp) => (
                <div key={opp.userId} className="relative transition-transform duration-150 hover:scale-[1.02]">
                  <PlayerAvatar
                    player={opp}
                    isCurrentTurn={activePlayerId === opp.userId}
                    isTargetable={isOpponentTargetable(opp.userId)}
                    isSelectedTarget={targetPlayerId === opp.userId}
                    onSelectTarget={(id) => setTargetPlayerId(prev => prev === id ? null : id)}
                    edition={gameState?.edition}
                    isWaitingBK={gameState?.barkingKittenState?.waitingHolder === opp.userId}
                  />
                </div>
              ))}
            </div>

            {/* Board Center: Deck and Discard Pile */}
            <div className="flex-grow flex items-center justify-center py-6 z-10 w-full relative">
              {/* Rotating play direction arrows background */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0 overflow-visible">
                <div className={`w-[18rem] h-[18rem] border-4 border-dashed border-on-surface/5 rounded-full flex items-center justify-center transition-all duration-500 ${gameState.playDirection === -1 ? 'animate-spin-ccw border-rose-500/10' : 'animate-spin-cw border-emerald-500/10'}`}>
                  {/* Curved arrows/pointers */}
                  <span className={`absolute top-4 text-xl font-black transition-colors ${gameState.playDirection === -1 ? 'text-rose-500/15' : 'text-emerald-500/15'}`}>▶</span>
                  <span className={`absolute right-4 text-xl font-black rotate-90 transition-colors ${gameState.playDirection === -1 ? 'text-rose-500/15' : 'text-emerald-500/15'}`}>▶</span>
                  <span className={`absolute bottom-4 text-xl font-black rotate-180 transition-colors ${gameState.playDirection === -1 ? 'text-rose-500/15' : 'text-emerald-500/15'}`}>▶</span>
                  <span className={`absolute left-4 text-xl font-black -rotate-90 transition-colors ${gameState.playDirection === -1 ? 'text-rose-500/15' : 'text-emerald-500/15'}`}>▶</span>
                </div>
              </div>

              <div className="grid grid-cols-[auto_minmax(160px,220px)_auto] items-center justify-center gap-6 md:gap-8 z-10 relative">
                <div id="board-center-target" className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-0 h-0 pointer-events-none" />
                <DeckPile
                  count={gameState.deckCount ?? 0}
                  topCard={gameState.topCard}
                  onDraw={drawCard}
                  isMyTurn={isMyTurn}
                  disabled={!!gameState.pendingFavor || !!gameState.pendingAlter || (nopeWindow && nopeWindow.active) || privateHand.length > (gameState.maxHandSize ?? 10)}
                  compact
                />

                {/* Announcer and Status Message Board */}
                <div className="flex flex-col items-center gap-3 max-w-[240px] text-center z-10">
                  <div className="bg-white border-3 border-on-surface rounded-2xl px-4 py-3.5 shadow-[4px_4px_0px_0px_#1a1c1c] min-w-[200px]">
                    <span className="text-[9px] font-headline font-black text-primary uppercase tracking-widest block mb-1">
                      Hành Động
                    </span>
                    <p className="text-xs font-sans font-bold text-on-surface leading-relaxed min-h-[44px] flex items-center justify-center">
                      {getStatusDisplay()}
                    </p>
                  </div>
                  
                  {targetPlayerId && (
                    <div className="bg-yellow-400 border-2 border-on-surface text-slate-950 text-[9px] font-headline font-black uppercase tracking-wider px-3.5 py-0.5 rounded-full flex items-center gap-1.5 shadow-[1.5px_1.5px_0px_0px_#1a1c1c]">
                      Mục tiêu: {opponents.find((o) => o.userId === targetPlayerId)?.username || targetPlayerId}
                      <button 
                        onClick={() => setTargetPlayerId(null)}
                        className="hover:scale-110 ml-1.5"
                      >
                        ✕
                      </button>
                    </div>
                  )}
                </div>

                <DiscardPile
                  discardPile={displayedDiscardPile}
                  pendingCombo5={gameState.pendingCombo5}
                  myUserId={myUser.id}
                  onSelectCard={respondCombo5}
                  compact
                />
              </div>
            </div>

            {/* Bottom Row: Player avatar & Hand, nested inside the solid deep red Pop Art bar */}
            <div className={`w-[calc(100%+3rem)] -mx-6 -mb-6 bg-[var(--pop-red)] border-t-4 p-5 z-10 flex flex-col md:flex-row gap-5 items-stretch justify-between transition-all duration-300
              ${isMyTurn 
                ? 'border-[var(--pop-amber)] animate-pulse-gold-glow' 
                : 'border-[var(--pop-black)] shadow-[0_-4px_0_var(--pop-black)]'}`}>
              <div className="flex items-center justify-center bg-black/15 p-4 rounded-none border-3 border-dashed border-white/30 flex-shrink-0">
                {myPlayerState && (
                  <div className="flex flex-col items-center gap-4 relative">
                    <PlayerAvatar
                      player={myPlayerState}
                      isCurrentTurn={isMyTurn}
                      isTargetable={false}
                      edition={gameState?.edition}
                      isWaitingBK={gameState?.barkingKittenState?.waitingHolder === myUser?.id}
                    />
                    {isMyTurn && (
                      <span className="bg-[var(--pop-amber)] text-[var(--pop-black)] font-pop-accent font-black text-[9px] uppercase px-2 py-0.5 rounded-none border-2 border-[var(--pop-black)] shadow-[1.5px_1.5px_0_var(--pop-black)] text-center w-full z-10 relative">
                        Bốc: {gameState.drawsRequired} lá
                      </span>
                    )}
                  </div>
                )}
              </div>
              
              <div className="flex-1 overflow-x-auto hide-scroll flex items-center">
                <PlayerHand
                  hand={privateHand}
                  onPlayCard={playCard}
                  onPlayCombo={playCombo}
                  isMyTurn={isMyTurn}
                  targetPlayerId={targetPlayerId}
                  nopeWindowActive={nopeWindow && nopeWindow.active}
                  onDiscard={discardCard}
                  maxHandSize={gameState.maxHandSize ?? 10}
                  players={gameState?.players || []}
                  myUserId={myUser.id}
                />
              </div>

              {/* Utility sidebar icons in Bottom Bar */}
              <div className="flex md:flex-col justify-center gap-2 flex-shrink-0 self-center">
                <button className="p-2.5 rounded-none border-2 border-[var(--pop-black)] bg-white shadow-[2px_2px_0_var(--pop-black)] hover:translate-y-[-1px] hover:shadow-[3px_3px_0_var(--pop-black)] active:translate-y-0.5 active:shadow-none transition-all text-[var(--pop-black)]" title="Biểu cảm nhanh">
                  <SmileIcon className="w-5 h-5" />
                </button>
                <button className="p-2.5 rounded-none border-2 border-[var(--pop-black)] bg-white shadow-[2px_2px_0_var(--pop-black)] hover:translate-y-[-1px] hover:shadow-[3px_3px_0_var(--pop-black)] active:translate-y-0.5 active:shadow-none transition-all text-[var(--pop-black)]" title="Xem khay bài">
                  <CardDrawerIcon className="w-5 h-5" />
                </button>
              </div>
            </div>

          </div>
        </div>

        {/* Chat & Lịch Sử Panel (Right 1 column) */}
        <div className={`md:col-span-1 bg-white border-4 border-[var(--pop-black)] shadow-[8px_8px_0_var(--pop-black)] rounded-none p-5 flex flex-col justify-between h-[82vh] ${isSidebarOpen ? 'flex' : 'hidden'}`}>
        <div className="flex flex-col gap-4 flex-1 overflow-hidden">
          
          {/* Header Tab Switcher */}
          <div className="flex border-b-4 border-[var(--pop-black)] pb-2.5 gap-2">
            <button
              onClick={() => setRightPanelTab('chat')}
              className={`flex-1 py-1.5 rounded-none border-3 border-[var(--pop-black)] font-pop-accent font-black text-xs uppercase shadow-[2px_2px_0_var(--pop-black)] transition-all
                ${rightPanelTab === 'chat' 
                  ? 'bg-[var(--pop-red)] text-white -translate-y-0.5 shadow-[4px_4px_0_var(--pop-black)]' 
                  : 'bg-white hover:bg-[var(--pop-cream)] text-[var(--pop-black)]'}`}
            >
              Chat
            </button>
            <button
              onClick={() => setRightPanelTab('log')}
              className={`flex-1 py-1.5 rounded-none border-3 border-[var(--pop-black)] font-pop-accent font-black text-xs uppercase shadow-[2px_2px_0_var(--pop-black)] transition-all
                ${rightPanelTab === 'log' 
                  ? 'bg-[var(--pop-red)] text-white -translate-y-0.5 shadow-[4px_4px_0_var(--pop-black)]' 
                  : 'bg-white hover:bg-[var(--pop-cream)] text-[var(--pop-black)]'}`}
            >
              Lịch sử
            </button>
          </div>

          {rightPanelTab === 'chat' && (
            <div className="flex-1 flex flex-col gap-4 overflow-hidden">
              {/* Emotes quick buttons */}
              <div className="flex flex-col gap-2">
                <span className="text-[10px] font-pop-accent font-black text-[var(--pop-black)]/70 uppercase tracking-wider">Phát biểu cảm nhanh</span>
                <div className="grid grid-cols-4 gap-2">
                  {EMOTES_LIST.map((emote) => (
                    <button
                      key={emote.id}
                      onClick={() => sendEmote(emote.id)}
                      className="h-10 text-2xl bg-white border-2 border-[var(--pop-black)] hover:bg-[var(--pop-cream)] rounded-none transition-all active:translate-y-0.5 active:shadow-none flex items-center justify-center shadow-[2px_2px_0_var(--pop-black)]"
                    >
                      {emote.char}
                    </button>
                  ))}
                </div>
              </div>

              {/* Chat Messages history */}
              <div className="flex-1 flex flex-col gap-2.5 overflow-y-auto border-t-3 border-dashed border-[var(--pop-black)]/30 pt-3 pr-1 hide-scroll">
                {chatMessages.length === 0 ? (
                  <div className="text-center text-[var(--pop-black)]/70 text-xs py-8 font-pop-body font-bold italic">
                    Chưa có cuộc hội thoại nào. Chat để trêu đùa đối thủ!
                  </div>
                ) : (
                  chatMessages.map((msg, index) => {
                    const isMe = msg.userId === myUser?.id;
                    return (
                      <div
                        key={index}
                        className={`flex flex-col max-w-[85%] rounded-none px-3.5 py-2 text-xs border-3 border-[var(--pop-black)]
                          ${isMe 
                            ? 'self-end bg-[var(--pop-red)] text-white shadow-[-3px_3px_0_var(--pop-black)]' 
                            : 'self-start bg-[var(--pop-cream)] text-[var(--pop-black)] shadow-[3px_3px_0_var(--pop-black)]'}`}
                      >
                        <span className="font-pop-accent font-black text-[9px] mb-0.5 uppercase opacity-90">
                          {isMe ? 'BẠN' : msg.username}
                        </span>
                        <p className="leading-relaxed font-pop-body font-bold">{msg.text}</p>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {rightPanelTab === 'log' && (
            <div className="flex-1 flex flex-col gap-3 overflow-hidden">
              <span className="text-[10px] font-pop-accent font-black text-[var(--pop-black)]/70 uppercase tracking-wider">Nhật ký diễn biến</span>
              <div className="flex-1 flex flex-col gap-2 overflow-y-auto pr-1 hide-scroll bg-white border-3 border-[var(--pop-black)] rounded-none p-3 shadow-[3px_3px_0_var(--pop-black)]">
                {actionLog.length === 0 ? (
                  <div className="text-center text-[var(--pop-black)]/70 text-xs py-8 font-pop-body font-bold italic">
                    Chưa có diễn biến nào được ghi nhận.
                  </div>
                ) : (
                  actionLog.map((log) => (
                    <div
                      key={log.id}
                      className="flex justify-between items-start gap-2 border-b-2 border-[var(--pop-black)]/10 pb-1.5 text-xs font-bold font-pop-body text-[var(--pop-black)] last:border-b-0"
                    >
                      <span className="leading-relaxed flex-1">{log.text}</span>
                      <span className="text-[9px] text-[var(--pop-black)]/80 font-mono whitespace-nowrap bg-[var(--pop-cream)] border-2 border-[var(--pop-black)] px-1.5 py-0.5 rounded-none">{log.timestamp}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Input Chat bar */}
        <form onSubmit={handleSendChat} className="flex gap-2 border-t-3 border-[var(--pop-black)] pt-3 mt-2">
          <input
            type="text"
            placeholder={rightPanelTab === 'chat' ? "Gửi tin nhắn hăm dọa..." : "Chuyển sang tab Chat để trò chuyện"}
            disabled={rightPanelTab !== 'chat'}
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            className="flex-1 bg-white border-3 border-[var(--pop-black)] rounded-none px-3 py-2 text-xs text-[var(--pop-black)] font-pop-body font-bold focus:outline-none focus:bg-[var(--pop-cream)] transition-all shadow-[3px_3px_0_var(--pop-black)] focus:shadow-[4px_4px_0_var(--pop-black)] focus:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
          />
          <button
            type="submit"
            disabled={rightPanelTab !== 'chat'}
            className="px-4 py-2 bg-[var(--pop-red)] text-white font-pop-display font-black rounded-none text-xs border-3 border-[var(--pop-black)] shadow-[3px_3px_0_var(--pop-black)] active:translate-y-0.5 active:shadow-none hover:-translate-y-0.5 hover:shadow-[4px_4px_0_var(--pop-black)] disabled:opacity-50 disabled:cursor-not-allowed uppercase"
          >
            Gửi
          </button>
        </form>
      </div>
    </div>

      {/* ==========================================
          ACTION OVERLAY MODALS
      ========================================== */}

      {/* 1. See The Future Overlay */}
      {seeTheFutureCards && (
        <SeeFutureModal
          cards={seeTheFutureCards}
          onClose={() => setSeeTheFutureCards(null)}
        />
      )}

      {/* 2. Alter The Future Overlay */}
      {alterFutureRequest && alterFutureRequest.active && (
        <AlterFutureModal
          cards={alterFutureRequest.cards}
          onConfirm={respondAlterFuture}
        />
      )}

      {/* 3. Favor Request Overlay */}
      {favorRequest && favorRequest.active && (
        <FavorRequestModal
          fromPlayerId={favorRequest.fromPlayerId}
          fromPlayerName={gameState?.players?.find((p) => p.userId === favorRequest.fromPlayerId)?.username}
          hand={privateHand}
          onRespond={respondFavor}
        />
      )}

      {nopeWindow && nopeWindow.active && (!nopeWindow.isNowOnly || activePlayerId !== myUser.id || nopeWindow.actingPlayerId !== myUser.id) && (
        <NopeCountdown
          eventId={nopeWindow.eventId}
          timeoutMs={nopeWindow.timeoutMs}
          hasNopeCard={hasNopeCard}
          onPlayNope={() => playNope(nopeWindow.eventId)}
          onPass={() => passNope(nopeWindow.eventId)}
          actingPlayerName={getPlayerDisplayName(nopeWindow.actingPlayerId)}
          cardType={nopeWindow.cardType}
          targetPlayerName={nopeWindow.targetPlayerId ? getPlayerDisplayName(nopeWindow.targetPlayerId) : null}
          nopeCount={nopeWindow.nopeCount ?? 0}
          isNowOnly={nopeWindow.isNowOnly}
          hand={privateHand}
          onPlayNow={(card) => playCard(card.id)}
        />
      )}

      {/* 5. Bury Request Modal */}
      {buryRequest && buryRequest.active && (
        <BuryPositionModal
          hand={privateHand}
          deckCount={gameState?.deckCount || 0}
          onRespond={respondBury}
        />
      )}

      {/* 6. Garbage Collection Request Modal */}
      {garbageRequest && garbageRequest.active && (
        <GarbageSelectModal
          hand={privateHand}
          title="Thu Gom Rác (Garbage Collection)"
          description="Hãy chọn 1 lá bài từ tay của bạn để bỏ ngược lại vào bộ bài bốc."
          onRespond={respondGarbage}
        />
      )}

      {/* 7. Pot Luck Request Modal */}
      {potLuckRequest && potLuckRequest.active && (
        <GarbageSelectModal
          hand={privateHand}
          title="Góp Nồi (Pot Luck)"
          description="Hãy chọn 1 lá bài từ tay của bạn để đặt lên đầu bộ bài bốc."
          onRespond={respondPotLuck}
        />
      )}

      {/* 8. Zombie Kitten Revival Modal */}
      {zombieRequest && zombieRequest.active && (
        <ZombieReviveModal
          players={gameState?.players || []}
          deckCount={gameState?.deckCount || 0}
          onRespond={respondZombie}
        />
      )}

      {/* 8.5. Defuse Position Modal */}
      {defuseRequest && defuseRequest.active && (
        <DefusePositionModal
          deckCount={gameState?.deckCount || 0}
          cardType={defuseRequest.cardType}
          onRespond={respondDefuse}
        />
      )}

      {/* 8.6. Select Target Modal (after playing card) */}
      {selectTargetRequest && selectTargetRequest.active && (
        <SelectTargetModal
          players={gameState?.players || []}
          myUserId={myUser.id}
          cardType={selectTargetRequest.cardType}
          onRespond={respondSelectTarget}
        />
      )}

      {/* 8.7. Feed the Dead Modal */}
      {feedTheDeadRequest && feedTheDeadRequest.active && (
        <FeedTheDeadModal
          targetPlayerName={gameState?.players.find(p => p.userId === feedTheDeadRequest.targetPlayerId)?.username || feedTheDeadRequest.targetPlayerId}
          hand={privateHand}
          onRespond={respondFeedTheDead}
        />
      )}

      {/* 8.8. Grave Robber Modal */}
      {graveRobberRequest && graveRobberRequest.active && (
        <GraveRobberModal
          hand={privateHand}
          onRespond={respondGraveRobber}
        />
      )}

      {/* 8.9. Dig Deeper Modal */}
      {digDeeperRequest && digDeeperRequest.active && (
        <DigDeeperModal
          firstCard={digDeeperRequest.firstCard}
          onRespond={respondDigDeeper}
        />
      )}

      {/* 8.10. Armageddon Distribute Modal */}
      {armageddonRequest && armageddonRequest.active && armageddonRequest.stage === 'distribute' && (
        <ArmageddonDistributeModal
          targetPlayerName={gameState?.players.find(p => p.userId === gameState?.pendingArmageddon?.targetPlayerId)?.username || gameState?.pendingArmageddon?.targetPlayerId}
          onRespond={respondArmageddonDistribute}
        />
      )}

      {/* 8.11. Armageddon Decision Modal */}
      {armageddonRequest && armageddonRequest.active && armageddonRequest.stage === 'decision' && (
        <ArmageddonDecisionModal
          activatorPlayerName={gameState?.players.find(p => p.userId === gameState?.pendingArmageddon?.playerId)?.username || gameState?.pendingArmageddon?.playerId}
          onRespond={respondArmageddonDecision}
        />
      )}

      {/* 8.12. Clairvoyance Reveal Modal */}
      {localClairvoyance && (
        <ClairvoyanceRevealModal
          position={localClairvoyance.position}
          onClose={() => setLocalClairvoyance(null)}
        />
      )}

      {/* Nope Result Toast */}
      {nopeResult && (
        <NopeResultToast
          key={nopeResult.timestamp}
          canceled={nopeResult.canceled}
          cardType={nopeResult.cardType}
          actingPlayerName={getPlayerDisplayName(nopeResult.actingPlayerId)}
        />
      )}

      {/* Now Card Toast */}
      {nowCardToast && (
        <NowCardToast
          key={nowCardToast.timestamp}
          playerName={nowCardToast.playerName}
          cardType={nowCardToast.cardType}
        />
      )}

      {/* 8.13. Draw Card Reveal Modal */}
      {revealCard && (
        <DrawReveal
          type={revealCard.type}
          skinIndex={revealCard.skinIndex}
          onClose={() => setRevealCard(null)}
        />
      )}

      {/* 9. Game Ended Win Overlay */}
      {gameEnded && (() => {
        const isWin = gameEnded.winnerId === myUser?.id;
        const finalRank = gameEnded.rankings.findIndex(r => r.userId === myUser?.id) + 1;
        const kittensDefused = gameState?.discardPile?.filter(c => c.type === 'defuse' || c.type === 'zombie_kitten').length || 0;
        const playersExploded = gameState?.players?.filter(p => !p.alive).length || 0;
        
        const eloChange = gameEnded.eloChanges?.[myUser?.id] || 0;
        const pinkCoinEarned = gameEnded.pinkCoinChanges?.[myUser?.id] || 0;
        const currentElo = myPlayerState?.eloPoints || 1000;
        const prevElo = currentElo - eloChange;

        const streakBonus = isWin && myPlayerState?.stats?.currentStreak >= 3 ? 30 : 0;
        const coinsEarned = isWin ? (50 + streakBonus) : 10;

        const winnerPlayer = gameState?.players?.find(p => p.userId === gameEnded.winnerId);
        const winnerName = winnerPlayer?.username || getPlayerDisplayName(gameEnded.winnerId) || 'Chiến Mèo';
        const winnerAvatar = winnerPlayer?.avatar || '';

        return (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-[#faf9f6] flex flex-col items-center justify-between p-6 md:p-8 animate-fade-in select-none ended-overlay-anim">
            {/* Confetti Container */}
            <div id="confetti-container" className="fixed inset-0 pointer-events-none z-[999] overflow-hidden" />

            <div className="w-full max-w-4xl mx-auto flex flex-col items-center flex-grow justify-center py-4 gap-6">
              
              {/* Victory / Defeat slanted title */}
              {isWin ? (
                <h1 className="arena-title-brutal text-6xl md:text-8xl font-black uppercase text-center mt-2 rotate-[-2.5deg] tracking-tight">
                  VICTORY!
                </h1>
              ) : (
                <h1 
                  className="arena-title-brutal text-6xl md:text-8xl font-black uppercase text-center mt-2 rotate-[-2.5deg] tracking-tight"
                  style={{ color: '#8b5cf6', textShadow: '4px 4px 0px #1a1c1c' }}
                >
                  DEFEAT!
                </h1>
              )}

              {/* MVP Section with circle background */}
              <div className="relative mt-4 mb-4 flex justify-center items-center w-64 h-64">
                {/* Circle */}
                <div className={`absolute inset-0 m-auto w-56 h-56 rounded-full border-4 border-slate-950 shadow-[4px_4px_0px_0px_#1a1c1c] z-0 transition-transform hover:scale-105 duration-200
                  ${isWin ? 'bg-orange-500' : 'bg-purple-500'}`} 
                />

                {/* MVP Card */}
                <div className="relative w-44 h-44 bg-white border-4 border-slate-950 rounded-2xl shadow-[8px_8px_0px_0px_#1a1c1c] rotate-[-2.5deg] z-10 overflow-hidden flex flex-col items-center justify-center hover:rotate-[1deg] transition-all">
                  {/* MVP Slanted Badge */}
                  <div className="absolute top-0 right-0 bg-red-600 text-white font-headline font-black border-l-4 border-b-4 border-slate-950 px-3 py-1.5 rotate-[8deg] text-[9px] uppercase tracking-wider z-20 shadow">
                    MVP
                  </div>

                  {/* Winner Avatar */}
                  <div className="h-24 w-24 rounded-full flex items-center justify-center text-5xl font-headline font-black bg-amber-50 border-2 border-on-surface overflow-hidden shadow-inner">
                    {winnerAvatar && PRESET_AVATARS[winnerAvatar] ? (
                      <span>{PRESET_AVATARS[winnerAvatar]}</span>
                    ) : winnerAvatar ? (
                      <img src={winnerAvatar} alt={winnerName} className="h-full w-full object-cover" />
                    ) : (
                      <span>{winnerName.slice(0, 2).toUpperCase()}</span>
                    )}
                  </div>

                  <span className="font-headline font-black text-xs uppercase text-on-surface tracking-tight mt-2.5 truncate max-w-[150px] px-2 text-center block">
                    {winnerName}
                  </span>
                </div>
              </div>

              {/* Match Summary & Loot Earned columns */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-3xl items-stretch">
                
                {/* Left Card: Match Summary */}
                <div className="bg-white border-4 border-slate-950 shadow-[6px_6px_0px_0px_#1a1c1c] rounded-3xl p-6 flex flex-col justify-between">
                  <div>
                    <h3 className="font-headline font-black text-base md:text-lg text-slate-950 uppercase mb-4 flex items-center gap-1.5 pb-2 border-b-3 border-on-surface">
                      MATCH SUMMARY
                    </h3>
                    <div className="flex flex-col gap-3 font-headline text-xs md:text-sm">
                      <div className="flex justify-between items-center py-1">
                        <span className="text-on-surface-variant font-bold">KITTENS DEFUSED</span>
                        <span className="text-rose-600 font-black text-sm">{kittensDefused}</span>
                      </div>
                      <div className="h-px bg-slate-950/10 border-dashed border-t" />
                      <div className="flex justify-between items-center py-1">
                        <span className="text-on-surface-variant font-bold">PLAYERS EXPLODED</span>
                        <span className="text-rose-600 font-black text-sm">{playersExploded}</span>
                      </div>
                      <div className="h-px bg-slate-950/10 border-dashed border-t" />
                      <div className="flex justify-between items-center py-1">
                        <span className="text-on-surface-variant font-bold">FINAL RANK</span>
                        <span className="text-slate-950 font-black text-sm">#{finalRank}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Card: Loot Earned */}
                <div className="bg-white border-4 border-slate-950 shadow-[6px_6px_0px_0px_#1a1c1c] rounded-3xl p-6 flex flex-col justify-between gap-4">
                  <div>
                    <h3 className="font-headline font-black text-base md:text-lg text-slate-950 uppercase mb-4 flex items-center gap-1.5 pb-2 border-b-3 border-on-surface">
                      LOOT EARNED
                    </h3>
                    <div className={`grid gap-4 w-full ${pinkCoinEarned > 0 ? 'grid-cols-3' : 'grid-cols-2'}`}>
                      {/* Coins Card */}
                      <div className="bg-[#fee2e2] border-3 border-slate-950 shadow-[3px_3px_0px_0px_#1a1c1c] p-3 rounded-2xl flex flex-col items-center justify-center text-center">
                        <CoinIcon className="w-7 h-7 mb-1" />
                        <span className="font-headline font-black text-[11px] text-red-700 uppercase">+{coinsEarned}</span>
                        <span className="text-[9px] font-bold text-on-surface-variant uppercase mt-0.5">Gold Coin</span>
                      </div>

                      {/* ELO Card */}
                      <div className="bg-cyan-50 border-3 border-slate-950 shadow-[3px_3px_0px_0px_#1a1c1c] p-3 rounded-2xl flex flex-col items-center justify-center text-center">
                        <span className={`font-headline font-black text-[11px] uppercase mt-2 ${eloChange >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                          {eloChange >= 0 ? `+${eloChange}` : eloChange}
                        </span>
                        <span className="text-[9px] font-bold text-on-surface-variant uppercase mt-0.5">Elo Change</span>
                      </div>

                      {/* Pink Coin Card */}
                      {pinkCoinEarned > 0 && (
                        <div className="bg-pink-50 border-3 border-slate-950 shadow-[3px_3px_0px_0px_#1a1c1c] p-3 rounded-2xl flex flex-col items-center justify-center text-center animate-bounce">
                          <GemIcon className="w-7 h-7 mb-1" />
                          <span className="font-headline font-black text-[11px] text-pink-600 uppercase">+{pinkCoinEarned}</span>
                          <span className="text-[9px] font-bold text-on-surface-variant uppercase mt-0.5">Pink Coin</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Level up / Elo rating banner */}
                  <div className="flex flex-col gap-2">
                    <div className="bg-slate-950 text-white font-headline font-black text-[10px] md:text-xs text-center py-2.5 px-4 rounded-xl shadow-[2px_2px_0px_0px_rgba(26,28,28,0.2)] tracking-wider uppercase select-none flex items-center justify-center gap-1">
                      <span>ELO PROGRESSION:</span>
                      <span className="text-yellow-400 font-bold">{prevElo}</span>
                      <span>➔</span>
                      <span className="text-emerald-400 font-bold">{currentElo}</span>
                    </div>
                    {pinkCoinEarned > 0 && (
                      <div className="bg-pink-500 text-white font-headline font-black text-[9px] md:text-[10px] text-center py-1.5 px-3 rounded-lg border-2 border-slate-950 shadow-[1.5px_1.5px_0px_0px_#1a1c1c] uppercase tracking-wider animate-pulse flex items-center justify-center gap-1">
                        RANK UP REWARD: +{pinkCoinEarned} PINK COINS!
                      </div>
                    )}
                  </div>
                </div>

              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md mt-4">
                <button
                  onClick={playAgain}
                  className="flex-1 bg-orange-500 text-white font-headline font-black text-sm uppercase py-3.5 rounded-2xl border-3 border-slate-950 shadow-[4px_4px_0px_0px_#1a1c1c] active:translate-x-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0px_0px_#1a1c1c] hover:-translate-y-0.5 transition-all duration-100 flex items-center justify-center gap-2"
                >
                  PLAY AGAIN
                </button>
                <button
                  onClick={() => {
                    setGameEnded(null);
                    leaveRoom();
                  }}
                  className="flex-1 bg-white text-slate-950 font-headline font-black text-sm uppercase py-3.5 rounded-2xl border-3 border-slate-950 shadow-[4px_4px_0px_0px_#1a1c1c] active:translate-x-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0px_0px_#1a1c1c] hover:-translate-y-0.5 transition-all duration-100 flex items-center justify-center gap-2"
                >
                  RETURN TO LOBBY
                </button>
              </div>

            </div>
          </div>
        );
      })()}
      <canvas ref={canvasRef} id="effects-canvas" className="fixed inset-0 pointer-events-none z-[150]" />

      {nopeStamp && nopeStamp.active && (
        <div className="fixed inset-0 flex items-center justify-center pointer-events-none z-[120]">
          <div className="nope-stamp animate-nope-stamp">
            NOPE
          </div>
        </div>
      )}

      {isRedFlashActive && (
        <div className="fixed inset-0 pointer-events-none z-[130] border-[16px] animate-border-flash-red rounded-3xl" />
      )}

      {zombieFog && (
        <div className="zombie-fog-overlay" />
      )}

      {isImplodingActive && (
        <div className="fixed inset-0 pointer-events-none z-[135] flex items-center justify-center bg-slate-950/70 backdrop-blur-md animate-fade-in">
          <div className="relative flex flex-col items-center justify-center gap-4">
            <svg
              className="w-56 h-56 text-purple-500 animate-spin-ccw filter drop-shadow-[0_0_20px_rgba(168,85,247,0.5)]"
              viewBox="0 0 100 100"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M50 5C25.1 5 5 25.1 5 50s20.1 45 45 45 45-20.1 45-45S74.9 5 50 5zm0 80c-19.3 0-35-15.7-35-35s15.7-35 35-35 35 15.7 35 35-15.7 35-35 35z"
                fill="currentColor"
                className="opacity-10"
              />
              <path
                d="M50 15C30.7 15 15 30.7 15 50c0 9.7 3.9 18.4 10.2 24.8l7.1-7.1C27.2 62.7 25 56.6 25 50c0-13.8 11.2-25 25-25v-10z"
                fill="currentColor"
              />
              <path
                d="M50 25C36.2 25 25 36.2 25 50c0 6.9 2.8 13.1 7.3 17.7l7.1-7.1C37.3 58.7 35 54.6 35 50c0-8.3 6.7-15 15-15v-10z"
                fill="currentColor"
                className="opacity-70"
              />
            </svg>
            <div className="absolute flex flex-col items-center">
              <span className="text-white font-headline font-black text-5xl italic uppercase tracking-widest text-center select-none [-webkit-text-stroke:2px_#1a1c1c] drop-shadow-[4px_4px_0px_#7c3aed]">
                IMPLODING!
              </span>
              <span className="text-purple-300 font-sans font-bold text-xs uppercase tracking-widest mt-2 animate-pulse">
                Sập nguồn vũ trụ
              </span>
            </div>
          </div>
        </div>
      )}

      {drewKittenAlert && drewKittenAlert.active && (() => {
        const cleanType = drewKittenAlert.cardType.startsWith('discard_') 
          ? drewKittenAlert.cardType.replace('discard_', '') 
          : drewKittenAlert.cardType;
        const cardName = cleanType === 'exploding_kitten' ? 'Mèo Nổ' : cleanType === 'imploding_kitten' ? 'Mèo Sập Nguồn' : cleanType === 'devilcat' ? 'Mèo Quỷ' : cleanType;
        return (
          <div className="fixed top-12 left-1/2 -translate-x-1/2 bg-[#1a1c1c] border-4 border-rose-500 text-white px-8 py-4 rounded-2xl flex items-center gap-4 shadow-[6px_6px_0px_0px_rgba(26,28,28,1)] z-[99999] animate-bounce">
            <div className="p-2 bg-rose-500/10 rounded-xl border-2 border-rose-500">
              <svg className="w-8 h-8 text-rose-500 animate-pulse" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div className="flex flex-col text-left">
              <span className="font-headline font-black text-rose-500 uppercase text-[10px] tracking-wider">CẢNH BÁO NGUY HIỂM</span>
              <span className="font-sans font-bold text-xs text-slate-100 mt-0.5">
                Người chơi <strong className="text-yellow-400 font-black">{drewKittenAlert.playerName}</strong> đã bốc trúng quân <strong className="text-rose-400 font-black">{cardName}</strong>!
              </span>
            </div>
          </div>
        );
      })()}

      {nopeAlert && nopeAlert.active && (
        <div className="fixed inset-0 flex items-center justify-center pointer-events-none z-[99998]">
          <div className="bg-rose-600 text-white text-7xl font-headline font-black uppercase tracking-wider px-12 py-5 rounded-3xl border-6 border-white shadow-[8px_8px_0px_0px_rgba(26,28,28,1)] animate-nope-splash">
            NOPE!
          </div>
        </div>
      )}

      <CustomDialog
        isOpen={dialogState.isOpen}
        title={dialogState.title}
        message={dialogState.message}
        isConfirm={dialogState.isConfirm}
        confirmText={dialogState.confirmText}
        cancelText={dialogState.cancelText}
        onConfirm={dialogState.onConfirm}
        onCancel={() => setDialogState({ isOpen: false })}
      />
    </div>
  );
}
