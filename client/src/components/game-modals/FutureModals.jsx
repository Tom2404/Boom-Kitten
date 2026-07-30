import React from 'react';
import { Reorder, useReducedMotion } from 'framer-motion';
import Card from '../Card.jsx';
import { useLanguage } from '../../context/LanguageContext.jsx';
import {
  createInteractionExpiry,
  getInteractionClock,
  moveCardByOffset,
} from '../../utils/gameModalUi.js';
import { PixelDialogShell } from '../ui/PixelDialogShell.jsx';

function FutureSlot({ card, index, children }) {
  const { t } = useLanguage();

  return (
    <div className="future-slot">
      <span className="future-slot__label">
        {index === 0
          ? t('future_top')
          : t('future_position', { position: index + 1 })}
      </span>
      <Card
        type={card.type}
        skinIndex={card.skinIndex ?? 0}
        disabled
      />
      {children}
    </div>
  );
}

export function SeeFutureModal({ cards = [], onClose }) {
  const { t } = useLanguage();
  if (!cards.length) return null;

  return (
    <PixelDialogShell
      dismissible={false}
      maxWidth="max-w-5xl"
      tone="success"
      variant="crt"
      title={t('future_see_title')}
      description={t('future_see_description', { count: cards.length })}
      footer={(
        <button
          type="button"
          className="pixel-dialog__button pixel-dialog__button--confirm"
          onClick={onClose}
        >
          {t('future_done')}
        </button>
      )}
    >
      <div className="future-rail">
        {cards.map((card, index) => (
          <React.Fragment key={card.id || `${card.type}-${index}`}>
            {index > 0 && <span className="future-rail__connector" aria-hidden="true">▶</span>}
            <FutureSlot card={card} index={index} />
          </React.Fragment>
        ))}
      </div>
    </PixelDialogShell>
  );
}

export function AlterFutureModal({
  cards = [],
  expiresAt,
  onConfirm,
  timeoutMs = 15_000,
}) {
  const { t } = useLanguage();
  const reduceMotion = useReducedMotion();
  const fallbackExpiry = React.useRef(createInteractionExpiry(timeoutMs));
  const deadline = Number.isFinite(expiresAt) ? expiresAt : fallbackExpiry.current;
  const [order, setOrder] = React.useState(cards);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [announcement, setAnnouncement] = React.useState('');
  const [clock, setClock] = React.useState(() => (
    getInteractionClock(deadline, Date.now(), timeoutMs)
  ));

  React.useEffect(() => {
    setOrder(cards);
    setIsSubmitting(false);
    setAnnouncement('');
  }, [cards]);

  React.useEffect(() => {
    const updateClock = () => setClock(getInteractionClock(deadline, Date.now(), timeoutMs));
    updateClock();
    const timer = window.setInterval(updateClock, 250);
    return () => window.clearInterval(timer);
  }, [deadline, timeoutMs]);

  if (!cards.length) return null;

  const move = (index, offset) => {
    setOrder((current) => moveCardByOffset(current, index, offset));
    const nextPosition = index + offset + 1;
    setAnnouncement(t('future_position', { position: nextPosition }));
  };

  const submit = () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    onConfirm(order.map((card) => card.id));
  };

  return (
    <PixelDialogShell
      dismissible={false}
      maxWidth="max-w-6xl"
      tone="warning"
      variant="crt"
      title={t('future_alter_title')}
      description={t('future_alter_description')}
      footer={(
        <>
          <div className="pixel-interaction-clock" aria-live="polite">
            <span>{t('future_countdown', { seconds: clock.seconds })}</span>
            <span className="pixel-interaction-clock__track" aria-hidden="true">
              <span style={{ width: `${clock.progress}%` }} />
            </span>
          </div>
          <button
            type="button"
            className="pixel-dialog__button pixel-dialog__button--confirm"
            onClick={submit}
            disabled={isSubmitting}
          >
            {isSubmitting ? t('future_sending') : t('future_confirm')}
          </button>
        </>
      )}
    >
      <p className="sr-only" aria-live="polite">{announcement}</p>
      <Reorder.Group
        axis="x"
        values={order}
        onReorder={setOrder}
        className="future-rail future-rail--alter"
      >
        {order.map((card, index) => (
          <Reorder.Item
            as="div"
            key={card.id}
            value={card}
            drag={!reduceMotion && !isSubmitting ? 'x' : false}
            className="future-reorder-item"
          >
            <FutureSlot card={card} index={index}>
              <span className="future-slot__drag-hint">{t('future_drag_hint')}</span>
              <div className="future-slot__controls">
                <button
                  type="button"
                  aria-label={t('future_move_left')}
                  onPointerDown={(event) => event.stopPropagation()}
                  onClick={() => move(index, -1)}
                  disabled={index === 0 || isSubmitting}
                >
                  ◀
                </button>
                <button
                  type="button"
                  aria-label={t('future_move_right')}
                  onPointerDown={(event) => event.stopPropagation()}
                  onClick={() => move(index, 1)}
                  disabled={index === order.length - 1 || isSubmitting}
                >
                  ▶
                </button>
              </div>
            </FutureSlot>
          </Reorder.Item>
        ))}
      </Reorder.Group>
    </PixelDialogShell>
  );
}
