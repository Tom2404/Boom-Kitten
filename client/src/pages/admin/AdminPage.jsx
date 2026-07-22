import React, { useState } from 'react';
import { Button } from './ui.jsx';
import { getAdminPayload } from './utils.js';
import OverviewPanel from './OverviewPanel.jsx';
import PlayersPanel from './PlayersPanel.jsx';
import CatalogPanel from './CatalogPanel.jsx';
import QuestsPanel from './QuestsPanel.jsx';
import AnnouncementsPanel from './AnnouncementsPanel.jsx';
import LogsPanel from './LogsPanel.jsx';
import SeasonsPanel from './SeasonsPanel.jsx';
import { useLanguage } from '../../context/LanguageContext.jsx';

const NAV_ITEMS = [
  { id: 'overview', icon: 'monitoring', vi: ['Tổng quan', 'Sức khỏe hệ thống'], en: ['Overview', 'System health'] },
  { id: 'players', icon: 'group', vi: ['Người chơi', 'Tài khoản, ví, ELO'], en: ['Players', 'Accounts, wallet, ELO'] },
  { id: 'catalog', icon: 'storefront', vi: ['Shop', 'Vật phẩm và trạng thái'], en: ['Shop', 'Items and availability'] },
  { id: 'quests', icon: 'flag', vi: ['Nhiệm vụ', 'Mục tiêu và thưởng'], en: ['Quests', 'Goals and rewards'] },
  { id: 'announcements', icon: 'campaign', vi: ['Thông báo', 'Broadcast trực tiếp'], en: ['Announcements', 'Live broadcasts'] },
  { id: 'logs', icon: 'receipt_long', vi: ['Nhật ký', 'Audit và giao dịch'], en: ['Logs', 'Audit and transactions'] },
  { id: 'seasons', icon: 'emoji_events', vi: ['Mùa giải', 'Reset và lịch mùa'], en: ['Seasons', 'Reset and scheduling'] },
];

export default function AdminPage({ setPage }) {
  const [activeTab, setActiveTab] = useState('overview');
  const { language, setLanguage } = useLanguage();
  const isEnglish = language === 'en';
  const payload = getAdminPayload();
  const isAdmin = payload?.role === 'admin';

  if (!isAdmin) {
    return (
      <main className="mx-auto flex w-full max-w-md flex-col gap-5 border-[4px] border-[var(--pop-black)] bg-[#fff7df] p-6 text-center shadow-[6px_6px_0_var(--pop-black)]">
        <h1 className="font-pop-display text-2xl font-black text-red-700">Không có quyền truy cập</h1>
        <p className="text-sm font-semibold leading-6 text-slate-600">Bạn cần đăng nhập bằng tài khoản quản trị viên để mở bảng điều hành.</p>
        <Button variant="primary" onClick={() => setPage('Login')}>
          Đăng nhập Admin
        </Button>
      </main>
    );
  }

  const renderPanel = () => {
    switch (activeTab) {
      case 'players':
        return <PlayersPanel onNavigate={setActiveTab} language={language} />;
      case 'catalog':
        return <CatalogPanel />;
      case 'quests':
        return <QuestsPanel />;
      case 'announcements':
        return <AnnouncementsPanel />;
      case 'logs':
        return <LogsPanel language={language} />;
      case 'seasons':
        return <SeasonsPanel />;
      default:
        return <OverviewPanel onNavigate={setActiveTab} language={language} />;
    }
  };

  return (
    <main className="min-h-[calc(100vh-96px)] bg-[#f7e7c6] bg-[linear-gradient(90deg,rgba(77,48,37,.05)_1px,transparent_1px),linear-gradient(rgba(77,48,37,.05)_1px,transparent_1px)] bg-[size:16px_16px] px-3 py-4 font-sans text-[var(--pop-black)] md:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-5 lg:flex-row">
        <aside className="lg:w-64 lg:shrink-0 lg:self-start">
          <div className="border-[4px] border-[var(--pop-black)] bg-[#fff7df] p-3 shadow-[6px_6px_0_var(--pop-black)]">
            <div className="border-b-[3px] border-[var(--pop-black)] px-2 pb-3">
              <p className="font-sans text-xs font-black uppercase tracking-widest text-[var(--pop-red)]">● Boom-Kitten Ops</p>
              <h1 className="mt-2 font-pop-display text-xl font-black uppercase text-[var(--pop-black)]">Admin Console</h1>
              <p className="mt-2 font-sans text-sm font-bold text-[#65483d]">OPERATOR: {payload?.username || 'Quản trị viên'}</p>
            </div>

            <nav className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-1" aria-label="Admin sections">
              {NAV_ITEMS.map((item) => {
                const active = activeTab === item.id;
                const [label, description] = item[language] || item.vi;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setActiveTab(item.id)}
                    className={`flex min-h-12 items-center gap-3 border-[3px] px-3 py-2 text-left font-sans transition focus:outline-none focus:ring-2 focus:ring-[#2563eb] focus:ring-offset-2 ${
                      active ? 'translate-x-1 border-[var(--pop-black)] bg-[var(--pop-amber)] text-[var(--pop-black)] shadow-[3px_3px_0_var(--pop-black)]' : 'border-transparent text-[#4d3025] hover:border-[var(--pop-black)] hover:bg-[#f5e7c8]'
                    }`}
                    aria-current={active ? 'page' : undefined}
                  >
                    <span className="material-symbols-outlined" aria-hidden="true">{item.icon}</span>
                    <span><span className="block text-base font-black uppercase">{label}</span>
                    <span className="hidden text-sm font-semibold text-[#76574a] lg:block">{description}</span></span>
                  </button>
                );
              })}
            </nav>
            <div className="mt-4 border-t-[3px] border-[var(--pop-black)] pt-3">
              <p className="mb-2 text-xs font-black uppercase tracking-wider text-[#65483d]">{isEnglish ? 'Language' : 'Ngôn ngữ'}</p>
              <div className="grid grid-cols-2 gap-2" role="group" aria-label="Language">
                <Button className="min-h-9 px-2 py-1" variant={!isEnglish ? 'primary' : 'secondary'} onClick={() => setLanguage('vi')} aria-pressed={!isEnglish}>VI</Button>
                <Button className="min-h-9 px-2 py-1" variant={isEnglish ? 'primary' : 'secondary'} onClick={() => setLanguage('en')} aria-pressed={isEnglish}>EN</Button>
              </div>
            </div>
          </div>
        </aside>

        <section className="min-w-0 flex-1">
          <div className="mb-4 flex items-center justify-between border-[3px] border-[var(--pop-black)] bg-[var(--pop-black)] px-4 py-2 font-sans text-sm text-[#fff7df] shadow-[4px_4px_0_#c44d2d]">
            <span className="font-bold uppercase tracking-wider">{isEnglish ? 'System status: operational' : 'Trạng thái hệ thống: ổn định'}</span>
            <span className="text-[#86efac]">● LIVE</span>
          </div>
          {renderPanel()}
        </section>
      </div>
    </main>
  );
}
