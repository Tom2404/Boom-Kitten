import React, { forwardRef, useEffect, useRef } from 'react';
import { useLanguage } from '../../context/LanguageContext.jsx';

const toneMap = {
  neutral: 'border-[var(--pop-black)] bg-[#fffdf5] text-[var(--pop-black)]',
  success: 'border-[var(--pop-black)] bg-[#d9f99d] text-[#163c20]',
  warning: 'border-[var(--pop-black)] bg-[var(--pop-amber)] text-[var(--pop-black)]',
  danger: 'border-[var(--pop-black)] bg-[var(--pop-red)] text-white',
  info: 'border-[var(--pop-black)] bg-[#bae6fd] text-[#123b57]',
};

export function AdminCard({ children, className = '' }) {
  return <section className={`border-[3px] border-[var(--pop-black)] bg-[#fffdf5] shadow-[4px_4px_0_var(--pop-black)] ${className}`}>{children}</section>;
}

export function SectionHeader({ title, description, actions }) {
  return (
    <div className="flex flex-col gap-3 border-b-[3px] border-[var(--pop-black)] pb-4 md:flex-row md:items-start md:justify-between">
      <div>
        <h2 className="font-pop-display text-xl font-black uppercase text-[var(--pop-black)]">{title}</h2>
        {description && <p className="mt-1 max-w-3xl font-sans text-sm font-semibold leading-6 text-[#65483d]">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function Toolbar({ children }) {
  return <div className="flex flex-col gap-3 border-[3px] border-[var(--pop-black)] bg-[#f5e7c8] p-3 shadow-[3px_3px_0_var(--pop-black)] md:flex-row md:flex-wrap md:items-end">{children}</div>;
}

export function StatusBadge({ children, tone = 'neutral' }) {
  return (
    <span className={`inline-flex items-center border-2 px-2 py-0.5 font-sans text-xs font-bold uppercase ${toneMap[tone] || toneMap.neutral}`}>
      {children}
    </span>
  );
}

export const Button = forwardRef(function Button({ children, variant = 'secondary', className = '', ...props }, ref) {
  const variants = {
    primary: 'bg-[#2563eb] text-white hover:bg-[#1d4ed8]',
    secondary: 'bg-[#fffdf5] text-[var(--pop-black)] hover:bg-[#f5e7c8]',
    subtle: 'bg-[#f5e7c8] text-[var(--pop-black)] hover:bg-[var(--pop-amber)]',
    danger: 'bg-[var(--pop-red)] text-white hover:bg-[#b91c1c]',
    success: 'bg-[var(--pop-green)] text-white hover:brightness-90',
  };

  return (
    <button
      className={`inline-flex min-h-10 items-center justify-center border-[3px] border-[var(--pop-black)] px-3 py-2 font-sans text-sm font-bold uppercase shadow-[3px_3px_0_var(--pop-black)] transition-[transform,box-shadow,background-color] hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-[#2563eb] focus:ring-offset-2 active:translate-x-[3px] active:translate-y-[3px] active:shadow-none disabled:cursor-not-allowed disabled:opacity-50 ${variants[variant]} ${className}`}
      ref={ref}
      {...props}
    >
      {children}
    </button>
  );
});

export function Field({ label, children, error }) {
  return (
    <label className="flex min-w-0 flex-1 flex-col gap-1 font-sans text-sm font-bold text-[var(--pop-black)]">
      <span>{label}</span>
      {children}
      {error && <span className="text-xs font-semibold text-red-600">{error}</span>}
    </label>
  );
}

export const inputClass =
  'min-h-11 w-full border-[3px] border-[var(--pop-black)] bg-[#fffdf5] px-3 py-2 font-sans text-sm font-semibold text-[var(--pop-black)] outline-none shadow-[2px_2px_0_var(--pop-black)] transition placeholder:text-[#8a6a5c] focus:bg-white focus:ring-2 focus:ring-[#2563eb] focus:ring-offset-1';

export function Alert({ children, tone = 'info' }) {
  return <div role="status" className={`border-[3px] px-4 py-3 font-sans text-sm font-bold shadow-[3px_3px_0_var(--pop-black)] ${toneMap[tone] || toneMap.info}`}>{children}</div>;
}

export function EmptyState({ title, description, action }) {
  return (
    <div className="border-[3px] border-dashed border-[var(--pop-black)] bg-[#f5e7c8] px-4 py-10 text-center">
      <h3 className="font-pop-display text-base font-black text-slate-800">{title}</h3>
      {description && <p className="mx-auto mt-2 max-w-md text-sm font-semibold text-slate-500">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function SkeletonBlock({ rows = 3 }) {
  return (
    <div className="space-y-3" aria-busy="true" aria-label="Đang tải dữ liệu">
      {Array.from({ length: rows }).map((_, index) => (
        <div key={index} className="h-14 animate-pulse border-[3px] border-[var(--pop-black)] bg-[#ead9b5]" />
      ))}
    </div>
  );
}

export function DataTable({ columns, children, fit = false, columnWidths = [] }) {
  return (
    <div className={`${fit ? 'overflow-visible' : 'max-h-[62vh] overflow-auto'} border-[3px] border-[var(--pop-black)] bg-[#fffdf5] shadow-[4px_4px_0_var(--pop-black)]`}>
      <table className={`w-full border-collapse text-left font-sans text-sm ${fit ? 'table-fixed' : 'min-w-[860px]'}`}>
        {columnWidths.length > 0 && <colgroup>{columnWidths.map((width, index) => <col key={`${width}-${index}`} style={{ width }} />)}</colgroup>}
        <thead className="sticky top-0 z-10 bg-[var(--pop-black)] text-sm font-black uppercase tracking-wide text-[#fff7df]">
          <tr>
            {columns.map((column) => (
              <th key={column} className={`border-b-[3px] border-[var(--pop-black)] py-3 ${fit ? 'px-2 text-xs' : 'px-3'}`}>
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y-2 divide-[var(--pop-black)] [&>tr:nth-child(even)]:bg-[#f5e7c8] [&>tr]:transition-colors [&>tr:hover]:bg-[#ffedac]">{children}</tbody>
      </table>
    </div>
  );
}

export function Pagination({ page, totalPages, onPageChange }) {
  const { language } = useLanguage();
  const en = language === 'en';
  if (totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-center gap-3">
      <Button variant="secondary" disabled={page === 1} onClick={() => onPageChange(page - 1)}>
        {en ? 'Previous' : 'Trước'}
      </Button>
      <span className="text-sm font-bold text-slate-600">
        {en ? 'Page' : 'Trang'} {page} / {totalPages}
      </span>
      <Button variant="secondary" disabled={page === totalPages} onClick={() => onPageChange(page + 1)}>
        {en ? 'Next' : 'Sau'}
      </Button>
    </div>
  );
}

export function ConfirmDialog({ open, title, description, confirmLabel, tone = 'danger', onConfirm, onClose }) {
  const closeRef = useRef(null);
  const { language } = useLanguage();

  useEffect(() => {
    if (!open) return undefined;
    closeRef.current?.focus();
    const onKeyDown = (event) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/60 p-4" role="dialog" aria-modal="true" aria-labelledby="admin-confirm-title">
      <div className="w-full max-w-md border-[4px] border-[var(--pop-black)] bg-[#fff7df] p-5 shadow-[8px_8px_0_var(--pop-black)]">
        <h2 id="admin-confirm-title" className="text-lg font-pop-display font-black text-slate-950">
          {title}
        </h2>
        <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">{description}</p>
        <div className="mt-5 flex justify-end gap-2">
          <Button ref={closeRef} type="button" variant="secondary" onClick={onClose}>
            {language === 'en' ? 'Cancel' : 'Hủy'}
          </Button>
          <Button type="button" variant={tone} onClick={onConfirm}>
            {confirmLabel || (language === 'en' ? 'Confirm' : 'Xác nhận')}
          </Button>
        </div>
      </div>
    </div>
  );
}
