import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

declare const process: { env: Record<string, string | undefined> };

// Study Paws uses hash routing (#/study, #/room/abc…), so a relative base
// works on GitHub Pages for any repository name with zero extra config.
// Override with VITE_BASE=/my-repo/ if you ever need an absolute base.
export default defineConfig({
  base: process.env.VITE_BASE ?? './',
  plugins: [react()],
  build: {
    target: ['es2020', 'safari14'],
    chunkSizeWarningLimit: 700,
  },
});
