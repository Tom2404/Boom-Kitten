import React, { useState } from 'react';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:5000';

export default function ForgotPassword({ setPage }) {
  const [email, setEmail] = useState('');
  const [state, setState] = useState({ pending: false, message: '', resetUrl: '' });

  const submit = async (event) => {
    event.preventDefault();
    setState({ pending: true, message: '', resetUrl: '' });
    try {
      const response = await fetch(`${API_URL}/api/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await response.json();
      setState({ pending: false, message: data.message || 'Nếu email tồn tại, hướng dẫn đã được gửi.', resetUrl: data.resetUrl || '' });
    } catch (_error) {
      setState({ pending: false, message: 'Chưa thể gửi yêu cầu. Vui lòng thử lại.', resetUrl: '' });
    }
  };

  return (
    <section className="mx-auto my-12 max-w-md border-3 border-[var(--pop-black)] bg-white p-7 shadow-[7px_7px_0_var(--pop-black)]" aria-labelledby="forgot-password-title">
      <h1 id="forgot-password-title" className="font-pop-display text-3xl font-black uppercase">Quên mật khẩu</h1>
      <p className="mt-2 text-sm font-bold text-[var(--pop-black)]/65">Nhập email tài khoản. Liên kết đặt lại có hiệu lực trong 15 phút.</p>
      {state.message && <p className="mt-4 border-2 border-[var(--pop-black)] bg-[var(--pop-amber)] p-3 text-sm font-bold" role="status">{state.message}</p>}
      {state.resetUrl && <a className="mt-3 block break-all text-sm font-black text-[var(--pop-red)] underline" href={state.resetUrl}>Mở liên kết development</a>}
      <form onSubmit={submit} className="mt-6 grid gap-4">
        <label htmlFor="forgot-email" className="text-xs font-black uppercase">Email</label>
        <input id="forgot-email" type="email" required value={email} onChange={(event) => setEmail(event.target.value)} className="border-3 border-[var(--pop-black)] px-4 py-3 font-bold shadow-[3px_3px_0_var(--pop-black)]" />
        <button type="submit" disabled={state.pending} className="border-3 border-[var(--pop-black)] bg-[var(--pop-red)] px-4 py-3 font-pop-accent font-black uppercase text-white shadow-[4px_4px_0_var(--pop-black)] disabled:opacity-60">{state.pending ? 'Đang gửi…' : 'Gửi liên kết'}</button>
        <button type="button" onClick={() => setPage('Login')} className="text-sm font-black uppercase text-[var(--pop-black)]/65 hover:text-[var(--pop-red)]">Quay lại đăng nhập</button>
      </form>
    </section>
  );
}
