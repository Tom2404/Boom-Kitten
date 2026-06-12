import React, { useState, useEffect } from 'react';

const RARITY_COLORS = {
  common: 'bg-slate-200 text-slate-800',
  rare: 'bg-sky-200 text-sky-800',
  epic: 'bg-purple-200 text-purple-800',
  legendary: 'bg-yellow-200 text-yellow-800',
};

export default function Shop() {
  const [items, setItems] = useState([]);
  const [ownedItems, setOwnedItems] = useState({ ownedSkins: [], ownedEmotes: [], ownedAvatarFrames: [] });
  const [userBalance, setUserBalance] = useState({ coins: 0, gems: 0 });
  const [selectedTab, setSelectedTab] = useState('all');
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

  const handleBuyItem = async (itemId) => {
    setMessage('');
    setIsError(false);

    const token = localStorage.getItem('accessToken');
    if (!token) {
      setIsError(true);
      setMessage('Bạn cần đăng nhập để mua vật phẩm.');
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
        throw new Error(data.message || 'Giao dịch thất bại.');
      }

      setIsError(false);
      setMessage('Mua vật phẩm thành công!');
      
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

  const filteredItems = items.filter((item) => {
    if (selectedTab === 'all') return true;
    return item.type === selectedTab;
  });

  return (
    <div className="flex flex-col gap-8">
      {/* Header with Balance */}
      <div className="bg-white border-4 border-on-surface shadow-[6px_6px_0px_0px_rgba(26,28,28,1)] rounded-3xl p-6 flex flex-col md:flex-row justify-between items-center gap-6">
        <div>
          <h2 className="text-2xl font-headline font-black text-on-surface uppercase">Cửa Hàng Vật Phẩm</h2>
          <p className="text-xs font-bold text-on-surface-variant mt-1">Trang bị các loại Skin bài, Emotes và Khung Avatar cực chất.</p>
        </div>

        <div className="flex gap-4">
          <div className="bg-yellow-100 border-2 border-on-surface px-4 py-2 rounded-2xl flex items-center gap-2 shadow-[2px_2px_0px_0px_rgba(26,28,28,1)]">
            <span className="text-lg">💰</span>
            <span className="font-headline font-black text-primary">{userBalance.coins} Xu</span>
          </div>
          <div className="bg-indigo-100 border-2 border-on-surface px-4 py-2 rounded-2xl flex items-center gap-2 shadow-[2px_2px_0px_0px_rgba(26,28,28,1)]">
            <span className="text-lg">💎</span>
            <span className="font-headline font-black text-indigo-600">{userBalance.gems} Đá</span>
          </div>
        </div>
      </div>

      {/* Tabs Menu */}
      <div className="flex gap-2 flex-wrap">
        {['all', 'skin', 'emote', 'avatar_frame'].map((tab) => (
          <button
            key={tab}
            onClick={() => setSelectedTab(tab)}
            className={`px-5 py-2.5 rounded-2xl border-3 border-on-surface font-headline font-black text-xs uppercase shadow-[2.5px_2.5px_0px_0px_rgba(26,28,28,1)] transition-all
              ${selectedTab === tab 
                ? 'bg-primary text-on-primary -translate-y-0.5 shadow-[4px_4px_0px_0px_rgba(26,28,28,1)]' 
                : 'bg-white hover:bg-slate-100'}`}
          >
            {tab === 'all' && 'Tất Cả'}
            {tab === 'skin' && 'Skin Bài'}
            {tab === 'emote' && 'Biểu Cảm (Emote)'}
            {tab === 'avatar_frame' && 'Khung Avatar'}
          </button>
        ))}
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
        <p className="text-center font-headline font-black text-lg py-12 animate-pulse">Đang tải cửa hàng...</p>
      ) : filteredItems.length === 0 ? (
        <div className="text-center py-16 bg-white border-4 border-on-surface shadow-[6px_6px_0px_0px_rgba(26,28,28,1)] rounded-3xl">
          <span className="text-5xl">🛒</span>
          <p className="font-headline font-black uppercase mt-4 text-on-surface">Cửa hàng trống!</p>
          <p className="text-xs text-on-surface-variant font-bold mt-1">Không tìm thấy vật phẩm nào trong mục này.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
          {filteredItems.map((item) => {
            const owned = isItemOwned(item);
            return (
              <div 
                key={item._id}
                className="card-brutalist bg-white rounded-3xl p-5 flex flex-col justify-between gap-4 h-80"
              >
                {/* Item Type & Rarity Header */}
                <div className="flex justify-between items-center">
                  <span className="text-[9px] font-headline font-black uppercase tracking-wider text-on-surface-variant bg-surface-container-high px-2 py-0.5 rounded-full border border-on-surface">
                    {item.type === 'skin' ? 'Skin' : item.type === 'emote' ? 'Emote' : 'Khung'}
                  </span>
                  <span className={`text-[8px] font-headline font-black uppercase px-2 py-0.5 rounded-full border border-on-surface ${RARITY_COLORS[item.rarity] || 'bg-slate-200 text-slate-800'}`}>
                    {item.rarity}
                  </span>
                </div>

                {/* Main Image Illustration */}
                <div className="bg-surface-container border-2 border-on-surface rounded-2xl flex-1 flex items-center justify-center relative overflow-hidden">
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

                {/* Details Footer */}
                <div className="flex flex-col gap-1.5">
                  <h3 className="font-headline font-black text-sm uppercase text-on-surface truncate">
                    {item.name}
                  </h3>
                  
                  <div className="flex justify-between items-center mt-1">
                    {/* Pricing */}
                    <div className="flex gap-2">
                      {item.price?.coins > 0 && (
                        <span className="font-headline font-black text-primary text-xs">
                          💰 {item.price.coins}
                        </span>
                      )}
                      {item.price?.gems > 0 && (
                        <span className="font-headline font-black text-indigo-600 text-xs">
                          💎 {item.price.gems}
                        </span>
                      )}
                      {item.price?.coins <= 0 && item.price?.gems <= 0 && (
                        <span className="font-headline font-black text-emerald-600 text-xs">Miễn Phí</span>
                      )}
                    </div>

                    {/* Buy / Owned Status */}
                    {owned ? (
                      <span className="text-[10px] font-headline font-black text-emerald-600 uppercase">Đã Sở Hữu</span>
                    ) : (
                      <button
                        onClick={() => handleBuyItem(item._id)}
                        className="btn-detonator px-4 py-1.5 rounded-xl text-xs font-headline font-black uppercase shadow-[2px_2px_0px_0px_#1a1c1c] border-2"
                      >
                        Mua 🛒
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
