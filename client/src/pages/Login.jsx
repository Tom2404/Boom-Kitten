import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth.js';
import { useLanguage } from '../context/LanguageContext.jsx';

export default function Login({ setPage }) {
  const { t } = useLanguage();
  const { setToken } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);

  const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:5000';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setIsError(false);

    if (!email || !password) {
      setIsError(true);
      setMessage(t('validation_email_password'));
      return;
    }

    try {
      const res = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || t('login_fail'));
      }

      setToken(data.accessToken);
      if (data.refreshToken) {
        localStorage.setItem('refreshToken', data.refreshToken);
      }

      setIsError(false);
      setMessage(t('login_success'));
      setTimeout(() => {
        setPage('Game');
      }, 1000);
    } catch (err) {
      setIsError(true);
      setMessage(err.message);
    }
  };

  return (
    <div className="max-w-md mx-auto my-12 bg-white border-3 border-[var(--pop-black)] shadow-[8px_8px_0_var(--pop-black)] p-8 flex flex-col gap-6 text-left transform rotate-[0.5deg]">
      <div className="text-center flex flex-col items-center">
        <h2 className="text-3xl font-pop-display font-black text-[var(--pop-black)] uppercase mt-4">{t('login_title')}</h2>
        <p className="text-xs font-pop-body font-bold text-[var(--pop-black)]/60 mt-1">{t('login_desc')}</p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        {message && (
          <div className={`p-4 rounded-none text-xs font-pop-accent font-bold text-center border-3 border-[var(--pop-black)] shadow-[4px_4px_0_var(--pop-black)]
            ${isError 
              ? 'bg-[var(--pop-red)] text-white' 
              : 'bg-[var(--pop-amber)] text-[var(--pop-black)]'}`}>
            {message}
          </div>
        )}

        <div className="flex flex-col gap-2">
          <label className="text-[11px] font-pop-accent font-bold text-[var(--pop-black)] uppercase tracking-wider">{t('email_label')}</label>
          <input
            type="email"
            placeholder="username@gmail.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="bg-[#FFFFFF] border-3 border-[var(--pop-black)] rounded-none px-4 py-3 text-xs text-[var(--pop-black)] font-bold focus:outline-none focus:bg-[var(--pop-cream)] focus:-translate-y-0.5 focus:-translate-x-0.5 transition-all shadow-[3px_3px_0_var(--pop-black)] focus:shadow-[5px_5px_0_var(--pop-black)]"
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-[11px] font-pop-accent font-bold text-[var(--pop-black)] uppercase tracking-wider">{t('password_label')}</label>
          <input
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="bg-[#FFFFFF] border-3 border-[var(--pop-black)] rounded-none px-4 py-3 text-xs text-[var(--pop-black)] font-bold focus:outline-none focus:bg-[var(--pop-cream)] focus:-translate-y-0.5 focus:-translate-x-0.5 transition-all shadow-[3px_3px_0_var(--pop-black)] focus:shadow-[5px_5px_0_var(--pop-black)]"
          />
        </div>

        <button
          type="submit"
          className="w-full mt-4 py-3.5 bg-[var(--pop-red)] text-white font-pop-accent font-black uppercase text-base border-3 border-[var(--pop-black)] shadow-[4px_4px_0_var(--pop-black)] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0_var(--pop-black)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[0_0_0_transparent] transition-all cursor-pointer"
        >
          {t('login_btn')}
        </button>

        <p className="text-center text-xs font-pop-body font-bold text-[var(--pop-black)]/60 mt-2">
          {t('no_account')}{' '}
          <button 
            type="button" 
            onClick={() => setPage('Register')}
            className="text-[var(--pop-red)] hover:underline font-bold font-pop-accent uppercase tracking-wider ml-1"
          >
            {t('register_now')}
          </button>
        </p>
      </form>
    </div>
  );
}
