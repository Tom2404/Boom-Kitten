import React, { useState } from 'react';

export default function Register({ setPage }) {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);

  const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:5000';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setIsError(false);

    if (!username || !email || !password) {
      setIsError(true);
      setMessage('Vui lòng điền đầy đủ thông tin.');
      return;
    }

    try {
      const res = await fetch(`${API_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Đăng ký thất bại.');
      }

      setIsError(false);
      setMessage('Đăng ký thành công! Đang chuyển hướng đến đăng nhập...');
      setUsername('');
      setEmail('');
      setPassword('');
      setTimeout(() => {
        setPage('Login');
      }, 1500);
    } catch (err) {
      setIsError(true);
      setMessage(err.message);
    }
  };

  return (
    <div className="max-w-md mx-auto my-12 bg-white border-4 border-on-surface shadow-[8px_8px_0px_0px_rgba(26,28,28,1)] rounded-3xl p-8 flex flex-col gap-6">
      <div className="text-center flex flex-col items-center">
        <h2 className="text-2xl font-headline font-black text-on-surface uppercase mt-4">Đăng Ký</h2>
        <p className="text-xs font-bold text-on-surface-variant mt-1">Tạo tài khoản để tham gia chơi Mèo Nổ.</p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        {message && (
          <div className={`p-4 rounded-xl text-xs font-headline font-black text-center border-3 border-on-surface shadow-[2px_2px_0px_0px_rgba(26,28,28,1)]
            ${isError 
              ? 'bg-rose-100 text-rose-700' 
              : 'bg-emerald-100 text-emerald-700'}`}>
            {message}
          </div>
        )}

        <div className="flex flex-col gap-2">
          <label className="text-xs font-headline font-black text-on-surface uppercase tracking-wider">Tên người chơi</label>
          <input
            type="text"
            placeholder="Ví dụ: MeoNoPro"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="bg-surface border-3 border-on-surface rounded-xl px-4 py-3 text-xs text-on-surface font-bold focus:outline-none focus:bg-white transition-all shadow-[2px_2px_0px_0px_rgba(26,28,28,1)]"
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-xs font-headline font-black text-on-surface uppercase tracking-wider">Email</label>
          <input
            type="email"
            placeholder="username@gmail.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="bg-surface border-3 border-on-surface rounded-xl px-4 py-3 text-xs text-on-surface font-bold focus:outline-none focus:bg-white transition-all shadow-[2px_2px_0px_0px_rgba(26,28,28,1)]"
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-xs font-headline font-black text-on-surface uppercase tracking-wider">Mật khẩu</label>
          <input
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="bg-surface border-3 border-on-surface rounded-xl px-4 py-3 text-xs text-on-surface font-bold focus:outline-none focus:bg-white transition-all shadow-[2px_2px_0px_0px_rgba(26,28,28,1)]"
          />
        </div>

        <button
          type="submit"
          className="btn-detonator w-full mt-4 py-4 rounded-2xl font-headline font-black uppercase text-base"
        >
          Đăng Ký Ngay
        </button>

        <p className="text-center text-xs font-bold text-on-surface-variant mt-2">
          Đã có tài khoản?{' '}
          <button 
            type="button" 
            onClick={() => setPage('Login')}
            className="text-primary hover:underline"
          >
            Đăng nhập ngay
          </button>
        </p>
      </form>
    </div>
  );
}
