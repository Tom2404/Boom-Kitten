import React, { useEffect, useState } from 'react';
import { useAdminApi } from './useAdminApi.js';
import { Alert, Button, ConfirmDialog, DataTable, EmptyState, Field, inputClass, SectionHeader, SkeletonBlock, StatusBadge } from './ui.jsx';
import { formatCountdown, formatDateTime, formatResetStrategy, formatSeasonStatus, getEloResetPreview } from './utils.js';

const blankSeason = { seasonNumber: '', name: '', startDate: '', endDate: '', resetStrategy: 'soft_reset_ratio', softResetRatio: 0.5, resetEloValue: 1000 };

export default function SeasonsPanel() {
  const { request } = useAdminApi();
  const [seasons, setSeasons] = useState([]);
  const [form, setForm] = useState(blankSeason);
  const [errors, setErrors] = useState({});
  const [resetReason, setResetReason] = useState('');
  const [confirmText, setConfirmText] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ tone: '', text: '' });
  const [resetData, setResetData] = useState(null);
  const [now, setNow] = useState(new Date());

  const loadSeasons = async () => {
    setLoading(true);
    const res = await request('/api/admin/seasons');
    if (res.ok && res.data?.success) setSeasons(res.data.seasons || []);
    else setMessage({ tone: 'danger', text: res.data?.message || res.error || 'Không thể tải danh sách mùa giải.' });
    setLoading(false);
  };

  useEffect(() => { loadSeasons(); }, [request]);
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(timer);
  }, []);

  const activeSeason = seasons.find((season) => season.status === 'active');
  const waitingResetSeason = seasons.find((season) => season.status === 'ended' && !season.isResetExecuted);
  const scheduledSeason = seasons.find((season) => season.status === 'scheduled');
  const resetCandidate = seasons.find((season) => !season.isResetExecuted && (season.status === 'active' || season.status === 'ended'));

  const validate = () => {
    const nextErrors = {};
    if (!form.seasonNumber) nextErrors.seasonNumber = 'Bắt buộc.';
    if (!form.name) nextErrors.name = 'Bắt buộc.';
    if (!form.startDate) nextErrors.startDate = 'Bắt buộc.';
    if (!form.endDate) nextErrors.endDate = 'Bắt buộc.';
    if (form.startDate && form.endDate && new Date(form.endDate) <= new Date(form.startDate)) nextErrors.endDate = 'Ngày kết thúc phải sau ngày bắt đầu.';
    if (form.resetStrategy === 'soft_reset_ratio' && (Number(form.softResetRatio) < 0 || Number(form.softResetRatio) > 1)) nextErrors.softResetRatio = 'Tỉ lệ từ 0 đến 1.';
    if (Number(form.resetEloValue) < 1000) nextErrors.resetEloValue = 'ELO cơ sở tối thiểu 1000.';
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const createSeason = async (event) => {
    event.preventDefault();
    setMessage({ tone: '', text: '' });
    if (!validate()) return;
    const res = await request('/api/admin/seasons', {
      method: 'POST',
      body: JSON.stringify({
        seasonNumber: Number(form.seasonNumber),
        name: form.name,
        startDate: form.startDate,
        endDate: form.endDate,
        resetStrategy: form.resetStrategy,
        softResetRatio: form.resetStrategy === 'soft_reset_ratio' ? Number(form.softResetRatio) : undefined,
        resetEloValue: Number(form.resetEloValue),
      }),
    });
    if (res.ok && res.data?.success) {
      setMessage({ tone: 'success', text: `Đã lập lịch Season ${form.seasonNumber}.` });
      setForm(blankSeason);
      setErrors({});
      loadSeasons();
    } else setMessage({ tone: 'danger', text: res.data?.message || 'Lập lịch mùa giải thất bại.' });
  };

  const deleteSeason = async () => {
    if (!deleteTarget) return;
    const res = await request(`/api/admin/seasons/${deleteTarget._id}`, { method: 'DELETE' });
    if (res.ok && res.data?.success) {
      setMessage({ tone: 'success', text: 'Đã xóa mùa giải đã lập lịch.' });
      setDeleteTarget(null);
      loadSeasons();
    } else setMessage({ tone: 'danger', text: res.data?.message || 'Xóa mùa giải thất bại.' });
  };

  const resetSeason = async (event) => {
    event.preventDefault();
    setResetData(null);
    if (confirmText !== 'RESET') return setMessage({ tone: 'danger', text: 'Vui lòng nhập đúng RESET để xác nhận.' });
    if (!resetReason.trim()) return setMessage({ tone: 'danger', text: 'Lý do reset là bắt buộc.' });
    const res = await request('/api/admin/season-reset', {
      method: 'POST',
      body: JSON.stringify({ confirmText, reason: resetReason.trim() }),
    });
    if (res.ok && res.data?.success) {
      setMessage({ tone: 'success', text: 'Mùa giải đã được reset thành công.' });
      setResetData(res.data.data);
      setConfirmText('');
      setResetReason('');
      loadSeasons();
    } else setMessage({ tone: 'danger', text: res.data?.message || 'Reset mùa giải thất bại.' });
  };

  return (
    <div className="flex flex-col gap-5">
      <SectionHeader title="Mùa giải" description="Lập lịch mùa giải, kiểm tra trạng thái, xem trước ELO sau reset và thực hiện reset có audit." actions={<Button onClick={loadSeasons}>Làm mới</Button>} />
      {message.text && <Alert tone={message.tone}>{message.text}</Alert>}
      {resetData && <Alert tone="success">Ảnh hưởng: {resetData.affectedUsers} tài khoản · Cơ chế {formatResetStrategy(resetData.strategy)} · Thưởng {resetData.totalGemsAwarded} PinkCoin.</Alert>}

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[390px_1fr]">
        <form onSubmit={createSeason} className="border-[3px] border-[var(--pop-black)] bg-[#fffdf5] p-4 shadow-[4px_4px_0_var(--pop-black)]">
          <h3 className="font-pop-display text-base font-black text-slate-950">Lập lịch mùa mới</h3>
          <div className="mt-4 grid gap-3">
            <div className="grid grid-cols-3 gap-3">
              <Field label="Season #" error={errors.seasonNumber}><input className={inputClass} type="number" value={form.seasonNumber} onChange={(event) => setForm({ ...form, seasonNumber: event.target.value })} /></Field>
              <div className="col-span-2"><Field label="Tên mùa" error={errors.name}><input className={inputClass} value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /></Field></div>
            </div>
            <Field label="Ngày bắt đầu" error={errors.startDate}><input className={inputClass} type="datetime-local" value={form.startDate} onChange={(event) => setForm({ ...form, startDate: event.target.value })} /></Field>
            <Field label="Ngày kết thúc" error={errors.endDate}><input className={inputClass} type="datetime-local" value={form.endDate} onChange={(event) => setForm({ ...form, endDate: event.target.value })} /></Field>
            <Field label="Cơ chế reset"><select className={inputClass} value={form.resetStrategy} onChange={(event) => setForm({ ...form, resetStrategy: event.target.value })}><option value="soft_reset_ratio">Nén ELO theo tỉ lệ</option><option value="soft_reset_tiered">Reset theo mốc rank</option><option value="hard_reset">Reset trắng</option></select></Field>
            <Field label="ELO cơ sở" error={errors.resetEloValue}><input className={inputClass} type="number" min="1000" value={form.resetEloValue} onChange={(event) => setForm({ ...form, resetEloValue: event.target.value })} /></Field>
            {form.resetStrategy === 'soft_reset_ratio' && <Field label={`Tỉ lệ nén: ${form.softResetRatio}`} error={errors.softResetRatio}><input className="w-full accent-red-600" type="range" min="0" max="1" step="0.1" value={form.softResetRatio} onChange={(event) => setForm({ ...form, softResetRatio: event.target.value })} /></Field>}
          </div>
          <Button type="submit" variant="primary" className="mt-4 w-full">Lập lịch mùa giải</Button>
        </form>

        <div className="grid gap-5">
          <section className="border-[3px] border-[var(--pop-black)] bg-[#fffdf5] p-4 shadow-[4px_4px_0_var(--pop-black)]">
            <h3 className="font-pop-display text-base font-black text-slate-950">Trạng thái hiện tại</h3>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <SeasonStatusCard title="Mùa đang chạy" season={activeSeason} fallback="Chưa có mùa active" now={now} />
              <SeasonStatusCard title="Mùa kế tiếp" season={scheduledSeason} fallback={waitingResetSeason ? 'Có mùa đang chờ reset' : 'Chưa có mùa đã lập lịch'} now={now} />
            </div>
          </section>

          <section className="border-[3px] border-[var(--pop-black)] bg-[#fffdf5] p-4 shadow-[4px_4px_0_var(--pop-black)]">
            <h3 className="font-pop-display text-base font-black text-slate-950">Preview ELO sau reset</h3>
            <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
              {[1000, 1500, 2200, 2600].map((elo) => (
                <div key={elo} className="border-[3px] border-[var(--pop-black)] bg-[#f5e7c8] p-3 text-center">
                  <p className="text-xs font-bold text-slate-500">Hiện tại {elo}</p>
                  <p className="mt-1 font-pop-display text-xl font-black text-red-700">{getEloResetPreview(form.resetStrategy, form.softResetRatio, form.resetEloValue, elo)}</p>
                </div>
              ))}
            </div>
          </section>

          <form onSubmit={resetSeason} className="border-[4px] border-[var(--pop-black)] bg-red-100 p-4 shadow-[5px_5px_0_var(--pop-red)]">
            <h3 className="font-pop-display text-base font-black text-red-900">Reset mùa giải</h3>
            <p className="mt-1 text-sm font-semibold leading-6 text-red-800">Thao tác này kết toán mùa hiện tại, phát thưởng và cập nhật ELO. Không thể hoàn tác.</p>
            <div className="mt-4 grid gap-3">
              <Field label="Mùa sẽ reset"><input className={inputClass} value={resetCandidate ? `Season #${resetCandidate.seasonNumber} - ${resetCandidate.name}` : 'Không có mùa đủ điều kiện'} disabled /></Field>
              <Field label="Lý do audit"><input className={inputClass} value={resetReason} onChange={(event) => setResetReason(event.target.value)} placeholder="Ví dụ: Kết thúc Season 1" /></Field>
              <Field label="Nhập RESET để xác nhận"><input className={inputClass} value={confirmText} onChange={(event) => setConfirmText(event.target.value)} /></Field>
            </div>
            <Button type="submit" variant="danger" className="mt-4 w-full" disabled={!resetCandidate || confirmText !== 'RESET' || !resetReason.trim()}>Reset mùa giải</Button>
          </form>
        </div>
      </div>

      <section className="border-[3px] border-[var(--pop-black)] bg-[#fffdf5] p-4 shadow-[4px_4px_0_var(--pop-black)]">
        <h3 className="font-pop-display text-base font-black text-slate-950">Danh sách mùa giải</h3>
        <div className="mt-4">
          {loading ? <SkeletonBlock rows={4} /> : seasons.length === 0 ? (
            <EmptyState title="Chưa có mùa giải" description="Lập lịch mùa đầu tiên bằng form phía trên." />
          ) : (
            <>
              <div className="hidden lg:block">
                <DataTable columns={['Season', 'Tên', 'Thời gian', 'Reset', 'Trạng thái', 'Kết toán', 'Hành động']}>
                  {seasons.map((season) => (
                    <tr key={season._id}>
                      <td className="px-4 py-3 font-mono font-black text-red-700">#{season.seasonNumber}</td>
                      <td className="px-4 py-3 font-bold text-slate-900">{season.name}</td>
                      <td className="px-4 py-3 text-sm font-semibold text-slate-600">{formatDateTime(season.startDate)}<span className="mx-2 text-slate-300">to</span>{formatDateTime(season.endDate)}</td>
                      <td className="px-4 py-3 font-semibold text-slate-600">{formatResetStrategy(season.settings?.resetStrategy)}</td>
                      <td className="px-4 py-3"><StatusBadge tone={season.status === 'active' ? 'success' : season.status === 'ended' ? 'danger' : 'warning'}>{formatSeasonStatus(season.status)}</StatusBadge></td>
                      <td className="px-4 py-3"><StatusBadge tone={season.isResetExecuted ? 'success' : 'danger'}>{season.isResetExecuted ? 'Đã kết toán' : 'Chưa kết toán'}</StatusBadge></td>
                      <td className="px-4 py-3"><Button variant="danger" disabled={season.status !== 'scheduled' || season.isResetExecuted} onClick={() => setDeleteTarget(season)}>Xóa</Button></td>
                    </tr>
                  ))}
                </DataTable>
              </div>
              <div className="grid gap-3 lg:hidden">
                {seasons.map((season) => (
                  <article key={season._id} className="border-[3px] border-[var(--pop-black)] bg-[#fffdf5] p-4 shadow-[4px_4px_0_var(--pop-black)]">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-mono text-sm font-black text-red-700">Season #{season.seasonNumber}</p>
                        <h4 className="font-pop-display font-black text-slate-950">{season.name}</h4>
                      </div>
                      <StatusBadge tone={season.status === 'active' ? 'success' : season.status === 'ended' ? 'danger' : 'warning'}>{formatSeasonStatus(season.status)}</StatusBadge>
                    </div>
                    <p className="mt-2 text-sm font-semibold text-slate-600">{formatDateTime(season.startDate)} to {formatDateTime(season.endDate)}</p>
                    <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                      <StatusBadge tone={season.isResetExecuted ? 'success' : 'danger'}>{season.isResetExecuted ? 'Đã kết toán' : 'Chưa kết toán'}</StatusBadge>
                      <Button variant="danger" disabled={season.status !== 'scheduled' || season.isResetExecuted} onClick={() => setDeleteTarget(season)}>Xóa</Button>
                    </div>
                  </article>
                ))}
              </div>
            </>
          )}
        </div>
      </section>

      <ConfirmDialog open={!!deleteTarget} title="Xóa mùa đã lập lịch?" description={`Season #${deleteTarget?.seasonNumber} sẽ bị xóa. Chỉ nên xóa mùa chưa bắt đầu.`} confirmLabel="Xóa" onConfirm={deleteSeason} onClose={() => setDeleteTarget(null)} />
    </div>
  );
}

