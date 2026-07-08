import React from 'react';
import { useGameContext } from '../GameContext.jsx';

export default function GameTable(props) {
  const context = useGameContext();
  const {
    CardDrawerIcon,
    DeckPile,
    DiscardPile,
    PlayerAvatar,
    PlayerHand,
    SmileIcon,
    activePlayerId,
    discardCard,
    displayedDiscardPile,
    drawCard,
    gameState,
    getOrderedOpponents,
    getStatusDisplay,
    isMyTurn,
    isOpponentTargetable,
    isSidebarOpen,
    myPlayerState,
    myUser,
    nopeWindow,
    opponents,
    playCard,
    playCombo,
    privateHand,
    respondCombo5,
  } = { ...context, ...props };
  const [targetPlayerId, setTargetPlayerId] = React.useState(null);

  return (
    <>
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
    </>
  );
}
