import React from 'react';
import Card from '../Card.jsx';
import { useLanguage } from '../../context/LanguageContext.jsx';
import { createInteractionExpiry, getInteractionClock } from '../../utils/gameModalUi.js';
import { PixelDialogShell } from '../ui/PixelDialogShell.jsx';

export default function FavorRequestModal({
  expiresAt,
  fromPlayerId,
  fromPlayerName,
  hand = [],
  onRespond,
  timeoutMs = 15_000,
}) {
  const { t } = useLanguage();
  const fallbackExpiry = React.useRef(createInteractionExpiry(timeoutMs));
  const deadline = Number.isFinite(expiresAt) ? expiresAt : fallbackExpiry.current;
  const [clock, setClock] = React.useState(() => (
    getInteractionClock(deadline, Date.now(), timeoutMs)
  ));
  const [selectedId, setSelectedId] = React.useState(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  React.useEffect(() => {
    setSelectedId((current) => (
      hand.some((card) => card.id === current) ? current : null
    ));
  }, [hand]);

  React.useEffect(() => {
    const updateClock = () => setClock(getInteractionClock(deadline, Date.now(), timeoutMs));
    updateClock();
    const timer = window.setInterval(updateClock, 250);
    return () => window.clearInterval(timer);
  }, [deadline, timeoutMs]);

  const submit = () => {
    if (!selectedId || isSubmitting) return;
    setIsSubmitting(true);
    onRespond(selectedId);
  };

  return (
    <PixelDialogShell
      dismissible={false}
      maxWidth="max-w-4xl"
      tone="warning"
      variant="crt"
      title={t('favor_title')}
      description={t('favor_description', {
        player: fromPlayerName || fromPlayerId || t('anonymous'),
      })}
      footer={(
        <>
          <div className="pixel-interaction-clock" aria-live="polite">
            <span>{t('favor_countdown', { seconds: clock.seconds })}</span>
            <span className="pixel-interaction-clock__track" aria-hidden="true">
              <span style={{ width: `${clock.progress}%` }} />
            </span>
          </div>
          <button
            type="button"
            className="pixel-dialog__button pixel-dialog__button--confirm"
            onClick={submit}
            disabled={!selectedId || isSubmitting}
          >
            {isSubmitting ? t('favor_sending') : t('favor_send')}
          </button>
        </>
      )}
    >
      {hand.length ? (
        <div className="pixel-card-rail" aria-label={t('favor_title')}>
          {hand.map((card) => (
            <div key={card.id} className="pixel-card-rail__item">
              <Card
                type={card.type}
                skinIndex={card.skinIndex ?? 0}
                selected={selectedId === card.id}
                disabled={isSubmitting}
                onClick={() => setSelectedId(card.id)}
              />
            </div>
          ))}
        </div>
      ) : (
        <p className="pixel-dialog__empty">{t('favor_empty')}</p>
      )}
    </PixelDialogShell>
  );
}
