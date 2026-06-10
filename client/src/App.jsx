// Main app shell with simple page switching for this starter scaffold.
import { useMemo, useState } from 'react';
import Home from './pages/Home.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import Lobby from './pages/Lobby.jsx';
import Game from './pages/Game.jsx';
import Profile from './pages/Profile.jsx';
import Leaderboard from './pages/Leaderboard.jsx';
import Shop from './pages/Shop.jsx';

const PAGES = { Home, Login, Register, Lobby, Game, Profile, Leaderboard, Shop };

export default function App() {
  const [page, setPage] = useState('Home');
  const Page = useMemo(() => PAGES[page] ?? Home, [page]);

  return (
    <div className="min-h-screen bg-slate-950 p-6 text-white">
      <h1 className="mb-4 text-3xl font-bold">Mèo Nổ</h1>
      <div className="mb-6 flex flex-wrap gap-2">
        {Object.keys(PAGES).map((name) => (
          <button
            key={name}
            type="button"
            className="rounded bg-slate-800 px-3 py-1 text-sm hover:bg-slate-700"
            onClick={() => setPage(name)}
          >
            {name}
          </button>
        ))}
      </div>
      <Page />
    </div>
  );
}
