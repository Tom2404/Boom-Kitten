import React from 'react';
import { useGameContext } from '../GameContext.jsx';
import { getActivityStatus } from '../../../utils/gameRoomUi.js';

export default function GameHeader() {
  const {
    ImageButton,
    SmileIcon,
    connectionState,
    handleLeaveConfirm,
    hasUnreadMessages,
    isSidebarOpen,
    roomState,
    setIsSidebarOpen,
    setRightPanelTab,
    t,
  } = useGameContext();

  const connectionLabel = connectionState === 'connected'
    ? 'Kết nối tốt'
    : connectionState === 'error'
      ? 'Mất kết nối'
      : 'Đang nối lại';

  const toggleActivity = () => {
    setIsSidebarOpen((current) => !current);
    if (!isSidebarOpen) setRightPanelTab('chat');
  };
  const activityStatus = getActivityStatus({
    isOpen: isSidebarOpen,
    hasUnreadMessages,
    connectionState,
  });

  return (
    <header className="game-room-header">
      <div className="game-room-header__brand">
        <span className="game-room-header__fuse" aria-hidden="true" />
        <div>
          <p>Phòng đấu</p>
          <h1>Boom Kitten</h1>
        </div>
      </div>

      <div className="game-room-header__room">
        <span>Phòng</span>
        <strong>{roomState.code}</strong>
        <small>{t(`edition_${roomState.edition}_name`) || roomState.edition}</small>
      </div>

      <div className="game-room-header__actions">
        <span className={`game-connection game-connection--${connectionState}`} role="status">
          <i aria-hidden="true" />
          {connectionLabel}
        </span>
        <button
          id="game-activity-toggle"
          type="button"
          onClick={toggleActivity}
          aria-expanded={isSidebarOpen}
          aria-controls="game-side-panel"
          data-activity-status={activityStatus}
          className="game-pixel-button game-pixel-button--muted game-room-header__activity"
        >
          <SmileIcon aria-hidden="true" className="game-room-header__activity-icon" />
          <span>{isSidebarOpen ? 'Đóng hoạt động' : 'Chat / Lịch sử'}</span>
          {hasUnreadMessages && !isSidebarOpen && (
            <span className="game-unread-badge" aria-label="Có tin nhắn mới">MỚI</span>
          )}
        </button>
        <ImageButton
          variant="quit"
          size="md"
          onClick={handleLeaveConfirm}
          className="game-room-header__leave"
        >
          Thoát
        </ImageButton>
      </div>
    </header>
  );
}
