import gsap from 'gsap';

// Quản lý mảng hạt dùng chung ngoài React state để tối ưu hóa render
let activeParticles = [];
let animFrameId = null;

const palettes = {
  defuse: ['#00FF66', '#a3e635', '#00CCFF', '#ffffff'],
  catomic: ['#00FF66', '#a3e635', '#FFD700', '#FF9900'],
  nope: ['#FF3366', '#FF00FF', '#fca5a5', '#111111'],
  zombie_revive: ['#00FF66', '#047857', '#a3e635', '#ffffff'],
  dig_earth: ['#FF9900', '#b45309', '#FFD700', '#a16207'],
  attack: ['#FF9900', '#FFD700', '#fdba74', '#111111']
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
  imageUrl,
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

  if (imageUrl) {
    clone.innerHTML = `
      <div class="h-full w-full rounded-none border-3 border-[var(--pop-black)] shadow-[4px_4px_0_var(--pop-black)] scale-90 overflow-hidden relative bg-black">
        <img src="${imageUrl}" class="w-full h-full object-cover" />
      </div>
    `;
  } else {
    clone.innerHTML = `
      <div class="h-full w-full rounded-none border-3 border-[var(--pop-black)] bg-white flex flex-col justify-between p-3 shadow-[4px_4px_0_var(--pop-black)] scale-90 select-none">
        <div class="flex justify-between items-center border-b-2 border-[var(--pop-black)] pb-1">
          <span class="text-[9px] font-pop-accent font-black uppercase text-[var(--pop-black)] truncate max-w-[90px]">${theme?.name || cardType}</span>
          <span class="text-[9px] font-pop-accent font-black text-[var(--pop-black)]">[${cardType.slice(0, 2).toUpperCase()}]</span>
        </div>
        <div class="flex-grow flex items-center justify-center my-2">
          <div class="w-12 h-12 border-2 border-[var(--pop-black)] flex items-center justify-center font-pop-display font-black text-xl text-[var(--pop-black)] bg-[var(--pop-amber)] shadow-[2px_2px_0_var(--pop-black)] rounded-none">
            ${(theme?.name || cardType).slice(0, 1).toUpperCase()}
          </div>
        </div>
        <div class="text-[7px] font-pop-body font-bold text-[var(--pop-black)]/70 leading-tight border-t-2 border-dashed border-[var(--pop-black)]/30 pt-1 text-center truncate">
          ${theme?.desc || ''}
        </div>
      </div>
    `;
  }

  document.body.appendChild(clone);

  const x1 = sourceRect.left + sourceRect.width / 2 - 64;
  const y1 = sourceRect.top + sourceRect.height / 2 - 88;
  const x2 = targetRect.left + targetRect.width / 2 - 64;
  const y2 = targetRect.top + targetRect.height / 2 - 88;

  const midX = (x1 + x2) / 2;
  const midY = (y1 + y2) / 2;
  const controlY = midY - (150 + Math.random() * 100);

  let trailColor = '#FF00FF'; // pop-pink
  if (cardType?.startsWith('attack')) trailColor = '#FF9900'; // pop-orange
  else if (cardType === 'favor') trailColor = '#FFD700'; // pop-amber
  else if (cardType === 'nope') trailColor = '#FF3366'; // pop-red

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
 * Hiệu ứng Skip: Mũi tên xanh dương >> với hiệu ứng Zoom In / Zoom Out mượt mà
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
  arrow.innerText = '>>';
  arrow.style.position = 'absolute';
  arrow.style.left = '50%';
  arrow.style.top = '50%';
  arrow.style.transform = 'translate(-50%, -50%) scale(0)';
  arrow.style.color = '#00CCFF'; // pop-blue
  arrow.style.fontSize = '180px';
  arrow.style.fontWeight = '900';
  arrow.style.fontFamily = 'system-ui, -apple-system, sans-serif';
  arrow.style.lineHeight = '1';
  arrow.style.WebkitTextStroke = '8px #111111'; // pop-black stroke
  arrow.style.textShadow = '10px 10px 0px #111111'; // pop-black shadow
  overlay.appendChild(arrow);

  const tl = gsap.timeline({
    onComplete: () => {
      if (overlay.parentNode) {
        overlay.parentNode.removeChild(overlay);
      }
    }
  });

  // Entrance Zoom In
  tl.to(arrow, {
    scale: 1.5,
    duration: 0.4,
    ease: 'back.out(2.5)',
  })
  // Pause a bit
  .to(arrow, {
    scale: 1.6,
    duration: 0.2,
    ease: 'power1.inOut'
  })
  // Zoom Out and move right
  .to(arrow, {
    scale: 0,
    x: window.innerWidth / 2,
    duration: 0.3,
    ease: 'power3.in',
  });

  return tl;
}

