import React, { useState } from 'react';
import { useAdminApi } from './useAdminApi.js';
import { Alert, Button, Field, inputClass, SectionHeader, StatusBadge } from './ui.jsx';

export default function AnnouncementsPanel() {
  const { request } = useAdminApi();
  const [title, setTitle] = useState('Thông Báo Hệ Thống');
  const [message, setMessage] = useState('');
  const [type, setType] = useState('info');
  const [duration, setDuration] = useState(30);
  const [result, setResult] = useState({ tone: '', text: '' });
  const [sending, setSending] = useState(false);

  const submitAnnouncement = async (event) => {
    event.preventDefault();
    if (!message.trim()) return setResult({ tone: 'danger', text: 'Nội dung thông báo không được để trống.' });
    setSending(true);
    const res = await request('/api/admin/announcements', {
      method: 'POST',
      body: JSON.stringify({ title: title.trim(), message: message.trim(), type, durationSeconds: Number(duration) }),
    });
    if (res.ok) {
      setResult({ tone: 'success', text: 'Đã phát thông báo đến người chơi trực tuyến.' });
      setMessage('');
    } else setResult({ tone: 'danger', text: res.data?.message || res.error || 'Gửi thông báo thất bại.' });
    setSending(false);
  };

  return (
    <div className="flex flex-col gap-5">
      <SectionHeader title="Thông báo live" description="Soạn và gửi broadcast ngắn đến toàn bộ người chơi đang online." />
      {result.text && <Alert tone={result.tone}>{result.text}</Alert>}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <form onSubmit={submitAnnouncement} className="border-[3px] border-[var(--pop-black)] bg-[#fffdf5] p-4 shadow-[4px_4px_0_var(--pop-black)]">
          <div className="grid gap-4">
            <Field label="Tiêu đề"><input className={inputClass} value={title} onChange={(event) => setTitle(event.target.value)} /></Field>
            <Field label="Nội dung"><textarea className={inputClass} rows="5" value={message} onChange={(event) => setMessage(event.target.value)} placeholder="Thông báo bảo trì, sự kiện, quà tặng..." /></Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Loại thông báo"><select className={inputClass} value={type} onChange={(event) => setType(event.target.value)}><option value="info">Thông tin</option><option value="warning">Cảnh báo</option><option value="event">Sự kiện</option></select></Field>
              <Field label="Thời lượng giây"><input className={inputClass} type="number" min="5" max="300" value={duration} onChange={(event) => setDuration(event.target.value)} /></Field>
            </div>
          </div>
          <Button type="submit" variant="primary" className="mt-4 w-full" disabled={sending}>{sending ? 'Đang gửi...' : 'Phát thông báo'}</Button>
        </form>

        <section className="border-[3px] border-[var(--pop-black)] bg-[#fffdf5] p-4 shadow-[4px_4px_0_var(--pop-black)]">
          <div className="flex items-center justify-between gap-3">
            <h3 className="font-pop-display text-base font-black text-slate-950">Preview</h3>
            <StatusBadge tone={type === 'warning' ? 'danger' : type === 'event' ? 'warning' : 'info'}>{type}</StatusBadge>
          </div>
          <div className={`mt-5 border-[3px] border-[var(--pop-black)] p-4 shadow-[3px_3px_0_var(--pop-black)] ${type === 'warning' ? 'bg-red-100 text-red-900' : type === 'event' ? 'bg-[var(--pop-amber)] text-amber-950' : 'bg-sky-100 text-sky-950'}`}>
            <p className="text-xs font-black uppercase tracking-wide opacity-70">{title || 'Thông Báo Hệ Thống'}</p>
            <p className="mt-2 text-sm font-bold leading-6">{message || 'Nội dung thông báo sẽ hiển thị tại đây trước khi phát live.'}</p>
          </div>
          <p className="mt-3 text-sm font-semibold text-slate-500">Thời lượng hiển thị: {duration} giây</p>
        </section>
      </div>
    </div>
  );
}
