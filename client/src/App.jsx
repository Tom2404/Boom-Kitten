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

const PAGES = { Home, Login, Register, Lobby, Game, Profile, Leaderboard, Shop, Admin };

export default function App() {
  const [page, setPage] = useState('Home');
  const [announcement, setAnnouncement] = useState(null);
  const [userRole, setUserRole] = useState('user');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
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

    socket.on('server_announcement', handleAnnouncement);

    return () => {
      clearInterval(interval);
      socket.off('server_announcement', handleAnnouncement);
    };
  }, [socket]);

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    setIsLoggedIn(false);
    setUserRole('user');
    setPage('Home');
  };

  const Page = useMemo(() => PAGES[page] ?? Home, [page]);

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
      <nav className="sticky top-0 w-full z-40 border-b-4 border-on-surface bg-surface shadow-[4px_4px_0px_0px_#1a1c1c]">
        <div className="flex justify-between items-center px-4 md:px-12 py-4 max-w-7xl mx-auto flex-wrap gap-4">
          <button 
            onClick={() => setPage('Home')}
            className="font-headline text-2xl md:text-3xl italic font-black text-primary uppercase tracking-tighter hover:scale-105 hover:-translate-y-1 transition-all duration-100"
          >
            EXPLODING KITTENS 💣
          </button>
          
          <div className="flex gap-4 md:gap-8 items-center flex-wrap">
            <button 
              className={`font-headline font-bold pb-1 text-sm md:text-base border-b-2 transition-all ${page === 'Home' ? 'text-primary border-primary' : 'text-on-surface-variant border-transparent hover:text-primary'}`}
              onClick={() => setPage('Home')}
            >
              Trang Chủ
            </button>
            <button 
              className={`font-headline font-bold pb-1 text-sm md:text-base border-b-2 transition-all ${page === 'Game' ? 'text-primary border-primary' : 'text-on-surface-variant border-transparent hover:text-primary'}`}
              onClick={() => setPage('Game')}
            >
              Phòng Đấu
            </button>
            <button 
              className={`font-headline font-bold pb-1 text-sm md:text-base border-b-2 transition-all ${page === 'Leaderboard' ? 'text-primary border-primary' : 'text-on-surface-variant border-transparent hover:text-primary'}`}
              onClick={() => setPage('Leaderboard')}
            >
              BXH
            </button>
            <button 
              className={`font-headline font-bold pb-1 text-sm md:text-base border-b-2 transition-all ${page === 'Shop' ? 'text-primary border-primary' : 'text-on-surface-variant border-transparent hover:text-primary'}`}
              onClick={() => setPage('Shop')}
            >
              Cửa Hàng
            </button>
            
            {isLoggedIn ? (
              <>
                <button 
                  className={`font-headline font-bold pb-1 text-sm md:text-base border-b-2 transition-all ${page === 'Profile' ? 'text-primary border-primary' : 'text-on-surface-variant border-transparent hover:text-primary'}`}
                  onClick={() => setPage('Profile')}
                >
                  Cá Nhân
                </button>
                {userRole === 'admin' && (
                  <button 
                    className={`bg-yellow-400 text-slate-950 font-headline font-bold border-2 border-on-surface shadow-[2px_2px_0px_0px_#1a1c1c] px-3 py-1 text-xs hover:scale-105 active:scale-95 transition-all`}
                    onClick={() => setPage('Admin')}
                  >
                    Admin
                  </button>
                )}
                <button 
                  onClick={handleLogout}
                  className="bg-secondary text-on-error font-headline font-bold border-2 border-on-surface shadow-[2px_2px_0px_0px_#1a1c1c] px-3 py-1 text-xs hover:scale-105 active:scale-95 transition-all"
                >
                  Đăng Xuất
                </button>
              </>
            ) : (
              <>
                <button 
                  className={`font-headline font-bold pb-1 text-sm md:text-base border-b-2 transition-all ${page === 'Login' ? 'text-primary border-primary' : 'text-on-surface-variant border-transparent hover:text-primary'}`}
                  onClick={() => setPage('Login')}
                >
                  Đăng Nhập
                </button>
                <button 
                  className={`bg-primary-container text-on-primary-container font-headline font-bold border-2 border-on-surface shadow-[2px_2px_0px_0px_#1a1c1c] px-3 py-1 text-xs md:text-sm hover:scale-105 active:scale-95 transition-all`}
                  onClick={() => setPage('Register')}
                >
                  Đăng Ký
                </button>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Main Page Area */}
      <main className="flex-grow p-4 md:p-8 max-w-7xl mx-auto w-full">
        <Page setPage={setPage} />
      </main>

      {/* Footer */}
      <footer className="w-full border-t-4 border-on-surface py-8 bg-surface-container mt-auto">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-4 text-center md:text-left">
          <div className="font-headline font-black italic text-primary uppercase tracking-tighter">
            Exploding Kittens Mèo Nổ
          </div>
          <p className="text-xs text-on-surface-variant font-sans">
            © 2026 Exploding Kittens Inc. Cảnh báo: Đừng chạm vào nút đỏ.
          </p>
        </div>
      </footer>
    </div>
  );
}