/**
 * Hiệu ứng Nope: Biển báo Stop hình bát giác rớt đập xuống
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

  const sign = document.createElement('div');
  sign.innerText = 'NOPE';
  sign.style.position = 'absolute';
  sign.style.left = `${startX - 150}px`;
  sign.style.top = `${startY - 150}px`;
  sign.style.width = '300px';
  sign.style.height = '300px';
  sign.style.backgroundColor = '#FF3366'; // pop-red
  sign.style.color = '#FDFCF0'; // pop-cream
  sign.style.display = 'flex';
  sign.style.alignItems = 'center';
  sign.style.justifyContent = 'center';
  sign.style.fontSize = '72px';
  sign.style.fontWeight = '900';
  sign.style.fontFamily = 'system-ui, -apple-system, sans-serif';
  sign.style.WebkitTextStroke = '3px #111111';
  sign.style.textShadow = '4px 4px 0px #111111';
  
  // Octagon clip-path for Stop Sign
  sign.style.clipPath = 'polygon(30% 0%, 70% 0%, 100% 30%, 100% 70%, 70% 100%, 30% 100%, 0% 70%, 0% 30%)';
  // Fake border using an inner div or box shadow (box-shadow doesn't work well with clip-path, so let's use a wrapper)
  
  const signWrapper = document.createElement('div');
  signWrapper.style.position = 'absolute';
  signWrapper.style.left = `${startX - 160}px`;
  signWrapper.style.top = `${startY - 160}px`;
  signWrapper.style.width = '320px';
  signWrapper.style.height = '320px';
  signWrapper.style.backgroundColor = '#111111';
  signWrapper.style.clipPath = 'polygon(30% 0%, 70% 0%, 100% 30%, 100% 70%, 70% 100%, 30% 100%, 0% 70%, 0% 30%)';
  signWrapper.style.transform = 'scale(0) translateY(-500px)';
  
  // Center sign inside wrapper
  sign.style.left = '10px';
  sign.style.top = '10px';
  
  signWrapper.appendChild(sign);
  overlay.appendChild(signWrapper);

  const tl = gsap.timeline({
    onComplete: () => {
      if (overlay.parentNode) {
        overlay.parentNode.removeChild(overlay);
      }
    }
  });

  // Đập mạnh biển báo từ trên xuống
  tl.to(signWrapper, {
    scale: 1,
    y: 0,
    rotation: -10,
    duration: 0.5,
    ease: 'bounce.out',
    onStart: () => {
      setTimeout(() => triggerScreenShake('heavy'), 150);
    }
  })
  // Giữ nguyên 1 lúc rồi rớt tiếp xuống dưới màn hình
  .to(signWrapper, {
    delay: 0.6,
    y: window.innerHeight,
    rotation: 20,
    duration: 0.4,
    ease: 'power2.in'
  });

  return tl;
}

/**
 * Hiệu ứng Attack: Bàn tay mèo cào với GSAP
 */
