import React from 'react';
import Card from './Card.jsx';
import { PixelDialogShell } from './ui/PixelDialogShell.jsx';

export default function Combo5SelectionModal({ cards = [], isOpen, onSelect }) {
  if (!isOpen) return null;

  const newestFirst = [...cards].reverse();

  const activateCard = (event, cardId) => {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    onSelect(cardId);
  };

  return (
    <PixelDialogShell
      dismissible={false}
      isOpen={isOpen}
      maxWidth="max-w-5xl"
      tone="warning"
      variant="crt"
      title="COMBO 5 // THU HỒI LÁ"
      description="Bạn đã đánh 5 lá mèo khác nhau. Chọn 1 lá để đưa trở lại tay."
      footer={(
        <div className="combo5-dialog__footer" role="status">
          <span className="combo5-dialog__footer-mark" aria-hidden="true">!</span>
          <span>Chọn đúng một lá bài để tiếp tục lượt chơi.</span>
        </div>
      )}
    >
      <div className="combo5-dialog__callout">
        <strong>PHẦN THƯỞNG COMBO ĐÃ MỞ KHÓA</strong>
        <span>Chồng bài bỏ · {cards.length} lá khả dụng</span>
      </div>

      <div className="combo5-dialog__grid" aria-label="Các lá bài có thể thu hồi">
        {newestFirst.map((card, index) => (
          <div
            key={card.id || `${card.type}-${index}`}
            role="button"
            tabIndex={0}
            aria-label={`Lấy lại lá ${card.type}`}
            className="combo5-dialog__card"
            onClick={() => onSelect(card.id)}
            onKeyDown={(event) => activateCard(event, card.id)}
          >
            {index === 0 && <span className="combo5-dialog__badge">MỚI NHẤT</span>}
            <Card
              type={card.type}
              skinIndex={card.skinIndex ?? 0}
              compact
              disabled={false}
              hideInfo
            />
            <span className="combo5-dialog__select-label">LẤY LÁ NÀY</span>
          </div>
        ))}
      </div>
    </PixelDialogShell>
  );
}
