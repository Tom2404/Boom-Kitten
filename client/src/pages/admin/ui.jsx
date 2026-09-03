import React, { forwardRef, useEffect, useRef } from 'react';
import { useLanguage } from '../../context/LanguageContext.jsx';

const toneMap = {
  neutral: 'border-[var(--admin-border)] bg-[var(--admin-surface-muted)] text-[var(--admin-text-muted)]',
  success: 'border-[var(--admin-success-border,var(--admin-border))] bg-[var(--admin-success-bg)] text-[var(--admin-success-text)]',
  warning: 'border-[var(--admin-warning-border,var(--admin-border))] bg-[var(--admin-warning-bg)] text-[var(--admin-warning-text)]',
  danger: 'border-[var(--admin-danger-border,var(--admin-border))] bg-[var(--admin-danger-bg)] text-[var(--admin-accent)]',
  info: 'border-[var(--admin-info-border,var(--admin-border))] bg-[var(--admin-info-bg)] text-[var(--admin-info-text)]',
};

export function AdminCard({ children, className = '' }) {
  return <section className={`rounded-xl border border-[var(--admin-border)] bg-[var(--admin-surface)] shadow-[0_1px_3px_rgba(0,0,0,0.03)] transition-all duration-200 ${className}`}>{children}</section>;
}