export function playAttackEffect(triggerEl, targetPlayerId) {
  const rect = triggerEl ? triggerEl.getBoundingClientRect() : {
    left: window.innerWidth / 2,
    top: window.innerHeight / 2,
    width: 0,
    height: 0
  };

  const startX = rect.left + rect.width / 2;
  const startY = rect.top + rect.height / 2;
  
  let endX = window.innerWidth / 2;
  let endY = window.innerHeight / 2;
  
  if (targetPlayerId) {
    const targetEl = document.getElementById(`player-avatar-${targetPlayerId}`) || document.getElementById('player-hand-container');
    if (targetEl) {
      const tRect = targetEl.getBoundingClientRect();
      endX = tRect.left + tRect.width / 2;
      endY = tRect.top + tRect.height / 2;
    }
  }

  const overlay = document.createElement('div');
  overlay.style.position = 'fixed';
  overlay.style.inset = '0';
  overlay.style.zIndex = '180';
  overlay.style.pointerEvents = 'none';
  overlay.style.overflow = 'hidden';
  document.body.appendChild(overlay);

  // Tạo bàn tay mèo
  const pawContainer = document.createElement('div');
  pawContainer.style.position = 'absolute';
  pawContainer.style.left = `${startX}px`;
  pawContainer.style.top = `${startY}px`;
  pawContainer.style.transform = 'translate(-50%, -50%) scale(0)';
  
  const paw = document.createElement('div');
  paw.style.width = '120px';
  paw.style.height = '120px';
  paw.style.backgroundColor = '#FF9900'; // pop-orange
  paw.style.borderRadius = '50%';
  paw.style.border = '6px solid #111111';
  paw.style.position = 'relative';
  
  // Đệm thịt mèo (Toe beans)
  const pad = document.createElement('div');
  pad.style.position = 'absolute';
  pad.style.width = '50px';
  pad.style.height = '40px';
  pad.style.backgroundColor = '#FF3366';
  pad.style.borderRadius = '50%';
  pad.style.bottom = '20px';
  pad.style.left = '35px';
  pad.style.border = '4px solid #111111';
  paw.appendChild(pad);
  
  const createToe = (x, y, r) => {
    const toe = document.createElement('div');
    toe.style.position = 'absolute';
    toe.style.width = '25px';
    toe.style.height = '35px';
    toe.style.backgroundColor = '#FF3366';
    toe.style.borderRadius = '50%';
    toe.style.left = `${x}px`;
    toe.style.top = `${y}px`;
    toe.style.border = '4px solid #111111';
    toe.style.transform = `rotate(${r}deg)`;
    paw.appendChild(toe);
  };
  createToe(15, 20, -20);
  createToe(45, 10, -5);
  createToe(75, 15, 15);
  
  pawContainer.appendChild(paw);
  overlay.appendChild(pawContainer);

  // Khung chứa vết chém tại điểm đích
  const clawContainer = document.createElement('div');
  clawContainer.style.position = 'absolute';
  clawContainer.style.left = `${endX}px`;
  clawContainer.style.top = `${endY}px`;
  clawContainer.style.width = '240px';
  clawContainer.style.height = '240px';
  clawContainer.style.transform = 'translate(-50%, -50%)';
  clawContainer.style.display = 'flex';
  clawContainer.style.alignItems = 'center';
  clawContainer.style.justifyContent = 'center';
  overlay.appendChild(clawContainer);

  // Tạo 3 vết chém bằng SVG cong
  const svgNS = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(svgNS, "svg");
  svg.setAttribute("viewBox", "0 0 100 100");
  svg.style.width = '100%';
  svg.style.height = '100%';
  svg.style.overflow = 'visible';
  clawContainer.appendChild(svg);

  const slashes = [];
  for (let i = 0; i < 3; i++) {
    const path = document.createElementNS(svgNS, "path");
    // Đường cong từ trên xuống dưới
    const yOffset = i * 25 + 10;
    // d="M x y Q cx cy ex ey"
    // Vẽ nét từ trái sang phải, hơi cong lên trên
    path.setAttribute("d", `M 10 ${yOffset} Q 50 ${yOffset - 30} 90 ${yOffset}`);
    path.style.fill = "none";
    path.style.stroke = "#FF0000"; // Đỏ máu
    path.style.strokeWidth = "8";
    path.style.strokeLinecap = "round";
    path.style.filter = "drop-shadow(3px 3px 0px #111111)"; // Viền đen giả
    // Hiệu ứng vẽ từ từ (stroke-dasharray)
    path.style.strokeDasharray = "120";
    path.style.strokeDashoffset = "120"; 
    svg.appendChild(path);
    slashes.push(path);
  }

  const tl = gsap.timeline({
    onComplete: () => {
      if (overlay.parentNode) {
        overlay.parentNode.removeChild(overlay);
      }
    }
  });

  // Bàn tay mèo xuất hiện và vồ tới đích
  tl.to(pawContainer, {
    scale: 1,
    duration: 0.2,
    ease: 'back.out(2)'
  })
  .to(pawContainer, {
    left: endX,
    top: endY,
    scale: 1.2,
    duration: 0.3,
    ease: 'power2.in',
    onComplete: () => {
      triggerScreenShake('light');
    }
  })
  // Chém xẹt nhanh từ trái qua phải (strokeDashoffset về 0)
  .to(slashes, {
    strokeDashoffset: 0,
    duration: 0.2,
    ease: 'power3.out',
    stagger: 0.05,
    onStart: () => {
      spawnParticleBurst(endX, endY, 'attack');
      // Bàn tay mèo thụt lùi lại
      gsap.to(pawContainer, {
        scale: 0,
        opacity: 0,
        duration: 0.2,
        y: '+=50',
        ease: 'power2.in'
      });
    }
  })
  // Mờ dần vết chém
  .to(slashes, {
    opacity: 0,
    scaleY: 0.1,
    duration: 0.2,
    ease: 'power2.in'
  }, '+=0.15');

  return tl;
}

