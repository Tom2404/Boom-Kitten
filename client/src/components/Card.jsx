import React, { useState } from 'react';
import { getCardImageUrl } from '../utils/cardSkins.js';
import { useLanguage } from '../context/LanguageContext.jsx';
import CardDetailDialog from './CardDetailDialog.jsx';

const CARD_THEMES = {
  defuse: {
    name: 'Gỡ Mìn',
    icon: '🛡️',
    color: 'bg-emerald-400 text-slate-950',
    desc: 'Vô hiệu hóa Mèo Nổ. Sau đó đặt lại Mèo Nổ vào bộ bài.',
  },
  nope: {
    name: 'Nope!',
    icon: '❌',
    color: 'bg-rose-400 text-slate-950',
    desc: 'Hủy bỏ hành động của lá bài vừa đánh (trừ Defuse/Mèo Nổ).',
  },
  attack: {
    name: 'Tấn Công',
    icon: '⚔️',
    color: 'bg-orange-400 text-slate-950',
    desc: 'Kết thúc lượt bốc bài và bắt đối thủ tiếp theo đi 2 lượt.',
  },
  skip: {
    name: 'Bỏ Qua',
    icon: '⏭️',
    color: 'bg-sky-400 text-slate-950',
    desc: 'Kết thúc lượt hiện tại mà không cần bốc bài.',
  },
  super_skip: {
    name: 'Siêu Bỏ Qua',
    icon: '🚀',
    color: 'bg-indigo-400 text-white',
    desc: 'Bỏ qua TẤT CẢ các lượt rút bài bị dồn lập tức.',
  },
  see_the_future_1: {
    name: 'Tiên Tri (1)',
    icon: '👁️',
    color: 'bg-violet-400 text-slate-950',
    desc: 'Bí mật xem trước 1 lá bài trên cùng bộ bài bốc.',
  },
  see_the_future_3: {
    name: 'Tiên Tri (3)',
    icon: '👁️',
    color: 'bg-fuchsia-400 text-slate-950',
    desc: 'Bí mật xem trước 3 lá bài trên cùng bộ bài bốc.',
  },
  see_the_future_5: {
    name: 'Tiên Tri (5)',
    icon: '👁️',
    color: 'bg-purple-500 text-white',
    desc: 'Bí mật xem trước 5 lá bài trên cùng bộ bài bốc.',
  },
  alter_the_future_3: {
    name: 'Định Đoạt',
    icon: '🌀',
    color: 'bg-pink-400 text-slate-950',
    desc: 'Xem 3 lá trên cùng và sắp xếp lại theo ý muốn.',
  },
  shuffle: {
    name: 'Xào Bài',
    icon: '🔄',
    color: 'bg-amber-400 text-slate-950',
    desc: 'Xáo trộn ngẫu nhiên xấp bài bốc.',
  },
  draw_from_bottom: {
    name: 'Bốc Từ Đáy',
    icon: '👇',
    color: 'bg-teal-400 text-slate-950',
    desc: 'Kết thúc lượt bằng cách bốc 1 lá dưới đáy bộ bài.',
  },
  favor: {
    name: 'Xin Xỏ',
    icon: '🤲',
    color: 'bg-yellow-400 text-slate-950',
    desc: 'Bắt một người chơi khác tự chọn cho bạn 1 lá bài.',
  },
  cat_taco: {
    name: 'Mèo Taco',
    icon: '🌮',
    color: 'bg-slate-300 text-slate-950',
    desc: 'Mèo thường. Cần combo 2 lá hoặc 5 lá khác nhau.',
  },
  cat_watermelon: {
    name: 'Mèo Dưa Hấu',
    icon: '🍉',
    color: 'bg-slate-300 text-slate-950',
    desc: 'Mèo thường. Cần combo 2 lá hoặc 5 lá khác nhau.',
  },
  cat_beard: {
    name: 'Mèo Râu Dài',
    icon: '🐱',
    color: 'bg-slate-300 text-slate-950',
    desc: 'Mèo thường. Cần combo 2 lá hoặc 5 lá khác nhau.',
  },
  cat_rainbow: {
    name: 'Mèo Cầu Vồng',
    icon: '🌈',
    color: 'bg-slate-300 text-slate-950',
    desc: 'Mèo thường. Cần combo 2 lá hoặc 5 lá khác nhau.',
  },
  cat_potato: {
    name: 'Mèo Khoai Tây',
    icon: '🥔',
    color: 'bg-slate-300 text-slate-950',
    desc: 'Mèo thường. Cần combo 2 lá hoặc 5 lá khác nhau.',
  },
  armageddon: {
    name: 'Ngày Tận Thế',
    icon: '🌋',
    color: 'bg-amber-700 text-white',
    desc: 'Mỗi người lấy 1 lá Mèo Nổ đặt lên đầu bộ bài, sau đó bốc bài.',
  },
  attack_of_the_dead: {
    name: 'Xác Sống Tấn Công',
    icon: '🧟',
    color: 'bg-green-700 text-white',
    desc: 'Tấn công đối thủ bằng lũ mèo thây ma.',
  },
  attack_2x: {
    name: 'Tấn Công x2',
    icon: '⚔️',
    color: 'bg-orange-500 text-slate-950',
    desc: 'Kết thúc lượt và bắt đối thủ tiếp theo đi 2 lượt.',
  },
  barking_kitten: {
    name: 'Mèo Sủa',
    icon: '🐶',
    color: 'bg-yellow-600 text-white',
    desc: 'Nếu ai đó cũng có lá này, họ phải trao bài hoặc nổ.',
  },
  bury: {
    name: 'Chôn Bài',
    icon: '🪦',
    color: 'bg-stone-500 text-white',
    desc: 'Đặt lá bài vừa rút trở lại bộ bài bốc và kết thúc lượt.',
  },
  catomic_bomb: {
    name: 'Bom Nguyên Tử',
    icon: '☢️',
    color: 'bg-lime-500 text-slate-950',
    desc: 'Đưa hết Mèo Nổ lên đầu bộ bài, xáo phần còn lại. Kết thúc lượt.',
  },
  clairvoyance_now: {
    name: 'Thiên Nhãn',
    icon: '👁️‍🗨️',
    color: 'bg-cyan-500 text-slate-950',
    desc: 'Xem vị trí lá bài vừa được chèn vào bộ bài.',
  },
  clone: {
    name: 'Nhân Bản',
    icon: '👥',
    color: 'bg-teal-600 text-white',
    desc: 'Sao chép hiệu ứng của lá bài vừa được đánh trước đó.',
  },
  curse_of_the_cat_butt: {
    name: 'Lời Nguyền Mông Mèo',
    icon: '🍑',
    color: 'bg-purple-700 text-white',
    desc: 'Đối thủ phải úp bài và chơi mò cho tới khi rút bài.',
  },
  devilcat: {
    name: 'Mèo Quỷ',
    icon: '😈',
    color: 'bg-red-800 text-white animate-pulse',
    desc: 'Lá bài Mèo Nổ đặc biệt có hiệu ứng trừ coin hoặc nổ tức thì.',
  },
  dig_deeper: {
    name: 'Đào Sâu',
    icon: '⛏️',
    color: 'bg-yellow-700 text-white',
    desc: 'Xem lá bài tiếp theo và quyết định có bốc hay không.',
  },
  draw_from_the_bottom: {
    name: 'Bốc Từ Đáy',
    icon: '👇',
    color: 'bg-teal-400 text-slate-950',
    desc: 'Bốc lá dưới đáy bộ bài và kết thúc lượt.',
  },
  exploding_kitten_alien: {
    name: 'Mèo Nổ Ngoại Lai',
    icon: '👽',
    color: 'bg-red-500 text-white animate-pulse',
    desc: 'Mèo Nổ đến từ vũ trụ.',
  },
  feral_cat: {
    name: 'Mèo Hoang',
    icon: '🦁',
    color: 'bg-emerald-600 text-white',
    desc: 'Thay thế cho bất kỳ lá Mèo thường nào để tạo Combo.',
  },
  garbage_collection: {
    name: 'Thu Gom Rác',
    icon: '🗑️',
    color: 'bg-slate-400 text-slate-950',
    desc: 'Mọi người chọn 1 lá nộp lại vào bộ bài bốc, sau đó xào bài.',
  },
  godcat: {
    name: 'Thần Mèo',
    icon: '👑',
    color: 'bg-yellow-500 text-slate-950 font-black',
    desc: 'Lá bài vạn năng, có thể dùng thay thế cho bất kỳ lá bài nào.',
  },
  grave_robber: {
    name: 'Kẻ Trộm Mộ',
    icon: '⚰️',
    color: 'bg-neutral-600 text-white',
    desc: 'Lấy một lá bất kỳ từ xấp bài bỏ cho lên tay hoặc đầu bộ bài.',
  },
  ill_take_that: {
    name: 'Tôi Lấy Nhé',
    icon: '💸',
    color: 'bg-indigo-500 text-white',
    desc: 'Cướp lá bài tiếp theo mà đối thủ rút được.',
  },
  imploding_kitten: {
    name: 'Mèo Sập Nguồn',
    icon: '🌀',
    color: 'bg-violet-600 text-white animate-pulse',
    desc: 'Không thể Defuse ở lần bốc thứ hai. Nổ chết ngay!',
  },
  mark: {
    name: 'Đánh Dấu',
    icon: '📍',
    color: 'bg-sky-500 text-slate-950',
    desc: 'Lật ngửa 1 lá bài ngẫu nhiên của đối thủ cho cả bàn xem.',
  },
  personal_attack: {
    name: 'Tự Tấn Công',
    icon: '🗯️',
    color: 'bg-orange-600 text-white',
    desc: 'Bắt bản thân phải thực hiện liên tiếp 3 lượt đi.',
  },
  pot_luck: {
    name: 'Góp Nồi',
    icon: '🍲',
    color: 'bg-amber-600 text-white',
    desc: 'Mỗi người bỏ 1 lá lên đầu bộ bài theo thứ tự lượt chơi.',
  },
  raising_heck: {
    name: 'Gọi Hồn Đáy Bài',
    icon: '🔥',
    color: 'bg-red-700 text-white',
    desc: 'Xem lá dưới đáy bộ bài và quyết định có lấy hay không.',
  },
  reverse: {
    name: 'Đảo Chiều',
    icon: '🔁',
    color: 'bg-emerald-500 text-slate-950',
    desc: 'Đảo ngược chiều chơi và bỏ qua lượt rút bài.',
  },
  streaking_kitten: {
    name: 'Mèo Khỏa Thân',
    icon: '⚡',
    color: 'bg-yellow-300 text-slate-950',
    desc: 'Giữ Mèo Nổ trên tay an toàn. Bị cướp trúng -> đối thủ nổ.',
  },
  swap_top_and_bottom: {
    name: 'Đổi Đầu Đuôi',
    icon: '↕️',
    color: 'bg-blue-400 text-slate-950',
    desc: 'Tráo đổi lá bài trên cùng và dưới cùng của bộ bài bốc.',
  },
  tower_of_power: {
    name: 'Tháp Quyền Lực',
    icon: '🏰',
    color: 'bg-purple-600 text-white',
    desc: 'Bảo vệ bạn khỏi bị cướp bài.',
  },
  zombie_kitten: {
    name: 'Mèo Thây Ma',
    icon: '🧟‍♀️',
    color: 'bg-emerald-800 text-white',
    desc: 'Gỡ Mèo Nổ và hồi sinh một người chơi đã bị loại.',
  },
  alter_the_future_3_now: {
    name: 'Định Đoạt Ngay',
    icon: '⏱️',
    color: 'bg-pink-500 text-white',
    desc: 'Định đoạt 3 lá bài lập tức ngoài lượt chơi.',
  },
  alter_the_future_5: {
    name: 'Định Đoạt (5)',
    icon: '🌀',
    color: 'bg-pink-600 text-white',
    desc: 'Xem trước và sắp xếp lại 5 lá trên cùng bộ bài.',
  },
  see_the_future_3_and_share: {
    name: 'Tiên Tri & Chia Sẻ',
    icon: '🤝',
    color: 'bg-fuchsia-500 text-white',
    desc: 'Xem 3 lá trên cùng và bắt buộc chia sẻ thông tin.',
  },
  shuffle_now: {
    name: 'Xào Bài Ngay',
    icon: '🔄',
    color: 'bg-amber-500 text-slate-950',
    desc: 'Xào lại bộ bài lập tức ngay cả khi không phải lượt.',
  },
  exploding_kitten: {
    name: 'MÈO NỔ!',
    icon: '💣',
    color: 'bg-red-600 text-white animate-pulse',
    desc: 'BÙM! Bạn bị loại nếu không có bài Gỡ Mìn (Defuse).',
  },
  feed_the_dead: {
    name: 'Cúng Cô Hồn',
    icon: '🧟‍♂️',
    color: 'bg-emerald-900 text-white',
    desc: 'Mỗi người sống tự chọn 1 lá bài dâng hiến cho một hồn ma.',
  },
  reveal_the_future_3x: {
    name: 'Phơi Bày Tương Lai',
    icon: '🔮',
    color: 'bg-indigo-600 text-white',
    desc: 'Xem trước 3 lá bài trên đầu bộ bài và hiển thị công khai cho cả bàn.',
  },
  clairvoyance: {
    name: 'Thiên Nhãn',
    icon: '👁️‍cat',
    color: 'bg-cyan-500 text-slate-950',
    desc: 'Bí mật nhìn thấy vị trí mà đối thủ vừa chèn Mèo Nổ vào bộ bài.',
  },
  hidden: {
    name: 'Bài Ẩn',
    icon: '❓',
    color: 'bg-slate-800 text-slate-300 border-2 border-slate-700',
    desc: 'Bạn đang bị Lời nguyền Mông Mèo! Hãy click chọn một lá bất kỳ để đánh mù.',
  },
};

