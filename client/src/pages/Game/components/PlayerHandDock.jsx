import React from 'react';
import { PRESET_AVATARS } from '../../../components/PlayerAvatar.jsx';
import { getAssetTransformStyle } from '../../../utils/shopEquipment.js';

export default function PlayerHandDock({
  PlayerHand,
  combo3Request,
  discardCard,
  drawCard,
  drawsRequired = 1,
  gameState,
  isMyTurn,
  myUser,
  player,
  nopeWindow,
  playCard,
  playCombo,
  privateHand,
  respondCombo3,
  targetPlayerId,
}) {
  const isTurn = Boolean(isMyTurn);

  return (
    <section className="game-player-dock relative w-full flex flex-col gap-1" data-vfx-anchor="my-hand" aria-label="Khu vực bài của bạn">
      {/* Top Status Bar Indicator */}
      <div className="w-full text-center py-0.5">
        <span className="text-[11px] font-headline font-black tracking-widest uppercase text-[#00d8ff] drop-shadow-[0_0_8px_rgba(0,216,255,0.8)] animate-pulse">
          {isTurn ? `ĐẾN LƯỢT BẠN (BỐC ${drawsRequired} LÁ)` : 'ĐANG CHỜ HÀNH ĐỘNG...'}
        </span>
      </div>

      <div className="game-player-dock__main-row flex flex-col md:flex-row items-stretch gap-3 px-2">
        {/* Left Profile Identity Container */}
        <div className="game-player-dock__identity-card min-w-[210px] max-w-[240px] bg-[#121520] border-2 border-[#ff2a5f] shadow-[0_0_16px_rgba(255,42,95,0.35)] rounded-2xl p-3 flex flex-col justify-between gap-3 text-white flex-shrink-0">
          {/* Top User Info & Avatar */}
          <div className="flex items-center gap-2.5">
            <div className="relative w-11 h-11 rounded-full bg-[#1b2030] border-2 border-[#00d8ff] flex items-center justify-center text-lg font-black shadow-[0_0_10px_rgba(0,216,255,0.4)] flex-shrink-0">
              <span>{PRESET_AVATARS[player?.avatar] || '🕶️'}</span>
              {player?.avatar && !PRESET_AVATARS[player.avatar] && (
                <img
                  className="absolute inset-0 w-full h-full object-cover rounded-full"
                  src={player.avatar}
                  alt=""
                  onError={(event) => event.currentTarget.remove()}
                />
              )}
              {player?.avatarFrame?.assetUrl && (
                <img
                  className="absolute -inset-1.5 w-[calc(100%+12px)] h-[calc(100%+12px)] object-contain pointer-events-none"
                  src={player.avatarFrame.assetUrl}
                  alt=""
                  style={getAssetTransformStyle(player.avatarFrame.assetTransform)}
                  onError={(event) => event.currentTarget.remove()}
                />
              )}
            </div>

            <div className="flex flex-col min-w-0 flex-grow">
              <div className="flex items-center gap-1">
                <span className="text-[10px]">👑</span>
                <span className="font-headline font-black text-xs uppercase tracking-wide truncate text-slate-100">
                  {myUser.username || 'Bạn'}
                </span>
              </div>
              <div className="text-[9.5px] font-sans font-extrabold text-[#00d8ff] tracking-wider uppercase">
                LEVEL 24
              </div>
              {/* XP Progress Bar */}
              <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mt-0.5 border border-white/10">
                <div className="bg-gradient-to-r from-pink-500 to-rose-400 h-full w-[65%] rounded-full shadow-[0_0_6px_rgba(244,63,94,0.8)]"></div>
              </div>
              <span className="text-[8px] font-mono font-bold text-slate-400 text-right mt-0.5">1580 XP</span>
            </div>
          </div>

          {/* Bottom Action Area: Card Count & Draw Button */}
          <div className="flex items-center justify-between gap-2 border-t border-white/10 pt-2">
            <div className="flex items-center gap-1.5 bg-[#1a1e2e] px-2.5 py-1.5 rounded-xl border border-white/10">
              <span className="text-amber-400 text-xs">🎴</span>
              <span className="font-mono font-black text-xs text-amber-300">{privateHand.length}</span>
            </div>

            <button
              type="button"
              onClick={drawCard}
              disabled={!isTurn}
              className={`flex-grow py-2 px-3 rounded-xl font-headline font-black text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all shadow-md ${
                isTurn
                  ? 'bg-[#00c8ff] text-slate-950 hover:bg-[#33d6ff] shadow-[0_0_12px_rgba(0,200,255,0.7)] active:scale-95 cursor-pointer'
                  : 'bg-slate-800 text-slate-400 border border-slate-700 cursor-not-allowed opacity-60'
              }`}
            >
              <span>BỐC {drawsRequired} LÁ</span>
              <span className="w-4 h-4 rounded-full bg-slate-950/20 flex items-center justify-center text-[9px] font-sans">⚡</span>
            </button>
          </div>
        </div>

        {/* Right Player Cards Dock */}
        <div className="flex-grow min-w-0">
          <PlayerHand
            hand={privateHand}
            combo3Request={combo3Request}
            onPlayCard={playCard}
            onPlayCombo={playCombo}
            onRespondCombo3={respondCombo3}
            isMyTurn={isMyTurn}
            targetPlayerId={targetPlayerId}
            nopeWindowActive={Boolean(nopeWindow?.active)}
            onDiscard={discardCard}
            maxHandSize={gameState.maxHandSize ?? 10}
            players={gameState.players || []}
            myUserId={myUser.id}
          />
        </div>
      </div>

      {privateHand.length > 5 && (
        <p className="game-hand__swipe-hint text-center text-slate-400 text-[10px]" aria-hidden="true">Vuốt ngang để xem toàn bộ bài</p>
      )}
    </section>
  );
}