/**
 * Hiệu ứng Exploding Kitten: Bom nổ giữa màn hình
 */
export function playExplosionEffect() {
  const overlay = document.createElement('div');
  overlay.style.position = 'fixed';
  overlay.style.inset = '0';
  overlay.style.zIndex = '190';
  overlay.style.pointerEvents = 'none';
  overlay.style.overflow = 'hidden';
  document.body.appendChild(overlay);

  const startX = window.innerWidth / 2;
  const startY = window.innerHeight / 2;

  // Flash layer
  const flash = document.createElement('div');
  flash.style.position = 'absolute';
  flash.style.inset = '0';
  flash.style.backgroundColor = '#FDFCF0';
  flash.style.opacity = '0';
  overlay.appendChild(flash);

  // Nuke text
  const nuke = document.createElement('div');
  nuke.innerText = 'BOOM!';
  nuke.style.position = 'absolute';
  nuke.style.left = '50%';
  nuke.style.top = '50%';
  nuke.style.transform = 'translate(-50%, -50%) scale(0)';
  nuke.style.color = '#FF9900';
  nuke.style.fontSize = '120px';
  nuke.style.fontWeight = '900';
  nuke.style.fontFamily = 'system-ui, -apple-system, sans-serif';
  nuke.style.WebkitTextStroke = '8px #111111';
  nuke.style.textShadow = '12px 12px 0px #111111';
  overlay.appendChild(nuke);

  triggerScreenShake('heavy');

  const tl = gsap.timeline({
    onComplete: () => {
      if (overlay.parentNode) {
        overlay.parentNode.removeChild(overlay);
      }
    }
  });

  tl.to(flash, {
    opacity: 0.8,
    duration: 0.1,
    ease: 'power2.out',
    onStart: () => {
      spawnParticleBurst(startX, startY, 'attack');
      spawnParticleBurst(startX + 50, startY + 50, 'attack');
      spawnParticleBurst(startX - 50, startY - 50, 'nope');
    }
  })
  .to(nuke, {
    scale: 1.5,
    duration: 0.3,
    ease: 'back.out(2)'
  }, '<')
  .to(nuke, {
    scale: 1.8,
    opacity: 0,
    duration: 0.8,
    ease: 'power2.in'
  }, '+=0.2')
  .to(flash, {
    opacity: 0,
    duration: 0.5,
    ease: 'power2.in'
  }, '<');

  return tl;
}

/**
 * Hiệu ứng Defuse: Màn hình xanh lá, icon cờ lê sửa chữa
 */
export function playDefuseEffect(triggerEl) {
  const overlay = document.createElement('div');
  overlay.style.position = 'fixed';
  overlay.style.inset = '0';
  overlay.style.zIndex = '180';
  overlay.style.pointerEvents = 'none';
  overlay.style.overflow = 'hidden';
  document.body.appendChild(overlay);

  const startX = window.innerWidth / 2;
  const startY = window.innerHeight / 2;

  // Flash xanh lá
  const flash = document.createElement('div');
  flash.style.position = 'absolute';
  flash.style.inset = '0';
  flash.style.backgroundColor = '#00FF66';
  flash.style.opacity = '0';
  flash.style.mixBlendMode = 'multiply';
  overlay.appendChild(flash);

  // Wrench vector
  const wrench = document.createElement('div');
  wrench.style.position = 'absolute';
  wrench.style.left = '50%';
  wrench.style.top = '50%';
  wrench.style.width = '160px';
  wrench.style.height = '160px';
  wrench.style.transform = 'translate(-50%, -50%) scale(0)';
  
  wrench.innerHTML = `
    <svg viewBox="0 0 100 100" fill="none" stroke="#111111" stroke-width="4">
      <!-- Cờ lê cách điệu -->
      <path d="M75 25 L85 15 M70 30 L80 20" stroke-width="8" stroke-linecap="round"/>
      <circle cx="25" cy="75" r="15" fill="#FDFCF0"/>
      <path d="M35 65 L80 20" stroke-width="12" stroke-linecap="round"/>
      <path d="M15 85 L20 80 M10 80 L15 75" stroke-width="6" stroke-linecap="round"/>
      <circle cx="85" cy="15" r="8" fill="#FDFCF0"/>
      <path d="M80 10 L90 20 M90 10 L80 20" stroke-width="4"/>
    </svg>
  `;
  // Text "DEFUSING..."
  const text = document.createElement('div');
  text.innerText = 'DEFUSING...';
  text.style.position = 'absolute';
  text.style.left = '50%';
  text.style.top = '65%';
  text.style.transform = 'translate(-50%, -50%)';
  text.style.color = '#FDFCF0';
  text.style.fontSize = '48px';
  text.style.fontWeight = '900';
  text.style.fontFamily = 'system-ui, -apple-system, sans-serif';
  text.style.WebkitTextStroke = '4px #111111';
  text.style.opacity = '0';
  
  overlay.appendChild(wrench);
  overlay.appendChild(text);

  const tl = gsap.timeline({
    onComplete: () => {
      if (overlay.parentNode) {
        overlay.parentNode.removeChild(overlay);
      }
    }
  });

  tl.to(flash, {
    opacity: 0.3,
    duration: 0.2
  })
  .to(wrench, {
    scale: 1,
    rotation: 360,
    duration: 0.5,
    ease: 'back.out(1.5)',
    onStart: () => spawnParticleBurst(startX, startY, 'defuse')
  }, '<')
  .to(text, {
    opacity: 1,
    y: -20,
    duration: 0.3
  }, '-=0.2')
  // Wiggle Wrench
  .to(wrench, {
    rotation: '+=30',
    yoyo: true,
    repeat: 3,
    duration: 0.15,
    ease: 'power1.inOut'
  })
  .to([flash, wrench, text], {
    opacity: 0,
    scale: 0,
    duration: 0.3,
    ease: 'power2.in'
  }, '+=0.2');

  return tl;
}

