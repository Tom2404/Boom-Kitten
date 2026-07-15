import React from 'react';
import { useGameContext } from '../GameContext.jsx';
import TurnBanner from './TurnBanner.jsx';

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
    displayState,
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
    reversePulse,
  } = { ...context, ...props };
  const [targetPlayerId, setTargetPlayerId] = React.useState(null);

  return (
    <>
{/* Game Board (Left 3 or 4 columns depending on sidebar toggle) */}
<div id="game-board-container" className={`${isSidebarOpen ? 'lg:col-span-3' : 'lg:col-span-4'} flex min-w-0 flex-col justify-between overflow-hidden border-4 border-[var(--pop-black)] bg-[var(--pop-cream)] shadow-[5px_5px_0_var(--pop-black)] md:shadow-[8px_8px_0_var(--pop-black)]`}>

  <TurnBanner state={displayState} />

  {/* Game Canvas Container */}
  <div className="dotted-grid-bg relative flex min-h-[430px] flex-grow select-none flex-col justify-between p-3 sm:p-4 md:min-h-[460px] md:p-6">

    {/* Opponents Row at the top (Horizontal layout) */}
    <div className="z-10 -mx-3 -mt-3 mb-3 flex w-[calc(100%+1.5rem)] items-center justify-start gap-4 overflow-x-auto border-b-3 border-[var(--pop-black)] bg-white/95 px-4 py-3 shadow-[0_3px_0_var(--pop-black)] sm:-mx-4 sm:-mt-4 sm:w-[calc(100%+2rem)] md:-mx-6 md:-mt-6 md:mb-4 md:w-[calc(100%+3rem)] md:justify-center md:gap-10 md:py-3.5">
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
    <div className="relative z-10 flex w-full flex-grow items-center justify-center py-3 md:py-6">
      {/* Rotating play direction arrows background using pixel-art asset */}
      <div className="turn-direction-indicator">
        <div className={reversePulse ? "turn-direction-pulse" : ""}>
          <img
            src="/vfx/reverse-arrow.png"
            alt="Play Direction"
            className={`turn-direction-arrows ${
              gameState?.playDirection === -1 ? 'counter-clockwise' : 'clockwise'
            }`}
          />
        </div>
      </div>

      <div className="relative z-10 grid w-full grid-cols-[minmax(76px,1fr)_minmax(112px,1.15fr)_minmax(76px,1fr)] items-center justify-center gap-2 sm:grid-cols-[auto_minmax(150px,210px)_auto] sm:gap-4 md:gap-8">
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
        <div className="z-10 flex min-w-0 flex-col items-center gap-2 text-center sm:max-w-[210px] md:gap-3 md:max-w-[240px]">
          <div className="w-full min-w-0 border-3 border-[var(--pop-black)] bg-white px-2 py-2 shadow-[3px_3px_0_var(--pop-black)] sm:min-w-[150px] md:min-w-[200px] md:px-4 md:py-3.5 md:shadow-[4px_4px_0_var(--pop-black)]">
            <span className="mb-1 block font-pop-accent text-[9px] font-black uppercase tracking-widest text-[var(--pop-red)]">
              Hành Động
            </span>
            <p className="flex min-h-[36px] items-center justify-center font-pop-body text-[10px] font-bold leading-snug text-[var(--pop-black)] sm:text-xs md:min-h-[44px] md:leading-relaxed">
              {getStatusDisplay()}
            </p>
          </div>

          {targetPlayerId && (
            <div className="bg-yellow-400 border-2 border-on-surface text-slate-950 text-[9px] font-headline font-black uppercase tracking-wider px-3.5 py-0.5 rounded-full flex items-center gap-1.5 shadow-[1.5px_1.5px_0px_0px_#1a1c1c]">
              Mục tiêu: {opponents.find((o) => o.userId === targetPlayerId)?.username || targetPlayerId}
              <button
                onClick={() => setTargetPlayerId(null)}
                aria-label="Bỏ chọn mục tiêu"
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
    <div className={`z-10 -mx-3 -mb-3 flex w-[calc(100%+1.5rem)] flex-col items-stretch justify-between gap-3 border-t-4 bg-[var(--pop-red)] p-3 transition-all duration-300 sm:-mx-4 sm:-mb-4 sm:w-[calc(100%+2rem)] md:-mx-6 md:-mb-6 md:w-[calc(100%+3rem)] md:flex-row md:gap-5 md:p-5
      ${isMyTurn
        ? 'border-[var(--pop-amber)] animate-pulse-gold-glow'
        : 'border-[var(--pop-black)] shadow-[0_-4px_0_var(--pop-black)]'}`}>
      <div className="hidden flex-shrink-0 items-center justify-center border-3 border-dashed border-white/30 bg-black/15 p-4 md:flex">
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
        <button disabled aria-label="Biểu cảm nhanh, mở trong bảng chat" className="p-2.5 border-2 border-[var(--pop-black)] bg-white text-[var(--pop-black)] opacity-50 shadow-[2px_2px_0_var(--pop-black)]" title="Biểu cảm nhanh, mở trong bảng chat">
          <SmileIcon className="w-5 h-5" />
        </button>
        <button disabled aria-label="Khay bài, sắp ra mắt" className="p-2.5 border-2 border-[var(--pop-black)] bg-white text-[var(--pop-black)] opacity-50 shadow-[2px_2px_0_var(--pop-black)]" title="Khay bài, sắp ra mắt">
          <CardDrawerIcon className="w-5 h-5" />
        </button>
      </div>
    </div>

  </div>
</div>
    </>
  );
}
