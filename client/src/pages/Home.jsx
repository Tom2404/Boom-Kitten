import React, { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { getCardImageUrl } from '../utils/cardSkins.js';
import { useLanguage } from '../context/LanguageContext.jsx';

// Pre-resolve card images via the skin system so Vite bundles them correctly
const heroExplodingImg = getCardImageUrl('exploding_kitten', 0);
const heroDefuseImg = getCardImageUrl('defuse', 0);
const stepSeeTheFutureImg = getCardImageUrl('see_the_future_3', 0);
const stepExplodingImg = getCardImageUrl('exploding_kitten', 1);
const stepAttackImg = getCardImageUrl('attack_2x', 0);

function RulesSetup() {
  const { t } = useLanguage();
  return (
    <div className="flex flex-col gap-6">
      <div className="card-brutalist bg-white rounded-2xl p-6">
        <h4 className="font-headline font-black text-lg uppercase mb-4 flex items-center gap-2">
          <span className="material-symbols-outlined text-primary">group</span>
          {t('rules_setup_title')}
        </h4>
        <p className="font-sans text-sm text-on-surface-variant font-bold leading-relaxed mb-4">
          {t('rules_setup_desc')}
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-emerald-50 border-3 border-on-surface rounded-xl p-4 shadow-[3px_3px_0px_0px_#1a1c1c]">
            <div className="font-headline font-black text-sm uppercase text-emerald-700 mb-1">{t('rules_setup_step1_title')}</div>
            <p className="text-xs font-sans font-bold text-on-surface-variant">{t('rules_setup_step1_desc')}</p>
          </div>
          <div className="bg-violet-50 border-3 border-on-surface rounded-xl p-4 shadow-[3px_3px_0px_0px_#1a1c1c]">
            <div className="font-headline font-black text-sm uppercase text-violet-700 mb-1">{t('rules_setup_step2_title')}</div>
            <p className="text-xs font-sans font-bold text-on-surface-variant">{t('rules_setup_step2_desc')}</p>
          </div>
          <div className="bg-rose-50 border-3 border-on-surface rounded-xl p-4 shadow-[3px_3px_0px_0px_#1a1c1c]">
            <div className="font-headline font-black text-sm uppercase text-rose-700 mb-1">{t('rules_setup_step3_title')}</div>
            <p className="text-xs font-sans font-bold text-on-surface-variant">{t('rules_setup_step3_desc')}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function RulesFlow() {
  const { t } = useLanguage();
  return (
    <div className="flex flex-col gap-6">
      <div className="card-brutalist bg-white rounded-2xl p-6">
        <h4 className="font-headline font-black text-lg uppercase mb-4 flex items-center gap-2">
          <span className="material-symbols-outlined text-primary">cycle</span>
          {t('rules_flow_title')}
        </h4>
        <div className="space-y-4">
          <div className="flex gap-4 items-start">
            <div className="bg-primary text-on-primary w-10 h-10 min-w-[2.5rem] flex items-center justify-center rounded-full font-headline font-black text-sm border-3 border-on-surface shadow-[2px_2px_0px_0px_#1a1c1c]">1</div>
            <div>
              <div className="font-headline font-black text-sm uppercase mb-1">{t('rules_flow_s1_title')}</div>
              <p className="text-xs font-sans font-bold text-on-surface-variant">{t('rules_flow_s1_desc')}</p>
            </div>
          </div>
          <div className="flex gap-4 items-start">
            <div className="bg-secondary text-on-error w-10 h-10 min-w-[2.5rem] flex items-center justify-center rounded-full font-headline font-black text-sm border-3 border-on-surface shadow-[2px_2px_0px_0px_#1a1c1c]">2</div>
            <div>
              <div className="font-headline font-black text-sm uppercase mb-1">{t('rules_flow_s2_title')}</div>
              <p className="text-xs font-sans font-bold text-on-surface-variant">{t('rules_flow_s2_desc')}</p>
            </div>
          </div>
          <div className="flex gap-4 items-start">
            <div className="bg-yellow-400 text-slate-950 w-10 h-10 min-w-[2.5rem] flex items-center justify-center rounded-full font-headline font-black text-sm border-3 border-on-surface shadow-[2px_2px_0px_0px_#1a1c1c]">3</div>
            <div>
              <div className="font-headline font-black text-sm uppercase mb-1">{t('rules_flow_s3_title')}</div>
              <p className="text-xs font-sans font-bold text-on-surface-variant">
                {t('rules_flow_s3_defuse')}
              </p>
              <p className="text-xs font-sans font-bold text-on-surface-variant mt-1">
                {t('rules_flow_s3_nodefuse')}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="card-brutalist bg-amber-50 rounded-2xl p-6">
        <h4 className="font-headline font-black text-base uppercase mb-2 flex items-center gap-2">
          <span className="material-symbols-outlined text-amber-600">emoji_events</span>
          {t('rules_win_title')}
        </h4>
        <p className="text-sm font-sans font-bold text-on-surface-variant">
          {t('rules_win_desc')}
        </p>
      </div>
    </div>
  );
}

function RulesCards() {
  const { t, language } = useLanguage();

  const cardTable = language === 'en' ? [
    { name: 'Exploding Kitten', qty: 'Players - 1', effect: 'Draw this card and have no Defuse -> immediately eliminated.' },
    { name: 'Defuse', qty: '6', effect: 'Defuse the Exploding Kitten. Put the Exploding Kitten back anywhere in the deck.' },
    { name: 'Nope', qty: '5', effect: 'Cancel the effect of the last played card (except Defuse and other Nopes).' },
    { name: 'Attack', qty: '4', effect: 'End your turn without drawing. The next player must take 2 turns in a row.' },
    { name: 'Skip', qty: '4', effect: 'End your current turn without drawing a card.' },
    { name: 'See the Future', qty: '5', effect: 'Secretly view the top 3 cards of the draw pile.' },
    { name: 'Shuffle', qty: '4', effect: 'Randomly shuffle the remaining draw pile.' },
    { name: 'Favor', qty: '4', effect: 'Force another player to give you 1 card from their hand (of their choice).' },
    { name: 'Taco Cat', qty: '4', effect: 'Standard cat card — combo 2 cards of the same type to steal from an opponent.' },
    { name: 'Watermelon Cat', qty: '4', effect: 'Standard cat card — same as Taco Cat.' },
    { name: 'Beard Cat', qty: '4', effect: 'Standard cat card — same as Taco Cat.' },
    { name: 'Rainbow Cat', qty: '4', effect: 'Standard cat card — same as Taco Cat.' },
    { name: 'Potato Cat', qty: '4', effect: 'Standard cat card — same as Taco Cat.' },
  ] : [
    { name: 'Exploding Kitten', qty: 'Số người chơi - 1', effect: 'Bốc trúng và không có Defuse → bị loại ngay lập tức.' },
    { name: 'Defuse', qty: '6', effect: 'Vô hiệu hóa Mèo Nổ. Đặt lại Mèo Nổ vào bất kỳ vị trí nào trong xấp bài.' },
    { name: 'Nope', qty: '5', effect: 'Hủy bỏ hiệu ứng lá bài vừa đánh (trừ Defuse và Nope khác).' },
    { name: 'Attack', qty: '4', effect: 'Kết thúc lượt không bốc bài. Đối thủ tiếp theo đi 2 lượt liên tiếp.' },
    { name: 'Skip', qty: '4', effect: 'Kết thúc lượt hiện tại mà không cần bốc bài.' },
    { name: 'See the Future', qty: '5', effect: 'Xem bí mật 3 lá bài trên cùng của bộ bài bốc.' },
    { name: 'Shuffle', qty: '4', effect: 'Xáo trộn ngẫu nhiên xấp bài bốc còn lại.' },
    { name: 'Favor', qty: '4', effect: 'Bắt một người chơi phải tặng bạn 1 lá bài (do họ tự chọn).' },
    { name: 'Mèo Taco', qty: '4', effect: 'Mèo thường — combo 2 lá cùng loại để cướp bài đối thủ.' },
    { name: 'Mèo Dưa Hấu', qty: '4', effect: 'Mèo thường — giống Mèo Taco.' },
    { name: 'Mèo Râu Dài', qty: '4', effect: 'Mèo thường — giống Mèo Taco.' },
    { name: 'Mèo Cầu Vồng', qty: '4', effect: 'Mèo thường — giống Mèo Taco.' },
    { name: 'Mèo Khoai Tây', qty: '4', effect: 'Mèo thường — giống Mèo Taco.' },
  ];

  return (
    <div className="card-brutalist bg-white rounded-2xl p-6 overflow-x-auto">
      <h4 className="font-headline font-black text-lg uppercase mb-4 flex items-center gap-2">
        <span className="material-symbols-outlined text-primary">playing_cards</span>
        {t('rules_cards_title')}
      </h4>
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b-4 border-on-surface">
            <th className="font-headline font-black text-xs uppercase py-3 px-3 text-on-surface">{t('rules_cards_col_name')}</th>
            <th className="font-headline font-black text-xs uppercase py-3 px-3 text-on-surface text-center">{t('rules_cards_col_qty')}</th>
            <th className="font-headline font-black text-xs uppercase py-3 px-3 text-on-surface">{t('rules_cards_col_effect')}</th>
          </tr>
        </thead>
        <tbody>
          {cardTable.map((card, idx) => (
            <tr
              key={card.name}
              className={`border-b-2 border-slate-200 transition-colors hover:bg-primary-fixed/30 ${idx % 2 === 0 ? 'bg-slate-50' : 'bg-white'}`}
            >
              <td className="py-3 px-3 font-headline font-black text-xs uppercase text-on-surface whitespace-nowrap">{card.name}</td>
              <td className="py-3 px-3 font-headline font-black text-xs text-center text-primary">{card.qty}</td>
              <td className="py-3 px-3 font-sans font-bold text-xs text-on-surface-variant">{card.effect}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function RulesCombo() {
  const { t } = useLanguage();
  const comboImg = getCardImageUrl('cat_taco', 0);
  return (
    <div className="flex flex-col gap-6">
      <div className="card-brutalist bg-white rounded-2xl p-6">
        <h4 className="font-headline font-black text-lg uppercase mb-4 flex items-center gap-2">
          <span className="material-symbols-outlined text-primary">pets</span>
          {t('rules_combo_title')}
        </h4>
        <p className="font-sans text-sm text-on-surface-variant font-bold leading-relaxed mb-6">
          {t('rules_combo_desc')}
        </p>

        <div className="bg-gradient-to-r from-violet-50 to-fuchsia-50 border-3 border-on-surface rounded-2xl p-6 shadow-[4px_4px_0px_0px_#1a1c1c]">
          <div className="flex flex-col md:flex-row gap-6 items-center">
            {/* Visual combo illustration */}
            <div className="flex items-center gap-2 shrink-0">
              {comboImg && (
                <>
                  <div className="w-20 h-28 rounded-xl border-3 border-on-surface shadow-[3px_3px_0px_0px_#1a1c1c] overflow-hidden bg-slate-200 transform -rotate-6">
                    <img src={comboImg} alt="Mèo Taco" className="w-full h-full object-cover" />
                  </div>
                  <div className="font-headline font-black text-2xl text-primary">+</div>
                  <div className="w-20 h-28 rounded-xl border-3 border-on-surface shadow-[3px_3px_0px_0px_#1a1c1c] overflow-hidden bg-slate-200 transform rotate-6">
                    <img src={comboImg} alt="Mèo Taco" className="w-full h-full object-cover" />
                  </div>
                  <div className="font-headline font-black text-2xl text-secondary mx-2">=</div>
                </>
              )}
              <div className="bg-yellow-400 border-3 border-on-surface rounded-xl p-3 shadow-[3px_3px_0px_0px_#1a1c1c] transform rotate-3">
                <span className="material-symbols-outlined text-3xl text-slate-950">redeem</span>
              </div>
            </div>

            <div className="flex-1">
              <div className="font-headline font-black text-base uppercase text-violet-700 mb-2">{t('rules_combo_2_title')}</div>
              <p className="text-sm font-sans font-bold text-on-surface-variant leading-relaxed">
                {t('rules_combo_2_desc')}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const TAB_CONTENT = {
  setup: RulesSetup,
  flow: RulesFlow,
  cards: RulesCards,
  combo: RulesCombo,
};

export default function Home({ setPage }) {
  const { t } = useLanguage();
  const canvasRef = useRef(null);
  const [activeTab, setActiveTab] = useState('setup');

  const rulesTabs = [
    { id: 'setup', label: t('rules_tab_setup') },
    { id: 'flow', label: t('rules_tab_flow') },
    { id: 'cards', label: t('rules_tab_cards') },
    { id: 'combo', label: t('rules_tab_combo') },
  ];

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let gl;
    try {
      gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    } catch (e) {
      return;
    }
    if (!gl) return;

    const vs = `
      attribute vec2 a_position;
      varying vec2 v_texCoord;
      void main() {
        v_texCoord = a_position * 0.5 + 0.5;
        gl_Position = vec4(a_position, 0.0, 1.0);
      }
    `;

    const fs = `
      precision highp float;
      uniform float u_time;
      varying vec2 v_texCoord;

      float hash(vec2 p) {
          return fract(sin(dot(p, vec2(12.71, 78.233))) * 43758.5453123);
      }

      float noise(vec2 p) {
          vec2 i = floor(p);
          vec2 f = fract(p);
          vec2 u = f * f * (3.0 - 2.0 * f);
          return mix(mix(hash(i + vec2(0.0, 0.0)), hash(i + vec2(1.0, 0.0)), u.x),
                     mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
      }

      void main() {
          vec2 uv = v_texCoord;
          float n = noise(uv * 4.0 + u_time * 0.5);
          n += 0.5 * noise(uv * 8.0 - u_time * 0.8);
          
          vec3 color1 = vec3(1.0, 0.34, 0.13); // #FF5722 Orange
          vec3 color2 = vec3(0.89, 0.22, 0.21); // #E53935 Red
          vec3 color3 = vec3(0.13, 0.13, 0.13); // #212121 Charcoal
          
          vec3 finalColor = mix(color1, color2, n);
          finalColor = mix(finalColor, color3, pow(1.0 - n, 3.0) * 0.3);
          
          gl_FragColor = vec4(finalColor, 1.0);
      }
    `;

    const compileShader = (type, src) => {
      const s = gl.createShader(type);
      gl.shaderSource(s, src);
      gl.compileShader(s);
      return s;
    };

    const program = gl.createProgram();
    gl.attachShader(program, compileShader(gl.VERTEX_SHADER, vs));
    gl.attachShader(program, compileShader(gl.FRAGMENT_SHADER, fs));
    gl.linkProgram(program);
    gl.useProgram(program);

    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);

    const position = gl.getAttribLocation(program, 'a_position');
    gl.enableVertexAttribArray(position);
    gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);

    const uTime = gl.getUniformLocation(program, 'u_time');

    let animationFrameId;
    const render = (time) => {
      // Handle resizing
      const w = canvas.clientWidth || 800;
      const h = canvas.clientHeight || 450;
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.uniform1f(uTime, time * 0.001);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      animationFrameId = requestAnimationFrame(render);
    };

    render(0);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  useEffect(() => {
    gsap.fromTo('.hero-anim',
      { opacity: 0, y: 30 },
      { opacity: 1, y: 0, duration: 0.6, stagger: 0.1, ease: 'power3.out' }
    );
  }, []);

  const handleStartPlay = () => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      setPage('Game');
    } else {
      setPage('Login');
    }
  };

  const ActiveTabContent = TAB_CONTENT[activeTab];

  return (
    <div className="flex flex-col gap-16 text-left">
      {/* Hero Section */}
      <section className="relative min-h-[70vh] flex items-center justify-center overflow-hidden border-4 border-on-surface rounded-3xl shadow-[8px_8px_0px_0px_#1a1c1c] bg-[#1a1c1c]">
        {/* Animated Background Canvas */}
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full z-0 opacity-80"
        />

        <div className="relative z-10 w-full max-w-5xl mx-auto px-6 py-12 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div className="flex flex-col items-start gap-6">
            <div className="hero-anim chip-warning bg-secondary text-on-error px-4 py-1.5 rounded-xl border-3 border-on-surface font-headline font-black uppercase shadow-[3px_3px_0px_0px_#1a1c1c] text-xs">
              {t('warning_addictive')}
            </div>
            
            <h1 className="hero-anim font-headline text-3xl md:text-5xl text-on-surface uppercase leading-tight bg-white p-6 border-4 border-on-surface shadow-[6px_6px_0px_0px_#1a1c1c] transform -rotate-1">
              {t('hero_title')}
            </h1>
            
            <p className="hero-anim font-sans font-bold text-sm md:text-base text-on-surface-variant bg-white/95 p-5 border-3 border-on-surface shadow-[4px_4px_0px_0px_#1a1c1c] rounded-xl leading-relaxed">
              {t('hero_desc')}
            </p>
            
            <button
              onClick={handleStartPlay}
              className="hero-anim btn-detonator px-8 py-4 rounded-2xl font-headline font-black text-xl md:text-2xl uppercase mt-4 flex items-center gap-2"
            >
              {t('play_now')}
              <span className="material-symbols-outlined text-2xl">local_fire_department</span>
            </button>
          </div>

          <div className="relative flex justify-center items-center">
            <div className="absolute inset-0 bg-primary-container rounded-full blur-3xl opacity-30 scale-150 animate-pulse"></div>
            <div className="flex gap-4 relative">
              {heroExplodingImg && (
                <img src={heroExplodingImg} alt="Exploding Kitten" className="w-36 h-48 object-contain transform -rotate-12 hover:-rotate-6 transition-transform duration-300 drop-shadow-[4px_4px_0px_#1a1c1c] border-3 border-on-surface rounded-2xl p-1 bg-rose-500" />
              )}
              {heroDefuseImg && (
                <img src={heroDefuseImg} alt="Defuse" className="w-36 h-48 object-contain transform rotate-12 hover:rotate-6 transition-transform duration-300 drop-shadow-[4px_4px_0px_#1a1c1c] border-3 border-on-surface rounded-2xl p-1 bg-emerald-500 -ml-12 mt-6" />
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Quick Intro Steps */}
      <section className="py-12 relative">
        <div className="text-center mb-16">
          <h2 className="font-headline text-3xl md:text-4xl text-on-surface uppercase inline-block bg-yellow-400 px-8 py-3 border-4 border-on-surface shadow-[6px_6px_0px_0px_#1a1c1c] transform rotate-1">
            {t('rules_how_to_play')}
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 max-w-5xl mx-auto px-4">
          {/* Step 1 */}
          <div className="card-brutalist bg-white p-8 flex flex-col items-center text-center relative group rounded-2xl">
            <div className="absolute -top-6 -left-6 bg-secondary text-on-error w-12 h-12 flex items-center justify-center rounded-full font-headline font-black text-xl border-3 border-on-surface z-10 group-hover:scale-110 transition-transform">
              1
            </div>
            <div className="w-24 h-24 bg-primary-fixed border-3 border-on-surface rounded-2xl flex items-center justify-center mb-6 group-hover:-translate-y-2 group-hover:rotate-6 transition-all duration-300 p-2">
              {stepSeeTheFutureImg ? (
                <img src={stepSeeTheFutureImg} alt="Tiên Tri" className="h-full w-full object-contain" />
              ) : (
                <span className="text-4xl">👁️</span>
              )}
            </div>
            <h3 className="font-headline font-black text-lg uppercase mb-2">{t('home_step1_title')}</h3>
            <p className="font-sans text-sm text-on-surface-variant font-bold">
              {t('home_step1_desc')}
            </p>
          </div>

          {/* Step 2 */}
          <div className="card-brutalist bg-white p-8 flex flex-col items-center text-center relative group rounded-2xl md:translate-y-4">
            <div className="absolute -top-6 -left-6 bg-primary text-on-primary w-12 h-12 flex items-center justify-center rounded-full font-headline font-black text-xl border-3 border-on-surface z-10 group-hover:scale-110 transition-transform">
              2
            </div>
            <div className="w-24 h-24 bg-error-container border-3 border-on-surface rounded-2xl flex items-center justify-center mb-6 group-hover:-translate-y-2 group-hover:-rotate-6 transition-all duration-300 p-2">
              {stepExplodingImg ? (
                <img src={stepExplodingImg} alt="Mèo Nổ" className="h-full w-full object-contain" />
              ) : (
                <span className="text-4xl">💣</span>
              )}
            </div>
            <h3 className="font-headline font-black text-lg uppercase mb-2">{t('home_step2_title')}</h3>
            <p className="font-sans text-sm text-on-surface-variant font-bold">
              {t('home_step2_desc')}
            </p>
          </div>

          {/* Step 3 */}
          <div className="card-brutalist bg-white p-8 flex flex-col items-center text-center relative group rounded-2xl">
            <div className="absolute -top-6 -left-6 bg-yellow-400 text-slate-950 w-12 h-12 flex items-center justify-center rounded-full font-headline font-black text-xl border-3 border-on-surface z-10 group-hover:scale-110 transition-transform">
              3
            </div>
            <div className="w-24 h-24 bg-indigo-100 border-3 border-on-surface rounded-2xl flex items-center justify-center mb-6 group-hover:-translate-y-2 group-hover:rotate-12 transition-all duration-300 p-2">
              {stepAttackImg ? (
                <img src={stepAttackImg} alt="Tấn Công" className="h-full w-full object-contain" />
              ) : (
                <span className="text-4xl">⚔️</span>
              )}
            </div>
            <h3 className="font-headline font-black text-lg uppercase mb-2">{t('home_step3_title')}</h3>
            <p className="font-sans text-sm text-on-surface-variant font-bold">
              {t('home_step3_desc')}
            </p>
          </div>
        </div>
      </section>

      {/* Game Rules Section */}
      <section className="py-12 relative">
        <div className="text-center mb-12">
          <h2 className="font-headline text-3xl md:text-4xl text-on-surface uppercase inline-block bg-primary-container px-8 py-3 border-4 border-on-surface shadow-[6px_6px_0px_0px_#1a1c1c] transform -rotate-1">
            {t('rules_detailed')}
          </h2>
        </div>

        <div className="max-w-5xl mx-auto px-4">
          {/* Tab Navigation */}
          <div className="flex flex-wrap gap-2 mb-8 justify-center">
            {rulesTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-5 py-2.5 rounded-xl font-headline font-black text-sm uppercase border-3 border-on-surface transition-all duration-100
                  ${activeTab === tab.id
                    ? 'bg-primary text-on-primary shadow-[4px_4px_0px_0px_#1a1c1c] -translate-y-1'
                    : 'bg-white text-on-surface shadow-[3px_3px_0px_0px_#1a1c1c] hover:-translate-y-0.5 hover:shadow-[4px_4px_0px_0px_#1a1c1c]'
                  }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="min-h-[300px]">
            <ActiveTabContent />
          </div>
        </div>
      </section>
    </div>
  );
}
