import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useAdminApi } from './useAdminApi.js';
import { AdminCard, Alert, Button, EmptyState, Field, SectionHeader, SkeletonBlock, StatusBadge, inputClass } from './ui.jsx';

function dateInput(date) { return date.toISOString().slice(0, 10); }
function number(value) { return new Intl.NumberFormat('vi-VN').format(value || 0); }

export default function ProductAnalyticsPanel() {
  const { request } = useAdminApi();
  const now = useMemo(() => new Date(), []);
  const [range, setRange] = useState({ from: dateInput(new Date(now.getTime() - 29 * 86400000)), to: dateInput(now) });
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true); setError('');
    const params = new URLSearchParams(range);
    const response = await request(`/api/admin/analytics/product?${params}`);
    setLoading(false);
    if (!response.ok) return setError(response.data?.error?.message || response.error || 'Không thể tải Product Analytics.');
    setData(response.data.data);
  }, [range, request]);

  useEffect(() => { load(); }, [load]);
  const maxRank = Math.max(1, ...(data?.rankDistribution || []).map((row) => row.users));

  return <div className="flex flex-col gap-5">
    <SectionHeader title="Product Analytics" description="Funnel, retention, rank, economy và content performance dùng một khoảng thời gian UTC nhất quán." actions={<Button onClick={load}>Làm mới</Button>} />
    {error && <Alert tone="danger">{error}</Alert>}
    <AdminCard className="p-4"><div className="flex flex-col gap-3 md:flex-row md:items-end"><Field label="Từ ngày (UTC)"><input className={inputClass} type="date" value={range.from} onChange={(e) => setRange({ ...range, from: e.target.value })} /></Field><Field label="Đến ngày (UTC)"><input className={inputClass} type="date" value={range.to} onChange={(e) => setRange({ ...range, to: e.target.value })} /></Field><Button variant="primary" onClick={load}>Áp dụng</Button><StatusBadge tone="info">Tối đa 90 ngày</StatusBadge></div></AdminCard>
    {loading ? <AdminCard className="p-4"><SkeletonBlock rows={8} /></AdminCard> : data && <>
      <section className="grid gap-4 lg:grid-cols-3">{data.funnel.map((stage, index) => <AdminCard key={stage.id} className="relative overflow-hidden p-4"><div className="absolute inset-y-0 left-0 bg-[var(--admin-info-bg)]" style={{ width: `${stage.conversionFromRegistration}%` }} aria-hidden="true" /><div className="relative"><p className="text-xs font-semibold uppercase tracking-wide text-[var(--admin-text-muted)]">Bước {index + 1} · {stage.label}</p><p className="mt-2 font-sans text-4xl font-semibold">{number(stage.users)}</p><p className="mt-2 text-sm font-bold">{stage.conversionFromRegistration}% từ đăng ký · {stage.conversionFromPrevious}% từ bước trước</p></div></AdminCard>)}</section>

      <AdminCard className="p-4"><h3 className="font-sans font-semibold">Retention cohort</h3><p className="mt-1 text-sm font-semibold text-[var(--admin-text-muted)]">Cohort theo ngày đăng ký UTC; D1/D7 là có trận vào đúng ngày thứ 1/thứ 7.</p>{data.retention.length === 0 ? <div className="mt-4"><EmptyState title="Chưa có cohort trong khoảng này" /></div> : <div className="mt-4 max-h-[420px] overflow-auto border border-[var(--admin-border)]"><table className="w-full min-w-[620px] text-left text-sm"><thead className="sticky top-0 bg-black text-white"><tr><th className="p-3">Cohort UTC</th><th className="p-3">Users</th><th className="p-3">D1</th><th className="p-3">D7</th></tr></thead><tbody>{data.retention.map((row) => <tr key={row.cohort} className="border-b border-[var(--admin-border)] odd:bg-[var(--admin-surface)] even:bg-[var(--admin-surface-muted)]"><td className="p-3 font-mono font-semibold">{row.cohort}</td><td className="p-3 font-mono">{number(row.users)}</td><td className="p-3"><b>{row.d1Rate}%</b> <span className="text-xs text-[var(--admin-text-muted)]">({row.d1Users})</span></td><td className="p-3"><b>{row.d7Rate}%</b> <span className="text-xs text-[var(--admin-text-muted)]">({row.d7Users})</span></td></tr>)}</tbody></table></div>}</AdminCard>

      <div className="grid gap-5 xl:grid-cols-2"><AdminCard className="p-4"><h3 className="font-sans font-semibold">Phân phối rank hiện tại</h3><div className="mt-4 grid gap-2">{data.rankDistribution.map((row) => <div key={row.rank} className="grid grid-cols-[110px_1fr_70px] items-center gap-2"><span className="truncate text-xs font-semibold">{row.rank}</span><div className="h-7 border border-[var(--admin-border)] bg-[var(--admin-surface-muted)]"><div className="h-full bg-[var(--admin-accent)]" style={{ width: `${row.users * 100 / maxRank}%` }} /></div><span className="text-right font-mono font-semibold">{number(row.users)}</span></div>)}</div></AdminCard>
      <AdminCard className="p-4"><h3 className="font-sans font-semibold">Economy source / sink</h3><div className="mt-4 grid gap-4 sm:grid-cols-2">{Object.entries(data.economy).map(([currency, values]) => <article key={currency} className="rounded-lg border border-[var(--admin-border)] bg-[var(--admin-surface-muted)] p-4"><p className="font-sans font-semibold uppercase">{currency}</p><dl className="mt-3 grid gap-2 text-sm"><div className="flex justify-between"><dt>Source</dt><dd className="font-mono font-semibold text-[var(--admin-success-text)]">+{number(values.source)}</dd></div><div className="flex justify-between"><dt>Sink</dt><dd className="font-mono font-semibold text-[var(--admin-danger-text)]">-{number(values.sink)}</dd></div><div className="flex justify-between border-t border-[var(--admin-border)] pt-2"><dt className="font-semibold">Net</dt><dd className="font-mono font-semibold">{number(values.net)}</dd></div></dl></article>)}</div></AdminCard></div>

      <div className="grid gap-5 xl:grid-cols-2"><ContentList title="Top Shop" empty="Chưa có purchase được instrument trong khoảng." rows={data.topContent.shop} render={(row) => <><div><strong>{row.name}</strong><p className="text-xs font-semibold text-[var(--admin-text-muted)]">{row.type || 'legacy'} · {row.id || 'no source id'}</p></div><div className="text-right"><p className="font-mono font-semibold">{row.purchases} mua</p><p className="text-xs font-bold text-[var(--admin-danger-text)]">{number(row.spent)} spent</p></div></>} /><ContentList title="Top nhiệm vụ" empty="Chưa có quest claim trong khoảng." rows={data.topContent.quests} render={(row) => <><div><strong>{row.name}</strong><p className="text-xs font-semibold text-[var(--admin-text-muted)]">{row.actionType || 'deleted'}</p></div><p className="font-mono font-semibold">{row.claims} claims</p></>} /></div>

      <AdminCard className="p-4"><h3 className="font-sans font-semibold">Định nghĩa metric</h3><dl className="mt-3 grid gap-3 text-sm">{Object.entries(data.definitions).map(([key, value]) => <div key={key} className="border-l border-[var(--admin-info-text)] pl-3"><dt className="font-semibold uppercase">{key}</dt><dd className="mt-1 font-semibold leading-6 text-[var(--admin-text-muted)]">{value}</dd></div>)}</dl><p className="mt-4 font-mono text-xs font-semibold">Window: {new Date(data.range.from).toISOString()} → {new Date(data.range.to).toISOString()} · timezone {data.range.timezone}</p></AdminCard>
    </>}
  </div>;
}

function ContentList({ title, empty, rows, render }) { return <AdminCard className="p-4"><h3 className="font-sans font-semibold">{title}</h3>{rows.length === 0 ? <div className="mt-4"><EmptyState title={empty} /></div> : <div className="mt-4 grid gap-2">{rows.map((row, index) => <article key={`${row.id}-${index}`} className="flex items-center justify-between gap-3 border border-[var(--admin-border)] bg-[var(--admin-surface-muted)] p-3">{render(row)}</article>)}</div>}</AdminCard>; }
