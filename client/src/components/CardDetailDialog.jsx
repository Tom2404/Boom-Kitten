import React from 'react';
import { PixelDialogShell } from './ui/PixelDialogShell.jsx';

export default function CardDetailDialog({
  canSelect,
  cardDesc,
  cardImageUrl,
  cardName,
  imageError,
  isOpen,
  onClose,
  onImageError,
  onSelect,
  selected,
  t,
  theme,
}) {
  return (
    <PixelDialogShell
      isOpen={isOpen}
      onClose={onClose}
      title={cardName}
      description={t('card_detail_hint')}
      tone={selected ? 'danger' : 'warning'}
      variant="paper"
      maxWidth="max-w-lg"
      footer={(
        <>
          <button
            type="button"
            onClick={onClose}
            className="pixel-dialog__button pixel-dialog__button--muted"
          >
            {t('button_close')}
          </button>
          {canSelect && (
            <button
              type="button"
              onClick={() => {
                onSelect();
                onClose();
              }}
              className="pixel-dialog__button pixel-dialog__button--primary"
            >
              {selected ? t('card_deselect') : t('card_select')}
            </button>
          )}
        </>
      )}
    >
      <div className="grid items-center gap-5 sm:grid-cols-[11rem_minmax(0,1fr)]">
        <div className={`mx-auto flex h-60 w-44 flex-col justify-between border-3 border-slate-950 p-3 shadow-[5px_5px_0_#241914] ${theme.color}`}>
          <div className="flex items-start justify-between gap-2">
            <strong className="font-headline text-xs font-black uppercase">{cardName}</strong>
            <span className="text-lg" aria-hidden="true">{theme.icon}</span>
          </div>
          <div className="flex flex-1 items-center justify-center">
            {cardImageUrl && !imageError ? (
              <img
                src={cardImageUrl}
                alt={cardName}
                className="h-36 w-36 object-contain drop-shadow"
                onError={onImageError}
              />
            ) : (
              <span className="text-6xl" aria-hidden="true">{theme.icon}</span>
            )}
          </div>
          <span className="font-mono text-[9px] font-bold uppercase">BOOM KITTEN // CARD</span>
        </div>

        <section className="border-2 border-slate-950 bg-[#fff8e5] p-4 text-left shadow-[3px_3px_0_#241914]">
          <span className="mb-2 block font-mono text-[10px] font-black uppercase tracking-widest text-[#a52f29]">
            {t('card_function')}
          </span>
          <p className="text-sm font-bold leading-6 text-slate-900">{cardDesc}</p>
        </section>
      </div>
    </PixelDialogShell>
  );
}

