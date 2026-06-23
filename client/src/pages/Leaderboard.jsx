import React, { useState, useEffect } from 'react';
import { PRESET_AVATARS } from '../components/PlayerAvatar.jsx';
import { RankBadge } from '../components/Icons.jsx';
import { gsap } from 'gsap';
import { useLanguage } from '../context/LanguageContext.jsx';
function PodiumCard({ player, position }) {
  const { t } = useLanguage();
  if (!player) {
    return (
      <div className="flex-grow flex-shrink-0 flex flex-col items-center justify-center p-5 rounded-none w-full sm:w-44 text-center border-3 border-dashed border-[var(--pop-black)]/30 opacity-40 bg-white h-[180px] select-none shadow-[4px_4px_0_transparent]">
        <span className="text-3xl mb-2">😿</span>
        <span className="font-pop-accent font-black text-xs text-[var(--pop-black)]/40 uppercase">{t('leaderboard_empty_slot')}</span>
      </div>
    );
  }

  const bgColors = {
    1: 'bg-[var(--pop-amber)] border-3 border-[var(--pop-black)] scale-105 shadow-[6px_6px_0px_0px_var(--pop-black)] z-10',
    2: 'bg-[#e2e8f0] border-3 border-[var(--pop-black)] shadow-[5px_5px_0px_0px_var(--pop-black)]',
    3: 'bg-[var(--pop-cream)] border-3 border-[var(--pop-black)] shadow-[5px_5px_0px_0px_var(--pop-black)]'
  };

  const badgeTranslate = {
    1: '-top-6 scale-110 rotate-[-2deg]',
    2: '-top-5 rotate-[1deg]',
    3: '-top-5 rotate-[-1deg]'
  };

  return (
    <div className={`relative flex flex-col items-center p-5 rounded-none w-full sm:w-48 text-center transition-all duration-200 hover:-translate-y-1 ${bgColors[position]}`}>
      {/* Crown / Rank tag */}
      <div className={`absolute -translate-y-1/2 left-1/2 transform -translate-x-1/2 bg-[var(--pop-black)] text-white font-pop-accent font-bold border-2 border-white px-3 py-1 rounded-none text-[10px] uppercase tracking-wider shadow-[2px_2px_0px_var(--pop-black)] ${badgeTranslate[position]}`}>
        {position === 1 ? '👑 TOP 1' : `TOP ${position}`}
      </div>

      {/* Avatar Container */}
      <div className="h-16 w-16 rounded-none flex items-center justify-center text-3xl font-pop-accent font-black bg-white border-3 border-[var(--pop-black)] overflow-hidden mt-3 mb-3 shadow-[3px_3px_0_var(--pop-black)]">
        {player.avatar && PRESET_AVATARS[player.avatar] ? (
          <span>{PRESET_AVATARS[player.avatar]}</span>
        ) : player.avatar ? (
          <img src={player.avatar} alt={player.username} className="h-full w-full object-cover" />
        ) : (
          <span>{player.username.slice(0, 2).toUpperCase()}</span>
        )}
      </div>

      <h4 className="font-pop-accent font-black text-sm uppercase text-[var(--pop-black)] truncate w-full px-1">
        {player.username}
      </h4>

      <div className="mt-2 flex flex-col items-center gap-1">
        <RankBadge rank={player.rank} className="w-5 h-5" showText={true} />
        <span className="text-[10px] font-mono font-bold text-[var(--pop-black)] bg-white/60 border border-[var(--pop-black)]/10 px-2 py-0.5 rounded-none mt-0.5">
          🔥 {player.eloPoints} ELO
        </span>
        <span className="text-[10px] font-pop-accent font-bold text-[var(--pop-red)] uppercase mt-0.5">
          🏆 {player.stats?.wins ?? player.wins ?? 0} {t('leaderboard_wins_suffix')}
        </span>
      </div>
    </div>
  );
}

