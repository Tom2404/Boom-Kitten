import React from 'react';
import { useGameContext } from '../GameContext.jsx';

export default function GameSidePanel() {
  const context = useGameContext();
  const {
    EMOTES_LIST,
    actionLog,
    chatMessages,
    isSidebarOpen,
    myUser,
    rightPanelTab,
    sendChatMessage,
    sendEmote,
    setRightPanelTab,
    setIsSidebarOpen,
  } = context;
  const [chatInput, setChatInput] = React.useState('');

  const handleSendChat = (e) => {
    e.preventDefault();
    if (chatInput.trim()) {
      sendChatMessage(chatInput.trim());
      setChatInput('');
    }
  };

  return (
    <>
{/* Chat & Lịch Sử Panel (Right 1 column) */}
<aside id="game-side-panel" aria-label="Chat và lịch sử trận đấu" className={`fixed inset-x-3 bottom-3 top-20 z-40 flex flex-col justify-between border-4 border-[var(--pop-black)] bg-white p-4 shadow-[8px_8px_0_var(--pop-black)] lg:static lg:col-span-1 lg:h-[82vh] lg:p-5 ${isSidebarOpen ? 'flex' : 'hidden'}`}>
<button type="button" onClick={() => setIsSidebarOpen(false)} className="mb-2 self-end border-2 border-[var(--pop-black)] bg-[var(--pop-cream)] px-3 py-1 font-pop-accent text-xs font-black uppercase shadow-[2px_2px_0_var(--pop-black)] lg:hidden" aria-label="Đóng chat và lịch sử">Đóng</button>
<div className="flex flex-col gap-4 flex-1 overflow-hidden">

  {/* Header Tab Switcher */}
  <div className="flex gap-2 border-b-4 border-[var(--pop-black)] pb-2.5" role="tablist" aria-label="Nội dung bên trận đấu">
    <button
      onClick={() => setRightPanelTab('chat')}
      role="tab"
      aria-selected={rightPanelTab === 'chat'}
      className={`flex-1 py-1.5 rounded-none border-3 border-[var(--pop-black)] font-pop-accent font-black text-xs uppercase shadow-[2px_2px_0_var(--pop-black)] transition-all
        ${rightPanelTab === 'chat'
          ? 'bg-[var(--pop-red)] text-white -translate-y-0.5 shadow-[4px_4px_0_var(--pop-black)]'
          : 'bg-white hover:bg-[var(--pop-cream)] text-[var(--pop-black)]'}`}
    >
      Chat
    </button>
    <button
      onClick={() => setRightPanelTab('log')}
      role="tab"
      aria-selected={rightPanelTab === 'log'}
      className={`flex-1 py-1.5 rounded-none border-3 border-[var(--pop-black)] font-pop-accent font-black text-xs uppercase shadow-[2px_2px_0_var(--pop-black)] transition-all
        ${rightPanelTab === 'log'
          ? 'bg-[var(--pop-red)] text-white -translate-y-0.5 shadow-[4px_4px_0_var(--pop-black)]'
          : 'bg-white hover:bg-[var(--pop-cream)] text-[var(--pop-black)]'}`}
    >
      Lịch sử
    </button>
  </div>

  {rightPanelTab === 'chat' && (
    <div className="flex-1 flex flex-col gap-4 overflow-hidden">
      {/* Emotes quick buttons */}
      <div className="flex flex-col gap-2">
        <span className="text-[10px] font-pop-accent font-black text-[var(--pop-black)]/70 uppercase tracking-wider">Phát biểu cảm nhanh</span>
        <div className="grid grid-cols-4 gap-2">
          {EMOTES_LIST.map((emote) => (
            <button
              key={emote.id}
              onClick={() => sendEmote(emote.id)}
              className="h-10 text-2xl bg-white border-2 border-[var(--pop-black)] hover:bg-[var(--pop-cream)] rounded-none transition-all active:translate-y-0.5 active:shadow-none flex items-center justify-center shadow-[2px_2px_0_var(--pop-black)]"
            >
              {emote.char}
            </button>
          ))}
        </div>
      </div>

      {/* Chat Messages history */}
      <div className="flex-1 flex flex-col gap-2.5 overflow-y-auto border-t-3 border-dashed border-[var(--pop-black)]/30 pt-3 pr-1 hide-scroll">
        {chatMessages.length === 0 ? (
          <div className="text-center text-[var(--pop-black)]/70 text-xs py-8 font-pop-body font-bold italic">
            Chưa có cuộc hội thoại nào. Chat để trêu đùa đối thủ!
          </div>
        ) : (
          chatMessages.map((msg, index) => {
            const isMe = msg.userId === myUser?.id;
            return (
              <div
                key={index}
                className={`flex flex-col max-w-[85%] rounded-none px-3.5 py-2 text-xs border-3 border-[var(--pop-black)]
                  ${isMe
                    ? 'self-end bg-[var(--pop-red)] text-white shadow-[-3px_3px_0_var(--pop-black)]'
                    : 'self-start bg-[var(--pop-cream)] text-[var(--pop-black)] shadow-[3px_3px_0_var(--pop-black)]'}`}
              >
                <span className="font-pop-accent font-black text-[9px] mb-0.5 uppercase opacity-90">
                  {isMe ? 'BẠN' : msg.username}
                </span>
                <p className="leading-relaxed font-pop-body font-bold">{msg.text}</p>
              </div>
            );
          })
        )}
        </div>
    </div>
  )}

  {rightPanelTab === 'log' && (
    <div className="flex-1 flex flex-col gap-3 overflow-hidden">
      <span className="text-[10px] font-pop-accent font-black text-[var(--pop-black)]/70 uppercase tracking-wider">Nhật ký diễn biến</span>
      <div className="flex-1 flex flex-col gap-2 overflow-y-auto pr-1 hide-scroll bg-white border-3 border-[var(--pop-black)] rounded-none p-3 shadow-[3px_3px_0_var(--pop-black)]">
        {actionLog.length === 0 ? (
          <div className="text-center text-[var(--pop-black)]/70 text-xs py-8 font-pop-body font-bold italic">
            Chưa có diễn biến nào được ghi nhận.
          </div>
        ) : (
          actionLog.map((log) => (
            <div
              key={log.id}
              className="flex justify-between items-start gap-2 border-b-2 border-[var(--pop-black)]/10 pb-1.5 text-xs font-bold font-pop-body text-[var(--pop-black)] last:border-b-0"
            >
              <span className="leading-relaxed flex-1">{log.text}</span>
              <span className="text-[9px] text-[var(--pop-black)]/80 font-mono whitespace-nowrap bg-[var(--pop-cream)] border-2 border-[var(--pop-black)] px-1.5 py-0.5 rounded-none">{log.timestamp}</span>
            </div>
          ))
        )}
      </div>
    </div>
  )}
</div>

{/* Input Chat bar */}
<form onSubmit={handleSendChat} className="flex gap-2 border-t-3 border-[var(--pop-black)] pt-3 mt-2">
  <input
    type="text"
    placeholder={rightPanelTab === 'chat' ? "Gửi tin nhắn hăm dọa..." : "Chuyển sang tab Chat để trò chuyện"}
    disabled={rightPanelTab !== 'chat'}
    value={chatInput}
    onChange={(e) => setChatInput(e.target.value)}
    className="flex-1 bg-white border-3 border-[var(--pop-black)] rounded-none px-3 py-2 text-xs text-[var(--pop-black)] font-pop-body font-bold focus:outline-none focus:bg-[var(--pop-cream)] transition-all shadow-[3px_3px_0_var(--pop-black)] focus:shadow-[4px_4px_0_var(--pop-black)] focus:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
  />
  <button
    type="submit"
    disabled={rightPanelTab !== 'chat'}
    className="px-4 py-2 bg-[var(--pop-red)] text-white font-pop-display font-black rounded-none text-xs border-3 border-[var(--pop-black)] shadow-[3px_3px_0_var(--pop-black)] active:translate-y-0.5 active:shadow-none hover:-translate-y-0.5 hover:shadow-[4px_4px_0_var(--pop-black)] disabled:opacity-50 disabled:cursor-not-allowed uppercase"
  >
    Gửi
  </button>
</form>
      </aside>
    </>
  );
}
