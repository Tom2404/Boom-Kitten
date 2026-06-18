import React, { useState, useEffect } from 'react';
import { PRESET_AVATARS } from '../components/PlayerAvatar.jsx';
import { RankBadge } from '../components/Icons.jsx';
import { gsap } from 'gsap';

function PodiumCard({ player, position }) {
  if (!player) {
    return (
      <div className="flex-grow flex-shrink-0 flex flex-col items-center justify-center p-5 rounded-2xl w-full sm:w-44 text-center border-4 border-dashed border-on-surface-variant opacity-40 bg-surface-container h-[180px] select-none shadow-[4px_4px_0px_0px_rgba(26,28,28,0.2)]">
        <span className="text-3xl mb-2">😿</span>
        <span className="font-headline font-black text-xs text-on-surface-variant uppercase">Vị Trí Trống</span>
      </div>
    );
  }

  const bgColors = {
    1: 'bg-yellow-300 border-4 border-slate-950 scale-105 shadow-[8px_8px_0px_0px_#1a1c1c] z-10',
    2: 'bg-slate-200 border-3 border-slate-950 shadow-[5px_5px_0px_0px_#1a1c1c]',
    3: 'bg-amber-100 border-3 border-slate-950 shadow-[5px_5px_0px_0px_#1a1c1c]'
  };

  const badgeTranslate = {
    1: '-top-6 scale-110 rotate-[-2deg]',
    2: '-top-5 rotate-[1deg]',
    3: '-top-5 rotate-[-1deg]'
  };

  return (
    <div className={`relative flex flex-col items-center p-5 rounded-2xl w-full sm:w-48 text-center transition-all duration-200 hover:-translate-y-1 ${bgColors[position]}`}>
      {/* Crown / Rank tag */}
      <div className={`absolute -translate-y-1/2 left-1/2 transform -translate-x-1/2 bg-slate-950 text-white font-headline font-black border-2 border-white px-3 py-1 rounded-xl text-[10px] uppercase tracking-wider shadow ${badgeTranslate[position]}`}>
        {position === 1 ? '👑 TOP 1' : `TOP ${position}`}
      </div>

      {/* Avatar Container */}
      <div className="h-16 w-16 rounded-full flex items-center justify-center text-3xl font-headline font-black bg-white border-2 border-on-surface overflow-hidden mt-3 mb-3 shadow-[inner_2px_2px_4px_rgba(0,0,0,0.1)]">
        {player.avatar && PRESET_AVATARS[player.avatar] ? (
          <span>{PRESET_AVATARS[player.avatar]}</span>
        ) : player.avatar ? (
          <img src={player.avatar} alt={player.username} className="h-full w-full object-cover" />
        ) : (
          <span>{player.username.slice(0, 2).toUpperCase()}</span>
        )}
      </div>

      <h4 className="font-headline font-black text-sm uppercase text-on-surface truncate w-full px-1">
        {player.username}
      </h4>

      <div className="mt-2 flex flex-col items-center gap-1">
        <RankBadge rank={player.rank} className="w-5 h-5" showText={true} />
        <span className="text-[10px] font-mono font-bold text-on-surface-variant bg-white/60 border border-on-surface/10 px-2 py-0.5 rounded-full mt-0.5">
          🔥 {player.eloPoints} ELO
        </span>
        <span className="text-[10px] font-headline font-black text-emerald-600 uppercase mt-0.5">
          🏆 {player.stats?.wins ?? player.wins ?? 0} thắng
        </span>
      </div>
    </div>
  );
}

