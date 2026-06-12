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
  BuryPositionModal,
  GarbageSelectModal,
  ZombieReviveModal,
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
    buryRequest,
    garbageRequest,
    potLuckRequest,
    zombieRequest,
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
    respondBury,
    respondGarbage,
    respondPotLuck,
    respondZombie,
    playCombo,
    respondCombo5,
    sendChatMessage,
    sendEmote,
  } = useGame();

  const [roomInput, setRoomInput] = useState('');
  const [targetPlayerId, setTargetPlayerId] = useState(null);
  const [chatInput, setChatInput] = useState('');
  const [myUser, setMyUser] = useState(null);

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
          <button
            onClick={() => createRoom(5, true)}
            className="btn-detonator w-full py-4 rounded-2xl font-headline font-black uppercase text-sm"
          >
            ➕ Tạo Phòng Mới (Tối đa 5 người)
          </button>
        </div>

        <div className="flex flex-col gap-4 border-t-4 border-dashed border-on-surface-variant pt-6">
          <h3 className="text-xs font-headline font-black text-on-surface uppercase tracking-wider">Tham gia phòng có sẵn</h3>
          <div className="flex gap-3">
            <input
              type="text"
              placeholder="MÃ PHÒNG (6 CHỮ CÁI)"
              value={roomInput}
              onChange={(e) => setRoomInput(e.target.value.toUpperCase())}
              className="flex-1 bg-surface border-3 border-on-surface rounded-2xl px-4 py-3 text-on-surface font-headline font-black uppercase tracking-widest text-center text-sm focus:outline-none focus:bg-white transition-all shadow-[3px_3px_0px_0px_rgba(26,28,28,1)]"
            />
            <button
              onClick={() => joinRoom(roomInput)}
              className="px-6 py-3 bg-yellow-400 text-slate-950 font-headline font-black uppercase rounded-2xl border-3 border-on-surface shadow-[3px_3px_0px_0px_rgba(26,28,28,1)] hover:scale-105 active:scale-95 transition-all text-xs"
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
            onClick={leaveRoom}
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
    <div className="relative min-h-[82vh] grid grid-cols-1 lg:grid-cols-4 gap-6">
      {/* Game Board (Left 3 columns) */}
      <div className="lg:col-span-3 flex flex-col justify-between gap-6 border-4 border-on-surface rounded-3xl shadow-[8px_8px_0px_0px_rgba(26,28,28,1)] overflow-hidden bg-[#2f3131]">
        
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
              onClick={leaveRoom}
              className="bg-secondary text-on-error font-headline font-black border-2 border-on-surface shadow-[2.5px_2.5px_0px_0px_#1a1c1c] px-3.5 py-1.5 rounded-xl text-xs hover:scale-105 active:scale-95 transition-all uppercase"
            >
              Rời Phòng
            </button>
          </div>
        </div>

        {/* Game Canvas Container */}
        <div className="flex-grow flex flex-col justify-between felt-bg p-6 relative select-none">
          {/* Opponents Row */}
          <div className="flex justify-center gap-6 flex-wrap py-2 z-10">
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

          {/* Board Center: Deck and Discard Pile */}
          <div className="flex-grow flex justify-center items-center gap-16 py-6 relative">
            <DeckPile
              count={gameState.deckCount ?? 0}
              onDraw={drawCard}
              isMyTurn={isMyTurn}
              disabled={!!gameState.pendingFavor || !!gameState.pendingAlter || (nopeWindow && nopeWindow.active)}
            />

            {/* Announcer and Status Message Board */}
            <div className="flex flex-col items-center gap-3 max-w-[260px] text-center z-10">
              <div className="bg-white border-3 border-on-surface rounded-2xl px-5 py-4 shadow-[4px_4px_0px_0px_#1a1c1c] min-w-[220px]">
                <span className="text-[10px] font-headline font-black text-primary uppercase tracking-widest block mb-1">
                  Hành Động
                </span>
                <p className="text-xs font-sans font-bold text-on-surface leading-relaxed min-h-[48px] flex items-center justify-center">
                  {statusMessage || 'Ván đấu đã bắt đầu!'}
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
              />
            </div>
          </div>
        </div>
      </div>

      {/* Chat & Emotes Panel (Right 1 column) */}
      <div className="lg:col-span-1 bg-white border-4 border-on-surface shadow-[8px_8px_0px_0px_rgba(26,28,28,1)] rounded-3xl p-5 flex flex-col justify-between h-[82vh]">
        <div className="flex flex-col gap-4 flex-1 overflow-hidden">
          
          {/* Header */}
          <div className="border-b-3 border-on-surface pb-2.5 flex justify-between items-center">
            <h3 className="text-sm font-headline font-black uppercase text-on-surface">Đấu Trường Chat</h3>
            <span className="h-3 w-3 rounded-full bg-emerald-500 animate-pulse border border-on-surface" />
          </div>

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
          <div className="flex-1 flex flex-col gap-2.5 overflow-y-auto mt-2 border-t-3 border-dashed border-on-surface-variant pt-3 pr-1 hide-scroll">
            {chatMessages.length === 0 ? (
              <div className="text-center text-on-surface-variant text-xs py-8 font-sans font-bold italic">
                Chưa có cuộc hội thoại nào. Chat để trêu đùa đối thủ!
              </div>
            ) : (
              chatMessages.map((msg, index) => {
                const isMe = msg.userId === myUser.id;
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

        {/* Input Chat bar */}
        <form onSubmit={handleSendChat} className="flex gap-2 border-t-3 border-on-surface pt-3 mt-2">
          <input
            type="text"
            placeholder="Gửi tin nhắn hăm dọa..."
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            className="flex-1 bg-surface border-2 border-on-surface rounded-xl px-3 py-2 text-xs text-on-surface font-bold focus:outline-none focus:bg-white transition-all shadow-[1.5px_1.5px_0px_0px_#1a1c1c]"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-primary text-on-primary font-headline font-black rounded-xl text-xs border-2 border-on-surface shadow-[1.5px_1.5px_0px_0px_#1a1c1c] active:translate-y-0.5 active:shadow-none hover:scale-105"
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
          onRespond={respondZombie}
        />
      )}

      {/* 9. Game Ended Win Overlay */}
      {gameEnded && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur p-4 animate-fade-in">
          <div className="w-full max-w-md bg-white border-4 border-on-surface rounded-3xl p-6 shadow-[8px_8px_0px_0px_rgba(26,28,28,1)] flex flex-col items-center gap-6 text-center">
            
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
    </div>
  );
}
