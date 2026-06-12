import React from 'react';

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
  exploding_kitten: {
    name: 'MÈO NỔ!',
    icon: '💣',
    color: 'bg-red-600 text-white animate-pulse',
    desc: 'BÙM! Bạn bị loại nếu không có bài Gỡ Mìn (Defuse).',
  },
};

export default function Card({ type, selected, onClick, disabled }) {
  const theme = CARD_THEMES[type] || {
    name: type,
    icon: '🃏',
    color: 'bg-slate-400 text-slate-950',
    desc: 'Lá bài không xác định.',
  };

  return (
    <div
      onClick={!disabled ? onClick : undefined}
      className={`relative h-44 w-32 cursor-pointer rounded-xl border-3 border-on-surface p-3 shadow-[4px_4px_0px_0px_rgba(26,28,28,1)] transition-all duration-100 select-none flex flex-col justify-between
        ${theme.color}
        ${selected ? '-translate-y-6 scale-105 ring-4 ring-yellow-400 shadow-[6px_6px_0px_0px_rgba(26,28,28,1)]' : 'hover:-translate-y-4 hover:shadow-[6px_6px_0px_0px_rgba(26,28,28,1)]'}
        ${disabled ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''}`}
    >
      {/* Decorative top dot */}
      <div className="flex justify-between items-center">
        <span className="text-[10px] font-headline font-black uppercase tracking-tight truncate max-w-[70%]">{theme.name}</span>
        <span className="text-base">{theme.icon}</span>
      </div>

      {/* Main Art Area */}
      <div className="my-auto flex flex-col items-center justify-center rounded-lg bg-black/10 py-2 min-h-[64px] relative">
        <img 
          src={`/src/assets/cards/${type}.png`}
          alt={theme.name}
          className="h-12 w-12 object-contain absolute z-10"
          onError={(e) => { e.target.style.display = 'none'; }}
        />
        <span className="text-3xl filter drop-shadow-md transform transition-transform duration-300 hover:scale-125 z-0">
          {theme.icon}
        </span>
      </div>

      {/* Description */}
      <div className="text-[9px] leading-tight font-sans font-bold text-center line-clamp-3 opacity-90">
        {theme.desc}
      </div>
    </div>
  );
}
export { CARD_THEMES };