export default function Card({
  type,
  skinIndex = 0,
  selected,
  onClick,
  disabled,
  marked,
  compact = false,
  hideInfo = false,
  presentation = 'default',
}) {
  const { t } = useLanguage();
  const theme = CARD_THEMES[type] || {
    name: type,
    icon: '🃏',
    color: 'bg-slate-400 text-slate-950',
    desc: 'Lá bài không xác định.',
  };

  const nameKey = `card_${type}_name`;
  const descKey = `card_${type}_desc`;
  const cardName = t(nameKey) !== nameKey ? t(nameKey) : theme.name;
  const cardDesc = t(descKey) !== descKey ? t(descKey) : theme.desc;

  const [imageError, setImageError] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const cardImageUrl = getCardImageUrl(type, skinIndex);

  const isHandStrip = presentation === 'hand-strip';
  const sizeClass = isHandStrip ? 'game-card--hand-strip' : (compact ? 'h-36 w-28' : 'h-44 w-32');
  const imageClass = isHandStrip ? 'game-card__hand-image' : (compact ? 'h-24 w-24' : 'h-32 w-32');
  const iconClass = compact ? 'text-4xl' : 'text-5xl';
  const descBoxClass = compact ? 'min-h-[38px] p-1 px-1.5' : 'min-h-[44px] p-1.5 px-2';
  const isSelectable = Boolean(onClick) && !disabled;
  const selectionClass = isHandStrip
    ? (selected ? 'game-card--hand-strip-selected' : '')
    : (selected
      ? '-translate-y-6 scale-105 filter drop-shadow-[0_0_12px_rgba(234,179,8,0.8)]'
      : (isSelectable
        ? 'hover:-translate-y-2 hover:scale-102 hover:filter hover:drop-shadow-[0_0_6px_rgba(255,255,255,0.4)]'
        : ''));

  const getNeonStyle = (cardType) => {
    if (cardType === 'defuse' || cardType === 'cat_watermelon') {
      return {
        border: 'border-[#ccff00]',
        glow: 'shadow-[0_0_12px_rgba(204,255,0,0.75)]',
        headerBg: 'bg-[#ccff00]',
        headerText: 'text-black',
      };
    }
    if (cardType === 'nope') {
      return {
        border: 'border-[#ff3355]',
        glow: 'shadow-[0_0_12px_rgba(255,51,85,0.75)]',
        headerBg: 'bg-[#ff3355]',
        headerText: 'text-white',
      };
    }
    if (['skip', 'super_skip', 'reverse', 'attack', 'attack_2x', 'favor', 'draw_from_bottom', 'draw_from_the_bottom'].includes(cardType)) {
      return {
        border: 'border-[#00d8ff]',
        glow: 'shadow-[0_0_12px_rgba(0,216,255,0.75)]',
        headerBg: 'bg-[#00d8ff]',
        headerText: 'text-black',
      };
    }
    if (['alter_the_future_3', 'see_the_future_3', 'see_the_future_1', 'see_the_future_5', 'garbage_collection', 'curse_of_the_cat_butt', 'catomic_bomb'].includes(cardType)) {
      return {
        border: 'border-[#bd00ff]',
        glow: 'shadow-[0_0_12px_rgba(189,0,255,0.75)]',
        headerBg: 'bg-[#bd00ff]',
        headerText: 'text-white',
      };
    }
    if (cardType === 'cat_beard' || cardType === 'personal_attack') {
      return {
        border: 'border-[#ff7700]',
        glow: 'shadow-[0_0_12px_rgba(255,119,0,0.75)]',
        headerBg: 'bg-[#ff7700]',
        headerText: 'text-black',
      };
    }
    if (cardType === 'cat_potato' || cardType === 'godcat' || cardType === 'streaking_kitten') {
      return {
        border: 'border-[#ffaa00]',
        glow: 'shadow-[0_0_12px_rgba(255,170,0,0.75)]',
        headerBg: 'bg-[#ffaa00]',
        headerText: 'text-black',
      };
    }
    return {
      border: 'border-[#00d8ff]',
      glow: 'shadow-[0_0_10px_rgba(0,216,255,0.6)]',
      headerBg: 'bg-[#00d8ff]',
      headerText: 'text-black',
    };
  };

  const neon = getNeonStyle(type);

  return (
    <>
      <div
        className={`relative ${sizeClass} rounded-xl overflow-visible transition-all duration-100 select-none flex flex-col justify-between bg-transparent
          ${selectionClass}
          ${isSelectable ? 'cursor-pointer' : 'cursor-default'}
          ${marked ? 'rounded-xl ring-4 ring-rose-500/90 drop-shadow-[0_0_12px_rgba(244,63,94,0.55)]' : ''}`}
      >
        {onClick && (
          <button
            type="button"
            disabled={disabled}
            onClick={onClick}
            onDoubleClick={(event) => {
              event.stopPropagation();
              setIsDetailOpen(true);
            }}
            aria-pressed={isSelectable ? Boolean(selected) : undefined}
            aria-label={`${selected ? t('card_deselect') : t('card_select')} ${cardName}`}
            className="absolute inset-0 z-20 rounded-xl bg-transparent focus:outline-none focus-visible:ring-4 focus-visible:ring-sky-400 disabled:cursor-default"
          />
        )}
        {!hideInfo && (
          <button
            type="button"
            onPointerDown={(event) => event.stopPropagation()}
            onClick={(event) => {
              event.stopPropagation();
              setIsDetailOpen(true);
            }}
            className="absolute right-1 top-1 z-30 border-2 border-slate-950 bg-[#f8edcf] px-1.5 py-0.5 font-mono text-[8px] font-black uppercase text-slate-950 shadow-[2px_2px_0_#241914] hover:bg-amber-300 focus:outline-none focus-visible:ring-4 focus-visible:ring-sky-400"
            aria-label={`${t('card_info')}: ${cardName}`}
          >
            {t('card_info')}
          </button>
        )}
        {selected && !isHandStrip && (
          <div className="absolute inset-[-12px] rounded-2xl bg-gradient-to-r from-yellow-400 via-amber-300 to-yellow-500 opacity-60 filter blur-lg animate-pulse pointer-events-none z-[-1]" />
        )}
        <div className={isHandStrip
          ? 'game-card__hand-art'
          : 'flex-grow flex items-center justify-center p-1 relative min-h-[90px] w-full'}
        >
          {cardImageUrl && !imageError ? (
            <img 
              src={cardImageUrl}
              alt={cardName}
              className={`${imageClass} object-contain drop-shadow`}
              onError={() => setImageError(true)}
            />
          ) : (
            <span className={`${iconClass} filter drop-shadow`}>
              {theme.icon}
            </span>
          )}
        </div>

        {/* Description box at the bottom */}
        {!isHandStrip && (
          <div className={`bg-slate-900/90 text-white ${descBoxClass} flex flex-col justify-center rounded-2xl border-2 border-slate-700 shadow-[2px_2px_0px_0px_#1a1c1c] z-10 w-[95%] mx-auto mb-1`}>
            <div className="text-[9px] font-headline font-black uppercase tracking-wide truncate text-yellow-300 text-center mb-0.5">
              {cardName}
            </div>
            <div className="text-[7.5px] leading-tight font-sans font-bold text-center line-clamp-2 text-slate-300">
              {cardDesc}
            </div>
          </div>
        )}
      </div>

      <CardDetailDialog
        canSelect={isSelectable}
        cardDesc={cardDesc}
        cardImageUrl={cardImageUrl}
        cardName={cardName}
        imageError={imageError}
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        onImageError={() => setImageError(true)}
        onSelect={onClick}
        selected={Boolean(selected)}
        t={t}
        theme={theme}
      />
    </>
  );
}
export { CARD_THEMES };
