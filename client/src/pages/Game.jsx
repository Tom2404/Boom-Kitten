import React, { useState, useEffect, useRef } from 'react';
import { useGame } from '../hooks/useGame.js';
import PlayerAvatar, { PRESET_AVATARS } from '../components/PlayerAvatar.jsx';
import PlayerHand from '../components/PlayerHand.jsx';
import DeckPile from '../components/DeckPile.jsx';
import DiscardPile from '../components/DiscardPile.jsx';
import Card, { CARD_THEMES } from '../components/Card.jsx';
import { getCardImageUrl } from '../utils/cardSkins.js';
import gsap from 'gsap';
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
  playAttackEffect
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

function ExclusiveCard({ cardType, name, skinIndex = 0 }) {
  const imageUrl = getCardImageUrl(cardType, skinIndex);
  const { t } = useLanguage();
  const desc = t(`card_${cardType}_desc`) || '';

  return (
    <div className="relative w-full aspect-[3/4] bg-slate-950 border-3 border-on-surface rounded-xl shadow-[3px_3px_0px_0px_rgba(26,28,28,1)] transition-all duration-300 ease-out hover:-translate-y-3 hover:scale-105 hover:shadow-[0_12px_24px_rgba(255,87,34,0.35)] hover:border-[#ff5722] hover:z-30 group cursor-pointer">
      {/* Main card wrapper (clipped with rounded corners) */}
      <div className="w-full h-full flex flex-col justify-between overflow-hidden rounded-lg">
        <div className="flex-grow w-full overflow-hidden flex items-center justify-center p-2 bg-slate-900">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={name}
              className="w-full h-full object-contain transition-transform duration-300 group-hover:scale-110"
            />
          ) : (
            <div className="text-white/20 font-headline font-black text-2xl tracking-widest select-none">BK</div>
          )}
        </div>
        <div className="bg-slate-950 border-t-2 border-on-surface py-2.5 px-1.5 text-center flex items-center justify-center min-h-[44px]">
          <span className="font-headline font-black text-[9px] tracking-wider text-white uppercase line-clamp-2 leading-tight">
            {name}
          </span>
        </div>
      </div>

      {/* Hover Info Tooltip (positioned outside overflow-hidden) */}
      <div className="absolute bottom-[108%] left-1/2 transform -translate-x-1/2 w-60 bg-white border-3 border-on-surface rounded-xl p-3 shadow-[4px_4px_0px_0px_#1a1c1c] z-50 pointer-events-none opacity-0 group-hover:opacity-100 transition-all duration-200 flex flex-col gap-2 scale-90 group-hover:scale-100 origin-bottom">
        {imageUrl && (
          <div className="w-full aspect-[4/3] overflow-hidden rounded-lg border-2 border-on-surface bg-slate-900 flex items-center justify-center p-1">
            <img src={imageUrl} alt={name} className="w-full h-full object-contain" />
          </div>
        )}
        <div className="flex flex-col gap-1 text-left">
          <span className="font-headline font-black text-[10px] text-on-surface uppercase tracking-wide leading-tight">
            {name}
          </span>
          {desc && (
            <p className="text-[9px] font-sans font-bold text-on-surface-variant leading-relaxed">
              {desc}
            </p>
          )}
        </div>
      </div>
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
  const [createPassword, setCreatePassword] = useState('');
  const [joinPassword, setJoinPassword] = useState('');
  const [publicRooms, setPublicRooms] = useState([]);
  const [lobbyTab, setLobbyTab] = useState('list'); // 'list' | 'create'
  const [lobbyEdition, setLobbyEdition] = useState('original');
  const [isEditionDropdownOpen, setIsEditionDropdownOpen] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isCreatingRoom, setIsCreatingRoom] = useState(false);
  const [hoveredEdition, setHoveredEdition] = useState(null);
  const [showPasswordInput, setShowPasswordInput] = useState(false);
  const [cosmeticRoomTitle, setCosmeticRoomTitle] = useState('MEOW MIXER #' + Math.floor(10 + Math.random() * 90));
  const [voiceChatEnabled, setVoiceChatEnabled] = useState(false);
  
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
    try {
      const res = await fetch(`${API_URL}/api/rooms`);
      const data = await res.json();
      if (res.ok && data.length > 0) {
        const availableRoom = data.find((r) => r.players.length < r.maxPlayers);
        if (availableRoom) {
          joinRoom(availableRoom.code);
          return;
        }
      }
      createRoom('', true, 'original');
    } catch (e) {
      console.error('Lỗi khi chơi nhanh:', e);
      createRoom('', true, 'original');
    }
  };

  const handleRefreshRooms = async () => {
    setIsRefreshing(true);
    try {
      await fetchPublicRooms();
    } finally {
      setIsRefreshing(false);
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

    const handleCardPlayed = ({ playerId, cardType, targetPlayerId }) => {
      const sourceId = playerId === myUser?.id ? 'player-hand-container' : `player-avatar-${playerId}`;
      const triggerEl = document.getElementById(sourceId);

      if (cardType === 'nope') {
        playNopeEffect(triggerEl);
      } else if (cardType === 'skip' || cardType === 'super_skip') {
        playSkipEffect(triggerEl);
      } else if (cardType?.startsWith('attack')) {
        playAttackEffect(triggerEl);
      }

      setTimeout(() => {
        const targetId = 'discard-pile-element';
        playFlyingCard(sourceId, targetId, cardType);
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
        setTimeout(() => {
          setIsRedFlashActive(false);
        }, 1500);
      }

      setDrewKittenAlert({ active: true, playerName: username, cardType });
      setTimeout(() => {
        setDrewKittenAlert(null);
      }, 3000);
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
      return (
        <div className="w-full max-w-5xl mx-auto my-6 flex flex-col gap-6 animate-fade-in text-left">
          {/* Inject Neo-brutalist Custom Slider & Scrollbar CSS */}
          <style>{`
            .brutal-slider {
              -webkit-appearance: none;
              width: 100%;
              height: 12px;
              background: #ffffff;
              border: 3px solid #1a1c1c;
              border-radius: 6px;
              outline: none;
              box-shadow: 1.5px 1.5px 0px #1a1c1c;
            }
            .brutal-slider::-webkit-slider-thumb {
              -webkit-appearance: none;
              appearance: none;
              width: 18px;
              height: 28px;
              background: #ff5722;
              border: 3px solid #1a1c1c;
              border-radius: 4px;
              cursor: pointer;
              box-shadow: 2px 2px 0px #1a1c1c;
              transition: transform 0.15s ease-out;
            }
            .brutal-slider::-webkit-slider-thumb:hover {
              transform: scale(1.1) translateY(-1px);
            }
            .brutal-slider::-webkit-slider-thumb:active {
              transform: scale(0.95);
            }
            .brutal-slider::-moz-range-thumb {
              width: 14px;
              height: 24px;
              background: #ff5722;
              border: 3px solid #1a1c1c;
              border-radius: 4px;
              cursor: pointer;
              box-shadow: 2px 2px 0px #1a1c1c;
            }
            .scrollbar-hidden::-webkit-scrollbar {
              display: none;
            }
            .scrollbar-hidden {
              -ms-overflow-style: none;
              scrollbar-width: none;
            }
          `}</style>

          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b-4 border-on-surface pb-4 gap-4">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="font-headline font-black text-4xl md:text-6xl text-on-surface uppercase tracking-tight py-1 select-none">
                  CREATE
                </h1>
                <div 
                  className="font-headline font-black text-4xl md:text-6xl bg-[#ff5722] text-white px-4 py-1.5 rounded-xl border-3 border-on-surface shadow-[4px_4px_0px_0px_rgba(26,28,28,1)] tracking-tight transform -rotate-2 select-none"
                  style={{ textShadow: '2px 2px 0px #1a1c1c' }}
                >
                  ROOM
                </div>
              </div>
              <p className="text-xs font-bold text-on-surface-variant mt-3 max-w-xl leading-relaxed">
                {language === 'vi' 
                  ? 'Tập hợp các chiến binh mèo của bạn và chuẩn bị cho sự hỗn loạn bùng nổ. Chọn phiên bản hủy diệt bên dưới.' 
                  : 'Assemble your feline warriors and prepare for explosive chaos. Choose your flavor of destruction below.'}
              </p>
            </div>
            <button
              onClick={() => setIsCreatingRoom(false)}
              className="bg-white text-on-surface border-3 border-on-surface px-5 py-3 rounded-2xl flex items-center gap-2 shadow-[3px_3px_0px_0px_#1a1c1c] text-xs font-headline font-black hover:translate-y-[-2px] hover:shadow-[4.5px_4.5px_0px_0px_#1a1c1c] active:translate-y-0.5 active:shadow-none transition-all uppercase"
            >
              {t('back_to_lobby')}
            </button>
          </div>

          {/* Grid Edition Selection (No Scrollbar) */}
          <div className="flex flex-col gap-2">
            <span className="font-headline font-black text-xs text-on-surface-variant uppercase tracking-wider">
              {t('choose_edition')}
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-1 select-none">
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
                      // Adjust default player count if it exceeds new edition limits
                      const maxLimit = key === '2_player' ? 2 : (key === 'imploding' ? 6 : 5);
                      if (lobbyMaxPlayers > maxLimit || key === '2_player') {
                        setLobbyMaxPlayers(maxLimit);
                      }
                    }}
                    onMouseEnter={() => setHoveredEdition(key)}
                    onMouseLeave={() => setHoveredEdition(null)}
                    className={`w-full p-4 rounded-2xl border-3 border-on-surface text-left flex flex-col justify-between gap-3 h-32 cursor-pointer transition-all duration-150 relative
                      ${isSelected 
                        ? 'bg-[#ff5722] text-white shadow-[4px_4px_0px_0px_rgba(26,28,28,1)] translate-y-0.5' 
                        : 'bg-white text-on-surface shadow-[4px_4px_0px_0px_rgba(26,28,28,1)] hover:translate-y-[-2px] hover:shadow-[5px_5px_0px_0px_rgba(26,28,28,1)] active:translate-y-0.5 active:shadow-none'
                      }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className={`flex-shrink-0 ${isSelected ? 'text-white' : 'text-on-surface'}`}>
                        {meta.icon}
                      </span>
                      <h3 className="font-headline font-black text-xs uppercase tracking-wider leading-none">
                        {details.name}
                      </h3>
                    </div>
                    <p className={`text-[10px] font-bold opacity-90 line-clamp-2 leading-snug ${isSelected ? 'text-white/95' : 'text-on-surface-variant'}`}>
                      {details.description}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Split Columns Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left Column: Active Edition Showcase */}
            <div className="lg:col-span-7 bg-white border-3 border-on-surface shadow-[4.5px_4.5px_0px_0px_rgba(26,28,28,1)] rounded-2xl p-6 relative flex flex-col gap-6 text-left">
              {(() => {
                const activeKey = hoveredEdition || lobbyEdition;
                const details = getEditionDetails(activeKey);
                const meta = EDITIONS_MAP[activeKey] || EDITIONS_MAP.original;
                return (
                  <>
                    {/* Rotated Slanted Type Badge */}
                    <div className="absolute top-5 right-5 rotate-6 z-10 select-none">
                      <div className={`font-headline font-black text-[9px] px-3.5 py-1.5 rounded-lg border-2 border-on-surface shadow-[2px_2px_0px_0px_#1a1c1c] uppercase tracking-wider ${meta.badgeColor}`}>
                        {language === 'vi' ? meta.badge.vi : meta.badge.en}
                      </div>
                    </div>

                    {/* Title & Description */}
                    <div className="border-b-2 border-slate-100 pb-4 pr-24">
                      <h3 className="font-headline font-black text-2xl text-on-surface uppercase tracking-tight">
                        {details.name}
                      </h3>
                      <p className="text-xs font-bold text-on-surface-variant mt-2 leading-relaxed">
                        {details.description}
                      </p>
                    </div>

                    {/* Special Rules */}
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-2">
                        <svg className="w-4 h-4 text-[#ff5722]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                          <line x1="4" y1="21" x2="4" y2="14" />
                          <line x1="4" y1="10" x2="4" y2="3" />
                          <line x1="12" y1="21" x2="12" y2="12" />
                          <line x1="12" y1="8" x2="12" y2="3" />
                          <line x1="20" y1="21" x2="20" y2="16" />
                          <line x1="20" y1="12" x2="20" y2="3" />
                          <line x1="1" y1="14" x2="7" y2="14" />
                          <line x1="9" y1="8" x2="15" y2="8" />
                          <line x1="17" y1="16" x2="23" y2="16" />
                        </svg>
                        <span className="font-headline font-black text-xs text-on-surface uppercase tracking-wider">
                          {language === 'vi' ? 'LUẬT CHƠI ĐẶC TRƯNG' : 'SPECIAL RULES'}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-2.5 mt-1 select-none">
                        {meta.rules[language].map((ruleText, idx) => {
                          const tilts = ['-rotate-2', 'rotate-1', '-rotate-1', 'rotate-2'];
                          const tilt = tilts[idx % tilts.length];
                          return (
                            <span 
                              key={idx} 
                              className={`inline-block bg-[#fdf2f8] text-slate-900 border-2 border-on-surface px-3 py-1.5 rounded-lg text-[9px] font-headline font-black uppercase shadow-[1.5px_1.5px_0px_0px_rgba(26,28,28,1)] transform ${tilt}`}
                            >
                              {ruleText}
                            </span>
                          );
                        })}
                      </div>
                    </div>

                    {/* Exclusive Cards Row */}
                    <div className="flex flex-col gap-3 border-t-2 border-slate-100 pt-4">
                      <span className="font-headline font-black text-xs text-on-surface uppercase tracking-wider">
                        {language === 'vi' ? 'THẺ BÀI ĐỘC QUYỀN' : 'EXCLUSIVE CARDS'}
                      </span>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-1">
                        {meta.exclusiveCards.map((card, idx) => (
                          <ExclusiveCard 
                            key={idx} 
                            cardType={card.type} 
                            name={language === 'vi' ? card.name.vi : card.name.en} 
                          />
                        ))}
                      </div>
                    </div>
                  </>
                );
              })()}
            </div>

            {/* Right Column: Lobby Settings Card */}
            <div className="lg:col-span-5 flex flex-col gap-6">
              <div className="bg-white border-3 border-on-surface shadow-[4.5px_4.5px_0px_0px_rgba(26,28,28,1)] rounded-2xl p-6 flex flex-col gap-5 text-left">
                <div className="border-b-3 border-on-surface pb-3">
                  <h3 className="font-headline font-black text-xl text-on-surface uppercase tracking-tight">
                    {t('lobby_settings')}
                  </h3>
                </div>

                {/* Player count Custom Slider */}
                <div className="flex flex-col gap-2">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-headline font-black text-xs text-on-surface uppercase tracking-wider">
                      {t('max_players')}
                    </span>
                    <div 
                      className="font-headline font-black text-2xl text-[#ff5722] transform -rotate-12 bg-white border-2 border-on-surface px-2.5 py-0.5 rounded shadow-[2px_2px_0px_0px_#1a1c1c] select-none"
                      style={{ textShadow: '1px 1px 0px #1a1c1c' }}
                    >
                      {lobbyMaxPlayers}
                    </div>
                  </div>
                  {(() => {
                    const minLimit = 2;
                    const maxLimit = lobbyEdition === '2_player' ? 2 : (lobbyEdition === 'imploding' ? 6 : 5);
                    const isLocked = minLimit === maxLimit;
                    
                    return (
                      <div className="flex flex-col gap-2 mt-1">
                        <input
                          type="range"
                          min={minLimit}
                          max={maxLimit}
                          disabled={isLocked}
                          value={lobbyMaxPlayers}
                          onChange={(e) => setLobbyMaxPlayers(Number(e.target.value))}
                          className={`brutal-slider ${isLocked ? 'opacity-50 cursor-not-allowed' : ''}`}
                        />
                        {/* Tick indicators */}
                        <div className="flex justify-between px-1 text-[10px] font-headline font-black text-on-surface-variant">
                          {Array.from({ length: maxLimit - minLimit + 1 }).map((_, idx) => {
                            const val = minLimit + idx;
                            return (
                              <span key={val} className={lobbyMaxPlayers === val ? 'text-[#ff5722] scale-110' : ''}>
                                {val}
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })()}
                </div>

                {/* Room Password field */}
                <div className="flex flex-col gap-2">
                  <span className="font-headline font-black text-xs text-on-surface uppercase tracking-wider">
                    {language === 'vi' ? 'Mật khẩu phòng (Tuỳ chọn)' : 'Room Password (Optional)'}
                  </span>
                  <div className="relative flex items-center">
                    <input
                      type={showPasswordInput ? "text" : "password"}
                      placeholder={t('enter_password')}
                      value={createPassword}
                      onChange={(e) => setCreatePassword(e.target.value)}
                      maxLength={20}
                      className="bg-white border-3 border-on-surface px-4 py-3.5 rounded-xl text-xs font-bold focus:outline-none focus:bg-slate-50 transition-all w-full pr-16 shadow-[2.5px_2.5px_0px_0px_rgba(26,28,28,1)]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswordInput(!showPasswordInput)}
                      className="absolute right-3 bg-slate-100 hover:bg-slate-200 border-2 border-on-surface px-2.5 py-1.5 rounded-lg text-[9px] font-headline font-black text-on-surface shadow-[1px_1px_0px_0px_#1a1c1c] active:translate-y-0.5 active:shadow-none"
                    >
                      {showPasswordInput ? t('button_hide') : t('button_show')}
                    </button>
                  </div>
                </div>

                {/* Bet Amount field */}
                <div className="flex flex-col gap-2 border-t-2 border-dashed border-slate-100 pt-4 mt-2">
                  <span className="font-headline font-black text-xs text-on-surface uppercase tracking-wider">
                    {language === 'vi' ? 'Tiền cược (GoldCoin)' : 'Bet Amount (GoldCoin)'}
                  </span>
                  <div className="flex items-center gap-4">
                    <input
                      type="range"
                      min="10"
                      max="1000"
                      step="10"
                      value={lobbyBetAmount}
                      onChange={(e) => setLobbyBetAmount(Number(e.target.value))}
                      className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                    />
                    <span className="font-headline font-black text-sm text-[#ff5722] min-w-[50px] text-right">
                      {lobbyBetAmount}
                    </span>
                  </div>
                </div>

                {/* Voice Chat toggle */}
                <div className="flex justify-between items-center border-t-2 border-dashed border-slate-100 pt-4 mt-2">
                  <div className="flex flex-col text-left">
                    <span className="font-headline font-black text-xs text-on-surface uppercase tracking-wider">
                      {t('voice_chat')}
                    </span>
                    <span className="text-[10px] font-bold text-on-surface-variant font-sans">
                      {language === 'vi' ? 'Kích hoạt đàm thoại nhóm' : 'Enable in-game group voice'}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setVoiceChatEnabled(!voiceChatEnabled)}
                    className={`w-14 h-8 rounded-lg border-3 border-on-surface relative transition-all duration-200 shadow-[2px_2px_0px_0px_rgba(26,28,28,1)] active:translate-y-0.5 active:shadow-none
                      ${voiceChatEnabled ? 'bg-[#ff5722]' : 'bg-white'}`}
                  >
                    <div 
                      className="absolute top-0.5 w-5 h-5 rounded border-2 border-on-surface bg-white shadow-[1px_1px_0px_rgba(0,0,0,0.15)] transition-all duration-200" 
                      style={{ left: voiceChatEnabled ? '26px' : '3px' }}
                    />
                  </button>
                </div>
              </div>

              {/* Start Lobby DETONATE button */}
              <button
                onClick={() => {
                  createRoom(createPassword, lobbyEdition, lobbyMaxPlayers, lobbyBetAmount);
                  setIsCreatingRoom(false);
                }}
                className="w-full bg-[#ff5722] hover:bg-[#e64a19] text-white border-3 border-on-surface py-4.5 rounded-2xl font-headline font-black uppercase text-base tracking-wider shadow-[4.5px_4.5px_0px_0px_rgba(26,28,28,1)] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_0px_rgba(26,28,28,1)] active:translate-y-0.5 active:shadow-none transition-all duration-150"
              >
                {t('start_lobby')}
              </button>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="w-full max-w-5xl mx-auto my-6 flex flex-col gap-6 animate-fade-in">
        {/* Header with Coins and Gems */}
        <div className="flex justify-end gap-3 flex-wrap">
          <button 
            onClick={handleDailyReward}
            className="bg-[#ff5722] hover:bg-[#e64a19] text-white border-3 border-on-surface px-4 py-2 rounded-2xl shadow-[3px_3px_0px_0px_#1a1c1c] text-xs font-headline font-black transition-all hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[4px_4px_0px_0px_#1a1c1c] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none"
          >
            {language === 'vi' ? 'NHẬN THƯỞNG NGÀY' : 'DAILY REWARD'}
          </button>
          <div className="bg-white border-3 border-on-surface px-4 py-2 rounded-2xl flex items-center gap-2 shadow-[3px_3px_0px_0px_#1a1c1c] text-xs font-headline font-black text-on-surface animate-fade-in">
            <CoinIcon className="w-5 h-5" />
            <span>{userProfile?.coins?.toLocaleString() ?? 0} GOLD COIN</span>
          </div>
          <div className="bg-white border-3 border-on-surface px-4 py-2 rounded-2xl flex items-center gap-2 shadow-[3px_3px_0px_0px_#1a1c1c] text-xs font-headline font-black text-on-surface animate-fade-in">
            <GemIcon className="w-5 h-5" />
            <span>{userProfile?.gems?.toLocaleString() ?? 0} PINK COIN</span>
          </div>
        </div>

        {/* Title: CHOOSE YOUR CHAOS */}
        <div className="text-center md:text-left mb-2 mt-2">
          <h1 
            className="font-headline font-black text-4xl md:text-6xl text-on-surface uppercase tracking-tight relative select-none leading-none py-1"
            style={{
              WebkitTextStroke: '2.5px #1a1c1c',
              textShadow: '5px 5px 0px #ff5722'
            }}
          >
            CHOOSE YOUR CHAOS
          </h1>
        </div>

        {/* Quick Actions Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-4">
          {/* Card 1: QUICK PLAY */}
          <button
            onClick={handleQuickPlay}
            className="card-brutalist bg-gradient-to-br from-primary-container to-primary border-3 border-on-surface p-6 rounded-2xl shadow-[4px_4px_0px_0px_#1a1c1c] flex flex-col items-center justify-center text-center gap-4 group cursor-pointer hover:scale-[1.03] active:scale-[0.98] transition-all text-white h-48"
          >
            <BoltIcon className="w-16 h-16 animate-pulse text-white" strokeWidth={2} />
            <span className="font-headline font-black text-lg md:text-xl uppercase tracking-wider text-white">
              QUICK PLAY
            </span>
          </button>

          {/* Card 2: CREATE PRIVATE ROOM */}
          <button
            onClick={() => {
              setIsCreatingRoom(true);
              setLobbyEdition('original');
              setLobbyMaxPlayers(5);
              setCreatePassword('');
            }}
            className="card-brutalist bg-gradient-to-br from-secondary-container to-secondary border-3 border-on-surface p-6 rounded-2xl shadow-[4px_4px_0px_0px_#1a1c1c] flex flex-col items-center justify-center text-center gap-4 group cursor-pointer hover:scale-[1.03] active:scale-[0.98] transition-all text-white h-48"
          >
            <KeyIcon className="w-16 h-16 text-white" strokeWidth={2} />
            <span className="font-headline font-black text-lg md:text-xl uppercase tracking-wider text-white">
              CREATE ROOM
            </span>
          </button>

          {/* Card 3: JOIN VIA CODE */}
          <div className="card-brutalist bg-white border-3 border-on-surface p-6 rounded-2xl shadow-[4px_4px_0px_0px_#1a1c1c] flex flex-col justify-between h-48 text-left">
            <div>
              <span className="font-headline font-black text-[10px] uppercase text-on-surface-variant tracking-wider block mb-2">
                JOIN VIA CODE
              </span>
              <input
                type="text"
                placeholder="ENTER CODE"
                value={roomInput}
                onChange={(e) => setRoomInput(e.target.value.toUpperCase())}
                maxLength={6}
                className="w-full bg-slate-50 border-2 border-on-surface rounded-xl px-3 py-2 text-on-surface font-headline font-black uppercase tracking-widest text-center text-xs focus:outline-none focus:bg-white transition-all shadow-[1.5px_1.5px_0px_0px_#1a1c1c]"
              />
            </div>
            <button
              onClick={() => joinRoom(roomInput)}
              disabled={roomInput.length !== 6}
              className="w-full bg-on-surface text-white py-3 rounded-xl font-headline font-black uppercase hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-xs flex items-center justify-center gap-2 mt-2"
            >
              <span>VÀO PHÒNG</span>
              <ArrowForwardIcon className="w-4 h-4 text-white" strokeWidth={3} />
            </button>
          </div>
        </div>

        {/* Active Games List Table */}
        <div className="bg-white border-3 border-on-surface shadow-[6px_6px_0px_0px_#1a1c1c] rounded-2xl overflow-hidden mb-6">
          <div className="bg-on-surface px-6 py-4 flex justify-between items-center text-white border-b-3 border-on-surface">
            <h3 className="font-headline font-black text-sm uppercase tracking-wider flex items-center gap-2">
              <ListIcon className="w-5 h-5 text-white" strokeWidth={2.5} />
              ACTIVE GAMES
            </h3>
            <button 
              onClick={handleRefreshRooms} 
              className="hover:scale-110 active:scale-95 transition-all text-white flex items-center justify-center"
              title="Làm mới danh sách"
            >
              <RefreshIcon className={`w-5 h-5 text-white ${isRefreshing ? 'animate-spin' : ''}`} strokeWidth={2.5} />
            </button>
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
                    <td colSpan="7" className="py-12 text-center text-on-surface-variant italic font-bold">
                      Không có phòng công khai nào đang chờ... Hãy tự tạo phòng đấu của riêng bạn!
                    </td>
                  </tr>
                ) : (
                  publicRooms.map((room) => {
                    const isFull = room.players.length >= room.maxPlayers;
                    return (
                      <tr key={room.code} className="hover:bg-slate-50 transition-colors">
                        <td className="py-4 px-6 font-headline font-black text-primary uppercase text-sm flex items-center gap-2">
                          {room.code}
                          {room.hasPassword && <LockIcon className="w-4 h-4 text-slate-400" strokeWidth={2.5} />}
                        </td>
                        <td className="py-4 px-6">{room.players[0]?.username || 'Ẩn danh'}</td>
                        <td className="py-4 px-6">
                          <span className="text-[9px] font-headline font-black text-indigo-600 bg-indigo-50 border-2 border-indigo-200 px-2.5 py-0.5 rounded-lg">
                            {t('edition_' + room.edition + '_name') || room.edition}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-center font-bold text-[#ff5722]">
                          {room.betAmount || 50}
                        </td>
                        <td className="py-4 px-6 text-center">
                          <span className={`font-headline font-black text-xs ${isFull ? 'text-rose-600' : 'text-on-surface'}`}>
                            {room.players.length}/{room.maxPlayers}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-center">
                          <span className={`inline-block px-2.5 py-0.5 text-[9px] font-headline font-black rounded-md border-2
                            ${isFull 
                              ? 'bg-rose-100 border-rose-300 text-rose-700' 
                              : 'bg-emerald-100 border-emerald-300 text-emerald-700'}`}>
                            {isFull ? 'FULL' : 'WAITING'}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-right">
                          <button
                            onClick={() => handleJoinRoomCode(room.code, room.password)}
                            disabled={isFull}
                            className={`px-4 py-2 font-headline font-black uppercase text-[10px] rounded-xl border-2 shadow-[2px_2px_0px_0px_#1a1c1c] transition-all hover:scale-105 active:scale-95
                              ${isFull 
                                ? 'bg-slate-100 border-slate-300 text-slate-400 cursor-not-allowed shadow-none' 
                                : 'bg-yellow-400 border-on-surface text-slate-950'}`}
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

              <button
                onClick={() => {
                  createRoom(createPassword, lobbyEdition, 5, lobbyBetAmount);

                  setIsCreateModalOpen(false);
                }}
                className="btn-detonator w-full py-3.5 rounded-2xl font-headline font-black uppercase text-xs"
              >
                XÁC NHẬN TẠO PHÒNG
              </button>
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
      <div className="max-w-xl mx-auto my-6 bg-white border-4 border-on-surface shadow-[8px_8px_0px_0px_rgba(26,28,28,1)] rounded-3xl p-8 flex flex-col gap-6 animate-fade-in">
        <div className="flex justify-between items-start border-b-4 border-on-surface pb-4 flex-wrap gap-4 text-left">
          <div>
            <h2 className="text-2xl font-headline font-black text-on-surface uppercase">Phòng Chờ Trận Đấu</h2>
            
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <span className="text-[10px] font-headline font-black text-on-surface-variant uppercase">Mã Phòng:</span>
              <div className="flex items-center gap-1.5 bg-yellow-400 text-slate-950 font-headline font-black text-xs px-3 py-1.5 rounded-xl border-2 border-on-surface shadow-[2px_2px_0px_0px_rgba(26,28,28,1)]">
                <span>{roomState.code}</span>
                <button 
                  onClick={() => handleCopyCode(roomState.code)} 
                  className="hover:scale-110 active:scale-95 transition-all flex items-center justify-center text-slate-950 ml-1"
                  title="Sao chép mã phòng"
                >
                  {copied ? (
                    <CheckIcon className="w-3.5 h-3.5" strokeWidth={3} />
                  ) : (
                    <CopyIcon className="w-3.5 h-3.5" strokeWidth={2.5} />
                  )}
                </button>
              </div>
              <span className="text-[9px] font-headline font-black bg-indigo-100 border-2 border-on-surface text-indigo-700 px-2 py-1.5 rounded-xl shadow-[1.5px_1.5px_0px_0px_rgba(26,28,28,1)] uppercase">
                {t('edition_' + roomState.edition + '_name') || roomState.edition}
              </span>
              <span className="text-[9px] font-headline font-black bg-[#ff5722] border-2 border-on-surface text-white px-2 py-1.5 rounded-xl shadow-[1.5px_1.5px_0px_0px_rgba(26,28,28,1)] uppercase flex items-center gap-1">
                <CoinIcon className="w-3.5 h-3.5 text-white" />
                CƯỢC: {roomState.betAmount || 50}
              </span>
            </div>
          </div>
          
          <button
            onClick={handleLeaveConfirm}
            className="bg-secondary text-on-error font-headline font-black border-2 border-on-surface shadow-[2px_2px_0px_0px_rgba(26,28,28,1)] px-4 py-2.5 text-xs rounded-xl hover:scale-105 active:scale-95 transition-all uppercase flex items-center gap-1.5"
          >
            <LogoutIcon className="w-4 h-4 text-on-error" strokeWidth={2.5} />
            Rời Phòng
          </button>
        </div>

        <div className="text-left">
          <h3 className="text-xs font-headline font-black text-on-surface uppercase tracking-wider mb-4">
            Thành viên trong phòng ({roomState.players.length}/5)
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {roomState.players.map((player) => (
              <div
                key={player.userId}
                className="flex justify-between items-center bg-surface border-3 border-on-surface px-4 py-3 rounded-2xl shadow-[2px_2px_0px_0px_rgba(26,28,28,1)]"
              >
                <div className="flex items-center gap-3">
                  <div 
                    className="h-9 w-9 rounded-full border-2 border-on-surface flex items-center justify-center text-xs font-headline font-black uppercase text-on-surface"
                    style={{ backgroundColor: getAvatarBgColor(player.username || player.userId) }}
                  >
                    {player.username ? player.username.slice(0, 2).toUpperCase() : player.userId.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs font-headline font-black uppercase text-on-surface truncate max-w-[120px] flex items-center gap-1">
                      {player.username || player.userId}
                      {roomState.host === player.userId && (
                        <CrownIcon className="w-4 h-4 text-on-surface" strokeWidth={2.5} title="Trưởng phòng" />
                      )}
                    </span>
                    {roomState.host === player.userId && (
                      <span className="text-[7.5px] font-headline font-black text-primary uppercase">Trưởng phòng</span>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center gap-1 font-headline font-black text-[9px] text-on-surface uppercase">
                  <CheckCircleIcon className="w-4 h-4 text-on-surface animate-pulse" strokeWidth={2.5} />
                  <span>Sẵn sàng</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {isHost ? (
          <div className="flex flex-col gap-2 border-t-4 border-dashed border-on-surface-variant pt-6 mt-4">
            <button
              onClick={startGame}
              disabled={roomState.players.length < 2}
              className={`btn-detonator w-full py-4 rounded-2xl font-headline font-black uppercase text-base flex items-center justify-center gap-2
                ${roomState.players.length < 2 ? 'opacity-50 cursor-not-allowed pointer-events-none' : 'hover:animate-shake'}`}
            >
              <RocketIcon className="w-5 h-5" strokeWidth={2.5} />
              <span>BẮT ĐẦU TRẬN ĐẤU</span>
            </button>
            {roomState.players.length < 2 && (
              <p className="text-center text-[10px] font-bold text-on-surface-variant">
                Cần tối thiểu 2 người chơi để khai hỏa trận đấu.
              </p>
            )}
          </div>
        ) : (
          <div className="text-center border-t-4 border-dashed border-on-surface-variant pt-6 mt-4">

            <p className="text-xs font-headline font-black uppercase text-primary animate-pulse flex items-center justify-center gap-1">
              Đang chờ trưởng phòng bắt đầu trận đấu...
            </p>
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
      {/* Top Header Bar matching mockup */}
      <div className="flex justify-between items-center bg-white border-4 border-on-surface rounded-2xl px-6 py-3 shadow-[4px_4px_0px_0px_#1a1c1c] z-20">
        {/* Left: Title & Room ID */}
        <div className="flex items-center gap-3 md:gap-4 flex-wrap">
          <h1 className="arena-title-brutal text-2xl md:text-3xl italic font-black uppercase tracking-tight">
            ARENA BATTLE
          </h1>
          <div className="h-6 w-1 bg-on-surface/20 rounded hidden sm:block" />
          <span className="font-headline font-black text-lg text-on-surface/40 uppercase tracking-widest hidden sm:block">
            _{roomState.code.slice(0, 3)}
          </span>
          <span className="text-[9px] font-headline font-black bg-indigo-50 border-2 border-on-surface text-indigo-700 px-2 py-0.5 rounded-lg shadow-[1px_1px_0px_0px_#1a1c1c] uppercase tracking-wide">
            {t('edition_' + roomState.edition + '_name') || roomState.edition}
          </span>
        </div>

        {/* Right: Header Buttons & Toggle */}
        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-2 bg-yellow-400 text-slate-950 font-headline font-black text-xs px-3.5 py-1.5 rounded-xl border-2 border-on-surface shadow-[2px_2px_0px_0px_rgba(26,28,28,1)]">
            <span>ROOM: {roomState.code}</span>
          </div>
          
          <button
            onClick={() => {
              setIsSidebarOpen(prev => !prev);
              if (!isSidebarOpen) {
                setRightPanelTab('chat');
              }
            }}
            className={`relative font-headline font-black border-2 border-on-surface shadow-[2px_2px_0px_0px_#1a1c1c] px-3.5 py-1.5 rounded-xl text-xs active:translate-y-0.5 active:shadow-none transition-all uppercase ${
              hasUnreadMessages && !isSidebarOpen
                ? 'animate-chat-blink' 
                : 'bg-white text-on-surface hover:bg-slate-50'
            }`}
          >
            {isSidebarOpen ? "Ẩn Chat" : "Hiện Chat"}
            {hasUnreadMessages && !isSidebarOpen && (
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500 border border-on-surface"></span>
              </span>
            )}
          </button>

          <button className="p-1.5 rounded-xl border-2 border-on-surface bg-white shadow-[2px_2px_0px_0px_#1a1c1c] hover:scale-105 active:scale-95 transition-all text-on-surface" title="Cài đặt">
            <GearIcon className="w-5 h-5" />
          </button>
          <button className="p-1.5 rounded-xl border-2 border-on-surface bg-white shadow-[2px_2px_0px_0px_#1a1c1c] hover:scale-105 active:scale-95 transition-all text-on-surface" title="Hướng dẫn">
            <HelpIcon className="w-5 h-5" />
          </button>
          <button className="p-1.5 rounded-xl border-2 border-on-surface bg-white shadow-[2px_2px_0px_0px_#1a1c1c] hover:scale-105 active:scale-95 transition-all text-on-surface" title="Âm thanh">
            <SoundIcon className="w-5 h-5" />
          </button>

          <button
            onClick={handleLeaveConfirm}
            className="bg-secondary text-on-error font-headline font-black border-2 border-on-surface shadow-[2px_2px_0px_0px_#1a1c1c] px-3.5 py-1.5 rounded-xl text-xs hover:scale-105 active:scale-95 transition-all uppercase"
          >
            Thoát
          </button>
        </div>
      </div>

      <div className="relative min-h-[75vh] grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Game Board (Left 3 or 4 columns depending on sidebar toggle) */}
        <div id="game-board-container" className={`${isSidebarOpen ? 'md:col-span-3' : 'md:col-span-4'} flex flex-col justify-between gap-0 border-4 border-on-surface rounded-3xl shadow-[8px_8px_0px_0px_rgba(26,28,28,1)] overflow-hidden bg-[#faf9f6]`}>
          
          {/* Subheader: Turn indicator status */}
          <div className="flex justify-between items-center bg-slate-50 border-b-3 border-on-surface px-6 py-2.5 z-10">
            <div className="flex items-center gap-1.5">
              <span className="text-[9px] font-headline font-black text-on-surface-variant uppercase tracking-widest">Trận đấu đang chơi</span>
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse border border-on-surface" />
            </div>
            {isMyTurn ? (
              <span className="bg-yellow-400 text-slate-950 font-headline font-black text-[10px] px-3.5 py-1.5 rounded-full border-2 border-on-surface shadow-[1.5px_1.5px_0px_0px_#1a1c1c] animate-pulse">
                LƯỢT CỦA BẠN: CẦN BỐC {gameState.drawsRequired} LÁ!
              </span>
            ) : (
              gameState.drawsRequired > 1 && (
                <span className="bg-secondary text-on-error font-headline font-black text-[10px] px-3.5 py-1.5 rounded-full border-2 border-on-surface shadow-[1.5px_1.5px_0px_0px_#1a1c1c] animate-bounce">
                  LƯỢT DỒN BỐC: {gameState.drawsRequired} LẦN!
                </span>
              )
            )}
          </div>

          {/* Game Canvas Container */}
          <div className="flex-grow flex flex-col justify-between dotted-grid-bg p-6 relative select-none min-h-[460px]">
            
            {/* Opponents Row at the top (Horizontal layout) */}
            <div className="flex justify-center items-center gap-5 md:gap-10 w-[calc(100%+3rem)] -mx-6 -mt-6 py-3.5 z-10 border-b-3 border-on-surface bg-slate-50/90 shadow-sm mb-4">
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

            {/* Bottom Row: Player avatar & Hand, nested inside the solid deep red Brutalist bar */}
            <div className={`w-[calc(100%+3rem)] -mx-6 -mb-6 bg-[#b7131a] border-t-4 p-5 z-10 flex flex-col md:flex-row gap-5 items-stretch justify-between transition-all duration-300
              ${isMyTurn 
                ? 'border-yellow-400 animate-pulse-gold-glow' 
                : 'border-on-surface shadow-[0_-4px_0px_0px_#1a1c1c]'}`}>
              <div className="flex items-center justify-center bg-black/15 p-4 rounded-2xl border-2 border-dashed border-white/20 flex-shrink-0">
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
                      <span className="bg-yellow-400 text-slate-950 font-headline font-black text-[9px] uppercase px-2 py-0.5 rounded-lg border-2 border-on-surface shadow-[1px_1px_0px_0px_#1a1c1c] text-center w-full z-10 relative">
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
                <button className="p-2.5 rounded-xl border-2 border-on-surface bg-white shadow-[2px_2px_0px_0px_#1a1c1c] hover:scale-110 active:scale-90 transition-all text-on-surface" title="Biểu cảm nhanh">
                  <SmileIcon className="w-5 h-5 text-on-surface" />
                </button>
                <button className="p-2.5 rounded-xl border-2 border-on-surface bg-white shadow-[2px_2px_0px_0px_#1a1c1c] hover:scale-110 active:scale-90 transition-all text-on-surface" title="Xem khay bài">
                  <CardDrawerIcon className="w-5 h-5 text-on-surface" />
                </button>
              </div>
            </div>

          </div>
        </div>

        {/* Chat & Lịch Sử Panel (Right 1 column) */}
        <div className={`md:col-span-1 bg-white border-4 border-on-surface shadow-[8px_8px_0px_0px_rgba(26,28,28,1)] rounded-3xl p-5 flex flex-col justify-between h-[82vh] ${isSidebarOpen ? 'flex' : 'hidden'}`}>
        <div className="flex flex-col gap-4 flex-1 overflow-hidden">
          
          {/* Header Tab Switcher */}
          <div className="flex border-b-4 border-on-surface pb-2.5 gap-2">
            <button
              onClick={() => setRightPanelTab('chat')}
              className={`flex-1 py-1.5 rounded-xl border-2 border-on-surface font-headline font-black text-xs uppercase shadow-[1.5px_1.5px_0px_0px_rgba(26,28,28,1)] transition-all
                ${rightPanelTab === 'chat' 
                  ? 'bg-primary text-on-primary -translate-y-0.5 shadow-[2.5px_2.5px_0px_0px_rgba(26,28,28,1)]' 
                  : 'bg-surface hover:bg-slate-100'}`}
            >
              Chat
            </button>
            <button
              onClick={() => setRightPanelTab('log')}
              className={`flex-1 py-1.5 rounded-xl border-2 border-on-surface font-headline font-black text-xs uppercase shadow-[1.5px_1.5px_0px_0px_rgba(26,28,28,1)] transition-all
                ${rightPanelTab === 'log' 
                  ? 'bg-primary text-on-primary -translate-y-0.5 shadow-[2.5px_2.5px_0px_0px_rgba(26,28,28,1)]' 
                  : 'bg-surface hover:bg-slate-100'}`}
            >
              Lịch sử
            </button>
          </div>

          {rightPanelTab === 'chat' && (
            <div className="flex-1 flex flex-col gap-4 overflow-hidden">
              {/* Emotes quick buttons */}
              <div className="flex flex-col gap-2">
                <span className="text-[10px] font-headline font-black text-on-surface-variant uppercase tracking-wider">Phát biểu cảm nhanh</span>
                <div className="grid grid-cols-4 gap-2">
                  {EMOTES_LIST.map((emote) => (
                    <button
                      key={emote.id}
                      onClick={() => sendEmote(emote.id)}
                      className="h-10 text-2xl bg-surface border-2 border-on-surface hover:bg-slate-100 rounded-xl transition-all active:scale-90 flex items-center justify-center shadow-[1px_1px_0px_0px_#1a1c1c]"
                    >
                      {emote.char}
                    </button>
                  ))}
                </div>
              </div>

              {/* Chat Messages history */}
              <div className="flex-1 flex flex-col gap-2.5 overflow-y-auto border-t-3 border-dashed border-on-surface-variant pt-3 pr-1 hide-scroll">
                {chatMessages.length === 0 ? (
                  <div className="text-center text-on-surface-variant text-xs py-8 font-sans font-bold italic">
                    Chưa có cuộc hội thoại nào. Chat để trêu đùa đối thủ!
                  </div>
                ) : (
                  chatMessages.map((msg, index) => {
                    const isMe = msg.userId === myUser?.id;
                    return (
                      <div
                        key={index}
                        className={`flex flex-col max-w-[85%] rounded-2xl px-3.5 py-2 text-xs border-3 border-on-surface
                          ${isMe 
                            ? 'self-end chat-bubble-me rounded-tr-none' 
                            : 'self-start chat-bubble-opponent rounded-tl-none'}`}
                      >
                        <span className="font-headline font-black text-[9px] text-on-surface mb-0.5 uppercase">
                          {isMe ? 'BẠN' : msg.username}
                        </span>
                        <p className="leading-relaxed font-sans font-bold">{msg.text}</p>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {rightPanelTab === 'log' && (
            <div className="flex-1 flex flex-col gap-3 overflow-hidden">
              <span className="text-[10px] font-headline font-black text-on-surface-variant uppercase tracking-wider">Nhật ký diễn biến</span>
              <div className="flex-1 flex flex-col gap-2 overflow-y-auto pr-1 hide-scroll bg-surface border-2 border-on-surface rounded-2xl p-3 shadow-[1.5px_1.5px_0px_0px_#1a1c1c]">
                {actionLog.length === 0 ? (
                  <div className="text-center text-on-surface-variant text-xs py-8 font-sans font-bold italic">
                    Chưa có diễn biến nào được ghi nhận.
                  </div>
                ) : (
                  actionLog.map((log) => (
                    <div
                      key={log.id}
                      className="flex justify-between items-start gap-2 border-b border-on-surface/10 pb-1.5 text-xs font-bold font-sans text-on-surface last:border-b-0"
                    >
                      <span className="leading-relaxed flex-1">{log.text}</span>
                      <span className="text-[9px] text-on-surface-variant font-mono whitespace-nowrap bg-slate-100 border border-on-surface px-1 py-0.5 rounded">{log.timestamp}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Input Chat bar */}
        <form onSubmit={handleSendChat} className="flex gap-2 border-t-3 border-on-surface pt-3 mt-2">
          <input
            type="text"
            placeholder={rightPanelTab === 'chat' ? "Gửi tin nhắn hăm dọa..." : "Chuyển sang tab Chat để trò chuyện"}
            disabled={rightPanelTab !== 'chat'}
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            className="flex-1 bg-surface border-2 border-on-surface rounded-xl px-3 py-2 text-xs text-on-surface font-bold focus:outline-none focus:bg-white transition-all shadow-[1.5px_1.5px_0px_0px_#1a1c1c] disabled:opacity-50 disabled:cursor-not-allowed"
          />
          <button
            type="submit"
            disabled={rightPanelTab !== 'chat'}
            className="px-4 py-2 bg-primary text-on-primary font-headline font-black rounded-xl text-xs border-2 border-on-surface shadow-[1.5px_1.5px_0px_0px_#1a1c1c] active:translate-y-0.5 active:shadow-none hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
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
        isConfirm={true}
        onConfirm={dialogState.onConfirm}
        onCancel={() => setDialogState({ isOpen: false })}
      />
    </div>
  );
}