export default function Leaderboard() {
  const { t } = useLanguage();
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
    <div className="max-w-4xl mx-auto flex flex-col gap-6 text-left font-pop-body">
      
      {/* Title Header */}
      <div className="text-center flex flex-col items-center">
        <span className="text-6xl animate-bounce">🏆</span>
        <h2 className="arena-title-brutal text-4xl md:text-5xl font-black uppercase mt-4">
          {t('leaderboard_title')}
        </h2>
        <p className="text-xs font-bold text-[var(--pop-black)] mt-2 tracking-wider bg-white border-2 border-[var(--pop-black)] px-4 py-1.5 rounded-none shadow-[3px_3px_0_var(--pop-black)] uppercase font-pop-accent">
          {t('leaderboard_desc')}
        </p>
      </div>

      {/* Top Claws Podium Section */}
      {showPodium && (
        <div className="mt-4 flex flex-col items-center">
          <div className="font-pop-accent font-black text-2xl text-white uppercase tracking-tight mb-8 rotate-[-1deg] bg-[var(--pop-red)] border-3 border-[var(--pop-black)] px-6 py-2 shadow-[4px_4px_0_var(--pop-black)] w-fit rounded-none">
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
      <div className="bg-white border-3 border-[var(--pop-black)] shadow-[6px_6px_0_var(--pop-black)] rounded-none p-5 md:p-6 flex flex-col gap-5 mt-4">
        
        <div className="flex flex-col gap-5 items-center">
          {/* Search bar */}
          <div className="relative w-full max-w-md">
            <span className="absolute inset-y-0 left-4 flex items-center text-[var(--pop-black)]/60 font-bold pointer-events-none">
              🔍
            </span>
            <input
              type="text"
              placeholder={t('leaderboard_search_placeholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-3 font-pop-accent font-black uppercase text-xs border-3 border-[var(--pop-black)] rounded-none shadow-[3px_3px_0_var(--pop-black)] focus:outline-none focus:bg-[var(--pop-cream)] placeholder:text-[var(--pop-black)]/40 placeholder:font-black"
            />
          </div>

          {/* Filters List */}
          <div className="flex flex-wrap gap-2.5 justify-center w-full">
            {TIERS.map((tier) => {
              const tierActiveClasses = {
                ALL: 'bg-[#b7131a] text-white shadow-[4px_4px_0px_0px_var(--pop-black)] border-slate-950',
                Bronze: 'bg-[#b45309] text-white shadow-[4px_4px_0px_0px_var(--pop-black)] border-slate-950',
                Silver: 'bg-[#475569] text-white shadow-[4px_4px_0px_0px_var(--pop-black)] border-slate-950',
                Gold: 'bg-[#eab308] text-slate-950 shadow-[4px_4px_0px_0px_var(--pop-black)] border-slate-950',
                Platinum: 'bg-[#8b5cf6] text-white shadow-[4px_4px_0px_0px_var(--pop-black)] border-slate-950',
                Diamond: 'bg-[#06b6d4] text-slate-950 shadow-[4px_4px_0px_0px_var(--pop-black)] border-slate-950',
                Legend: 'bg-[#ef4444] text-white shadow-[4px_4px_0px_0px_var(--pop-black)] border-slate-950',
              };

              const isActive = selectedTier === tier;

              return (
                <button
                  key={tier}
                  onClick={() => setSelectedTier(tier)}
                  className={`font-pop-accent font-black text-xs uppercase px-4 py-2.5 border-3 border-[var(--pop-black)] rounded-none transition-all shadow-[2px_2px_0_var(--pop-black)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0_var(--pop-black)] cursor-pointer
                    ${isActive
                      ? `${tierActiveClasses[tier]} -translate-y-0.5`
                      : 'bg-white hover:bg-[var(--pop-cream)] text-[var(--pop-black)]/60'}`}
                >
                  {tier}
                </button>
              );
            })}
          </div>
        </div>

        {/* Players List Table */}
        <div className="overflow-x-auto border-3 border-[var(--pop-black)] rounded-none shadow-[4px_4px_0_var(--pop-black)] bg-white mt-2 w-full">
          <table className="w-full border-collapse text-left text-xs md:text-sm">
            <thead>
              <tr className="bg-[var(--pop-black)] text-white font-pop-accent font-black uppercase tracking-wider text-left border-b-3 border-[var(--pop-black)] select-none">
                <th className="px-4 py-3.5 text-center w-16 border-r-3 border-white/10">{t('col_rank')}</th>
                <th className="px-4 py-3.5 border-r-3 border-white/10">{t('col_player')}</th>
                <th className="px-4 py-3.5 border-r-3 border-white/10">{t('col_tier')}</th>
                <th className="px-4 py-3.5 border-r-3 border-white/10 text-center">{t('col_elo')}</th>
                <th className="px-4 py-3.5 text-center">{t('col_wins')}</th>
              </tr>
            </thead>
            <tbody>
              {players.length === 0 ? (
                <tr>
                  <td colSpan="5" className="text-center py-12 font-pop-accent font-black uppercase text-[var(--pop-black)]/40 text-base bg-slate-50">
                    😿 {t('leaderboard_no_players')}
                  </td>
                </tr>
              ) : (
                <>
                  {listPlayers.map((player, index) => {
                    const actualRank = showPodium ? index + 4 : index + 1;
                    return (
                      <tr
                        key={player._id}
                        className="leaderboard-row border-b-2 border-[var(--pop-black)]/10 hover:bg-[var(--pop-cream)]/50 transition-colors"
                      >
                        <td className="px-4 py-3.5 text-center font-pop-accent font-black border-r-3 border-[var(--pop-black)]/10 text-[var(--pop-black)]/60 text-xs">
                          #{actualRank}
                        </td>
                        <td className="px-4 py-3.5 flex items-center gap-3 border-r-3 border-[var(--pop-black)]/10">
                          {/* Avatar */}
                          <div className="h-8 w-8 rounded-none flex items-center justify-center text-lg font-pop-accent font-black bg-white border-2 border-[var(--pop-black)] overflow-hidden shadow-[1.5px_1.5px_0_var(--pop-black)] flex-shrink-0">
                            {player.avatar && PRESET_AVATARS[player.avatar] ? (
                              <span>{PRESET_AVATARS[player.avatar]}</span>
                            ) : player.avatar ? (
                              <img src={player.avatar} alt={player.username} className="h-full w-full object-cover" />
                            ) : (
                              <span>{player.username.slice(0, 2).toUpperCase()}</span>
                            )}
                          </div>
                          {/* Username */}
                          <span className="font-pop-accent font-black uppercase text-[var(--pop-black)] text-xs md:text-sm truncate max-w-[120px] sm:max-w-none">
                            {player.username}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 border-r-3 border-[var(--pop-black)]/10">
                          <RankBadge rank={player.rank} className="w-5 h-5" showText={true} />
                        </td>
                        <td className="px-4 py-3.5 border-r-3 border-[var(--pop-black)]/10 font-mono text-center font-bold text-[var(--pop-red)]">
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
                    <tr className="bg-[var(--pop-amber)] border-t-3 border-b-3 border-[var(--pop-black)] text-[var(--pop-black)] font-pop-accent font-black uppercase sticky bottom-0 z-20 shadow-[0_-3px_0_var(--pop-black)]">
                      <td className="px-4 py-3.5 text-center border-r-3 border-[var(--pop-black)]/20 font-black text-[var(--pop-black)] text-xs">
                        #{currentUser.rankPosition}
                      </td>
                      <td className="px-4 py-3.5 flex items-center gap-3 border-r-3 border-[var(--pop-black)]/20">
                        <div className="h-8 w-8 rounded-none flex items-center justify-center text-lg bg-white border-2 border-[var(--pop-black)] overflow-hidden flex-shrink-0 shadow-[1.5px_1.5px_0_var(--pop-black)]">
                          {currentUser.avatar && PRESET_AVATARS[currentUser.avatar] ? (
                            <span>{PRESET_AVATARS[currentUser.avatar]}</span>
                          ) : currentUser.avatar ? (
                            <img src={currentUser.avatar} alt={currentUser.username} className="h-full w-full object-cover" />
                          ) : (
                            <span>{currentUser.username.slice(0, 2).toUpperCase()}</span>
                          )}
                        </div>
                        <span className="font-pop-accent font-black text-[var(--pop-black)] text-xs md:text-sm">
                          {t('leaderboard_you_highlight', { username: currentUser.username })}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 border-r-3 border-[var(--pop-black)]/20">
                        <RankBadge rank={currentUser.rank} className="w-5 h-5" showText={true} />
                      </td>
                      <td className="px-4 py-3.5 border-r-3 border-[var(--pop-black)]/20 font-mono text-center font-bold">
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
              className="relative bg-[var(--pop-red)] text-white font-pop-accent font-black text-xs md:text-sm uppercase tracking-wider border-3 border-[var(--pop-black)] shadow-[4px_4px_0_var(--pop-black)] px-6 py-3 rounded-none active:translate-x-[2px] active:translate-y-[2px] active:shadow-none hover:translate-x-[-1px] hover:translate-y-[-1px] transition-all duration-100 rotate-[-1deg] cursor-pointer"
            >
              {t('leaderboard_load_more')}
            </button>
          </div>
        )}

        {/* Loader inside Table */}
        {loading && (
          <p className="text-center font-pop-accent font-black text-xs uppercase text-[var(--pop-black)]/60 py-4 animate-pulse">
            {t('leaderboard_loading')}
          </p>
        )}

      </div>
    </div>
  );
}
