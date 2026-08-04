import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { OverlayPortal } from './OverlayPortal.jsx';

const FOCUSABLE_SELECTOR = [
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[href]',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

export function PixelDialogShell({
  children,
  description,
  dismissible = true,
  footer,
  isOpen = true,
  maxWidth = 'max-w-xl',
  onClose,
  title,
  tone = 'neutral',
  variant = 'paper',
}) {
  const dialogRef = React.useRef(null);
  const titleId = React.useId();
  const descriptionId = React.useId();
  const reduceMotion = useReducedMotion();

  React.useEffect(() => {
    if (!isOpen) return undefined;

    const previousFocus = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const focusDialog = window.requestAnimationFrame(() => {
      const focusable = dialogRef.current?.querySelectorAll(FOCUSABLE_SELECTOR);
      (focusable?.[0] || dialogRef.current)?.focus();
    });

    const onKeyDown = (event) => {
      if (event.key === 'Escape' && dismissible && onClose) {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key !== 'Tab') return;

      const focusable = dialogRef.current?.querySelectorAll(FOCUSABLE_SELECTOR);
      if (!focusable?.length) {
        event.preventDefault();
        dialogRef.current?.focus();
        return;
      }

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
      window.cancelAnimationFrame(focusDialog);
      window.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previousOverflow;
      previousFocus?.focus?.();
    };
  }, [dismissible, isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <OverlayPortal>
      <div
        className="pixel-dialog-layer"
        onMouseDown={(event) => {
          if (event.target === event.currentTarget && dismissible && onClose) onClose();
        }}
      >
        <motion.section
          ref={dialogRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          aria-describedby={description ? descriptionId : undefined}
          aria-live="polite"
          tabIndex={-1}
          data-tone={tone}
          data-variant={variant}
          className={`pixel-dialog ${maxWidth}`}
          initial={reduceMotion ? false : { opacity: 0, y: 22, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={reduceMotion
            ? { duration: 0 }
            : { duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
        >
          <span className="pixel-dialog__status" aria-hidden="true" />
          <header className="pixel-dialog__header">
            <span className="pixel-dialog__eyebrow" aria-hidden="true">
              SYS//DIALOG
            </span>
            <h2 id={titleId}>{title}</h2>
            {description && <p id={descriptionId}>{description}</p>}
          </header>
          <div className="pixel-dialog__content">{children}</div>
          {footer && <footer className="pixel-dialog__footer">{footer}</footer>}
        </motion.section>
      </div>
    </OverlayPortal>
  );
}

