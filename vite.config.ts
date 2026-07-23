import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],

  build: {
    // Default is 4096 (4KB). Anything under this gets base64-inlined into the
    // CSS/JS bundle, which blocks render. Only inline genuinely tiny assets.
    assetsInlineLimit: 1024,

    // Vite defaults to esbuild for minify, which is fine, but bumping the
    // target avoids shipping transpiled async/generator helpers to browsers
    // that have supported them natively for years.
    target: 'es2020',

    cssCodeSplit: true,
    sourcemap: false,

    rollupOptions: {
      output: {
        // Split vendor code so a content-only change does not invalidate the
        // GSAP chunk in every visitor's cache.
        manualChunks: {
          react: ['react', 'react-dom', 'react-router-dom'],
          gsap: ['gsap', 'gsap/ScrollTrigger', 'gsap/SplitText', '@gsap/react'],
          scroll: ['lenis'],
          sanity: ['@sanity/client', '@sanity/image-url'],
        },
      },
    },

    // Fail loudly if a chunk balloons again.
    chunkSizeWarningLimit: 300,
  },
});
