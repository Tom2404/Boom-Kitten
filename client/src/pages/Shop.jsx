import React, { useState, useEffect } from 'react';
import { gsap } from 'gsap';
import { CoinIcon } from '../components/CoinDisplay.jsx';
import {
  PixelCardBackIcon,
  PixelFrameIcon,
  PixelFieldIcon,
  PixelWardrobeIcon,
  PixelStarIcon,
} from '../components/PixelIcons.jsx';
import { useLanguage } from '../context/LanguageContext.jsx';
import CustomDialog from '../components/CustomDialog.jsx';
import { getAssetTransformStyle, isOwnedItem, resolveAssetUrl } from '../utils/shopEquipment.js';

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
      // ponytail: Stagger animation for shop-card appearance on tab switch or load
      gsap.fromTo('.shop-card', 
        { opacity: 0, y: 24, scale: 0.96 },
        { opacity: 1, y: 0, scale: 1, duration: 0.4, stagger: 0.06, ease: 'back.out(1.2)' }
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

  const tabs = [
    { id: 'protector', label: 'Protector', Icon: PixelCardBackIcon },
    { id: 'avatar_frame', label: 'Avatar Frame', Icon: PixelFrameIcon },
    { id: 'field', label: 'Field', Icon: PixelFieldIcon },
  ];

  return (
    <div className="flex flex-col gap-6 select-none text-left font-pop-body max-w-7xl mx-auto px-2 sm:px-4 py-3">
      {/* Header and Balance Card */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div className="text-left">
          <h1 
            className="font-pop-display font-black text-4xl md:text-6xl text-white uppercase tracking-tight relative leading-none py-1 text-stroke-black-3"
            style={{
              textShadow: '4px 4px 0px var(--pop-orange)'
            }}
          >
            {t('shop_title')}
          </h1>
          <p className="text-xs sm:text-sm font-bold text-slate-800 mt-2 max-w-xl leading-relaxed">
            {t('shop_desc')}
          </p>
        </div>

        {/* Top-Right HUD Battle Badge for Coin Balance */}
        <div className="bg-white border-3 border-[var(--pop-black)] px-5 py-3 rounded-2xl flex items-center gap-4 shadow-[4px_4px_0_var(--pop-black)]">
          <div className="flex items-center gap-2">
            <CoinIcon className="w-6 h-6 shrink-0" />
            <div className="flex flex-col">
              <span className="font-pixel text-[10px] font-black uppercase text-slate-600 leading-none">
                {language === 'vi' ? 'Số dư Xu' : 'Coin Balance'}
              </span>
              <span className="font-pop-accent font-black text-[var(--pop-black)] text-base sm:text-lg tabular-nums leading-snug">
                {userBalance.coins.toLocaleString()}
              </span>
            </div>
          </div>
          <button 
            type="button"
            onClick={() => {
              setDialogState({
                isOpen: true,
                title: t('shop_get_more') || 'Nạp thêm Xu',
                message: t('shop_get_more_alert'),
                isConfirm: false,
                confirmText: 'ĐÃ HIỂU',
                onConfirm: () => setDialogState({ isOpen: false }),
                onCancel: () => setDialogState({ isOpen: false }),
              });
            }}
            className="bg-[var(--pop-red)] border-2 border-[var(--pop-black)] text-white text-xs font-pop-accent font-black uppercase px-4 py-2 rounded-xl shadow-[2px_2px_0_var(--pop-black)] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[3px_3px_0_var(--pop-black)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all cursor-pointer min-h-[38px]"
          >
            {t('shop_get_more')}
          </button>
        </div>
      </div>

      {/* Tabs Menu */}
      <div className="flex gap-3 flex-wrap border-b-3 border-dashed border-[var(--pop-black)]/20 pb-4">
        {tabs.map((tab) => {
          const active = selectedTab === tab.id;
          const TabIcon = tab.Icon;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setSelectedTab(tab.id)}
              className={`px-5 py-2.5 border-3 border-[var(--pop-black)] font-pop-accent font-black text-xs sm:text-sm uppercase shadow-[3px_3px_0_var(--pop-black)] transition-all rounded-xl cursor-pointer flex items-center gap-2
                ${active 
                  ? 'bg-[var(--pop-red)] text-white translate-x-[2px] translate-y-[2px] shadow-[1px_1px_0_var(--pop-black)]' 
                  : 'bg-white text-[var(--pop-black)] hover:bg-[var(--pop-cream)] hover:translate-y-[-1px]'}`}
            >
              <TabIcon size={16} aria-hidden="true" />
              <span>{tab.label}</span>
            </button>
          );
        })}
        <button
          type="button"
          disabled
          className="px-5 py-2.5 border-3 border-dashed border-[var(--pop-black)]/30 bg-[var(--pop-black)]/5 text-slate-500 font-pop-accent font-black text-xs sm:text-sm uppercase rounded-xl cursor-not-allowed"
        >
          {t('shop_bundles_locked')}
        </button>
      </div>

      {/* Notification Toast */}
      {message && (
        <div className={`p-3.5 rounded-xl text-xs sm:text-sm font-pop-accent font-bold text-center border-3 border-[var(--pop-black)] shadow-[4px_4px_0_var(--pop-black)]
          ${isError ? 'bg-[var(--pop-red)] text-white' : 'bg-amber-300 text-neutral-950'}`}>
          {message}
        </div>
      )}

      {/* Item Catalog Grid */}
      {loading ? (
        <p className="text-center font-pop-accent font-black text-lg py-12 animate-pulse">{t('shop_loading')}</p>
      ) : filteredItems.length === 0 ? (
        <div className="text-center py-16 bg-white border-3 border-[var(--pop-black)] shadow-[6px_6px_0_var(--pop-black)] rounded-2xl w-full">
          <span className="text-5xl" role="img" aria-label="cart">🛒</span>
          <p className="font-pop-display font-black uppercase mt-4 text-[var(--pop-black)] text-xl">{t('shop_empty_title')}</p>
          <p className="text-xs sm:text-sm text-slate-700 font-bold mt-1">{t('shop_empty_desc')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 w-full">
          {filteredItems.map((item) => {
            const owned = isOwnedItem(item, ownedItems.ownedItemIds);
            const isLegendary = item.rarity === 'legendary';
            const isEpic = item.rarity === 'epic';
            const isHot = item.name?.toLowerCase().includes('toxic') || isEpic;

            return (
              <div 
                key={item._id}
                className={`shop-card relative bg-white border-3 border-[var(--pop-black)] rounded-2xl p-4 flex flex-col justify-between gap-3 shadow-[4px_4px_0_var(--pop-black)] min-h-[23rem] h-auto transition-all hover:translate-y-[-2px] hover:shadow-[6px_6px_0_var(--pop-black)] ${
                  isLegendary ? 'border-amber-400 ring-2 ring-amber-300/60' : isEpic ? 'border-purple-400 ring-2 ring-purple-300/50' : ''
                }`}
              >
                {/* Ribbon labels overlay */}
                {isLegendary && (
                  <div className="absolute top-3 -left-2 bg-[var(--pop-amber)] border-2 border-[var(--pop-black)] text-[10px] font-pop-accent font-black px-2.5 py-0.5 shadow-[2px_2px_0_var(--pop-black)] uppercase tracking-wider -rotate-6 z-10 rounded-md">
                    🌟 {t('shop_legendary')}
                  </div>
                )}
                {isHot && (
                  <div className="absolute top-3 right-3 bg-[var(--pop-red)] border-2 border-[var(--pop-black)] text-white text-[10px] font-pop-accent font-black px-2.5 py-0.5 uppercase tracking-wider z-10 rounded-md shadow-[2px_2px_0_var(--pop-black)]">
                    🔥 {t('shop_hot')}
                  </div>
                )}

                {/* Main Image Illustration with Pedestal Framing */}
                <div className={`border-2 border-[var(--pop-black)] rounded-xl h-44 flex items-center justify-center relative overflow-hidden p-2.5
                  ${isLegendary 
                    ? 'bg-gradient-to-b from-amber-50 via-yellow-100/60 to-amber-200/40' 
                    : isEpic 
                      ? 'bg-gradient-to-b from-purple-50 via-fuchsia-100/60 to-purple-200/40' 
                      : 'bg-gradient-to-b from-slate-50 to-slate-100'}`}>
                  {item.type === 'protector' ? (
                    <div
                      className="relative h-full max-h-40 rounded-lg overflow-hidden border-2 border-[var(--pop-black)] shadow-[3px_3px_0_var(--pop-black)] bg-white flex items-center justify-center"
                      style={{ aspectRatio: '0.716 / 1' }}
                    >
                      <span className="text-4xl select-none" aria-hidden="true">🂠</span>
                      {item.imageUrl && (
                        <img
                          src={resolveAssetUrl(item.imageUrl)}
                          alt={item.name}
                          className="absolute inset-0 h-full w-full object-cover select-none"
                          style={getAssetTransformStyle(item.assetTransform)}
                          onError={(event) => event.currentTarget.remove()}
                        />
                      )}
                    </div>
                  ) : item.type === 'avatar_frame' ? (
                    <div className="relative h-full max-h-36 aspect-square rounded-full overflow-hidden border-2 border-[var(--pop-black)] shadow-[3px_3px_0_var(--pop-black)] bg-white flex items-center justify-center p-1">
                      {item.imageUrl ? (
                        <img
                          src={resolveAssetUrl(item.imageUrl)}
                          alt={item.name}
                          className="h-full w-full object-contain select-none"
                          style={getAssetTransformStyle(item.assetTransform)}
                          onError={(event) => event.currentTarget.remove()}
                        />
                      ) : (
                        <span className="text-4xl" aria-hidden="true">🖼️</span>
                      )}
                    </div>
                  ) : (
                    /* Field or other types */
                    <div className="relative h-full max-h-32 aspect-video rounded-lg overflow-hidden border-2 border-[var(--pop-black)] shadow-[3px_3px_0_var(--pop-black)] bg-slate-900 flex items-center justify-center">
                      <span className="text-4xl select-none" aria-hidden="true">⚔️</span>
                      {item.imageUrl && (
                        <img
                          src={resolveAssetUrl(item.imageUrl)}
                          alt={item.name}
                          className="absolute inset-0 h-full w-full object-cover select-none"
                          style={getAssetTransformStyle(item.assetTransform)}
                          onError={(event) => event.currentTarget.remove()}
                        />
                      )}
                    </div>
                  )}
                </div>

                {/* Details Text Content */}
                <div className="flex-grow flex flex-col justify-start text-left">
                  <h3 className="font-pop-accent font-black text-sm sm:text-base uppercase text-[var(--pop-black)] truncate">
                    {item.name}
                  </h3>
                  <p className="text-xs text-slate-700 font-bold mt-1 line-clamp-2 leading-relaxed">
                    {getDescription(item)}
                  </p>
                </div>

                {/* Price and Buy Footer Row */}
                <div className="flex justify-between items-center pt-3 border-t border-[var(--pop-black)]/15">
                  {/* Pricing Display */}
                  <div className="flex items-center gap-1.5">
                    {item.price?.coins > 0 ? (
                      <span className="font-pop-accent font-black text-[var(--pop-black)] text-sm sm:text-base flex items-center gap-1 tabular-nums">
                        <CoinIcon className="w-4 h-4 text-yellow-500 shrink-0" /> {item.price.coins.toLocaleString()}
                      </span>
                    ) : (
                      <span className="font-pop-accent font-black text-emerald-700 text-xs sm:text-sm uppercase tracking-wider">{t('shop_free')}</span>
                    )}
                  </div>

                  {/* Action Button */}
                  <div className="flex gap-2 items-center">
                    {owned && (
                      <span className="bg-emerald-100 border-2 border-emerald-500 text-emerald-900 text-[10px] font-pop-accent font-black px-2.5 py-1 rounded-md uppercase tracking-wider">
                        {t('shop_owned')}
                      </span>
                    )}
                    {owned ? (
                      <button
                        type="button"
                        onClick={() => setPage('Wardrobe')}
                        className="bg-[var(--pop-black)] border-2 border-[var(--pop-black)] text-white text-xs font-pop-accent font-black uppercase px-3.5 py-1.5 rounded-lg shadow-[2px_2px_0_var(--pop-red)] hover:bg-neutral-800 hover:scale-105 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer min-h-[36px]"
                      >
                        <PixelWardrobeIcon size={14} className="text-white" />
                        <span>{t('wardrobe')}</span>
                      </button>
                    ) : (
                    <button
                      type="button"
                      disabled={Boolean(pendingItemId)}
                      onClick={() => handleBuyItem(item._id)}
                      className={`border-2 border-[var(--pop-black)] text-xs font-pop-accent font-black uppercase px-4 py-1.5 rounded-lg shadow-[2px_2px_0_var(--pop-black)] hover:translate-x-[-1px] hover:translate-y-[-1px] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all cursor-pointer disabled:opacity-50 disabled:shadow-none min-h-[36px]
                        ${isLegendary 
                          ? 'bg-[var(--pop-amber)] text-[var(--pop-black)] hover:bg-yellow-300' 
                          : 'bg-[var(--pop-red)] text-white hover:bg-red-700'}`}
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
      <div className="bg-[var(--pop-red)] border-3 border-[var(--pop-black)] rounded-2xl p-6 md:p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 shadow-[6px_6px_0_var(--pop-black)] text-white text-left relative overflow-hidden mt-4 w-full">
        <div className="flex flex-col gap-2.5 max-w-xl z-10">
          <h2 className="font-pop-display font-black text-2xl md:text-3xl uppercase tracking-wider text-white leading-tight">
            {t('shop_promo_title')}
          </h2>
          <p className="text-xs md:text-sm font-medium text-red-50 leading-relaxed">
            {t('shop_promo_desc')}
          </p>
          <div className="inline-block self-start bg-[var(--pop-amber)] border-2 border-[var(--pop-black)] text-[var(--pop-black)] text-[10px] font-pop-accent font-black uppercase px-2.5 py-1 tracking-wider -rotate-2 mt-1 shadow-[2px_2px_0_var(--pop-black)] rounded-md">
            {t('shop_promo_discount')}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row md:flex-col items-start md:items-end gap-3 z-10 shrink-0">
          <span className="font-pop-display font-black text-4xl md:text-5xl text-white tracking-tight tabular-nums">
            $9.99
          </span>
          <button 
            type="button"
            onClick={() => {
              setDialogState({
                isOpen: true,
                title: t('shop_promo_title') || 'Thông báo gói ưu đãi',
                message: t('shop_payment_maintenance_alert'),
                isConfirm: false,
                confirmText: 'ĐÃ HIỂU',
                onConfirm: () => setDialogState({ isOpen: false }),
                onCancel: () => setDialogState({ isOpen: false }),
              });
            }}
            className="bg-white border-3 border-[var(--pop-black)] text-[var(--pop-black)] font-pop-accent font-black text-xs uppercase px-6 py-3 rounded-xl shadow-[3px_3px_0_var(--pop-black)] hover:translate-x-[-1px] hover:translate-y-[-1px] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all text-center cursor-pointer min-h-[42px]"
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
        isConfirm={dialogState.isConfirm !== undefined ? dialogState.isConfirm : true}
        confirmText={dialogState.confirmText}
        cancelText={dialogState.cancelText}
        onConfirm={dialogState.onConfirm}
        onCancel={dialogState.onCancel || (() => setDialogState({ isOpen: false }))}
      />
    </div>
  );
}
