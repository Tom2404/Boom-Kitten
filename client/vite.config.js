// Vite config for the React frontend app.
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: { port: 2404 },
  build: {
    // Pixi is isolated in its own lazy-loaded vendor chunk. Its minified size is
    // expected to exceed Vite's generic 500 kB warning threshold, while gzip is
    // substantially smaller and the game code stays out of the initial bundle.
    chunkSizeWarningLimit: 900,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined;
          if (id.includes('@pixi') || id.includes('pixi.js')) return 'vendor-pixi';
          if (id.includes('gsap')) return 'vendor-gsap';
          if (id.includes('framer-motion')) return 'vendor-motion';
          if (id.includes('socket.io-client')) return 'vendor-socket';
          if (id.includes('react') || id.includes('react-dom')) return 'vendor-react';
          return undefined;
        },
      },
    },
  },
});
