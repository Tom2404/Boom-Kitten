import React from 'react';
import GameHeader from '../components/GameHeader.jsx';
import GameTable from '../components/GameTable.jsx';
import GameSidePanel from '../components/GameSidePanel.jsx';
import GameModals from '../Modals/GameModals.jsx';
import { useGameContext } from '../GameContext.jsx';

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
    GemIcon,
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

  return (
    <div ref={mainContainerRef} className="relative flex flex-col gap-5 w-full select-none">
      {errorToast}
      <GameHeader />

      <div className="relative min-h-[75vh] grid grid-cols-1 md:grid-cols-4 gap-6">
        <GameTable
          activePlayerId={activePlayerId}
          displayedDiscardPile={displayedDiscardPile}
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

  return null;
}
