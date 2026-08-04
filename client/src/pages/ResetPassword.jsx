import React, { useState } from 'react';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:5000';

export default function ResetPassword({ setPage }) {
  const [token] = useState(() => {
    const resetToken = new URLSearchParams(window.location.search).get('resetToken') || '';
    if (resetToken) window.history.replaceState({}, '', window.location.pathname);
    return resetToken;
  });
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [state, setState] = useState({ pending: false, error: '', success: '' });

  const submit = async (event) => {
    event.preventDefault();
    if (password !== confirmation) {
      setState({ pending: false, error: 'Mật khẩu xác nhận không khớp.', success: '' });
      return;
    }
    setState({ pending: true, error: '', success: '' });
    try {
      const response = await fetch(`${API_URL}/api/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error?.message || data.message || 'Không thể đặt lại mật khẩu.');
      setState({ pending: false, error: '', success: data.message || 'Mật khẩu đã được đặt lại.' });
    } catch (error) {
      setState({ pending: false, error: error.message, success: '' });
    }
  };

  return (
    <section className="mx-auto my-12 max-w-md border-3 border-[var(--pop-black)] bg-white p-7 shadow-[7px_7px_0_var(--pop-black)]" aria-labelledby="reset-password-title">
      <h1 id="reset-password-title" className="font-pop-display text-3xl font-black uppercase">Đặt lại mật khẩu</h1>
      {!token && <p className="mt-4 border-2 border-[var(--pop-black)] bg-[var(--pop-red)] p-3 font-bold text-white" role="alert">Liên kết không hợp lệ.</p>}
      {state.error && <p className="mt-4 border-2 border-[var(--pop-black)] bg-[var(--pop-red)] p-3 font-bold text-white" role="alert">{state.error}</p>}
      {state.success && <p className="mt-4 border-2 border-[var(--pop-black)] bg-[var(--pop-amber)] p-3 font-bold" role="status">{state.success}</p>}
      <form onSubmit={submit} className="mt-6 grid gap-4">
        <label htmlFor="reset-password" className="text-xs font-black uppercase">Mật khẩu mới</label>
        <input id="reset-password" type="password" minLength="10" maxLength="72" required value={password} onChange={(event) => setPassword(event.target.value)} className="border-3 border-[var(--pop-black)] px-4 py-3 font-bold shadow-[3px_3px_0_var(--pop-black)]" />
        <label htmlFor="reset-confirmation" className="text-xs font-black uppercase">Nhập lại mật khẩu</label>
        <input id="reset-confirmation" type="password" minLength="10" maxLength="72" required value={confirmation} onChange={(event) => setConfirmation(event.target.value)} className="border-3 border-[var(--pop-black)] px-4 py-3 font-bold shadow-[3px_3px_0_var(--pop-black)]" />
        <button type="submit" disabled={!token || state.pending} className="border-3 border-[var(--pop-black)] bg-[var(--pop-red)] px-4 py-3 font-pop-accent font-black uppercase text-white shadow-[4px_4px_0_var(--pop-black)] disabled:opacity-60">{state.pending ? 'Đang cập nhật…' : 'Đặt lại mật khẩu'}</button>
        <button type="button" onClick={() => setPage('Login')} className="text-sm font-black uppercase text-[var(--pop-black)]/65 hover:text-[var(--pop-red)]">Đăng nhập</button>
      </form>
    </section>
  );
}
