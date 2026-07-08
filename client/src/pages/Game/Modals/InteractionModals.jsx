import React from 'react';
import { useGameContext } from '../GameContext.jsx';

export default function InteractionModals(props) {
  const context = useGameContext();
  const {
    AlterFutureModal,
    ArmageddonDecisionModal,
    ArmageddonDistributeModal,
    BuryPositionModal,
    ClairvoyanceRevealModal,
    DefusePositionModal,
    DigDeeperModal,
    DrawReveal,
    FavorRequestModal,
    FeedTheDeadModal,
    GarbageSelectModal,
    GraveRobberModal,
    NopeCountdown,
    NopeResultToast,
    NowCardToast,
    SeeFutureModal,
    SelectTargetModal,
    ZombieReviveModal,
    activePlayerId,
    alterFutureRequest,
    armageddonRequest,
    buryRequest,
    defuseRequest,
    digDeeperRequest,
    favorRequest,
    feedTheDeadRequest,
    gameState,
    garbageRequest,
    getPlayerDisplayName,
    graveRobberRequest,
    hasNopeCard,
    localClairvoyance,
    myUser,
    nopeResult,
    nopeWindow,
    nowCardToast,
    passNope,
    playCard,
    playNope,
    potLuckRequest,
    privateHand,
    respondAlterFuture,
    respondArmageddonDecision,
    respondArmageddonDistribute,
    respondBury,
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
    seeTheFutureCards,
    selectTargetRequest,
    setLocalClairvoyance,
    setRevealCard,
    setSeeTheFutureCards,
    zombieRequest,
  } = { ...context, ...props };

  return (
    <>
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
    onPlayNow={(card) => playCard(card.type, null, { cardId: card.id })}
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
    </>
  );
}
