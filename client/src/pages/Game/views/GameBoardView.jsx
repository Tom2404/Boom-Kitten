import React from 'react';
import GameHeader from '../components/GameHeader.jsx';
import GameTable from '../components/GameTable.jsx';
import GameSidePanel from '../components/GameSidePanel.jsx';
import GameModals from '../Modals/GameModals.jsx';
import { useGameContext } from '../GameContext.jsx';
import { getGameDisplayState } from '../../../utils/gameDisplayState.js';
import CardFocusOverlay from '../../../components/CardFocusOverlay.jsx';

export default function GameBoardView() {
  const props = useGameContext();
  const {
    AlterFutureModal,
    ArmageddonDecisionModal,
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
    flyingCardActionId,
    setFlyingCardActionId,
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
  } = props;

  if (!gameState) {
    return (
      <div className="game-loading-state" role="status" aria-live="polite" aria-busy="true">
        <div className="game-loading-state__deck" aria-hidden="true" />
        <div>
          <p className="game-loading-state__eyebrow">Kết nối trận đấu</p>
          <h1 className="game-loading-state__title">Đang chuẩn bị bàn chơi</h1>
          <p className="game-loading-state__copy">Đang nhận trạng thái mới nhất từ máy chủ.</p>
        </div>
      </div>
    );
  }

  const myPlayerState = gameState.players.find((p) => p.userId === myUser.id);
  const opponents = gameState.players.filter((p) => p.userId !== myUser.id);
  const activePlayerId = gameState.players[gameState.currentPlayerIndex]?.userId;
  const isMyTurn = activePlayerId === myUser.id;
  const activePlayer = gameState.players.find((player) => player.userId === activePlayerId);
  const displayState = getGameDisplayState({
    activePlayerId,
    myUserId: myUser.id,
    drawsRequired: gameState.drawsRequired,
    activePlayerName: activePlayer?.username,
  });

  // Hide the top card(s) of discard pile while a clone card is flying to it
  // to avoid a "double card" visual glitch. flyingCardActionId is set by
  // CardFocusOverlay's onDiscardPileSync callback while the clone is in flight.
  const discardMaskCount = flyingCardActionId?.count || 0;
  const displayedDiscardPile = discardMaskCount > 0
    ? gameState.discardPile.slice(0, Math.max(0, gameState.discardPile.length - discardMaskCount))
    : (gameState.discardPile && numPlayAnims > 0)
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

  const handleDiscardPileSync = React.useCallback((actionId, hiddenCount) => {
    setFlyingCardActionId(hiddenCount > 0 ? { actionId, count: hiddenCount } : null);
  }, [setFlyingCardActionId]);

  return (
    <div ref={mainContainerRef} className="game-room select-none">
      {errorToast}
      <CardFocusOverlay onDiscardPileSync={handleDiscardPileSync} />
      <GameHeader />

      <div className="game-room__stage">
        <GameTable
          activePlayerId={activePlayerId}
          displayedDiscardPile={displayedDiscardPile}
          displayState={displayState}
          getOrderedOpponents={getOrderedOpponents}
          getStatusDisplay={getStatusDisplay}
          isMyTurn={isMyTurn}
          isOpponentTargetable={isOpponentTargetable}
          isSidebarOpen={isSidebarOpen}
          myPlayerState={myPlayerState}
          opponents={opponents}
        />

        <GameSidePanel />
      </div>

      <GameModals
        activePlayerId={activePlayerId}
        getPlayerDisplayName={getPlayerDisplayName}
        hasNopeCard={hasNopeCard}
        myPlayerState={myPlayerState}
      />
    </div>
  );

}
