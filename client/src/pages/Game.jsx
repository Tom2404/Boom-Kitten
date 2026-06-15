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
} from '../components/ActionModals.jsx';
import CustomDialog from '../components/CustomDialog.jsx';

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
    playCombo,
    respondCombo5,
    sendChatMessage,
    sendEmote,
    actionLog,
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
  
  const [chatInput, setChatInput] = useState('');
  const [myUser, setMyUser] = useState(null);
  const [rightPanelTab, setRightPanelTab] = useState('chat');
  const [dialogState, setDialogState] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: null,
  });

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

  useEffect(() => {
    if (!roomState) {
      fetchPublicRooms();
      const interval = setInterval(fetchPublicRooms, 5000);
      return () => clearInterval(interval);
    }
  }, [roomState]);

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

  useEffect(() => {
    if (gameEnded) {
      gsap.fromTo('.ended-overlay-anim', 
        { scale: 0.4, rotation: -8, opacity: 0 },
        { scale: 1, rotation: 0, opacity: 1, duration: 0.65, ease: 'back.out(1.5)' }
      );
    }
  }, [gameEnded]);

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
    socket.on('game:cardPlayed', handleCardPlayed);
    socket.on('game:exploded', handleExploded);

    return () => {
      socket.off('game:cardDrawn', handleCardDrawn);
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
  if (!roomState) {
    return (
      <div className="max-w-md mx-auto my-6 bg-white border-4 border-on-surface shadow-[8px_8px_0px_0px_rgba(26,28,28,1)] rounded-3xl p-8 flex flex-col gap-6">
        <div className="text-center flex flex-col items-center">
          <span className="text-6xl animate-bounce">🐱💥</span>
          <h2 className="text-2xl font-headline font-black text-on-surface uppercase mt-3">Đấu Trường Mèo Nổ</h2>
          <p className="text-xs font-bold text-on-surface-variant mt-1">Tạo phòng chơi mới hoặc gia nhập phòng có sẵn.</p>
        </div>

        <div className="flex flex-col gap-4 border-t-4 border-dashed border-on-surface-variant pt-6">
          <h3 className="text-xs font-headline font-black text-on-surface uppercase tracking-wider">Tạo phòng chơi</h3>
          
          <div className="flex flex-col gap-3 bg-slate-50 p-4 border-2 border-on-surface rounded-2xl">
            <div className="flex justify-between items-center text-xs font-bold text-on-surface">
              <span>Chế độ phòng:</span>
              <select 
                value={lobbyIsPublic ? "public" : "private"} 
                onChange={(e) => setLobbyIsPublic(e.target.value === "public")}
                className="bg-white border-2 border-on-surface px-2 py-1 rounded-lg text-xs font-bold focus:outline-none"
              >
                <option value="public">Công khai (Public)</option>
                <option value="private">Riêng tư (Private)</option>
              </select>
            </div>
            
            <div className="flex flex-col gap-1.5 text-xs font-bold text-on-surface">
              <span>Mật khẩu phòng (nếu muốn):</span>
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
            onClick={() => createRoom(createPassword, lobbyIsPublic)}
            className="btn-detonator w-full py-4 rounded-2xl font-headline font-black uppercase text-sm"
          >
            Tạo Phòng Mới
          </button>
        </div>

        <div className="flex flex-col gap-4 border-t-4 border-dashed border-on-surface-variant pt-6">
          <h3 className="text-xs font-headline font-black text-on-surface uppercase tracking-wider">Tham gia phòng có sẵn</h3>
          <div className="flex flex-col gap-3">
            <input
              type="text"
              placeholder="MÃ PHÒNG (6 CHỮ CÁI)"
              value={roomInput}
              onChange={(e) => setRoomInput(e.target.value.toUpperCase())}
              className="w-full bg-surface border-3 border-on-surface rounded-2xl px-4 py-3 text-on-surface font-headline font-black uppercase tracking-widest text-center text-sm focus:outline-none focus:bg-white transition-all shadow-[3px_3px_0px_0px_rgba(26,28,28,1)]"
            />
            <input
              type="password"
              placeholder="MẬT KHẨU PHÒNG (NẾU CÓ)"
              value={joinPassword}
              onChange={(e) => setJoinPassword(e.target.value)}
              className="w-full bg-surface border-3 border-on-surface rounded-2xl px-4 py-3 text-on-surface font-headline font-black uppercase text-center text-sm focus:outline-none focus:bg-white transition-all shadow-[3px_3px_0px_0px_rgba(26,28,28,1)]"
            />
            <button
              onClick={() => joinRoom(roomInput, joinPassword)}
              className="w-full py-4 bg-yellow-400 text-slate-950 font-headline font-black uppercase rounded-2xl border-3 border-on-surface shadow-[3px_3px_0px_0px_rgba(26,28,28,1)] hover:scale-105 active:scale-95 transition-all text-sm"
            >
              Vào Phòng
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-4 border-t-4 border-dashed border-on-surface-variant pt-6">
          <div className="flex justify-between items-center">
            <h3 className="text-xs font-headline font-black text-on-surface uppercase tracking-wider">Danh sách phòng chờ</h3>
            <button 
              onClick={fetchPublicRooms} 
              className="text-[10px] font-headline font-black text-primary hover:underline uppercase flex items-center gap-1"
            >
              🔄 Làm mới
            </button>
          </div>
          
          {publicRooms.length === 0 ? (
            <p className="text-center text-xs font-bold text-on-surface-variant py-4 italic bg-slate-50 border-2 border-on-surface rounded-2xl">
              Không có phòng chờ công khai nào.
            </p>
          ) : (
            <div className="flex flex-col gap-2 max-h-[200px] overflow-y-auto pr-1 hide-scroll">
              {publicRooms.map((room) => (
                <div 
                  key={room.code} 
                  className="flex justify-between items-center bg-surface border-2 border-on-surface p-3 rounded-xl shadow-[2px_2px_0px_0px_#1a1c1c] text-xs font-bold"
                >
                  <div className="flex flex-col">
                    <span className="font-headline font-black text-primary uppercase text-[10px]">MÃ: {room.code}</span>
                    <span className="text-[10px] text-on-surface-variant">Chủ phòng: {room.players[0]?.username || 'Ẩn danh'}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] bg-slate-100 border border-on-surface px-1.5 py-0.5 rounded font-headline font-black text-on-surface">
                      👤 {room.players.length}/{room.maxPlayers}
                    </span>
                    {room.password && (
                      <span className="text-[10px]" title="Yêu cầu mật khẩu">🔒</span>
                    )}
                    <button
                      onClick={() => {
                        setRoomInput(room.code);
                        if (room.password) {
                          const pwd = window.prompt("Nhập mật khẩu của phòng:") || '';
                          joinRoom(room.code, pwd);
                        } else {
                          joinRoom(room.code);
                        }
                      }}
                      className="bg-primary text-on-primary font-headline font-black px-3 py-1 text-[10px] rounded-lg border border-on-surface shadow-[1px_1px_0px_0px_#1a1c1c] hover:scale-105 active:scale-95 transition-all uppercase"
                    >
                      Vào
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  const isHost = roomState.host === myUser.id;

  // ==========================================
  // VIEW 2: LOBBY WAITING SCREEN
  // ==========================================
  if (roomState.status === 'waiting') {
    return (
      <div className="max-w-xl mx-auto my-6 bg-white border-4 border-on-surface shadow-[8px_8px_0px_0px_rgba(26,28,28,1)] rounded-3xl p-8 flex flex-col gap-6">
        <div className="flex justify-between items-start border-b-4 border-on-surface pb-4 flex-wrap gap-4">
          <div>
            <h2 className="text-2xl font-headline font-black text-on-surface uppercase">Phòng Chờ Trận Đấu</h2>
            <div className="flex items-center gap-2 mt-1.5">
              <span className="text-[10px] font-headline font-black text-on-surface-variant uppercase">Mã Phòng:</span>
              <span className="bg-yellow-400 text-slate-950 font-headline font-black text-sm px-3 py-1 rounded-xl border-2 border-on-surface shadow-[2px_2px_0px_0px_rgba(26,28,28,1)]">
                {roomState.code}
              </span>
            </div>
          </div>
          <button
            onClick={handleLeaveConfirm}
            className="bg-secondary text-on-error font-headline font-black border-2 border-on-surface shadow-[2px_2px_0px_0px_rgba(26,28,28,1)] px-4 py-2 text-xs rounded-xl hover:scale-105 active:scale-95 transition-all uppercase"
          >
            Rời Phòng
          </button>
        </div>

        <div>
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
                  <div className="h-9 w-9 rounded-full bg-primary-fixed border-2 border-on-surface flex items-center justify-center text-xs font-headline font-black uppercase text-on-surface">
                    {player.username ? player.username.slice(0, 2).toUpperCase() : player.userId.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs font-headline font-black uppercase text-on-surface truncate max-w-[120px]">
                      {player.username || player.userId}
                    </span>
                    {roomState.host === player.userId && (
                      <span className="text-[8px] font-headline font-black text-primary uppercase">👑 Trưởng phòng</span>
                    )}
                  </div>
                </div>
                <span className="text-[9px] font-headline font-black text-emerald-600 uppercase flex items-center gap-1">
                  🟢 Sẵn sàng
                </span>
              </div>
            ))}
          </div>
        </div>

        {isHost ? (
          <div className="flex flex-col gap-2 border-t-4 border-dashed border-on-surface-variant pt-6 mt-4">
            <button
              onClick={startGame}
              disabled={roomState.players.length < 2}
              className={`btn-detonator w-full py-4 rounded-2xl font-headline font-black uppercase text-base
                ${roomState.players.length < 2 ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''}`}
            >
              🚀 KHAI HỎA TRẬN ĐẤU 💣
            </button>
            {roomState.players.length < 2 && (
              <p className="text-center text-[10px] font-bold text-on-surface-variant">
                Cần tối thiểu 2 người chơi để khai hỏa trận đấu.
              </p>
            )}
          </div>
        ) : (
          <div className="text-center border-t-4 border-dashed border-on-surface-variant pt-6 mt-4">
            <p className="text-xs font-headline font-black uppercase text-primary animate-pulse">
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
    <div ref={mainContainerRef} className="relative min-h-[82vh] grid grid-cols-1 lg:grid-cols-4 gap-6">
      {/* Game Board (Left 3 or 4 columns depending on sidebar toggle) */}
      <div id="game-board-container" className={`${isSidebarOpen ? 'lg:col-span-3' : 'lg:col-span-4'} flex flex-col justify-between gap-6 border-4 border-on-surface rounded-3xl shadow-[8px_8px_0px_0px_rgba(26,28,28,1)] overflow-hidden bg-[#2f3131]`}>
        
        {/* Header: Room Code and Info */}
        <div className="flex justify-between items-center bg-surface border-b-4 border-on-surface px-6 py-3.5 z-10">
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-headline font-black text-on-surface-variant uppercase tracking-widest">Phòng chơi:</span>
            <span className="bg-yellow-400 text-slate-950 font-headline font-black text-xs px-3 py-1 rounded-xl border-2 border-on-surface shadow-[2px_2px_0px_0px_rgba(26,28,28,1)]">
              {roomState.code}
            </span>
          </div>

          <div className="flex items-center gap-3">
            {gameState.drawsRequired > 1 && (
              <span className="bg-secondary text-on-error font-headline font-black text-xs px-4 py-1.5 rounded-full border-2 border-on-surface shadow-[2px_2px_0px_0px_rgba(26,28,28,1)] animate-bounce">
                ⚠️ LƯỢT DỒN BỐC: {gameState.drawsRequired} lượt!
              </span>
            )}
            <button
              onClick={() => setIsSidebarOpen(prev => !prev)}
              className="bg-primary text-on-primary font-headline font-black border-2 border-on-surface shadow-[2.5px_2.5px_0px_0px_#1a1c1c] px-3.5 py-1.5 rounded-xl text-xs hover:scale-105 active:scale-95 transition-all uppercase"
            >
              {isSidebarOpen ? "Ẩn Chat" : "Hiện Chat"}
            </button>
            <button
              onClick={handleLeaveConfirm}
              className="bg-secondary text-on-error font-headline font-black border-2 border-on-surface shadow-[2.5px_2.5px_0px_0px_#1a1c1c] px-3.5 py-1.5 rounded-xl text-xs hover:scale-105 active:scale-95 transition-all uppercase"
            >
              Rời Phòng
            </button>
          </div>
        </div>

        {/* Game Canvas Container */}
        <div className="flex-grow flex flex-col justify-between felt-bg p-6 relative select-none">
          
          {/* Circular Board Container */}
          <div className="flex justify-center gap-4 flex-wrap md:flex-none md:block w-full relative min-h-[160px] md:min-h-[420px] flex-grow py-2 z-10">
            {getOrderedOpponents().map((opp, idx) => (
              <div key={opp.userId} className={getOpponentPositionClass(idx, opponents.length)}>
                <PlayerAvatar
                  player={opp}
                  isCurrentTurn={activePlayerId === opp.userId}
                  isTargetable={isOpponentTargetable(opp.userId)}
                  isSelectedTarget={targetPlayerId === opp.userId}
                  onSelectTarget={(id) => setTargetPlayerId(prev => prev === id ? null : id)}
                />
              </div>
            ))}

            {/* Board Center: Deck and Discard Pile */}
            <div className="md:absolute md:top-1/2 md:left-1/2 md:transform md:-translate-x-1/2 md:-translate-y-1/2 flex justify-center items-center gap-6 md:gap-16 py-6 z-10 w-full md:w-auto relative">
              {/* Rotating play direction arrows background */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0 overflow-visible">
                <div className={`w-[26rem] h-[26rem] border-4 border-dashed border-white/5 rounded-full flex items-center justify-center transition-all duration-500 ${gameState.playDirection === -1 ? 'animate-spin-ccw border-rose-500/10' : 'animate-spin-cw border-emerald-500/10'}`}>
                  {/* Curved arrows/pointers */}
                  <span className={`absolute top-4 text-2xl font-black transition-colors ${gameState.playDirection === -1 ? 'text-rose-500/20' : 'text-emerald-500/20'}`}>▶</span>
                  <span className={`absolute right-4 text-2xl font-black rotate-90 transition-colors ${gameState.playDirection === -1 ? 'text-rose-500/20' : 'text-emerald-500/20'}`}>▶</span>
                  <span className={`absolute bottom-4 text-2xl font-black rotate-180 transition-colors ${gameState.playDirection === -1 ? 'text-rose-500/20' : 'text-emerald-500/20'}`}>▶</span>
                  <span className={`absolute left-4 text-2xl font-black -rotate-90 transition-colors ${gameState.playDirection === -1 ? 'text-rose-500/20' : 'text-emerald-500/20'}`}>▶</span>
                </div>
              </div>

              <DeckPile
                count={gameState.deckCount ?? 0}
                onDraw={drawCard}
                isMyTurn={isMyTurn}
                disabled={!!gameState.pendingFavor || !!gameState.pendingAlter || (nopeWindow && nopeWindow.active) || privateHand.length > (gameState.maxHandSize ?? 10)}
              />

              {/* Announcer and Status Message Board */}
              <div className="flex flex-col items-center gap-3 max-w-[260px] text-center z-10">
                <div className="bg-white border-3 border-on-surface rounded-2xl px-5 py-4 shadow-[4px_4px_0px_0px_#1a1c1c] min-w-[220px]">
                  <span className="text-[10px] font-headline font-black text-primary uppercase tracking-widest block mb-1">
                    Hành Động
                  </span>
                  <p className="text-xs font-sans font-bold text-on-surface leading-relaxed min-h-[48px] flex items-center justify-center">
                    {getStatusDisplay()}
                  </p>
                </div>
                
                {targetPlayerId && (
                  <div className="bg-yellow-400 border-2 border-on-surface text-slate-950 text-[9px] font-headline font-black uppercase tracking-wider px-3.5 py-1 rounded-full flex items-center gap-1.5 shadow-[2px_2px_0px_0px_#1a1c1c]">
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
              />
            </div>
          </div>

          {/* Bottom Row: Player's own avatar & Player's hand */}
          <div className="flex flex-col md:flex-row gap-6 items-stretch border-t-4 border-dashed border-on-surface-variant pt-6 z-10">
            <div className="flex items-center justify-center bg-white/10 p-3 rounded-2xl border-2 border-dashed border-white/20">
              {myPlayerState && (
                <PlayerAvatar
                  player={myPlayerState}
                  isCurrentTurn={isMyTurn}
                  isTargetable={false}
                />
              )}
            </div>
            
            <div className="flex-1 overflow-x-auto hide-scroll">
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
          </div>
        </div>
      </div>

      {/* Chat & Lịch Sử Panel (Right 1 column) */}
      <div className={`lg:col-span-1 bg-white border-4 border-on-surface shadow-[8px_8px_0px_0px_rgba(26,28,28,1)] rounded-3xl p-5 flex flex-col justify-between h-[82vh] ${isSidebarOpen ? 'flex' : 'hidden'}`}>
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
                        className={`flex flex-col max-w-[85%] rounded-2xl px-3.5 py-2 text-xs border-2 border-on-surface shadow-[2px_2px_0px_0px_rgba(26,28,28,1)]
                          ${isMe 
                            ? 'self-end bg-primary-container text-on-primary-container rounded-tr-none' 
                            : 'self-start bg-surface text-on-surface rounded-tl-none'}`}
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

      {/* 9. Game Ended Win Overlay */}
      {gameEnded && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur p-4 animate-fade-in">
          <div className="ended-overlay-anim w-full max-w-md bg-white border-4 border-on-surface rounded-3xl p-6 shadow-[8px_8px_0px_0px_rgba(26,28,28,1)] flex flex-col items-center gap-6 text-center">
            
            <div className="flex flex-col items-center">
              <span className="text-7xl animate-bounce">
                {gameEnded.winnerId === myUser.id ? '🏆😸' : '💀😿'}
              </span>
              <h2 className="text-3xl font-headline font-black mt-3 text-on-surface uppercase">
                {gameEnded.winnerId === myUser.id ? 'BẠN CHIẾN THẮNG!' : 'BẠN ĐÃ THUA CUỘC'}
              </h2>
              <p className="text-xs font-bold text-on-surface-variant mt-1">
                Kẻ sống sót cuối cùng: <strong className="text-primary uppercase">{gameEnded.winnerId}</strong>
              </p>
            </div>

            {/* Placements */}
            <div className="w-full bg-surface border-3 border-on-surface rounded-2xl p-4 flex flex-col gap-2 shadow-[3px_3px_0px_0px_rgba(26,28,28,1)]">
              <h3 className="text-xs font-headline font-black text-on-surface-variant uppercase tracking-widest text-left pb-1.5 border-b-2 border-on-surface">
                Thứ hạng chung cuộc
              </h3>
              {gameEnded.rankings.map((rank, index) => (
                <div key={index} className="flex justify-between items-center text-xs py-1">
                  <span className="text-on-surface font-bold uppercase text-[10px]">
                    #{index + 1} {rank.userId}
                  </span>
                  <span className={`font-headline font-black uppercase tracking-wider text-[9px]
                    ${rank.result === 'win' ? 'text-emerald-600' : 'text-on-surface-variant'}`}>
                    {rank.result === 'win' ? 'Thắng (+50đ)' : 'Bị loại (+10đ)'}
                  </span>
                </div>
              ))}
            </div>

            <button
              onClick={() => {
                setGameEnded(null);
                leaveRoom();
              }}
              className="btn-detonator w-full py-4 rounded-2xl font-headline font-black uppercase text-base"
            >
              Quay Lại Phòng Chờ 🏠
            </button>
          </div>
        </div>
      )}
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
