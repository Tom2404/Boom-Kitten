import React, { useState, useEffect, useMemo } from 'react';
import { CoinIcon } from '../components/CoinDisplay.jsx';
import { PixelStarIcon, PixelTrophyIcon } from '../components/PixelIcons.jsx';
import { useLanguage } from '../context/LanguageContext.jsx';
import CustomDialog from '../components/CustomDialog.jsx';
import { gsap } from 'gsap';

export default function Mission({ setPage }) {
  const { t, language } = useLanguage();
  const [quests, setQuests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [dialogState, setDialogState] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: null,
  });

  const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:5000';
  const token = localStorage.getItem('accessToken');
  const isAuthenticated = !!token;

  const fetchQuests = async () => {
    try {
      setLoading(true);
      const headers = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const res = await fetch(`${API_URL}/api/missions`, { headers });
      const data = await res.json();
      if (res.ok) {
        setQuests(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuests();
  }, []);

  const claimableCount = useMemo(() => {
    return quests.filter((q) => {
      const currentCount = q.currentCount || 0;
      const targetCount = q.targetCount || 1;
      const isClaimed = q.status === 'claimed';
      const isCompleted = q.status === 'completed' || (currentCount >= targetCount && !isClaimed);
      return isCompleted && !isClaimed;
    }).length;
  }, [quests]);

  const completedTotal = useMemo(() => {
    return quests.filter((q) => {
      const currentCount = q.currentCount || 0;
      const targetCount = q.targetCount || 1;
      return q.status === 'claimed' || q.status === 'completed' || currentCount >= targetCount;
    }).length;
  }, [quests]);

  const filteredQuests = useMemo(() => {
    return quests.filter((q) => {
      const currentCount = q.currentCount || 0;
      const targetCount = q.targetCount || 1;
      const isClaimed = q.status === 'claimed';
      const isCompleted = q.status === 'completed' || (currentCount >= targetCount && !isClaimed);

      if (selectedFilter === 'claimable') return isCompleted && !isClaimed;
      if (selectedFilter === 'in_progress') return !isCompleted && !isClaimed;
      if (selectedFilter === 'claimed') return isClaimed;
      return true;
    });
  }, [quests, selectedFilter]);

  useEffect(() => {
    if (!loading && filteredQuests.length > 0) {
      // ponytail: Stagger animation for mission-card entrance
      gsap.fromTo('.mission-card', 
        { opacity: 0, y: 16, scale: 0.98 },
        { opacity: 1, y: 0, scale: 1, duration: 0.35, stagger: 0.05, ease: 'back.out(1.1)' }
      );
    }
  }, [filteredQuests, loading, selectedFilter]);

  const showLoginRequired = () => {
    setDialogState({
      isOpen: true,
      title: language === 'vi' ? '🔒 Yêu cầu đăng nhập' : '🔒 Login Required',
      message: t('loginRequiredMission') || 'Bạn cần đăng nhập để nhận thưởng nhiệm vụ.',
      isConfirm: true,
      confirmText: language === 'vi' ? 'Đăng nhập' : 'Login',
      cancelText: language === 'vi' ? 'Hủy' : 'Cancel',
      onConfirm: () => {
        setDialogState({ isOpen: false });
        setPage('Login');
      },
      onCancel: () => setDialogState({ isOpen: false })
    });
  };

  const handleClaimQuest = async (questId) => {
    if (!isAuthenticated) {
      showLoginRequired();
      return;
    }

    try {
      const res = await fetch(`${API_URL}/api/missions/${questId}/claim`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        fetchQuests();
        window.dispatchEvent(new Event('missions:updated'));
        window.dispatchEvent(new Event('balance:updated'));
      } else {
        setDialogState({
          isOpen: true,
          title: t('profile_claim_fail_title') || 'Nhận thưởng thất bại',
          message: data.message || t('profile_claim_fail_msg'),
          onConfirm: () => setDialogState({ isOpen: false }),
        });
      }
    } catch (e) {
      console.error(e);
    }
  };

  const filterTabs = [
    { id: 'all', label: language === 'vi' ? 'Tất cả' : 'All', count: quests.length },
    { id: 'claimable', label: language === 'vi' ? 'Có thể nhận' : 'Claimable', count: claimableCount, highlight: claimableCount > 0 },
    { id: 'in_progress', label: language === 'vi' ? 'Đang làm' : 'In Progress', count: quests.length - completedTotal },
    { id: 'claimed', label: language === 'vi' ? 'Đã nhận' : 'Claimed', count: quests.filter(q => q.status === 'claimed').length },
  ];

  return (
    <div className="flex flex-col gap-6 select-none text-left font-pop-body max-w-7xl mx-auto px-2 sm:px-4 py-3">
      {/* Header and Summary Badge */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div className="text-left">
          <h1 
            className="font-pop-display font-black text-4xl md:text-6xl text-white uppercase tracking-tight relative leading-none py-1 text-stroke-black-3"
            style={{
              textShadow: '4px 4px 0px var(--pop-orange)'
            }}
          >
            {t('mission') || (language === 'vi' ? 'Nhiệm Vụ' : 'Missions')}
          </h1>
          <p className="text-xs sm:text-sm font-bold text-slate-800 mt-2 max-w-xl leading-relaxed">
            {language === 'vi' 
              ? 'Hoàn thành các nhiệm vụ hàng ngày để nhận Xu mở khóa trang bị độc quyền!'
              : 'Complete daily missions to earn Coins and unlock exclusive cosmetic gear!'}
          </p>
        </div>

        {/* Top-Right HUD Battle Badge for Mission Rewards */}
        {claimableCount > 0 ? (
          <div className="bg-[var(--pop-amber)] border-3 border-[var(--pop-black)] px-5 py-3 rounded-2xl flex items-center gap-3.5 shadow-[4px_4px_0_var(--pop-black)] transition-transform hover:scale-[1.02]">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--pop-red)] text-white font-pixel font-black text-sm border-2 border-[var(--pop-black)] shadow-[1px_1px_0_var(--pop-black)] animate-bounce">
              {claimableCount}
            </span>
            <div className="flex flex-col">
              <span className="font-pixel text-[11px] font-black uppercase text-neutral-900 leading-none">
                {language === 'vi' ? 'Phần thưởng sẵn sàng' : 'Rewards Ready'}
              </span>
              <span className="font-pop-accent font-black text-sm sm:text-base text-rose-800 uppercase tracking-tight leading-snug">
                {language === 'vi' ? `${claimableCount} quà chờ nhận!` : `${claimableCount} ready to claim!`}
              </span>
            </div>
          </div>
        ) : (
          <div className="bg-white border-3 border-[var(--pop-black)] px-5 py-3 rounded-2xl flex items-center gap-3.5 shadow-[4px_4px_0_var(--pop-black)]">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-100 border-2 border-[var(--pop-black)]">
              <PixelTrophyIcon size={18} className="text-amber-600" />
            </div>
            <div className="flex flex-col">
              <span className="font-pixel text-[11px] font-black uppercase text-slate-600 leading-none">
                {language === 'vi' ? 'Tiến độ hôm nay' : "Today's Progress"}
              </span>
              <span className="font-pop-accent font-black text-sm sm:text-base text-[var(--pop-black)] tabular-nums leading-snug">
                {completedTotal} / {quests.length} {language === 'vi' ? 'Hoàn thành' : 'Completed'}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Guest Notice */}
      {!isAuthenticated && (
        <div 
          onClick={showLoginRequired}
          className="p-4 rounded-2xl text-xs sm:text-sm font-pop-accent font-bold text-center border-3 border-[var(--pop-black)] bg-amber-300 text-neutral-950 shadow-[4px_4px_0_var(--pop-black)] uppercase tracking-wider cursor-pointer hover:bg-amber-200 transition-all flex items-center justify-center gap-2"
        >
          <span>🔒</span>
          <span>{language === 'vi' ? 'Đăng nhập để lưu tiến độ và nhận thưởng Xu mỗi ngày!' : 'Log in to save progress and claim daily Coin rewards!'}</span>
        </div>
      )}

      {/* Filter Tabs Menu */}
      <div className="flex gap-3 flex-wrap border-b-3 border-dashed border-[var(--pop-black)]/20 pb-4">
        {filterTabs.map((tab) => {
          const active = selectedFilter === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setSelectedFilter(tab.id)}
              className={`px-4 sm:px-5 py-2.5 border-3 border-[var(--pop-black)] font-pop-accent font-black text-xs sm:text-sm uppercase shadow-[3px_3px_0_var(--pop-black)] transition-all rounded-xl cursor-pointer flex items-center gap-2
                ${active 
                  ? 'bg-[var(--pop-red)] text-white translate-x-[2px] translate-y-[2px] shadow-[1px_1px_0_var(--pop-black)]' 
                  : 'bg-white text-[var(--pop-black)] hover:bg-[var(--pop-cream)] hover:translate-y-[-1px]'}`}
            >
              <span>{tab.label}</span>
              <span className={`border-2 border-[var(--pop-black)] px-2 py-0.5 font-pixel text-xs font-black rounded-md ${
                tab.highlight 
                  ? 'bg-[var(--pop-amber)] text-[var(--pop-black)] animate-pulse' 
                  : active ? 'bg-white text-[var(--pop-black)]' : 'bg-stone-100 text-slate-800'
              }`}>
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Quests List Container */}
      <div className="bg-white border-3 border-[var(--pop-black)] shadow-[6px_6px_0_var(--pop-black)] rounded-2xl p-4 sm:p-6 flex flex-col gap-6">
        <div className="flex items-center justify-between border-b-3 border-[var(--pop-black)] pb-3">
          <h2 className="text-base sm:text-lg font-pop-display font-black text-[var(--pop-black)] uppercase flex items-center gap-2">
            <PixelStarIcon size={18} className="text-amber-500" />
            <span>{t('profile_quests_title') || (language === 'vi' ? 'Nhiệm Vụ Hàng Ngày' : 'Daily Quests')}</span>
          </h2>
          {claimableCount > 0 && (
            <span className="bg-[var(--pop-red)] text-white text-xs font-pixel font-black px-2.5 py-1 rounded-lg border-2 border-[var(--pop-black)] shadow-[2px_2px_0_var(--pop-black)] animate-pulse">
              {claimableCount} {language === 'vi' ? 'CẦN NHẬN' : 'TO CLAIM'}
            </span>
          )}
        </div>

        {loading ? (
          <p className="text-center font-pop-accent font-black text-lg py-12 animate-pulse">{t('shop_loading') || 'Loading...'}</p>
        ) : filteredQuests.length === 0 ? (
          <div className="text-center py-12 bg-[var(--pop-cream)]/40 border-2 border-dashed border-[var(--pop-black)]/30 rounded-xl">
            <span className="text-4xl" role="img" aria-label="quests">📜</span>
            <p className="font-pop-display font-black uppercase mt-3 text-[var(--pop-black)] text-base">
              {t('profile_no_quests') || (language === 'vi' ? 'Không có nhiệm vụ nào trong mục này.' : 'No missions in this category.')}
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {filteredQuests.map((quest, index) => {
              const currentCount = quest.currentCount || 0;
              const targetCount = quest.targetCount || 1;
              const progressPercent = Math.min(100, (currentCount / targetCount) * 100);
              const isClaimed = quest.status === 'claimed';
              const isCompleted = quest.status === 'completed' || (currentCount >= targetCount && quest.status !== 'claimed');
              const isClaimable = isCompleted && !isClaimed;

              return (
                <div 
                  key={quest.questId || quest._id} 
                  className={`mission-card border-3 border-[var(--pop-black)] rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-[4px_4px_0_var(--pop-black)] transition-all hover:translate-y-[-1px] hover:shadow-[5px_5px_0_var(--pop-black)] ${
                    isClaimable
                      ? 'border-amber-400 ring-2 ring-amber-300/80 bg-gradient-to-r from-amber-50/70 via-white to-amber-50/50'
                      : isClaimed
                        ? 'bg-slate-50/80 opacity-80'
                        : 'bg-white'
                  }`}
                >
                  {/* Left Side: Number Badge & Quest Details */}
                  <div className="flex items-start gap-3.5 flex-1 w-full">
                    {/* Mission Number (#1, #2, #3...) */}
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center border-2 border-[var(--pop-black)] bg-[var(--pop-cream)] font-pixel text-sm font-black text-[var(--pop-black)] rounded-xl shadow-[2px_2px_0_var(--pop-black)]">
                      #{index + 1}
                    </div>

                    <div className="flex-1 flex flex-col gap-1.5 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 justify-between">
                        <div className="flex items-center gap-2 min-w-0">
                          <h3 className="font-pop-accent font-black text-sm sm:text-base uppercase text-[var(--pop-black)] truncate">
                            {quest.title}
                          </h3>
                          {isClaimable && (
                            <span className="bg-[var(--pop-amber)] text-[var(--pop-black)] border-2 border-[var(--pop-black)] text-[10px] font-pixel font-black px-2 py-0.5 rounded-md uppercase tracking-wider shadow-[1px_1px_0_var(--pop-black)] animate-pulse shrink-0">
                              🎁 {language === 'vi' ? 'SẴN SÀNG' : 'READY'}
                            </span>
                          )}
                          {isClaimed && (
                            <span className="bg-emerald-100 text-emerald-900 border border-emerald-500 text-[10px] font-pixel font-black px-2 py-0.5 rounded-md uppercase tracking-wider shrink-0">
                              ✓ {language === 'vi' ? 'ĐÃ NHẬN' : 'CLAIMED'}
                            </span>
                          )}
                        </div>

                        {/* Reward Tag */}
                        <span className="bg-amber-100 border-2 border-amber-400 text-amber-950 font-pop-accent font-black text-xs px-2.5 py-1 rounded-lg flex items-center gap-1.5 tabular-nums shadow-[1px_1px_0_var(--pop-black)] shrink-0">
                          <CoinIcon className="w-4 h-4 text-yellow-500 shrink-0" /> +{quest.reward?.coins || 0} Coin
                        </span>
                      </div>
                      
                      <p className="text-xs sm:text-sm text-slate-700 font-bold leading-relaxed text-left">
                        {quest.description}
                      </p>

                      {/* Progress Bar with readable labels */}
                      <div className="flex items-center gap-3 w-full mt-1.5">
                        <div className="flex-1 h-4 bg-stone-100 border-2 border-[var(--pop-black)] rounded-full overflow-hidden relative shadow-inner">
                          <div 
                            className={`h-full rounded-full transition-all duration-500 ${
                              isCompleted ? 'bg-gradient-to-r from-amber-400 to-emerald-500' : 'bg-gradient-to-r from-orange-400 to-amber-400'
                            }`}
                            style={{ width: `${progressPercent}%` }}
                          />
                          <span className="absolute inset-0 flex items-center justify-center text-[10px] font-pixel font-black text-[var(--pop-black)]">
                            {currentCount} / {targetCount} ({Math.round(progressPercent)}%)
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right Side: Action Button */}
                  <div className="w-full sm:w-auto flex justify-end shrink-0 sm:pl-2">
                    {isClaimed ? (
                      <span className="w-full sm:w-auto bg-stone-100 border-2 border-stone-300 text-stone-500 font-pixel font-black text-xs px-5 py-2.5 rounded-xl uppercase text-center min-h-[40px] flex items-center justify-center">
                        ✓ {t('profile_quest_claimed') || 'Đã nhận'}
                      </span>
                    ) : isCompleted ? (
                      <button
                        type="button"
                        onClick={() => handleClaimQuest(quest.questId || quest._id)}
                        className="w-full sm:w-auto bg-[var(--pop-amber)] text-[var(--pop-black)] font-pixel font-black border-2 border-[var(--pop-black)] shadow-[3px_3px_0_var(--pop-black)] px-5 py-2.5 rounded-xl text-xs hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[4px_4px_0_var(--pop-black)] hover:bg-yellow-300 active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all uppercase cursor-pointer min-h-[40px] flex items-center justify-center gap-1.5"
                      >
                        🎁 {t('profile_quest_claim') || 'Nhận thưởng'}
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={showLoginRequired}
                        className="w-full sm:w-auto bg-slate-100 border-2 border-slate-300 text-slate-600 font-pixel font-bold text-xs px-4 py-2.5 rounded-xl uppercase hover:bg-slate-200 transition-colors min-h-[40px] flex items-center justify-center cursor-default"
                      >
                        {t('profile_quest_locked') || 'Chưa hoàn thành'}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <CustomDialog
        isOpen={dialogState.isOpen}
        title={dialogState.title}
        message={dialogState.message}
        isConfirm={true}
        confirmText={dialogState.confirmText}
        cancelText={dialogState.cancelText}
        onConfirm={dialogState.onConfirm}
        onCancel={dialogState.onCancel || (() => setDialogState({ isOpen: false }))}
      />
    </div>
  );
}
