import React, { forwardRef, useEffect, useRef } from 'react';
import { useLanguage } from '../../context/LanguageContext.jsx';

const toneMap = {
  neutral: 'border-[var(--admin-border)] bg-[var(--admin-surface-muted)] text-[var(--admin-text)]',
  success: 'border-[var(--admin-success-text)] bg-[var(--admin-success-bg)] text-[var(--admin-success-text)]',
  warning: 'border-[var(--admin-warning-text)] bg-[var(--admin-warning-bg)] text-[var(--admin-warning-text)]',
  danger: 'border-[var(--admin-danger-text)] bg-[var(--admin-danger-bg)] text-[var(--admin-danger-text)]',
  info: 'border-[var(--admin-info-text)] bg-[var(--admin-info-bg)] text-[var(--admin-info-text)]',
};

export function AdminCard({ children, className = '' }) {
  return <section className={`rounded-xl border border-[var(--admin-border)] bg-[var(--admin-surface)] shadow-[0_1px_2px_rgba(32,35,31,0.03)] ${className}`}>{children}</section>;
}

export function SectionHeader({ title, description, actions }) {
  return (
    <div className="flex flex-col gap-3 border-b border-[var(--admin-border)] pb-5 md:flex-row md:items-start md:justify-between">
      <div>
        <h2 className="text-xl font-semibold tracking-[-0.02em] text-[var(--admin-text)]">{title}</h2>
        {description && <p className="mt-1 max-w-3xl text-sm leading-6 text-[var(--admin-text-muted)]">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function Toolbar({ children }) {
  return <div className="flex flex-col gap-3 rounded-lg border border-[var(--admin-border)] bg-[var(--admin-surface-raised)] p-3 md:flex-row md:flex-wrap md:items-end">{children}</div>;
}

export function StatusBadge({ children, tone = 'neutral' }) {
  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold tracking-[0.02em] ${toneMap[tone] || toneMap.neutral}`}>
      {children}
    </span>
  );
}

export const Button = forwardRef(function Button({ children, variant = 'secondary', className = '', ...props }, ref) {
  const variants = {
    primary: 'border-[var(--admin-accent)] bg-[var(--admin-accent)] text-white hover:border-[var(--admin-accent-hover)] hover:bg-[var(--admin-accent-hover)]',
    secondary: 'border-[var(--admin-border-strong)] bg-[var(--admin-surface)] text-[var(--admin-text)] hover:bg-[var(--admin-surface-muted)]',
    subtle: 'border-transparent bg-transparent text-[var(--admin-text-muted)] hover:bg-[var(--admin-surface-muted)] hover:text-[var(--admin-text)]',
    danger: 'border-[var(--admin-danger-text)] bg-[var(--admin-danger-text)] text-white hover:bg-[var(--admin-danger-hover)]',
    success: 'border-[var(--admin-success-text)] bg-[var(--admin-success-text)] text-white hover:bg-[var(--admin-success-hover)]',
  };

  return (
    <button
      className={`inline-flex min-h-11 items-center justify-center rounded-md border px-3 py-2 text-sm font-semibold transition-[transform,background-color,border-color,color] duration-200 focus:outline-none focus:ring-2 focus:ring-[var(--admin-focus)] focus:ring-offset-2 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 ${variants[variant]} ${className}`}
      ref={ref}
      {...props}
    >
      {children}
    </button>
  );
});

export function Field({ label, children, error }) {
  return (
    <label className="flex min-w-0 flex-1 flex-col gap-1.5 text-sm font-medium text-[var(--admin-text)]">
      <span>{label}</span>
      {children}
      {error && <span className="text-xs font-medium text-[var(--admin-danger-text)]">{error}</span>}
    </label>
  );
}

export const inputClass =
  'min-h-11 w-full rounded-md border border-[var(--admin-border-strong)] bg-[var(--admin-surface)] px-3 py-2 text-sm text-[var(--admin-text)] outline-none transition-[border-color,box-shadow,background-color] duration-200 placeholder:text-[var(--admin-text-muted)] focus:border-[var(--admin-focus)] focus:ring-2 focus:ring-[var(--admin-focus)]/20 disabled:cursor-not-allowed disabled:bg-[var(--admin-surface-muted)] disabled:text-[var(--admin-text-muted)]';

export function Alert({ children, tone = 'info' }) {
  return <div role={tone === 'danger' ? 'alert' : 'status'} className={`rounded-lg border px-4 py-3 text-sm font-medium leading-6 ${toneMap[tone] || toneMap.info}`}>{children}</div>;
}

export function EmptyState({ title, description, action }) {
  return (
    <div className="rounded-lg border border-dashed border-[var(--admin-border-strong)] bg-[var(--admin-surface-raised)] px-4 py-10 text-center">
      <h3 className="text-base font-semibold text-[var(--admin-text)]">{title}</h3>
      {description && <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[var(--admin-text-muted)]">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function SkeletonBlock({ rows = 3, label = 'Đang tải dữ liệu' }) {
  return (
    <div className="space-y-3" aria-busy="true" aria-label={label}>
      {Array.from({ length: rows }).map((_, index) => (
        <div key={index} className="h-14 animate-pulse rounded-lg bg-[var(--admin-surface-muted)]" />
      ))}
    </div>
  );
}

export function DataTable({ columns, children, fit = false, columnWidths = [] }) {
  return (
    <div className={`${fit ? 'overflow-visible' : 'max-h-[62vh] overflow-auto'} rounded-lg border border-[var(--admin-border)] bg-[var(--admin-surface)]`}>
      <table className={`w-full border-collapse text-left text-sm ${fit ? 'table-fixed' : 'min-w-[860px]'}`}>
        {columnWidths.length > 0 && <colgroup>{columnWidths.map((width, index) => <col key={`${width}-${index}`} style={{ width }} />)}</colgroup>}
        <thead className="sticky top-0 z-10 bg-[var(--admin-surface-muted)] text-xs font-semibold tracking-[0.04em] text-[var(--admin-text-muted)]">
          <tr>
            {columns.map((column) => (
              <th key={column} className={`border-b border-[var(--admin-border)] py-3 ${fit ? 'px-2' : 'px-3'}`}>
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--admin-border)] [&>tr]:transition-colors [&>tr:hover]:bg-[var(--admin-surface-raised)]">{children}</tbody>
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
      <span className="text-sm font-medium text-[var(--admin-text-muted)]">
        {en ? 'Page' : 'Trang'} {page} / {totalPages}
      </span>
      <Button variant="secondary" disabled={page === totalPages} onClick={() => onPageChange(page + 1)}>
        {en ? 'Next' : 'Sau'}
      </Button>
    </div>
  );
}

export function ConfirmDialog({ open, title, description, confirmLabel, tone = 'danger', onConfirm, onClose, children, confirmDisabled = false }) {
  const closeRef = useRef(null);
  const dialogRef = useRef(null);
  const { language } = useLanguage();

  useEffect(() => {
    if (!open) return undefined;
    const previousFocus = document.activeElement;
    closeRef.current?.focus();
    const onKeyDown = (event) => {
      if (event.key === 'Escape') onClose();
      const focusable = dialogRef.current?.querySelectorAll(
        'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
      );
      if (event.key !== 'Tab' || !focusable?.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      previousFocus?.focus?.();
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-[2px]" role="dialog" aria-modal="true" aria-labelledby="admin-confirm-title" aria-describedby="admin-confirm-description">
      <div ref={dialogRef} className="w-full max-w-md rounded-xl border border-[var(--admin-border)] bg-[var(--admin-surface)] p-5 shadow-[0_24px_60px_rgba(15,23,42,0.16)]">
        <h2 id="admin-confirm-title" className="text-lg font-semibold tracking-[-0.01em] text-[var(--admin-text)]">
          {title}
        </h2>
        <p id="admin-confirm-description" className="mt-2 text-sm leading-6 text-[var(--admin-text-muted)]">{description}</p>
        {children && <div className="mt-4">{children}</div>}
        <div className="mt-5 flex justify-end gap-2">
          <Button ref={closeRef} type="button" variant="secondary" onClick={onClose}>
            {language === 'en' ? 'Cancel' : 'Hủy'}
          </Button>
          <Button type="button" variant={tone} onClick={onConfirm} disabled={confirmDisabled}>
            {confirmLabel || (language === 'en' ? 'Confirm' : 'Xác nhận')}
          </Button>
        </div>
      </div>
    </div>
  );
}
