import React, { useState, useEffect } from 'react';
import { useGame } from '../hooks/useGame.js';
import PlayerAvatar from '../components/PlayerAvatar.jsx';
import PlayerHand from '../components/PlayerHand.jsx';
import DeckPile from '../components/DeckPile.jsx';
import DiscardPile from '../components/DiscardPile.jsx';
import {
  SeeFutureModal,
  AlterFutureModal,
  FavorRequestModal,
  NopeCountdown,
} from '../components/ActionModals.jsx';

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
    roomState,
    gameState,
    privateHand,
    nopeWindow,
    seeTheFutureCards,
    setSeeTheFutureCards,
    alterFutureRequest,
    favorRequest,
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
    respondFavor,
    respondAlterFuture,
    playCombo,
    respondCombo5,
    sendChatMessage,
    sendEmote,
  } = useGame();

  const [roomInput, setRoomInput] = useState('');
  const [targetPlayerId, setTargetPlayerId] = useState(null);
  const [chatInput, setChatInput] = useState('');
  const [myUser, setMyUser] = useState(null);
  const [activeEmote, setActiveEmote] = useState(null);

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

  // Listen for emotes
  useEffect(() => {
    const socket = roomState?.code ? window.socketInstance : null; // socket is accessible in useGame
  }, [roomState]);

  if (!myUser) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center gap-4">
        <span className="text-5xl">🔒</span>
        <h2 className="text-xl font-bold text-slate-300">Yêu Cầu Đăng Nhập</h2>
        <p className="text-sm text-slate-500 max-w-sm">
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
      <div className="max-w-md mx-auto my-12 bg-slate-900/60 border border-slate-800 backdrop-blur rounded-2xl p-6 shadow-2xl flex flex-col gap-6">
        <div className="text-center">
          <span className="text-5xl">🐱</span>
          <h2 className="text-2xl font-bold text-white mt-2">Phòng Chờ Game</h2>
          <p className="text-xs text-slate-400 mt-1">Tạo phòng mới hoặc gia nhập phòng của bạn bè.</p>
        </div>

        <div className="flex flex-col gap-4 border-t border-slate-800 pt-6">
          <h3 className="text-sm font-semibold text-slate-300">Tạo phòng chơi</h3>
          <button
            onClick={() => createRoom(5, true)}
            className="w-full py-3 bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-400 hover:to-indigo-500 text-white font-bold rounded-xl active:scale-98 transition-all duration-300 shadow-lg shadow-indigo-500/20"
          >
            ➕ Tạo Phòng Mới (Tối đa 5 người)
          </button>
        </div>

        <div className="flex flex-col gap-4 border-t border-slate-800 pt-6">
          <h3 className="text-sm font-semibold text-slate-300">Tham gia phòng có sẵn</h3>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Nhập mã phòng (6 chữ cái)"
              value={roomInput}
              onChange={(e) => setRoomInput(e.target.value.toUpperCase())}
              className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white font-mono uppercase tracking-widest text-center text-sm focus:outline-none focus:border-indigo-500 transition-colors"
            />
            <button
              onClick={() => joinRoom(roomInput)}
              className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl active:scale-98 transition-all duration-300"
            >
              Vào Phòng
            </button>
          </div>
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
      <div className="max-w-xl mx-auto my-6 bg-slate-900/60 border border-slate-800 backdrop-blur rounded-2xl p-6 shadow-2xl flex flex-col gap-6">
        <div className="flex justify-between items-start border-b border-slate-800 pb-4">
          <div>
            <h2 className="text-xl font-bold text-white">Phòng Chờ Trận Đấu</h2>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs text-slate-400">Mã Phòng:</span>
              <span className="bg-slate-800 text-yellow-400 font-mono font-bold text-sm px-2.5 py-0.5 rounded border border-slate-700">
                {roomState.code}
              </span>
            </div>
          </div>
          <button
            onClick={leaveRoom}
            className="px-3 py-1.5 bg-red-950/60 hover:bg-red-900 border border-red-900/60 text-red-400 hover:text-white text-xs font-semibold rounded-lg transition-colors"
          >
            Rời Phòng
          </button>
        </div>

        <div>
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">
            Thành viên phòng ({roomState.players.length}/5)
          </h3>
          <div className="flex flex-col gap-2">
            {roomState.players.map((player) => (
              <div
                key={player.userId}
                className="flex justify-between items-center bg-slate-950/40 border border-slate-800/60 px-4 py-3 rounded-xl"
              >
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-sm font-bold text-white uppercase">
                    {player.username ? player.username.slice(0, 2) : player.userId.slice(0, 2)}
                  </div>
                  <span className="text-sm font-medium text-slate-200">
                    {player.username || player.userId}
                  </span>
                  {roomState.host === player.userId && (
                    <span className="bg-yellow-500/20 border border-yellow-500/30 text-yellow-400 text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full">
                      👑 Trưởng phòng
                    </span>
                  )}
                </div>
                <span className="text-[10px] text-green-400 flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-green-500" /> Sẵn sàng
                </span>
              </div>
            ))}
          </div>
        </div>

        {isHost ? (
          <div className="flex flex-col gap-2 border-t border-slate-800 pt-6">
            <button
              onClick={startGame}
              disabled={roomState.players.length < 2}
              className={`w-full py-3 text-slate-950 font-bold rounded-xl shadow-lg transition-all duration-300
                ${roomState.players.length >= 2
                  ? 'bg-yellow-500 hover:bg-yellow-400 active:scale-98 shadow-yellow-500/20'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-800'}`}
            >
              🚀 Bắt Đầu Trận Đấu
            </button>
            {roomState.players.length < 2 && (
              <p className="text-center text-[10px] text-slate-500">
                Cần tối thiểu 2 người chơi để bắt đầu trận đấu.
              </p>
            )}
          </div>
        ) : (
          <div className="text-center border-t border-slate-800 pt-6">
            <p className="text-xs text-slate-400 animate-pulse">
              Đang đợi Trưởng phòng bắt đầu trận đấu...
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

  // Determine if opponents can be targeted (e.g. for Favor card or 2-cat combo)
  const isOpponentTargetable = (oppId) => {
    if (!isMyTurn) return false;
    const opp = opponents.find((o) => o.userId === oppId);
    if (!opp || !opp.alive) return false;

    // Check if we have selected cards or type
    const hasFavorSelected = privateHand.some(
      (c) => c.type === 'favor' && !targetPlayerId
    );
    return true; // Simplify targetability for user ease (they select the opponent anytime)
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
    <div className="relative min-h-[85vh] grid grid-cols-1 lg:grid-cols-4 gap-6 max-w-7xl mx-auto p-2">
      {/* Game Board (Left 3 columns) */}
      <div className="lg:col-span-3 flex flex-col justify-between gap-6 bg-slate-950/20 border border-slate-900 rounded-2xl p-6 shadow-2xl relative overflow-hidden">
        
        {/* Header: Room Code and Info */}
        <div className="flex justify-between items-center border-b border-slate-900 pb-3">
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-500 uppercase tracking-widest font-semibold">Phòng chơi:</span>
            <span className="bg-slate-900 text-yellow-400 font-mono font-bold text-xs px-2.5 py-1 rounded border border-slate-800">
              {roomState.code}
            </span>
          </div>

          <div className="flex items-center gap-3">
            {gameState.drawsRequired > 1 && (
              <span className="bg-red-500/20 border border-red-500/30 text-red-400 text-xs px-3 py-1 rounded-full font-bold animate-pulse">
                ⚠️ Bị dồn bốc: {gameState.drawsRequired} lượt!
              </span>
            )}
            <button
              onClick={leaveRoom}
              className="px-3 py-1 bg-red-950/40 hover:bg-red-900 border border-red-900/40 text-red-400 text-xs font-semibold rounded-lg transition-colors"
            >
              Rời Phòng
            </button>
          </div>
        </div>

        {/* 1. Opponents Row (Top) */}
        <div className="flex justify-center gap-4 flex-wrap py-2">
          {opponents.map((opp) => (
            <PlayerAvatar
              key={opp.userId}
              player={opp}
              isCurrentTurn={activePlayerId === opp.userId}
              isTargetable={isOpponentTargetable(opp.userId)}
              isSelectedTarget={targetPlayerId === opp.userId}
              onSelectTarget={(id) => setTargetPlayerId(prev => prev === id ? null : id)}
            />
          ))}
        </div>

        {/* 2. Board Center: Deck and Discard Pile */}
        <div className="flex-1 flex justify-center items-center gap-16 py-6 relative">
          
          {/* Deck Pile */}
          <DeckPile
            count={gameState.deckCount ?? 0}
            onDraw={drawCard}
            isMyTurn={isMyTurn}
            disabled={!!gameState.pendingFavor || !!gameState.pendingAlter || (nopeWindow && nopeWindow.active)}
          />

          {/* Announcer and Status Message Board */}
          <div className="flex flex-col items-center gap-3 max-w-[240px] text-center">
            <div className="bg-slate-900/80 border border-slate-800 rounded-xl px-4 py-3 shadow-inner min-w-[200px]">
              <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold block mb-1">
                Diễn Biến
              </span>
              <p className="text-sm font-semibold text-slate-200 leading-relaxed font-sans min-h-[40px] flex items-center justify-center">
                {statusMessage || 'Ván đấu đã bắt đầu!'}
              </p>
            </div>
            
            {targetPlayerId && (
              <div className="bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full flex items-center gap-1.5">
                🎯 Mục tiêu: {opponents.find((o) => o.userId === targetPlayerId)?.username || targetPlayerId}
                <button 
                  onClick={() => setTargetPlayerId(null)}
                  className="hover:text-white ml-1 font-sans"
                >
                  ✕
                </button>
              </div>
            )}
          </div>

          {/* Discard Pile */}
          <DiscardPile
            discardPile={gameState.discardPile}
            pendingCombo5={gameState.pendingCombo5}
            myUserId={myUser.id}
            onSelectCard={respondCombo5}
          />
        </div>

        {/* 3. Bottom Row: Player's own avatar & Player's hand */}
        <div className="flex flex-col md:flex-row gap-4 items-stretch border-t border-slate-900 pt-6">
          <div className="flex items-center justify-center bg-slate-950/20 px-3 rounded-xl">
            {myPlayerState && (
              <PlayerAvatar
                player={myPlayerState}
                isCurrentTurn={isMyTurn}
                isTargetable={false}
              />
            )}
          </div>
          
          <div className="flex-1">
            <PlayerHand
              hand={privateHand}
              onPlayCard={playCard}
              onPlayCombo={playCombo}
              isMyTurn={isMyTurn}
              targetPlayerId={targetPlayerId}
            />
          </div>
        </div>

        {/* Decorative Grid backgrounds */}
        <div className="absolute inset-0 bg-grid-slate-900/[0.04] bg-[size:20px_20px] pointer-events-none" />
      </div>

      {/* Chat & Emotes Panel (Right 1 column) */}
      <div className="lg:col-span-1 bg-slate-900/60 border border-slate-800 backdrop-blur rounded-2xl p-4 shadow-2xl flex flex-col justify-between h-[85vh]">
        <div className="flex flex-col gap-4 flex-1 overflow-hidden">
          
          {/* Header */}
          <div className="border-b border-slate-800 pb-2 flex justify-between items-center">
            <h3 className="text-sm font-bold text-white">Trò Chuyện & Emote</h3>
            <span className="h-2 w-2 rounded-full bg-green-500" />
          </div>

          {/* Emotes quick buttons */}
          <div className="flex flex-col gap-2">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Gửi nhanh biểu cảm</span>
            <div className="grid grid-cols-4 gap-2">
              {EMOTES_LIST.map((emote) => (
                <button
                  key={emote.id}
                  onClick={() => sendEmote(emote.id)}
                  className="h-10 text-2xl bg-slate-950 border border-slate-800 hover:border-slate-700 hover:bg-slate-800 rounded-xl transition-all active:scale-90 flex items-center justify-center"
                >
                  {emote.char}
                </button>
              ))}
            </div>
          </div>

          {/* Chat Messages history */}
          <div className="flex-1 flex flex-col gap-2 overflow-y-auto mt-2 border-t border-slate-800/80 pt-3 pr-1 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
            {chatMessages.length === 0 ? (
              <div className="text-center text-slate-600 text-xs py-8 font-sans">
                Chưa có tin nhắn nào. Chat để trêu đùa đối thủ!
              </div>
            ) : (
              chatMessages.map((msg, index) => {
                const isMe = msg.userId === myUser.id;
                return (
                  <div
                    key={index}
                    className={`flex flex-col max-w-[85%] rounded-2xl px-3 py-1.5 text-xs shadow-sm
                      ${isMe 
                        ? 'self-end bg-indigo-600/30 border border-indigo-500/20 text-indigo-100 rounded-tr-none' 
                        : 'self-start bg-slate-950 border border-slate-800 text-slate-300 rounded-tl-none'}`}
                  >
                    <span className="font-bold text-[9px] text-slate-400 mb-0.5">
                      {isMe ? 'Bạn' : msg.username}
                    </span>
                    <p className="leading-relaxed font-sans">{msg.text}</p>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Input Chat bar */}
        <form onSubmit={handleSendChat} className="flex gap-2 border-t border-slate-800 pt-3 mt-2">
          <input
            type="text"
            placeholder="Gửi tin nhắn..."
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 transition-colors"
          />
          <button
            type="submit"
            className="px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs"
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

      {/* 5. Game Ended Win Overlay */}
      {gameEnded && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur p-4 animate-fade-in">
          <div className="w-full max-w-md bg-slate-900 border border-yellow-500 rounded-2xl p-6 shadow-2xl flex flex-col items-center gap-6 text-center">
            
            {/* Victory / Defeat animation banner */}
            <div className="flex flex-col items-center">
              <span className="text-6xl animate-bounce">
                {gameEnded.winnerId === myUser.id ? '🏆' : '💀'}
              </span>
              <h2 className="text-2xl font-bold mt-2 text-white">
                {gameEnded.winnerId === myUser.id ? 'CHIẾN THẮNG!' : 'BẠN ĐÃ THUA'}
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Người chiến thắng cuối cùng: <strong className="text-white">{gameEnded.winnerId}</strong>
              </p>
            </div>

            {/* Placements */}
            <div className="w-full bg-slate-950/60 border border-slate-800 rounded-xl p-4 flex flex-col gap-2">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest text-left pb-1 border-b border-slate-800">
                Thứ hạng chung cuộc
              </h3>
              {gameEnded.rankings.map((rank, index) => (
                <div key={index} className="flex justify-between items-center text-xs py-1">
                  <span className="text-slate-300 font-medium">
                    #{index + 1} {rank.userId}
                  </span>
                  <span className={`font-bold uppercase tracking-wider
                    ${rank.result === 'win' ? 'text-green-400' : 'text-slate-500'}`}>
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
              className="w-full py-3 bg-yellow-500 hover:bg-yellow-400 text-slate-950 font-bold rounded-xl active:scale-95 transition-all shadow-lg shadow-yellow-500/20"
            >
              Quay Lại Phòng Chờ
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