/**
 * Hiệu ứng Combo 2 Mèo: 2 đầu mèo thò ra chộp thẻ bài
 */
export function playCombo2Effect(targetPlayerId) {
  const overlay = document.createElement('div');
  overlay.style.position = 'fixed';
  overlay.style.inset = '0';
  overlay.style.zIndex = '180';
  overlay.style.pointerEvents = 'none';
  overlay.style.overflow = 'hidden';
  document.body.appendChild(overlay);

  let endX = window.innerWidth / 2;
  let endY = window.innerHeight / 2 - 100;
  
  if (targetPlayerId) {
    const targetEl = document.getElementById(`player-avatar-${targetPlayerId}`) || document.getElementById('player-hand-container');
    if (targetEl) {
      const tRect = targetEl.getBoundingClientRect();
      endX = tRect.left + tRect.width / 2;
      endY = tRect.top + tRect.height / 2;
    }
  }

  // 2 Đầu mèo chui lên
  const cat1 = document.createElement('div');
  const cat2 = document.createElement('div');
  [cat1, cat2].forEach((cat, i) => {
    cat.style.position = 'absolute';
    cat.style.left = `${endX + (i===0 ? -60 : 60)}px`;
    cat.style.top = `${endY + 150}px`;
    cat.style.width = '80px';
    cat.style.height = '80px';
    cat.style.backgroundColor = i===0 ? '#FF3366' : '#00CCFF';
    cat.style.borderRadius = '40px 40px 10px 10px';
    cat.style.border = '4px solid #111111';
    
    // Ears
    const earL = document.createElement('div');
    earL.style.position = 'absolute';
    earL.style.width = '0';
    earL.style.height = '0';
    earL.style.borderLeft = '15px solid transparent';
    earL.style.borderRight = '15px solid transparent';
    earL.style.borderBottom = `25px solid ${i===0 ? '#FF3366' : '#00CCFF'}`;
    earL.style.top = '-15px';
    earL.style.left = '-5px';
    earL.style.transform = 'rotate(-15deg)';
    
    const earR = document.createElement('div');
    earR.style.position = 'absolute';
    earR.style.width = '0';
    earR.style.height = '0';
    earR.style.borderLeft = '15px solid transparent';
    earR.style.borderRight = '15px solid transparent';
    earR.style.borderBottom = `25px solid ${i===0 ? '#FF3366' : '#00CCFF'}`;
    earR.style.top = '-15px';
    earR.style.right = '-5px';
    earR.style.transform = 'rotate(15deg)';
    
    cat.appendChild(earL);
    cat.appendChild(earR);
    overlay.appendChild(cat);
  });

  const tl = gsap.timeline({
    onComplete: () => {
      if (overlay.parentNode) {
        overlay.parentNode.removeChild(overlay);
      }
    }
  });

  // Mèo ngóc đầu lên
  tl.to([cat1, cat2], {
    y: -100,
    duration: 0.4,
    ease: 'back.out(1.5)',
    stagger: 0.1
  })
  // Nghiêng đầu dòm ngó
  .to(cat1, { rotation: -15, duration: 0.2 })
  .to(cat2, { rotation: 15, duration: 0.2 }, '<')
  // Giật đồ (vươn tay ảo hoặc nhảy cẫng lên)
  .to([cat1, cat2], {
    y: -140,
    scale: 1.1,
    duration: 0.15,
    yoyo: true,
    repeat: 1
  })
  // Tụt xuống trốn
  .to([cat1, cat2], {
    y: 50,
    opacity: 0,
    duration: 0.3,
    ease: 'power2.in',
    stagger: 0.05
  }, '+=0.2');

  return tl;
}

