
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
import LobbyView from './Game/views/LobbyView.jsx';
import WaitingRoomView from './Game/views/WaitingRoomView.jsx';
import GameBoardView from './Game/views/GameBoardView.jsx';
import { GameProvider } from './Game/GameContext.jsx';
import { animationManager } from '../vfx/AnimationManager.js';
import { VFX_PRIORITY } from '../vfx/VFXEventAdapter.js';
import { mapResolvedActionToAnimKey } from '../vfx/config/vfxEventMap.js';

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

export default function Game({ setPage }) {
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
    toggleReady,
    updateRoomSettings,
    kickPlayer,
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

  const [reversePulse, setReversePulse] = React.useState(false);
  const previousTurnPlayerIdRef = React.useRef(null);
  const hasInitializedTurnRef = React.useRef(false);

  const { t, language } = useLanguage();

  const [myUser, setMyUser] = useState(null);

  const [dialogState, setDialogState] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: null,
  });

  const isAuthenticated = !!localStorage.getItem('accessToken') && !!myUser && !myUser.id.startsWith('guest-');

  const showLoginRequired = (actionType) => {
    let msg = t('loginRequired') || 'Bạn cần đăng nhập để thực hiện chức năng này.';
    if (actionType === 'quick_play') {
      msg = t('loginRequiredQuickPlay') || 'Bạn cần đăng nhập để sử dụng Quick Play.';
    } else if (actionType === 'create_room') {
      msg = t('loginRequiredCreateRoom') || 'Bạn cần đăng nhập để tạo phòng.';
    } else if (actionType === 'join_room') {
      msg = t('loginRequiredJoinRoom') || 'Bạn cần đăng nhập để tham gia phòng.';
    }

    setDialogState({
      isOpen: true,
      title: language === 'vi' ? '🔒 Yêu cầu đăng nhập' : '🔒 Login Required',
      message: msg,
      isConfirm: true,
      confirmText: language === 'vi' ? 'Đăng nhập' : 'Login',
      cancelText: language === 'vi' ? 'Hủy' : 'Cancel',
      onConfirm: () => {
        setDialogState({ isOpen: false });
        setPage('Login');
      },
      onCancel: () => setDialogState({ isOpen: false })
    });
  };


  useEffect(() => {
    document.body.classList.add('pop-art-theme');
    return () => {
      document.body.classList.remove('pop-art-theme');
    };
  }, []);

  useEffect(() => {
    const currentPlayerId = gameState?.players?.[gameState?.currentPlayerIndex]?.userId;
    if (!currentPlayerId || !myUser?.id) return;

    if (!hasInitializedTurnRef.current) {
      previousTurnPlayerIdRef.current = currentPlayerId;
      hasInitializedTurnRef.current = true;
      return;
    }

    const previousPlayerId = previousTurnPlayerIdRef.current;
    const isTurnChanged = previousPlayerId !== currentPlayerId;
    const isMyTurn = currentPlayerId === myUser.id;

    if (isTurnChanged && isMyTurn) {
      animationManager.enqueue({
        animKey: 'ENV_TURN_TRANSITION',
        priority: 'HIGH',
        metadata: {
          isMyTurn: true,
          label: 'YOUR TURN',
        },
      });
    }

    previousTurnPlayerIdRef.current = currentPlayerId;
  }, [gameState?.currentPlayerIndex, myUser?.id]);

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
  const [activeSeason, setActiveSeason] = useState(null);
  
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
  const [revealCard, setRevealCard] = useState(null);
  const prevHandRef = useRef([]);
  const [rightPanelTab, setRightPanelTab] = useState('chat');

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

  const fetchActiveSeason = async () => {
    try {
      const res = await fetch(`${API_URL}/api/seasons/active`);
      const data = await res.json();
      if (res.ok && data.active) {
        setActiveSeason(data.season);
      } else {
        setActiveSeason(null);
      }
    } catch (e) {
      console.error('Lỗi khi tải thông tin mùa giải:', e);
    }
  };

  useEffect(() => {
    fetchUserProfile();
    fetchActiveSeason();
  }, [roomState]);

  const handleQuickPlay = async () => {
    if (isQuickPlaySearching) return;
    if (!isAuthenticated) {
      showLoginRequired('quick_play');
      return;
    }
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

  // Decode user data from access token or use guestId
  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(
          window.atob(base64)
            .split('')
            .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
            .join('')
        );
        const payload = JSON.parse(jsonPayload);
        const isExpired = payload.exp * 1000 < Date.now();

        if (!isExpired && payload.role === 'admin') {
          setPage('Admin');
          return;
        }

        if (isExpired) {
          const guestId = localStorage.getItem('guestId');
          if (guestId) {
            setMyUser({ id: guestId, username: `Guest-${guestId.slice(6, 11)}` });
          }
        } else {
          setMyUser({ id: payload.sub, username: payload.username });
        }
      } catch (e) {
        console.error('Failed decoding access token', e);
        const guestId = localStorage.getItem('guestId');
        if (guestId) {
          setMyUser({ id: guestId, username: `Guest-${guestId.slice(6, 11)}` });
        }
      }
    } else {
      const guestId = localStorage.getItem('guestId');
      if (guestId) {
        setMyUser({ id: guestId, username: `Guest-${guestId.slice(6, 11)}` });
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
  const mainContainerRef = useRef(null);

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
    animationManager.enqueue({ animKey: 'CARD_ZOMBIE_KITTEN', metadata: { targetUserId, activatorPlayerId } });
  };

  const playHordeAttackAnimation = (sourceUserIds, targetUserId) => {
    animationManager.enqueue({ animKey: 'CARD_ATTACK_OF_THE_DEAD', metadata: { sourceUserIds, targetUserId } });
  };

  const playFeedTheDeadAnimation = (sourceUserIds, targetUserId) => {
    animationManager.enqueue({ animKey: 'CARD_FEED_THE_DEAD', metadata: { sourceUserIds, targetUserId } });
  };

  const playGraveRobberAnimation = (sourceUserIds) => {
    animationManager.enqueue({ animKey: 'CARD_GRAVE_ROBBER', metadata: { sourceUserIds } });
  };

  const playDigDeeperAnimation = () => {
    animationManager.enqueue({ animKey: 'CARD_DIG_DEEPER', metadata: {} });
  };

  // Flying Card Clone animation
  const playFlyingCard = (sourceId, targetId, cardType) => {
    const cleanType = cardType.startsWith('discard_') ? cardType.replace('discard_', '') : cardType;
    animationManager.enqueue({
      animKey: `CARD_${cleanType.toUpperCase()}`,
      cardType: cleanType,
      sourceId,
      targetId,
      metadata: { sourceId, targetId, cardType: cleanType },
    });
  };

  // Flying Draw Card animation
  const playDrawCard = (playerId) => {
    animationManager.enqueue({ animKey: 'DRAW_CARD', targetId: playerId, metadata: { targetId: playerId } });
  };

  // Screen Shake Wrapper Helper
  const triggerScreenShake = (type) => {
    animationManager.enqueue({
      animKey: 'ENV_SCREEN_SHAKE',
      priority: VFX_PRIORITY.LOW,
      metadata: { intensity: type === 'heavy' ? 20 : 10, duration: 0.3 },
    });
  };

  // Ref to deduplicate VFX for the same resolved actionId
  const playedResolvedVfxIds = React.useRef(new Set());

  useEffect(() => {
    if (!socket) return;

    const handleCardDrawn = ({ playerId }) => {
      setTimeout(() => {
        playDrawCard(playerId);
      }, 50);
    };

    // ─── game:cardPlayedPending ──────────────────────────────────────────────
    // Emitted immediately when a card is played while the Nope window is opened.
    // Must NOT trigger any main / card-specific VFX here.
    // Only allowed: small card-fly animation, log, toast.
    const handleCardPlayedPending = () => {
      // No main VFX here. All main VFX are deferred to game:actionResolved.
    };

    // ─── game:cardPlayed ─────────────────────────────────────────────────────
    // Kept only for:
    //   1. Nope card (animationOnly: true) — small card fly
    //   2. Discard actions emitted by game:discard handler (no Nope window)
    // Must NOT trigger main VFX for regular action cards.
    const handleCardPlayed = () => {
      // No main VFX here.
    };

    // ─── game:actionResolved ─────────────────────────────────────────────────
    // THE ONLY place that triggers main card VFX.
    // Emitted by server AFTER the Nope/Response window has closed and
    // the action outcome has been determined.
    const handleActionResolved = ({
      actionId,
      actionKind,
      cardType,
      comboType,
      displayCardType,
      playedBy,
      targetPlayerId: resolvedTargetId,
      result,
      vfxType,
      nopeCount,
    }) => {
      // Deduplicate: same actionId must never fire VFX twice on the same client
      if (actionId && playedResolvedVfxIds.current.has(actionId)) return;
      if (actionId) playedResolvedVfxIds.current.add(actionId);

      // Clean up old IDs to avoid unbounded Set growth
      if (playedResolvedVfxIds.current.size > 80) {
        const entries = [...playedResolvedVfxIds.current];
        entries.slice(0, 40).forEach((id) => playedResolvedVfxIds.current.delete(id));
      }

      const isCancelled = result === 'CANCELLED' || (nopeCount && nopeCount % 2 === 1);

      if (isCancelled) {
        // Action was Noped / cancelled — show Nope/Cancel VFX only
        animationManager.enqueue({
          animKey: 'CARD_NOPE',
          priority: VFX_PRIORITY.INTERRUPT,
          metadata: {
            actionId,
            cardType,
            comboType,
            playedBy,
            targetPlayerId: resolvedTargetId,
            result: 'CANCELLED',
            scale: 'large',
            screenCoverage: 0.5,
          },
        });
        return;
      }

      // Action was RESOLVED — show main card VFX
      const animKey = mapResolvedActionToAnimKey({
        result,
        nopeCount,
        vfxType,
        comboType,
        cardType: displayCardType || cardType,
      });

      if (cardType === 'reverse') {
        setReversePulse(true);
        setTimeout(() => setReversePulse(false), 500);
      }

      animationManager.enqueue({
        animKey,
        priority: VFX_PRIORITY.INTERRUPT,
        metadata: {
          actionId,
          actionKind,
          cardType,
          comboType,
          playedBy,
          targetPlayerId: resolvedTargetId,
          result: 'RESOLVED',
          scale: 'large',
          screenCoverage: 0.5,
        },
      });

      // Special secondary animations that are part of the resolved effect
      if (cardType === 'attack_of_the_dead') {
        const nextTargetId = getNextAlivePlayerId();
        if (nextTargetId) {
          setTimeout(() => {
            playHordeAttackAnimation([], nextTargetId);
          }, 400);
        }
      } else if (cardType === 'grave_robber') {
        setTimeout(() => {
          playGraveRobberAnimation([]);
        }, 400);
      } else if (cardType === 'dig_deeper') {
        setTimeout(() => {
          playDigDeeperAnimation();
        }, 400);
      } else if (cardType === 'feed_the_dead' && resolvedTargetId) {
        setTimeout(() => {
          playFeedTheDeadAnimation([], resolvedTargetId);
        }, 400);
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
        animationManager.enqueue({
          animKey: 'CARD_EXPLODING_KITTEN',
          priority: VFX_PRIORITY.INTERRUPT,
          metadata: { playerId, cardType },
        });
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
    socket.on('game:cardPlayedPending', handleCardPlayedPending);
    socket.on('game:cardPlayed', handleCardPlayed);
    socket.on('game:actionResolved', handleActionResolved);
    socket.on('game:exploded', handleExploded);
    socket.on('game:zombieRevived', handleZombieRevived);
    socket.on('game:nopeWindow', handleNopeWindowForAnim);
    socket.on('game:barkingKitten:resolved', handleBarkingKittenResolved);

    return () => {
      socket.off('game:cardDrawn', handleCardDrawn);
      socket.off('game:drewKitten', handleDrewKitten);
      socket.off('game:cardPlayedPending', handleCardPlayedPending);
      socket.off('game:cardPlayed', handleCardPlayed);
      socket.off('game:actionResolved', handleActionResolved);
      socket.off('game:exploded', handleExploded);
      socket.off('game:zombieRevived', handleZombieRevived);
      socket.off('game:nopeWindow', handleNopeWindowForAnim);
      socket.off('game:barkingKitten:resolved', handleBarkingKittenResolved);
    };
  }, [socket, myUser]);

  if (!myUser) {
    return (
      <div className="text-center py-12">
        <p className="font-headline font-black uppercase text-xl animate-pulse">{t('profile_loading') || 'Loading...'}</p>
      </div>
    );
  }

  // ==========================================
  // VIEW 1: JOIN / CREATE ROOM
  // ==========================================
  // ==========================================
  // VIEW 1: JOIN / CREATE ROOM (LOBBY UPGRADE)
  // ==========================================
  const errorToast = statusMessage && statusMessage !== 'Đang chờ can thiệp...' ? (
    <div className="fixed top-20 right-4 z-[9999] bg-red-500 text-white p-4 rounded shadow-[4px_4px_0_#1A1C1C] border-2 border-[var(--pop-black)] font-pop-display font-black text-sm flex items-center gap-4 animate-fade-in">
      <span>{statusMessage}</span>
      <button onClick={() => setStatusMessage(null)} className="bg-[var(--pop-black)] text-white px-2 py-1 hover:bg-white hover:text-[var(--pop-black)] transition-colors border-2 border-transparent hover:border-[var(--pop-black)]">X</button>
    </div>
  ) : null;

  const lobbyViewProps = {
    roomState,
    activeSeason,
    CheckIcon,
    CoinIcon,
    EDITIONS_MAP,
    ExclusiveCard,
    ExtensionIcon,
    GemIcon,
    ImageButton,
    LockIcon,
    PixelBombIcon,
    PixelSkullIcon,
    PixelStarIcon,
    PlayModeCard,
    createPassword,
    createRoom: (opts, username) => {
      if (!isAuthenticated) {
        showLoginRequired('create_room');
        return;
      }
      createRoom(opts, username);
    },
    createRoomIcon,
    createRoomStep,
    detailFading,
    editionsList,
    errorToast,
    getCardImageUrl,
    getEditionDetails,
    handleDailyReward,
    handleJoinRoomCode: (code, password) => {
      if (!isAuthenticated) {
        showLoginRequired('join_room');
        return;
      }
      handleJoinRoomCode(code, password);
    },
    handleQuickPlay,
    idRoomImg,
    isCreateModalOpen,
    isCreatingRoom,
    setIsCreatingRoom: (val) => {
      if (val && !isAuthenticated) {
        showLoginRequired('create_room');
        return;
      }
      setIsCreatingRoom(val);
    },
    isDailyRewardClaimed,
    isEditionDropdownOpen,
    isQuickPlaySearching,
    joinRoom: (code, pwd) => {
      if (!isAuthenticated) {
        showLoginRequired('join_room');
        return;
      }
      joinRoom(code, pwd);
    },
    language,
    lastClickedEdition,
    lobbyBetAmount,
    lobbyCustomDefuses,
    lobbyCustomExplodingKittens,
    lobbyEdition,
    lobbyMaxPlayers,
    pressedChip,
    publicRooms,
    quickplayIcon,
    renderEditionArtwork,
    roomInput,
    roomPrivacy,
    setCreatePassword,
    setCreateRoomStep,
    setDetailFading,
    setHoveredEdition,
    setIsCreateModalOpen,
    setIsEditionDropdownOpen,
    setLastClickedEdition,
    setLobbyBetAmount,
    setLobbyCustomDefuses,
    setLobbyCustomExplodingKittens,
    setLobbyEdition,
    setLobbyMaxPlayers,
    setPressedChip,
    setRoomInput,
    setRoomPrivacy,
    setShowPasswordInput,
    setVisibleEdition,
    setVoiceChatEnabled,
    showPasswordInput,
    t,
    userProfile,
    visibleEdition,
    voiceChatEnabled,
  };

  if (!roomState) {
    return (
      <GameProvider value={lobbyViewProps}>
        <LobbyView />
      </GameProvider>
    );
  }

  const isHost = roomState.host === myUser.id;

  const waitingRoomViewProps = {
    CheckIcon,
    CoinIcon,
    CrownIcon,
    LogoutIcon,
    copied,
    copyIcon,
    doorIcon,
    errorToast,
    getAvatarBgColor,
    getCardImageUrl,
    handleCopyCode,
    handleLeaveConfirm,
    isEditRoomModalOpen,
    isHost,
    kickPlayer,
    language,
    lobbyBetAmount,
    lobbyCustomDefuses,
    lobbyCustomExplodingKittens,
    lobbyEdition,
    lobbyMaxPlayers,
    myUser,
    roomState,
    setIsEditRoomModalOpen,
    setLobbyBetAmount,
    setLobbyCustomDefuses,
    setLobbyCustomExplodingKittens,
    setLobbyEdition,
    setLobbyMaxPlayers,
    startGame,
    t,
    toggleReady,
    updateRoomSettings,
  };

  // ==========================================
  // VIEW 2: LOBBY WAITING SCREEN
  // ==========================================
  if (roomState.status === 'waiting') {
    return (
      <GameProvider value={waitingRoomViewProps}>
        <WaitingRoomView />
      </GameProvider>
    );
  }

  // ==========================================
  // VIEW 3: ACTIVE GAME BOARD
  // ==========================================
  const gameBoardViewProps = {
    AlterFutureModal,
    ArmageddonDecisionModal,
    reversePulse,
    ArmageddonDistributeModal,
    BuryPositionModal,
    CardDrawerIcon,
    ClairvoyanceRevealModal,
    CoinIcon,
    CustomDialog,
    DeckPile,
    DefusePositionModal,
    DigDeeperModal,
    DiscardPile,
    DrawReveal,
    EMOTES_LIST,
    FavorRequestModal,
    FeedTheDeadModal,
    GarbageSelectModal,
    GearIcon,
    GemIcon,
    GraveRobberModal,
    HelpIcon,
    ImageButton,
    NopeCountdown,
    NopeResultToast,
    NowCardToast,
    PRESET_AVATARS,
    PlayerAvatar,
    PlayerHand,
    SeeFutureModal,
    SelectTargetModal,
    SmileIcon,
    SoundIcon,
    ZombieReviveModal,
    actionLog,
    alterFutureRequest,
    armageddonRequest,
    buryRequest,
    chatMessages,
    defuseRequest,
    dialogState,
    digDeeperRequest,
    discardCard,
    drawCard,
    drewKittenAlert,
    errorToast,
    favorRequest,
    feedTheDeadRequest,
    gameEnded,
    gameState,
    garbageRequest,
    getOrderedOpponents,
    getStatusDisplay,
    graveRobberRequest,
    handleLeaveConfirm,
    hasUnreadMessages,
    isImplodingActive,
    isRedFlashActive,
    isSidebarOpen,
    leaveRoom,
    localClairvoyance,
    mainContainerRef,
    myUser,
    nopeAlert,
    nopeResult,
    nopeStamp,
    nopeWindow,
    nowCardToast,
    numPlayAnims,
    passNope,
    playAgain,
    playCard,
    playCombo,
    playNope,
    potLuckRequest,
    privateHand,
    respondAlterFuture,
    respondArmageddonDecision,
    respondArmageddonDistribute,
    respondBury,
    respondCombo5,
    respondDefuse,
    respondDigDeeper,
    respondFavor,
    respondFeedTheDead,
    respondGarbage,
    respondGraveRobber,
    respondPotLuck,
    respondSelectTarget,
    respondZombie,
    revealCard,
    rightPanelTab,
    roomState,
    seeTheFutureCards,
    selectTargetRequest,
    sendChatMessage,
    sendEmote,
    setDialogState,
    setGameEnded,
    setIsSidebarOpen,
    setLocalClairvoyance,
    setRevealCard,
    setRightPanelTab,
    setSeeTheFutureCards,
    t,
    zombieFog,
    zombieRequest,
  };

  return (
    <GameProvider value={gameBoardViewProps}>
      <GameBoardView />
    </GameProvider>
  );
}