function SeasonStatusCard({ title, season, fallback, now }) {
  if (!season) {
    return (
      <div className="border-[3px] border-dashed border-[var(--pop-black)] bg-[#f5e7c8] p-4">
        <p className="text-xs font-black uppercase tracking-wide text-slate-500">{title}</p>
        <p className="mt-2 text-sm font-bold text-slate-600">{fallback}</p>
      </div>
    );
  }

  return (
    <div className="border-[3px] border-[var(--pop-black)] bg-[#fffdf5] p-4 shadow-[3px_3px_0_var(--pop-black)]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-wide text-slate-500">{title}</p>
          <h4 className="mt-1 font-pop-display font-black text-slate-950">Season #{season.seasonNumber} - {season.name}</h4>
        </div>
        <StatusBadge tone={season.status === 'active' ? 'success' : 'warning'}>{formatSeasonStatus(season.status)}</StatusBadge>
      </div>
      <p className="mt-3 text-sm font-semibold text-slate-600">{formatDateTime(season.startDate)} to {formatDateTime(season.endDate)}</p>
      <p className="mt-2 text-sm font-black text-red-700">{season.status === 'scheduled' ? 'Bắt đầu sau' : 'Còn lại'}: {formatCountdown(season.status === 'scheduled' ? season.startDate : season.endDate, now)}</p>
    </div>
  );
}
