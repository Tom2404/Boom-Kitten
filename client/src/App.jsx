import { useMemo, useState, useEffect } from 'react';
import Home from './pages/Home.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import Lobby from './pages/Lobby.jsx';
import Game from './pages/Game.jsx';
import Profile from './pages/Profile.jsx';
import Leaderboard from './pages/Leaderboard.jsx';
import Shop from './pages/Shop.jsx';
import Admin from './pages/Admin.jsx';
import { useSocket } from './hooks/useSocket.js';
import { useLanguage } from './context/LanguageContext.jsx';
import CustomDialog from './components/CustomDialog.jsx';

const PAGES = { Home, Login, Register, Lobby, Game, Profile, Leaderboard, Shop, Admin };

export default function App() {
  const { language, setLanguage, t } = useLanguage();
  const [page, setPage] = useState('Home');
  const [announcement, setAnnouncement] = useState(null);
  const [userRole, setUserRole] = useState('user');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
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
        setUserRole(payload.role || 'user');
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
      setActiveRoom(room);
    };

    socket.on('server_announcement', handleAnnouncement);
    socket.on('room:updated', handleRoomUpdated);

    return () => {
      clearInterval(interval);
      socket.off('server_announcement', handleAnnouncement);
      socket.off('room:updated', handleRoomUpdated);
    };
  }, [socket]);

  const [dialogState, setDialogState] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: null,
  });

  const navigateWithConfirm = (targetPage) => {
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
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          setIsLoggedIn(false);
          setUserRole('user');
          setPage('Home');
          setDialogState({ isOpen: false });
        },
      });
    } else {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      setIsLoggedIn(false);
      setUserRole('user');
      setPage('Home');
    }
  };

  const Page = useMemo(() => PAGES[page] ?? Home, [page]);
  const isInMatch = page === 'Game' && activeRoom !== null;

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
    <div className="min-h-screen bg-background text-on-background flex flex-col">
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

      {/* Navigation Header */}
      {!isInMatch && (
        <nav className="sticky top-0 w-full z-40 border-b-4 border-on-surface bg-surface shadow-[4px_4px_0px_0px_#1a1c1c]">
        <div className="flex justify-between items-center px-4 md:px-12 py-4 max-w-7xl mx-auto flex-wrap gap-4">
          <button 
            onClick={() => navigateWithConfirm('Home')}
            className="font-headline text-2xl md:text-3xl italic font-black text-primary uppercase tracking-tighter hover:scale-105 hover:-translate-y-1 transition-all duration-100"
          >
            EXPLODING KITTENS
          </button>
          
          <div className="flex gap-4 md:gap-8 items-center flex-wrap">
            <button 
              className={`font-headline font-bold pb-1 text-sm md:text-base border-b-2 transition-all ${page === 'Home' ? 'text-primary border-primary' : 'text-on-surface-variant border-transparent hover:text-primary'}`}
              onClick={() => navigateWithConfirm('Home')}
            >
              {t('home')}
            </button>
            <button 
              className={`font-headline font-bold pb-1 text-sm md:text-base border-b-2 transition-all ${page === 'Game' ? 'text-primary border-primary' : 'text-on-surface-variant border-transparent hover:text-primary'}`}
              onClick={() => navigateWithConfirm('Game')}
            >
              {t('arena')}
            </button>
            <button 
              className={`font-headline font-bold pb-1 text-sm md:text-base border-b-2 transition-all ${page === 'Leaderboard' ? 'text-primary border-primary' : 'text-on-surface-variant border-transparent hover:text-primary'}`}
              onClick={() => navigateWithConfirm('Leaderboard')}
            >
              {t('leaderboard')}
            </button>
            <button 
              className={`font-headline font-bold pb-1 text-sm md:text-base border-b-2 transition-all ${page === 'Shop' ? 'text-primary border-primary' : 'text-on-surface-variant border-transparent hover:text-primary'}`}
              onClick={() => navigateWithConfirm('Shop')}
            >
              {t('shop')}
            </button>
            
            {isLoggedIn ? (
              <>
                <button 
                  className={`font-headline font-bold pb-1 text-sm md:text-base border-b-2 transition-all ${page === 'Profile' ? 'text-primary border-primary' : 'text-on-surface-variant border-transparent hover:text-primary'}`}
                  onClick={() => navigateWithConfirm('Profile')}
                >
                  {t('profile')}
                </button>
                {userRole === 'admin' && (
                  <button 
                    className={`bg-yellow-400 text-slate-950 font-headline font-bold border-2 border-on-surface shadow-[2px_2px_0px_0px_#1a1c1c] px-3 py-1 text-xs hover:scale-105 active:scale-95 transition-all`}
                    onClick={() => navigateWithConfirm('Admin')}
                  >
                    {t('admin')}
                  </button>
                )}
                <button 
                  onClick={handleLogout}
                  className="bg-secondary text-on-error font-headline font-bold border-2 border-on-surface shadow-[2px_2px_0px_0px_#1a1c1c] px-3 py-1 text-xs hover:scale-105 active:scale-95 transition-all"
                >
                  {t('logout')}
                </button>
              </>
            ) : (
              <>
                <button 
                  className={`font-headline font-bold pb-1 text-sm md:text-base border-b-2 transition-all ${page === 'Login' ? 'text-primary border-primary' : 'text-on-surface-variant border-transparent hover:text-primary'}`}
                  onClick={() => navigateWithConfirm('Login')}
                >
                  {t('login')}
                </button>
                <button 
                  className={`bg-primary-container text-on-primary-container font-headline font-bold border-2 border-on-surface shadow-[2px_2px_0px_0px_#1a1c1c] px-3 py-1 text-xs md:text-sm hover:scale-105 active:scale-95 transition-all`}
                  onClick={() => navigateWithConfirm('Register')}
                >
                  {t('register')}
                </button>
              </>
            )}

            {/* Brutalist Language Switcher */}
            <button
              onClick={() => setLanguage(language === 'en' ? 'vi' : 'en')}
              className="bg-white text-on-surface font-headline font-bold border-2 border-on-surface shadow-[2px_2px_0px_0px_#1a1c1c] px-3 py-1 text-xs hover:scale-105 active:scale-95 transition-all uppercase"
            >
              {t('language_label')}
            </button>
          </div>
        </div>
        </nav>
      )}

      {/* Main Page Area */}
      <main className={`flex-grow ${isInMatch ? 'p-4 w-full max-w-none' : 'p-4 md:p-8 max-w-7xl mx-auto w-full'}`}>
        <Page setPage={setPage} />
      </main>

      {/* Footer */}
      {!isInMatch && (
        <footer className="w-full border-t-4 border-on-surface py-8 bg-surface-container mt-auto">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-4 text-center md:text-left">
          <div className="font-headline font-black italic text-primary uppercase tracking-tighter">
            Exploding Kittens
          </div>
          <p className="text-xs text-on-surface-variant font-sans font-bold">
            {language === 'en' 
              ? "© 2026 Exploding Kittens Inc. Warning: Don't touch the red button."
              : "© 2026 Exploding Kittens Inc. Cảnh báo: Đừng chạm vào nút đỏ."
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
    </div>
  );
}