/**
 * Hiệu ứng Combo 3 Mèo: Slot machine 3 đầu mèo thả xuống
 */
export function playCombo3Effect(targetPlayerId) {
  const overlay = document.createElement('div');
  overlay.style.position = 'fixed';
  overlay.style.inset = '0';
  overlay.style.zIndex = '180';
  overlay.style.pointerEvents = 'none';
  overlay.style.overflow = 'hidden';
  document.body.appendChild(overlay);

  // Dim background
  const dim = document.createElement('div');
  dim.style.position = 'absolute';
  dim.style.inset = '0';
  dim.style.backgroundColor = '#111111';
  dim.style.opacity = '0';
  overlay.appendChild(dim);

  const slotContainer = document.createElement('div');
  slotContainer.style.position = 'absolute';
  slotContainer.style.left = '50%';
  slotContainer.style.top = '30%';
  slotContainer.style.transform = 'translate(-50%, -50%)';
  slotContainer.style.display = 'flex';
  slotContainer.style.gap = '20px';
  overlay.appendChild(slotContainer);

  const colors = ['#FF9900', '#00FF66', '#FF00FF'];
  const cats = [];
  
  colors.forEach((color) => {
    const box = document.createElement('div');
    box.style.width = '100px';
    box.style.height = '100px';
    box.style.border = '6px solid #FDFCF0';
    box.style.backgroundColor = '#111111';
    box.style.display = 'flex';
    box.style.alignItems = 'center';
    box.style.justifyContent = 'center';
    box.style.overflow = 'hidden';
    
    const cat = document.createElement('div');
    cat.style.width = '60px';
    cat.style.height = '60px';
    cat.style.backgroundColor = color;
    cat.style.borderRadius = '30px 30px 10px 10px';
    cat.style.transform = 'translateY(-150px)'; // start above
    box.appendChild(cat);
    
    slotContainer.appendChild(box);
    cats.push(cat);
  });

  const tl = gsap.timeline({
    onComplete: () => {
      if (overlay.parentNode) {
        overlay.parentNode.removeChild(overlay);
      }
    }
  });

  tl.to(dim, { opacity: 0.6, duration: 0.3 })
  // Cats fall down like slot machine
  .to(cats, {
    y: 0,
    duration: 0.5,
    ease: 'bounce.out',
    stagger: 0.15
  })
  // Flash effect when all land
  .to(slotContainer, {
    scale: 1.1,
    boxShadow: '0 0 30px #FDFCF0',
    duration: 0.2,
    yoyo: true,
    repeat: 1
  })
  // Laser beam to target
  .to(dim, { opacity: 0, duration: 0.3, delay: 0.5 })
  .to(slotContainer, { y: '-=100', opacity: 0, duration: 0.4, ease: 'power2.in' }, '<');

  return tl;
}

/**
 * Hiệu ứng Combo 5 Mèo: Thùng rác khổng lồ rớt xuống
 */
