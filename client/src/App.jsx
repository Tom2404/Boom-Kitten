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
import Navbar from './components/Navbar.jsx';
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
    <div className="pop-art-theme min-h-screen bg-[var(--pop-cream)] text-[var(--pop-black)] flex flex-col selection:bg-[var(--pop-amber)] selection:text-[var(--pop-black)]">
      {/* Floating Server Announcement */}
      {announcement && (
        <div className="bg-[var(--pop-red)] text-white py-2.5 px-4 pop-border-3 border-x-0 border-t-0 font-pop-accent font-bold text-center z-50 flex items-center justify-between gap-4 shadow-[0_4px_0_var(--pop-black)]">
          <div className="flex-1 flex justify-center items-center gap-2">
            <span className="material-symbols-outlined animate-bounce">campaign</span>
            <span className="uppercase tracking-wider text-xs md:text-sm">{announcement}</span>
          </div>
          <button onClick={() => setAnnouncement(null)} className="font-bold hover:scale-110 active:scale-95 text-white">✕</button>
        </div>
      )}

      {/* Navigation Header */}
      {!isInMatch && (
        <Navbar 
          setPage={navigateWithConfirm} 
          isLoggedIn={isLoggedIn} 
          userRole={userRole} 
          handleLogout={handleLogout} 
        />
      )}

      {/* Main Page Area */}
      <main className={`flex-grow ${isInMatch ? 'p-4 w-full max-w-none' : 'p-4 md:p-8 max-w-7xl mx-auto w-full'}`}>
        <Page setPage={setPage} />
      </main>

      {/* Footer */}
      {!isInMatch && (
        <footer className="w-full border-t-2 border-[var(--pop-black)] py-8 bg-[var(--pop-cream)] mt-auto font-pop-body">
        <div className="max-w-7xl mx-auto px-4 md:px-12 flex flex-col md:flex-row justify-between items-center gap-4 text-center md:text-left">
          <div className="font-pop-display font-black text-xl text-[var(--pop-red)] uppercase tracking-tight">
            Mèo Nổ
          </div>
          <p className="text-xs text-[var(--pop-black)]/60 font-bold uppercase tracking-wider">
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
