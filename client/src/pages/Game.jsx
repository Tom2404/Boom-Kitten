import React, { useState, useEffect, useRef } from 'react';
import { useGame } from '../hooks/useGame.js';
import PlayerAvatar from '../components/PlayerAvatar.jsx';
import PlayerHand from '../components/PlayerHand.jsx';
import DeckPile from '../components/DeckPile.jsx';
import DiscardPile from '../components/DiscardPile.jsx';
import Card from '../components/Card.jsx';
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


function FlyingCard({ id, type, cardType, startPos, endPos, onComplete }) {
  const elementRef = useRef(null);

  useEffect(() => {
    if (!elementRef.current) return;

    // Set initial state
    gsap.set(elementRef.current, {
      x: startPos.x - 64, // center horizontally (w-32 is 128px)
      y: startPos.y - 88, // center vertically (h-44 is 176px)
      scale: 0.2,
      opacity: 0,
      rotation: type === 'draw' ? 90 : 0,
    });

    // Animate to end position
    gsap.to(elementRef.current, {
      x: endPos.x - 64,
      y: endPos.y - 88,
      scale: 1,
      opacity: 1,
      rotation: type === 'draw' ? 0 : Math.random() * 30 - 15,
      duration: 0.55,
      ease: 'power2.out',
      onComplete: () => {
        gsap.to(elementRef.current, {
          opacity: 0,
          scale: type === 'draw' ? 0.8 : 1.15,
          duration: 0.15,
          onComplete,
        });
      },
    });
  }, [startPos, endPos, type, onComplete]);

  return (
    <div
      ref={elementRef}
      className="absolute pointer-events-none z-[9999]"
      style={{ width: '128px', height: '176px' }}
    >
      {type === 'draw' ? (
        <div className="h-full w-full rounded-xl border-3 border-on-surface bg-primary-container flex items-center justify-center p-3 select-none shadow-xl">
          <div className="absolute inset-1.5 border-2 border-dashed border-on-primary-container/30 rounded-lg flex flex-col items-center justify-center">
            <span className="text-3xl">🐾</span>
          </div>
        </div>
      ) : (
        <div className="scale-90 shadow-2xl">
          <Card type={cardType} disabled={true} />
        </div>
      )}
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

const EDITION_NAMES = {
  original: 'Bản Gốc 🐱',
  '2_player': 'Bản 2 Người 👥',
  zombie: 'Mèo Thây Ma 🧟',
  barking: 'Mèo Sủa 🐶',
  good_vs_evil: 'Thiện và Ác ⚖️',
  imploding: 'Mèo Sập Nguồn 💥🙀',
  streaking: 'Mèo Vệt Đuôi ☄️',
  expansion_mix: 'Đại Hỗn Chiến 🌪️',
};

export default function Game() {
  const {
    socket,
    roomState,
    gameState,
    privateHand,
    nopeWindow,
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

  const [roomInput, setRoomInput] = useState('');
  const [targetPlayerId, setTargetPlayerId] = useState(null);

  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [lobbyMaxPlayers, setLobbyMaxPlayers] = useState(5);
  const [lobbyMaxHandSize, setLobbyMaxHandSize] = useState(10);
  const [lobbyIsPublic, setLobbyIsPublic] = useState(true);
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

  const [animations, setAnimations] = useState([]);
  const mainContainerRef = useRef(null);

  const getRelativeCenter = (targetId) => {
    if (!mainContainerRef.current) return null;
    const target = document.getElementById(targetId);
    if (!target) return null;
    const targetRect = target.getBoundingClientRect();
    const parentRect = mainContainerRef.current.getBoundingClientRect();
    return {
      x: targetRect.left - parentRect.left + targetRect.width / 2,
      y: targetRect.top - parentRect.top + targetRect.height / 2,
    };
  };

  useEffect(() => {
    if (!socket) return;

    const handleCardDrawn = ({ playerId }) => {
      setTimeout(() => {
        const startPos = getRelativeCenter('deck-pile-element');
        const targetId = playerId === myUser?.id ? 'player-hand-container' : `player-avatar-${playerId}`;
        const endPos = getRelativeCenter(targetId);
        
        if (startPos && endPos) {
          const animId = `${Date.now()}-${Math.random()}`;
          setAnimations((prev) => [
            ...prev,
            {
              id: animId,
              type: 'draw',
              startPos,
              endPos,
            },
          ]);
        }
      }, 50);
    };

    const handleCardPlayed = ({ playerId, cardType }) => {
      if (cardType === 'nope') {
        // Trigger a quick sharp board shake
        gsap.fromTo(
          '#game-board-container',
          { x: -6 },
          {
            x: 6,
            duration: 0.04,
            repeat: 6,
            yoyo: true,
            onComplete: () => {
              gsap.set('#game-board-container', { x: 0 });
            },
          }
        );

        // Show large "NOPE!" text splash
        setNopeAlert({ active: true, text: 'NOPE!' });
        setTimeout(() => {
          setNopeAlert(null);
        }, 1200);
      }

      setTimeout(() => {
        const targetId = playerId === myUser?.id ? 'player-hand-container' : `player-avatar-${playerId}`;
        const startPos = getRelativeCenter(targetId);
        const endPos = getRelativeCenter('discard-pile-element');
        
        if (startPos && endPos) {
          const animId = `${Date.now()}-${Math.random()}`;
          setAnimations((prev) => [
            ...prev,
            {
              id: animId,
              type: 'play',
              cardType,
              startPos,
              endPos,
            },
          ]);
        }
      }, 50);
    };

    const handleDrewKitten = ({ playerId, username, cardType }) => {
      // Shake the board longer and wider
      gsap.fromTo(
        '#game-board-container',
        { x: -14 },
        {
          x: 14,
          duration: 0.05,
          repeat: 16,
          yoyo: true,
          onComplete: () => {
            gsap.set('#game-board-container', { x: 0 });
          },
        }
      );

      // Trigger red screen border flash
      setIsRedFlashActive(true);
      setTimeout(() => {
        setIsRedFlashActive(false);
      }, 1500);

      // Show warning banner overlay
      setDrewKittenAlert({ active: true, playerName: username, cardType });
      setTimeout(() => {
        setDrewKittenAlert(null);
      }, 3000);
    };

    const handleExploded = ({ playerId }) => {
      gsap.fromTo(
        '#game-board-container',
        { x: -12 },
        {
          x: 12,
          duration: 0.05,
          repeat: 12,
          yoyo: true,
          onComplete: () => {
            gsap.set('#game-board-container', { x: 0 });
          },
        }
      );

      setTimeout(() => {
        const targetId = playerId === myUser?.id ? 'player-hand-container' : `player-avatar-${playerId}`;
        const startPos = getRelativeCenter(targetId);
        if (startPos) {
          const animId = `${Date.now()}-${Math.random()}`;
          setAnimations((prev) => [
            ...prev,
            {
              id: animId,
              type: 'explosion',
              startPos,
            },
          ]);
        }
      }, 50);
    };

    socket.on('game:cardDrawn', handleCardDrawn);
    socket.on('game:drewKitten', handleDrewKitten);
    socket.on('game:cardPlayed', handleCardPlayed);
    socket.on('game:exploded', handleExploded);

    return () => {
      socket.off('game:cardDrawn', handleCardDrawn);
      socket.off('game:drewKitten', handleDrewKitten);
      socket.off('game:cardPlayed', handleCardPlayed);
      socket.off('game:exploded', handleExploded);
    };
  }, [socket, myUser]);

  if (!myUser) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center gap-6 bg-white border-4 border-on-surface shadow-[8px_8px_0px_0px_rgba(26,28,28,1)] rounded-3xl p-8 max-w-md mx-auto">
        <span className="text-6xl animate-bounce">🔒</span>
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
    return (
      <div className="w-full max-w-5xl mx-auto my-6 flex flex-col gap-6 animate-fade-in">
        {/* Header with Coins and Gems */}
        <div className="flex justify-end gap-3">
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
            onClick={() => setIsCreateModalOpen(true)}
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
                  <th className="py-3.5 px-6 text-center">PLAYERS</th>
                  <th className="py-3.5 px-6 text-center">STATUS</th>
                  <th className="py-3.5 px-6 text-right">ACTION</th>
                </tr>
              </thead>
              <tbody className="divide-y-2 divide-slate-100 font-sans font-bold text-xs text-on-surface">
                {publicRooms.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="py-12 text-center text-on-surface-variant italic font-bold">
                      Không có phòng công khai nào đang chờ... Hãy tự tạo phòng đấu của riêng bạn!
                    </td>
                  </tr>
                ) : (
                  publicRooms.map((room) => {
                    const isFull = room.players.length >= room.maxPlayers;
                    return (
                      <tr key={room.code} className="hover:bg-slate-50 transition-colors">
                        <td className="py-4 px-6 font-headline font-black text-primary uppercase text-sm">
                          {room.code}
                        </td>
                        <td className="py-4 px-6">{room.players[0]?.username || 'Ẩn danh'}</td>
                        <td className="py-4 px-6">
                          <span className="text-[9px] font-headline font-black text-indigo-600 bg-indigo-50 border-2 border-indigo-200 px-2.5 py-0.5 rounded-lg">
                            {EDITION_NAMES[room.edition] || room.edition}
                          </span>
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
                <div className="flex justify-between items-center text-xs font-bold text-on-surface">
                  <span className="flex items-center gap-1.5"><PublicIcon className="w-4 h-4 text-on-surface" strokeWidth={2.5} /> Chế độ phòng:</span>
                  <select 
                    value={lobbyIsPublic ? "public" : "private"} 
                    onChange={(e) => setLobbyIsPublic(e.target.value === "public")}
                    className="bg-white border-2 border-on-surface px-2.5 py-1 rounded-xl text-xs font-headline font-black focus:outline-none"
                  >
                    <option value="public">Công khai</option>
                    <option value="private">Riêng tư</option>
                  </select>
                </div>

                <div className="flex justify-between items-center text-xs font-bold text-on-surface relative">
                  <span className="flex items-center gap-1.5"><ExtensionIcon className="w-4 h-4 text-on-surface" strokeWidth={2.5} /> Phiên bản:</span>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setIsEditionDropdownOpen(!isEditionDropdownOpen)}
                      className="bg-white border-2 border-on-surface px-3 py-1.5 rounded-xl text-xs font-headline font-black focus:outline-none flex items-center gap-1.5 hover:bg-slate-100 transition-all shadow-[1.5px_1.5px_0px_0px_#1a1c1c] active:translate-y-0.5 active:shadow-none min-w-[155px] justify-between text-slate-950"
                    >
                      <span>{EDITION_NAMES[lobbyEdition]}</span>
                      <span className={`text-[9px] transition-transform duration-200 ${isEditionDropdownOpen ? 'rotate-180' : ''}`}>▼</span>
                    </button>
                    {isEditionDropdownOpen && (
                      <>
                        <div 
                          className="fixed inset-0 z-40" 
                          onClick={() => setIsEditionDropdownOpen(false)}
                        />
                        <div className="absolute right-0 mt-2 w-60 bg-white border-2 border-on-surface rounded-2xl shadow-[4px_4px_0px_0px_#1a1c1c] z-50 overflow-hidden py-1 max-h-64 overflow-y-auto animate-fade-in custom-scrollbar">
                          {Object.entries(EDITION_NAMES).map(([key, label]) => (
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
                              <span>{label}</span>
                              {lobbyEdition === key && <span className="text-[10px]">✔</span>}
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
              </div>

              <button
                onClick={() => {
                  createRoom(createPassword, lobbyIsPublic, lobbyEdition);

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
                {EDITION_NAMES[roomState.edition] || roomState.edition || EDITION_NAMES.original}
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
    return opp && opp.alive;
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
    <div ref={mainContainerRef} className="flex flex-col gap-5 w-full select-none">
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
            {EDITION_NAMES[roomState.edition] || roomState.edition || EDITION_NAMES.original}
          </span>
        </div>

        {/* Right: Header Buttons & Toggle */}
        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-2 bg-yellow-400 text-slate-950 font-headline font-black text-xs px-3.5 py-1.5 rounded-xl border-2 border-on-surface shadow-[2px_2px_0px_0px_rgba(26,28,28,1)]">
            <span>ROOM: {roomState.code}</span>
          </div>
          
          <button
            onClick={() => setIsSidebarOpen(prev => !prev)}
            className="bg-white text-on-surface hover:bg-slate-50 font-headline font-black border-2 border-on-surface shadow-[2px_2px_0px_0px_#1a1c1c] px-3.5 py-1.5 rounded-xl text-xs active:translate-y-0.5 active:shadow-none transition-all uppercase"
          >
            {isSidebarOpen ? "Ẩn Chat" : "Hiện Chat"}
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
                👉 LƯỢT CỦA BẠN: CẦN BỐC {gameState.drawsRequired} LÁ!
              </span>
            ) : (
              gameState.drawsRequired > 1 && (
                <span className="bg-secondary text-on-error font-headline font-black text-[10px] px-3.5 py-1.5 rounded-full border-2 border-on-surface shadow-[1.5px_1.5px_0px_0px_#1a1c1c] animate-bounce">
                  ⚠️ LƯỢT DỒN BỐC: {gameState.drawsRequired} LẦN!
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

              <div className="grid grid-cols-[auto_minmax(160px,220px)_auto] items-center justify-center gap-6 md:gap-8 z-10">
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
                      🎯 Mục tiêu: {opponents.find((o) => o.userId === targetPlayerId)?.username || targetPlayerId}
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
                  discardPile={gameState.discardPile}
                  pendingCombo5={gameState.pendingCombo5}
                  myUserId={myUser.id}
                  onSelectCard={respondCombo5}
                  compact
                />
              </div>
            </div>

            {/* Bottom Row: Player avatar & Hand, nested inside the solid deep red Brutalist bar */}
            <div className="w-[calc(100%+3rem)] -mx-6 -mb-6 bg-[#b7131a] border-t-4 border-on-surface p-5 z-10 flex flex-col md:flex-row gap-5 items-stretch justify-between shadow-[0_-4px_0px_0px_#1a1c1c]">
              <div className="flex items-center justify-center bg-black/15 p-4 rounded-2xl border-2 border-dashed border-white/20 flex-shrink-0">
                {myPlayerState && (
                  <div className="flex flex-col items-center gap-4 relative">
                    <PlayerAvatar
                      player={myPlayerState}
                      isCurrentTurn={isMyTurn}
                      isTargetable={false}
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
              Chat 💬
            </button>
            <button
              onClick={() => setRightPanelTab('log')}
              className={`flex-1 py-1.5 rounded-xl border-2 border-on-surface font-headline font-black text-xs uppercase shadow-[1.5px_1.5px_0px_0px_rgba(26,28,28,1)] transition-all
                ${rightPanelTab === 'log' 
                  ? 'bg-primary text-on-primary -translate-y-0.5 shadow-[2.5px_2.5px_0px_0px_rgba(26,28,28,1)]' 
                  : 'bg-surface hover:bg-slate-100'}`}
            >
              Lịch sử 📜
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

      {/* 4. Nope Countdown Banner */}
      {nopeWindow && nopeWindow.active && (
        <NopeCountdown
          eventId={nopeWindow.eventId}
          timeoutMs={nopeWindow.timeoutMs}
          hasNopeCard={hasNopeCard}
          onPlayNope={() => playNope(nopeWindow.eventId)}
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
          title="🗑️ Thu Gom Rác (Garbage Collection)"
          description="Hãy chọn 1 lá bài từ tay của bạn để bỏ ngược lại vào bộ bài bốc."
          onRespond={respondGarbage}
        />
      )}

      {/* 7. Pot Luck Request Modal */}
      {potLuckRequest && potLuckRequest.active && (
        <GarbageSelectModal
          hand={privateHand}
          title="🍲 Góp Nồi (Pot Luck)"
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
          <div className="fixed inset-0 z-50 overflow-y-auto bg-[#faf9f6] flex flex-col items-center justify-between p-6 md:p-8 animate-fade-in select-none">
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
                      📋 MATCH SUMMARY
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
                      🎁 LOOT EARNED
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
                        <span className="text-2xl mb-1">🔥</span>
                        <span className={`font-headline font-black text-[11px] uppercase ${eloChange >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
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
                        🎉 RANK UP REWARD: +{pinkCoinEarned} PINK COINS!
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
                  🚀 PLAY AGAIN
                </button>
                <button
                  onClick={() => {
                    setGameEnded(null);
                    leaveRoom();
                  }}
                  className="flex-1 bg-white text-slate-950 font-headline font-black text-sm uppercase py-3.5 rounded-2xl border-3 border-slate-950 shadow-[4px_4px_0px_0px_#1a1c1c] active:translate-x-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0px_0px_#1a1c1c] hover:-translate-y-0.5 transition-all duration-100 flex items-center justify-center gap-2"
                >
                  🏠 RETURN TO LOBBY
                </button>
              </div>

            </div>
          </div>
        );
      })()}
      {animations.map((anim) => {
        if (anim.type === 'explosion') {
          return (
            <ParticleExplosion
              key={anim.id}
              startPos={anim.startPos}
              onComplete={() => setAnimations((prev) => prev.filter((a) => a.id !== anim.id))}
            />
          );
        }
        return (
          <FlyingCard
            key={anim.id}
            id={anim.id}
            type={anim.type}
            cardType={anim.cardType}
            startPos={anim.startPos}
            endPos={anim.endPos}
            onComplete={() => setAnimations((prev) => prev.filter((a) => a.id !== anim.id))}
          />
        );
      })}

      {isRedFlashActive && (
        <div className="fixed inset-0 pointer-events-none z-[99999] border-[16px] animate-border-flash-red rounded-3xl" />
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
