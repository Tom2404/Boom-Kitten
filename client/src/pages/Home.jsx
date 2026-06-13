import React, { useEffect, useRef } from 'react';

export default function Home({ setPage }) {
  const canvasRef = useRef(null);

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

  const handleStartPlay = () => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      setPage('Game');
    } else {
      setPage('Login');
    }
  };

  return (
    <div className="flex flex-col gap-16">
      {/* Hero Section */}
      <section className="relative min-h-[70vh] flex items-center justify-center overflow-hidden border-4 border-on-surface rounded-3xl shadow-[8px_8px_0px_0px_#1a1c1c] bg-[#1a1c1c]">
        {/* Animated Background Canvas */}
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full z-0 opacity-80"
        />

        <div className="relative z-10 w-full max-w-5xl mx-auto px-6 py-12 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div className="flex flex-col items-start gap-6">
            <div className="chip-warning bg-secondary text-on-error px-4 py-1.5 rounded-xl border-3 border-on-surface font-headline font-black uppercase shadow-[3px_3px_0px_0px_#1a1c1c] text-xs">
              Cảnh Báo: Gây Nghiện Cực Mạnh!
            </div>
            
            <h1 className="font-headline text-3xl md:text-5xl text-on-surface uppercase leading-tight bg-white p-6 border-4 border-on-surface shadow-[6px_6px_0px_0px_#1a1c1c] transform -rotate-1">
              Trò chơi bài mèo nổ kịch tính và hỗn loạn
            </h1>
            
            <p className="font-sans font-bold text-sm md:text-base text-on-surface-variant bg-white/95 p-5 border-3 border-on-surface shadow-[4px_4px_0px_0px_#1a1c1c] rounded-xl leading-relaxed">
              Giống như bài Uno, ngoại trừ việc có dê con, bánh enchilada thần kỳ và những chú mèo có thể nổ tung giết chết bạn bất cứ lúc nào!
            </p>
            
            <button
              onClick={handleStartPlay}
              className="btn-detonator px-8 py-4 rounded-2xl font-headline font-black text-xl md:text-2xl uppercase mt-4 flex items-center gap-2"
            >
              Chơi Ngay 💣
              <span className="material-symbols-outlined text-2xl">local_fire_department</span>
            </button>
          </div>

          <div className="relative flex justify-center items-center">
            <div className="absolute inset-0 bg-primary-container rounded-full blur-3xl opacity-30 scale-150 animate-pulse"></div>
            <div className="flex gap-4 relative">
              <img src="/src/assets/cards/exploding_kitten.png" alt="Exploding Kitten" className="w-36 h-48 object-contain transform -rotate-12 hover:-rotate-6 transition-transform duration-300 drop-shadow-[4px_4px_0px_#1a1c1c] border-3 border-on-surface rounded-2xl p-1 bg-rose-500" />
              <img src="/src/assets/cards/defuse.png" alt="Defuse" className="w-36 h-48 object-contain transform rotate-12 hover:rotate-6 transition-transform duration-300 drop-shadow-[4px_4px_0px_#1a1c1c] border-3 border-on-surface rounded-2xl p-1 bg-emerald-500 -ml-12 mt-6" />
            </div>
          </div>
        </div>
      </section>

      {/* Quick Intro Steps */}
      <section className="py-12 relative">
        <div className="text-center mb-16">
          <h2 className="font-headline text-3xl md:text-4xl text-on-surface uppercase inline-block bg-yellow-400 px-8 py-3 border-4 border-on-surface shadow-[6px_6px_0px_0px_#1a1c1c] transform rotate-1">
            Cách Chơi Đơn Giản
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 max-w-5xl mx-auto px-4">
          {/* Step 1 */}
          <div className="card-brutalist bg-white p-8 flex flex-col items-center text-center relative group rounded-2xl">
            <div className="absolute -top-6 -left-6 bg-secondary text-on-error w-12 h-12 flex items-center justify-center rounded-full font-headline font-black text-xl border-3 border-on-surface z-10 group-hover:scale-110 transition-transform">
              1
            </div>
            <div className="w-24 h-24 bg-primary-fixed border-3 border-on-surface rounded-2xl flex items-center justify-center mb-6 group-hover:-translate-y-2 group-hover:rotate-6 transition-all duration-300 p-2">
              <img src="/src/assets/cards/see_the_future_3.png" alt="Tiên Tri" className="h-full w-full object-contain" />
            </div>
            <h3 className="font-headline font-black text-lg uppercase mb-2">Bốc Một Lá Bài</h3>
            <p className="font-sans text-sm text-on-surface-variant font-bold">
              Rút bài từ xấp bài bốc chung ở giữa bàn. Hy vọng nó không phải là mèo nổ.
            </p>
          </div>

          {/* Step 2 */}
          <div className="card-brutalist bg-white p-8 flex flex-col items-center text-center relative group rounded-2xl md:translate-y-4">
            <div className="absolute -top-6 -left-6 bg-primary text-on-primary w-12 h-12 flex items-center justify-center rounded-full font-headline font-black text-xl border-3 border-on-surface z-10 group-hover:scale-110 transition-transform">
              2
            </div>
            <div className="w-24 h-24 bg-error-container border-3 border-on-surface rounded-2xl flex items-center justify-center mb-6 group-hover:-translate-y-2 group-hover:-rotate-6 transition-all duration-300 p-2">
              <img src="/src/assets/cards/exploding_kitten.png" alt="Mèo Nổ" className="h-full w-full object-contain" />
            </div>
            <h3 className="font-headline font-black text-lg uppercase mb-2">Đừng Để Bị Nổ</h3>
            <p className="font-sans text-sm text-on-surface-variant font-bold">
              Nếu bạn bốc trúng thẻ Mèo Nổ, bạn sẽ bị loại ngay lập tức trừ khi có thẻ Gỡ Mìn.
            </p>
          </div>

          {/* Step 3 */}
          <div className="card-brutalist bg-white p-8 flex flex-col items-center text-center relative group rounded-2xl">
            <div className="absolute -top-6 -left-6 bg-yellow-400 text-slate-950 w-12 h-12 flex items-center justify-center rounded-full font-headline font-black text-xl border-3 border-on-surface z-10 group-hover:scale-110 transition-transform">
              3
            </div>
            <div className="w-24 h-24 bg-indigo-100 border-3 border-on-surface rounded-2xl flex items-center justify-center mb-6 group-hover:-translate-y-2 group-hover:rotate-12 transition-all duration-300 p-2">
              <img src="/src/assets/cards/attack_2x.png" alt="Tấn Công" className="h-full w-full object-contain" />
            </div>
            <h3 className="font-headline font-black text-lg uppercase mb-2">Hãm Hại Bạn Bè</h3>
            <p className="font-sans text-sm text-on-surface-variant font-bold">
              Sử dụng các thẻ bài Tấn công, Tiên tri, Xin xỏ để né lượt và đẩy bom cho đối thủ!
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
