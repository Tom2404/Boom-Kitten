import React, { useState, useEffect } from 'react';
import { gsap } from 'gsap';
import { CoinIcon } from '../components/CoinDisplay.jsx';
import { useLanguage } from '../context/LanguageContext.jsx';
import CustomDialog from '../components/CustomDialog.jsx';
import { isOwnedItem, resolveAssetUrl } from '../utils/shopEquipment.js';

export default function Shop({ setPage }) {
  const { t, language } = useLanguage();
  const [items, setItems] = useState([]);
  const [ownedItems, setOwnedItems] = useState({ ownedItemIds: [] });
  const [userBalance, setUserBalance] = useState({ coins: 0 });
  const [selectedTab, setSelectedTab] = useState('protector');
  const [pendingItemId, setPendingItemId] = useState(null);

  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);
  const [dialogState, setDialogState] = useState({
    isOpen: false,
    title: '',
    message: '',
    confirmText: '',
    cancelText: '',
    onConfirm: null,
    onCancel: null,
  });

  const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:5000';
  const getRequestError = (data, fallbackKey) => {
    const code = data.error?.code || data.code;
    if (code) {
      const translated = t(`shop_error_${code}`);
      if (translated !== `shop_error_${code}`) return translated;
    }
    return data.error?.message || data.message || t(fallbackKey);
  };

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

        // 3. Fetch user Coin balance
        const resProfile = await fetch(`${API_URL}/api/users/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const dataProfile = await resProfile.json();
        if (resProfile.ok) {
          setUserBalance({ coins: dataProfile.coins });
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
    if (pendingItemId) return;
    setMessage('');
    setIsError(false);

    const token = localStorage.getItem('accessToken');
    if (!token) {
      setDialogState({
        isOpen: true,
        title: language === 'vi' ? '🔒 Yêu cầu đăng nhập' : '🔒 Login Required',
        message: t('loginRequiredShop') || 'Bạn cần đăng nhập để mua vật phẩm.',
        isConfirm: true,
        confirmText: language === 'vi' ? 'Đăng nhập' : 'Login',
        cancelText: language === 'vi' ? 'Hủy' : 'Cancel',
        onConfirm: () => {
          setDialogState({ isOpen: false });
          setPage('Login');
        },
        onCancel: () => setDialogState({ isOpen: false })
      });
      return;
    }

    try {
      setPendingItemId(itemId);
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
        throw new Error(getRequestError(data, 'shop_buy_fail'));
      }

      setIsError(false);
      setMessage(t('shop_buy_success'));
      
      // Refresh balance and inventory
      fetchShopData();
    } catch (err) {
      setIsError(true);
      setMessage(err.message);
    } finally {
      setPendingItemId(null);
    }
  };

  const getDescription = (item) => {
    if (item.description) return item.description;
    if (item.type === 'protector') return t('shop_desc_protector');
    if (item.type === 'avatar_frame') return t('shop_desc_avatar_frame');
    if (item.type === 'field') return t('shop_desc_field');
    return t('shop_desc_fallback');
  };

  return (
    <div className="flex flex-col gap-8 select-none text-left font-pop-body">
      {/* Header and Balance Card */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div className="text-left">
          <h1 
            className="font-pop-display font-black text-4xl md:text-6xl text-white uppercase tracking-tight relative leading-none py-1 text-stroke-black-3"
            style={{
              textShadow: '4px 4px 0px var(--pop-orange)'
            }}
          >
            {t('shop_title')}
          </h1>
          <p className="text-xs font-bold text-[var(--pop-black)]/60 mt-2 max-w-lg">
            {t('shop_desc')}
          </p>
        </div>

        {/* Top-Right Stats Card */}
        <div className="bg-white border-3 border-[var(--pop-black)] px-6 py-3.5 rounded-none flex items-center gap-6 shadow-[5px_5px_0_var(--pop-black)]">
          <div className="flex items-center gap-2">
            <CoinIcon className="w-5 h-5" />
            <span className="font-pop-accent font-black text-[var(--pop-black)] text-sm">
              {userBalance.coins.toLocaleString()}
            </span>
          </div>
          <button 
            onClick={() => {
              alert(t('shop_get_more_alert'));
            }}
            className="bg-[var(--pop-red)] border-2 border-[var(--pop-black)] text-white text-[10px] font-pop-accent font-black uppercase px-3.5 py-1.5 rounded-none shadow-[2px_2px_0_var(--pop-black)] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[3px_3px_0_var(--pop-black)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all cursor-pointer"
          >
            {t('shop_get_more')}
          </button>
        </div>
      </div>

      {/* Tabs Menu */}
      <div className="flex gap-4 flex-wrap border-b-3 border-dashed border-[var(--pop-black)]/20 pb-4">
        {[
          { id: 'protector', label: 'Protector' },
          { id: 'avatar_frame', label: 'Avatar Frame' },
          { id: 'field', label: 'Field' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setSelectedTab(tab.id)}
            className={`px-6 py-3 border-3 border-[var(--pop-black)] font-pop-accent font-black text-xs uppercase shadow-[4px_4px_0_var(--pop-black)] transition-all rounded-none cursor-pointer
              ${selectedTab === tab.id 
                ? 'bg-[var(--pop-red)] text-white translate-x-[2px] translate-y-[2px] shadow-[2px_2px_0_var(--pop-black)]' 
                : 'bg-white text-[var(--pop-black)] hover:bg-[var(--pop-cream)] hover:translate-y-[-1px]'}`}
          >
            {tab.label}
          </button>
        ))}
        <button
          disabled
          className="px-6 py-3 border-3 border-dashed border-[var(--pop-black)]/20 bg-[var(--pop-black)]/5 text-[var(--pop-black)]/40 font-pop-accent font-black text-xs uppercase rounded-none cursor-not-allowed"
        >
          {t('shop_bundles_locked')}
        </button>
      </div>

      {/* Notification Toast */}
      {message && (
        <div className={`p-4 rounded-none text-xs font-pop-accent font-bold text-center border-3 border-[var(--pop-black)] shadow-[4px_4px_0_var(--pop-black)]
          ${isError ? 'bg-[var(--pop-red)] text-white' : 'bg-[var(--pop-amber)] text-[var(--pop-black)]'}`}>
          {message}
        </div>
      )}

      {/* Item Catalog Grid */}
      {loading ? (
        <p className="text-center font-pop-accent font-black text-lg py-12 animate-pulse">{t('shop_loading')}</p>
      ) : filteredItems.length === 0 ? (
        <div className="text-center py-16 bg-white border-3 border-[var(--pop-black)] shadow-[6px_6px_0_var(--pop-black)] rounded-none w-full">
          <span className="text-5xl">🛒</span>
          <p className="font-pop-display font-black uppercase mt-4 text-[var(--pop-black)] text-xl">{t('shop_empty_title')}</p>
          <p className="text-xs text-[var(--pop-black)]/60 font-bold mt-1">{t('shop_empty_desc')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8 w-full">
          {filteredItems.map((item) => {
            const owned = isOwnedItem(item, ownedItems.ownedItemIds);
            const isLegendary = item.rarity === 'legendary';
            const isEpic = item.rarity === 'epic';
            const isHot = item.name.toLowerCase().includes('toxic') || isEpic;

            return (
              <div 
                key={item._id}
                className="shop-card relative bg-white border-3 border-[var(--pop-black)] rounded-none p-4 flex flex-col justify-between gap-4 shadow-[4px_4px_0_var(--pop-black)] h-84"
              >
                {/* Ribbon labels overlay */}
                {isLegendary && (
                  <div className="absolute top-3 left-[-8px] bg-[var(--pop-amber)] border-2 border-[var(--pop-black)] text-[8px] font-pop-accent font-black px-2 py-0.5 shadow-[2px_2px_0_var(--pop-black)] uppercase tracking-wider -rotate-6 z-10">
                    {t('shop_legendary')}
                  </div>
                )}
                {isHot && (
                  <div className="absolute top-3 right-3 bg-[var(--pop-red)] border-2 border-[var(--pop-black)] text-white text-[8px] font-pop-accent font-black px-2 py-0.5 uppercase tracking-wider z-10">
                    {t('shop_hot')}
                  </div>
                )}

                {/* Main Image Illustration */}
                <div className={`border-2 border-[var(--pop-black)] rounded-none h-36 flex items-center justify-center relative overflow-hidden
                  ${isLegendary 
                    ? 'bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-400' 
                    : isEpic 
                      ? 'bg-gradient-to-br from-rose-50 to-rose-100 border-rose-400' 
                      : 'bg-slate-50'}`}>
                  <span className="text-5xl" aria-hidden="true">
                    {item.type === 'protector' && '🂠'}
                    {item.type === 'avatar_frame' && '🖼️'}
                    {item.type === 'field' && '⚔️'}
                  </span>
                  {item.imageUrl && (
                    <img
                      src={resolveAssetUrl(item.imageUrl)}
                      alt={item.name}
                      className="absolute inset-0 h-full w-full object-cover"
                      onError={(event) => event.currentTarget.remove()}
                    />
                  )}
                </div>

                {/* Details Text Content */}
                <div className="flex-grow flex flex-col justify-start text-left">
                  <h3 className="font-pop-accent font-black text-sm uppercase text-[var(--pop-black)] truncate">
                    {item.name}
                  </h3>
                  <p className="text-[10px] text-[var(--pop-black)]/60 font-bold mt-1 line-clamp-2 leading-tight">
                    {getDescription(item)}
                  </p>
                </div>

                {/* Price and Buy Footer Row */}
                <div className="flex justify-between items-center pt-3 border-t border-[var(--pop-black)]/10">
                  {/* Pricing Display */}
                  <div className="flex gap-2">
                    {item.price?.coins > 0 ? (
                      <span className="font-pop-accent font-black text-[var(--pop-black)] text-xs flex items-center gap-1">
                        <CoinIcon className="w-4 h-4 text-yellow-500" /> {item.price.coins.toLocaleString()}
                      </span>
                    ) : (
                      <span className="font-pop-accent font-black text-emerald-600 text-xs">{t('shop_free')}</span>
                    )}
                  </div>

                  {/* Action Button */}
                  <div className="flex gap-1.5 items-center">
                    {owned && (
                      <span className="bg-emerald-50 border-2 border-emerald-400 text-emerald-700 text-[9px] font-pop-accent font-black px-2 py-0.5 rounded-none">
                        {t('shop_owned')}
                      </span>
                    )}
                    {owned ? (
                      <button
                        type="button"
                        onClick={() => setPage('Wardrobe')}
                        className="bg-[var(--pop-black)] border-2 border-[var(--pop-black)] text-white text-[9px] font-pop-accent font-black uppercase px-2.5 py-1 rounded-none shadow-[2px_2px_0_var(--pop-red)]"
                      >
                        {t('wardrobe')}
                      </button>
                    ) : (
                    <button
                      type="button"
                      disabled={Boolean(pendingItemId)}
                      onClick={() => handleBuyItem(item._id)}
                      className={`border-2 border-[var(--pop-black)] text-[9px] font-pop-accent font-black uppercase px-4 py-1.5 rounded-none shadow-[2px_2px_0_var(--pop-black)] hover:translate-x-[-1px] hover:translate-y-[-1px] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all cursor-pointer disabled:opacity-50 disabled:shadow-none
                        ${isLegendary 
                          ? 'bg-[var(--pop-amber)] text-[var(--pop-black)] hover:bg-yellow-300' 
                          : 'bg-[var(--pop-red)] text-white hover:bg-red-800'}`}
                    >
                      {pendingItemId === item._id ? t('shop_buying') : t('shop_buy')}
                    </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Weekend Chaos Bundle Promo Banner */}
      <div className="bg-[var(--pop-red)] border-3 border-[var(--pop-black)] rounded-none p-6 md:p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 shadow-[6px_6px_0_var(--pop-black)] text-white text-left relative overflow-hidden mt-6 w-full">
        <div className="flex flex-col gap-3 max-w-xl z-10">
          <h2 className="font-pop-display font-black text-2xl md:text-3xl uppercase tracking-wider text-white">
            {t('shop_promo_title')}
          </h2>
          <p className="text-xs md:text-sm font-medium text-red-100 leading-relaxed">
            {t('shop_promo_desc')}
          </p>
          <div className="inline-block self-start bg-[var(--pop-amber)] border-2 border-[var(--pop-black)] text-[var(--pop-black)] text-[9px] font-pop-accent font-black uppercase px-2 py-1 tracking-wider -rotate-2 mt-1 shadow-[1.5px_1.5px_0px_0px_var(--pop-black)]">
            {t('shop_promo_discount')}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row md:flex-col items-start md:items-end gap-3 z-10">
          <span className="font-pop-display font-black text-4xl md:text-5xl text-white tracking-tight">
            $9.99
          </span>
          <button 
            onClick={() => alert(t('shop_payment_maintenance_alert'))}
            className="bg-white border-3 border-[var(--pop-black)] text-[var(--pop-black)] font-pop-accent font-black text-xs uppercase px-6 py-3 rounded-none shadow-[3px_3px_0_var(--pop-black)] hover:translate-x-[-1px] hover:translate-y-[-1px] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all text-center cursor-pointer"
          >
            {t('shop_promo_buy')}
          </button>
        </div>
        
        {/* Decorative circle ornament background */}
        <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none transform translate-x-12 translate-y-12">
          <div className="w-48 h-48 rounded-full border-8 border-white"></div>
        </div>
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

