import React, { useState, useEffect } from 'react';
import { PRESET_AVATARS } from '../components/PlayerAvatar.jsx';
import { gsap } from 'gsap';
import CustomDialog from '../components/CustomDialog.jsx';
import { CoinIcon, GemIcon } from '../components/CoinDisplay.jsx';
import { useLanguage } from '../context/LanguageContext.jsx';
import { getRankProgress } from '../utils/rankProgress.js';

export default function Profile() {
  const { t, language } = useLanguage();
  const [profile, setProfile] = useState(null);
  const [username, setUsername] = useState('');
  const [avatar, setAvatar] = useState('');
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);
  const [history, setHistory] = useState([]);
  const [quests, setQuests] = useState([]);
  const [dialogState, setDialogState] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: null,
  });

  const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:5000';

  const fetchProfile = async () => {
    const token = localStorage.getItem('accessToken');
    if (!token) return;

    try {
      const res = await fetch(`${API_URL}/api/users/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        setProfile(data);
        setUsername(data.username);
        setAvatar(data.avatar || '');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchHistory = async () => {
    const token = localStorage.getItem('accessToken');
    if (!token) return;

    try {
      const res = await fetch(`${API_URL}/api/users/me/history?limit=5`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        setHistory(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchQuests = async () => {
    const token = localStorage.getItem('accessToken');
    if (!token) return;

    try {
      const res = await fetch(`${API_URL}/api/users/me/quests`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        setQuests(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleClaimQuest = async (questId) => {
    const token = localStorage.getItem('accessToken');
    if (!token) return;

    try {
      const res = await fetch(`${API_URL}/api/users/me/quests/${questId}/claim`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        fetchProfile();
        fetchQuests();
      } else {
        setDialogState({
          isOpen: true,
          title: t('profile_claim_fail_title'),
          message: data.message || t('profile_claim_fail_msg'),
          onConfirm: () => setDialogState({ isOpen: false }),
        });
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchProfile();
    fetchHistory();
    fetchQuests();
  }, []);

  useEffect(() => {
    if (profile) {
      gsap.fromTo('.profile-left', 
        { opacity: 0, x: -50 },
        { opacity: 1, x: 0, duration: 0.6, ease: 'power3.out' }
      );
      gsap.fromTo('.profile-right', 
        { opacity: 0, x: 50 },
        { opacity: 1, x: 0, duration: 0.6, ease: 'power3.out', delay: 0.1 }
      );
    }
  }, [profile]);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setMessage('');
    setIsError(false);

    const token = localStorage.getItem('accessToken');
    if (!token) return;

    try {
      const res = await fetch(`${API_URL}/api/users/me`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ username, avatar }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || t('profile_update_fail'));

      setProfile(data);
      setIsError(false);
      setMessage(t('profile_update_success'));
    } catch (err) {
      setIsError(true);
      setMessage(err.message);
    }
  };

  // Convert custom image upload to base64
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setAvatar(reader.result); // Base64 data URL
    };
    reader.readAsDataURL(file);
  };

  if (!profile) {
    return (
      <div className="text-center py-12">
        <p className="font-headline font-black uppercase text-xl animate-pulse">{t('profile_loading')}</p>
      </div>
    );
  }
  const rankProgress = getRankProgress(profile.eloPoints);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 font-pop-body">
      {/* Left Column: Personal Info & Avatar Settings */}
      <div className="profile-left lg:col-span-1 flex flex-col gap-8">
        {/* Profile Details Card */}
        <div className="bg-white border-3 border-[var(--pop-black)] shadow-[5px_5px_0_var(--pop-black)] rounded-none p-6 flex flex-col items-center relative text-left">
          <div className="relative h-24 w-24 mb-4">
            {profile.activeAvatarFrame && (
              <div className="absolute inset-[-8px] border-4 border-[var(--pop-amber)] animate-spin-slow pointer-events-none z-10" />
            )}
            <div className="h-full w-full rounded-none flex items-center justify-center text-3xl font-pop-accent font-black bg-white border-3 border-[var(--pop-black)] overflow-hidden shadow-[3px_3px_0_var(--pop-black)]">
              {avatar && PRESET_AVATARS[avatar] ? (
                <span className="text-5xl">{PRESET_AVATARS[avatar]}</span>
              ) : avatar ? (
                <img src={avatar} alt={username} className="h-full w-full object-cover" />
              ) : (
                <span>{profile.username.slice(0, 2).toUpperCase()}</span>
              )}
            </div>
          </div>

          <h2 className="text-2xl font-pop-display font-black text-[var(--pop-black)] uppercase truncate max-w-full">
            {profile.username}
          </h2>
          <span className="bg-[var(--pop-red)] text-white font-pop-accent font-bold text-xs px-4 py-1.5 rounded-none border-2 border-[var(--pop-black)] shadow-[2px_2px_0_var(--pop-black)] uppercase mt-3">
            🏆 {profile.rank} • {profile.eloPoints} {t('profile_elo')}
          </span>
          <div className="mt-4 w-full border-2 border-[var(--pop-black)] bg-[var(--pop-cream)] p-3 shadow-[2px_2px_0_var(--pop-black)]">
            <div className="mb-1.5 flex items-center justify-between gap-2 text-[10px] font-black uppercase">
              <span>{rankProgress.currentRank}</span>
              <span>{rankProgress.nextRank ? `${rankProgress.remaining} ELO ${language === 'en' ? 'to' : 'đến'} ${rankProgress.nextRank}` : 'MAX RANK'}</span>
            </div>
            <div className="h-3 border-2 border-[var(--pop-black)] bg-white" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow={Math.round(rankProgress.progress)}>
              <div className="h-full bg-[var(--pop-amber)] transition-[width]" style={{ width: `${rankProgress.progress}%` }} />
            </div>
          </div>

          <div className="w-full grid grid-cols-2 gap-4 mt-6 pt-6 border-t-3 border-dashed border-[var(--pop-black)]/20">
            <div className="bg-white border-2 border-[var(--pop-black)] rounded-none p-3 text-center shadow-[2px_2px_0_var(--pop-black)] flex flex-col items-center justify-center">
              <span className="text-[10px] font-pop-accent font-bold text-[var(--pop-black)]/60 uppercase block">{t('profile_coins')}</span>
              <span className="font-pop-accent font-black text-[var(--pop-red)] text-lg flex items-center gap-1.5 justify-center mt-1">
                <CoinIcon className="w-5 h-5 text-[var(--pop-red)]" /> {profile.coins}
              </span>
            </div>
            <div className="bg-white border-2 border-[var(--pop-black)] rounded-none p-3 text-center shadow-[2px_2px_0_var(--pop-black)] flex flex-col items-center justify-center">
              <span className="text-[10px] font-pop-accent font-bold text-[var(--pop-black)]/60 uppercase block">{t('profile_gems')}</span>
              <span className="font-pop-accent font-black text-indigo-600 text-lg flex items-center gap-1.5 justify-center mt-1">
                <GemIcon className="w-5 h-5 text-indigo-600" /> {profile.gems}
              </span>
            </div>
          </div>
        </div>

        {/* Edit Info Form */}
        <form onSubmit={handleUpdateProfile} className="bg-white border-3 border-[var(--pop-black)] shadow-[5px_5px_0_var(--pop-black)] rounded-none p-6 flex flex-col gap-4 text-left">
          <h3 className="text-lg font-pop-display font-black text-[var(--pop-black)] uppercase border-b-3 border-[var(--pop-black)] pb-2">
            {t('profile_edit_title')}
          </h3>

          {message && (
            <div className={`p-3 rounded-none text-xs font-pop-accent font-bold text-center border-2 border-[var(--pop-black)] shadow-[2.5px_2.5px_0_var(--pop-black)]
              ${isError ? 'bg-[var(--pop-red)] text-white' : 'bg-[var(--pop-amber)] text-[var(--pop-black)]'}`}>
              {message}
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-pop-accent font-bold text-[var(--pop-black)] uppercase tracking-wider">{t('username_label')}</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="bg-[#FFFFFF] border-3 border-[var(--pop-black)] rounded-none px-3 py-2 text-xs text-[var(--pop-black)] font-bold focus:outline-none focus:bg-[var(--pop-cream)] shadow-[2px_2px_0_var(--pop-black)] focus:shadow-[4px_4px_0_var(--pop-black)] focus:-translate-y-0.5 focus:-translate-x-0.5 transition-all"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs font-pop-accent font-bold text-[var(--pop-black)] uppercase tracking-wider">{t('profile_choose_avatar')}</label>
            <div className="grid grid-cols-6 gap-2">
              {Object.keys(PRESET_AVATARS).map((key) => (
                <button
                  type="button"
                  key={key}
                  onClick={() => setAvatar(key)}
                  className={`h-10 border-2 border-[var(--pop-black)] rounded-none flex items-center justify-center text-xl transition-all shadow-[1.5px_1.5px_0_var(--pop-black)] cursor-pointer
                    ${avatar === key ? 'bg-[var(--pop-amber)] text-[var(--pop-black)] scale-110 border-dashed translate-x-[-1px] translate-y-[-1px]' : 'bg-white hover:bg-[var(--pop-cream)] hover:translate-y-[-1px]'}`}
                >
                  {PRESET_AVATARS[key]}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-2 mt-2">
            <label className="text-xs font-pop-accent font-bold text-[var(--pop-black)] uppercase tracking-wider">{t('profile_choose_avatar')}</label>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="text-xs text-[var(--pop-black)]/60 font-bold file:mr-4 file:py-2 file:px-4 file:rounded-none file:border-2 file:border-[var(--pop-black)] file:text-xs file:font-pop-accent file:font-black file:bg-white file:text-[var(--pop-black)] file:cursor-pointer hover:file:bg-[var(--pop-cream)]"
            />
          </div>

          <button type="submit" className="w-full mt-2 py-3 bg-[var(--pop-red)] text-white border-3 border-[var(--pop-black)] shadow-[3px_3px_0_var(--pop-black)] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[4px_4px_0_var(--pop-black)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none font-pop-accent font-black uppercase text-sm cursor-pointer">
            {t('profile_save_btn')}
          </button>
        </form>
      </div>

      {/* Right Column: Statistics & Match History */}
      <div className="profile-right lg:col-span-2 flex flex-col gap-8 text-left">
        {/* Daily Quests Card */}
        <div className="bg-white border-3 border-[var(--pop-black)] shadow-[5px_5px_0_var(--pop-black)] rounded-none p-6 flex flex-col gap-6">
          <h3 className="text-lg font-pop-display font-black text-[var(--pop-black)] uppercase border-b-3 border-[var(--pop-black)] pb-2">
            {t('profile_quests_title')}
          </h3>

          <div className="flex flex-col gap-4">
            {quests.length === 0 ? (
              <p className="text-center text-sm font-bold text-[var(--pop-black)]/60 py-8">
                {t('profile_no_quests')}
              </p>
            ) : (
              quests.map((quest) => {
                const progressPercent = Math.min(100, (quest.currentCount / quest.targetCount) * 100);
                const isClaimed = quest.status === 'claimed';
                const isCompleted = quest.status === 'completed';

                return (
                  <div 
                    key={quest.questId} 
                    className="border-2 border-[var(--pop-black)] rounded-none p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-[2px_2px_0_var(--pop-black)] bg-white"
                  >
                    <div className="flex-1 flex flex-col gap-1.5 w-full">
                      <div className="flex justify-between items-center">
                        <span className="font-pop-accent font-black text-sm uppercase text-[var(--pop-black)]">
                          {quest.title}
                        </span>
                        <span className="text-[10px] font-pop-accent font-black text-indigo-600 bg-indigo-50 border-2 border-indigo-200 px-2 py-0.5 rounded-none">
                          +{quest.reward?.coins || 0} {t('shop_gold')} {quest.reward?.gems > 0 && `• +${quest.reward.gems} ${t('shop_pink')}`}
                        </span>
                      </div>
                      
                      <p className="text-[11px] text-[var(--pop-black)]/60 font-bold">
                        {quest.description}
                      </p>

                      {/* Progress Bar */}
                      <div className="flex items-center gap-3 w-full mt-1">
                        <div className="flex-1 h-3.5 bg-slate-100 border-2 border-[var(--pop-black)] rounded-none overflow-hidden relative">
                          <div 
                            className="h-full bg-emerald-400 transition-all duration-300"
                            style={{ width: `${progressPercent}%` }}
                          />
                          <span className="absolute inset-0 flex items-center justify-center text-[9px] font-pop-accent font-black text-[var(--pop-black)]">
                            {quest.currentCount} / {quest.targetCount}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="w-full sm:w-auto flex justify-end">
                      {isClaimed ? (
                        <span className="bg-slate-100 border-2 border-slate-300 text-slate-400 font-pop-accent font-black text-[10px] px-4 py-2 rounded-none uppercase">
                          {t('profile_quest_claimed')}
                        </span>
                      ) : isCompleted ? (
                        <button
                          onClick={() => handleClaimQuest(quest.questId)}
                          className="w-full sm:w-auto bg-[var(--pop-amber)] text-[var(--pop-black)] font-pop-accent font-black border-2 border-[var(--pop-black)] shadow-[2px_2px_0px_0px_var(--pop-black)] px-4 py-2 rounded-none text-[10px] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[3px_3px_0_var(--pop-black)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all uppercase cursor-pointer"
                        >
                          {t('profile_quest_claim')}
                        </button>
                      ) : (
                        <span className="bg-white border-2 border-slate-300 text-[var(--pop-black)]/40 font-pop-accent font-black text-[10px] px-4 py-2 rounded-none uppercase">
                          {t('profile_quest_locked')}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Statistics Grid */}
        <div className="bg-white border-3 border-[var(--pop-black)] shadow-[5px_5px_0_var(--pop-black)] rounded-none p-6 flex flex-col gap-6">
          <h3 className="text-lg font-pop-display font-black text-[var(--pop-black)] uppercase border-b-3 border-[var(--pop-black)] pb-2">
            {t('profile_stats_title')}
          </h3>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
            <div className="bg-white border-2 border-[var(--pop-black)] rounded-none p-4 text-center shadow-[3px_3px_0_var(--pop-black)]">
              <span className="text-[10px] font-pop-accent font-bold text-[var(--pop-black)]/60 uppercase block">{t('profile_total_games')}</span>
              <span className="font-pop-display font-black text-3xl text-[var(--pop-black)]">{profile?.stats?.totalGames || 0}</span>
            </div>
            <div className="bg-[var(--pop-amber)] border-2 border-[var(--pop-black)] rounded-none p-4 text-center shadow-[3px_3px_0_var(--pop-black)] text-[var(--pop-black)]">
              <span className="text-[10px] font-pop-accent font-black text-[var(--pop-black)]/60 uppercase block">{t('profile_wins')}</span>
              <span className="font-pop-display font-black text-3xl text-[var(--pop-black)]">{profile?.stats?.wins || 0}</span>
            </div>
            <div className="bg-[var(--pop-red)] border-2 border-[var(--pop-black)] rounded-none p-4 text-center shadow-[3px_3px_0_var(--pop-black)] text-white">
              <span className="text-[10px] font-pop-accent font-bold text-red-100 uppercase block">{t('profile_losses')}</span>
              <span className="font-pop-display font-black text-3xl text-white">{profile?.stats?.losses || 0}</span>
            </div>
            <div className="bg-[var(--pop-cream)] border-2 border-[var(--pop-black)] rounded-none p-4 text-center shadow-[3px_3px_0_var(--pop-black)] text-[var(--pop-black)] flex flex-col items-center justify-center">
              <span className="text-[10px] font-pop-accent font-bold text-[var(--pop-black)]/60 uppercase block">{t('profile_longest_streak')}</span>
              <span className="font-pop-display font-black text-3xl text-[var(--pop-black)] flex items-center justify-center gap-1 mt-0.5 font-mono">🔥 {profile?.stats?.longestStreak || 0}</span>
            </div>
          </div>
        </div>

        {/* Match History */}
        <div className="bg-white border-3 border-[var(--pop-black)] shadow-[5px_5px_0_var(--pop-black)] rounded-none p-6 flex flex-col gap-6 text-left">
          <h3 className="text-lg font-pop-display font-black text-[var(--pop-black)] uppercase border-b-3 border-[var(--pop-black)] pb-2">
            {t('profile_history_title')}
          </h3>

          <div className="flex flex-col gap-4">
            {history.length === 0 ? (
              <p className="text-center text-sm font-bold text-[var(--pop-black)]/60 py-8">
                {t('profile_no_history')}
              </p>
            ) : (
              history.map((game) => {
                const myRank = game.players.find(p => p.userId === profile._id);
                const isWinner = myRank?.rank === 1;
                return (
                  <div key={game._id} className="border-2 border-[var(--pop-black)] rounded-none p-4 flex justify-between items-center shadow-[2px_2px_0_var(--pop-black)] bg-white">
                    <div className="flex flex-col gap-1">
                      <span className="font-pop-accent font-black text-sm uppercase text-[var(--pop-black)]">
                        {t('profile_match_id', { id: game._id.slice(-6).toUpperCase() })}
                      </span>
                      <span className="text-[10px] text-[var(--pop-black)]/60 font-bold">
                        {t('profile_played_at', { date: new Date(game.playedAt).toLocaleString() })}
                      </span>
                    </div>
                    <span className={`px-4 py-1.5 rounded-none border-2 border-[var(--pop-black)] font-pop-accent font-black text-xs uppercase shadow-[1.5px_1.5px_0_var(--pop-black)]
                      ${isWinner ? 'bg-[var(--pop-amber)] text-[var(--pop-black)]' : 'bg-[var(--pop-red)] text-white'}`}>
                      {isWinner ? t('profile_history_win') : t('profile_history_lose', { rank: myRank?.rank ?? '?' })}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
      <CustomDialog
        isOpen={dialogState.isOpen}
        title={dialogState.title}
        message={dialogState.message}
        isConfirm={false}
        confirmText="Đóng"
        onConfirm={dialogState.onConfirm || (() => setDialogState({ isOpen: false }))}
      />
    </div>
  );
}
