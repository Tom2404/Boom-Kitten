import { useMemo, useState, useEffect, Component, Suspense, lazy } from 'react';
import Home from './pages/Home.jsx';
import Navbar from './components/Navbar.jsx';
import { useSocket } from './hooks/useSocket.js';
import { useLanguage } from './context/LanguageContext.jsx';
import CustomDialog from './components/CustomDialog.jsx';
import { isAdminRole } from './utils/adminRoles.js';
import { REQUIRED_VFX_ASSET_URLS } from './vfx/config/vfxAssets.js';
import { shouldResumeActiveMatch } from './utils/gameRoomUi.js';
import { endAuthSession, refreshAccessToken } from './utils/authSession.js';

const Login = lazy(() => import('./pages/Login.jsx'));
const Register = lazy(() => import('./pages/Register.jsx'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword.jsx'));
const ResetPassword = lazy(() => import('./pages/ResetPassword.jsx'));
const Lobby = lazy(() => import('./pages/Lobby.jsx'));
const Game = lazy(() => import('./pages/Game.jsx'));
const Profile = lazy(() => import('./pages/Profile.jsx'));
const Friends = lazy(() => import('./pages/Friends.jsx'));
const Leaderboard = lazy(() => import('./pages/Leaderboard.jsx'));
const Shop = lazy(() => import('./pages/Shop.jsx'));
const Wardrobe = lazy(() => import('./pages/Wardrobe.jsx'));
const Tournaments = lazy(() => import('./pages/Tournaments.jsx'));
const Admin = lazy(() => import('./pages/Admin.jsx'));
const loadVfxOverlay = () => import('./components/VFXOverlay.jsx').then((module) => ({ default: module.VFXOverlay }));
const VFXOverlay = lazy(loadVfxOverlay);

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }
  componentDidCatch(error, errorInfo) {
    this.setState({ hasError: true, error, errorInfo });
    console.error("ErrorBoundary caught an error", error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '20px', background: 'red', color: 'white', zIndex: 99999, position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, overflow: 'auto' }}>
          <h1>React Error Boundary</h1>
          <pre style={{ whiteSpace: 'pre-wrap' }}>{this.state.error?.toString()}</pre>
          <pre style={{ whiteSpace: 'pre-wrap' }}>{this.state.errorInfo?.componentStack}</pre>
        </div>
      );
    }
    return this.props.children;
  }
}

const Mission = lazy(() => import('./pages/Mission.jsx'));

const PAGES = { Home, Login, Register, ForgotPassword, ResetPassword, Lobby, Game, Profile, Friends, Leaderboard, Shop, Wardrobe, Tournaments, Admin, Mission };

const VIEWPORT_FIT_PAGES = new Set(['Leaderboard', 'Tournaments', 'Game']);

