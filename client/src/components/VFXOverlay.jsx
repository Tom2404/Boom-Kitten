import React, { useEffect, useRef } from 'react';
import { vfxManager } from '../vfx/VFXManager';
import '../vfx/CardAnimations'; // Chạy code register các animation
import '../vfx/EnvironmentFX'; // Đăng ký hiệu ứng môi trường

export const VFXOverlay = () => {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (canvasRef.current) {
      vfxManager.init(canvasRef.current);
    }

    return () => {
      // Tùy chọn: Có thể không destroy để tái sử dụng, nhưng cleanup là best practice
      vfxManager.destroy();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        pointerEvents: 'none', // Xuyên click xuống React Layer
        zIndex: 9999, // Phủ lên tất cả (tùy thuộc vào z-index của React)
      }}
    />
  );
};
