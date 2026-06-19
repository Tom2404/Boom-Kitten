import React, { useState, useEffect } from 'react';
import { gsap } from 'gsap';
import { CoinIcon, GemIcon } from '../components/CoinDisplay.jsx';
import { useLanguage } from '../context/LanguageContext.jsx';

const RARITY_COLORS = {
  common: 'bg-slate-200 text-slate-800',
  rare: 'bg-sky-200 text-sky-800',
  epic: 'bg-purple-200 text-purple-800',
  legendary: 'bg-yellow-200 text-yellow-800',
};

export default function Shop() {
  const { t } = useLanguage();
  const [items, setItems] = useState([]);
  const [ownedItems, setOwnedItems] = useState({ ownedSkins: [], ownedEmotes: [], ownedAvatarFrames: [] });
  const [userBalance, setUserBalance] = useState({ coins: 0, gems: 0 });
  const [selectedTab, setSelectedTab] = useState('skin');

  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);

  const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:5000';

  const fetchShopData = async () => {
    const token = localStorage.getItem('accessToken');
    
    try {
      // 1. Fetch available shop items
      const resItems = await fetch(`${API_URL}/api/shop/items`);
      const dataItems = await resItems.json();
      if (resItems.ok) setItems(dataItems);

      if (token) {
        // 2. Fetch owned items
        const resOwned = await fetch(`${API_URL}/api/shop/owned`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const dataOwned = await resOwned.json();
        if (resOwned.ok) setOwnedItems(dataOwned);

        // 3. Fetch user balance (profile coins/gems)
        const resProfile = await fetch(`${API_URL}/api/users/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const dataProfile = await resProfile.json();
        if (resProfile.ok) {
          setUserBalance({ coins: dataProfile.coins, gems: dataProfile.gems });
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShopData();
  }, []);

  const filteredItems = items.filter((item) => {
    if (selectedTab === 'all') return true;
    return item.type === selectedTab;
  });

  useEffect(() => {
    if (!loading && filteredItems.length > 0) {
      gsap.fromTo('.shop-card', 
        { opacity: 0, y: 30, scale: 0.95 },
        { opacity: 1, y: 0, scale: 1, duration: 0.5, stagger: 0.08, ease: 'back.out(1.2)' }
      );
    }
  }, [filteredItems, loading, selectedTab]);

  const handleBuyItem = async (itemId) => {
    setMessage('');
    setIsError(false);

    const token = localStorage.getItem('accessToken');
    if (!token) {
      setIsError(true);
      setMessage(t('shop_login_required'));
      return;
    }

    try {
      const res = await fetch(`${API_URL}/api/shop/buy`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ itemId }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || t('shop_buy_fail'));
      }

      setIsError(false);
      setMessage(t('shop_buy_success'));
      
      // Refresh balance and inventory
      fetchShopData();
    } catch (err) {
      setIsError(true);
      setMessage(err.message);
    }
  };

  const isItemOwned = (item) => {
    if (item.type === 'skin') return ownedItems.ownedSkins.includes(item.name);
    if (item.type === 'emote') return ownedItems.ownedEmotes.includes(item.name);
    if (item.type === 'avatar_frame') return ownedItems.ownedAvatarFrames.includes(item.name);
    return false;
  };

  const getDescription = (item) => {
    if (item.description) return item.description;
    if (item.type === 'skin') {
      if (item.name.toLowerCase().includes('toxic')) return 'Glows in the dark. Might mutate your fingers.';
      if (item.name.toLowerCase().includes('basic')) return 'Boring. Reliable. Doesn\'t explode (often).';
      if (item.name.toLowerCase().includes('king')) return 'Bow down to the meow-jesty. Shiny foil effect included.';
      return 'Cool custom card sleeve. Might not explode.';
    }
    if (item.type === 'emote') return 'Show your emotions to your opponents.';
    if (item.type === 'avatar_frame') return 'Premium frame to show off your ELO rank.';
    return 'Special item for Kitten Arena.';
  };

  return (
    <div className="flex flex-col gap-8 select-none text-left">
      {/* Header and Balance Card */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div className="text-left">
          <h1 
            className="font-headline font-black text-4xl md:text-6xl text-on-surface uppercase tracking-tight relative leading-none py-1"
            style={{
              WebkitTextStroke: '2.5px #1a1c1c',
              textShadow: '4px 4px 0px #ff5722'
            }}
          >
            {t('shop_title')}
          </h1>
          <p className="text-xs font-bold text-on-surface-variant mt-2 max-w-lg">
            {t('shop_desc')}
          </p>
        </div>

        {/* Top-Right Stats Card */}
        <div className="bg-white border-3 border-on-surface px-6 py-3.5 rounded-xl flex items-center gap-6 shadow-[4.5px_4.5px_0px_0px_#1a1c1c]">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-full border-2 border-on-surface flex items-center justify-center bg-yellow-400 text-[10px] font-headline font-black text-on-surface">
              $
            </div>
            <span className="font-headline font-black text-on-surface text-sm">
              {userBalance.coins.toLocaleString()}
            </span>
          </div>
          <div className="h-6 w-0.5 bg-slate-300"></div>
          <div className="flex items-center gap-2">
            <GemIcon className="w-5 h-5 text-indigo-600" />
            <span className="font-headline font-black text-on-surface text-sm">
              {userBalance.gems.toLocaleString()}
            </span>
          </div>
          <button 
            onClick={() => {
              alert(t('shop_get_more_alert'));
            }}
            className="bg-[#9e1b1b] border-2 border-on-surface text-white text-[10px] font-headline font-black uppercase px-3.5 py-1.5 rounded-lg shadow-[2px_2px_0px_0px_#1a1c1c] hover:scale-105 active:scale-95 transition-all"
          >
            {t('shop_get_more')}
          </button>
        </div>
      </div>

      {/* Tabs Menu */}
      <div className="flex gap-4 flex-wrap border-b-3 border-dashed border-on-surface-variant pb-4">
        {[
          { id: 'skin', label: t('shop_tab_skins') },
          { id: 'avatar_frame', label: t('shop_tab_avatars') },
          { id: 'emote', label: t('shop_tab_emotes') },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setSelectedTab(tab.id)}
            className={`px-6 py-3 border-3 border-on-surface font-headline font-black text-xs uppercase shadow-[4px_4px_0px_0px_#1a1c1c] transition-all rounded-lg
              ${selectedTab === tab.id 
                ? 'bg-[#9e1b1b] text-white -translate-y-0.5 shadow-[5px_5px_0px_0px_#1a1c1c]' 
                : 'bg-white text-on-surface hover:bg-slate-50'}`}
          >
            {tab.label}
          </button>
        ))}
        <button
          disabled
          className="px-6 py-3 border-3 border-dashed border-slate-300 bg-slate-50 text-slate-400 font-headline font-black text-xs uppercase rounded-lg cursor-not-allowed"
        >
          {t('shop_bundles_locked')}
        </button>
      </div>

      {/* Notification Toast */}
      {message && (
        <div className={`p-4 rounded-2xl text-xs font-headline font-black text-center border-3 border-on-surface shadow-[4px_4px_0px_0px_rgba(26,28,28,1)]
          ${isError ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'}`}>
          {message}
        </div>
      )}

      {/* Item Catalog Grid */}
      {loading ? (
        <p className="text-center font-headline font-black text-lg py-12 animate-pulse">{t('shop_loading')}</p>
      ) : filteredItems.length === 0 ? (
        <div className="text-center py-16 bg-white border-4 border-on-surface shadow-[6px_6px_0px_0px_rgba(26,28,28,1)] rounded-3xl w-full">
          <span className="text-5xl">🛒</span>
          <p className="font-headline font-black uppercase mt-4 text-on-surface">{t('shop_empty_title')}</p>
          <p className="text-xs text-on-surface-variant font-bold mt-1">{t('shop_empty_desc')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8 w-full">
          {filteredItems.map((item) => {
            const owned = isItemOwned(item);
            const isLegendary = item.rarity === 'legendary';
            const isEpic = item.rarity === 'epic';
            const isHot = item.name.toLowerCase().includes('toxic') || isEpic;

            return (
              <div 
                key={item._id}
                className="shop-card relative bg-white border-3 border-on-surface rounded-xl p-4 flex flex-col justify-between gap-4 shadow-[4px_4px_0px_0px_#1a1c1c] h-84"
              >
                {/* Ribbon labels overlay */}
                {isLegendary && (
                  <div className="absolute top-3.5 left-[-6px] bg-yellow-400 border-2 border-on-surface text-[8px] font-headline font-black px-2 py-0.5 shadow-[1.5px_1.5px_0px_0px_#1a1c1c] uppercase tracking-wider -rotate-6 z-10">
                    {t('shop_legendary')}
                  </div>
                )}
                {isHot && (
                  <div className="absolute top-3.5 right-3.5 bg-rose-600 border-2 border-on-surface text-white text-[8px] font-headline font-black px-2 py-0.5 uppercase tracking-wider z-10">
                    {t('shop_hot')}
                  </div>
                )}

                {/* Main Image Illustration */}
                <div className={`border-2 border-on-surface rounded-lg h-36 flex items-center justify-center relative overflow-hidden
                  ${isLegendary 
                    ? 'bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-400' 
                    : isEpic 
                      ? 'bg-gradient-to-br from-rose-50 to-rose-100 border-rose-400' 
                      : 'bg-slate-50'}`}>
                  {item.imageUrl ? (
                    <img src={item.imageUrl} alt={item.name} className="h-full w-full object-cover" />
                  ) : (
                    <span className="text-5xl">
                      {item.type === 'skin' && '🃏'}
                      {item.type === 'emote' && '🎭'}
                      {item.type === 'avatar_frame' && '🖼️'}
                    </span>
                  )}
                </div>

                {/* Details Text Content */}
                <div className="flex-grow flex flex-col justify-start text-left">
                  <h3 className="font-headline font-black text-sm uppercase text-on-surface truncate">
                    {item.name}
                  </h3>
                  <p className="text-[10px] text-slate-500 font-bold mt-1 line-clamp-2 leading-tight">
                    {getDescription(item)}
                  </p>
                </div>

                {/* Price and Buy Footer Row */}
                <div className="flex justify-between items-center pt-3 border-t border-slate-100">
                  {/* Pricing Display */}
                  <div className="flex gap-2">
                    {item.price?.gems > 0 ? (
                      <span className="font-headline font-black text-on-surface text-xs flex items-center gap-1">
                        <GemIcon className="w-4 h-4 text-indigo-600" /> {item.price.gems.toLocaleString()}
                      </span>
                    ) : item.price?.coins > 0 ? (
                      <span className="font-headline font-black text-on-surface text-xs flex items-center gap-1">
                        <CoinIcon className="w-4 h-4 text-yellow-500" /> {item.price.coins.toLocaleString()}
                      </span>
                    ) : (
                      <span className="font-headline font-black text-emerald-600 text-xs">FREE</span>
                    )}
                  </div>

                  {/* Action Button */}
                  {owned ? (
                    <div className="flex gap-1.5 items-center">
                      <span className="bg-emerald-50 border-2 border-emerald-400 text-emerald-700 text-[9px] font-headline font-black px-2 py-0.5 rounded">
                        {t('shop_owned')}
                      </span>
                      <button 
                        disabled
                        className="bg-white border-2 border-slate-200 text-[9px] font-headline font-black uppercase px-2.5 py-1 rounded cursor-not-allowed text-slate-400"
                      >
                        {t('shop_equip')}
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleBuyItem(item._id)}
                      className={`border-2 border-on-surface text-[9px] font-headline font-black uppercase px-4 py-1.5 rounded shadow-[2px_2px_0px_0px_#1a1c1c] hover:scale-105 active:scale-95 transition-all
                        ${isLegendary 
                          ? 'bg-yellow-400 text-slate-950 hover:bg-yellow-300' 
                          : 'bg-[#9e1b1b] text-white hover:bg-red-800'}`}
                    >
                      {t('shop_buy')}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Weekend Chaos Bundle Promo Banner */}
      <div className="bg-[#9e1b1b] border-3 border-on-surface rounded-xl p-6 md:p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 shadow-[6px_6px_0px_0px_#1a1c1c] text-white text-left relative overflow-hidden mt-6 w-full">
        <div className="flex flex-col gap-3 max-w-xl z-10">
          <h2 className="font-headline font-black text-2xl md:text-3xl uppercase tracking-wider text-white">
            {t('shop_promo_title')}
          </h2>
          <p className="text-xs md:text-sm font-medium text-red-100 leading-relaxed">
            {t('shop_promo_desc')}
          </p>
          <div className="inline-block self-start bg-yellow-400 border-2 border-on-surface text-slate-950 text-[9px] font-headline font-black uppercase px-2 py-1 tracking-wider -rotate-2 mt-1 shadow-[1.5px_1.5px_0px_0px_#1a1c1c]">
            {t('shop_promo_discount')}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row md:flex-col items-start md:items-end gap-3 z-10">
          <span className="font-headline font-black text-4xl md:text-5xl text-white tracking-tight">
            $9.99
          </span>
          <button 
            onClick={() => alert(t('shop_payment_maintenance_alert'))}
            className="bg-white border-3 border-on-surface text-slate-950 font-headline font-black text-xs uppercase px-6 py-3 rounded-lg shadow-[3px_3px_0px_0px_#1a1c1c] hover:scale-105 active:scale-95 transition-all text-center"
          >
            {t('shop_promo_buy')}
          </button>
        </div>
        
        {/* Decorative circle ornament background */}
        <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none transform translate-x-12 translate-y-12">
          <div className="w-48 h-48 rounded-full border-8 border-white"></div>
        </div>
      </div>
    </div>
  );
}

