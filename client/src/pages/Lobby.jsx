import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext.jsx';
import { fetchPublicLiveOpsConfig, SAFE_LIVE_OPS_FALLBACK } from './admin/adminLiveOps.js';
import CreateRoomModal from '../components/lobby/CreateRoomModal.jsx';
import JoinByCodeModal from '../components/lobby/JoinByCodeModal.jsx';
import { CoinIcon } from '../components/CoinDisplay.jsx';

export default function Lobby({ setPage }) {
  const { language } = useLanguage();
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEdition, setSelectedEdition] = useState('all');
  const [selectedBetFilter, setSelectedBetFilter] = useState('all');
  const [selectedPlayersFilter, setSelectedPlayersFilter] = useState('all');
  const [directCode, setDirectCode] = useState('');
  const [liveOps, setLiveOps] = useState({ version: 0, config: SAFE_LIVE_OPS_FALLBACK, fallback: true });

  // User HUD Profile state
  const [userProfile, setUserProfile] = useState(null);

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isJoinCodeModalOpen, setIsJoinCodeModalOpen] = useState(false);

  const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:5000';

  // Fetch Rooms
  const fetchRooms = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/rooms`);
      if (res.ok) {
        const data = await res.json();
        setRooms(data);
      }
    } catch (e) {
      console.error('Error fetching rooms:', e);
    } finally {
      setLoading(false);
    }
  };

  // Fetch User Profile for HUD & Coins balance
  const fetchUserProfile = async () => {
    const token = localStorage.getItem('accessToken');
    if (!token) return;
    try {
      const res = await fetch(`${API_URL}/api/users/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setUserProfile(data);
      }
    } catch (e) {
      console.error('Error fetching user profile:', e);
    }
  };

  useEffect(() => {
    fetchRooms();
    fetchUserProfile();
    fetchPublicLiveOpsConfig().then(setLiveOps);
    const interval = setInterval(fetchRooms, 6000);
    return () => clearInterval(interval);
  }, []);

  const handleJoinRoom = (code, password = '') => {
    localStorage.setItem('autoJoinRoomCode', code);
    if (password) {
      localStorage.setItem('autoJoinRoomPassword', password);
    }
    setPage('Game');
  };

  const handleDirectJoin = (codeToJoin = directCode) => {
    if (codeToJoin.length >= 4) {
      localStorage.setItem('autoJoinRoomCode', codeToJoin);
      setPage('Game');
    }
  };

  const handleCreateRoomCustom = (customOptions) => {
    const { edition, maxPlayers, betAmount, password } = customOptions;
    // Store creation parameters for Game page
    localStorage.setItem('autoCreateRoomOptions', JSON.stringify(customOptions));
    localStorage.setItem('autoJoinRoomEdition', edition);
    localStorage.setItem('autoJoinRoomBet', betAmount);
    if (password) localStorage.setItem('autoJoinRoomPassword', password);
    setPage('Game');
  };

  // Ghép đấu nhanh (Quick Match)
  const handleQuickMatch = () => {
    // Find first available waiting room that is not full and does not require password
    const availableRoom = rooms.find(
      (r) =>
        r.status !== 'playing' &&
        r.players.length < r.maxPlayers &&
        !r.password &&
        (selectedEdition === 'all' || r.edition === selectedEdition)
    );

    if (availableRoom) {
      handleJoinRoom(availableRoom.code);
    } else {
      // If no room found, prompt to create a new room
      setIsCreateModalOpen(true);
    }
  };

  // Editions / Chế độ chơi mapping & badges
  const EDITION_MAP = {
    original: { labelVi: 'Mèo Nguyên Bản', labelEn: 'Original', color: 'bg-amber-500/20 text-amber-300 border-amber-500/60' },
    imploding: { labelVi: 'Mèo Sập (Nổ Tung)', labelEn: 'Imploding', color: 'bg-purple-500/20 text-purple-300 border-purple-500/60' },
    zombie: { labelVi: 'Mèo Zombie', labelEn: 'Zombie', color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/60' },
    good_vs_evil: { labelVi: 'Thiện vs Ác', labelEn: 'Good vs Evil', color: 'bg-rose-500/20 text-rose-300 border-rose-500/60' },
    streaking: { labelVi: 'Mèo Con Sọc', labelEn: 'Streaking', color: 'bg-orange-500/20 text-orange-300 border-orange-500/60' },
    '2_player': { labelVi: '2 Người Chơi', labelEn: '2 Player Duel', color: 'bg-sky-500/20 text-sky-300 border-sky-500/60' },
    barking: { labelVi: 'Barking Kittens', labelEn: 'Barking', color: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/60' },
  };

  // Filter Rooms logic
  const filteredRooms = rooms.filter((room) => {
    const matchesSearch = room.code.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesEdition = selectedEdition === 'all' || room.edition === selectedEdition;

    let matchesBet = true;
    if (selectedBetFilter === '0') matchesBet = (room.betAmount ?? 50) === 0;
    else if (selectedBetFilter === '25') matchesBet = (room.betAmount ?? 50) === 25;
    else if (selectedBetFilter === '50') matchesBet = (room.betAmount ?? 50) === 50;
    else if (selectedBetFilter === '100+') matchesBet = (room.betAmount ?? 50) >= 100;

    let matchesPlayers = true;
    if (selectedPlayersFilter === '2') matchesPlayers = room.maxPlayers === 2;
    else if (selectedPlayersFilter === '3-4') matchesPlayers = room.maxPlayers >= 3 && room.maxPlayers <= 4;
    else if (selectedPlayersFilter === '5-6') matchesPlayers = room.maxPlayers >= 5;

    return matchesSearch && matchesEdition && matchesBet && matchesPlayers;
  });

  const userCoins = userProfile?.coins ?? 9665;
  const userLevel = userProfile?.level ?? 23;
  const userXp = userProfile?.xp ?? 680;
  const maxXp = 1000;
  const xpPercent = Math.min(100, Math.round((userXp / maxXp) * 100));

  return (
    <div className="bg-pixel-dark min-h-screen text-white font-pop-body p-3 sm:p-6 lg:p-8 flex flex-col gap-6 w-full max-w-7xl mx-auto text-left selection:bg-purple-500 selection:text-white">
      
      {/* LiveOps Maintenance Alert */}
      {liveOps.config.maintenanceMode && (
        <div role="alert" className="border-2 border-red-500 bg-red-950/80 p-4 font-pop-accent font-black uppercase text-red-200 shadow-[0_0_20px_rgba(239,68,68,0.5)] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">⚠️</span>
            <span>
              {language === 'vi'
                ? 'Hệ thống đang bảo trì — tạm dừng tạo và tham gia phòng mới.'
                : 'Maintenance in progress — new room creation and joining are temporarily paused.'}
            </span>
          </div>
          <span className="font-mono text-xs opacity-75">v{liveOps.version}</span>
        </div>
      )}

      {/* --- TOP GAMER HUD HEADER --- */}
      <div className="bg-[#120b27]/90 border-2 border-purple-800/80 p-4 sm:p-5 shadow-[0_0_25px_rgba(124,58,237,0.2)] flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        {/* User Stats & Avatar */}
        <div className="flex items-center gap-4">
          {/* Avatar frame */}
          <div className="relative">
            <div className="w-14 h-14 bg-gradient-to-br from-amber-400 to-purple-600 border-2 border-amber-300 flex items-center justify-center text-2xl shadow-[0_0_15px_rgba(251,191,36,0.4)]">
              {userProfile?.avatar || '🐱'}
            </div>
            <span className="absolute -bottom-2 -right-2 bg-amber-400 text-black text-[10px] font-black px-1.5 py-0.5 border border-black shadow">
              Lv.{userLevel}
            </span>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-pop-display font-black text-lg text-white tracking-wider">
                {userProfile?.username || 'KittenCommander'}
              </h2>
              <span className="bg-purple-900/80 border border-purple-500/60 text-purple-300 text-[10px] font-mono px-2 py-0.5 uppercase">
                Pro Gamer
              </span>
            </div>

            {/* EXP Bar */}
            <div className="flex items-center gap-2 mt-1.5">
              <div className="w-36 h-2.5 bg-[#1a1236] border border-purple-800 overflow-hidden relative">
                <div
                  className="h-full bg-gradient-to-r from-purple-500 to-amber-400 transition-all duration-500"
                  style={{ width: `${xpPercent}%` }}
                />
              </div>
              <span className="text-[10px] font-mono text-purple-300/80">
                {userXp} / {maxXp} XP
              </span>
            </div>
          </div>
        </div>

        {/* HUD Quick Stats: Coins, Daily Gift, Online status */}
        <div className="flex flex-wrap items-center gap-3 sm:gap-4 w-full md:w-auto justify-between md:justify-end">
          {/* Coins Balance */}
          <div className="bg-[#1a1236] border-2 border-amber-400/60 px-3.5 py-2 flex items-center gap-2 shadow-[0_0_10px_rgba(251,191,36,0.2)]">
            <CoinIcon className="w-5 h-5" />
            <div className="flex flex-col">
              <span className="text-[9px] text-amber-300/70 uppercase font-mono font-bold">
                {language === 'vi' ? 'SỐ DƯ COINS' : 'COINS BALANCE'}
              </span>
              <span className="font-mono font-black text-sm text-amber-300">
                {userCoins.toLocaleString()} 🪙
              </span>
            </div>
          </div>

          {/* Daily Mission Badge */}
          <button
            onClick={() => setPage('Mission')}
            className="bg-[#1a1236] hover:bg-[#251949] border-2 border-purple-500/60 px-3.5 py-2 flex items-center gap-2 text-purple-200 hover:text-white transition-all cursor-pointer"
          >
            <span className="text-lg">🎁</span>
            <div className="flex flex-col text-left">
              <span className="text-[9px] text-purple-300/70 uppercase font-mono font-bold">
                {language === 'vi' ? 'NHIỆM VỤ' : 'QUESTS'}
              </span>
              <span className="font-pop-accent font-black text-xs text-amber-300">
                {language === 'vi' ? 'Nhận quà 🎁' : 'Claim Reward'}
              </span>
            </div>
          </button>

          {/* Online Players indicator */}
          <div className="bg-[#131b2e] border border-emerald-500/50 px-3 py-2 flex items-center gap-2 text-emerald-400 font-mono text-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>128 Online</span>
          </div>
        </div>
      </div>

      {/* --- HERO TITLE BANNER --- */}
      <div className="relative bg-gradient-to-r from-[#170e33] via-[#24134a] to-[#170e33] border-3 border-purple-500/80 p-6 sm:p-8 shadow-[0_0_35px_rgba(168,85,247,0.3)] overflow-hidden">
        {/* Glow backdrop effects */}
        <div className="absolute top-0 right-10 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-10 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="font-pop-display font-black text-3xl sm:text-5xl text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-rose-400 to-purple-300 uppercase tracking-wider drop-shadow-[0_4px_10px_rgba(0,0,0,0.8)] select-none">
                CHOOSE YOUR CHAOS
              </h1>
              <span className="bg-gradient-to-r from-amber-400 to-rose-500 text-black font-pop-display font-black text-xs sm:text-sm px-3 py-1 uppercase tracking-widest border border-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.5)] transform -rotate-2 select-none">
                SẢNH CHỜ ARENA 💥
              </span>
            </div>
            <p className="text-xs sm:text-sm text-purple-200/80 font-mono mt-3 max-w-2xl leading-relaxed uppercase tracking-wide">
              {language === 'vi'
                ? 'Chọn chế độ Mèo Nguyên Bản, Mèo Sập, Zombie... Khám phá các phòng đấu công khai hoặc tự tạo phòng chiến!'
                : 'Select Original, Imploding, Zombie mode... Explore public battle rooms or launch your custom arena!'}
            </p>
          </div>
        </div>
      </div>

      {/* --- 3 MAIN FEATURE ACTION CARDS --- */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

        {/* CARD 1: GHÉP ĐẤU NHANH (ORANGE NEON GLOW) */}
        <div className="bg-[#170e30] border-3 glow-orange-card p-6 flex flex-col justify-between gap-5 transition-all duration-300 relative group overflow-hidden">
          <div className="absolute -top-12 -right-12 w-32 h-32 bg-amber-500/15 rounded-full blur-2xl group-hover:bg-amber-500/25 transition-all" />
          <div>
            <div className="flex justify-between items-center border-b-2 border-amber-500/40 pb-3 mb-4">
              <h3 className="font-pop-display font-black text-base text-amber-300 uppercase tracking-wider flex items-center gap-2">
                <span>⚡</span>
                <span>{language === 'vi' ? 'GHÉP ĐẤU NHANH' : 'QUICK MATCH'}</span>
              </h3>
              <span className="bg-amber-400 text-black text-[9px] font-black px-2 py-0.5 uppercase tracking-wider">
                {language === 'vi' ? 'RECOMMENDED' : 'RECOMMENDED'}
              </span>
            </div>
            <p className="text-xs text-purple-200/80 font-mono leading-relaxed mb-4">
              {language === 'vi'
                ? 'Tự động tìm kiếm phòng sẵn có và vào trận chiến ngay lập tức.'
                : 'Instantly find available room and join the battlefield.'}
            </p>
            {/* Quick Tag Pills */}
            <div className="flex flex-wrap gap-1.5 mb-2">
              <span className="text-[10px] font-mono px-2 py-0.5 bg-amber-500/20 text-amber-300 border border-amber-500/40">
                ⚡ 1-Click Join
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 bg-purple-500/20 text-purple-300 border border-purple-500/40">
                🎮 Matchmaking
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={handleQuickMatch}
            disabled={liveOps.config.maintenanceMode}
            className="w-full py-3.5 bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 border-2 border-amber-200 text-black font-pop-display font-black text-sm uppercase tracking-wider shadow-[0_0_20px_rgba(245,158,11,0.5)] hover:shadow-[0_0_30px_rgba(245,158,11,0.8)] active:translate-y-0.5 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>⚡</span>
            <span>{language === 'vi' ? 'BẮT ĐẦU CHƠI' : 'PLAY NOW'}</span>
          </button>
        </div>

        {/* CARD 2: TẠO PHÒNG CUSTOM (EMERALD GREEN GLOW) */}
        <div className="bg-[#121c27] border-3 glow-green-card p-6 flex flex-col justify-between gap-5 transition-all duration-300 relative group overflow-hidden">
          <div className="absolute -top-12 -right-12 w-32 h-32 bg-emerald-500/15 rounded-full blur-2xl group-hover:bg-emerald-500/25 transition-all" />
          <div>
            <div className="flex justify-between items-center border-b-2 border-emerald-500/40 pb-3 mb-4">
              <h3 className="font-pop-display font-black text-base text-emerald-300 uppercase tracking-wider flex items-center gap-2">
                <span>➕</span>
                <span>{language === 'vi' ? 'TẠO PHÒNG MỚI' : 'CREATE ROOM'}</span>
              </h3>
              <span className="bg-emerald-400 text-black text-[9px] font-black px-2 py-0.5 uppercase tracking-wider">
                {language === 'vi' ? 'CUSTOM' : 'CUSTOM'}
              </span>
            </div>
            <p className="text-xs text-emerald-200/80 font-mono leading-relaxed mb-4">
              {language === 'vi'
                ? 'Tùy chọn Chế độ chơi (Mèo Sập, Zombie,...), chọn mức cược Coins và rủ bạn bè.'
                : 'Customize mode (Imploding, Zombie...), set bet stake and invite friends.'}
            </p>
            {/* Quick Tag Pills */}
            <div className="flex flex-wrap gap-1.5 mb-2">
              <span className="text-[10px] font-mono px-2 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                💣 Chế độ Mèo Sập
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                🪙 Đặt cược
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsCreateModalOpen(true)}
            disabled={liveOps.config.maintenanceMode}
            className="w-full py-3.5 bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 border-2 border-emerald-200 text-black font-pop-display font-black text-sm uppercase tracking-wider shadow-[0_0_20px_rgba(16,185,129,0.5)] hover:shadow-[0_0_30px_rgba(16,185,129,0.8)] active:translate-y-0.5 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>➕</span>
            <span>{language === 'vi' ? 'TẠO PHÒNG' : 'CREATE ROOM'}</span>
          </button>
        </div>

        {/* CARD 3: VÀO BẰNG MÃ (VIVID PURPLE GLOW) */}
        <div className="bg-[#1b1030] border-3 glow-purple-card p-6 flex flex-col justify-between gap-5 transition-all duration-300 relative group overflow-hidden">
          <div className="absolute -top-12 -right-12 w-32 h-32 bg-purple-500/15 rounded-full blur-2xl group-hover:bg-purple-500/25 transition-all" />
          <div>
            <div className="flex justify-between items-center border-b-2 border-purple-500/40 pb-3 mb-4">
              <h3 className="font-pop-display font-black text-base text-purple-300 uppercase tracking-wider flex items-center gap-2">
                <span>🔑</span>
                <span>{language === 'vi' ? 'VÀO BẰNG MÃ' : 'JOIN BY CODE'}</span>
              </h3>
              <span className="bg-purple-400 text-black text-[9px] font-black px-2 py-0.5 uppercase tracking-wider">
                {language === 'vi' ? 'DIRECT' : 'DIRECT'}
              </span>
            </div>
            <p className="text-xs text-purple-200/80 font-mono leading-relaxed mb-3">
              {language === 'vi'
                ? 'Nhập mã phòng gồm 4 - 6 ký tự được bạn bè chia sẻ để tham gia.'
                : 'Enter 4-6 char room PIN code shared by friends.'}
            </p>

            {/* Inline PIN Input Slot */}
            <div className="flex gap-2 my-2">
              <input
                type="text"
                placeholder="E.g. A1B2"
                value={directCode}
                onChange={(e) => setDirectCode(e.target.value.toUpperCase().slice(0, 6))}
                className="w-full bg-[#120b24] border-2 border-purple-600/80 px-3 py-2 text-center text-sm text-amber-300 font-mono font-bold tracking-widest focus:outline-none focus:border-purple-400 transition-all uppercase"
              />
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              if (directCode.length >= 4) handleDirectJoin(directCode);
              else setIsJoinCodeModalOpen(true);
            }}
            disabled={liveOps.config.maintenanceMode}
            className="w-full py-3.5 bg-gradient-to-r from-purple-600 to-indigo-500 hover:from-purple-500 hover:to-indigo-400 border-2 border-purple-300 text-white font-pop-display font-black text-sm uppercase tracking-wider shadow-[0_0_20px_rgba(168,85,247,0.5)] hover:shadow-[0_0_30px_rgba(168,85,247,0.8)] active:translate-y-0.5 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>➔</span>
            <span>{language === 'vi' ? 'NHẬP MÃ' : 'ENTER CODE'}</span>
          </button>
        </div>

      </div>

      {/* --- ACTIVE ROOMS BROWSER --- */}
      <div className="bg-[#120c27]/90 border-3 border-purple-800/80 p-5 sm:p-6 shadow-[0_0_30px_rgba(124,58,237,0.15)] flex flex-col gap-5">

        {/* Filters Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center border-b-2 border-purple-800/60 pb-4 gap-4">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🎮</span>
            <div>
              <h3 className="font-pop-display font-black text-xl text-amber-300 uppercase tracking-wider">
                {language === 'vi' ? 'PHÒNG ĐẤU ĐANG MỞ' : 'ACTIVE ROOMS BROWSER'}
              </h3>
              <p className="text-[11px] text-purple-300/70 font-mono">
                {language === 'vi' ? 'Danh sách các phòng chờ công khai thời gian thực' : 'Real-time public room waiting list'}
              </p>
            </div>
          </div>

          {/* Refresh Button */}
          <button
            onClick={fetchRooms}
            className="px-4 py-2 bg-[#1c133a] hover:bg-[#271b4e] border-2 border-purple-500/60 text-purple-200 hover:text-white font-mono font-bold text-xs uppercase transition-all flex items-center gap-2 cursor-pointer"
          >
            <span className={loading ? 'animate-spin' : ''}>🔄</span>
            <span>{language === 'vi' ? 'LÀM MỚI' : 'REFRESH'}</span>
          </button>
        </div>

        {/* Filter Controls Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 bg-[#181033] p-3 border border-purple-800/60">

          {/* Edition Filter (Chế độ chơi) */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-mono font-bold text-purple-300 uppercase tracking-wider">
              {language === 'vi' ? 'Chế độ chơi (Edition)' : 'Game Edition'}
            </label>
            <select
              value={selectedEdition}
              onChange={(e) => setSelectedEdition(e.target.value)}
              className="bg-[#120b27] border border-purple-700/80 px-3 py-2 text-xs text-amber-300 font-mono font-bold focus:outline-none focus:border-amber-400"
            >
              <option value="all">{language === 'vi' ? 'Tất cả Chế độ' : 'All Editions'}</option>
              <option value="original">{language === 'vi' ? 'Mèo Nguyên Bản' : 'Original Edition'}</option>
              <option value="imploding">{language === 'vi' ? 'Mèo Sập (Imploding)' : 'Imploding Kittens'}</option>
              <option value="zombie">{language === 'vi' ? 'Mèo Zombie' : 'Zombie Kittens'}</option>
              <option value="good_vs_evil">{language === 'vi' ? 'Thiện vs Ác' : 'Good vs Evil'}</option>
              <option value="streaking">{language === 'vi' ? 'Mèo Con Sọc' : 'Streaking Kittens'}</option>
              <option value="2_player">{language === 'vi' ? '2 Người Chơi' : '2 Player Duel'}</option>
              <option value="barking">{language === 'vi' ? 'Barking Kittens' : 'Barking Kittens'}</option>
            </select>
          </div>

          {/* Bet Filter (Mức cược) */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-mono font-bold text-purple-300 uppercase tracking-wider">
              {language === 'vi' ? 'Mức Cược (Coins 🪙)' : 'Bet Stake'}
            </label>
            <select
              value={selectedBetFilter}
              onChange={(e) => setSelectedBetFilter(e.target.value)}
              className="bg-[#120b27] border border-purple-700/80 px-3 py-2 text-xs text-amber-300 font-mono font-bold focus:outline-none focus:border-amber-400"
            >
              <option value="all">{language === 'vi' ? 'Tất cả Mức Cược' : 'All Bet Amounts'}</option>
              <option value="0">{language === 'vi' ? 'Miễn Phí (0 🪙)' : 'Free (0 🪙)'}</option>
              <option value="25">25 Coins 🪙</option>
              <option value="50">50 Coins 🪙</option>
              <option value="100+">100+ Coins 🪙</option>
            </select>
          </div>

          {/* Players Filter */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-mono font-bold text-purple-300 uppercase tracking-wider">
              {language === 'vi' ? 'Số Người Chơi' : 'Players Capacity'}
            </label>
            <select
              value={selectedPlayersFilter}
              onChange={(e) => setSelectedPlayersFilter(e.target.value)}
              className="bg-[#120b27] border border-purple-700/80 px-3 py-2 text-xs text-amber-300 font-mono font-bold focus:outline-none focus:border-amber-400"
            >
              <option value="all">{language === 'vi' ? 'Tất cả Slot' : 'All Capacities'}</option>
              <option value="2">2 Players (1v1)</option>
              <option value="3-4">3 - 4 Players</option>
              <option value="5-6">5 - 6 Players</option>
            </select>
          </div>

          {/* Code Search */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-mono font-bold text-purple-300 uppercase tracking-wider">
              {language === 'vi' ? 'Tìm theo Mã' : 'Search Room Code'}
            </label>
            <input
              type="text"
              placeholder={language === 'vi' ? 'Tìm mã phòng...' : 'Search room code...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-[#120b27] border border-purple-700/80 px-3 py-2 text-xs text-amber-300 font-mono font-bold focus:outline-none focus:border-amber-400"
            />
          </div>

        </div>

        {/* Room List Table Container */}
        {loading ? (
          <div className="py-16 text-center">
            <div className="inline-block text-4xl mb-3 animate-spin">🌀</div>
            <p className="font-mono text-xs uppercase text-purple-300 tracking-wider animate-pulse">
              {language === 'vi' ? 'Đang tải danh sách phòng chơi...' : 'Scanning active arenas...'}
            </p>
          </div>
        ) : filteredRooms.length === 0 ? (
          <div className="bg-[#150e2e] border-2 border-dashed border-purple-800/60 p-12 text-center flex flex-col items-center gap-3">
            <span className="text-5xl">🙀</span>
            <h4 className="font-pop-display font-black text-lg text-purple-200 uppercase">
              {language === 'vi' ? 'KHÔNG CÓ PHÒNG NÀO ĐANG MỞ' : 'NO ACTIVE ROOMS FOUND'}
            </h4>
            <p className="text-xs text-purple-400 font-mono max-w-md">
              {language === 'vi'
                ? 'Không tìm thấy phòng phù hợp với bộ lọc. Bạn hãy tự tạo phòng đấu mới nhé!'
                : 'No public room matches current filters. Launch your custom arena now!'}
            </p>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="mt-3 px-6 py-2.5 bg-emerald-500 hover:bg-emerald-400 border-2 border-emerald-300 text-black font-pop-display font-black text-xs uppercase tracking-wider shadow-[0_0_15px_rgba(16,185,129,0.4)] cursor-pointer"
            >
              ➕ {language === 'vi' ? 'TẠO PHÒNG MỚI NGAY' : 'CREATE ROOM NOW'}
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto border border-purple-800/80">
            <table className="w-full text-left font-mono text-xs border-collapse">
              <thead>
                <tr className="bg-[#191036] text-purple-300 border-b-2 border-purple-800 uppercase tracking-wider text-[11px]">
                  <th className="py-3.5 px-4">{language === 'vi' ? 'MÃ PHÒNG' : 'ROOM CODE'}</th>
                  <th className="py-3.5 px-4">{language === 'vi' ? 'CHỦ PHÒNG' : 'HOST'}</th>
                  <th className="py-3.5 px-4">{language === 'vi' ? 'CHẾ ĐỘ CHƠI' : 'EDITION'}</th>
                  <th className="py-3.5 px-4">{language === 'vi' ? 'MỨC CƯỢC' : 'BET'}</th>
                  <th className="py-3.5 px-4">{language === 'vi' ? 'NGƯỜI CHƠI' : 'PLAYERS'}</th>
                  <th className="py-3.5 px-4">{language === 'vi' ? 'TRẠNG THÁI' : 'STATUS'}</th>
                  <th className="py-3.5 px-4 text-right">{language === 'vi' ? 'HÀNH ĐỘNG' : 'ACTION'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-purple-900/40">
                {filteredRooms.map((room) => {
                  const isFull = room.players.length >= room.maxPlayers;
                  const isPlaying = room.status === 'playing';
                  const edConfig = EDITION_MAP[room.edition] || {
                    labelVi: room.edition,
                    labelEn: room.edition,
                    color: 'bg-purple-900/30 text-purple-300 border-purple-700',
                  };
                  const betVal = room.betAmount ?? 50;

                  return (
                    <tr
                      key={room.code}
                      className="bg-[#140c2e] hover:bg-[#1f1345] transition-all group"
                    >
                      {/* Room Code */}
                      <td className="py-3.5 px-4 font-black text-amber-300 tracking-wider">
                        <span className="flex items-center gap-1.5">
                          {room.password && <span title="Protected">🔒</span>}
                          <span>{room.code}</span>
                        </span>
                      </td>

                      {/* Host */}
                      <td className="py-3.5 px-4 text-purple-200">
                        <div className="flex items-center gap-2">
                          <span className="text-base">🐱</span>
                          <span className="font-bold">{room.hostName || 'MeoMaster'}</span>
                        </div>
                      </td>

                      {/* Edition Tag */}
                      <td className="py-3.5 px-4">
                        <span className={`px-2.5 py-1 border text-[10px] font-bold uppercase ${edConfig.color}`}>
                          {language === 'vi' ? edConfig.labelVi : edConfig.labelEn}
                        </span>
                      </td>

                      {/* Bet */}
                      <td className="py-3.5 px-4 text-amber-300 font-bold">
                        <span className="flex items-center gap-1">
                          <CoinIcon className="w-3.5 h-3.5" />
                          <span>{betVal === 0 ? 'Free' : `${betVal} 🪙`}</span>
                        </span>
                      </td>

                      {/* Players Slots */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white">
                            {room.players.length} / {room.maxPlayers}
                          </span>
                          <div className="flex gap-1">
                            {Array.from({ length: room.maxPlayers }).map((_, i) => (
                              <span
                                key={i}
                                className={`w-2 h-2 rounded-full ${
                                  i < room.players.length ? 'bg-amber-400' : 'bg-purple-900'
                                }`}
                              />
                            ))}
                          </div>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        {isPlaying ? (
                          <span className="px-2 py-0.5 bg-red-950/80 border border-red-500 text-red-300 text-[10px] font-bold uppercase">
                            🔴 {language === 'vi' ? 'Đang chơi' : 'Playing'}
                          </span>
                        ) : isFull ? (
                          <span className="px-2 py-0.5 bg-purple-950/80 border border-purple-700 text-purple-400 text-[10px] font-bold uppercase">
                            🚫 {language === 'vi' ? 'Đầy phòng' : 'Full'}
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 bg-emerald-950/80 border border-emerald-500 text-emerald-300 text-[10px] font-bold uppercase">
                            🟢 {language === 'vi' ? 'Đang chờ' : 'Waiting'}
                          </span>
                        )}
                      </td>

                      {/* Action */}
                      <td className="py-3.5 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => handleJoinRoom(room.code, room.password)}
                          disabled={isPlaying || isFull || liveOps.config.maintenanceMode}
                          className={`px-4 py-1.5 border text-xs font-pop-display font-black uppercase tracking-wider transition-all cursor-pointer ${
                            isPlaying
                              ? 'bg-purple-950/40 border-purple-900 text-purple-600 cursor-not-allowed'
                              : isFull
                              ? 'bg-purple-950/40 border-purple-900 text-purple-600 cursor-not-allowed'
                              : 'bg-emerald-500 hover:bg-emerald-400 border-emerald-300 text-black shadow-[0_0_12px_rgba(16,185,129,0.4)]'
                          }`}
                        >
                          {isPlaying
                            ? (language === 'vi' ? 'ĐANG CHƠI 🎮' : 'PLAYING')
                            : isFull
                            ? (language === 'vi' ? 'ĐẦY PHÒNG 🚫' : 'FULL')
                            : (language === 'vi' ? 'THAM GIA 🚀' : 'JOIN ROOM 🚀')}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

      </div>

      {/* --- BOTTOM TRUST & COMMUNITY STRIP --- */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 bg-[#120b24] border-2 border-purple-800/80 p-5 shadow-[0_0_20px_rgba(124,58,237,0.15)]">
        <div className="flex items-center gap-3">
          <span className="text-3xl">🛡️</span>
          <div>
            <h4 className="font-pop-display font-black text-xs text-amber-300 uppercase">CÔNG BẰNG & MINH BẠCH</h4>
            <p className="text-[10px] text-purple-300/70 font-mono">Hệ thống chống gian lận hiện đại</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-3xl">🎁</span>
          <div>
            <h4 className="font-pop-display font-black text-xs text-emerald-300 uppercase">PHẦN THƯỞNG HẤP DẪN</h4>
            <p className="text-[10px] text-purple-300/70 font-mono">Sự kiện & quà tặng hàng tuần</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-3xl">👥</span>
          <div>
            <h4 className="font-pop-display font-black text-xs text-purple-300 uppercase">CỘNG ĐỒNG SÔI NỔI</h4>
            <p className="text-[10px] text-purple-300/70 font-mono">Kết bạn & lập đội thách đấu</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-3xl">🔒</span>
          <div>
            <h4 className="font-pop-display font-black text-xs text-rose-300 uppercase">BẢO MẬT TUYỆT ĐỐI</h4>
            <p className="text-[10px] text-purple-300/70 font-mono">Tài khoản được bảo vệ 24/7</p>
          </div>
        </div>
      </div>

      {/* --- MODALS --- */}
      <CreateRoomModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreateRoom={handleCreateRoomCustom}
        userCoins={userCoins}
      />

      <JoinByCodeModal
        isOpen={isJoinCodeModalOpen}
        onClose={() => setIsJoinCodeModalOpen(false)}
        onJoinRoom={(code, pwd) => handleJoinRoom(code, pwd)}
      />

    </div>
  );
}
