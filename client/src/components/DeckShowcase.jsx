import React, { useState } from 'react';
import { getCardImageUrl } from '../utils/cardSkins.js';
import { useLanguage } from '../context/LanguageContext.jsx';

/**
 * DeckShowcase - A new section displaying core cards of Exploding Kittens.
 * Features an interactive grid of cards and a bold Pop Art information panel 
 * displaying details on hover.
 * Supports dual language (VI/EN).
 */
export default function DeckShowcase() {
  const { language } = useLanguage();

  const t = {
    vi: {
      sectionTitle: "BỘ BÀI SIÊU QUẬY",
      sectionSubtext: "Rà chuột qua từng lá bài để xem chức năng phá hoại",
      infoTag: "THÔNG TIN LÁ BÀI",
    },
    en: {
      sectionTitle: "THE POWER DECK",
      sectionSubtext: "Hover over each card to view its destructive power",
      infoTag: "CARD SPECIFICATION",
    }
  }[language] || {
    sectionTitle: "THE POWER DECK",
    sectionSubtext: "Hover over each card to view its destructive power",
    infoTag: "CARD SPECIFICATION",
  };

  const cardsData = {
    vi: [
      {
        id: 'exploding_kitten',
        name: 'Mèo Nổ',
        desc: 'Bốc trúng lá này mà không có bài Gỡ Bom, bạn sẽ bị nổ tung và loại khỏi cuộc chơi ngay lập tức! Đây là nỗi ác mộng của mọi người chơi.',
        img: getCardImageUrl('exploding_kitten', 0),
        color: 'var(--pop-red)',
      },
      {
        id: 'defuse',
        name: 'Gỡ Bom',
        desc: 'Phao cứu sinh duy nhất! Cho phép bạn vô hiệu hóa lá Mèo Nổ, sau đó bí mật đặt lại lá Mèo Nổ vào bất kỳ vị trí nào trong xấp bài bốc để gài bẫy đứa bạn.',
        img: getCardImageUrl('defuse', 0),
        color: 'var(--pop-amber)',
      },
      {
        id: 'nope',
        name: 'Nope (Miễn Bàn)',
        desc: 'Hủy bỏ hiệu ứng của lá bài vừa đánh ra (trừ lá Gỡ Bom hoặc lá Nope khác). Tạo nên những màn tranh cãi nảy lửa và lật kèo điên rồ ở giây cuối!',
        img: getCardImageUrl('nope', 0),
        color: 'var(--pop-orange)',
      },
      {
        id: 'attack',
        name: 'Tấn Công',
        desc: 'Ép đối thủ chịu trận! Kết thúc lượt của bạn mà không cần rút bài, đồng thời bắt buộc người chơi tiếp theo phải thực hiện liên tiếp 2 lượt đấu.',
        img: getCardImageUrl('attack', 0),
        color: 'var(--pop-red)',
      },
      {
        id: 'see_the_future',
        name: 'Xem Tương Lai',
        desc: 'Nhìn thấu vận mệnh! Cho phép bạn xem trước bí mật 3 lá bài đầu tiên trên cùng của xấp bài rút để chuẩn bị chiến thuật né bom.',
        img: getCardImageUrl('see_the_future_1', 0),
        color: 'var(--pop-cream)',
      },
      {
        id: 'skip',
        name: 'Bỏ Lượt',
        desc: 'Né bom hèn nhát nhưng hiệu quả! Cho phép bạn kết thúc lượt đi hiện tại ngay lập tức mà không cần phải rút bất kỳ lá bài nào.',
        img: getCardImageUrl('skip', 0),
        color: 'var(--pop-cream)',
      },
    ],
    en: [
      {
        id: 'exploding_kitten',
        name: 'Exploding Kitten',
        desc: 'Draw this card and have no Defuse -> you explode and get eliminated immediately! The ultimate nightmare of every player.',
        img: getCardImageUrl('exploding_kitten', 0),
        color: 'var(--pop-red)',
      },
      {
        id: 'defuse',
        name: 'Defuse',
        desc: 'Your only lifeline! Defuse the Exploding Kitten, then secretly put it back anywhere you want in the draw pile to trap your friends.',
        img: getCardImageUrl('defuse', 0),
        color: 'var(--pop-amber)',
      },
      {
        id: 'nope',
        name: 'Nope',
        desc: 'Cancel the effect of the last card played (except Defuse or another Nope). Triggers chaotic arguments and clutch last-second plays!',
        img: getCardImageUrl('nope', 0),
        color: 'var(--pop-orange)',
      },
      {
        id: 'attack',
        name: 'Attack',
        desc: 'Force others to face the heat! End your turn without drawing a card, and force the next player to take 2 turns in a row.',
        img: getCardImageUrl('attack', 0),
        color: 'var(--pop-red)',
      },
      {
        id: 'see_the_future',
        name: 'See the Future',
        desc: 'Peek into destiny! Secretly view the top 3 cards of the draw pile to plan your strategy and avoid explosions.',
        img: getCardImageUrl('see_the_future_1', 0),
        color: 'var(--pop-cream)',
      },
      {
        id: 'skip',
        name: 'Skip',
        desc: 'A cowardly but highly effective move! Instantly end your current turn without drawing a card.',
        img: getCardImageUrl('skip', 0),
        color: 'var(--pop-cream)',
      },
    ]
  }[language] || {
    vi: [], // fallback to en
    en: []
  };

  const cards = cardsData.length > 0 ? cardsData : [
    {
      id: 'exploding_kitten',
      name: 'Exploding Kitten',
      desc: 'Draw this card and have no Defuse -> you explode and get eliminated immediately! The ultimate nightmare of every player.',
      img: getCardImageUrl('exploding_kitten', 0),
      color: 'var(--pop-red)',
    },
    {
      id: 'defuse',
      name: 'Defuse',
      desc: 'Your only lifeline! Defuse the Exploding Kitten, then secretly put it back anywhere you want in the draw pile to trap your friends.',
      img: getCardImageUrl('defuse', 0),
      color: 'var(--pop-amber)',
    },
    {
      id: 'nope',
      name: 'Nope',
      desc: 'Cancel the effect of the last card played (except Defuse or another Nope). Triggers chaotic arguments and clutch last-second plays!',
      img: getCardImageUrl('nope', 0),
      color: 'var(--pop-orange)',
    },
    {
      id: 'attack',
      name: 'Attack',
      desc: 'Force others to face the heat! End your turn without drawing a card, and force the next player to take 2 turns in a row.',
      img: getCardImageUrl('attack', 0),
      color: 'var(--pop-red)',
    },
    {
      id: 'see_the_future',
      name: 'See the Future',
      desc: 'Peek into destiny! Secretly view the top 3 cards of the draw pile to plan your strategy and avoid explosions.',
      img: getCardImageUrl('see_the_future_1', 0),
      color: 'var(--pop-cream)',
    },
    {
      id: 'skip',
      name: 'Skip',
      desc: 'A cowardly but highly effective move! Instantly end your current turn without drawing a card.',
      img: getCardImageUrl('skip', 0),
      color: 'var(--pop-cream)',
    },
  ];

  // Set default selected card
  const [selectedCard, setSelectedCard] = useState(cards[0]);

  // Keep state synchronized with language switches
  const currentSelectedCard = cards.find(c => c.id === selectedCard.id) || cards[0];

  return (
    <section 
      id="deck-showcase" 
      className="w-full bg-[var(--pop-cream)] py-20 px-6 md:px-12 pop-border-3 border-t-0 select-none overflow-hidden"
    >
      <div className="max-w-6xl mx-auto flex flex-col items-center">
        
        {/* Title */}
        <div className="mb-12 text-center">
          <h2 className="font-pop-display text-[38px] md:text-[52px] text-[var(--pop-black)] uppercase tracking-tight leading-none mb-3">
            {t.sectionTitle}
          </h2>
          <p className="font-pop-body text-sm md:text-base text-[var(--pop-black)]/70 font-bold uppercase tracking-wider">
            {t.sectionSubtext}
          </p>
        </div>

        {/* Card Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-6 w-full mb-12">
          {cards.map((card) => {
            const isCurrent = currentSelectedCard.id === card.id;
            return (
              <div
                key={card.id}
                className="flex flex-col items-center cursor-pointer transition-all duration-150"
                onMouseEnter={() => setSelectedCard(card)}
                onClick={() => setSelectedCard(card)}
              >
                {/* Visual card */}
                {card.img ? (
                  <div
                    className={`w-[110px] h-[156px] md:w-[130px] md:h-[185px] rounded-xl bg-white pop-border-2 overflow-hidden transition-all duration-150 ${
                      isCurrent ? '-translate-y-3 z-10' : 'translate-y-0'
                    }`}
                    style={{
                      boxShadow: isCurrent 
                        ? '6px 6px 0 var(--pop-black)' 
                        : '3px 3px 0 var(--pop-black)',
                    }}
                  >
                    <img 
                      src={card.img} 
                      alt={card.name} 
                      className="w-full h-full object-cover select-none pointer-events-none" 
                    />
                  </div>
                ) : (
                  <div className="w-[130px] h-[185px] rounded-xl bg-slate-300 pop-border-2 flex items-center justify-center font-bold">
                    {card.name}
                  </div>
                )}

                {/* Card indicator title */}
                <span className={`font-pop-accent text-xs font-bold mt-4 transition-colors duration-150 ${
                  isCurrent ? 'text-[var(--pop-red)]' : 'text-[var(--pop-black)]/50'
                }`}>
                  {card.name}
                </span>
              </div>
            );
          })}
        </div>

        {/* Dynamic Showcase Info Panel */}
        <div 
          className="w-full max-w-3xl bg-[var(--pop-amber)] pop-border-3 p-8 transition-all duration-200 transform -rotate-0.5 relative overflow-hidden"
          style={{ 
            boxShadow: '8px 8px 0 var(--pop-black)',
          }}
        >
          {/* Decorative diamond logo inside panel */}
          <div className="absolute right-4 bottom-4 w-20 h-20 bg-black/5 rotate-45 select-none pointer-events-none" />
          
          <span className="font-pop-accent text-[11px] font-bold text-[var(--pop-orange)] tracking-widest uppercase block mb-1">
            {t.infoTag}
          </span>
          
          <h3 className="font-pop-display text-[26px] md:text-[32px] text-[var(--pop-black)] uppercase leading-none mb-3">
            {currentSelectedCard.name}
          </h3>
          
          <p className="font-pop-body text-sm md:text-base text-[var(--pop-black)]/80 font-medium leading-relaxed max-w-2xl">
            {currentSelectedCard.desc}
          </p>
        </div>

      </div>
    </section>
  );
}
