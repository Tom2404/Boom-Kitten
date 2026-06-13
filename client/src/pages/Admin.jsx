import React, { useState, useEffect } from 'react';
import { PRESET_AVATARS } from '../components/PlayerAvatar.jsx';

export default function Admin() {
  const [activeTab, setActiveTab] = useState('stats');
  
  // Stats state
  const [stats, setStats] = useState(null);
  
  // Shop catalog state
  const [catalog, setCatalog] = useState([]);
  const [newItemName, setNewItemName] = useState('');
  const [newItemType, setNewItemType] = useState('skin');
  const [newItemRarity, setNewItemRarity] = useState('common');
  const [newItemCoinPrice, setNewItemCoinPrice] = useState(0);
  const [newItemGemPrice, setNewItemGemPrice] = useState(0);
  const [newItemImageUrl, setNewItemImageUrl] = useState('');
  const [catalogError, setCatalogError] = useState('');
  const [catalogSuccess, setCatalogSuccess] = useState('');

  // Player control state
  const [players, setPlayers] = useState([]);
  const [playerSearch, setPlayerSearch] = useState('');
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [editCoins, setEditCoins] = useState(0);
  const [editGems, setEditGems] = useState(0);
  const [editElo, setEditElo] = useState(0);
  const [editRole, setEditRole] = useState('user');
  const [editBanned, setEditBanned] = useState(false);
  const [playerSuccess, setPlayerSuccess] = useState('');

  // Announcement state
  const [announcementText, setAnnouncementText] = useState('');
  const [announcementSuccess, setAnnouncementSuccess] = useState('');
  const [announcementError, setAnnouncementError] = useState('');

  // Quest management state
  const [quests, setQuests] = useState([]);
  const [newQuestTitle, setNewQuestTitle] = useState('');
  const [newQuestDescription, setNewQuestDescription] = useState('');
  const [newQuestActionType, setNewQuestActionType] = useState('play_game');
  const [newQuestTargetCount, setNewQuestTargetCount] = useState(1);
  const [newQuestCoinReward, setNewQuestCoinReward] = useState(0);
  const [newQuestGemReward, setNewQuestGemReward] = useState(0);
  const [newQuestIsActive, setNewQuestIsActive] = useState(true);
  const [questsError, setQuestsError] = useState('');
  const [questsSuccess, setQuestsSuccess] = useState('');
  const [editingQuestId, setEditingQuestId] = useState(null);

  const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:5000';

  // API Call helper
  const adminApiCall = async (endpoint, options = {}) => {
    const token = localStorage.getItem('accessToken');
    if (!token) return { error: 'No admin token' };

    try {
      const res = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          ...(options.headers || {}),
        },
      });
      const data = await res.json();
      return { ok: res.ok, status: res.status, data };
    } catch (err) {
      return { error: err.message };
    }
  };

  const fetchStats = async () => {
    const res = await adminApiCall('/api/admin/stats');
    if (res.ok) setStats(res.data);
  };

  const fetchCatalog = async () => {
    const res = await adminApiCall('/api/shop/items');
    if (res.ok) setCatalog(res.data);
  };

  const fetchPlayers = async (searchStr = '') => {
    const res = await adminApiCall(`/api/admin/users?search=${searchStr}`);
    if (res.ok) setPlayers(res.data);
  };

  const fetchQuests = async () => {
    const res = await adminApiCall('/api/admin/quests');
    if (res.ok) setQuests(res.data);
  };

  useEffect(() => {
    if (activeTab === 'stats') fetchStats();
    if (activeTab === 'catalog') fetchCatalog();
    if (activeTab === 'players') fetchPlayers();
    if (activeTab === 'quests') fetchQuests();
  }, [activeTab]);

  // Handle new item creation
  const handleCreateItem = async (e) => {
    e.preventDefault();
    setCatalogError('');
    setCatalogSuccess('');

    if (!newItemName) {
      setCatalogError('Tên vật phẩm không được để trống.');
      return;
    }

    const payload = {
      name: newItemName,
      type: newItemType,
      rarity: newItemRarity,
      price: { coins: Number(newItemCoinPrice), gems: Number(newItemGemPrice) },
      imageUrl: newItemImageUrl,
    };

    const res = await adminApiCall('/api/shop/items', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      setCatalogSuccess(`Thêm vật phẩm "${newItemName}" thành công!`);
      setNewItemName('');
      setNewItemCoinPrice(0);
      setNewItemGemPrice(0);
      setNewItemImageUrl('');
      fetchCatalog();
    } else {
      setCatalogError(res.data?.message || 'Có lỗi xảy ra.');
    }
  };

  // Handle item deletion
  const handleDeleteItem = async (itemId) => {
    if (!window.confirm('Bạn chắc chắn muốn xóa vật phẩm này khỏi shop?')) return;
    
    setCatalogError('');
    setCatalogSuccess('');

    const res = await adminApiCall(`/api/shop/items/${itemId}`, {
      method: 'DELETE',
    });

    if (res.ok) {
      setCatalogSuccess('Đã xóa vật phẩm thành công!');
      fetchCatalog();
    } else {
      setCatalogError(res.data?.message || 'Không thể xóa vật phẩm.');
    }
  };

  // Handle Player update
  const handleSelectPlayer = (player) => {
    setSelectedPlayer(player);
    setEditCoins(player.coins);
    setEditGems(player.gems);
    setEditElo(player.eloPoints);
    setEditRole(player.role);
    setEditBanned(player.isBanned);
    setPlayerSuccess('');
  };

  const handleUpdatePlayer = async (e) => {
    e.preventDefault();
    if (!selectedPlayer) return;

    setPlayerSuccess('');
    const res = await adminApiCall(`/api/admin/users/${selectedPlayer._id}`, {
      method: 'PUT',
      body: JSON.stringify({
        coins: Number(editCoins),
        gems: Number(editGems),
        eloPoints: Number(editElo),
        role: editRole,
        isBanned: editBanned,
      }),
    });

    if (res.ok) {
      setPlayerSuccess(`Cập nhật người chơi "${selectedPlayer.username}" thành công!`);
      fetchPlayers(playerSearch);
      setSelectedPlayer(null);
    } else {
      alert(res.data?.message || 'Cập nhật thất bại.');
    }
  };

  // Handle Broadcast Announcement
  const handleSendAnnouncement = async (e) => {
    e.preventDefault();
    setAnnouncementError('');
    setAnnouncementSuccess('');

    if (!announcementText.trim()) {
      setAnnouncementError('Nội dung thông báo không được để trống.');
      return;
    }

    const res = await adminApiCall('/api/admin/announcement', {
      method: 'POST',
      body: JSON.stringify({ text: announcementText.trim() }),
    });

    if (res.ok) {
      setAnnouncementSuccess('Đã phát thông báo thành công đến toàn bộ người chơi!');
      setAnnouncementText('');
    } else {
      setAnnouncementError(res.data?.message || 'Gửi thông báo thất bại.');
    }
  };

  // Handle Quest Creation or Update
  const handleCreateOrUpdateQuest = async (e) => {
    e.preventDefault();
    setQuestsError('');
    setQuestsSuccess('');

    if (!newQuestTitle || !newQuestDescription) {
      setQuestsError('Tiêu đề và mô tả không được để trống.');
      return;
    }

    const payload = {
      title: newQuestTitle,
      description: newQuestDescription,
      actionType: newQuestActionType,
      targetCount: Number(newQuestTargetCount),
      reward: { coins: Number(newQuestCoinReward), gems: Number(newQuestGemReward) },
      isActive: newQuestIsActive,
    };

    let res;
    if (editingQuestId) {
      res = await adminApiCall(`/api/admin/quests/${editingQuestId}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      });
    } else {
      res = await adminApiCall('/api/admin/quests', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    }

    if (res.ok) {
      setQuestsSuccess(editingQuestId ? 'Cập nhật nhiệm vụ thành công!' : 'Tạo nhiệm vụ mới thành công!');
      setNewQuestTitle('');
      setNewQuestDescription('');
      setNewQuestActionType('play_game');
      setNewQuestTargetCount(1);
      setNewQuestCoinReward(0);
      setNewQuestGemReward(0);
      setNewQuestIsActive(true);
      setEditingQuestId(null);
      fetchQuests();
    } else {
      setQuestsError(res.data?.message || 'Có lỗi xảy ra.');
    }
  };

  const handleEditQuest = (quest) => {
    setEditingQuestId(quest._id);
    setNewQuestTitle(quest.title);
    setNewQuestDescription(quest.description);
    setNewQuestActionType(quest.actionType);
    setNewQuestTargetCount(quest.targetCount);
    setNewQuestCoinReward(quest.reward?.coins ?? 0);
    setNewQuestGemReward(quest.reward?.gems ?? 0);
    setNewQuestIsActive(quest.isActive);
    setQuestsError('');
    setQuestsSuccess('');
  };

  const handleDeleteQuest = async (questId) => {
    if (!window.confirm('Bạn chắc chắn muốn xóa nhiệm vụ này?')) return;
    
    setQuestsError('');
    setQuestsSuccess('');

    const res = await adminApiCall(`/api/admin/quests/${questId}`, {
      method: 'DELETE',
    });

    if (res.ok) {
      setQuestsSuccess('Đã xóa nhiệm vụ thành công!');
      if (editingQuestId === questId) {
        setEditingQuestId(null);
        setNewQuestTitle('');
        setNewQuestDescription('');
        setNewQuestActionType('play_game');
        setNewQuestTargetCount(1);
        setNewQuestCoinReward(0);
        setNewQuestGemReward(0);
        setNewQuestIsActive(true);
      }
      fetchQuests();
    } else {
      setQuestsError(res.data?.message || 'Không thể xóa nhiệm vụ.');
    }
  };

  return (
    <div className="bg-white border-4 border-on-surface shadow-[8px_8px_0px_0px_rgba(26,28,28,1)] rounded-3xl p-6 md:p-8 flex flex-col gap-8">
      {/* Title */}
      <div>
        <h2 className="text-3xl font-headline font-black text-on-surface uppercase">Bảng Điều Khiển Admin 🛠️</h2>
        <p className="text-xs font-bold text-on-surface-variant mt-1">
          Quản lý người chơi, điều phối vật phẩm shop, gửi thông báo hệ thống và xem thống kê.
        </p>
      </div>

      {/* Tabs list */}
      <div className="flex gap-2 flex-wrap border-b-4 border-on-surface pb-4">
        {[
          { id: 'stats', label: 'Thống Kê 📊' },
          { id: 'catalog', label: 'Quản Lý Shop 🛒' },
          { id: 'players', label: 'Quản Lý Người Chơi 👥' },
          { id: 'quests', label: 'Quản Lý Nhiệm Vụ 🎯' },
          { id: 'announcement', label: 'Thông Báo Live 📢' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-xl border-2 border-on-surface font-headline font-black text-xs uppercase shadow-[2px_2px_0px_0px_rgba(26,28,28,1)] transition-all
              ${activeTab === tab.id 
                ? 'bg-primary text-on-primary -translate-y-0.5 shadow-[3.5px_3.5px_0px_0px_rgba(26,28,28,1)]' 
                : 'bg-surface hover:bg-slate-100'}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* TAB CONTENT: STATS */}
      {activeTab === 'stats' && (
        <div className="flex flex-col gap-6">
          <h3 className="text-lg font-headline font-black text-on-surface uppercase">Số liệu hệ thống</h3>
          
          {stats ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="bg-blue-100 border-3 border-on-surface rounded-2xl p-5 shadow-[4px_4px_0px_0px_#1a1c1c]">
                <span className="text-[10px] font-headline font-black text-blue-800 uppercase block">Tổng tài khoản</span>
                <span className="font-headline font-black text-3xl text-slate-950 mt-1 block">{stats.totalUsers}</span>
              </div>
              
              <div className="bg-rose-100 border-3 border-on-surface rounded-2xl p-5 shadow-[4px_4px_0px_0px_#1a1c1c]">
                <span className="text-[10px] font-headline font-black text-rose-800 uppercase block">Số tài khoản bị khóa</span>
                <span className="font-headline font-black text-3xl text-slate-950 mt-1 block">{stats.bannedUsers}</span>
              </div>
              
              <div className="bg-emerald-100 border-3 border-on-surface rounded-2xl p-5 shadow-[4px_4px_0px_0px_#1a1c1c]">
                <span className="text-[10px] font-headline font-black text-emerald-800 uppercase block">Vật phẩm trong Shop</span>
                <span className="font-headline font-black text-3xl text-slate-950 mt-1 block">{stats.totalItems}</span>
              </div>

              <div className="bg-indigo-100 border-3 border-on-surface rounded-2xl p-5 shadow-[4px_4px_0px_0px_#1a1c1c]">
                <span className="text-[10px] font-headline font-black text-indigo-800 uppercase block">Số phòng chơi trực tuyến</span>
                <span className="font-headline font-black text-3xl text-slate-950 mt-1 block">{stats.activeRoomsCount}</span>
              </div>

              <div className="bg-yellow-100 border-3 border-on-surface rounded-2xl p-5 shadow-[4px_4px_0px_0px_#1a1c1c] sm:col-span-2">
                <span className="text-[10px] font-headline font-black text-yellow-800 uppercase block">Doanh thu Shop tích lũy</span>
                <div className="flex gap-6 mt-1">
                  <span className="font-headline font-black text-2xl text-slate-950">💰 {stats.coinRevenue} Xu</span>
                  <span className="font-headline font-black text-2xl text-slate-950">💎 {stats.gemRevenue} Đá</span>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-center py-6 font-bold text-on-surface-variant animate-pulse">Đang tải thống kê...</p>
          )}
        </div>
      )}

      {/* TAB CONTENT: CATALOG */}
      {activeTab === 'catalog' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Create form */}
          <div className="lg:col-span-1 bg-surface border-3 border-on-surface rounded-2xl p-6 shadow-[4px_4px_0px_0px_#1a1c1c]">
            <h3 className="text-md font-headline font-black text-on-surface uppercase border-b-2 border-on-surface pb-2 mb-4">
              Thêm Vật Phẩm Shop
            </h3>

            {catalogError && (
              <div className="bg-rose-100 text-rose-700 border-2 border-on-surface p-3 text-xs font-bold rounded-xl mb-4 text-center">
                {catalogError}
              </div>
            )}
            {catalogSuccess && (
              <div className="bg-emerald-100 text-emerald-700 border-2 border-on-surface p-3 text-xs font-bold rounded-xl mb-4 text-center">
                {catalogSuccess}
              </div>
            )}

            <form onSubmit={handleCreateItem} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-headline font-black text-on-surface uppercase">Tên vật phẩm</label>
                <input
                  type="text"
                  placeholder="Ví dụ: Mèo Hoàng Gia"
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  className="bg-white border-2 border-on-surface rounded-xl px-3 py-2 text-xs text-on-surface font-bold focus:outline-none"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-headline font-black text-on-surface uppercase">Loại vật phẩm</label>
                <select
                  value={newItemType}
                  onChange={(e) => setNewItemType(e.target.value)}
                  className="bg-white border-2 border-on-surface rounded-xl px-3 py-2 text-xs text-on-surface font-bold focus:outline-none"
                >
                  <option value="skin">Skin Bài (Skin)</option>
                  <option value="emote">Biểu Cảm (Emote)</option>
                  <option value="avatar_frame">Khung Avatar (Frame)</option>
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-headline font-black text-on-surface uppercase">Độ hiếm</label>
                <select
                  value={newItemRarity}
                  onChange={(e) => setNewItemRarity(e.target.value)}
                  className="bg-white border-2 border-on-surface rounded-xl px-3 py-2 text-xs text-on-surface font-bold focus:outline-none"
                >
                  <option value="common">Thường (Common)</option>
                  <option value="rare">Hiếm (Rare)</option>
                  <option value="epic">Sử Thi (Epic)</option>
                  <option value="legendary">Huyền Thoại (Legendary)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-headline font-black text-on-surface uppercase">Giá Xu (Coins)</label>
                  <input
                    type="number"
                    min="0"
                    value={newItemCoinPrice}
                    onChange={(e) => setNewItemCoinPrice(e.target.value)}
                    className="bg-white border-2 border-on-surface rounded-xl px-3 py-2 text-xs text-on-surface font-bold focus:outline-none"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-headline font-black text-on-surface uppercase">Giá Đá (Gems)</label>
                  <input
                    type="number"
                    min="0"
                    value={newItemGemPrice}
                    onChange={(e) => setNewItemGemPrice(e.target.value)}
                    className="bg-white border-2 border-on-surface rounded-xl px-3 py-2 text-xs text-on-surface font-bold focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-headline font-black text-on-surface uppercase">URL Hình ảnh (tùy chọn)</label>
                <input
                  type="text"
                  placeholder="https://example.com/item.png"
                  value={newItemImageUrl}
                  onChange={(e) => setNewItemImageUrl(e.target.value)}
                  className="bg-white border-2 border-on-surface rounded-xl px-3 py-2 text-xs text-on-surface font-bold focus:outline-none"
                />
              </div>

              <button type="submit" className="btn-detonator w-full mt-2 py-3 rounded-xl font-headline font-black uppercase text-xs">
                Xác Nhận Thêm ➕
              </button>
            </form>
          </div>

          {/* List items */}
          <div className="lg:col-span-2 flex flex-col gap-4">
            <h3 className="text-md font-headline font-black text-on-surface uppercase">Danh sách vật phẩm hiện tại</h3>
            
            <div className="flex flex-col gap-3 max-h-[500px] overflow-y-auto pr-2">
              {catalog.map((item) => (
                <div
                  key={item._id}
                  className="border-2 border-on-surface rounded-2xl p-4 flex justify-between items-center bg-surface shadow-[2px_2px_0px_0px_#1a1c1c]"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">
                      {item.type === 'skin' ? '🃏' : item.type === 'emote' ? '🎭' : '🖼️'}
                    </span>
                    <div>
                      <h4 className="font-headline font-black text-xs uppercase text-on-surface">{item.name}</h4>
                      <p className="text-[10px] text-on-surface-variant font-bold">
                        Độ hiếm: <strong className="uppercase">{item.rarity}</strong> • Loại: {item.type}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      {item.price?.coins > 0 && <span className="font-headline font-black text-xs text-primary block">💰 {item.price.coins}</span>}
                      {item.price?.gems > 0 && <span className="font-headline font-black text-xs text-indigo-600 block">💎 {item.price.gems}</span>}
                      {item.price?.coins <= 0 && item.price?.gems <= 0 && <span className="font-headline font-black text-xs text-emerald-600 block">Free</span>}
                    </div>
                    <button
                      onClick={() => handleDeleteItem(item._id)}
                      className="bg-secondary text-on-error border-2 border-on-surface shadow-[1.5px_1.5px_0px_0px_#1a1c1c] px-3 py-1 text-[10px] font-headline font-black rounded-lg hover:scale-105 active:scale-95 transition-all uppercase"
                    >
                      Xóa 🗑️
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: PLAYERS */}
      {activeTab === 'players' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* List and search */}
          <div className="lg:col-span-2 flex flex-col gap-4">
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Tìm người chơi theo tên hoặc email..."
                value={playerSearch}
                onChange={(e) => {
                  setPlayerSearch(e.target.value);
                  fetchPlayers(e.target.value);
                }}
                className="flex-1 bg-surface border-3 border-on-surface rounded-xl px-4 py-2 text-xs text-on-surface font-bold focus:outline-none"
              />
            </div>

            <div className="flex flex-col gap-3 max-h-[500px] overflow-y-auto pr-2">
              {players.map((p) => (
                <div
                  key={p._id}
                  onClick={() => handleSelectPlayer(p)}
                  className={`border-2 border-on-surface rounded-2xl p-4 flex justify-between items-center cursor-pointer transition-all shadow-[2px_2px_0px_0px_#1a1c1c]
                    ${selectedPlayer?._id === p._id ? 'bg-primary-fixed border-primary translate-x-1' : 'bg-surface hover:bg-slate-50'}`}
                >
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full flex items-center justify-center text-sm font-headline font-black bg-white border border-on-surface overflow-hidden">
                      {p.avatar && PRESET_AVATARS[p.avatar] ? (
                        <span>{PRESET_AVATARS[p.avatar]}</span>
                      ) : p.avatar ? (
                        <img src={p.avatar} className="h-full w-full object-cover" />
                      ) : (
                        <span>{p.username.slice(0,2).toUpperCase()}</span>
                      )}
                    </div>
                    <div>
                      <h4 className="font-headline font-black text-xs uppercase text-on-surface flex items-center gap-2">
                        {p.username}
                        {p.role === 'admin' && <span className="bg-yellow-400 text-[8px] px-1.5 py-0.5 rounded border border-on-surface">Admin</span>}
                        {p.isBanned && <span className="bg-secondary text-on-error text-[8px] px-1.5 py-0.5 rounded border border-on-surface">Banned</span>}
                      </h4>
                      <p className="text-[10px] text-on-surface-variant font-bold">
                        {p.email} • ELO: {p.eloPoints}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4 font-headline font-black text-xs text-on-surface-variant">
                    <span>💰 {p.coins}</span>
                    <span>💎 {p.gems}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Edit form */}
          <div className="lg:col-span-1">
            {selectedPlayer ? (
              <form onSubmit={handleUpdatePlayer} className="bg-surface border-3 border-on-surface rounded-2xl p-6 shadow-[4px_4px_0px_0px_#1a1c1c] flex flex-col gap-4">
                <h3 className="text-md font-headline font-black text-on-surface uppercase border-b-2 border-on-surface pb-2">
                  Điều chỉnh: {selectedPlayer.username}
                </h3>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-headline font-black text-on-surface uppercase">Số Xu (Coins)</label>
                  <input
                    type="number"
                    value={editCoins}
                    onChange={(e) => setEditCoins(e.target.value)}
                    className="bg-white border-2 border-on-surface rounded-xl px-3 py-2 text-xs text-on-surface font-bold focus:outline-none"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-headline font-black text-on-surface uppercase">Đá Quý (Gems)</label>
                  <input
                    type="number"
                    value={editGems}
                    onChange={(e) => setEditGems(e.target.value)}
                    className="bg-white border-2 border-on-surface rounded-xl px-3 py-2 text-xs text-on-surface font-bold focus:outline-none"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-headline font-black text-on-surface uppercase">Điểm ELO</label>
                  <input
                    type="number"
                    value={editElo}
                    onChange={(e) => setEditElo(e.target.value)}
                    className="bg-white border-2 border-on-surface rounded-xl px-3 py-2 text-xs text-on-surface font-bold focus:outline-none"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-headline font-black text-on-surface uppercase">Chức vụ (Role)</label>
                  <select
                    value={editRole}
                    onChange={(e) => setEditRole(e.target.value)}
                    className="bg-white border-2 border-on-surface rounded-xl px-3 py-2 text-xs text-on-surface font-bold focus:outline-none"
                  >
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>

                <div className="flex items-center gap-2 py-2">
                  <input
                    type="checkbox"
                    id="ban-checkbox"
                    checked={editBanned}
                    onChange={(e) => setEditBanned(e.target.checked)}
                    className="h-4 w-4 border-2 border-on-surface rounded focus:ring-0"
                  />
                  <label htmlFor="ban-checkbox" className="text-xs font-headline font-black text-on-surface uppercase cursor-pointer">
                    Khóa tài khoản (Ban player)
                  </label>
                </div>

                <button type="submit" className="btn-detonator w-full mt-2 py-3 rounded-xl font-headline font-black uppercase text-xs">
                  Cập Nhật 💾
                </button>
              </form>
            ) : (
              <div className="border-3 border-dashed border-on-surface-variant rounded-2xl p-6 text-center text-xs font-bold text-on-surface-variant bg-surface">
                {playerSuccess ? (
                  <p className="text-emerald-700 font-headline font-black uppercase">{playerSuccess}</p>
                ) : (
                  <p>Chọn một người chơi từ danh sách để tùy chỉnh thông số hoặc khóa tài khoản.</p>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB CONTENT: QUESTS */}
      {activeTab === 'quests' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Create/Edit form */}
          <div className="lg:col-span-1 bg-surface border-3 border-on-surface rounded-2xl p-6 shadow-[4px_4px_0px_0px_#1a1c1c]">
            <h3 className="text-md font-headline font-black text-on-surface uppercase border-b-2 border-on-surface pb-2 mb-4">
              {editingQuestId ? 'Cập Nhật Nhiệm Vụ 🎯' : 'Thêm Nhiệm Vụ Mới 🎯'}
            </h3>

            {questsError && (
              <div className="bg-rose-100 text-rose-700 border-2 border-on-surface p-3 text-xs font-bold rounded-xl mb-4 text-center">
                {questsError}
              </div>
            )}
            {questsSuccess && (
              <div className="bg-emerald-100 text-emerald-700 border-2 border-on-surface p-3 text-xs font-bold rounded-xl mb-4 text-center">
                {questsSuccess}
              </div>
            )}

            <form onSubmit={handleCreateOrUpdateQuest} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-headline font-black text-on-surface uppercase">Tiêu đề nhiệm vụ</label>
                <input
                  type="text"
                  placeholder="Ví dụ: Kẻ Hủy Diệt Nope"
                  value={newQuestTitle}
                  onChange={(e) => setNewQuestTitle(e.target.value)}
                  className="bg-white border-2 border-on-surface rounded-xl px-3 py-2 text-xs text-on-surface font-bold focus:outline-none"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-headline font-black text-on-surface uppercase">Mô tả nhiệm vụ</label>
                <input
                  type="text"
                  placeholder="Ví dụ: Sử dụng thành công lá bài Nope 3 lần"
                  value={newQuestDescription}
                  onChange={(e) => setNewQuestDescription(e.target.value)}
                  className="bg-white border-2 border-on-surface rounded-xl px-3 py-2 text-xs text-on-surface font-bold focus:outline-none"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-headline font-black text-on-surface uppercase">Loại hành động</label>
                <select
                  value={newQuestActionType}
                  onChange={(e) => setNewQuestActionType(e.target.value)}
                  className="bg-white border-2 border-on-surface rounded-xl px-3 py-2 text-xs text-on-surface font-bold focus:outline-none"
                >
                  <option value="play_game">Chơi game (play_game)</option>
                  <option value="win_game">Thắng game (win_game)</option>
                  <option value="nope_card">Sử dụng Nope (nope_card)</option>
                  <option value="defuse_kitten">Gỡ bom (defuse_kitten)</option>
                  <option value="steal_card">Cướp bài bằng combo 2 (steal_card)</option>
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-headline font-black text-on-surface uppercase">Số lượng mục tiêu</label>
                <input
                  type="number"
                  min="1"
                  value={newQuestTargetCount}
                  onChange={(e) => setNewQuestTargetCount(e.target.value)}
                  className="bg-white border-2 border-on-surface rounded-xl px-3 py-2 text-xs text-on-surface font-bold focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-headline font-black text-on-surface uppercase">Thưởng Xu (Coins)</label>
                  <input
                    type="number"
                    min="0"
                    value={newQuestCoinReward}
                    onChange={(e) => setNewQuestCoinReward(e.target.value)}
                    className="bg-white border-2 border-on-surface rounded-xl px-3 py-2 text-xs text-on-surface font-bold focus:outline-none"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-headline font-black text-on-surface uppercase">Thưởng Đá (Gems)</label>
                  <input
                    type="number"
                    min="0"
                    value={newQuestGemReward}
                    onChange={(e) => setNewQuestGemReward(e.target.value)}
                    className="bg-white border-2 border-on-surface rounded-xl px-3 py-2 text-xs text-on-surface font-bold focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 py-2">
                <input
                  type="checkbox"
                  id="quest-active-checkbox"
                  checked={newQuestIsActive}
                  onChange={(e) => setNewQuestIsActive(e.target.checked)}
                  className="h-4 w-4 border-2 border-on-surface rounded focus:ring-0"
                />
                <label htmlFor="quest-active-checkbox" className="text-xs font-headline font-black text-on-surface uppercase cursor-pointer">
                  Kích hoạt nhiệm vụ này
                </label>
              </div>

              <div className="flex gap-2">
                {editingQuestId && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingQuestId(null);
                      setNewQuestTitle('');
                      setNewQuestDescription('');
                      setNewQuestActionType('play_game');
                      setNewQuestTargetCount(1);
                      setNewQuestCoinReward(0);
                      setNewQuestGemReward(0);
                      setNewQuestIsActive(true);
                    }}
                    className="flex-1 bg-surface border-2 border-on-surface text-on-surface font-headline font-black text-xs uppercase py-3 rounded-xl hover:bg-slate-100"
                  >
                    Hủy sửa
                  </button>
                )}
                <button type="submit" className="btn-detonator flex-grow py-3 rounded-xl font-headline font-black uppercase text-xs">
                  {editingQuestId ? 'Cập Nhật 💾' : 'Xác Nhận Thêm ➕'}
                </button>
              </div>
            </form>
          </div>

          {/* List quests */}
          <div className="lg:col-span-2 flex flex-col gap-4">
            <h3 className="text-md font-headline font-black text-on-surface uppercase">Danh sách nhiệm vụ hiện tại</h3>
            
            <div className="flex flex-col gap-3 max-h-[500px] overflow-y-auto pr-2">
              {quests.map((quest) => (
                <div
                  key={quest._id}
                  className="border-2 border-on-surface rounded-2xl p-4 flex justify-between items-center bg-surface shadow-[2px_2px_0px_0px_#1a1c1c]"
                >
                  <div className="flex items-start gap-3">
                    <span className="text-3xl mt-1">🎯</span>
                    <div>
                      <h4 className="font-headline font-black text-xs uppercase text-on-surface flex items-center gap-2">
                        {quest.title}
                        {!quest.isActive && (
                          <span className="bg-rose-100 text-rose-700 text-[8px] px-1.5 py-0.5 rounded border border-on-surface">Tạm khóa</span>
                        )}
                      </h4>
                      <p className="text-xs text-on-surface-variant font-medium mt-0.5">{quest.description}</p>
                      <p className="text-[10px] text-on-surface-variant font-bold mt-1">
                        Hành động: <strong className="text-indigo-600">{quest.actionType}</strong> • Mục tiêu: <strong>{quest.targetCount}</strong>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      {quest.reward?.coins > 0 && <span className="font-headline font-black text-xs text-primary block">💰 +{quest.reward.coins}</span>}
                      {quest.reward?.gems > 0 && <span className="font-headline font-black text-xs text-indigo-600 block">💎 +{quest.reward.gems}</span>}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEditQuest(quest)}
                        className="bg-yellow-400 text-slate-950 border-2 border-on-surface shadow-[1.5px_1.5px_0px_0px_#1a1c1c] px-3 py-1 text-[10px] font-headline font-black rounded-lg hover:scale-105 active:scale-95 transition-all uppercase"
                      >
                        Sửa ✏️
                      </button>
                      <button
                        onClick={() => handleDeleteQuest(quest._id)}
                        className="bg-secondary text-on-error border-2 border-on-surface shadow-[1.5px_1.5px_0px_0px_#1a1c1c] px-3 py-1 text-[10px] font-headline font-black rounded-lg hover:scale-105 active:scale-95 transition-all uppercase"
                      >
                        Xóa 🗑️
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: ANNOUNCEMENT */}
      {activeTab === 'announcement' && (
        <form onSubmit={handleSendAnnouncement} className="flex flex-col gap-6 max-w-xl">
          <h3 className="text-lg font-headline font-black text-on-surface uppercase">Thông Báo Toàn Máy Chủ</h3>
          
          {announcementSuccess && (
            <div className="bg-emerald-100 text-emerald-700 border-2 border-on-surface p-4 text-xs font-headline font-black rounded-xl text-center">
              {announcementSuccess}
            </div>
          )}
          {announcementError && (
            <div className="bg-rose-100 text-rose-700 border-2 border-on-surface p-4 text-xs font-headline font-black rounded-xl text-center">
              {announcementError}
            </div>
          )}

          <div className="flex flex-col gap-2">
            <label className="text-xs font-headline font-black text-on-surface uppercase">Nội dung cảnh báo / thông báo</label>
            <textarea
              rows="4"
              placeholder="Nhập thông báo... (Ví dụ: Hệ thống sẽ bảo trì trong 10 phút nữa hoặc Cập nhật Skin mới trong shop!)"
              value={announcementText}
              onChange={(e) => setAnnouncementText(e.target.value)}
              className="bg-surface border-3 border-on-surface rounded-2xl p-4 text-xs text-on-surface font-bold focus:outline-none focus:bg-white shadow-[3px_3px_0px_0px_rgba(26,28,28,1)]"
            />
          </div>

          <button type="submit" className="btn-detonator w-48 py-3 rounded-2xl font-headline font-black uppercase text-xs flex items-center justify-center gap-2">
            Phát Tin 📢
          </button>
        </form>
      )}
    </div>
  );
}
