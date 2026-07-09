import React, { useState, useEffect } from 'react';
import { PRESET_AVATARS } from '../components/PlayerAvatar.jsx';
import { CoinIcon, GemIcon } from '../components/CoinDisplay.jsx';
import { useLanguage } from '../context/LanguageContext.jsx';
import CustomDialog from '../components/CustomDialog.jsx';

export default function Admin({ setPage }) {
  const { t, language } = useLanguage();
  const [activeTab, setActiveTab] = useState('stats');
  
  // Overview stats state
  const [stats, setStats] = useState(null);
  
  // Shop catalog state
  const [catalog, setCatalog] = useState([]);
  const [newItemName, setNewItemName] = useState('');
  const [newItemDescription, setNewItemDescription] = useState('');
  const [newItemType, setNewItemType] = useState('skin');
  const [newItemRarity, setNewItemRarity] = useState('common');
  const [newItemCoinPrice, setNewItemCoinPrice] = useState(0);
  const [newItemGemPrice, setNewItemGemPrice] = useState(0);
  const [newItemImageUrl, setNewItemImageUrl] = useState('');
  const [newItemIsActive, setNewItemIsActive] = useState(true);
  const [newItemSortOrder, setNewItemSortOrder] = useState(0);
  
  const [editingItem, setEditingItem] = useState(null); // For Shop item edit modal
  
  const [catalogError, setCatalogError] = useState('');
  const [catalogSuccess, setCatalogSuccess] = useState('');

  // Player control state
  const [players, setPlayers] = useState([]);
  const [playerSearch, setPlayerSearch] = useState('');
  const [playerRoleFilter, setPlayerRoleFilter] = useState('');
  const [playerStatusFilter, setPlayerStatusFilter] = useState('');
  const [playerPage, setPlayerPage] = useState(1);
  const [playerTotalPages, setPlayerTotalPages] = useState(1);
  const [playerLimit] = useState(10);
  
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  
  // Adjustment modals state
  const [currencyModal, setCurrencyModal] = useState({ isOpen: false, currency: 'coin', operation: 'add', amount: 0, reason: '' });
  const [eloModal, setEloModal] = useState({ isOpen: false, elo: 1000, reason: '' });
  const [statusModal, setStatusModal] = useState({ isOpen: false, status: 'banned', reason: '' });
  const [roleModal, setRoleModal] = useState({ isOpen: false, role: 'user' });

  const [playerSuccess, setPlayerSuccess] = useState('');
  const [playerError, setPlayerError] = useState('');

  // Announcement state
  const [announcementTitle, setAnnouncementTitle] = useState('Thông Báo Hệ Thống');
  const [announcementText, setAnnouncementText] = useState('');
  const [announcementType, setAnnouncementType] = useState('info');
  const [announcementDuration, setAnnouncementDuration] = useState(30);
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

  // Season tools state
  const [seasonConfirmText, setSeasonConfirmText] = useState('');
  const [seasonReason, setSeasonReason] = useState('');
  const [seasonSuccess, setSeasonSuccess] = useState('');
  const [seasonError, setSeasonError] = useState('');
  const [seasonResetData, setSeasonResetData] = useState(null);

  // Audit and Transaction Logs state
  const [logs, setLogs] = useState([]);
  const [logTypeTab, setLogTypeTab] = useState('transaction'); // 'transaction' or 'audit'
  const [logPage, setLogPage] = useState(1);
  const [logTotalPages, setLogTotalPages] = useState(1);
  const [logLimit] = useState(15);
  const [logFilterUserId, setLogFilterUserId] = useState('');
  const [logFilterType, setLogFilterType] = useState('');
  const [logFilterCurrency, setLogFilterCurrency] = useState('');

  const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:5000';

  // Decode JWT role and check authorization
  const token = localStorage.getItem('accessToken');
  let isAdmin = false;
  try {
    if (token) {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const payload = JSON.parse(window.atob(base64));
      isAdmin = payload.role === 'admin';
    }
  } catch (e) {
    isAdmin = false;
  }

  // API Call helper
  const adminApiCall = async (endpoint, options = {}) => {
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
    const res = await adminApiCall('/api/admin/overview');
    if (res.ok) setStats(res.data.data);
  };

  const fetchCatalog = async () => {
    const res = await adminApiCall('/api/shop/items');
    if (res.ok) setCatalog(res.data);
  };

  const fetchPlayers = async () => {
    const query = `?page=${playerPage}&limit=${playerLimit}&search=${playerSearch}&role=${playerRoleFilter}&status=${playerStatusFilter}`;
    const res = await adminApiCall(`/api/admin/users${query}`);
    if (res.ok && res.data.success) {
      setPlayers(res.data.data.users);
      setPlayerTotalPages(res.data.data.pagination.totalPages);
    }
  };

  const fetchQuests = async () => {
    const res = await adminApiCall('/api/admin/quests');
    if (res.ok) setQuests(res.data);
  };

  const fetchLogs = async () => {
    const query = `?page=${logPage}&limit=${logLimit}&logType=${logTypeTab}&userId=${logFilterUserId}&type=${logFilterType}&currency=${logFilterCurrency}`;
    const res = await adminApiCall(`/api/admin/transactions${query}`);
    if (res.ok && res.data.success) {
      setLogs(res.data.data.logs);
      setLogTotalPages(res.data.data.pagination.totalPages);
    }
  };

  useEffect(() => {
    if (!isAdmin) return;
    if (activeTab === 'stats') fetchStats();
    if (activeTab === 'catalog') fetchCatalog();
    if (activeTab === 'players') fetchPlayers();
    if (activeTab === 'quests') fetchQuests();
    if (activeTab === 'logs') fetchLogs();
  }, [activeTab, playerPage, playerSearch, playerRoleFilter, playerStatusFilter, logPage, logTypeTab, logFilterUserId, logFilterType, logFilterCurrency]);

  if (!isAdmin) {
    return (
      <div className="max-w-md mx-auto my-12 bg-white border-3 border-[var(--pop-black)] shadow-[8px_8px_0_var(--pop-black)] p-8 flex flex-col gap-6 text-center">
        <h2 className="text-3xl font-pop-display font-black text-[var(--pop-red)] uppercase">ACCESS DENIED</h2>
        <p className="font-pop-body font-bold text-[var(--pop-black)]/70">
          Bạn không có quyền truy cập trang quản trị này. Vui lòng đăng nhập bằng tài khoản Admin.
        </p>
        <button
          onClick={() => setPage('Login')}
          className="py-3 bg-[var(--pop-red)] text-white font-pop-accent font-black uppercase text-xs border-3 border-[var(--pop-black)] shadow-[4px_4px_0_var(--pop-black)] active:translate-y-0.5 active:translate-x-0.5 cursor-pointer"
        >
          Đăng nhập Admin
        </button>
      </div>
    );
  }

  // Handle new item creation
  const handleCreateItem = async (e) => {
    e.preventDefault();
    setCatalogError('');
    setCatalogSuccess('');

    if (!newItemName || !newItemImageUrl) {
      setCatalogError('Tên vật phẩm và hình ảnh là bắt buộc.');
      return;
    }

    const payload = {
      name: newItemName,
      description: newItemDescription,
      type: newItemType,
      rarity: newItemRarity,
      price: { coins: Number(newItemCoinPrice), gems: Number(newItemGemPrice) },
      imageUrl: newItemImageUrl,
      isActive: newItemIsActive,
      sortOrder: Number(newItemSortOrder)
    };

    const res = await adminApiCall('/api/shop/items', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      setCatalogSuccess(`Thêm vật phẩm "${newItemName}" thành công!`);
      setNewItemName('');
      setNewItemDescription('');
      setNewItemCoinPrice(0);
      setNewItemGemPrice(0);
      setNewItemImageUrl('');
      setNewItemSortOrder(0);
      fetchCatalog();
    } else {
      setCatalogError(res.data?.message || 'Có lỗi xảy ra.');
    }
  };

  // Handle edit item update
  const handleUpdateItem = async (e) => {
    e.preventDefault();
    if (!editingItem) return;

    setCatalogError('');
    setCatalogSuccess('');

    const res = await adminApiCall(`/api/shop/items/${editingItem._id}`, {
      method: 'PUT',
      body: JSON.stringify({
        name: editingItem.name,
        description: editingItem.description,
        type: editingItem.type,
        rarity: editingItem.rarity,
        price: { coins: Number(editingItem.priceCoins), gems: Number(editingItem.priceGems) },
        imageUrl: editingItem.imageUrl,
        isActive: editingItem.isActive,
        sortOrder: Number(editingItem.sortOrder),
      }),
    });

    if (res.ok) {
      setCatalogSuccess(`Cập nhật vật phẩm thành công!`);
      setEditingItem(null);
      fetchCatalog();
    } else {
      setCatalogError(res.data?.message || 'Không thể cập nhật vật phẩm.');
    }
  };

  // Toggle item active status
  const handleToggleItemStatus = async (item) => {
    const res = await adminApiCall(`/api/shop/items/${item._id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ isActive: !item.isActive })
    });
    if (res.ok) {
      setCatalogSuccess(`Đã thay đổi trạng thái hoạt động của "${item.name}"`);
      fetchCatalog();
    } else {
      setCatalogError(res.data?.message || 'Thay đổi trạng thái thất bại.');
    }
  };

  // Handle item deletion
  const handleDeleteItem = async (itemId) => {
    if (!window.confirm('Bạn chắc chắn muốn xóa vĩnh viễn vật phẩm này? Hãy dùng chức năng Tắt (Disable) nếu vật phẩm đã có người chơi mua.')) return;
    
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

  // Handle Player update modals
  const handleOpenCurrencyModal = (player, currency) => {
    setSelectedPlayer(player);
    setCurrencyModal({ isOpen: true, currency, operation: 'add', amount: 0, reason: '' });
    setPlayerSuccess('');
    setPlayerError('');
  };

  const handleOpenEloModal = (player) => {
    setSelectedPlayer(player);
    setEloModal({ isOpen: true, elo: player.eloPoints || 1000, reason: '' });
    setPlayerSuccess('');
    setPlayerError('');
  };

  const handleOpenStatusModal = (player) => {
    setSelectedPlayer(player);
    setStatusModal({ isOpen: true, status: player.isBanned ? 'active' : 'banned', reason: '' });
    setPlayerSuccess('');
    setPlayerError('');
  };

  const handleOpenRoleModal = (player) => {
    setSelectedPlayer(player);
    setRoleModal({ isOpen: true, role: player.role === 'admin' ? 'user' : 'admin' });
    setPlayerSuccess('');
    setPlayerError('');
  };

  const submitCurrencyAdjustment = async (e) => {
    e.preventDefault();
    if (!selectedPlayer) return;

    if (!currencyModal.reason.trim()) {
      setPlayerError('Lý do điều chỉnh số dư là bắt buộc.');
      return;
    }

    const res = await adminApiCall(`/api/admin/users/${selectedPlayer._id}/currency`, {
      method: 'PATCH',
      body: JSON.stringify({
        currency: currencyModal.currency,
        amount: Number(currencyModal.amount),
        operation: currencyModal.operation,
        reason: currencyModal.reason,
      }),
    });

    if (res.ok) {
      setPlayerSuccess(`Điều chỉnh số dư của "${selectedPlayer.username}" thành công!`);
      setCurrencyModal({ ...currencyModal, isOpen: false });
      fetchPlayers();
    } else {
      setPlayerError(res.data?.message || 'Thao tác thất bại.');
    }
  };

  const submitEloAdjustment = async (e) => {
    e.preventDefault();
    if (!selectedPlayer) return;

    if (!eloModal.reason.trim()) {
      setPlayerError('Lý do điều chỉnh ELO là bắt buộc.');
      return;
    }

    const res = await adminApiCall(`/api/admin/users/${selectedPlayer._id}/elo`, {
      method: 'PATCH',
      body: JSON.stringify({
        elo: Number(eloModal.elo),
        reason: eloModal.reason,
      }),
    });

    if (res.ok) {
      setPlayerSuccess(`Cập nhật điểm ELO của "${selectedPlayer.username}" thành công!`);
      setEloModal({ ...eloModal, isOpen: false });
      fetchPlayers();
    } else {
      setPlayerError(res.data?.message || 'Thao tác thất bại.');
    }
  };

  const submitStatusChange = async (e) => {
    e.preventDefault();
    if (!selectedPlayer) return;

    const res = await adminApiCall(`/api/admin/users/${selectedPlayer._id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({
        status: statusModal.status,
        reason: statusModal.reason,
      }),
    });

    if (res.ok) {
      setPlayerSuccess(`Cập nhật trạng thái người chơi thành công!`);
      setStatusModal({ ...statusModal, isOpen: false });
      fetchPlayers();
    } else {
      setPlayerError(res.data?.message || 'Thao tác thất bại.');
    }
  };

  const submitRoleChange = async (e) => {
    e.preventDefault();
    if (!selectedPlayer) return;

    const res = await adminApiCall(`/api/admin/users/${selectedPlayer._id}/role`, {
      method: 'PATCH',
      body: JSON.stringify({
        role: roleModal.role,
      }),
    });

    if (res.ok) {
      setPlayerSuccess(`Thay đổi vai trò của người chơi thành công!`);
      setRoleModal({ ...roleModal, isOpen: false });
      fetchPlayers();
    } else {
      setPlayerError(res.data?.message || 'Thao tác thất bại.');
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

    const res = await adminApiCall('/api/admin/announcements', {
      method: 'POST',
      body: JSON.stringify({
        title: announcementTitle.trim(),
        message: announcementText.trim(),
        type: announcementType,
        durationSeconds: Number(announcementDuration),
      }),
    });

    if (res.ok) {
      setAnnouncementSuccess('Đã phát thông báo thành công đến toàn bộ người chơi trực tuyến!');
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

  // Perform Season Reset
  const handleSeasonReset = async (e) => {
    e.preventDefault();
    setSeasonError('');
    setSeasonSuccess('');
    setSeasonResetData(null);

    if (seasonConfirmText !== 'RESET') {
      setSeasonError('Vui lòng nhập đúng từ xác nhận: RESET');
      return;
    }
    if (!seasonReason.trim()) {
      setSeasonError('Lý do bắt buộc phải điền.');
      return;
    }

    const res = await adminApiCall('/api/admin/season-reset', {
      method: 'POST',
      body: JSON.stringify({
        confirmText: seasonConfirmText,
        reason: seasonReason.trim()
      })
    });

    if (res.ok && res.data.success) {
      setSeasonSuccess('Mùa giải đã được thiết lập lại thành công!');
      setSeasonResetData(res.data.data);
      setSeasonConfirmText('');
      setSeasonReason('');
    } else {
      setSeasonError(res.data?.message || 'Thất bại khi reset mùa giải.');
    }
  };

  return (
    <>
      <style>{`
        /* RETRO PIXEL ARCADE STYLES FOR ADMIN PANEL */
        .pixel-panel {
          background-color: #fffaf0;
          border: 4px solid #111111;
          box-shadow: 8px 8px 0 #111111;
          position: relative;
          overflow: hidden;
        }
        
        .pixel-panel::before {
          content: "";
          position: absolute;
          inset: 0;
          background-image: radial-gradient(#111111 1px, transparent 1px);
          background-size: 16px 16px;
          opacity: 0.035;
          pointer-events: none;
        }

        .pixel-card {
          background-color: #ffffff;
          border: 3px solid #111111;
          box-shadow: 4px 4px 0 #111111;
          transition: transform 0.1s, box-shadow 0.1s;
        }

        .pixel-card:hover {
          transform: translate(-2px, -2px);
          box-shadow: 6px 6px 0 #111111;
        }

        .pixel-btn {
          border: 3px solid #111111;
          box-shadow: 3px 3px 0 #111111;
          font-weight: 800;
          text-transform: uppercase;
          transition: transform 0.05s, box-shadow 0.05s;
          cursor: pointer;
        }

        .pixel-btn:hover {
          transform: translate(-1.5px, -1.5px);
          box-shadow: 4.5px 4.5px 0 #111111;
        }

        .pixel-btn:active {
          transform: translate(2px, 2px);
          box-shadow: 1px 1px 0 #111111;
        }

        .pixel-btn-tab {
          border: 3px solid #111111;
          box-shadow: 3px 3px 0 #111111;
          transition: transform 0.1s, box-shadow 0.1s;
          cursor: pointer;
        }

        .pixel-btn-tab:hover {
          transform: translate(-1px, -1px);
          box-shadow: 4px 4px 0 #111111;
        }

        .pixel-btn-tab.active {
          transform: translate(2px, 2px);
          box-shadow: 1px 1px 0 #111111;
          background-color: var(--pop-orange) !important;
          color: #ffffff !important;
        }

        .pixel-input, .pixel-select {
          border: 3px solid #111111;
          box-shadow: 3px 3px 0 #111111;
          transition: transform 0.1s, box-shadow 0.1s;
        }

        .pixel-input:focus, .pixel-select:focus {
          transform: translate(-1px, -1px);
          box-shadow: 4px 4px 0 #111111;
          outline: none;
          background-color: var(--pop-cream) !important;
        }

        .pixel-badge {
          border: 2px solid #111111;
          font-weight: 800;
          font-family: monospace;
          text-transform: uppercase;
          padding: 2px 6px;
        }

        .pixel-table-container {
          border: 3px solid #111111;
          box-shadow: 5px 5px 0 #111111;
          background-color: #ffffff;
        }

        .pixel-table th {
          background-color: var(--pop-cream);
          border-bottom: 3px solid #111111;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .pixel-table tr:hover td {
          background-color: #fdf7ee;
        }

        /* Diagonal stripes danger background */
        .danger-stripes {
          background: repeating-linear-gradient(
            45deg,
            #fee2e2,
            #fee2e2 10px,
            #fecaca 10px,
            #fecaca 20px
          );
          border: 3px solid #111111;
        }

        .pixel-live-preview {
          background-color: var(--pop-black);
          border: 3px solid var(--pop-black);
          color: #ffffff;
          box-shadow: 4px 4px 0 var(--pop-orange);
          position: relative;
        }

        /* Custom scrollbar matching retro pop-art */
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #fffbf5;
          border-left: 2px solid #111111;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: var(--pop-orange);
          border: 2px solid #111111;
        }
        
        .pixel-modal-overlay {
          background-color: rgba(17, 17, 17, 0.75);
          backdrop-filter: blur(2px);
          position: fixed;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 16px;
          z-index: 9999;
        }

        .pixel-modal {
          border: 4px solid #111111;
          box-shadow: 8px 8px 0 #111111;
          background-color: #ffffff !important;
          position: relative;
          display: flex;
          flex-direction: column;
          gap: 16px;
          text-align: left;
        }
      `}</style>

      <div className="pixel-panel p-6 md:p-8 flex flex-col gap-8 text-[var(--pop-black)]">
        {/* Corner Pixel Accents */}
        <div className="absolute top-2 left-2 w-3 h-3 border-t-4 border-l-4 border-[#111111] pointer-events-none"></div>
        <div className="absolute top-2 right-2 w-3 h-3 border-t-4 border-r-4 border-[#111111] pointer-events-none"></div>
        <div className="absolute bottom-2 left-2 w-3 h-3 border-b-4 border-l-4 border-[#111111] pointer-events-none"></div>
        <div className="absolute bottom-2 right-2 w-3 h-3 border-b-4 border-r-4 border-[#111111] pointer-events-none"></div>

        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b-4 border-[#111111] pb-6">
          <div className="text-left">
            <div className="flex items-center gap-2">
              <span className="text-3xl">🛠️</span>
              <h2 className="text-3xl md:text-4xl font-pop-display font-black uppercase tracking-tight">
                BẢNG ĐIỀU KHIỂN ADMIN
              </h2>
            </div>
            <p className="text-[10px] md:text-xs font-bold text-[var(--pop-black)]/60 mt-1.5 uppercase tracking-widest">
              HỆ THỐNG QUẢN LÝ GAME THẺ BÀI BOOM-KITTEN. QUYỀN LỰC ĐI KÈM TRÁCH NHIỆM.
            </p>
          </div>
          
          {/* Arcade status badges */}
          <div className="flex gap-2">
            <span className="pixel-badge bg-[var(--pop-amber)] text-xs text-[var(--pop-black)] shadow-[2px_2px_0_#111111]">
              [ 🔴 ADMIN MODE ]
            </span>
            <span className="pixel-badge bg-emerald-400 text-xs text-[var(--pop-black)] shadow-[2px_2px_0_#111111] animate-pulse">
              [ 🌐 SECURE LIVE ]
            </span>
          </div>
        </div>

        {/* Tab Cartridges Navigation */}
        <div className="flex gap-2.5 overflow-x-auto pb-3 border-b-3 border-[#111111] custom-scrollbar">
          {[
            { id: 'stats', label: 'Thống Kê 📊' },
            { id: 'players', label: 'Người Dùng 👥' },
            { id: 'catalog', label: 'Shop Game 🛒' },
            { id: 'quests', label: 'Nhiệm Vụ 🎯' },
            { id: 'announcement', label: 'Thông Báo 📢' },
            { id: 'logs', label: 'Nhật Ký Hệ Thống 📝' },
            { id: 'season', label: 'Mùa Giải ⏳' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`pixel-btn-tab px-4 py-2.5 bg-white text-xs font-pop-accent font-black uppercase whitespace-nowrap
                ${activeTab === tab.id ? 'active' : ''}`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* TAB CONTENT: STATS */}
        {activeTab === 'stats' && (
          <div className="flex flex-col gap-6 text-left animate-fade-in">
            <h3 className="text-lg font-pop-display font-black uppercase tracking-wide">
              Meters & Sensors (Số liệu hệ thống)
            </h3>
            
            {stats ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="pixel-card p-5 border-l-[12px] border-l-[var(--pop-amber)]">
                  <span className="text-[10px] font-pop-accent font-black text-slate-500 uppercase block">Tổng tài khoản</span>
                  <span className="font-pop-display font-black text-4xl mt-1 block">{stats.totalUsers}</span>
                </div>

                <div className="pixel-card p-5 border-l-[12px] border-l-emerald-500 bg-emerald-50/20">
                  <span className="text-[10px] font-pop-accent font-black text-emerald-600 uppercase block">Người chơi Online</span>
                  <span className="font-pop-display font-black text-4xl text-emerald-600 mt-1 block">{stats.activeUsers}</span>
                </div>
                
                <div className="pixel-card p-5 border-l-[12px] border-l-[var(--pop-red)] bg-red-50/10">
                  <span className="text-[10px] font-pop-accent font-black text-red-500 uppercase block">Tài khoản bị khóa</span>
                  <span className="font-pop-display font-black text-4xl text-[var(--pop-red)] mt-1 block">{stats.bannedUsers}</span>
                </div>

                <div className="pixel-card p-5 border-l-[12px] border-l-sky-500 bg-sky-50/25">
                  <span className="text-[10px] font-pop-accent font-black text-sky-600 uppercase block">Số phòng chơi trực tuyến</span>
                  <span className="font-pop-display font-black text-4xl text-sky-600 mt-1 block">{stats.totalRooms}</span>
                </div>
                
                <div className="pixel-card p-5 border-l-[12px] border-l-purple-500 bg-purple-50/20">
                  <span className="text-[10px] font-pop-accent font-black text-purple-600 uppercase block">Vật phẩm shop (Active / Tổng)</span>
                  <span className="font-pop-display font-black text-4xl text-purple-700 mt-1 block">
                    {stats.activeShopItems} <span className="text-xl font-bold">/ {stats.totalShopItems}</span>
                  </span>
                </div>

                <div className="pixel-card p-5 border-l-[12px] border-l-orange-500 bg-orange-50/20">
                  <span className="text-[10px] font-pop-accent font-black text-orange-600 block uppercase">Nhiệm vụ active</span>
                  <span className="font-pop-display font-black text-4xl text-orange-700 mt-1 block">
                    {stats.activeMissions} <span className="text-xl font-bold">/ {stats.totalMissions}</span>
                  </span>
                </div>
              </div>
            ) : (
              <div className="pixel-card p-12 text-center flex flex-col items-center justify-center gap-3">
                <span className="text-3xl animate-bounce">💾</span>
                <p className="font-pop-accent font-black text-sm uppercase tracking-widest text-slate-500 animate-pulse">
                  Đang tải dữ liệu admin...
                </p>
              </div>
            )}
          </div>
        )}

        {/* TAB CONTENT: PLAYERS */}
        {activeTab === 'players' && (
          <div className="flex flex-col gap-6 text-left animate-fade-in">
            {playerSuccess && (
              <div className="pixel-card bg-[var(--pop-amber)] p-3 text-xs font-pop-accent font-black text-center uppercase border-2">
                🟢 {playerSuccess}
              </div>
            )}
            {playerError && (
              <div className="pixel-card bg-[var(--pop-red)] text-white p-3 text-xs font-pop-accent font-black text-center uppercase border-2">
                🔴 {playerError}
              </div>
            )}

            {/* Toolbar area */}
            <div className="flex flex-col md:flex-row gap-4 bg-slate-50 p-4 border-3 border-[#111111] shadow-[3px_3px_0_#111111]">
              <div className="flex-grow flex flex-col gap-1">
                <label className="text-[9px] font-pop-accent font-black uppercase text-slate-500">Tìm kiếm</label>
                <input
                  type="text"
                  placeholder="Tìm người chơi theo tên hoặc email..."
                  value={playerSearch}
                  onChange={(e) => {
                    setPlayerSearch(e.target.value);
                    setPlayerPage(1);
                  }}
                  className="pixel-input bg-white px-4 py-2 text-xs font-bold w-full"
                />
              </div>

              <div className="flex gap-4">
                <div className="flex flex-col gap-1 min-w-[130px]">
                  <label className="text-[9px] font-pop-accent font-black uppercase text-slate-500">Vai trò</label>
                  <select
                    value={playerRoleFilter}
                    onChange={(e) => {
                      setPlayerRoleFilter(e.target.value);
                      setPlayerPage(1);
                    }}
                    className="pixel-select bg-white px-3 py-2 text-xs font-bold cursor-pointer"
                  >
                    <option value="">Tất cả</option>
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1 min-w-[130px]">
                  <label className="text-[9px] font-pop-accent font-black uppercase text-slate-500">Trạng thái</label>
                  <select
                    value={playerStatusFilter}
                    onChange={(e) => {
                      setPlayerStatusFilter(e.target.value);
                      setPlayerPage(1);
                    }}
                    className="pixel-select bg-white px-3 py-2 text-xs font-bold cursor-pointer"
                  >
                    <option value="">Tất cả</option>
                    <option value="active">Active</option>
                    <option value="banned">Banned</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Data Grid */}
            <div className="pixel-table-container overflow-x-auto custom-scrollbar">
              <table className="pixel-table w-full text-xs font-bold text-left border-collapse">
                <thead>
                  <tr>
                    <th className="p-3">Tên tài khoản</th>
                    <th className="p-3">Email</th>
                    <th className="p-3">Vai trò</th>
                    <th className="p-3">Trạng thái</th>
                    <th className="p-3">Tài sản (Balance)</th>
                    <th className="p-3">Xếp hạng (ELO)</th>
                    <th className="p-3 text-center">Bảng điều khiển</th>
                  </tr>
                </thead>
                <tbody>
                  {players.map((player) => (
                    <tr key={player._id} className="border-b border-slate-200">
                      <td className="p-3 font-pop-accent font-black text-slate-800">{player.username}</td>
                      <td className="p-3 text-slate-600">{player.email}</td>
                      <td className="p-3">
                        <span className={`pixel-badge text-[9px] ${player.role === 'admin' ? 'bg-[var(--pop-amber)]' : 'bg-slate-100'}`}>
                          {player.role}
                        </span>
                      </td>
                      <td className="p-3">
                        <span className={`pixel-badge text-[9px] ${player.isBanned ? 'bg-[var(--pop-red)] text-white' : 'bg-emerald-100 text-emerald-800'}`}>
                          {player.isBanned ? 'Banned' : 'Active'}
                        </span>
                      </td>
                      <td className="p-3">
                        <div className="flex flex-col gap-1">
                          <span className="flex items-center gap-1 font-pop-accent text-amber-600"><CoinIcon className="w-4 h-4" /> {player.coins || 0}</span>
                          <span className="flex items-center gap-1 font-pop-accent text-indigo-600"><GemIcon className="w-4 h-4" /> {player.gems || 0}</span>
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="flex flex-col gap-0.5">
                          <span className="font-pop-accent font-black text-slate-800">🏆 {player.eloPoints || 1000}</span>
                          <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">{player.rank || 'Bronze IV'}</span>
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="flex gap-2 justify-center flex-wrap max-w-xs mx-auto">
                          {/* Wallet actions group */}
                          <div className="flex gap-1 border border-slate-200 p-1 bg-slate-50">
                            <button
                              onClick={() => handleOpenCurrencyModal(player, 'coin')}
                              className="pixel-btn bg-amber-400 text-[8px] px-1.5 py-0.5 rounded-none flex items-center gap-1 font-black"
                            >
                              +GOLD <CoinIcon className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleOpenCurrencyModal(player, 'gem')}
                              className="pixel-btn bg-indigo-400 text-white text-[8px] px-1.5 py-0.5 rounded-none flex items-center gap-1 font-black"
                            >
                              +PINK <GemIcon className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          {/* Account actions group */}
                          <div className="flex gap-1 border border-slate-200 p-1 bg-slate-50">
                            <button
                              onClick={() => handleOpenEloModal(player)}
                              className="pixel-btn bg-sky-400 text-[8px] px-1.5 py-0.5 rounded-none"
                            >
                              ELO 🏆
                            </button>
                            <button
                              onClick={() => handleOpenRoleModal(player)}
                              className="pixel-btn bg-purple-400 text-white text-[8px] px-1.5 py-0.5 rounded-none"
                            >
                              Role 🛠️
                            </button>
                          </div>

                          {/* Danger ban action */}
                          <button
                            onClick={() => handleOpenStatusModal(player)}
                            className={`pixel-btn text-[8px] px-2 py-0.5 rounded-none text-white font-black
                              ${player.isBanned ? 'bg-emerald-600' : 'bg-[var(--pop-red)]'}`}
                          >
                            {player.isBanned ? 'Unban 🔓' : 'Ban 🔒'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {players.length === 0 && (
                    <tr>
                      <td colSpan="7" className="p-6 text-center text-slate-400 font-bold uppercase tracking-wider">
                        Không tìm thấy người chơi nào.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {playerTotalPages > 1 && (
              <div className="flex justify-center items-center gap-4 mt-4">
                <button
                  disabled={playerPage === 1}
                  onClick={() => setPlayerPage(playerPage - 1)}
                  className="pixel-btn px-4 py-2 bg-white text-[10px] font-black disabled:opacity-40 disabled:pointer-events-none"
                >
                  ◀️ Trước
                </button>
                <span className="text-xs font-pop-accent font-black border-2 border-black bg-white px-3 py-1 shadow-[2px_2px_0_#111]">
                  Trang {playerPage} / {playerTotalPages}
                </span>
                <button
                  disabled={playerPage === playerTotalPages}
                  onClick={() => setPlayerPage(playerPage + 1)}
                  className="pixel-btn px-4 py-2 bg-white text-[10px] font-black disabled:opacity-40 disabled:pointer-events-none"
                >
                  Sau ▶️
                </button>
              </div>
            )}
          </div>
        )}

        {/* TAB CONTENT: CATALOG (SHOP CRUD) */}
        {activeTab === 'catalog' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 text-left animate-fade-in">
            {/* Create Item Panel */}
            <div className="lg:col-span-1 pixel-card p-6 h-fit bg-[#fffdfa]">
              <h3 className="text-md font-pop-display font-black uppercase border-b-3 border-[#111111] pb-2 mb-4">
                Thêm Vật Phẩm Shop 🛍️
              </h3>

              {catalogError && (
                <div className="pixel-card bg-[var(--pop-red)] text-white p-3 text-xs font-pop-accent font-black text-center uppercase mb-4">
                  🔴 {catalogError}
                </div>
              )}
              {catalogSuccess && (
                <div className="pixel-card bg-[var(--pop-amber)] p-3 text-xs font-pop-accent font-black text-center uppercase mb-4">
                  🟢 {catalogSuccess}
                </div>
              )}

              <form onSubmit={handleCreateItem} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-[9px] font-pop-accent font-black uppercase text-slate-500">Tên vật phẩm</label>
                  <input
                    type="text"
                    placeholder="Mèo Hoàng Gia..."
                    value={newItemName}
                    onChange={(e) => setNewItemName(e.target.value)}
                    className="pixel-input bg-white px-3 py-2 text-xs font-bold"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[9px] font-pop-accent font-black uppercase text-slate-500">Mô tả chi tiết</label>
                  <textarea
                    placeholder="Mô tả công dụng/thiết kế..."
                    value={newItemDescription}
                    onChange={(e) => setNewItemDescription(e.target.value)}
                    rows="2"
                    className="pixel-input bg-white px-3 py-2 text-xs font-bold"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] font-pop-accent font-black uppercase text-slate-500">Loại vật phẩm</label>
                    <select
                      value={newItemType}
                      onChange={(e) => setNewItemType(e.target.value)}
                      className="pixel-select bg-white px-2 py-2 text-xs font-bold cursor-pointer"
                    >
                      <option value="skin">Skin Bài</option>
                      <option value="emote">Biểu Cảm</option>
                      <option value="avatar_frame">Khung Avatar</option>
                    </select>
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] font-pop-accent font-black uppercase text-slate-500">Độ hiếm</label>
                    <select
                      value={newItemRarity}
                      onChange={(e) => setNewItemRarity(e.target.value)}
                      className="pixel-select bg-white px-2 py-2 text-xs font-bold cursor-pointer"
                    >
                      <option value="common">Common</option>
                      <option value="rare">Rare</option>
                      <option value="epic">Epic</option>
                      <option value="legendary">Legendary</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] font-pop-accent font-black uppercase text-slate-500">Giá GoldCoin</label>
                    <input
                      type="number"
                      min="0"
                      value={newItemCoinPrice}
                      onChange={(e) => setNewItemCoinPrice(e.target.value)}
                      className="pixel-input bg-white px-3 py-2 text-xs font-bold"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] font-pop-accent font-black uppercase text-slate-500">Giá PinkCoin</label>
                    <input
                      type="number"
                      min="0"
                      value={newItemGemPrice}
                      onChange={(e) => setNewItemGemPrice(e.target.value)}
                      className="pixel-input bg-white px-3 py-2 text-xs font-bold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] font-pop-accent font-black uppercase text-slate-500">Thứ tự sắp xếp</label>
                    <input
                      type="number"
                      value={newItemSortOrder}
                      onChange={(e) => setNewItemSortOrder(e.target.value)}
                      className="pixel-input bg-white px-3 py-2 text-xs font-bold"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] font-pop-accent font-black uppercase text-slate-500">Trạng thái</label>
                    <select
                      value={newItemIsActive ? 'true' : 'false'}
                      onChange={(e) => setNewItemIsActive(e.target.value === 'true')}
                      className="pixel-select bg-white px-2 py-2 text-xs font-bold cursor-pointer"
                    >
                      <option value="true">Active ✅</option>
                      <option value="false">Disable ⏸️</option>
                    </select>
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[9px] font-pop-accent font-black uppercase text-slate-500">URL hình ảnh</label>
                  <input
                    type="text"
                    placeholder="https://..."
                    value={newItemImageUrl}
                    onChange={(e) => setNewItemImageUrl(e.target.value)}
                    className="pixel-input bg-white px-3 py-2 text-xs font-bold"
                  />
                </div>

                <button
                  type="submit"
                  className="pixel-btn pixel-btn-primary w-full mt-2 py-3 text-xs font-black"
                >
                  Xác nhận thêm ➕
                </button>
              </form>
            </div>

            {/* List Catalog Items */}
            <div className="lg:col-span-2 flex flex-col gap-4">
              <h3 className="text-md font-pop-display font-black uppercase">
                Danh sách sản phẩm trong Shop 🛒
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[650px] overflow-y-auto pr-2 custom-scrollbar">
                {catalog.map((item) => (
                  <div
                    key={item._id}
                    className={`pixel-card p-4 flex flex-col justify-between bg-white relative
                      ${item.isActive === false ? 'opacity-60 bg-slate-50/50' : ''}`}
                  >
                    <div>
                      <div className="flex justify-between items-start gap-2">
                        {/* Type badge */}
                        <span className="text-[9px] font-bold border border-slate-300 bg-slate-100 px-1.5 py-0.5 uppercase">
                          {item.type}
                        </span>
                        
                        {/* Rarity badge */}
                        <span className={`pixel-badge text-[8px]
                          ${item.rarity === 'legendary' ? 'bg-orange-400 text-white' : 
                            item.rarity === 'epic' ? 'bg-purple-500 text-white' : 
                            item.rarity === 'rare' ? 'bg-sky-400 text-white' : 'bg-slate-100'}`}>
                          {item.rarity}
                        </span>
                      </div>

                      <div className="flex items-center gap-3 mt-3">
                        {/* Pixel image preview container */}
                        <div className="w-12 h-12 border-2 border-black flex-shrink-0 flex items-center justify-center bg-amber-50">
                          {item.imageUrl ? (
                            <img src={item.imageUrl} alt={item.name} className="w-10 h-10 object-contain image-render-pixel" onError={(e) => { e.target.style.display = 'none'; }} />
                          ) : (
                            <span className="text-2xl">{item.type === 'skin' ? '🃏' : item.type === 'emote' ? '🎭' : '🖼️'}</span>
                          )}
                        </div>
                        
                        <div>
                          <h4 className="font-pop-accent font-black text-xs uppercase text-slate-800">{item.name}</h4>
                          <p className="text-[10px] text-slate-400 font-bold mt-0.5 line-clamp-1">{item.description || 'Chưa có mô tả chi tiết.'}</p>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-between items-center mt-4 pt-3 border-t-2 border-slate-100">
                      <div className="flex flex-col items-start">
                        {item.price?.coins > 0 && (
                          <span className="font-pop-accent font-black text-xs text-[var(--pop-red)] flex items-center gap-1">
                            <CoinIcon className="w-4 h-4" /> {item.price.coins}
                          </span>
                        )}
                        {item.price?.gems > 0 && (
                          <span className="font-pop-accent font-black text-xs text-indigo-600 flex items-center gap-1">
                            <GemIcon className="w-4 h-4" /> {item.price.gems}
                          </span>
                        )}
                        {(!item.price?.coins && !item.price?.gems) && (
                          <span className="font-pop-accent font-black text-xs text-emerald-600 uppercase">FREE</span>
                        )}
                      </div>

                      <div className="flex gap-1.5">
                        <button
                          onClick={() => {
                            setEditingItem({
                              _id: item._id,
                              name: item.name,
                              description: item.description || '',
                              type: item.type,
                              rarity: item.rarity,
                              priceCoins: item.price?.coins || 0,
                              priceGems: item.price?.gems || 0,
                              imageUrl: item.imageUrl || '',
                              isActive: item.isActive !== false,
                              sortOrder: item.sortOrder || 0,
                            });
                          }}
                          className="pixel-btn bg-white text-[9px] px-2 py-1"
                        >
                          Sửa ✏️
                        </button>
                        <button
                          onClick={() => handleToggleItemStatus(item)}
                          className={`pixel-btn text-[9px] px-2 py-1 text-white
                            ${item.isActive !== false ? 'bg-amber-600' : 'bg-emerald-600'}`}
                        >
                          {item.isActive !== false ? 'Tắt ⏸️' : 'Bật ▶️'}
                        </button>
                        <button
                          onClick={() => handleDeleteItem(item._id)}
                          className="pixel-btn pixel-btn-danger text-[9px] px-2 py-1"
                        >
                          Xóa 🗑️
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
                {catalog.length === 0 && (
                  <p className="col-span-2 text-center py-10 text-slate-400 font-bold uppercase">
                    Chưa có sản phẩm nào.
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB CONTENT: QUESTS */}
        {activeTab === 'quests' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 text-left animate-fade-in">
            {/* Quest form */}
            <div className="lg:col-span-1 pixel-card p-6 h-fit bg-[#fffdfa]">
              <h3 className="text-md font-pop-display font-black uppercase border-b-3 border-[#111111] pb-2 mb-4">
                {editingQuestId ? 'Cập Nhật Nhiệm Vụ ✏️' : 'Tạo Nhiệm Vụ Mới 🎯'}
              </h3>

              {questsError && (
                <div className="pixel-card bg-[var(--pop-red)] text-white p-3 text-xs font-pop-accent font-black text-center uppercase mb-4">
                  🔴 {questsError}
                </div>
              )}
              {questsSuccess && (
                <div className="pixel-card bg-[var(--pop-amber)] p-3 text-xs font-pop-accent font-black text-center uppercase mb-4">
                  🟢 {questsSuccess}
                </div>
              )}

              <form onSubmit={handleCreateOrUpdateQuest} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-[9px] font-pop-accent font-black uppercase text-slate-500">Tiêu đề nhiệm vụ</label>
                  <input
                    type="text"
                    placeholder="Ví dụ: Thắng 3 trận..."
                    value={newQuestTitle}
                    onChange={(e) => setNewQuestTitle(e.target.value)}
                    className="pixel-input bg-white px-3 py-2 text-xs font-bold"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[9px] font-pop-accent font-black uppercase text-slate-500">Mô tả</label>
                  <textarea
                    placeholder="Chơi và thắng 3 trận trong đấu trường..."
                    value={newQuestDescription}
                    onChange={(e) => setNewQuestDescription(e.target.value)}
                    rows="2"
                    className="pixel-input bg-white px-3 py-2 text-xs font-bold"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] font-pop-accent font-black uppercase text-slate-500">Loại hành động</label>
                    <select
                      value={newQuestActionType}
                      onChange={(e) => setNewQuestActionType(e.target.value)}
                      className="pixel-select bg-white px-2 py-2 text-xs font-bold cursor-pointer"
                    >
                      <option value="play_game">Chơi Trận</option>
                      <option value="win_game">Thắng Trận</option>
                      <option value="draw_card">Rút Bài</option>
                      <option value="buy_item">Mua Hàng</option>
                    </select>
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] font-pop-accent font-black uppercase text-slate-500">Số lần mục tiêu</label>
                    <input
                      type="number"
                      min="1"
                      value={newQuestTargetCount}
                      onChange={(e) => setNewQuestTargetCount(e.target.value)}
                      className="pixel-input bg-white px-3 py-2 text-xs font-bold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] font-pop-accent font-black uppercase text-slate-500">Thưởng GoldCoin</label>
                    <input
                      type="number"
                      min="0"
                      value={newQuestCoinReward}
                      onChange={(e) => setNewQuestCoinReward(e.target.value)}
                      className="pixel-input bg-white px-3 py-2 text-xs font-bold"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] font-pop-accent font-black uppercase text-slate-500">Thưởng PinkCoin</label>
                    <input
                      type="number"
                      min="0"
                      value={newQuestGemReward}
                      onChange={(e) => setNewQuestGemReward(e.target.value)}
                      className="pixel-input bg-white px-3 py-2 text-xs font-bold"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[9px] font-pop-accent font-black uppercase text-slate-500">Trạng thái kích hoạt</label>
                  <select
                    value={newQuestIsActive ? 'true' : 'false'}
                    onChange={(e) => setNewQuestIsActive(e.target.value === 'true')}
                    className="pixel-select bg-white px-2 py-2 text-xs font-bold cursor-pointer"
                  >
                    <option value="true">Active ✅</option>
                    <option value="false">Disable ⏸️</option>
                  </select>
                </div>

                <div className="flex gap-2 mt-2">
                  <button
                    type="submit"
                    className="pixel-btn pixel-btn-primary flex-1 py-3 text-xs font-black"
                  >
                    {editingQuestId ? 'Lưu Lại 💾' : 'Xác Nhận 🎯'}
                  </button>
                  {editingQuestId && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingQuestId(null);
                        setNewQuestTitle('');
                        setNewQuestDescription('');
                        setNewQuestCoinReward(0);
                        setNewQuestGemReward(0);
                        setQuestsError('');
                      }}
                      className="pixel-btn bg-white px-4 py-3 text-xs font-black"
                    >
                      Hủy
                    </button>
                  )}
                </div>
              </form>
            </div>

            {/* List Quests */}
            <div className="lg:col-span-2 flex flex-col gap-4">
              <h3 className="text-md font-pop-display font-black uppercase">
                Bảng Nhiệm Vụ Mục Tiêu 🎯
              </h3>
              
              <div className="flex flex-col gap-3 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                {quests.map((quest) => (
                  <div
                    key={quest._id}
                    className={`pixel-card p-4 flex justify-between items-center bg-white
                      ${quest.isActive === false ? 'opacity-60 bg-slate-50' : ''}`}
                  >
                    <div className="flex flex-col gap-1.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="pixel-badge text-[8px] bg-slate-100 text-slate-600">
                          {quest.actionType}
                        </span>
                        <h4 className="font-pop-accent font-black text-xs uppercase text-slate-800">{quest.title}</h4>
                      </div>
                      
                      <p className="text-xs text-slate-500 font-semibold">{quest.description}</p>
                      
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] font-bold text-slate-400">
                          MỤC TIÊU: {quest.targetCount} lần
                        </span>
                        <span className="text-slate-300">|</span>
                        <span className={`text-[10px] font-black uppercase ${quest.isActive ? 'text-emerald-600' : 'text-slate-400'}`}>
                          {quest.isActive ? 'Bật active' : 'Đã tắt'}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 flex-shrink-0">
                      <div className="text-right flex flex-col items-end gap-1 font-pop-accent font-black text-xs">
                        {quest.reward?.coins > 0 && (
                          <span className="text-[var(--pop-red)] flex items-center gap-1">
                            <CoinIcon className="w-4 h-4" /> +{quest.reward.coins}
                          </span>
                        )}
                        {quest.reward?.gems > 0 && (
                          <span className="text-indigo-600 flex items-center gap-1">
                            <GemIcon className="w-4 h-4" /> +{quest.reward.gems}
                          </span>
                        )}
                      </div>

                      <div className="flex gap-1.5">
                        <button
                          onClick={() => handleEditQuest(quest)}
                          className="pixel-btn bg-white text-[9px] px-2.5 py-1.5"
                        >
                          Sửa ✏️
                        </button>
                        <button
                          onClick={() => handleDeleteQuest(quest._id)}
                          className="pixel-btn pixel-btn-danger text-[9px] px-2.5 py-1.5"
                        >
                          Xóa 🗑️
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
                {quests.length === 0 && (
                  <p className="text-center py-10 text-slate-400 font-bold uppercase">Chưa có nhiệm vụ nào.</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB CONTENT: ANNOUNCEMENT */}
        {activeTab === 'announcement' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 text-left animate-fade-in">
            {/* Form */}
            <div className="pixel-card p-6 h-fit bg-[#fffdfa]">
              <h3 className="text-md font-pop-display font-black uppercase border-b-3 border-[#111111] pb-2 mb-4">
                Soạn thảo thông báo Live 📢
              </h3>

              {announcementSuccess && (
                <div className="pixel-card bg-[var(--pop-amber)] p-3 text-xs font-pop-accent font-black text-center uppercase mb-4">
                  🟢 {announcementSuccess}
                </div>
              )}
              {announcementError && (
                <div className="pixel-card bg-[var(--pop-red)] text-white p-3 text-xs font-pop-accent font-black text-center uppercase mb-4">
                  🔴 {announcementError}
                </div>
              )}

              <form onSubmit={handleSendAnnouncement} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-[9px] font-pop-accent font-black uppercase text-slate-500">Tiêu đề</label>
                  <input
                    type="text"
                    value={announcementTitle}
                    onChange={(e) => setAnnouncementTitle(e.target.value)}
                    className="pixel-input bg-white px-3 py-2 text-xs font-bold"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[9px] font-pop-accent font-black uppercase text-slate-500">Nội dung thông điệp</label>
                  <textarea
                    placeholder="Bảo trì máy chủ, quà tặng nạp..."
                    value={announcementText}
                    onChange={(e) => setAnnouncementText(e.target.value)}
                    rows="3"
                    className="pixel-input bg-white px-3 py-2 text-xs font-bold"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] font-pop-accent font-black uppercase text-slate-500">Loại tin nhắn</label>
                    <select
                      value={announcementType}
                      onChange={(e) => setAnnouncementType(e.target.value)}
                      className="pixel-select bg-white px-2 py-2 text-xs font-bold cursor-pointer"
                    >
                      <option value="info">Thông tin (Xanh)</option>
                      <option value="warning">Cảnh báo (Đỏ)</option>
                      <option value="event">Sự kiện (Vàng)</option>
                    </select>
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] font-pop-accent font-black uppercase text-slate-500">Thời gian (Giây)</label>
                    <input
                      type="number"
                      min="5"
                      max="300"
                      value={announcementDuration}
                      onChange={(e) => setAnnouncementDuration(e.target.value)}
                      className="pixel-input bg-white px-3 py-2 text-xs font-bold"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="pixel-btn pixel-btn-danger w-full mt-2 py-3 text-xs font-black"
                >
                  Phát tin live toàn server ⚡
                </button>
              </form>
            </div>

            {/* Live Preview Box */}
            <div className="flex flex-col gap-4">
              <h3 className="text-md font-pop-display font-black uppercase">
                Giao diện hiển thị trực tiếp (Live Preview)
              </h3>
              
              <div className="pixel-card p-6 bg-slate-55 flex flex-col gap-4 justify-center items-center h-full min-h-[300px] border-dashed">
                <p className="text-[10px] font-pop-accent font-black text-slate-400 uppercase tracking-widest mb-2">
                  [ KHUNG MÔ PHỎNG IN-GAME ]
                </p>

                {/* Simulated alert toast */}
                <div
                  className={`w-full max-w-sm p-4 border-3 border-black shadow-[4px_4px_0_var(--pop-black)] flex items-center justify-between gap-4 transition-all
                    ${announcementType === 'warning' ? 'bg-[var(--pop-red)] text-white' : 
                      announcementType === 'event' ? 'bg-[var(--pop-amber)] text-[var(--pop-black)]' : 
                      'bg-sky-500 text-white'}`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl animate-bounce">📢</span>
                    <div className="text-left">
                      <h5 className="font-pop-accent font-black text-[10px] uppercase tracking-wider opacity-75">
                        {announcementTitle || 'Thông Báo Hệ Thống'}
                      </h5>
                      <p className="font-pop-body text-xs font-bold uppercase mt-0.5 leading-tight">
                        {announcementText || 'Nhập nội dung tin nhắn ở bảng bên để xem bản thử nghiệm hiển thị...'}
                      </p>
                    </div>
                  </div>
                  <button type="button" className="font-black text-sm hover:scale-110 active:scale-90">✕</button>
                </div>
                
                <span className="text-[9px] font-bold text-slate-400 uppercase mt-4">
                  Thời lượng: {announcementDuration} giây
                </span>
              </div>
            </div>
          </div>
        )}

        {/* TAB CONTENT: LOGS (TRANSACTIONS / AUDIT) */}
        {activeTab === 'logs' && (
          <div className="flex flex-col gap-6 text-left animate-fade-in">
            <div className="flex justify-between items-center gap-4 flex-wrap border-b-3 border-[#111111] pb-4">
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setLogTypeTab('transaction');
                    setLogPage(1);
                    setLogFilterType('');
                  }}
                  className={`pixel-btn px-4 py-2 text-[10px] font-black
                    ${logTypeTab === 'transaction' ? 'bg-[var(--pop-amber)]' : 'bg-white'}`}
                >
                  Nhật Ký Số Dư 💸
                </button>
                <button
                  onClick={() => {
                    setLogTypeTab('audit');
                    setLogPage(1);
                    setLogFilterType('');
                  }}
                  className={`pixel-btn px-4 py-2 text-[10px] font-black
                    ${logTypeTab === 'audit' ? 'bg-[var(--pop-amber)]' : 'bg-white'}`}
                >
                  Lịch Sử Hành Động (Audit) 🛡️
                </button>
              </div>

              {/* Filters */}
              <div className="flex gap-2 items-center text-xs flex-wrap bg-slate-50 p-2 border-2 border-black">
                <input
                  type="text"
                  placeholder="Lọc User ID..."
                  value={logFilterUserId}
                  onChange={(e) => {
                    setLogFilterUserId(e.target.value);
                    setLogPage(1);
                  }}
                  className="pixel-input bg-white px-2 py-1 text-[9px] font-bold w-28"
                />

                {logTypeTab === 'transaction' ? (
                  <>
                    <select
                      value={logFilterType}
                      onChange={(e) => {
                        setLogFilterType(e.target.value);
                        setLogPage(1);
                      }}
                      className="pixel-select bg-white px-2 py-1 text-[9px] font-bold cursor-pointer"
                    >
                      <option value="">Tất cả loại</option>
                      <option value="purchase">Mua hàng</option>
                      <option value="earn">Nhận thưởng</option>
                      <option value="spend">Tiêu dùng</option>
                      <option value="admin_adjust">Admin Sửa</option>
                      <option value="season_reward">Quà mùa giải</option>
                      <option value="elo_adjust">Sửa ELO</option>
                    </select>
                    <select
                      value={logFilterCurrency}
                      onChange={(e) => {
                        setLogFilterCurrency(e.target.value);
                        setLogPage(1);
                      }}
                      className="pixel-select bg-white px-2 py-1 text-[9px] font-bold cursor-pointer"
                    >
                      <option value="">Tất cả loại ví</option>
                      <option value="coin">GoldCoin 🪙</option>
                      <option value="gem">PinkCoin 💎</option>
                      <option value="elo">ELO Points 🏆</option>
                    </select>
                  </>
                ) : (
                  <select
                    value={logFilterType}
                    onChange={(e) => {
                      setLogFilterType(e.target.value);
                      setLogPage(1);
                    }}
                    className="pixel-select bg-white px-2 py-1 text-[9px] font-bold cursor-pointer"
                  >
                    <option value="">Tất cả hành động</option>
                    <option value="USER_BAN">Khóa User</option>
                    <option value="ROLE_CHANGE">Đổi quyền</option>
                    <option value="CURRENCY_ADJUST">Sửa Tiền</option>
                    <option value="ELO_ADJUST">Sửa ELO</option>
                    <option value="SHOP_ITEM_CREATE">Tạo Item</option>
                    <option value="SHOP_ITEM_UPDATE">Sửa Item</option>
                    <option value="SHOP_ITEM_DELETE">Xóa Item</option>
                    <option value="QUEST_CREATE">Tạo Quest</option>
                    <option value="QUEST_UPDATE">Sửa Quest</option>
                    <option value="QUEST_DELETE">Xóa Quest</option>
                    <option value="ANNOUNCEMENT_BROADCAST">Phát Live</option>
                    <option value="SEASON_RESET">Reset Mùa</option>
                  </select>
                )}
              </div>
            </div>

            {/* Table */}
            <div className="pixel-table-container overflow-x-auto custom-scrollbar">
              {logTypeTab === 'transaction' ? (
                <table className="pixel-table w-full text-xs font-bold text-left border-collapse">
                  <thead>
                    <tr>
                      <th className="p-3">Thời gian</th>
                      <th className="p-3">Tên tài khoản</th>
                      <th className="p-3">Phân Loại</th>
                      <th className="p-3">Biến động</th>
                      <th className="p-3">Số dư cũ</th>
                      <th className="p-3">Số dư mới</th>
                      <th className="p-3">Mô tả chi tiết</th>
                      <th className="p-3">Tác nhân</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.map((log) => (
                      <tr key={log._id} className="border-b border-slate-100">
                        <td className="p-3 text-[10px] text-slate-400">{new Date(log.createdAt).toLocaleString()}</td>
                        <td className="p-3 font-pop-accent">{log.userId?.username || 'Hệ thống'}</td>
                        <td className="p-3">
                          <span className="text-[9px] border px-1 py-0.5 bg-slate-50 uppercase font-mono">
                            {log.type}
                          </span>
                        </td>
                        <td className="p-3 font-pop-accent font-black">
                          <span className={log.amount >= 0 ? 'text-emerald-600' : 'text-[var(--pop-red)]'}>
                            {log.amount >= 0 ? `+${log.amount}` : log.amount}
                            {log.currency === 'gem' ? (
                              <GemIcon className="w-3.5 h-3.5 inline-block ml-1 align-middle" />
                            ) : log.currency === 'coin' ? (
                              <CoinIcon className="w-3.5 h-3.5 inline-block ml-1 align-middle" />
                            ) : ' 🏆'}
                          </span>
                        </td>
                        <td className="p-3 text-slate-400">{log.balanceBefore ?? '-'}</td>
                        <td className="p-3 text-slate-800">{log.balanceAfter ?? '-'}</td>
                        <td className="p-3 text-slate-600">{log.description}</td>
                        <td className="p-3 text-[10px] text-slate-500 uppercase">{log.createdBy || 'system'}</td>
                      </tr>
                    ))}
                    {logs.length === 0 && (
                      <tr>
                        <td colSpan="8" className="p-6 text-center text-slate-400 font-bold uppercase">
                          Không có lịch sử biến động số dư.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              ) : (
                <table className="pixel-table w-full text-xs font-bold text-left border-collapse">
                  <thead>
                    <tr>
                      <th className="p-3">Thời gian</th>
                      <th className="p-3">Quản trị viên</th>
                      <th className="p-3">Hành động</th>
                      <th className="p-3">Đối tượng</th>
                      <th className="p-3">Trước thay đổi</th>
                      <th className="p-3">Sau thay đổi</th>
                      <th className="p-3">Lý do ghi nhận</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.map((log) => (
                      <tr key={log._id} className="border-b border-slate-100">
                        <td className="p-3 text-[10px] text-slate-400">{new Date(log.createdAt).toLocaleString()}</td>
                        <td className="p-3 font-pop-accent text-slate-800">{log.adminId?.username || 'Admin ẩn danh'}</td>
                        <td className="p-3">
                          <span className="text-[9px] border border-amber-300 bg-amber-50 px-1 py-0.5 uppercase font-mono">
                            {log.action}
                          </span>
                        </td>
                        <td className="p-3 text-[10px] text-slate-500 font-mono">
                          {log.targetType} ({log.targetId || '-'})
                        </td>
                        <td className="p-3 text-[9px] text-slate-400 font-mono max-w-[150px] truncate">
                          {log.before ? JSON.stringify(log.before) : '-'}
                        </td>
                        <td className="p-3 text-[9px] text-slate-800 font-mono max-w-[150px] truncate">
                          {log.after ? JSON.stringify(log.after) : '-'}
                        </td>
                        <td className="p-3 text-slate-700 font-semibold">{log.reason || '-'}</td>
                      </tr>
                    ))}
                    {logs.length === 0 && (
                      <tr>
                        <td colSpan="7" className="p-6 text-center text-slate-400 font-bold uppercase">
                          Không có nhật ký hành động admin.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              )}
            </div>

            {/* Pagination */}
            {logTotalPages > 1 && (
              <div className="flex justify-center items-center gap-4 mt-4">
                <button
                  disabled={logPage === 1}
                  onClick={() => setLogPage(logPage - 1)}
                  className="pixel-btn px-4 py-2 bg-white text-[10px] font-black disabled:opacity-40"
                >
                  ◀️ Trước
                </button>
                <span className="text-xs font-pop-accent font-black border-2 border-black bg-white px-3 py-1 shadow-[2px_2px_0_#111]">
                  Trang {logPage} / {logTotalPages}
                </span>
                <button
                  disabled={logPage === logTotalPages}
                  onClick={() => setLogPage(logPage + 1)}
                  className="pixel-btn px-4 py-2 bg-white text-[10px] font-black disabled:opacity-40"
                >
                  Sau ▶️
                </button>
              </div>
            )}
          </div>
        )}

        {/* TAB CONTENT: SEASON RESET TOOLS */}
        {activeTab === 'season' && (
          <div className="max-w-xl text-left flex flex-col gap-6 animate-fade-in">
            <div className="danger-stripes p-5 shadow-[4px_4px_0_#111111] flex flex-col gap-2">
              <h4 className="font-pop-display font-black text-lg text-red-700 uppercase flex items-center gap-2">
                ⚠️ KHU VỰC CẢNH BÁO NGUY HIỂM / DANGER ZONE
              </h4>
              <p className="text-xs font-bold uppercase leading-relaxed text-red-900">
                Thao tác "Reset Mùa Giải" sẽ quét sạch xếp hạng hiện tại và phát thưởng cho người chơi:
              </p>
              <ul className="text-xs list-disc pl-5 flex flex-col gap-1 text-red-800 font-semibold leading-relaxed">
                <li>Đặt lại điểm ELO của mọi người chơi về mức cơ bản (1,000 ELO).</li>
                <li>Tự động chuyển đổi các mốc xếp hạng người chơi đã tích lũy thành PinkCoin.</li>
                <li>Thao tác này là bất khả đảo ngược và không thể phục hồi dữ liệu cũ.</li>
              </ul>
            </div>

            {seasonSuccess && (
              <div className="pixel-card bg-emerald-600 text-white p-4">
                <p className="uppercase text-center text-sm font-black">🎉 {seasonSuccess}</p>
                {seasonResetData && (
                  <div className="mt-3 text-[11px] font-mono leading-relaxed border-t border-emerald-500 pt-2 flex flex-col gap-1 bg-emerald-700/30 p-2">
                    <p>• Số tài khoản bị reset: {seasonResetData.affectedUsers}</p>
                    <p>• Điểm ELO đặt lại: {seasonResetData.resetEloTo} ELO</p>
                    <p>• Tổng phần thưởng phát ra: {seasonResetData.totalGemsAwarded} PinkCoin 💎</p>
                  </div>
                )}
              </div>
            )}

            {seasonError && (
              <div className="pixel-card bg-[var(--pop-red)] text-white p-3 text-xs font-pop-accent font-black text-center uppercase">
                🔴 {seasonError}
              </div>
            )}

            <form onSubmit={handleSeasonReset} className="flex flex-col gap-4 mt-2">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-pop-accent font-black text-[var(--pop-black)] uppercase tracking-wider">
                  Lý do thiết lập lại (Audit Log)
                </label>
                <input
                  type="text"
                  placeholder="Ví dụ: Đóng Season 1 & Bắt đầu Season 2..."
                  value={seasonReason}
                  onChange={(e) => setSeasonReason(e.target.value)}
                  className="pixel-input bg-white px-4 py-2 text-xs font-bold"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-pop-accent font-black text-[var(--pop-red)] uppercase tracking-wider">
                  Nhập chính xác từ khóa "RESET" để mở khóa nút hành động
                </label>
                <input
                  type="text"
                  placeholder="Nhập RESET..."
                  value={seasonConfirmText}
                  onChange={(e) => setSeasonConfirmText(e.target.value)}
                  className="pixel-input border-[var(--pop-red)] bg-white px-4 py-2 text-xs font-bold text-[var(--pop-red)]"
                />
              </div>

              <button
                type="submit"
                disabled={seasonConfirmText !== 'RESET' || !seasonReason.trim()}
                className="pixel-btn pixel-btn-danger w-full mt-2 py-4 text-xs font-black disabled:opacity-40 disabled:pointer-events-none"
              >
                KHỞI ĐỘNG RESET MÙA GIẢI / RESET SEASON NOW 💥
              </button>
            </form>
          </div>
        )}
      </div>

      {/* SHOP ITEM EDIT MODAL OVERLAY */}
      {editingItem && (
        <div className="pixel-modal-overlay fixed inset-0 flex items-center justify-center p-4 z-[9999]">
          <div className="pixel-modal p-6 max-w-md w-full relative flex flex-col gap-4 animate-scale-in text-left">
            <h3 className="font-pop-display font-black text-lg uppercase border-b-3 border-[#111111] pb-1.5">
              Cập Nhật Vật Phẩm Shop ✏️
            </h3>
            
            <form onSubmit={handleUpdateItem} className="flex flex-col gap-3">
              <div className="flex flex-col gap-0.5">
                <label className="text-[9px] font-pop-accent font-black uppercase text-slate-500">Tên vật phẩm</label>
                <input
                  type="text"
                  value={editingItem.name}
                  onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })}
                  className="pixel-input bg-white px-3 py-1.5 text-xs font-bold"
                />
              </div>

              <div className="flex flex-col gap-0.5">
                <label className="text-[9px] font-pop-accent font-black uppercase text-slate-500">Mô tả</label>
                <textarea
                  value={editingItem.description}
                  onChange={(e) => setEditingItem({ ...editingItem, description: e.target.value })}
                  rows="2"
                  className="pixel-input bg-white px-3 py-1.5 text-xs font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-0.5">
                  <label className="text-[9px] font-pop-accent font-black uppercase text-slate-500">Loại</label>
                  <select
                    value={editingItem.type}
                    onChange={(e) => setEditingItem({ ...editingItem, type: e.target.value })}
                    className="pixel-select bg-white px-2 py-1.5 text-xs font-bold cursor-pointer"
                  >
                    <option value="skin">Skin Bài</option>
                    <option value="emote">Biểu Cảm</option>
                    <option value="avatar_frame">Khung Avatar</option>
                  </select>
                </div>
                <div className="flex flex-col gap-0.5">
                  <label className="text-[9px] font-pop-accent font-black uppercase text-slate-500">Độ hiếm</label>
                  <select
                    value={editingItem.rarity}
                    onChange={(e) => setEditingItem({ ...editingItem, rarity: e.target.value })}
                    className="pixel-select bg-white px-2 py-1.5 text-xs font-bold cursor-pointer"
                  >
                    <option value="common">Common</option>
                    <option value="rare">Rare</option>
                    <option value="epic">Epic</option>
                    <option value="legendary">Legendary</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-0.5">
                  <label className="text-[9px] font-pop-accent font-black uppercase text-slate-500">Giá GoldCoin</label>
                  <input
                    type="number"
                    value={editingItem.priceCoins}
                    onChange={(e) => setEditingItem({ ...editingItem, priceCoins: Number(e.target.value) })}
                    className="pixel-input bg-white px-3 py-1.5 text-xs font-bold"
                  />
                </div>
                <div className="flex flex-col gap-0.5">
                  <label className="text-[9px] font-pop-accent font-black uppercase text-slate-500">Giá PinkCoin</label>
                  <input
                    type="number"
                    value={editingItem.priceGems}
                    onChange={(e) => setEditingItem({ ...editingItem, priceGems: Number(e.target.value) })}
                    className="pixel-input bg-white px-3 py-1.5 text-xs font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-0.5">
                  <label className="text-[9px] font-pop-accent font-black uppercase text-slate-500">Sắp xếp</label>
                  <input
                    type="number"
                    value={editingItem.sortOrder}
                    onChange={(e) => setEditingItem({ ...editingItem, sortOrder: Number(e.target.value) })}
                    className="pixel-input bg-white px-3 py-1.5 text-xs font-bold"
                  />
                </div>
                <div className="flex flex-col gap-0.5">
                  <label className="text-[9px] font-pop-accent font-black uppercase text-slate-500">Trạng thái</label>
                  <select
                    value={editingItem.isActive ? 'true' : 'false'}
                    onChange={(e) => setEditingItem({ ...editingItem, isActive: e.target.value === 'true' })}
                    className="pixel-select bg-white px-2 py-1.5 text-xs font-bold cursor-pointer"
                  >
                    <option value="true">Bật (Active)</option>
                    <option value="false">Tắt (Inactive)</option>
                  </select>
                </div>
              </div>

              <div className="flex flex-col gap-0.5">
                <label className="text-[9px] font-pop-accent font-black uppercase text-slate-500">URL hình ảnh</label>
                <input
                  type="text"
                  value={editingItem.imageUrl}
                  onChange={(e) => setEditingItem({ ...editingItem, imageUrl: e.target.value })}
                  className="pixel-input bg-white px-3 py-1.5 text-xs font-bold"
                />
              </div>

              <div className="flex gap-3 mt-3">
                <button
                  type="submit"
                  className="pixel-btn pixel-btn-primary flex-1 py-3 text-xs font-black"
                >
                  Lưu lại 💾
                </button>
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  className="pixel-btn bg-white px-4 py-3 text-xs font-black"
                >
                  Hủy
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* USER ADJUSTMENT MODAL OVERLAYS */}
      {/* CURRENCY MODAL */}
      {currencyModal.isOpen && selectedPlayer && (
        <div className="pixel-modal-overlay fixed inset-0 flex items-center justify-center p-4 z-[9999]">
          <div className="pixel-modal p-6 max-w-sm w-full relative flex flex-col gap-4 animate-scale-in text-left">
            <h3 className="font-pop-display font-black text-md uppercase border-b-3 border-[#111111] pb-1">
              Điều chỉnh số dư: {selectedPlayer.username} 💰
            </h3>
            
            <form onSubmit={submitCurrencyAdjustment} className="flex flex-col gap-3">
              <div className="flex flex-col gap-0.5">
                <label className="text-[9px] font-pop-accent font-black uppercase text-slate-500">Hành động</label>
                <select
                  value={currencyModal.operation}
                  onChange={(e) => setCurrencyModal({ ...currencyModal, operation: e.target.value })}
                  className="pixel-select bg-white px-2 py-1.5 text-xs font-bold cursor-pointer"
                >
                  <option value="add">Cộng thêm (+)</option>
                  <option value="subtract">Khấu trừ (-)</option>
                  <option value="set">Thiết lập cứng (=)</option>
                </select>
              </div>

              <div className="flex flex-col gap-0.5">
                <label className="text-[9px] font-pop-accent font-black uppercase text-slate-500">Số lượng ({currencyModal.currency === 'gem' ? 'PinkCoin' : 'GoldCoin'})</label>
                <input
                  type="number"
                  min="0"
                  value={currencyModal.amount}
                  onChange={(e) => setCurrencyModal({ ...currencyModal, amount: e.target.value })}
                  className="pixel-input bg-white px-3 py-1.5 text-xs font-bold"
                />
              </div>

              <div className="flex flex-col gap-0.5">
                <label className="text-[9px] font-pop-accent font-black uppercase text-slate-500">Lý do điều chỉnh (Audit Log)</label>
                <input
                  type="text"
                  placeholder="Bù lỗi server, thưởng thêm..."
                  value={currencyModal.reason}
                  onChange={(e) => setCurrencyModal({ ...currencyModal, reason: e.target.value })}
                  className="pixel-input bg-white px-3 py-1.5 text-xs font-bold"
                />
              </div>

              <div className="flex gap-3 mt-3">
                <button
                  type="submit"
                  className="pixel-btn pixel-btn-primary flex-1 py-2.5 text-xs font-black"
                >
                  Xác nhận
                </button>
                <button
                  type="button"
                  onClick={() => setCurrencyModal({ ...currencyModal, isOpen: false })}
                  className="pixel-btn bg-white px-4 py-2.5 text-xs font-black"
                >
                  Hủy
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ELO MODAL */}
      {eloModal.isOpen && selectedPlayer && (
        <div className="pixel-modal-overlay fixed inset-0 flex items-center justify-center p-4 z-[9999]">
          <div className="pixel-modal p-6 max-w-sm w-full relative flex flex-col gap-4 animate-scale-in text-left">
            <h3 className="font-pop-display font-black text-md uppercase border-b-3 border-[#111111] pb-1">
              Sửa Điểm ELO: {selectedPlayer.username} 🏆
            </h3>
            
            <form onSubmit={submitEloAdjustment} className="flex flex-col gap-3">
              <div className="flex flex-col gap-0.5">
                <label className="text-[9px] font-pop-accent font-black uppercase text-slate-500">Điểm ELO mới</label>
                <input
                  type="number"
                  min="0"
                  value={eloModal.elo}
                  onChange={(e) => setEloModal({ ...eloModal, elo: e.target.value })}
                  className="pixel-input bg-white px-3 py-1.5 text-xs font-bold"
                />
              </div>

              <div className="flex flex-col gap-0.5">
                <label className="text-[9px] font-pop-accent font-black uppercase text-slate-500">Lý do sửa ELO</label>
                <input
                  type="text"
                  placeholder="Lý do sửa đổi ELO..."
                  value={eloModal.reason}
                  onChange={(e) => setEloModal({ ...eloModal, reason: e.target.value })}
                  className="pixel-input bg-white px-3 py-1.5 text-xs font-bold"
                />
              </div>

              <div className="flex gap-3 mt-3">
                <button
                  type="submit"
                  className="pixel-btn pixel-btn-primary flex-1 py-2.5 text-xs font-black"
                >
                  Xác nhận
                </button>
                <button
                  type="button"
                  onClick={() => setEloModal({ ...eloModal, isOpen: false })}
                  className="pixel-btn bg-white px-4 py-2.5 text-xs font-black"
                >
                  Hủy
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* BAN/STATUS MODAL */}
      {statusModal.isOpen && selectedPlayer && (
        <div className="pixel-modal-overlay fixed inset-0 flex items-center justify-center p-4 z-[9999]">
          <div className="pixel-modal p-6 max-w-sm w-full relative flex flex-col gap-4 animate-scale-in text-left">
            <h3 className="font-pop-display font-black text-md uppercase border-b-3 border-[#111111] pb-1">
              Khóa / Mở Khóa: {selectedPlayer.username} 🔒
            </h3>
            
            <form onSubmit={submitStatusChange} className="flex flex-col gap-3">
              <div className="flex flex-col gap-0.5">
                <label className="text-[9px] font-pop-accent font-black uppercase text-slate-500">Trạng thái mới</label>
                <select
                  value={statusModal.status}
                  onChange={(e) => setStatusModal({ ...statusModal, status: e.target.value })}
                  className="pixel-select bg-white px-2 py-1.5 text-xs font-bold cursor-pointer"
                >
                  <option value="active">Active (Kích hoạt lại) 🔓</option>
                  <option value="banned">Banned (Khóa tài khoản) 🔒</option>
                  <option value="suspended">Suspended (Tạm dừng) ⏸️</option>
                </select>
              </div>

              <div className="flex flex-col gap-0.5">
                <label className="text-[9px] font-pop-accent font-black uppercase text-slate-500">Lý do ghi nhận</label>
                <input
                  type="text"
                  placeholder="Ghi rõ lý do khóa/bỏ khóa..."
                  value={statusModal.reason}
                  onChange={(e) => setStatusModal({ ...statusModal, reason: e.target.value })}
                  className="pixel-input bg-white px-3 py-1.5 text-xs font-bold"
                />
              </div>

              <div className="flex gap-3 mt-3">
                <button
                  type="submit"
                  className="pixel-btn pixel-btn-danger flex-1 py-2.5 text-xs font-black"
                >
                  Xác nhận
                </button>
                <button
                  type="button"
                  onClick={() => setStatusModal({ ...statusModal, isOpen: false })}
                  className="pixel-btn bg-white px-4 py-2.5 text-xs font-black"
                >
                  Hủy
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ROLE MODAL */}
      {roleModal.isOpen && selectedPlayer && (
        <div className="pixel-modal-overlay fixed inset-0 flex items-center justify-center p-4 z-[9999]">
          <div className="pixel-modal p-6 max-w-sm w-full relative flex flex-col gap-4 animate-scale-in text-left">
            <h3 className="font-pop-display font-black text-md uppercase border-b-3 border-[#111111] pb-1">
              Đổi vai trò: {selectedPlayer.username} 🛠️
            </h3>
            
            <form onSubmit={submitRoleChange} className="flex flex-col gap-3">
              <p className="text-xs font-bold text-red-500 leading-normal">
                🚨 CẢNH BÁO: Cấp quyền quản trị viên (Admin) cho tài khoản này sẽ cấp toàn bộ quyền truy cập Dashboard và cơ sở dữ liệu.
              </p>
              <div className="flex flex-col gap-0.5 mt-2">
                <label className="text-[9px] font-pop-accent font-black uppercase text-slate-500">Vai trò mới</label>
                <select
                  value={roleModal.role}
                  onChange={(e) => setRoleModal({ ...roleModal, role: e.target.value })}
                  className="pixel-select bg-white px-2 py-1.5 text-xs font-bold cursor-pointer"
                >
                  <option value="user">Người chơi (User)</option>
                  <option value="admin">Quản trị viên (Admin)</option>
                </select>
              </div>

              <div className="flex gap-3 mt-4">
                <button
                  type="submit"
                  className="pixel-btn pixel-btn-primary flex-1 py-2.5 text-xs font-black"
                >
                  Xác nhận
                </button>
                <button
                  type="button"
                  onClick={() => setRoleModal({ ...roleModal, isOpen: false })}
                  className="pixel-btn bg-white px-4 py-2.5 text-xs font-black"
                >
                  Hủy
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
