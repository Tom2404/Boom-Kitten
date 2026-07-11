import React, { useEffect, useRef, useState } from 'react';
import { useAdminApi } from './useAdminApi.js';
import { Alert, Button, DataTable, EmptyState, Field, inputClass, Pagination, SectionHeader, SkeletonBlock, StatusBadge, Toolbar } from './ui.jsx';
import { formatNumber } from './utils.js';
import goldCoinIcon from '../../assets/currencies/goldcoin.png';
import pinkCoinIcon from '../../assets/currencies/pinkcoin.png';
import { PRESET_AVATARS } from '../../components/PlayerAvatar.jsx';

const defaultModal = { type: null, player: null, currency: 'coin', operation: 'add', amount: 0, elo: 1000, status: 'banned', role: 'user', reason: '' };

export default function PlayersPanel({ onNavigate, language = 'vi' }) {
  const en = language === 'en';
  const { request } = useAdminApi();
  const [players, setPlayers] = useState([]);
  const [search, setSearch] = useState('');
  const [role, setRole] = useState('');
  const [status, setStatus] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [selected, setSelected] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ tone: '', text: '' });
  const [modal, setModal] = useState(defaultModal);

  const loadPlayers = async () => {
    setLoading(true);
    const query = new URLSearchParams({ page, limit: 10, search, role, status, sortBy, sortOrder });
    const res = await request(`/api/admin/users?${query}`);
    if (res.ok && res.data?.success) {
      setPlayers(res.data.data.users || []);
      setTotalPages(res.data.data.pagination?.totalPages || 1);
    } else {
      setMessage({ tone: 'danger', text: res.data?.message || res.error || 'Không thể tải danh sách người chơi.' });
    }
    setLoading(false);
  };

  useEffect(() => {
    const timer = setTimeout(loadPlayers, 250);
    return () => clearTimeout(timer);
  }, [page, search, role, status, sortBy, sortOrder, request]);

  useEffect(() => {
    setSelected((current) => current.filter((id) => players.some((player) => player._id === id)));
  }, [players]);

  const resetFilters = () => {
    setSearch('');
    setRole('');
    setStatus('');
    setSortBy('createdAt');
    setSortOrder('desc');
    setPage(1);
  };

  const toggleSelected = (playerId) => {
    setSelected((current) => current.includes(playerId) ? current.filter((id) => id !== playerId) : [...current, playerId]);
  };

  const exportPlayers = () => {
    const rows = selected.length ? players.filter((player) => selected.includes(player._id)) : players;
    if (!rows.length) return;
    const quote = (value) => `"${String(value ?? '').replaceAll('"', '""')}"`;
    const csv = [
      ['username', 'email', 'role', 'status', 'rank', 'elo', 'gold', 'pink'],
      ...rows.map((player) => [player.username, player.email, player.role, player.isBanned ? 'banned' : 'active', player.rank, player.eloPoints, player.coins, player.gems]),
    ].map((row) => row.map(quote).join(',')).join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `boom-kitten-users-page-${page}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    setMessage({ tone: 'success', text: `Đã xuất ${rows.length} người chơi.` });
  };

  const openModal = (type, player, extra = {}) => {
    setMessage({ tone: '', text: '' });
    setModal({
      ...defaultModal,
      type,
      player,
      role: player.role === 'admin' ? 'user' : 'admin',
      status: player.isBanned ? 'active' : 'banned',
      elo: player.eloPoints || 1000,
      ...extra,
    });
  };

  const closeModal = () => setModal(defaultModal);

  const submitModal = async (event) => {
    event.preventDefault();
    if (!modal.player) return;
    let endpoint = '';
    let body = {};

    if (modal.type === 'currency') {
      if (!modal.reason.trim()) return setMessage({ tone: 'danger', text: 'Lý do điều chỉnh số dư là bắt buộc.' });
      endpoint = `/api/admin/users/${modal.player._id}/currency`;
      body = { currency: modal.currency, amount: Number(modal.amount), operation: modal.operation, reason: modal.reason };
    }
    if (modal.type === 'elo') {
      if (!modal.reason.trim()) return setMessage({ tone: 'danger', text: 'Lý do điều chỉnh ELO là bắt buộc.' });
      endpoint = `/api/admin/users/${modal.player._id}/elo`;
      body = { elo: Number(modal.elo), reason: modal.reason };
    }
    if (modal.type === 'status') {
      endpoint = `/api/admin/users/${modal.player._id}/status`;
      body = { status: modal.status, reason: modal.reason };
    }
    if (modal.type === 'role') {
      endpoint = `/api/admin/users/${modal.player._id}/role`;
      body = { role: modal.role };
    }

    const res = await request(endpoint, { method: 'PATCH', body: JSON.stringify(body) });
    if (res.ok) {
      setMessage({ tone: 'success', text: `Đã cập nhật ${modal.player.username}.` });
      closeModal();
      loadPlayers();
    } else {
      setMessage({ tone: 'danger', text: res.data?.message || res.error || 'Thao tác thất bại.' });
    }
  };

  return (
    <div className="flex flex-col gap-5">
      <SectionHeader title={en ? 'Player management' : 'Quản lý người chơi'} description={en ? 'Search, filter, and manage wallets, ELO, roles, and account status.' : 'Tìm kiếm, lọc, điều chỉnh ví, ELO, vai trò và trạng thái tài khoản.'} />
      {message.text && <Alert tone={message.tone}>{message.text}</Alert>}

      <div className="flex flex-wrap gap-2" aria-label="Tác vụ nhanh">
        <Button variant="secondary" onClick={() => onNavigate?.('announcements')}>📢 {en ? 'Broadcast' : 'Thông báo'}</Button>
        <Button variant="secondary" onClick={() => onNavigate?.('seasons')}>🏆 {en ? 'Create Season' : 'Tạo mùa giải'}</Button>
        <Button variant="secondary" onClick={exportPlayers}>⇩ Export {selected.length ? `(${selected.length})` : 'Page'}</Button>
        <Button variant="secondary" className="bg-[var(--pop-amber)]" disabled={selected.length !== 1} onClick={() => openModal('currency', players.find((player) => player._id === selected[0]), { currency: 'coin' })}>🪙 {en ? 'Grant Currency' : 'Cấp tiền'}</Button>
        <Button variant="danger" onClick={() => onNavigate?.('seasons')}>⚠ {en ? 'Reset Season' : 'Reset mùa'}</Button>
      </div>

      <Toolbar>
        <Field label={en ? 'Search' : 'Tìm kiếm'} >
          <input className={`${inputClass} md:min-w-64`} type="search" value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} placeholder="Username" />
        </Field>
        <Field label={en ? 'Role' : 'Vai trò'}>
          <select className={inputClass} value={role} onChange={(event) => { setRole(event.target.value); setPage(1); }}>
            <option value="">{en ? 'All' : 'Tất cả'}</option>
            <option value="user">User</option>
            <option value="admin">Admin</option>
          </select>
        </Field>
        <Field label={en ? 'Status' : 'Trạng thái'}>
          <select className={inputClass} value={status} onChange={(event) => { setStatus(event.target.value); setPage(1); }}>
            <option value="">{en ? 'All' : 'Tất cả'}</option>
            <option value="active">Active</option>
            <option value="banned">Banned</option>
          </select>
        </Field>
        <Field label={en ? 'Sort by' : 'Sắp xếp'}>
          <select className={inputClass} value={sortBy} onChange={(event) => { setSortBy(event.target.value); setPage(1); }}>
            <option value="createdAt">{en ? 'Created date' : 'Ngày tạo'}</option>
            <option value="username">Username</option>
            <option value="eloPoints">ELO</option>
            <option value="coins">Gold</option>
            <option value="gems">Pink</option>
          </select>
        </Field>
        <Field label={en ? 'Order' : 'Thứ tự'}>
          <select className={inputClass} value={sortOrder} onChange={(event) => { setSortOrder(event.target.value); setPage(1); }}>
            <option value="desc">{en ? 'Descending' : 'Giảm dần'}</option>
            <option value="asc">{en ? 'Ascending' : 'Tăng dần'}</option>
          </select>
        </Field>
        <Button type="button" variant="primary" onClick={() => loadPlayers()}>Search</Button>
        <Button type="button" variant="secondary" onClick={resetFilters}>Reset</Button>
      </Toolbar>

      {loading ? <SkeletonBlock rows={5} /> : players.length === 0 ? (
        <EmptyState title={en ? 'No players found' : 'Không tìm thấy người chơi'} description={en ? 'Try another keyword or filter.' : 'Thử đổi từ khóa hoặc bộ lọc.'} />
      ) : (
        <>
          <div className="hidden lg:block">
            <DataTable fit columnWidths={['5%', '25%', '10%', '11%', '13%', '14%', '14%', '8%']} columns={en ? ['Select', 'Player', 'Role', 'Status', 'Rank / ELO', 'Economy', 'Manage', 'Ban'] : ['Chọn', 'Player', 'Vai trò', 'Trạng thái', 'Rank / ELO', 'Economy', 'Manage', 'Ban']}>
              {players.map((player) => (
                <tr key={player._id}>
                  <td className="px-3 py-3"><input className="h-5 w-5 accent-[#2563eb]" type="checkbox" aria-label={`Chọn ${player.username}`} checked={selected.includes(player._id)} onChange={() => toggleSelected(player._id)} /></td>
                  <td className="px-2 py-2"><div className="flex min-w-0 items-center gap-2">
                    <AdminAvatar avatar={player.avatar} username={player.username} />
                    <span className="min-w-0"><strong className="block truncate text-[var(--pop-black)]">{player.username}</strong><small className="block truncate text-xs text-[#76574a]">{player.email}</small></span>
                  </div></td>
                  <td className="px-2 py-2"><StatusBadge tone={player.role === 'admin' ? 'warning' : 'neutral'}>{player.role}</StatusBadge></td>
                  <td className="px-2 py-2"><StatusBadge tone={player.isBanned ? 'danger' : 'success'}>{player.isBanned ? 'Banned' : 'Active'}</StatusBadge></td>
                  <td className="px-2 py-2"><StatusBadge tone="warning">{player.rank || 'Bronze II'}</StatusBadge><span className="mt-1 block font-black text-[#2563eb]">{formatNumber(player.eloPoints || 1000)}</span></td>
                  <td className="px-2 py-2"><span className="flex items-center gap-1 font-black text-[#8a5a00]"><img src={goldCoinIcon} alt="GoldCoin" className="h-6 w-6 shrink-0 object-contain mix-blend-multiply" />{formatNumber(player.coins)}</span><span className="mt-1 flex items-center gap-1 font-black text-[#be185d]"><img src={pinkCoinIcon} alt="PinkCoin" className="h-6 w-6 shrink-0 object-contain mix-blend-multiply" />{formatNumber(player.gems)}</span></td>
                  <td className="px-2 py-2"><label className="sr-only" htmlFor={`manage-${player._id}`}>Manage {player.username}</label><select id={`manage-${player._id}`} className={`${inputClass} min-h-10 px-2`} defaultValue="" onChange={(event) => { const type = event.target.value; event.target.value = ''; if (type) openModal(type, player); }}><option value="">Manage…</option><option value="currency">Currency</option><option value="elo">ELO</option><option value="role">Role</option></select></td>
                  <td className="px-2 py-2"><Button className="w-full px-1" variant={player.isBanned ? 'success' : 'danger'} onClick={() => openModal('status', player)}>{player.isBanned ? 'Unban' : 'Ban'}</Button></td>
                </tr>
              ))}
            </DataTable>
          </div>

          <div className="grid gap-3 lg:hidden">
            {players.map((player) => (
              <article key={player._id} className="border-[3px] border-[var(--pop-black)] bg-[#fffdf5] p-4 shadow-[4px_4px_0_var(--pop-black)]">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <input className="h-5 w-5 shrink-0 accent-[#2563eb]" type="checkbox" aria-label={`Chọn ${player.username}`} checked={selected.includes(player._id)} onChange={() => toggleSelected(player._id)} />
                    <AdminAvatar avatar={player.avatar} username={player.username} className="h-10 w-10" />
                    <div className="min-w-0">
                      <h3 className="truncate font-pop-display font-black text-[var(--pop-black)]">{player.username}</h3>
                      <p className="truncate font-sans text-sm font-semibold text-[#76574a]">{player.email}</p>
                    </div>
                  </div>
                  <StatusBadge tone={player.isBanned ? 'danger' : 'success'}>{player.isBanned ? 'Banned' : 'Active'}</StatusBadge>
                </div>
                <dl className="mt-3 grid grid-cols-2 gap-2 text-sm font-semibold text-slate-600">
                  <div><dt className="text-xs uppercase text-slate-400">Ví</dt><dd className="mt-1 flex items-center gap-2"><span className="flex items-center gap-1"><img src={goldCoinIcon} alt="GoldCoin" className="h-5 w-5 object-contain mix-blend-multiply" />{formatNumber(player.coins)}</span><span className="flex items-center gap-1"><img src={pinkCoinIcon} alt="PinkCoin" className="h-5 w-5 object-contain mix-blend-multiply" />{formatNumber(player.gems)}</span></dd></div>
                  <div><dt className="text-xs uppercase text-slate-400">ELO</dt><dd>{formatNumber(player.eloPoints || 1000)}</dd></div>
                </dl>
                <div className="mt-3 flex gap-2">
                  <select aria-label={`Manage ${player.username}`} className={inputClass} defaultValue="" onChange={(event) => { const type = event.target.value; event.target.value = ''; if (type) openModal(type, player); }}><option value="">Manage…</option><option value="currency">Currency</option><option value="elo">ELO</option><option value="role">Role</option></select>
                  <Button variant={player.isBanned ? 'success' : 'danger'} onClick={() => openModal('status', player)}>{player.isBanned ? 'Unban' : 'Ban'}</Button>
                </div>
              </article>
            ))}
          </div>
        </>
      )}

      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
      <PlayerModal modal={modal} setModal={setModal} onClose={closeModal} onSubmit={submitModal} language={language} />
    </div>
  );
}

function AdminAvatar({ avatar, username, className = 'h-9 w-9' }) {
  const [imageFailed, setImageFailed] = useState(false);

  useEffect(() => {
    setImageFailed(false);
  }, [avatar]);

  const sharedClass = `${className} grid shrink-0 place-items-center overflow-hidden border-[3px] border-[var(--pop-black)] bg-[var(--pop-amber)] font-black`;

  if (avatar && PRESET_AVATARS[avatar]) {
    return <span className={`${sharedClass} text-xl`} role="img" aria-label={`${username} avatar`}>{PRESET_AVATARS[avatar]}</span>;
  }

  if (avatar && !imageFailed) {
    return (
      <span className={sharedClass}>
        <img src={avatar} alt={`${username} avatar`} className="h-full w-full bg-white object-cover" onError={() => setImageFailed(true)} />
      </span>
    );
  }

  return <span aria-hidden="true" className={sharedClass}>{username?.slice(0, 1).toUpperCase() || '?'}</span>;
}

function PlayerModal({ modal, setModal, onClose, onSubmit, language = 'vi' }) {
  const dialogRef = useRef(null);
  const en = language === 'en';

  useEffect(() => {
    if (!modal.type) return undefined;
    const previousFocus = document.activeElement;
    const dialog = dialogRef.current;
    const focusable = dialog?.querySelectorAll('button, input, select, textarea, [tabindex]:not([tabindex="-1"])');
    focusable?.[0]?.focus();
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') onClose();
      if (event.key !== 'Tab' || !focusable?.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      previousFocus?.focus?.();
    };
  }, [modal.type]);

  if (!modal.type || !modal.player) return null;
  const titleMap = en
    ? { currency: 'Adjust balance', elo: 'Update ELO', status: 'Change status', role: 'Change role' }
    : { currency: 'Điều chỉnh số dư', elo: 'Cập nhật ELO', status: 'Đổi trạng thái', role: 'Đổi vai trò' };
  const currentBalance = modal.currency === 'gem' ? modal.player.gems || 0 : modal.player.coins || 0;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/60 p-4" role="dialog" aria-modal="true" aria-labelledby="player-modal-title">
      <form ref={dialogRef} onSubmit={onSubmit} className="w-full max-w-md border-[4px] border-[var(--pop-black)] bg-[#fff7df] p-5 shadow-[8px_8px_0_var(--pop-black)]">
        <h2 id="player-modal-title" className="font-pop-display text-lg font-black text-slate-950">{titleMap[modal.type]}: {modal.player.username}</h2>
        <div className="mt-4 grid gap-3">
          {modal.type === 'currency' && (
            <>
              <fieldset>
                <legend className="mb-2 text-sm font-bold">{en ? 'Wallet type' : 'Loại ví'}</legend>
                <div className="grid grid-cols-2 gap-3">
                  <RadioCard name="currency" value="coin" checked={modal.currency === 'coin'} onChange={() => setModal({ ...modal, currency: 'coin' })} icon={goldCoinIcon} label="GoldCoin" detail={`${formatNumber(modal.player.coins)} Gold`} tone="gold" />
                  <RadioCard name="currency" value="gem" checked={modal.currency === 'gem'} onChange={() => setModal({ ...modal, currency: 'gem' })} icon={pinkCoinIcon} label="PinkCoin" detail={`${formatNumber(modal.player.gems)} Pink`} tone="pink" />
                </div>
              </fieldset>
              <fieldset>
                <legend className="mb-2 text-sm font-bold">{en ? 'Operation' : 'Hành động'}</legend>
                <div className="grid grid-cols-3 gap-2">
                  <RadioCard name="operation" value="add" checked={modal.operation === 'add'} onChange={() => setModal({ ...modal, operation: 'add' })} symbol="+" label={en ? 'Add' : 'Cộng'} tone="success" />
                  <RadioCard name="operation" value="subtract" checked={modal.operation === 'subtract'} onChange={() => setModal({ ...modal, operation: 'subtract' })} symbol="−" label={en ? 'Subtract' : 'Trừ'} tone="danger" />
                  <RadioCard name="operation" value="set" checked={modal.operation === 'set'} onChange={() => setModal({ ...modal, operation: 'set' })} symbol="=" label={en ? 'Set' : 'Đặt'} tone="info" />
                </div>
              </fieldset>
              <div className="grid grid-cols-[1fr_auto] items-end gap-3">
                <Field label={en ? 'Amount' : 'Số lượng'}><input className={inputClass} type="number" min="0" value={modal.amount} onChange={(event) => setModal({ ...modal, amount: event.target.value })} /></Field>
                <div className="border-[3px] border-[var(--pop-black)] bg-[#f5e7c8] px-3 py-2 text-right shadow-[2px_2px_0_var(--pop-black)]">
                  <span className="block text-[10px] font-black uppercase text-[#76574a]">{en ? 'Current' : 'Hiện tại'}</span>
                  <strong>{formatNumber(currentBalance)}</strong>
                </div>
              </div>
            </>
          )}
          {modal.type === 'elo' && <Field label="ELO mới"><input className={inputClass} type="number" min="0" value={modal.elo} onChange={(event) => setModal({ ...modal, elo: event.target.value })} /></Field>}
          {modal.type === 'status' && (
            <Field label="Trạng thái mới">
              <select className={inputClass} value={modal.status} onChange={(event) => setModal({ ...modal, status: event.target.value })}>
                <option value="active">Active</option>
                <option value="banned">Banned</option>
                <option value="suspended">Suspended</option>
              </select>
            </Field>
          )}
          {modal.type === 'role' && (
            <>
              <Alert tone="warning">Cấp quyền Admin cho tài khoản này sẽ mở toàn bộ quyền truy cập dashboard.</Alert>
              <Field label="Vai trò mới">
                <select className={inputClass} value={modal.role} onChange={(event) => setModal({ ...modal, role: event.target.value })}>
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
              </Field>
            </>
          )}
          {modal.type !== 'role' && <Field label="Lý do ghi audit"><input className={inputClass} value={modal.reason} onChange={(event) => setModal({ ...modal, reason: event.target.value })} placeholder="Ghi rõ lý do thao tác" /></Field>}
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>Hủy</Button>
          <Button type="submit" variant={modal.type === 'status' ? 'danger' : 'primary'}>Xác nhận</Button>
        </div>
      </form>
    </div>
  );
}

function RadioCard({ name, value, checked, onChange, icon, symbol, label, detail, tone = 'info' }) {
  const tones = {
    gold: 'bg-[#fff1b8]',
    pink: 'bg-[#fce7f3]',
    success: 'bg-[#dcfce7]',
    danger: 'bg-[#fee2e2]',
    info: 'bg-[#dbeafe]',
  };

  return (
    <label className={`relative flex min-h-16 cursor-pointer items-center gap-2 border-[3px] border-[var(--pop-black)] p-2 transition ${checked ? `${tones[tone]} -translate-x-0.5 -translate-y-0.5 shadow-[4px_4px_0_var(--pop-black)]` : 'bg-[#fffdf5] hover:bg-[#f5e7c8]'}`}>
      <input className="sr-only" type="radio" name={name} value={value} checked={checked} onChange={onChange} />
      {icon && <img src={icon} alt="" className="h-9 w-9 shrink-0 object-contain mix-blend-multiply" />}
      {symbol && <span aria-hidden="true" className="grid h-8 w-8 shrink-0 place-items-center border-2 border-[var(--pop-black)] bg-white text-xl font-black">{symbol}</span>}
      <span className="min-w-0"><strong className="block text-sm">{label}</strong>{detail && <small className="block truncate text-xs text-[#76574a]">{detail}</small>}</span>
      <span aria-hidden="true" className={`absolute right-2 top-2 h-3 w-3 border-2 border-[var(--pop-black)] ${checked ? 'bg-[#2563eb]' : 'bg-white'}`} />
    </label>
  );
}