export function SectionHeader({ title, description, actions }) {
  return (
    <div className="flex flex-col gap-3 border-b border-[var(--admin-border)] pb-4 md:flex-row md:items-center md:justify-between">
      <div>
        <h2 className="text-xl font-semibold tracking-[-0.02em] text-[var(--admin-text)]">{title}</h2>
        {description && <p className="mt-0.5 max-w-3xl text-sm leading-5 text-[var(--admin-text-muted)]">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export function Toolbar({ children }) {
  return <div className="flex flex-col gap-3 rounded-xl border border-[var(--admin-border)] bg-[var(--admin-surface)] p-3.5 shadow-[0_1px_2px_rgba(0,0,0,0.02)] md:flex-row md:flex-wrap md:items-center md:justify-between">{children}</div>;
}

export function StatusBadge({ children, tone = 'neutral' }) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs font-semibold tracking-[0.01em] ${toneMap[tone] || toneMap.neutral}`}>
      {children}
    </span>
  );
}

export const Button = forwardRef(function Button({ children, variant = 'secondary', className = '', ...props }, ref) {
  const variants = {
    primary: 'border-[var(--admin-accent)] bg-[var(--admin-accent)] text-white hover:bg-[var(--admin-accent-hover)] shadow-sm',
    secondary: 'border-[var(--admin-border-strong)] bg-[var(--admin-surface)] text-[var(--admin-text)] hover:bg-[var(--admin-surface-muted)] hover:border-[var(--admin-border-strong)] shadow-[0_1px_2px_rgba(0,0,0,0.03)]',
    subtle: 'border-transparent bg-transparent text-[var(--admin-text-muted)] hover:bg-[var(--admin-surface-muted)] hover:text-[var(--admin-text)]',
    danger: 'border-[var(--admin-danger-text)] bg-[var(--admin-danger-text)] text-white hover:bg-[var(--admin-danger-hover)] shadow-sm',
    success: 'border-[var(--admin-success-text)] bg-[var(--admin-success-text)] text-white hover:bg-[var(--admin-success-hover)] shadow-sm',
  };

  return (
    <button
      className={`inline-flex min-h-10 items-center justify-center rounded-lg border px-3.5 py-2 text-sm font-semibold transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-[var(--admin-focus)] focus:ring-offset-2 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 ${variants[variant]} ${className}`}
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
      <span className="text-xs font-semibold tracking-[0.01em] text-[var(--admin-text-muted)]">{label}</span>
      {children}
      {error && <span className="text-xs font-medium text-[var(--admin-accent)]">{error}</span>}
    </label>
  );
}

export const inputClass =
  'min-h-10 w-full rounded-lg border border-[var(--admin-border-strong)] bg-[var(--admin-surface)] px-3 py-2 text-sm text-[var(--admin-text)] outline-none transition-all duration-200 placeholder:text-[var(--admin-text-muted)] focus:border-[var(--admin-accent)] focus:ring-2 focus:ring-[var(--admin-accent)]/15 disabled:cursor-not-allowed disabled:bg-[var(--admin-surface-muted)] disabled:text-[var(--admin-text-muted)]';

export function Alert({ children, tone = 'info' }) {
  return <div role={tone === 'danger' ? 'alert' : 'status'} className={`rounded-xl border px-4 py-3 text-sm font-medium leading-6 ${toneMap[tone] || toneMap.info}`}>{children}</div>;
}

export function EmptyState({ title, description, action }) {
  return (
    <div className="rounded-xl border border-dashed border-[var(--admin-border-strong)] bg-[var(--admin-surface)] px-4 py-12 text-center">
      <h3 className="text-base font-semibold text-[var(--admin-text)]">{title}</h3>
      {description && <p className="mx-auto mt-1.5 max-w-md text-sm leading-6 text-[var(--admin-text-muted)]">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function SkeletonBlock({ rows = 3, label = 'Đang tải dữ liệu' }) {
  return (
    <div className="space-y-3" aria-busy="true" aria-label={label}>
      {Array.from({ length: rows }).map((_, index) => (
        <div key={index} className="h-12 animate-pulse rounded-xl bg-[var(--admin-surface-muted)]" />
      ))}
    </div>
  );
}

export function DataTable({ columns, children, fit = false, columnWidths = [] }) {
  return (
    <div className={`${fit ? 'overflow-visible' : 'max-h-[64vh] overflow-auto'} rounded-xl border border-[var(--admin-border)] bg-[var(--admin-surface)] shadow-[0_1px_3px_rgba(0,0,0,0.02)]`}>
      <table className={`w-full border-collapse text-left text-sm ${fit ? 'table-fixed' : 'min-w-[860px]'}`}>
        {columnWidths.length > 0 && <colgroup>{columnWidths.map((width, index) => <col key={`${width}-${index}`} style={{ width }} />)}</colgroup>}
        <thead className="sticky top-0 z-10 bg-[var(--admin-surface-muted)] text-[11px] font-bold uppercase tracking-[0.08em] text-[var(--admin-text-muted)]">
          <tr>
            {columns.map((column) => (
              <th key={column} className={`border-b border-[var(--admin-border)] py-3 ${fit ? 'px-3' : 'px-4'}`}>
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--admin-border)] [&>tr]:transition-colors [&>tr:hover]:bg-[var(--admin-surface-muted)]/60">{children}</tbody>
      </table>
    </div>
  );
}

export function Pagination({ page, totalPages, onPageChange }) {
  const { language } = useLanguage();
  const en = language === 'en';
  if (totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-between gap-3 pt-2">
      <span className="text-xs font-semibold text-[var(--admin-text-muted)]">
        {en ? `Page ${page} of ${totalPages}` : `Trang ${page} / ${totalPages}`}
      </span>
      <div className="flex items-center gap-2">
        <Button variant="secondary" className="min-h-9 px-3 py-1 text-xs" disabled={page === 1} onClick={() => onPageChange(page - 1)}>
          {en ? 'Previous' : 'Trước'}
        </Button>
        <Button variant="secondary" className="min-h-9 px-3 py-1 text-xs" disabled={page === totalPages} onClick={() => onPageChange(page + 1)}>
          {en ? 'Next' : 'Sau'}
        </Button>
      </div>
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-[3px]" role="dialog" aria-modal="true" aria-labelledby="admin-confirm-title" aria-describedby="admin-confirm-description">
      <div ref={dialogRef} className="w-full max-w-md rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-surface)] p-6 shadow-[0_20px_50px_rgba(0,0,0,0.12)]">
        <h2 id="admin-confirm-title" className="text-lg font-semibold tracking-[-0.01em] text-[var(--admin-text)]">
          {title}
        </h2>
        <p id="admin-confirm-description" className="mt-2 text-sm leading-6 text-[var(--admin-text-muted)]">{description}</p>
        {children && <div className="mt-4">{children}</div>}
        <div className="mt-6 flex justify-end gap-2">
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