export function playCombo5Effect() {
  const overlay = document.createElement('div');
  overlay.style.position = 'fixed';
  overlay.style.inset = '0';
  overlay.style.zIndex = '180';
  overlay.style.pointerEvents = 'none';
  overlay.style.overflow = 'hidden';
  document.body.appendChild(overlay);

  const startX = window.innerWidth / 2;
  const startY = window.innerHeight / 2;

  const trashCan = document.createElement('div');
  trashCan.style.position = 'absolute';
  trashCan.style.left = `${startX - 75}px`;
  trashCan.style.top = `${startY - 100}px`;
  trashCan.style.width = '150px';
  trashCan.style.height = '200px';
  trashCan.style.backgroundColor = '#9ca3af'; // silver
  trashCan.style.border = '8px solid #111111';
  trashCan.style.boxShadow = '10px 10px 0px #111111';
  trashCan.style.transform = 'translateY(-600px)'; // Rớt từ trên xuống
  
  // Nắp thùng rác
  const lid = document.createElement('div');
  lid.style.position = 'absolute';
  lid.style.width = '170px';
  lid.style.height = '40px';
  lid.style.backgroundColor = '#6b7280';
  lid.style.border = '8px solid #111111';
  lid.style.left = '-18px';
  lid.style.top = '-40px';
  lid.style.transformOrigin = 'left bottom';
  trashCan.appendChild(lid);

  overlay.appendChild(trashCan);

  const tl = gsap.timeline({
    onComplete: () => {
      if (overlay.parentNode) {
        overlay.parentNode.removeChild(overlay);
      }
    }
  });

  tl.to(trashCan, {
    y: 0,
    duration: 0.6,
    ease: 'bounce.out',
    onStart: () => {
      setTimeout(() => triggerScreenShake('heavy'), 400);
    }
  })
  // Mở nắp thùng rác
  .to(lid, {
    rotation: -110,
    duration: 0.3,
    ease: 'power2.out',
    onStart: () => {
      spawnParticleBurst(startX, startY - 50, 'catomic');
    }
  })
  // Một lá bài chói sáng bay ra từ thùng rác
  .to(trashCan, {
    scale: 1.1,
    yoyo: true,
    repeat: 1,
    duration: 0.15
  }, '+=0.2')
  .to(trashCan, {
    y: '+=500',
    rotation: 45,
    opacity: 0,
    duration: 0.5,
    ease: 'power2.in'
  }, '+=0.5');

  return tl;
}
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
  document.body.appendChild(overlay);

  const arrow = document.createElement('div');
  arrow.innerText = '>>';
  arrow.style.position = 'absolute';
  arrow.style.left = \\px\;
  arrow.style.top = \\px\;
  arrow.style.width = '300px';
  arrow.style.height = '300px';
  arrow.style.color = '#00BFFF'; // pop-cyan
  arrow.style.display = 'flex';
  arrow.style.alignItems = 'center';
  arrow.style.justifyContent = 'center';
  arrow.style.fontSize = '200px';
  arrow.style.fontWeight = '900';
  arrow.style.fontFamily = 'system-ui, -apple-system, sans-serif';
  arrow.style.WebkitTextStroke = '12px #111111';
  arrow.style.textShadow = '8px 8px 0px #111111';
  arrow.style.transform = 'scale(0)';

  overlay.appendChild(arrow);

  const tl = gsap.timeline({
    onComplete: () => {
      if (overlay.parentNode) {
        overlay.parentNode.removeChild(overlay);
      }
    }
  });

  tl.to(arrow, {
    scale: 1,
    rotation: 15,
    duration: 0.4,
    ease: 'back.out(1.5)',
    onStart: () => {
      triggerScreenShake('light');
    }
  })
  .to(arrow, {
    scale: 1.2,
    duration: 0.2,
    yoyo: true,
    repeat: 1,
    ease: 'power1.inOut'
  })
  .to(arrow, {
    x: window.innerWidth,
    opacity: 0,
    duration: 0.4,
    ease: 'power2.in'
  }, '+=0.2');

  return tl;
}

