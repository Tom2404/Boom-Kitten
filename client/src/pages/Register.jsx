import React, { useState } from 'react';

export default function Register() {
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
      setMessage('Đăng ký thành công! Hãy chuyển sang trang Đăng nhập.');
      setUsername('');
      setEmail('');
      setPassword('');
    } catch (err) {
      setIsError(true);
      setMessage(err.message);
    }
  };

  return (
    <div className="max-w-md mx-auto my-12 bg-slate-900/60 border border-slate-800 backdrop-blur rounded-2xl p-6 shadow-2xl flex flex-col gap-6">
      <div className="text-center">
        <span className="text-5xl">📝</span>
        <h2 className="text-2xl font-bold text-white mt-2">Đăng Ký Tài Khoản</h2>
        <p className="text-xs text-slate-400 mt-1">Tạo tài khoản để tham gia chơi Mèo Nổ.</p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {message && (
          <div className={`p-3 rounded-xl text-xs font-semibold text-center border
            ${isError 
              ? 'bg-red-500/10 border-red-500/20 text-red-400' 
              : 'bg-green-500/10 border-green-500/20 text-green-400'}`}>
            {message}
          </div>
        )}

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Tên người chơi</label>
          <input
            type="text"
            placeholder="Ví dụ: MeoNoPro"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 transition-colors"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Email</label>
          <input
            type="email"
            placeholder="username@gmail.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 transition-colors"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Mật khẩu</label>
          <input
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 transition-colors"
          />
        </div>

        <button
          type="submit"
          className="w-full mt-2 py-3 bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-400 hover:to-indigo-500 text-white font-bold rounded-xl active:scale-98 transition-all duration-300 shadow-lg shadow-indigo-500/20"
        >
          Đăng Ký
        </button>
      </form>
    </div>
  );
}
