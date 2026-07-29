import React, { useEffect, useRef, useState } from 'react';
import { useAdminApi } from './useAdminApi.js';
import { Alert, Button, DataTable, EmptyState, Field, inputClass, Pagination, SectionHeader, SkeletonBlock, StatusBadge, Toolbar } from './ui.jsx';
import { formatNumber } from './utils.js';
import goldCoinIcon from '../../assets/currencies/goldcoin.png';
import { PRESET_AVATARS } from '../../components/PlayerAvatar.jsx';
import { buildRoleChangePayload, createAdminOperationRequestId } from './adminMutation.js';
import PlayerDetailDrawer from './PlayerDetailDrawer.jsx';
import { calculatePlayerAdjustmentPreview } from './playerAdjustment.js';
import SavedViewsBar from './SavedViewsBar.jsx';
import UserCrudDialog from './UserCrudDialog.jsx';

const defaultModal = { type: null, player: null, currency: 'coin', operation: 'add', amount: 0, status: 'banned', role: 'user', reason: '', confirmationUsername: '', requestId: '' };

export default function PlayersPanel({ onNavigate, language = 'vi', permissions = [], adminUsername = '', policy = {} }) {
  const en = language === 'en';
  const { request } = useAdminApi();
  const hasPermission = (permission) => permissions.includes(permission);
  const canManagePlayer = hasPermission('economy.adjust') || hasPermission('players.role.write');
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
  const [submitting, setSubmitting] = useState(false);
  const [detailPlayerId, setDetailPlayerId] = useState(() => typeof window === 'undefined' ? null : new URLSearchParams(window.location.search).get('playerId'));
  const [detailRefresh, setDetailRefresh] = useState(0);
  const [userCrud, setUserCrud] = useState({ mode: null, user: null });

  const loadPlayers = async () => {
    setLoading(true);
    const query = new URLSearchParams({ page, limit: 10, search, role, status, sortBy, sortOrder });
    const res = await request(`/api/admin/users?${query}`);
    if (res.ok && res.data?.success) {
      setPlayers(res.data.data.users || []);
      setTotalPages(res.data.data.pagination?.totalPages || 1);
    } else {
      setMessage({ tone: 'danger', text: res.data?.error?.message || res.data?.message || res.error || 'Không thể tải danh sách người chơi.' });
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
    setSelected((current) => current.includes(playerId) ? [] : [playerId]);
  };

  const openModal = (type, player, extra = {}) => {
    setMessage({ tone: '', text: '' });
    setModal({
      ...defaultModal,
      type,
      player,
      role: player.role === 'user' ? 'admin' : player.role,
      status: player.isBanned ? 'active' : 'banned',
      requestId: createAdminOperationRequestId(),
      ...extra,
    });
  };

  const closeModal = () => setModal(defaultModal);

  const openPlayerDetail = (playerId) => {
    setDetailPlayerId(playerId);
    const url = new URL(window.location.href);
    url.searchParams.set('playerId', playerId);
    if (!url.searchParams.get('playerTab')) url.searchParams.set('playerTab', 'profile');
    window.history.replaceState({}, '', url);
  };

  const closePlayerDetail = () => {
    setDetailPlayerId(null);
    const url = new URL(window.location.href);
    url.searchParams.delete('playerId');
    url.searchParams.delete('playerTab');
    window.history.replaceState({}, '', url);
  };

  const submitModal = async (event) => {
    event.preventDefault();
    if (!modal.player) return;
    let endpoint = '';
    let body = {};

    if (modal.type === 'currency') {
      if (!modal.reason.trim()) return setMessage({ tone: 'danger', text: 'Lý do điều chỉnh số dư là bắt buộc.' });
      endpoint = `/api/admin/users/${modal.player._id}/currency`;
      body = { currency: modal.currency, amount: Number(modal.amount), operation: modal.operation, reason: modal.reason, requestId: modal.requestId };
    }
    if (modal.type === 'status') {
      if (!modal.reason.trim()) return setMessage({ tone: 'danger', text: 'Lý do đổi trạng thái là bắt buộc.' });
      endpoint = `/api/admin/users/${modal.player._id}/status`;
      body = { status: modal.status, reason: modal.reason, requestId: modal.requestId };
    }
    if (modal.type === 'role') {
      if (!modal.reason.trim()) return setMessage({ tone: 'danger', text: 'Lý do đổi vai trò là bắt buộc.' });
      if (modal.confirmationUsername.trim() !== adminUsername) return setMessage({ tone: 'danger', text: 'Username xác nhận không khớp tài khoản quản trị hiện tại.' });
      endpoint = `/api/admin/users/${modal.player._id}/role`;
      body = buildRoleChangePayload(modal);
    }

    setSubmitting(true);
    const res = await request(endpoint, { method: 'PATCH', body: JSON.stringify(body) });
    setSubmitting(false);
    if (res.ok) {
      setMessage({ tone: 'success', text: `Đã cập nhật ${modal.player.username}.` });
      closeModal();
      loadPlayers();
      setDetailRefresh((value) => value + 1);
    } else {
      setMessage({ tone: 'danger', text: res.data?.error?.message || res.data?.message || res.error || 'Thao tác thất bại.' });
    }
  };

  return (
    <div className="flex flex-col gap-5">
      <SectionHeader title={en ? 'Player management' : 'Quản lý người chơi'} description={en ? 'Search, filter, and manage Coin wallets, roles, and account status.' : 'Tìm kiếm, lọc, điều chỉnh ví Coin, vai trò và trạng thái tài khoản.'} />
      {message.text && <Alert tone={message.tone}>{message.text}</Alert>}
      <SavedViewsBar scope="players" language={language} filters={{ search, role, status, sortBy, sortOrder }} onApply={(saved) => { setSearch(saved.search || ''); setRole(saved.role || ''); setStatus(saved.status || ''); setSortBy(saved.sortBy || 'createdAt'); setSortOrder(saved.sortOrder || 'desc'); setPage(1); }} />

      {(hasPermission('players.create') || hasPermission('economy.adjust')) && (
        <div className="flex flex-wrap gap-2" aria-label={en ? 'Quick actions' : 'Tác vụ nhanh'}>
          {hasPermission('players.create') && <Button variant="primary" onClick={() => setUserCrud({ mode: 'create', user: null })}><span className="material-symbols-outlined mr-1 text-lg" aria-hidden="true">person_add</span>{en ? 'Create user' : 'Tạo người dùng'}</Button>}
          <Button variant="secondary" className="bg-[var(--admin-warning-bg)]" disabled={selected.length !== 1} onClick={() => openModal('currency', players.find((player) => player._id === selected[0]), { currency: 'coin' })}><span className="material-symbols-outlined mr-1 text-lg" aria-hidden="true">paid</span>{en ? 'Adjust Coin' : 'Điều chỉnh Coin'}</Button>
        </div>
      )}

      <Toolbar>
        <Field label={en ? 'Search' : 'Tìm kiếm'} >
          <input className={`${inputClass} md:min-w-64`} type="search" value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} placeholder="Username" />
        </Field>
        <Field label={en ? 'Role' : 'Vai trò'}>
          <select className={inputClass} value={role} onChange={(event) => { setRole(event.target.value); setPage(1); }}>
            <option value="">{en ? 'All' : 'Tất cả'}</option>
            <option value="user">User</option>
            <option value="admin">Admin</option>
            <option value="super_admin">Super admin</option>
          </select>
        </Field>
        <Field label={en ? 'Status' : 'Trạng thái'}>
          <select className={inputClass} value={status} onChange={(event) => { setStatus(event.target.value); setPage(1); }}>
            <option value="">{en ? 'All' : 'Tất cả'}</option>
            <option value="active">Active</option>
            <option value="banned">Banned</option>
            <option value="deleted">{en ? 'Deleted' : 'Đã xóa'}</option>
          </select>
        </Field>
        <Field label={en ? 'Sort by' : 'Sắp xếp'}>
          <select className={inputClass} value={sortBy} onChange={(event) => { setSortBy(event.target.value); setPage(1); }}>
            <option value="createdAt">{en ? 'Created date' : 'Ngày tạo'}</option>
            <option value="username">Username</option>
            <option value="coins">Coin</option>
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
            <DataTable fit columnWidths={['5%', '30%', '12%', '12%', '15%', '16%', '10%']} columns={en ? ['Select', 'Player', 'Role', 'Status', 'Coin wallet', 'Manage', 'Ban'] : ['Chọn', 'Player', 'Vai trò', 'Trạng thái', 'Ví Coin', 'Quản lý', 'Khóa']}>
              {players.map((player) => (
                <tr key={player._id}>
                  <td className="px-3 py-3"><input className="h-5 w-5 accent-[var(--admin-accent)]" type="radio" name="selected-player" aria-label={`Chọn ${player.username}`} checked={selected.includes(player._id)} onChange={() => toggleSelected(player._id)} /></td>
                  <td className="px-2 py-2"><div className="flex min-w-0 items-center gap-2">
                    <AdminAvatar avatar={player.avatar} username={player.username} />
                    <span className="min-w-0"><button type="button" className="block max-w-full truncate font-semibold text-[var(--admin-accent)] underline decoration-1 underline-offset-2 hover:text-[var(--admin-accent-hover)]" onClick={() => openPlayerDetail(player._id)}>{player.username}</button><small className="block truncate text-xs text-[var(--admin-text-muted)]">{player.email}</small></span>
                  </div></td>
                  <td className="px-2 py-2"><StatusBadge tone={player.role === 'admin' ? 'warning' : 'neutral'}>{player.role}</StatusBadge></td>
                  <td className="px-2 py-2"><StatusBadge tone={player.isBanned ? 'danger' : 'success'}>{player.isBanned ? 'Banned' : 'Active'}</StatusBadge></td>
                  <td className="px-2 py-2"><span className="flex items-center gap-1 font-semibold text-[var(--admin-warning-text)]"><img src={goldCoinIcon} alt="Coin" className="h-6 w-6 shrink-0 object-contain mix-blend-multiply" />{formatNumber(player.coins)}</span></td>
                  <td className="px-2 py-2">{canManagePlayer ? <><label className="sr-only" htmlFor={`manage-${player._id}`}>Manage {player.username}</label><select id={`manage-${player._id}`} className={`${inputClass} min-h-10 px-2`} defaultValue="" onChange={(event) => { const type = event.target.value; event.target.value = ''; if (!type) return; if (type === 'edit' || type === 'delete') setUserCrud({ mode: type, user: player }); else openModal(type, player); }}><option value="">Manage…</option>{hasPermission('players.update') && <option value="edit">Edit profile</option>}{hasPermission('economy.adjust') && <option value="currency">Coin</option>}{hasPermission('players.role.write') && <option value="role">Role</option>}{hasPermission('players.delete') && <option value="delete">Soft delete</option>}</select></> : <span aria-label="Read only">—</span>}</td>
                  <td className="px-2 py-2">{hasPermission('players.status.write') ? <Button className="w-full px-1" variant={player.isBanned ? 'success' : 'danger'} onClick={() => openModal('status', player)}>{player.isBanned ? 'Unban' : 'Ban'}</Button> : <span aria-label="Read only">—</span>}</td>
                </tr>
              ))}
            </DataTable>
          </div>

          <div className="grid gap-3 lg:hidden">
            {players.map((player) => (
              <article key={player._id} className="rounded-xl border border-[var(--admin-border)] bg-[var(--admin-surface)] p-4 shadow-[0_1px_2px_rgba(32,35,31,0.03)]">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <input className="h-5 w-5 shrink-0 accent-[var(--admin-accent)]" type="radio" name="selected-player-mobile" aria-label={`Chọn ${player.username}`} checked={selected.includes(player._id)} onChange={() => toggleSelected(player._id)} />
                    <AdminAvatar avatar={player.avatar} username={player.username} className="h-10 w-10" />
                    <div className="min-w-0">
                      <button type="button" className="block max-w-full truncate text-left font-semibold text-[var(--admin-accent)] underline decoration-1 underline-offset-2" onClick={() => openPlayerDetail(player._id)}>{player.username}</button>
                      <p className="truncate font-sans text-sm font-semibold text-[var(--admin-text-muted)]">{player.email}</p>
                    </div>
                  </div>
                  <StatusBadge tone={player.isBanned ? 'danger' : 'success'}>{player.isBanned ? 'Banned' : 'Active'}</StatusBadge>
                </div>
                <dl className="mt-3 grid grid-cols-2 gap-2 text-sm font-semibold text-slate-600">
                  <div><dt className="text-xs uppercase text-slate-400">Ví Coin</dt><dd className="mt-1 flex items-center gap-1"><img src={goldCoinIcon} alt="Coin" className="h-5 w-5 object-contain mix-blend-multiply" />{formatNumber(player.coins)}</dd></div>
                  <div><dt className="text-xs uppercase text-slate-400">Số trận</dt><dd>{formatNumber(player.stats?.totalGames)}</dd></div>
                </dl>
                <div className="mt-3 flex gap-2">
                  {canManagePlayer && <select aria-label={`Manage ${player.username}`} className={inputClass} defaultValue="" onChange={(event) => { const type = event.target.value; event.target.value = ''; if (!type) return; if (type === 'edit' || type === 'delete') setUserCrud({ mode: type, user: player }); else openModal(type, player); }}><option value="">Manage…</option>{hasPermission('players.update') && <option value="edit">Edit profile</option>}{hasPermission('economy.adjust') && <option value="currency">Coin</option>}{hasPermission('players.role.write') && <option value="role">Role</option>}{hasPermission('players.delete') && <option value="delete">Soft delete</option>}</select>}
                  {hasPermission('players.status.write') && <Button variant={player.isBanned ? 'success' : 'danger'} onClick={() => openModal('status', player)}>{player.isBanned ? 'Unban' : 'Ban'}</Button>}
                </div>
              </article>
            ))}
          </div>
        </>
      )}

      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
      <PlayerModal modal={modal} setModal={setModal} onClose={closeModal} onSubmit={submitModal} language={language} adminUsername={adminUsername} submitting={submitting} policy={policy} />
      <UserCrudDialog
        mode={userCrud.mode}
        user={userCrud.user}
        adminUsername={adminUsername}
        canAssignRoles={hasPermission('players.role.write')}
        language={language}
        request={request}
        onClose={() => setUserCrud({ mode: null, user: null })}
        onComplete={() => {
          setUserCrud({ mode: null, user: null });
          setMessage({ tone: 'success', text: en ? 'User saved.' : 'Đã lưu người dùng.' });
          loadPlayers();
        }}
      />
      {detailPlayerId && <PlayerDetailDrawer key={`${detailPlayerId}-${detailRefresh}`} playerId={detailPlayerId} request={request} permissions={permissions} language={language} onClose={closePlayerDetail} onAction={(type, player) => { closePlayerDetail(); openModal(type, player); }} />}
    </div>
  );
}