export default function Leaderboard() {
  const [players, setPlayers] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [selectedTier, setSelectedTier] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [skip, setSkip] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const limit = 20;

  const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:5000';

  const fetchLeaderboard = async (currentSkip, isLoadMore = false) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('accessToken');
      const headers = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const res = await fetch(
        `${API_URL}/api/leaderboard?tier=${selectedTier}&search=${searchQuery}&limit=${limit}&skip=${currentSkip}`,
        { headers }
      );
      const data = res.ok ? await res.json() : null;
      if (data) {
        if (isLoadMore) {
          setPlayers((prev) => [...prev, ...data.players]);
        } else {
          setPlayers(data.players);
        }
        setCurrentUser(data.currentUser);
        setHasMore(data.players.length === limit);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // Reset when filter/search changes
  useEffect(() => {
    setSkip(0);
    fetchLeaderboard(0, false);
  }, [selectedTier, searchQuery]);

  // Load more
  useEffect(() => {
    if (skip > 0) {
      fetchLeaderboard(skip, true);
    }
  }, [skip]);

  // GSAP Entrance animations
  useEffect(() => {
    if (!loading && players.length > 0) {
      gsap.fromTo('.leaderboard-row',
        { opacity: 0, y: 15 },
        { opacity: 1, y: 0, duration: 0.35, stagger: 0.04, ease: 'power2.out' }
      );
    }
  }, [players, loading]);

  const handleLoadMore = () => {
    setSkip((prev) => prev + limit);
  };

  const TIERS = ['ALL', 'Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond', 'Legend'];

  const showPodium = !searchQuery && players.length > 0;
  const topThree = showPodium ? players.slice(0, 3) : [];
  const listPlayers = showPodium ? players.slice(3) : players;
  const isCurrentUserVisible = players.some(p => p.username === currentUser?.username);

  return (
    <div className="max-w-4xl mx-auto flex flex-col gap-6">
      
      {/* Title Header */}
      <div className="text-center flex flex-col items-center">
        <span className="text-6xl animate-bounce">🏆</span>
        <h2 className="arena-title-brutal text-4xl md:text-5xl font-black uppercase mt-4">
          BẢNG XẾP HẠNG CAO THỦ
        </h2>
        <p className="text-xs font-bold text-on-surface-variant mt-2 tracking-wider bg-surface border-2 border-on-surface px-4 py-1.5 rounded-full shadow-[2px_2px_0px_0px_#1a1c1c] uppercase">
          Vinh danh những chiến binh mèo nổ quả cảm nhất đấu trường!
        </p>
      </div>

      {/* Top Claws Podium Section */}
      {showPodium && (
        <div className="mt-4 flex flex-col items-center">
          <div className="font-headline font-black text-2xl text-on-surface uppercase tracking-tight mb-8 rotate-[-1deg] bg-rose-500 text-white border-3 border-on-surface px-6 py-2 shadow-[4px_4px_0px_0px_#1a1c1c] w-fit">
            🐾 TOP CLAWS 🐾
          </div>
          <div className="flex flex-col sm:flex-row gap-8 sm:gap-6 justify-center items-center sm:items-end w-full max-w-2xl px-4 mt-2 mb-4">
            {/* Rank 2 (left) */}
            <div className="order-2 sm:order-1 w-full sm:w-auto">
              <PodiumCard player={topThree[1]} position={2} />
            </div>
            {/* Rank 1 (center) */}
            <div className="order-1 sm:order-2 w-full sm:w-auto transform sm:-translate-y-4">
              <PodiumCard player={topThree[0]} position={1} />
            </div>
            {/* Rank 3 (right) */}
            <div className="order-3 sm:order-3 w-full sm:w-auto">
              <PodiumCard player={topThree[2]} position={3} />
            </div>
          </div>
        </div>
      )}

      {/* Search and Filters panel */}
      <div className="bg-white border-4 border-on-surface shadow-[6px_6px_0px_0px_rgba(26,28,28,1)] rounded-3xl p-5 md:p-6 flex flex-col gap-5 mt-4">
        
        <div className="flex flex-col gap-5 items-center">
          {/* Search bar */}
          <div className="relative w-full max-w-md">
            <span className="absolute inset-y-0 left-4 flex items-center text-on-surface-variant font-bold pointer-events-none">
              🔍
            </span>
            <input
              type="text"
              placeholder="SEARCH PLAYERS..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-3 font-headline font-black uppercase text-xs border-3 border-on-surface rounded-2xl shadow-[4px_4px_0px_0px_#1a1c1c] focus:outline-none focus:bg-amber-50 placeholder:text-on-surface-variant/60 placeholder:font-black"
            />
          </div>

          {/* Filters List */}
          <div className="flex flex-wrap gap-2.5 justify-center w-full">
            {TIERS.map((tier) => {
              const tierActiveClasses = {
                ALL: 'bg-[#b7131a] text-white shadow-[4px_4px_0px_0px_#1a1c1c] border-slate-950',
                Bronze: 'bg-[#b45309] text-white shadow-[4px_4px_0px_0px_#1a1c1c] border-slate-950',
                Silver: 'bg-[#475569] text-white shadow-[4px_4px_0px_0px_#1a1c1c] border-slate-950',
                Gold: 'bg-[#eab308] text-slate-950 shadow-[4px_4px_0px_0px_#1a1c1c] border-slate-950',
                Platinum: 'bg-[#8b5cf6] text-white shadow-[4px_4px_0px_0px_#1a1c1c] border-slate-950',
                Diamond: 'bg-[#06b6d4] text-slate-950 shadow-[4px_4px_0px_0px_#1a1c1c] border-slate-950',
                Legend: 'bg-[#ef4444] text-white shadow-[4px_4px_0px_0px_#1a1c1c] border-slate-950',
              };

              const isActive = selectedTier === tier;

              return (
                <button
                  key={tier}
                  onClick={() => setSelectedTier(tier)}
                  className={`font-headline font-black text-xs uppercase px-4 py-2.5 border-3 border-on-surface rounded-xl transition-all shadow-[2px_2px_0px_0px_#1a1c1c] active:translate-x-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0px_0px_#1a1c1c]
                    ${isActive
                      ? `${tierActiveClasses[tier]} -translate-y-0.5`
                      : 'bg-surface hover:bg-surface-container-high text-on-surface-variant'}`}
                >
                  {tier}
                </button>
              );
            })}
          </div>
        </div>

        {/* Players List Table */}
        <div className="overflow-x-auto border-3 border-on-surface rounded-2xl shadow-[4px_4px_0px_0px_#1a1c1c] bg-surface mt-2">
          <table className="w-full border-collapse text-left text-xs md:text-sm">
            <thead>
              <tr className="bg-slate-950 text-white font-headline font-black uppercase tracking-wider text-left border-b-3 border-on-surface select-none">
                <th className="px-4 py-3 text-center w-16 border-r-3 border-on-surface">RANK</th>
                <th className="px-4 py-3 border-r-3 border-on-surface">PLAYER</th>
                <th className="px-4 py-3 border-r-3 border-on-surface">TIER</th>
                <th className="px-4 py-3 border-r-3 border-on-surface text-center">ELO</th>
                <th className="px-4 py-3 text-center">WINS</th>
              </tr>
            </thead>
            <tbody>
              {players.length === 0 ? (
                <tr>
                  <td colSpan="5" className="text-center py-12 font-headline font-black uppercase text-on-surface-variant text-base bg-surface-container/30">
                    😿 Không tìm thấy chiến binh nào!
                  </td>
                </tr>
              ) : (
                <>
                  {listPlayers.map((player, index) => {
                    const actualRank = showPodium ? index + 4 : index + 1;
                    return (
                      <tr
                        key={player._id}
                        className="leaderboard-row border-b-2 border-on-surface/10 hover:bg-surface-container transition-colors"
                      >
                        <td className="px-4 py-3.5 text-center font-headline font-black border-r-3 border-on-surface/10 text-on-surface-variant text-xs">
                          #{actualRank}
                        </td>
                        <td className="px-4 py-3.5 flex items-center gap-3 border-r-3 border-on-surface/10">
                          {/* Avatar */}
                          <div className="h-8 w-8 rounded-full flex items-center justify-center text-lg font-headline font-black bg-primary-fixed border-2 border-on-surface overflow-hidden shadow-inner flex-shrink-0">
                            {player.avatar && PRESET_AVATARS[player.avatar] ? (
                              <span>{PRESET_AVATARS[player.avatar]}</span>
                            ) : player.avatar ? (
                              <img src={player.avatar} alt={player.username} className="h-full w-full object-cover" />
                            ) : (
                              <span>{player.username.slice(0, 2).toUpperCase()}</span>
                            )}
                          </div>
                          {/* Username */}
                          <span className="font-headline font-black uppercase text-on-surface text-xs md:text-sm truncate max-w-[120px] sm:max-w-none">
                            {player.username}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 border-r-3 border-on-surface/10">
                          <RankBadge rank={player.rank} className="w-5 h-5" showText={true} />
                        </td>
                        <td className="px-4 py-3.5 border-r-3 border-on-surface/10 font-mono text-center font-bold text-primary">
                          🔥 {player.eloPoints}
                        </td>
                        <td className="px-4 py-3.5 text-center font-bold font-mono">
                          {player.stats?.wins ?? player.wins ?? 0}
                        </td>
                      </tr>
                    );
                  })}

                  {/* Highlight current logged-in user if they are not visible */}
                  {currentUser && !isCurrentUserVisible && (
                    <tr className="bg-orange-100 border-t-4 border-on-surface text-rose-700 font-headline font-black uppercase shadow-[inner_0px_3px_0px_rgba(0,0,0,0.15)] sticky bottom-0 z-20">
                      <td className="px-4 py-3.5 text-center border-r-3 border-on-surface font-black text-rose-600 text-xs">
                        #{currentUser.rankPosition}
                      </td>
                      <td className="px-4 py-3.5 flex items-center gap-3 border-r-3 border-on-surface">
                        <div className="h-8 w-8 rounded-full flex items-center justify-center text-lg bg-rose-500 border-2 border-on-surface overflow-hidden flex-shrink-0">
                          {currentUser.avatar && PRESET_AVATARS[currentUser.avatar] ? (
                            <span>{PRESET_AVATARS[currentUser.avatar]}</span>
                          ) : currentUser.avatar ? (
                            <img src={currentUser.avatar} alt={currentUser.username} className="h-full w-full object-cover" />
                          ) : (
                            <span>{currentUser.username.slice(0, 2).toUpperCase()}</span>
                          )}
                        </div>
                        <span className="font-headline font-black text-rose-700 text-xs md:text-sm">
                          YOU ({currentUser.username})
                        </span>
                      </td>
                      <td className="px-4 py-3.5 border-r-3 border-on-surface">
                        <RankBadge rank={currentUser.rank} className="w-5 h-5" showText={true} />
                      </td>
                      <td className="px-4 py-3.5 border-r-3 border-on-surface font-mono text-center font-bold">
                        🔥 {currentUser.eloPoints}
                      </td>
                      <td className="px-4 py-3.5 text-center font-bold font-mono">
                        {currentUser.wins}
                      </td>
                    </tr>
                  )}
                </>
              )}
            </tbody>
          </table>
        </div>

        {/* Load more button */}
        {hasMore && players.length >= limit && !loading && (
          <div className="flex justify-center mt-3 mb-1">
            <button
              onClick={handleLoadMore}
              className="relative bg-orange-500 text-white font-headline font-black text-xs md:text-sm uppercase tracking-wider border-3 border-on-surface shadow-[4px_4px_0px_0px_rgba(26,28,28,1)] px-6 py-3 rounded-2xl active:translate-x-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0px_0px_rgba(26,28,28,1)] hover:scale-102 hover:-translate-y-0.5 transition-all duration-100 rotate-[-1deg]"
            >
              🍖 SHOW MORE MEAT 🍖
            </button>
          </div>
        )}

        {/* Loader inside Table */}
        {loading && (
          <p className="text-center font-headline font-black text-xs uppercase text-on-surface-variant py-4 animate-pulse">
            🥩 Đang lấy danh sách chiến mèo...
          </p>
        )}

      </div>
    </div>
  );
}