export function playFavorEffect(targetPlayerId) {
  let endX = window.innerWidth / 2;
  let endY = window.innerHeight / 2;
  
  if (targetPlayerId) {
    const targetEl = document.getElementById(\player-avatar-\\) || document.getElementById('player-hand-container');
    if (targetEl) {
      const tRect = targetEl.getBoundingClientRect();
      endX = tRect.left + tRect.width / 2;
      endY = tRect.top + tRect.height / 2;
    }
  }

  const overlay = document.createElement('div');
  overlay.style.position = 'fixed';
  overlay.style.inset = '0';
  overlay.style.zIndex = '180';
  overlay.style.pointerEvents = 'none';
  overlay.style.overflow = 'hidden';
  document.body.appendChild(overlay);

  // Arm container
  const armContainer = document.createElement('div');
  armContainer.style.position = 'absolute';
  armContainer.style.left = \\px\;
  armContainer.style.top = \\px\;
  armContainer.style.transform = 'translate(-50%, -50%)';
  armContainer.style.display = 'flex';
  armContainer.style.alignItems = 'center';
  armContainer.style.justifyContent = 'center';
  overlay.appendChild(armContainer);

  // Cat arm side view with plate
  const svgNS = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(svgNS, "svg");
  svg.setAttribute("viewBox", "0 0 200 200");
  svg.style.width = '240px';
  svg.style.height = '240px';
  svg.style.transform = 'translateX(-300px)'; // Start off-screen
  
  // Draw cat arm
  const arm = document.createElementNS(svgNS, "path");
  arm.setAttribute("d", "M -50 120 Q 50 120 120 100 Q 140 90 150 70 Q 140 60 120 60 Q 50 80 -50 80 Z");
  arm.setAttribute("fill", "#FF9900");
  arm.setAttribute("stroke", "#111111");
  arm.setAttribute("stroke-width", "6");
  
  // Draw plate
  const plate = document.createElementNS(svgNS, "ellipse");
  plate.setAttribute("cx", "140");
  plate.setAttribute("cy", "65");
  plate.setAttribute("rx", "40");
  plate.setAttribute("ry", "15");
  plate.setAttribute("fill", "#FDFCF0");
  plate.setAttribute("stroke", "#111111");
  plate.setAttribute("stroke-width", "6");
  
  // Draw inner plate line
  const innerPlate = document.createElementNS(svgNS, "ellipse");
  innerPlate.setAttribute("cx", "140");
  innerPlate.setAttribute("cy", "65");
  innerPlate.setAttribute("rx", "25");
  innerPlate.setAttribute("ry", "8");
  innerPlate.setAttribute("fill", "none");
  innerPlate.setAttribute("stroke", "#111111");
  innerPlate.setAttribute("stroke-width", "3");
  innerPlate.setAttribute("opacity", "0.3");

  svg.appendChild(arm);
  svg.appendChild(plate);
  svg.appendChild(innerPlate);
  armContainer.appendChild(svg);

  const tl = gsap.timeline({
    onComplete: () => {
      if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
    }
  });

  tl.to(svg, {
    x: 0,
    duration: 0.5,
    ease: 'back.out(1.2)'
  })
  .to(svg, {
    y: '-=10',
    duration: 0.3,
    yoyo: true,
    repeat: 3,
    ease: 'sine.inOut'
  })
  .to(svg, {
    x: 300,
    opacity: 0,
    duration: 0.4,
    ease: 'power2.in'
  });

  return tl;
}

export function playReverseEffect() {
  const overlay = document.createElement('div');
  overlay.style.position = 'fixed';
  overlay.style.inset = '0';
  overlay.style.zIndex = '180';
  overlay.style.pointerEvents = 'none';
  overlay.style.display = 'flex';
  overlay.style.alignItems = 'center';
  overlay.style.justifyContent = 'center';
  document.body.appendChild(overlay);

  const svgNS = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(svgNS, "svg");
  svg.setAttribute("viewBox", "0 0 200 200");
  svg.style.width = '300px';
  svg.style.height = '300px';
  svg.style.transform = 'scale(0)';

  // UNO Reverse Arrows (Green)
  const arrow1 = document.createElementNS(svgNS, "path");
  arrow1.setAttribute("d", "M 100 20 A 80 80 0 0 1 180 100 L 160 100 L 190 140 L 220 100 L 200 100 A 100 100 0 0 0 100 0 Z");
  arrow1.setAttribute("fill", "#00FF00"); // Green
  arrow1.setAttribute("stroke", "#111111");
  arrow1.setAttribute("stroke-width", "4");

  const arrow2 = document.createElementNS(svgNS, "path");
  arrow2.setAttribute("d", "M 100 180 A 80 80 0 0 1 20 100 L 40 100 L 10 60 L -20 100 L 0 100 A 100 100 0 0 0 100 200 Z");
  arrow2.setAttribute("fill", "#00FF00"); // Green
  arrow2.setAttribute("stroke", "#111111");
  arrow2.setAttribute("stroke-width", "4");

  svg.appendChild(arrow1);
  svg.appendChild(arrow2);
  overlay.appendChild(svg);

  const tl = gsap.timeline({
    onComplete: () => {
      if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
    }
  });

  tl.to(svg, {
    scale: 1,
    rotation: 180,
    duration: 0.5,
    ease: 'back.out(1.5)',
    onStart: () => triggerScreenShake('light')
  })
  .to(svg, {
    rotation: "+=360",
    duration: 0.8,
    ease: 'power2.inOut'
  })
  .to(svg, {
    scale: 0,
    opacity: 0,
    duration: 0.3,
    ease: 'power2.in'
  });

  return tl;
}