function AdminAvatar({ avatar, username, className = 'h-9 w-9' }) {
  const [imageFailed, setImageFailed] = useState(false);

  useEffect(() => {
    setImageFailed(false);
  }, [avatar]);

  const sharedClass = `${className} grid shrink-0 place-items-center overflow-hidden rounded-full border border-[var(--admin-border)] bg-[var(--admin-warning-bg)] font-semibold`;

  if (avatar && PRESET_AVATARS[avatar]) {
    return <span className={`${sharedClass} text-xl`} role="img" aria-label={`${username} avatar`}>{PRESET_AVATARS[avatar]}</span>;
  }

  if (avatar && !imageFailed) {
    return (
      <span className={sharedClass}>
        <img src={avatar} alt={`${username} avatar`} className="h-full w-full bg-[var(--admin-surface)] object-cover" onError={() => setImageFailed(true)} />
      </span>
    );
  }

  return <span aria-hidden="true" className={sharedClass}>{username?.slice(0, 1).toUpperCase() || '?'}</span>;
}

function PlayerModal({ modal, setModal, onClose, onSubmit, language = 'vi', adminUsername = '', submitting = false, policy = {} }) {
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
    ? { currency: 'Adjust Coin balance', status: 'Change status', role: 'Change role' }
    : { currency: 'Điều chỉnh Coin', status: 'Đổi trạng thái', role: 'Đổi vai trò' };
  const adjustmentPreview = modal.type === 'currency'
    ? calculatePlayerAdjustmentPreview(modal.player, modal, policy)
    : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-[2px]" role="dialog" aria-modal="true" aria-labelledby="player-modal-title" aria-describedby="player-modal-description">
      <form ref={dialogRef} onSubmit={onSubmit} className="w-full max-w-md rounded-xl border border-[var(--admin-border)] bg-[var(--admin-surface)] p-5 shadow-[0_24px_60px_rgba(15,23,42,0.16)]">
        <h2 id="player-modal-title" className="text-lg font-semibold tracking-[-0.01em] text-[var(--admin-text)]">{titleMap[modal.type]}: {modal.player.username}</h2>
        <p id="player-modal-description" className="mt-1 text-sm text-[var(--admin-text-muted)]">{en ? 'Review the values and provide an audit reason before confirming.' : 'Kiểm tra giá trị và nhập lý do audit trước khi xác nhận.'}</p>
        <div className="mt-4 grid gap-3">
          {modal.type === 'currency' && (
            <>
              <fieldset>
                <legend className="mb-2 text-sm font-bold">{en ? 'Wallet type' : 'Loại ví'}</legend>
                <div className="grid">
                  <RadioCard name="currency" value="coin" checked onChange={() => {}} icon={goldCoinIcon} label="Coin" detail={`${formatNumber(modal.player.coins)} Coin`} tone="gold" />
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
                <div className="rounded-md border border-[var(--admin-border)] bg-[var(--admin-surface-muted)] px-3 py-2 text-right ">
                  <span className="block text-[10px] font-semibold tracking-[0.04em] text-[var(--admin-text-muted)]">{en ? 'Before → After' : 'Trước → Sau'}</span>
                  <strong>{adjustmentPreview?.valid ? `${formatNumber(adjustmentPreview.before)} → ${formatNumber(adjustmentPreview.after)}` : 'Không hợp lệ'}</strong>
                </div>
              </div>
            </>
          )}
          {modal.type === 'status' && (
            <Field label="Trạng thái mới">
              <select className={inputClass} value={modal.status} onChange={(event) => setModal({ ...modal, status: event.target.value })}>
                <option value="active">Active</option>
                <option value="banned">Banned</option>
              </select>
            </Field>
          )}
          {modal.type === 'role' && (
            <>
              <Alert tone="warning">Đây là thao tác critical. Quyền truy cập sẽ thay đổi ngay và được ghi audit.</Alert>
              <Field label="Vai trò mới">
                <select className={inputClass} value={modal.role} onChange={(event) => setModal({ ...modal, role: event.target.value })}>
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                  <option value="super_admin">Super admin</option>
                </select>
              </Field>
              <Field label="Lý do ghi audit"><input className={inputClass} value={modal.reason} onChange={(event) => setModal({ ...modal, reason: event.target.value })} placeholder="Ví dụ: Ticket BK-1234 đã được duyệt" /></Field>
              <Field label={`Nhập username của bạn để xác nhận: ${adminUsername}`} error={modal.confirmationUsername && modal.confirmationUsername.trim() !== adminUsername ? 'Username không khớp' : ''}>
                <input className={inputClass} value={modal.confirmationUsername} onChange={(event) => setModal({ ...modal, confirmationUsername: event.target.value })} autoComplete="off" />
              </Field>
            </>
          )}
          {modal.type !== 'role' && <Field label="Lý do ghi audit"><input className={inputClass} value={modal.reason} onChange={(event) => setModal({ ...modal, reason: event.target.value })} placeholder="Ghi rõ lý do thao tác" /></Field>}
          {adjustmentPreview?.valid && <Alert tone={adjustmentPreview.exceedsThreshold ? 'danger' : 'info'}>{en ? 'Impact' : 'Mức thay đổi'}: {adjustmentPreview.delta > 0 ? '+' : ''}{formatNumber(adjustmentPreview.delta)}{adjustmentPreview.threshold !== null && ` · ${en ? 'role limit' : 'giới hạn role'} ${formatNumber(adjustmentPreview.threshold)}`}{adjustmentPreview.exceedsThreshold && ` · ${en ? 'exceeds policy' : 'vượt policy'}`}</Alert>}
          {adjustmentPreview && !adjustmentPreview.valid && <Alert tone="danger">{en ? 'The resulting value must be a non-negative integer.' : 'Giá trị sau điều chỉnh phải là số nguyên không âm.'}</Alert>}
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>Hủy</Button>
          <Button type="submit" variant={modal.type === 'status' || modal.type === 'role' ? 'danger' : 'primary'} disabled={submitting || (adjustmentPreview && (!adjustmentPreview.valid || adjustmentPreview.exceedsThreshold)) || (modal.type === 'role' && (!modal.reason.trim() || modal.confirmationUsername.trim() !== adminUsername))}>{submitting ? 'Đang xử lý...' : 'Xác nhận'}</Button>
        </div>
      </form>
    </div>
  );
}

