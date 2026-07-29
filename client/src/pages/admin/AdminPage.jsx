import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Button, SkeletonBlock } from './ui.jsx';
import OverviewPanel from './OverviewPanel.jsx';
import PlayersPanel from './PlayersPanel.jsx';
import CatalogPanel from './CatalogPanel.jsx';
import QuestsPanel from './QuestsPanel.jsx';
import TournamentsPanel from './TournamentsPanel.jsx';
import { useLanguage } from '../../context/LanguageContext.jsx';
import { getVisibleAdminNavigation, resolveAdminTab } from './adminNavigation.js';
import { useAdminApi } from './useAdminApi.js';

function getRequestedTab() {
  if (typeof window === 'undefined') return 'overview';
  return new URLSearchParams(window.location.search).get('adminTab') || 'overview';
}

export default function AdminPage({ setPage }) {
  const [activeTab, setActiveTab] = useState(getRequestedTab);
  const [session, setSession] = useState({ loading: true, data: null, error: '' });
  const { language, setLanguage } = useLanguage();
  const { request, token } = useAdminApi();
  const isEnglish = language === 'en';
  const permissions = session.data?.permissions || [];
  const navigation = useMemo(() => getVisibleAdminNavigation(permissions), [permissions]);

  const loadSession = useCallback(async () => {
    if (!token) {
      setSession({ loading: false, data: null, error: isEnglish ? 'Sign in with an admin account to continue.' : 'Hãy đăng nhập bằng tài khoản quản trị để tiếp tục.' });
      return;
    }
    setSession((current) => ({ ...current, loading: true, error: '' }));
    const response = await request('/api/admin/me');
    if (response.ok) {
      setSession({ loading: false, data: response.data?.data, error: '' });
      return;
    }
    setSession({
      loading: false,
      data: null,
      error: response.data?.error?.message || response.data?.message || response.error || (isEnglish ? 'Admin session could not be verified.' : 'Không thể xác minh phiên quản trị.'),
    });
  }, [isEnglish, request, token]);

  useEffect(() => { loadSession(); }, [loadSession]);

  useEffect(() => {
    if (session.loading || navigation.length === 0) return;
    const nextTab = resolveAdminTab(activeTab, navigation);
    if (nextTab !== activeTab) setActiveTab(nextTab);
  }, [activeTab, navigation, session.loading]);

  const navigateToTab = useCallback((tab) => {
    const nextTab = resolveAdminTab(tab, navigation);
    if (!nextTab) return;
    setActiveTab(nextTab);
    const url = new URL(window.location.href);
    url.searchParams.set('adminTab', nextTab);
    window.history.replaceState({}, '', url);
  }, [navigation]);

  if (session.loading) {
    return (
      <main className="admin-console min-h-[calc(100vh-96px)] bg-[var(--admin-canvas)] px-4 py-8" aria-busy="true" aria-label={isEnglish ? 'Verifying admin session' : 'Đang xác minh phiên quản trị'}>
        <div className="mx-auto w-full max-w-5xl rounded-xl border border-[var(--admin-border)] bg-[var(--admin-surface)] p-5">
          <p className="mb-4 text-sm font-semibold text-[var(--admin-text-muted)]">Boom-Kitten Operations</p>
          <SkeletonBlock rows={5} />
        </div>
      </main>
    );
  }

  if (!session.data) {
    return (
      <main className="admin-console min-h-[calc(100vh-96px)] bg-[var(--admin-canvas)] px-4 py-10">
        <div className="mx-auto flex w-full max-w-md flex-col gap-5 rounded-xl border border-[var(--admin-border)] bg-[var(--admin-surface)] p-6 text-center shadow-[0_16px_48px_rgba(32,35,31,0.06)]">
          <span className="material-symbols-outlined text-4xl text-[var(--admin-danger-text)]" aria-hidden="true">admin_panel_settings</span>
          <h1 className="text-2xl font-semibold tracking-[-0.03em] text-[var(--admin-text)]">{isEnglish ? 'Admin access unavailable' : 'Không thể truy cập Admin'}</h1>
          <Alert tone="danger">{session.error}</Alert>
          <div className="grid grid-cols-2 gap-3">
            <Button variant="secondary" onClick={loadSession}>{isEnglish ? 'Try again' : 'Thử lại'}</Button>
            <Button variant="primary" onClick={() => setPage('Login')}>{isEnglish ? 'Sign in' : 'Đăng nhập'}</Button>
          </div>
        </div>
      </main>
    );
  }

  const renderPanel = () => {
    switch (activeTab) {
      case 'players':
        return <PlayersPanel onNavigate={navigateToTab} language={language} permissions={permissions} adminUsername={session.data.admin.username} policy={session.data.policy || {}} />;
      case 'catalog':
        return <CatalogPanel permissions={permissions} />;
      case 'quests':
        return <QuestsPanel permissions={permissions} />;
      case 'tournaments':
        return <TournamentsPanel permissions={permissions} adminUsername={session.data.admin.username} />;
      default:
        return <OverviewPanel onNavigate={navigateToTab} language={language} permissions={permissions} />;
    }
  };

  return (
    <main className="admin-console min-h-[calc(100vh-96px)] bg-[var(--admin-canvas)] px-3 py-4 md:px-6 md:py-6 lg:px-8">
      <a href="#admin-content" className="fixed left-4 top-4 z-50 -translate-y-24 rounded-md bg-[var(--admin-accent)] px-3 py-2 font-semibold text-white focus:translate-y-0">{isEnglish ? 'Skip to admin content' : 'Bỏ qua đến nội dung quản trị'}</a>
      <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-6 lg:flex-row">
        <aside className="lg:sticky lg:top-4 lg:w-72 lg:shrink-0 lg:self-start">
          <div className="rounded-xl border border-[var(--admin-border)] bg-[var(--admin-surface)] p-3 shadow-[0_1px_2px_rgba(32,35,31,0.03)]">
            <div className="border-b border-[var(--admin-border)] px-2 pb-4 pt-1">
              <p className="flex items-center gap-2 text-xs font-semibold tracking-[0.08em] text-[var(--admin-accent)]">
                <span className="h-1.5 w-1.5 rounded-full bg-[var(--admin-accent)]" aria-hidden="true" />
                Boom-Kitten Ops
              </p>
              <h1 className="mt-2 text-balance text-xl font-semibold tracking-[-0.03em] text-[var(--admin-text)]">Admin Console</h1>
              <p className="mt-2 truncate font-mono text-sm font-medium text-[var(--admin-text-muted)]">{session.data.admin.username}</p>
              <div className="mt-2 flex items-center justify-between gap-2 text-xs font-medium text-[var(--admin-text-muted)]">
                <span>{session.data.admin.role === 'super_admin' ? (isEnglish ? 'Super admin' : 'Quản trị cấp cao') : (isEnglish ? 'Admin' : 'Quản trị viên')}</span>
                <span>{permissions.length} {isEnglish ? 'capabilities' : 'quyền'}</span>
              </div>
            </div>

            <nav className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-1" aria-label={isEnglish ? 'Admin sections' : 'Khu vực quản trị'}>
              {navigation.map((group) => (
                <section key={group.id} aria-labelledby={`admin-nav-${group.id}`}>
                  <h2 id={`admin-nav-${group.id}`} className="mb-1 px-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--admin-text-muted)]">{group[language] || group.vi}</h2>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-1">
                    {group.items.map((item) => {
                      const active = activeTab === item.id;
                      const [label, description] = item[language] || item.vi;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => navigateToTab(item.id)}
                          className={`flex min-h-12 items-center gap-3 rounded-lg border px-3 py-2 text-left transition duration-200 focus:outline-none focus:ring-2 focus:ring-[var(--admin-focus)] focus:ring-offset-2 active:scale-[0.99] ${
                            active ? 'border-[var(--admin-accent)] bg-[var(--admin-danger-bg)] text-[var(--admin-accent)]' : 'border-transparent text-[var(--admin-text)] hover:border-[var(--admin-border)] hover:bg-[var(--admin-surface-muted)]'
                          }`}
                          aria-current={active ? 'page' : undefined}
                        >
                          <span className="material-symbols-outlined text-[20px]" aria-hidden="true">{item.icon}</span>
                          <span className="min-w-0"><span className="block truncate text-sm font-semibold">{label}</span>
                          <span className="hidden truncate text-xs text-[var(--admin-text-muted)] lg:block">{description}</span></span>
                        </button>
                      );
                    })}
                  </div>
                </section>
              ))}
            </nav>
            <div className="mt-4 border-t border-[var(--admin-border)] pt-3">
              <p className="mb-2 px-1 text-xs font-medium text-[var(--admin-text-muted)]">{isEnglish ? 'Language' : 'Ngôn ngữ'}</p>
              <div className="grid grid-cols-2 gap-2" role="group" aria-label="Language">
                <Button className="min-h-9 px-2 py-1" variant={!isEnglish ? 'primary' : 'secondary'} onClick={() => setLanguage('vi')} aria-pressed={!isEnglish}>VI</Button>
                <Button className="min-h-9 px-2 py-1" variant={isEnglish ? 'primary' : 'secondary'} onClick={() => setLanguage('en')} aria-pressed={isEnglish}>EN</Button>
              </div>
            </div>
          </div>
        </aside>

        <section id="admin-content" tabIndex="-1" className="min-w-0 flex-1">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-[var(--admin-border)] bg-[var(--admin-surface)] px-4 py-2.5 text-sm text-[var(--admin-text-muted)]">
            <span className="font-medium">{isEnglish ? 'Session verified against current permissions' : 'Phiên đã xác minh theo quyền hiện hành'}</span>
            <span className="inline-flex items-center gap-2 font-mono text-xs text-[var(--admin-success-text)]">
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--admin-success-text)]" aria-hidden="true" />
              {session.data.admin.role === 'super_admin' ? (isEnglish ? 'Super admin' : 'Quản trị cấp cao') : (isEnglish ? 'Admin' : 'Quản trị viên')}
            </span>
          </div>
          {renderPanel()}
        </section>
      </div>
    </main>
  );
}
