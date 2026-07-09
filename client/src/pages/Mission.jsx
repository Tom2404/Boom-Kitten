import React, { useState, useEffect } from 'react';
import { CoinIcon, GemIcon } from '../components/CoinDisplay.jsx';
import { useLanguage } from '../context/LanguageContext.jsx';
import CustomDialog from '../components/CustomDialog.jsx';
import { gsap } from 'gsap';

export default function Mission({ setPage }) {
  const { t, language } = useLanguage();
  const [quests, setQuests] = useState([]);
  const [loading, setLoading] = useState(true);
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

  useEffect(() => {
    if (!loading && quests.length > 0) {
      gsap.fromTo('.mission-card', 
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.4, stagger: 0.08, ease: 'power2.out' }
      );
    }
  }, [quests, loading]);

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

  return (
    <div className="flex flex-col gap-8 select-none text-left font-pop-body">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div className="text-left">
          <h1 
            className="font-pop-display font-black text-4xl md:text-6xl text-white uppercase tracking-tight relative leading-none py-1 text-stroke-black-3"
            style={{
              textShadow: '4px 4px 0px var(--pop-orange)'
            }}
          >
            {t('mission') || (language === 'vi' ? 'Nhiệm Vụ' : 'Missions')}
          </h1>
          <p className="text-xs font-bold text-[var(--pop-black)]/60 mt-2 max-w-lg">
            {language === 'vi' 
              ? 'Hoàn thành các nhiệm vụ hàng ngày để nhận nhiều Gold Coins và Pink Coins!' 
              : 'Complete daily missions to earn Gold Coins and Pink Coins!'}
          </p>
        </div>
      </div>

      {/* Guest Notice */}
      {!isAuthenticated && (
        <div className="p-4 rounded-none text-xs font-pop-accent font-bold text-center border-3 border-[var(--pop-black)] bg-[var(--pop-amber)] text-[var(--pop-black)] shadow-[4px_4px_0_var(--pop-black)] uppercase tracking-wider animate-pulse-slow">
          {language === 'vi' 
            ? '🔒 Đăng nhập để thực hiện nhiệm vụ và nhận thưởng!' 
            : '🔒 Log in to complete missions and claim rewards!'}
        </div>
      )}

      {/* Quests List Container */}
      <div className="bg-white border-3 border-[var(--pop-black)] shadow-[5px_5px_0_var(--pop-black)] rounded-none p-6 flex flex-col gap-6">
        <h3 className="text-lg font-pop-display font-black text-[var(--pop-black)] uppercase border-b-3 border-[var(--pop-black)] pb-2">
          {t('profile_quests_title') || (language === 'vi' ? 'Nhiệm Vụ Hàng Ngày' : 'Daily Quests')}
        </h3>

        {loading ? (
          <p className="text-center font-pop-accent font-black text-lg py-12 animate-pulse">{t('shop_loading') || 'Loading...'}</p>
        ) : quests.length === 0 ? (
          <p className="text-center text-sm font-bold text-[var(--pop-black)]/60 py-8">
            {t('profile_no_quests') || (language === 'vi' ? 'Không có nhiệm vụ nào.' : 'No missions.')}
          </p>
        ) : (
          <div className="flex flex-col gap-4">
            {quests.map((quest) => {
              const currentCount = quest.currentCount || 0;
              const targetCount = quest.targetCount || 1;
              const progressPercent = Math.min(100, (currentCount / targetCount) * 100);
              const isClaimed = quest.status === 'claimed';
              const isCompleted = quest.status === 'completed' || (currentCount >= targetCount && quest.status !== 'claimed');

              return (
                <div 
                  key={quest.questId || quest._id} 
                  className="mission-card border-2 border-[var(--pop-black)] rounded-none p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-[2px_2px_0_var(--pop-black)] bg-white"
                >
                  <div className="flex-1 flex flex-col gap-1.5 w-full">
                    <div className="flex justify-between items-center">
                      <span className="font-pop-accent font-black text-sm uppercase text-[var(--pop-black)]">
                        {quest.title}
                      </span>
                      <span className="text-[10px] font-pop-accent font-black text-indigo-600 bg-indigo-50 border-2 border-indigo-200 px-2 py-0.5 rounded-none flex items-center gap-1">
                        +{quest.reward?.coins || 0} {t('shop_gold') || 'Gold'} {quest.reward?.gems > 0 && `• +${quest.reward.gems} ${t('shop_pink') || 'Pink'}`}
                      </span>
                    </div>
                    
                    <p className="text-[11px] text-[var(--pop-black)]/60 font-bold text-left">
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
                          {currentCount} / {targetCount}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="w-full sm:w-auto flex justify-end">
                    {isClaimed ? (
                      <span className="bg-slate-100 border-2 border-slate-300 text-slate-400 font-pop-accent font-black text-[10px] px-4 py-2 rounded-none uppercase">
                        {t('profile_quest_claimed') || 'Claimed'}
                      </span>
                    ) : isCompleted ? (
                      <button
                        onClick={() => handleClaimQuest(quest.questId || quest._id)}
                        className="w-full sm:w-auto bg-[var(--pop-amber)] text-[var(--pop-black)] font-pop-accent font-black border-2 border-[var(--pop-black)] shadow-[2px_2px_0px_0px_var(--pop-black)] px-4 py-2 rounded-none text-[10px] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[3px_3px_0_var(--pop-black)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all uppercase cursor-pointer"
                      >
                        {t('profile_quest_claim') || 'Claim'}
                      </button>
                    ) : (
                      <button
                        onClick={showLoginRequired}
                        className="w-full sm:w-auto bg-white border-2 border-slate-300 text-[var(--pop-black)]/40 font-pop-accent font-black text-[10px] px-4 py-2 rounded-none uppercase hover:bg-slate-50 transition-colors"
                      >
                        {t('profile_quest_locked') || 'Incomplete'}
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