function RadioCard({ name, value, checked, onChange, icon, symbol, label, detail, tone = 'info' }) {
  const tones = {
    gold: 'bg-[var(--admin-warning-bg)]',
    pink: 'bg-[var(--admin-accent-soft)]',
    success: 'bg-[var(--admin-success-bg)]',
    danger: 'bg-[var(--admin-danger-bg)]',
    info: 'bg-[var(--admin-info-bg)]',
  };

  return (
    <label className={`relative flex min-h-16 cursor-pointer items-center gap-2 rounded-lg border p-2 transition ${checked ? `${tones[tone]} border-[var(--admin-accent)]` : 'border-[var(--admin-border)] bg-[var(--admin-surface)] hover:bg-[var(--admin-surface-muted)]'}`}>
      <input className="sr-only" type="radio" name={name} value={value} checked={checked} onChange={onChange} />
      {icon && <img src={icon} alt="" className="h-9 w-9 shrink-0 object-contain mix-blend-multiply" />}
      {symbol && <span aria-hidden="true" className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-[var(--admin-border)] bg-[var(--admin-surface)] text-xl font-semibold">{symbol}</span>}
      <span className="min-w-0"><strong className="block text-sm">{label}</strong>{detail && <small className="block truncate text-xs text-[var(--admin-text-muted)]">{detail}</small>}</span>
      <span aria-hidden="true" className={`absolute right-2 top-2 h-3 w-3 rounded-full border border-[var(--admin-border)] ${checked ? 'bg-[var(--admin-accent)]' : 'bg-[var(--admin-surface)]'}`} />
    </label>
  );
}
