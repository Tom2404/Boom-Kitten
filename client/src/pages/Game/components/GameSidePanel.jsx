import React from 'react';
import { getActivityTabConfig, getFocusLoopIndex } from '../../../utils/gameRoomUi.js';
import { useGameContext } from '../GameContext.jsx';

const TABS = ['chat', 'log'];

export default function GameSidePanel() {
  const {
    EMOTES_LIST,
    actionLog,
    chatMessages,
    connectionState,
    isSidebarOpen,
    myUser,
    SmileIcon,
    rightPanelTab,
    sendChatMessage,
    sendEmote,
    setIsSidebarOpen,
    setRightPanelTab,
  } = useGameContext();
  const [chatInput, setChatInput] = React.useState('');
  const [isEmoteOpen, setIsEmoteOpen] = React.useState(false);
  const [chatStatus, setChatStatus] = React.useState('idle');
  const pendingTimerRef = React.useRef(null);
  const closeButtonRef = React.useRef(null);
  const drawerRef = React.useRef(null);

  const closePanel = React.useCallback(() => {
    setIsSidebarOpen(false);
    setIsEmoteOpen(false);
    window.requestAnimationFrame(() => document.getElementById('game-activity-toggle')?.focus());
  }, [setIsSidebarOpen]);

  React.useEffect(() => {
    if (!isSidebarOpen) return undefined;
    closeButtonRef.current?.focus();
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') closePanel();
      if (event.key !== 'Tab') return;
      const focusable = Array.from(drawerRef.current?.querySelectorAll(
        'button:not([disabled]), input:not([disabled]), [href], [tabindex]:not([tabindex="-1"])',
      ) || []);
      if (focusable.length === 0) return;
      event.preventDefault();
      const currentIndex = Math.max(focusable.indexOf(document.activeElement), 0);
      const nextIndex = getFocusLoopIndex({
        currentIndex,
        count: focusable.length,
        backwards: event.shiftKey,
      });
      focusable[nextIndex]?.focus();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [closePanel, isSidebarOpen]);

  React.useEffect(() => () => {
    if (pendingTimerRef.current) window.clearTimeout(pendingTimerRef.current);
  }, []);

  const handleSendChat = (event) => {
    event.preventDefault();
    const message = chatInput.trim();
    if (!message) return;
    if (connectionState !== 'connected') {
      setChatStatus('error');
      return;
    }
    setChatStatus('pending');
    sendChatMessage(message);
    setChatInput('');
    if (pendingTimerRef.current) window.clearTimeout(pendingTimerRef.current);
    pendingTimerRef.current = window.setTimeout(() => setChatStatus('idle'), 700);
  };

  const handleTabKeyDown = (event, currentTab) => {
    if (!['ArrowLeft', 'ArrowRight'].includes(event.key)) return;
    event.preventDefault();
    const nextTab = currentTab === 'chat' ? 'log' : 'chat';
    setRightPanelTab(nextTab);
    window.requestAnimationFrame(() => document.getElementById(getActivityTabConfig(nextTab).tabId)?.focus());
  };

  if (!isSidebarOpen) return null;

  const activeConfig = getActivityTabConfig(rightPanelTab);

  return (
    <>
      <button type="button" className="game-activity-backdrop" onClick={closePanel} aria-label="Đóng bảng hoạt động" />
      <aside
        ref={drawerRef}
        id="game-side-panel"
        className="game-activity-drawer"
        role="dialog"
        aria-modal="true"
        aria-labelledby="game-activity-title"
      >
        <header className="game-activity-drawer__header">
          <div>
            <p>Phòng BK // live</p>
            <h2 id="game-activity-title">Hoạt động</h2>
          </div>
          <button ref={closeButtonRef} type="button" onClick={closePanel} className="game-pixel-icon" aria-label="Đóng chat và lịch sử">
            <span aria-hidden="true">×</span>
          </button>
        </header>
        <div className={`game-activity-status game-activity-status--${connectionState}`} role="status" aria-live="polite">
          {connectionState === 'error' ? 'Mất kết nối: tin nhắn có thể chưa được gửi.' : connectionState === 'connected' ? '' : 'Đang kết nối lại...'}
        </div>

        <div className="game-activity-tabs" role="tablist" aria-label="Nội dung trận đấu">
          {TABS.map((tab) => {
            const config = getActivityTabConfig(tab);
            const isSelected = rightPanelTab === tab;
            return (
              <button
                key={tab}
                id={config.tabId}
                type="button"
                role="tab"
                aria-selected={isSelected}
                aria-controls={config.panelId}
                tabIndex={isSelected ? 0 : -1}
                onClick={() => setRightPanelTab(tab)}
                onKeyDown={(event) => handleTabKeyDown(event, tab)}
              >
                {tab === 'chat' ? 'Chat' : 'Lịch sử'}
              </button>
            );
          })}
        </div>

        {rightPanelTab === 'chat' ? (
          <section
            id={activeConfig.panelId}
            className="game-activity-panel"
            role="tabpanel"
            aria-labelledby={activeConfig.tabId}
          >
            <div className="game-chat-feed" aria-live="polite">
              {chatMessages.length === 0 ? (
                <div className="game-activity-empty">
                  <span aria-hidden="true">···</span>
                  <strong>Chưa có tin nhắn</strong>
                  <p>Mở màn bằng một câu chào hoặc biểu cảm.</p>
                </div>
              ) : chatMessages.map((message, index) => {
                const isMe = message.userId === myUser?.id;
                return (
                  <article key={message.id || `${message.userId}-${index}`} className={`game-chat-message ${isMe ? 'game-chat-message--mine' : ''}`}>
                    <span className="game-chat-message__avatar" aria-hidden="true">
                      {(isMe ? myUser?.username : message.username || message.userId || '?')?.slice(0, 2).toUpperCase()}
                    </span>
                    <header>
                      <strong>{isMe ? 'Bạn' : message.username}</strong>
                      {message.timestamp && <time>{message.timestamp}</time>}
                    </header>
                    <p>{message.text}</p>
                  </article>
                );
              })}
            </div>

            <div className="game-chat-composer">
              {chatStatus === 'pending' && <p className="game-chat-status" role="status">Đang gửi...</p>}
              {chatStatus === 'error' && <p className="game-chat-status game-chat-status--error" role="alert">Chưa thể gửi khi mất kết nối.</p>}
              {isEmoteOpen && (
                <div className="game-emote-picker" aria-label="Biểu cảm nhanh">
                  {EMOTES_LIST.map((emote) => (
                    <button
                      key={emote.id}
                      type="button"
                      onClick={() => {
                        sendEmote(emote.id);
                        setIsEmoteOpen(false);
                      }}
                      aria-label={`Gửi biểu cảm ${emote.char}`}
                    >
                      {emote.char}
                    </button>
                  ))}
                </div>
              )}
              <form onSubmit={handleSendChat}>
                <button
                  type="button"
                  className="game-pixel-icon"
                  onClick={() => setIsEmoteOpen((current) => !current)}
                  aria-expanded={isEmoteOpen}
                  aria-label="Mở biểu cảm nhanh"
                >
                  {SmileIcon ? <SmileIcon aria-hidden="true" /> : <span aria-hidden="true">☺</span>}
                </button>
                <label className="sr-only" htmlFor="game-chat-input">Gửi tin nhắn</label>
                <input
                  id="game-chat-input"
                  type="text"
                  value={chatInput}
                  onChange={(event) => setChatInput(event.target.value)}
                  placeholder="Gửi tin nhắn"
                  maxLength={240}
                />
                <button type="submit" className="game-pixel-button game-pixel-button--primary" disabled={!chatInput.trim()}>
                  Gửi
                </button>
              </form>
            </div>
          </section>
        ) : (
          <section
            id={activeConfig.panelId}
            className="game-activity-panel"
            role="tabpanel"
            aria-labelledby={activeConfig.tabId}
          >
            <div className="game-action-timeline">
              {actionLog.length === 0 ? (
                <div className="game-activity-empty">
                  <span aria-hidden="true">00</span>
                  <strong>Chưa có diễn biến</strong>
                  <p>Hành động trong trận sẽ xuất hiện tại đây.</p>
                </div>
              ) : actionLog.map((entry) => (
                <article key={entry.id}>
                  <span aria-hidden="true" />
                  <p>{entry.text}</p>
                  <time>{entry.timestamp}</time>
                </article>
              ))}
            </div>
          </section>
        )}
      </aside>
    </>
  );
}