export default function App() {
  const { language, setLanguage, t } = useLanguage();

  // Initialize state synchronously from token to prevent flashing incorrect UI
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    return !!localStorage.getItem('accessToken');
  });

  const [userRole, setUserRole] = useState(() => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const payload = JSON.parse(window.atob(base64));
        return payload.role || 'user';
      } catch (e) { }
    }
    return 'user';
  });

  const [page, setPage] = useState(() => {
    if (new URLSearchParams(window.location.search).has('resetToken')) return 'ResetPassword';
    const token = localStorage.getItem('accessToken');
    if (token) {
      try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const payload = JSON.parse(window.atob(base64));
        if (isAdminRole(payload.role)) {
          return 'Admin';
        }
      } catch (e) { }
    }
    return 'Home';
  });

  const [announcement, setAnnouncement] = useState(null);
  const [activeRoom, setActiveRoom] = useState(null);
  const socket = useSocket();

  // Decode JWT role and login status on render & storage update
  const syncAuthState = () => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      setIsLoggedIn(true);
      try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const payload = JSON.parse(window.atob(base64));
        const role = payload.role || 'user';
        setUserRole(role);
        if (isAdminRole(role)) {
          setPage((current) => (current === 'ResetPassword' ? current : 'Admin'));
        }
      } catch (e) {
        setUserRole('user');
      }
    } else {
      setIsLoggedIn(false);
      setUserRole('user');
    }
  };

  useEffect(() => {
    syncAuthState();

    // Check auth status periodically
    const interval = setInterval(syncAuthState, 2000);

    // Setup socket connection and listen for server announcements
    socket.connect();

    const handleAnnouncement = (data) => {
      setAnnouncement(data.text);
      // Auto dismiss after 10 seconds
      setTimeout(() => setAnnouncement(null), 10000);
    };

    const handleRoomUpdated = ({ room }) => {
      if (isAdminRole(userRole)) return;
      setActiveRoom(room);
      if (shouldResumeActiveMatch(room)) setPage('Game');
    };
    socket.on('room:updated', handleRoomUpdated);

    return () => {
      clearInterval(interval);
      socket.off('server_announcement', handleAnnouncement);
      socket.off('room:updated', handleRoomUpdated);
    };
  }, [socket]);

  useEffect(() => {
    window.addEventListener('auth:changed', syncAuthState);
    return () => window.removeEventListener('auth:changed', syncAuthState);
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('accessToken') ?? '';
    if (socket.auth?.token === token) return;
    socket.auth = { ...socket.auth, token };
    if (socket.connected && !activeRoom) {
      socket.disconnect();
      socket.connect();
    }
  }, [activeRoom, isLoggedIn, socket]);

  useEffect(() => {
    let cancelled = false;
    const refreshSession = async () => {
      const accessToken = await refreshAccessToken();
      if (!accessToken || cancelled) return;
      localStorage.setItem('accessToken', accessToken);
      socket.auth = { ...socket.auth, token: accessToken };
      syncAuthState();
    };

    void refreshSession();
    const interval = setInterval(() => { void refreshSession(); }, 12 * 60 * 1000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [socket]);

  useEffect(() => {
    document.documentElement.lang = language;
    if (language === 'vi') {
      document.body.classList.add('lang-vi');
    } else {
      document.body.classList.remove('lang-vi');
    }
  }, [language]);

  useEffect(() => {
    if (activeRoom?.status !== 'waiting') return;

    void Promise.allSettled([
      loadVfxOverlay(),
      ...REQUIRED_VFX_ASSET_URLS.map((url) => fetch(url, { cache: 'force-cache' })),
    ]);
  }, [activeRoom?.status]);

  // Global access guard for admin role to restrict user-facing routes
  useEffect(() => {
    if (isAdminRole(userRole) && ['Game', 'Mission', 'Shop', 'Wardrobe', 'Profile', 'Friends', 'Leaderboard', 'Tournaments', 'Home', 'Lobby'].includes(page)) {
      setPage('Admin');
    }
  }, [page, userRole]);

  const [dialogState, setDialogState] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: null,
  });

  useEffect(() => {
    const handleRoomInvitation = ({ roomCode, inviterUsername, expiresAt }) => {
      if (isAdminRole(userRole) || !roomCode || expiresAt <= Date.now()) return;
      setDialogState({
        isOpen: true,
        title: 'Lời mời vào phòng',
        message: `${inviterUsername || 'Một người bạn'} mời bạn vào phòng ${roomCode}.`,
        onConfirm: () => {
          setPage('Game');
          socket.emit('room:join', { roomCode });
          setDialogState({ isOpen: false });
        },
      });
    };
    socket.on('room:invitation', handleRoomInvitation);
    return () => socket.off('room:invitation', handleRoomInvitation);
  }, [socket, userRole]);

  const navigateWithConfirm = (targetPage) => {
    if (isAdminRole(userRole) && targetPage !== 'Admin' && targetPage !== 'ResetPassword') {
      setPage('Admin');
      return;
    }

    if (activeRoom && (activeRoom.status === 'waiting' || activeRoom.status === 'playing')) {
      setDialogState({
        isOpen: true,
        title: t('dialog_leave_room_title'),
        message: t('dialog_leave_room_msg'),
        onConfirm: () => {
          socket.emit('room:leave');
          setActiveRoom(null);
          setPage(targetPage);
          setDialogState({ isOpen: false });
        },
      });
    } else {
      setPage(targetPage);
    }
  };

  const handleLogout = () => {
    if (activeRoom && (activeRoom.status === 'waiting' || activeRoom.status === 'playing')) {
      setDialogState({
        isOpen: true,
        title: t('dialog_logout_title'),
        message: t('dialog_logout_msg'),
        onConfirm: () => {
          socket.emit('room:leave');
          setActiveRoom(null);
          void endAuthSession();
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          setIsLoggedIn(false);
          setUserRole('user');
          setPage('Home');
          setDialogState({ isOpen: false });
        },
      });
    } else {
      void endAuthSession();
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      setIsLoggedIn(false);
      setUserRole('user');
      setPage('Home');
    }
  };


  const Page = useMemo(() => PAGES[page] ?? Home, [page]);
  const isInMatch = page === 'Game' && activeRoom !== null;
  const shouldRenderVfx = page === 'Game' && activeRoom?.status === 'playing';
  const isAdminPage = page === 'Admin';
  // Game-screen pages fit in 100dvh; the in-match board already handles its own sizing.
  const isViewportFit = VIEWPORT_FIT_PAGES.has(page) && !isInMatch;

  if (page === 'Home') {
    return (
      <div className="min-h-screen bg-[var(--pop-cream)] text-[var(--pop-black)] flex flex-col selection:bg-[var(--pop-amber)] selection:text-[var(--pop-black)]">
        {/* Floating Server Announcement */}
        {announcement && (
          <div className="bg-primary text-on-primary py-2 px-4 border-b-4 border-on-surface font-headline font-bold text-center z-50 flex items-center justify-between gap-4">
            <div className="flex-1 flex justify-center items-center gap-2">
              <span className="material-symbols-outlined animate-bounce">campaign</span>
              <span>{announcement}</span>
            </div>
            <button onClick={() => setAnnouncement(null)} className="font-bold hover:scale-110 active:scale-95">✕</button>
          </div>
        )}

        <Home
          setPage={navigateWithConfirm}
          isLoggedIn={isLoggedIn}
          userRole={userRole}
          handleLogout={handleLogout}
        />

        <CustomDialog
          isOpen={dialogState.isOpen}
          title={dialogState.title}
          message={dialogState.message}
          isConfirm={true}
          onConfirm={dialogState.onConfirm}
          onCancel={() => setDialogState({ isOpen: false })}
        />
      </div>
    );
  }

  return (
    <div className={isAdminPage
      ? 'admin-console min-h-screen bg-[var(--admin-canvas)] text-[var(--admin-text)] flex flex-col selection:bg-[var(--admin-danger-bg)] selection:text-[var(--admin-text)]'
      : `pop-art-theme min-h-screen ${isViewportFit ? 'viewport-fit-shell ' : ''}${isInMatch ? 'bg-[#0b0d14]' : 'bg-[var(--pop-cream)]'} text-[var(--pop-black)] flex flex-col selection:bg-[var(--pop-amber)] selection:text-[var(--pop-black)]`
    }>
      {/* Floating Server Announcement */}
      {announcement && (
        <div className={isAdminPage
          ? 'z-50 flex items-center justify-between gap-4 border-b border-[var(--admin-border)] bg-[var(--admin-info-bg)] px-4 py-2.5 text-center text-sm font-medium text-[var(--admin-info-text)]'
          : 'bg-[var(--pop-red)] text-white py-2.5 px-4 pop-border-3 border-x-0 border-t-0 font-pop-accent font-bold text-center z-50 flex items-center justify-between gap-4 shadow-[0_4px_0_var(--pop-black)]'
        }>
          <div className="flex-1 flex justify-center items-center gap-2">
            <span className={`material-symbols-outlined ${isAdminPage ? 'text-[20px]' : 'animate-bounce'}`}>campaign</span>
            <span className={isAdminPage ? '' : 'uppercase tracking-wider text-xs md:text-sm'}>{announcement}</span>
          </div>
          <button
            onClick={() => setAnnouncement(null)}
            className={isAdminPage
              ? 'rounded p-1 text-[var(--admin-info-text)] transition-colors hover:bg-black/5 focus:outline-none focus:ring-2 focus:ring-[var(--admin-focus)]'
              : 'font-bold hover:scale-110 active:scale-95 text-white'
            }
            aria-label={language === 'en' ? 'Dismiss announcement' : 'Đóng thông báo'}
          >
            ✕
          </button>
        </div>
      )}

      {/* Navigation Header */}
      {!isInMatch && (
        <Navbar
          page={page}
          setPage={navigateWithConfirm}
          isLoggedIn={isLoggedIn}
          userRole={userRole}
          handleLogout={handleLogout}
        />
      )}

      {/* Main Page Area */}
      <main className={`flex-grow ${isAdminPage ? 'w-full' : isInMatch ? 'p-0 w-full max-w-none' : page === 'Wardrobe' ? 'mx-auto w-full max-w-[1500px] p-3 md:p-6' : isViewportFit ? 'p-3 md:p-5 max-w-7xl mx-auto w-full' : 'p-4 md:p-8 max-w-7xl mx-auto w-full'}`}>
        <ErrorBoundary>
          <Suspense fallback={<div className={isAdminPage ? 'py-10 text-center text-sm text-[var(--admin-text-muted)]' : 'font-pop-body text-center py-10'}>Loading...</div>}>
            <Page setPage={setPage} initialRoom={page === 'Game' ? activeRoom : null} />
          </Suspense>
        </ErrorBoundary>
      </main>

      {/* Footer */}
      {!isInMatch && !isAdminPage && !isViewportFit && (
        <footer className="w-full border-t-2 border-[var(--pop-black)] py-8 bg-[var(--pop-cream)] mt-auto font-pop-body">
          <div className="max-w-7xl mx-auto px-4 md:px-12 flex flex-col md:flex-row justify-between items-center gap-4 text-center md:text-left">
            <div className="font-pop-display font-black text-xl text-[var(--pop-red)] uppercase tracking-tight">
              Mèo Nổ
            </div>
            <p className="text-xs text-[var(--pop-black)]/60 font-bold uppercase tracking-wider">
              {language === 'en'
                ? "© 2026 BOOM-KITTEN — WARNING: DON'T TOUCH THE RED BUTTON."
                : "© 2026 BOOM-KITTEN — CẢNH BÁO: ĐỪNG CHẠM VÀO NÚT ĐỎ."
              }
            </p>
          </div>
        </footer>
      )}

      <CustomDialog
        isOpen={dialogState.isOpen}
        title={dialogState.title}
        message={dialogState.message}
        isConfirm={true}
        onConfirm={dialogState.onConfirm}
        onCancel={() => setDialogState({ isOpen: false })}
      />
      {shouldRenderVfx && (
        <Suspense fallback={null}>
          <VFXOverlay />
        </Suspense>
      )}
    </div>
  );
}
