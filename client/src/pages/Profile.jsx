import React, { useState, useEffect } from 'react';
import { PRESET_AVATARS } from '../components/PlayerAvatar.jsx';

export default function Profile() {
  const [profile, setProfile] = useState(null);
  const [username, setUsername] = useState('');
  const [avatar, setAvatar] = useState('');
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);
  const [history, setHistory] = useState([]);

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

  useEffect(() => {
    fetchProfile();
    fetchHistory();
  }, []);

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
      if (!res.ok) throw new Error(data.message || 'Cập nhật thất bại.');

      setProfile(data);
      setIsError(false);
      setMessage('Cập nhật thông tin thành công!');
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
        <p className="font-headline font-black uppercase text-xl animate-pulse">Đang tải hồ sơ của bạn...</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Left Column: Personal Info & Avatar Settings */}
      <div className="lg:col-span-1 flex flex-col gap-8">
        {/* Profile Details Card */}
        <div className="bg-white border-4 border-on-surface shadow-[6px_6px_0px_0px_rgba(26,28,28,1)] rounded-3xl p-6 flex flex-col items-center relative">
          <div className="relative h-24 w-24 mb-4">
            {profile.activeAvatarFrame && (
              <div className="absolute inset-[-8px] rounded-full border-4 border-yellow-400 animate-spin-slow pointer-events-none" />
            )}
            <div className="h-full w-full rounded-full flex items-center justify-center text-3xl font-headline font-black bg-primary-fixed border-3 border-on-surface overflow-hidden">
              {avatar && PRESET_AVATARS[avatar] ? (
                <span className="text-5xl">{PRESET_AVATARS[avatar]}</span>
              ) : avatar ? (
                <img src={avatar} alt={username} className="h-full w-full object-cover" />
              ) : (
                <span>{profile.username.slice(0, 2).toUpperCase()}</span>
              )}
            </div>
          </div>

          <h2 className="text-2xl font-headline font-black text-on-surface uppercase truncate max-w-full">
            {profile.username}
          </h2>
          <span className="bg-primary text-on-primary font-headline font-black text-xs px-4 py-1 rounded-full border-2 border-on-surface shadow-[2px_2px_0px_0px_#1a1c1c] uppercase mt-2">
            🏆 {profile.rank} • {profile.eloPoints} ELO
          </span>

          <div className="w-full grid grid-cols-2 gap-4 mt-6 pt-6 border-t-4 border-dashed border-on-surface-variant">
            <div className="bg-surface-container-low border-2 border-on-surface rounded-xl p-3 text-center shadow-[2px_2px_0px_0px_rgba(26,28,28,1)]">
              <span className="text-[10px] font-headline font-black text-on-surface-variant uppercase block">Xu Tích Lũy</span>
              <span className="font-headline font-black text-primary text-lg">💰 {profile.coins}</span>
            </div>
            <div className="bg-surface-container-low border-2 border-on-surface rounded-xl p-3 text-center shadow-[2px_2px_0px_0px_rgba(26,28,28,1)]">
              <span className="text-[10px] font-headline font-black text-on-surface-variant uppercase block">Đá Quý (Gems)</span>
              <span className="font-headline font-black text-indigo-600 text-lg">💎 {profile.gems}</span>
            </div>
          </div>
        </div>

        {/* Edit Info Form */}
        <form onSubmit={handleUpdateProfile} className="bg-white border-4 border-on-surface shadow-[6px_6px_0px_0px_rgba(26,28,28,1)] rounded-3xl p-6 flex flex-col gap-4">
          <h3 className="text-lg font-headline font-black text-on-surface uppercase border-b-3 border-on-surface pb-2">
            Chỉnh Sửa Hồ Sơ
          </h3>

          {message && (
            <div className={`p-3 rounded-xl text-xs font-headline font-black text-center border-2 border-on-surface
              ${isError ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'}`}>
              {message}
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-headline font-black text-on-surface uppercase tracking-wider">Tên người chơi</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="bg-surface border-3 border-on-surface rounded-xl px-3 py-2 text-xs text-on-surface font-bold focus:outline-none focus:bg-white shadow-[2px_2px_0px_0px_rgba(26,28,28,1)]"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs font-headline font-black text-on-surface uppercase tracking-wider">Chọn Avatar Mặc Định</label>
            <div className="grid grid-cols-6 gap-2">
              {Object.keys(PRESET_AVATARS).map((key) => (
                <button
                  type="button"
                  key={key}
                  onClick={() => setAvatar(key)}
                  className={`h-10 border-2 border-on-surface rounded-lg flex items-center justify-center text-xl transition-all shadow-[1px_1px_0px_0px_#1a1c1c]
                    ${avatar === key ? 'bg-primary-container text-on-primary-container scale-110 border-dashed' : 'bg-surface hover:bg-slate-100'}`}
                >
                  {PRESET_AVATARS[key]}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-2 mt-2">
            <label className="text-xs font-headline font-black text-on-surface uppercase tracking-wider">Hoặc Tải Lên Ảnh Avatar</label>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="text-xs text-on-surface-variant font-bold file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-2 file:border-on-surface file:text-xs file:font-headline file:font-black file:bg-surface file:text-on-surface file:cursor-pointer hover:file:bg-slate-100"
            />
          </div>

          <button type="submit" className="btn-detonator w-full mt-2 py-3 rounded-2xl font-headline font-black uppercase text-sm">
            Lưu Thay Đổi 🛡️
          </button>
        </form>
      </div>

      {/* Right Column: Statistics & Match History */}
      <div className="lg:col-span-2 flex flex-col gap-8">
        {/* Statistics Grid */}
        <div className="bg-white border-4 border-on-surface shadow-[6px_6px_0px_0px_rgba(26,28,28,1)] rounded-3xl p-6 flex flex-col gap-6">
          <h3 className="text-lg font-headline font-black text-on-surface uppercase border-b-3 border-on-surface pb-2">
            Thống Kê Trận Đấu
          </h3>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-surface-container border-2 border-on-surface rounded-2xl p-4 text-center shadow-[3px_3px_0px_0px_rgba(26,28,28,1)]">
              <span className="text-[10px] font-headline font-black text-on-surface-variant uppercase block">Tổng Số Trận</span>
              <span className="font-headline font-black text-2xl text-on-surface">{profile.stats.totalGames}</span>
            </div>
            <div className="bg-emerald-100 border-2 border-on-surface rounded-2xl p-4 text-center shadow-[3px_3px_0px_0px_rgba(26,28,28,1)]">
              <span className="text-[10px] font-headline font-black text-emerald-800 uppercase block">Số Trận Thắng</span>
              <span className="font-headline font-black text-2xl text-emerald-700">{profile.stats.wins}</span>
            </div>
            <div className="bg-rose-100 border-2 border-on-surface rounded-2xl p-4 text-center shadow-[3px_3px_0px_0px_rgba(26,28,28,1)]">
              <span className="text-[10px] font-headline font-black text-rose-800 uppercase block">Số Trận Thua</span>
              <span className="font-headline font-black text-2xl text-rose-700">{profile.stats.losses}</span>
            </div>
            <div className="bg-orange-100 border-2 border-on-surface rounded-2xl p-4 text-center shadow-[3px_3px_0px_0px_rgba(26,28,28,1)]">
              <span className="text-[10px] font-headline font-black text-orange-800 uppercase block">Chuỗi Thắng Lớn</span>
              <span className="font-headline font-black text-2xl text-orange-700">🔥 {profile.stats.longestStreak}</span>
            </div>
          </div>
        </div>

        {/* Match History */}
        <div className="bg-white border-4 border-on-surface shadow-[6px_6px_0px_0px_rgba(26,28,28,1)] rounded-3xl p-6 flex flex-col gap-6">
          <h3 className="text-lg font-headline font-black text-on-surface uppercase border-b-3 border-on-surface pb-2">
            Lịch Sử Đấu Gần Đây
          </h3>

          <div className="flex flex-col gap-4">
            {history.length === 0 ? (
              <p className="text-center text-sm font-bold text-on-surface-variant py-8">
                Bạn chưa tham gia trận đấu nào. Vào phòng đấu ngay!
              </p>
            ) : (
              history.map((game) => {
                const myRank = game.players.find(p => p.userId === profile._id);
                const isWinner = myRank?.rank === 1;
                return (
                  <div key={game._id} className="border-3 border-on-surface rounded-2xl p-4 flex justify-between items-center shadow-[2px_2px_0px_0px_rgba(26,28,28,1)] bg-surface">
                    <div className="flex flex-col gap-1">
                      <span className="font-headline font-black text-sm uppercase">
                        Trận Đấu #{game._id.slice(-6).toUpperCase()}
                      </span>
                      <span className="text-[10px] text-on-surface-variant font-bold">
                        Đã chơi: {new Date(game.playedAt).toLocaleString()}
                      </span>
                    </div>
                    <span className={`px-4 py-1.5 rounded-full border-2 border-on-surface font-headline font-black text-xs uppercase shadow-[1.5px_1.5px_0px_0px_#1a1c1c]
                      ${isWinner ? 'bg-emerald-400 text-slate-950' : 'bg-rose-400 text-slate-950'}`}>
                      {isWinner ? 'Thắng (Hạng 1)' : `Thua (Hạng ${myRank?.rank ?? '?'})`}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
