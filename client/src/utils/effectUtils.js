import gsap from 'gsap';

// Quản lý mảng hạt dùng chung ngoài React state để tối ưu hóa render
let activeParticles = [];
let animFrameId = null;

const palettes = {
  defuse: ['#10b981', '#34d399', '#6ee7b7', '#ffffff'],
  catomic: ['#84cc16', '#a3e635', '#d9f99d', '#fbbf24'],
  nope: ['#ef4444', '#f87171', '#fca5a5', '#1a1a1a'],
  zombie_revive: ['#10b981', '#047857', '#a3e635', '#ffffff'],
  dig_earth: ['#78350f', '#b45309', '#facc15', '#a16207'],
  attack: ['#f97316', '#fb923c', '#fdba74', '#1a1a1a']
};

/**
 * Rung chuyển màn hình bằng cách thêm/bớt các class CSS.
 * 
 * @param {string} intensity - Độ rung: 'light' hoặc 'heavy'
 */
export function triggerScreenShake(intensity) {
  const wrapper = document.getElementById('game-board-wrapper');
  if (!wrapper) return;

  wrapper.classList.remove('shake-heavy', 'shake-light');
  void wrapper.offsetWidth; // Force reflow để kích hoạt lại keyframes

  wrapper.classList.add(intensity === 'heavy' ? 'shake-heavy' : 'shake-light');

  const onShakeEnd = () => {
    wrapper.classList.remove('shake-heavy', 'shake-light');
    wrapper.removeEventListener('animationend', onShakeEnd);
  };
  wrapper.addEventListener('animationend', onShakeEnd);
}

/**
 * Kích hoạt vụ nổ hạt vector nét viền đen trên Canvas dùng chung.
 * 
 * @param {number} x - Tọa độ X
 * @param {number} y - Tọa độ Y
 * @param {string} paletteType - Nhóm màu sắc
 */
