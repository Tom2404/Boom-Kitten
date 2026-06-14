import React, { useState } from 'react';

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
};

export default function Card({ type, selected, onClick, disabled, marked }) {
  const theme = CARD_THEMES[type] || {
    name: type,
    icon: '🃏',
    color: 'bg-slate-400 text-slate-950',
    desc: 'Lá bài không xác định.',
  };

  const [imageError, setImageError] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  return (
    <>
      <div
        onClick={!disabled ? onClick : undefined}
        onDoubleClick={!disabled ? (e) => {
          e.stopPropagation();
          setIsDetailOpen(true);
        } : undefined}
        className={`relative h-44 w-32 cursor-pointer rounded-xl overflow-visible transition-all duration-100 select-none flex flex-col justify-between bg-transparent
          ${selected ? '-translate-y-6 scale-105 filter drop-shadow-[0_0_12px_rgba(234,179,8,0.8)]' : 'hover:-translate-y-2 hover:scale-102 hover:filter hover:drop-shadow-[0_0_6px_rgba(255,255,255,0.4)]'}
          ${disabled ? 'opacity-40 cursor-not-allowed pointer-events-none' : ''}`}
      >
        {marked && (
          <span className="absolute -top-2.5 -left-2.5 z-30 bg-rose-500 text-white font-headline font-black text-[9px] px-2 py-0.5 rounded-full border-2 border-on-surface shadow-[1px_1px_0px_0px_#1a1c1c] uppercase tracking-wider animate-pulse">
            Lộ bài
          </span>
        )}
        {/* Info button */}
        <span
          onClick={(e) => {
            e.stopPropagation();
            setIsDetailOpen(true);
          }}
          className="absolute top-1 right-1 z-20 material-symbols-outlined text-[16px] leading-none text-slate-300 bg-slate-900/60 hover:bg-slate-900 p-1 rounded-full hover:scale-110 transition-transform cursor-pointer shadow-sm border border-white/20"
          title="Xem chi tiết (Click đúp)"
        >
          info
        </span>

        {/* Main Image Area - filling the middle */}
        <div className="flex-grow flex items-center justify-center p-1 relative min-h-[90px] w-full">
          {!imageError ? (
            <img 
              src={`/src/assets/cards/${type}.png`}
              alt={theme.name}
              className="h-32 w-32 object-contain drop-shadow"
              onError={() => setImageError(true)}
            />
          ) : (
            <span className="text-5xl filter drop-shadow">
              {theme.icon}
            </span>
          )}
        </div>

        {/* Description box at the bottom */}
        <div className="bg-slate-900/90 text-white p-1.5 px-2 flex flex-col justify-center min-h-[44px] rounded-2xl border-2 border-slate-700 shadow-[2px_2px_0px_0px_#1a1c1c] z-10 w-[95%] mx-auto mb-1">
          <div className="text-[9px] font-headline font-black uppercase tracking-wide truncate text-yellow-300 text-center mb-0.5">
            {theme.name}
          </div>
          <div className="text-[7.5px] leading-tight font-sans font-bold text-center line-clamp-2 text-slate-300">
            {theme.desc}
          </div>
        </div>
      </div>

      {/* Detail Modal */}
      {isDetailOpen && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 p-4 animate-fade-in text-slate-900"
          onClick={(e) => {
            e.stopPropagation();
            setIsDetailOpen(false);
          }}
        >
          <div 
            className="w-full max-w-sm bg-white border-4 border-on-surface shadow-[8px_8px_0px_0px_rgba(26,28,28,1)] rounded-3xl p-6 flex flex-col items-center gap-6 text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-full flex justify-between items-center border-b-4 border-on-surface pb-3">
              <h3 className="text-xl font-headline font-black text-on-surface uppercase flex items-center gap-2">
                <span>{theme.icon}</span> {theme.name}
              </h3>
              <button 
                onClick={() => setIsDetailOpen(false)}
                className="text-xl font-black hover:scale-110 transition-transform text-on-surface"
              >
                ✕
              </button>
            </div>

            <div className={`w-40 h-56 rounded-2xl border-3 border-on-surface shadow-[4px_4px_0px_0px_rgba(26,28,28,1)] flex flex-col justify-between p-4 ${theme.color}`}>
              <div className="flex justify-between items-center">
                <span className="text-xs font-headline font-black uppercase">{theme.name}</span>
                <span className="text-lg">{theme.icon}</span>
              </div>
              <div className="flex justify-center items-center">
                {!imageError ? (
                  <img 
                    src={`/src/assets/cards/${type}.png`}
                    alt={theme.name}
                    className="h-28 w-28 object-contain drop-shadow"
                  />
                ) : (
                  <span className="text-6xl">{theme.icon}</span>
                )}
              </div>
              <div className="h-6"></div>
            </div>

            <div className="bg-slate-50 border-3 border-on-surface rounded-2xl p-4 w-full shadow-[3px_3px_0px_0px_rgba(26,28,28,1)] text-left">
              <span className="text-[10px] font-headline font-black text-primary uppercase tracking-widest block mb-1">
                Chức Năng Quân Bài
              </span>
              <p className="text-xs font-sans font-bold leading-relaxed text-on-surface">
                {theme.desc}
              </p>
            </div>

            {onClick && (
              <button
                onClick={() => {
                  onClick();
                  setIsDetailOpen(false);
                }}
                className={`w-full py-3 rounded-xl font-headline font-black uppercase text-sm border-2 border-on-surface shadow-[2px_2px_0px_0px_#1a1c1c] mb-2
                  ${selected ? 'bg-rose-500 text-white hover:bg-rose-600' : 'bg-yellow-400 text-slate-950 hover:bg-yellow-500'}`}
              >
                {selected ? '❌ Hủy Chọn Thẻ Bài' : '🚀 Chọn Thẻ Bài'}
              </button>
            )}

            <button
              onClick={() => setIsDetailOpen(false)}
              className="btn-detonator w-full py-3 rounded-xl font-headline font-black uppercase text-sm"
            >
              Đóng ✕
            </button>
          </div>
        </div>
      )}
    </>
  );
}
export { CARD_THEMES };
