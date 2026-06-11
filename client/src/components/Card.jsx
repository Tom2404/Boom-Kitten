import React from 'react';

const CARD_THEMES = {
  defuse: {
    name: 'Gỡ Mìn',
    icon: '🛡️',
    color: 'from-emerald-600 to-green-800 border-green-400',
    desc: 'Vô hiệu hóa Mèo Nổ. Sau đó đặt lại Mèo Nổ vào bộ bài.',
  },
  nope: {
    name: 'Nope!',
    icon: '❌',
    color: 'from-rose-600 to-red-800 border-red-400',
    desc: 'Hủy bỏ hành động của lá bài vừa đánh (trừ Defuse/Mèo Nổ).',
  },
  attack: {
    name: 'Tấn Công',
    icon: '⚔️',
    color: 'from-amber-600 to-orange-800 border-orange-400',
    desc: 'Kết thúc lượt bốc bài và bắt đối thủ tiếp theo đi 2 lượt.',
  },
  skip: {
    name: 'Bỏ Qua',
    icon: '⏭️',
    color: 'from-sky-600 to-blue-800 border-blue-400',
    desc: 'Kết thúc lượt hiện tại mà không cần bốc bài.',
  },
  super_skip: {
    name: 'Siêu Bỏ Qua',
    icon: '🚀',
    color: 'from-indigo-600 to-indigo-900 border-indigo-400',
    desc: 'Bỏ qua TẤT CẢ các lượt rút bài bị dồn lập tức.',
  },
  see_the_future_1: {
    name: 'Tiên Tri (1)',
    icon: '👁️',
    color: 'from-violet-600 to-purple-800 border-purple-400',
    desc: 'Bí mật xem trước 1 lá bài trên cùng bộ bài bốc.',
  },
  see_the_future_3: {
    name: 'Tiên Tri (3)',
    icon: '👁️',
    color: 'from-violet-600 to-fuchsia-800 border-fuchsia-400',
    desc: 'Bí mật xem trước 3 lá bài trên cùng bộ bài bốc.',
  },
  see_the_future_5: {
    name: 'Tiên Tri (5)',
    icon: '👁️',
    color: 'from-violet-700 to-purple-900 border-purple-500',
    desc: 'Bí mật xem trước 5 lá bài trên cùng bộ bài bốc.',
  },
  alter_the_future_3: {
    name: 'Định Đoạt',
    icon: '🌀',
    color: 'from-pink-600 to-rose-900 border-pink-400',
    desc: 'Xem 3 lá trên cùng và sắp xếp lại theo ý muốn.',
  },
  shuffle: {
    name: 'Xào Bài',
    icon: '🔄',
    color: 'from-amber-700 to-yellow-900 border-yellow-500',
    desc: 'Xáo trộn ngẫu nhiên xấp bài bốc.',
  },
  draw_from_bottom: {
    name: 'Bốc Từ Đáy',
    icon: '👇',
    color: 'from-teal-600 to-cyan-800 border-cyan-400',
    desc: 'Kết thúc lượt bằng cách bốc 1 lá dưới đáy bộ bài.',
  },
  favor: {
    name: 'Xin Xỏ',
    icon: '🤲',
    color: 'from-yellow-600 to-amber-800 border-yellow-400',
    desc: 'Bắt một người chơi khác tự chọn cho bạn 1 lá bài.',
  },
  cat_taco: {
    name: 'Mèo Taco',
    icon: '🌮',
    color: 'from-slate-600 to-slate-800 border-slate-400',
    desc: 'Mèo thường. Cần combo 2 lá hoặc 5 lá khác nhau.',
  },
  cat_watermelon: {
    name: 'Mèo Dưa Hấu',
    icon: '🍉',
    color: 'from-slate-600 to-slate-800 border-slate-400',
    desc: 'Mèo thường. Cần combo 2 lá hoặc 5 lá khác nhau.',
  },
  cat_beard: {
    name: 'Mèo Râu Dài',
    icon: '🐱',
    color: 'from-slate-600 to-slate-800 border-slate-400',
    desc: 'Mèo thường. Cần combo 2 lá hoặc 5 lá khác nhau.',
  },
  cat_rainbow: {
    name: 'Mèo Cầu Vồng',
    icon: '🌈',
    color: 'from-slate-600 to-slate-800 border-slate-400',
    desc: 'Mèo thường. Cần combo 2 lá hoặc 5 lá khác nhau.',
  },
  cat_potato: {
    name: 'Mèo Khoai Tây',
    icon: '🥔',
    color: 'from-slate-600 to-slate-800 border-slate-400',
    desc: 'Mèo thường. Cần combo 2 lá hoặc 5 lá khác nhau.',
  },
  exploding_kitten: {
    name: 'MÈO NỔ!',
    icon: '💣',
    color: 'from-black to-red-950 border-red-600 animate-pulse',
    desc: 'BÙM! Bạn bị loại nếu không có bài Gỡ Mìn (Defuse).',
  },
};

export default function Card({ type, selected, onClick, disabled }) {
  const theme = CARD_THEMES[type] || {
    name: type,
    icon: '🃏',
    color: 'from-slate-700 to-slate-900 border-slate-500',
    desc: 'Lá bài không xác định.',
  };

  return (
    <div
      onClick={!disabled ? onClick : undefined}
      className={`relative h-44 w-32 cursor-pointer rounded-xl border-2 bg-gradient-to-br p-3 shadow-lg transition-all duration-300 select-none flex flex-col justify-between
        ${theme.color}
        ${selected ? '-translate-y-6 scale-105 ring-4 ring-yellow-400 shadow-yellow-500/50' : 'hover:-translate-y-4 hover:shadow-2xl hover:brightness-110'}
        ${disabled ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''}`}
    >
      {/* Decorative top dot */}
      <div className="flex justify-between items-center">
        <span className="text-xs font-bold uppercase tracking-wider opacity-90">{theme.name}</span>
        <span className="text-base">{theme.icon}</span>
      </div>

      {/* Main Art Area */}
      <div className="my-auto flex flex-col items-center justify-center rounded-lg bg-black/20 py-2">
        <span className="text-4xl filter drop-shadow-md transform transition-transform duration-300 hover:scale-125">
          {theme.icon}
        </span>
      </div>

      {/* Description */}
      <div className="text-[10px] leading-tight text-white/80 line-clamp-3 text-center">
        {theme.desc}
      </div>

      {/* Glossy overlay effect */}
      <div className="absolute inset-0 rounded-xl bg-gradient-to-tr from-transparent via-white/5 to-white/10 pointer-events-none" />
    </div>
  );
}
export { CARD_THEMES };