export function spawnParticleBurst(x, y, paletteType) {
  const canvas = document.getElementById('effects-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  // Điều chỉnh size canvas động theo cửa sổ trình duyệt
  if (canvas.width !== window.innerWidth || canvas.height !== window.innerHeight) {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }

  const palette = palettes[paletteType] || ['#ffffff'];
  const numParticles = 40;

  for (let i = 0; i < numParticles; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 2 + Math.random() * 8;
    activeParticles.push({
      x: x,
      y: y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - (1 + Math.random() * 2),
      life: 1.0,
      decay: 0.015 + Math.random() * 0.02,
      size: 5 + Math.random() * 12,
      color: palette[Math.floor(Math.random() * palette.length)],
      type: Math.random() > 0.5 ? 'star' : 'circle'
    });
  }

  const draw = () => {
    const currentCanvas = document.getElementById('effects-canvas');
    if (!currentCanvas) return;
    const currentCtx = currentCanvas.getContext('2d');
    if (!currentCtx) return;

    currentCtx.clearRect(0, 0, currentCanvas.width, currentCanvas.height);
    let active = false;

    activeParticles.forEach(p => {
      if (p.life > 0) {
        active = true;
        currentCtx.beginPath();
        currentCtx.fillStyle = p.color;
        currentCtx.strokeStyle = '#1a1a1a';
        currentCtx.lineWidth = 2.5;

        if (p.type === 'star') {
          const r = p.size * p.life;
          currentCtx.moveTo(p.x, p.y - r);
          currentCtx.lineTo(p.x + r * 0.3, p.y - r * 0.3);
          currentCtx.lineTo(p.x + r, p.y);
          currentCtx.lineTo(p.x + r * 0.3, p.y + r * 0.3);
          currentCtx.lineTo(p.x, p.y + r);
          currentCtx.lineTo(p.x - r * 0.3, p.y + r * 0.3);
          currentCtx.lineTo(p.x - r, p.y);
          currentCtx.lineTo(p.x - r * 0.3, p.y - r * 0.3);
          currentCtx.closePath();
          currentCtx.fill();
          currentCtx.stroke();
        } else {
          const r = (p.size / 2) * p.life;
          currentCtx.arc(p.x, p.y, r, 0, Math.PI * 2);
          currentCtx.fill();
          currentCtx.stroke();
        }

        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.15; // Trọng lực nhẹ rơi xuống
        p.life -= p.decay;
      }
    });

    activeParticles = activeParticles.filter(p => p.life > 0);

    if (activeParticles.length > 0) {
      animFrameId = requestAnimationFrame(draw);
    } else {
      currentCtx.clearRect(0, 0, currentCanvas.width, currentCanvas.height);
      animFrameId = null;
    }
  };

  if (!animFrameId) {
    animFrameId = requestAnimationFrame(draw);
  }
}

/**
 * Diễn hoạt bay của một lá bài clone từ nguồn đến đích với vệt trail.
 */
export function playFlyingCard({
  sourceId,
  targetId,
  cardType,
  theme,
  onStart,
  onComplete
}) {
  const sourceEl = document.getElementById(sourceId);
  const targetEl = document.getElementById(targetId);
  if (!sourceEl || !targetEl) return;

  const sourceRect = sourceEl.getBoundingClientRect();
  const targetRect = targetEl.getBoundingClientRect();

  const clone = document.createElement('div');
  clone.style.position = 'fixed';
  clone.style.top = `${sourceRect.top}px`;
  clone.style.left = `${sourceRect.left}px`;
  clone.style.width = '128px';
  clone.style.height = '176px';
  clone.style.zIndex = '140';
  clone.style.pointerEvents = 'none';

  clone.innerHTML = `
    <div class="h-full w-full rounded-none border-3 border-slate-900 bg-white flex flex-col justify-between p-3 shadow-[4px_4px_0px_0px_#1a1a1a] scale-90 select-none">
      <div class="flex justify-between items-center border-b-2 border-slate-900 pb-1">
        <span class="text-[9px] font-headline font-black uppercase text-slate-900 truncate max-w-[90px]">${theme?.name || cardType}</span>
        <span class="text-[9px] font-headline font-black text-slate-900">[${cardType.slice(0, 2).toUpperCase()}]</span>
      </div>
      <div class="flex-grow flex items-center justify-center my-2">
        <div class="w-12 h-12 border-2 border-slate-900 flex items-center justify-center font-headline font-black text-xl text-slate-900 bg-yellow-400 shadow-[2px_2px_0px_0px_#1a1a1a] rounded-none">
          ${(theme?.name || cardType).slice(0, 1).toUpperCase()}
        </div>
      </div>
      <div class="text-[7px] font-bold text-slate-500 leading-tight border-t-2 border-dashed border-slate-200 pt-1 text-center truncate">
        ${theme?.desc || ''}
      </div>
    </div>
  `;

  document.body.appendChild(clone);

  const x1 = sourceRect.left + sourceRect.width / 2 - 64;
  const y1 = sourceRect.top + sourceRect.height / 2 - 88;
  const x2 = targetRect.left + targetRect.width / 2 - 64;
  const y2 = targetRect.top + targetRect.height / 2 - 88;

  const midX = (x1 + x2) / 2;
  const midY = (y1 + y2) / 2;
  const controlY = midY - (150 + Math.random() * 100);

  let trailColor = '#db2777';
  if (cardType?.startsWith('attack')) trailColor = '#f97316';
  else if (cardType === 'favor') trailColor = '#eab308';
  else if (cardType === 'nope') trailColor = '#db2777';

  if (onStart) onStart();

  const obj = { t: 0 };
  const trailInterval = setInterval(() => {
    const tVal = obj.t;
    const currX = (1 - tVal) * (1 - tVal) * x1 + 2 * (1 - tVal) * tVal * midX + tVal * tVal * x2;
    const currY = (1 - tVal) * (1 - tVal) * y1 + 2 * (1 - tVal) * tVal * controlY + tVal * tVal * y2;

    const trail = document.createElement('div');
    trail.style.position = 'fixed';
    trail.style.left = `${currX + 64 - 4}px`;
    trail.style.top = `${currY + 88 - 4}px`;
    trail.style.width = '8px';
    trail.style.height = '8px';
    trail.style.borderRadius = '50%';
    trail.style.backgroundColor = trailColor;
    trail.style.zIndex = '139';
    trail.style.pointerEvents = 'none';
    trail.style.opacity = '0.6';
    trail.style.transition = 'opacity 300ms, transform 300ms';
    document.body.appendChild(trail);

    setTimeout(() => {
      trail.style.opacity = '0';
      trail.style.transform = 'scale(0.1)';
      setTimeout(() => {
        if (trail.parentNode) trail.parentNode.removeChild(trail);
      }, 300);
    }, 50);
  }, 40);

  gsap.to(obj, {
    t: 1,
    duration: 0.55,
    ease: 'power2.inOut',
    onUpdate: () => {
      const tVal = obj.t;
      const currX = (1 - tVal) * (1 - tVal) * x1 + 2 * (1 - tVal) * tVal * midX + tVal * tVal * x2;
      const currY = (1 - tVal) * (1 - tVal) * y1 + 2 * (1 - tVal) * tVal * controlY + tVal * tVal * y2;

      let rotation = 0;
      if (tVal < 0.5) {
        rotation = (tVal / 0.5) * 15;
      } else {
        const subT = (tVal - 0.5) / 0.5;
        rotation = 15 - subT * 23;
        if (subT > 0.8) {
          rotation = -8 + ((subT - 0.8) / 0.2) * 8;
        }
      }

      gsap.set(clone, {
        x: currX - x1,
        y: currY - y1,
        rotation: rotation,
        scale: 1.0 + Math.sin(tVal * Math.PI) * 0.3
      });
    },
    onComplete: () => {
      clearInterval(trailInterval);
      if (clone.parentNode) {
        clone.parentNode.removeChild(clone);
      }
      if (onComplete) {
        onComplete();
      }

      const centerTargetX = targetRect.left + targetRect.width / 2;
      const centerTargetY = targetRect.top + targetRect.height / 2;
      spawnParticleBurst(centerTargetX, centerTargetY, cardType === 'nope' ? 'nope' : (cardType === 'catomic_bomb' ? 'catomic' : 'defuse'));
    }
  });
}

/**
 * Hiệu ứng Skip: Mũi tên phản lực bay vút chéo màn hình
 */
export function playSkipEffect(triggerEl) {
  const rect = triggerEl ? triggerEl.getBoundingClientRect() : {
    left: window.innerWidth / 2,
    top: window.innerHeight / 2,
    width: 0,
    height: 0
  };
  
  const startX = rect.left + rect.width / 2;
  const startY = rect.top + rect.height / 2;

  const overlay = document.createElement('div');
  overlay.style.position = 'fixed';
  overlay.style.inset = '0';
  overlay.style.zIndex = '180';
  overlay.style.pointerEvents = 'none';
  overlay.style.overflow = 'hidden';
  document.body.appendChild(overlay);

  const arrow = document.createElement('div');
  arrow.style.position = 'absolute';
  arrow.style.width = '120px';
  arrow.style.height = '80px';
  arrow.style.left = `${startX - 60}px`;
  arrow.style.top = `${startY - 40}px`;
  arrow.style.backgroundColor = '#06b6d4'; // Cyan 500
  arrow.style.border = '4px solid #1a1c1c';
  arrow.style.boxShadow = '5px 5px 0px 0px #1a1c1c';
  arrow.style.display = 'flex';
  arrow.style.alignItems = 'center';
  arrow.style.justifyContent = 'center';
  arrow.style.transform = 'scale(0) rotate(-10deg)';

  arrow.innerHTML = `
    <div style="display: flex; gap: 8px; align-items: center; justify-content: center; width: 100%; height: 100%;">
      <svg width="24" height="32" viewBox="0 0 24 32" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M4 4L20 16L4 28" stroke="#1a1c1c" stroke-width="4.5" stroke-linecap="square" stroke-linejoin="miter" />
      </svg>
      <svg width="24" height="32" viewBox="0 0 24 32" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M4 4L20 16L4 28" stroke="#1a1c1c" stroke-width="4.5" stroke-linecap="square" stroke-linejoin="miter" />
      </svg>
    </div>
  `;
  overlay.appendChild(arrow);

  const trailCount = 3;
  const trails = [];
  for (let i = 0; i < trailCount; i++) {
    const trail = document.createElement('div');
    trail.style.position = 'absolute';
    trail.style.height = '6px';
    trail.style.width = '60px';
    trail.style.backgroundColor = '#1a1c1c';
    trail.style.left = `${startX - 120}px`;
    trail.style.top = `${startY - 30 + i * 25}px`;
    trail.style.opacity = '0';
    overlay.appendChild(trail);
    trails.push(trail);
  }

  const tl = gsap.timeline({
    onComplete: () => {
      if (overlay.parentNode) {
        overlay.parentNode.removeChild(overlay);
      }
    }
  });

  // Entrance
  tl.to(arrow, {
    scale: 1,
    rotation: 5,
    duration: 0.25,
    ease: 'back.out(2.5)',
  });

  // Windup (lùi lấy đà)
  tl.to(arrow, {
    x: -30,
    rotation: -5,
    duration: 0.15,
    ease: 'power2.out',
  });

  // Swoosh Dash
  tl.to(arrow, {
    x: window.innerWidth - startX + 150,
    rotation: 15,
    duration: 0.45,
    ease: 'power3.in',
  }, '+=0.05');

  // Trail bám đuôi với delay tăng dần
  trails.forEach((trail, index) => {
    tl.to(trail, {
      opacity: 0.6 - index * 0.15,
      x: `+=${window.innerWidth}`,
      duration: 0.45,
      delay: index * 0.04,
      ease: 'power3.in',
    }, '<+=0.05');
  });

  return tl;
}

/**
 * Hiệu ứng Nope: Dấu đóng mộc pop-up co giãn và nổ hạt đỏ
 */
export function playNopeEffect(triggerEl) {
  const rect = triggerEl ? triggerEl.getBoundingClientRect() : {
    left: window.innerWidth / 2,
    top: window.innerHeight / 2,
    width: 0,
    height: 0
  };

  const startX = rect.left + rect.width / 2;
  const startY = rect.top + rect.height / 2;

  const overlay = document.createElement('div');
  overlay.style.position = 'fixed';
  overlay.style.inset = '0';
  overlay.style.zIndex = '180';
  overlay.style.pointerEvents = 'none';
  overlay.style.overflow = 'hidden';
  document.body.appendChild(overlay);

  const stamp = document.createElement('div');
  stamp.className = 'nope-stamp';
  stamp.innerText = 'NOPE!';
  stamp.style.position = 'absolute';
  stamp.style.left = `${startX - 150}px`;
  stamp.style.top = `${startY - 50}px`;
  stamp.style.transform = 'scale(0) rotate(-15deg)';
  stamp.style.width = '300px';
  stamp.style.textAlign = 'center';
  overlay.appendChild(stamp);

  triggerScreenShake('heavy');

  const tl = gsap.timeline({
    onComplete: () => {
      if (overlay.parentNode) {
        overlay.parentNode.removeChild(overlay);
      }
    }
  });

  // Đập mạnh mộc xuống với bounce lò xo
  tl.to(stamp, {
    scale: 1,
    rotation: -12,
    duration: 0.35,
    ease: 'elastic.out(1, 0.5)',
    onStart: () => {
      // Bắn vệt hạt màu đỏ dưới dấu mộc
      spawnParticleBurst(startX, startY, 'nope');
    }
  })
  // Giữ nguyên 1 lúc rồi fade out bay chéo lên trên
  .to(stamp, {
    delay: 0.45,
    opacity: 0,
    scale: 1.3,
    rotation: -15,
    duration: 0.2,
    ease: 'power2.in'
  });

  return tl;
}

/**
 * Hiệu ứng Attack: Vết chém móng vuốt kép xẹt qua màn hình
 */
export function playAttackEffect(triggerEl) {
  const rect = triggerEl ? triggerEl.getBoundingClientRect() : {
    left: window.innerWidth / 2,
    top: window.innerHeight / 2,
    width: 0,
    height: 0
  };

  const startX = rect.left + rect.width / 2;
  const startY = rect.top + rect.height / 2;

  const overlay = document.createElement('div');
  overlay.style.position = 'fixed';
  overlay.style.inset = '0';
  overlay.style.zIndex = '180';
  overlay.style.pointerEvents = 'none';
  overlay.style.overflow = 'hidden';
  document.body.appendChild(overlay);

  // Khung chứa hai vết chém móng vuốt nghiêng chéo màn hình
  const clawContainer = document.createElement('div');
  clawContainer.style.position = 'absolute';
  clawContainer.style.left = '50%';
  clawContainer.style.top = '50%';
  clawContainer.style.width = '400px';
  clawContainer.style.height = '400px';
  clawContainer.style.transform = 'translate(-50%, -50%) rotate(-15deg)';
  clawContainer.style.display = 'flex';
  clawContainer.style.flexDirection = 'column';
  clawContainer.style.justifyContent = 'center';
  clawContainer.style.gap = '30px';
  overlay.appendChild(clawContainer);

  // Tạo 2 vết chém móng vuốt
  const slash1 = document.createElement('div');
  slash1.style.width = '100%';
  slash1.style.height = '16px';
  slash1.style.backgroundColor = '#f97316'; // Orange 500
  slash1.style.border = '4px solid #1a1c1c';
  slash1.style.boxShadow = '3px 3px 0px 0px #1a1c1c';
  slash1.style.clipPath = 'inset(0% 100% 0% 0%)';

  const slash2 = document.createElement('div');
  slash2.style.width = '100%';
  slash2.style.height = '16px';
  slash2.style.backgroundColor = '#f97316'; // Orange 500
  slash2.style.border = '4px solid #1a1c1c';
  slash2.style.boxShadow = '3px 3px 0px 0px #1a1c1c';
  slash2.style.clipPath = 'inset(0% 100% 0% 0%)';

  clawContainer.appendChild(slash1);
  clawContainer.appendChild(slash2);

  triggerScreenShake('light');

  const tl = gsap.timeline({
    onComplete: () => {
      if (overlay.parentNode) {
        overlay.parentNode.removeChild(overlay);
      }
    }
  });

  // Chém xẹt nhanh từ trái qua phải (clipPath inset co về 0%)
  tl.to([slash1, slash2], {
    clipPath: 'inset(0% 0% 0% 0%)',
    duration: 0.25,
    ease: 'power3.out',
    stagger: 0.08,
    onStart: () => {
      spawnParticleBurst(startX, startY, 'attack');
    }
  })
  // Mờ dần và thu hẹp chiều cao (co rút sẹo chém)
  .to([slash1, slash2], {
    opacity: 0,
    scaleY: 0.1,
    duration: 0.2,
    ease: 'power2.in'
  }, '+=0.15');

  return tl;
}
