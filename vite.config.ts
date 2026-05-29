import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import electron from 'vite-plugin-electron';
import renderer from 'vite-plugin-electron-renderer';
import path from 'path';

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    electron([
      {
        entry: 'src/main/main.ts',
        vite: {
          build: {
            outDir: 'dist/main',
            rollupOptions: {
              external: ['electron'],
            },
            minify: 'esbuild',
            sourcemap: process.env.NODE_ENV !== 'production',
            emptyOutDir: true,
          },
          resolve: {
            alias: { '@': path.resolve(__dirname, 'src') },
          },
        },
      },
      {
        entry: 'src/preload/index.ts',
        onstart(args) {
          args.reload();
        },
        vite: {
          build: {
            outDir: 'dist/preload',
            rollupOptions: {
              external: ['electron'],
            },
            minify: 'esbuild',
            sourcemap: process.env.NODE_ENV !== 'production',
            emptyOutDir: true,
          },
          resolve: {
            alias: { '@': path.resolve(__dirname, 'src') },
          },
        },
      },
    ]),
    renderer(),
  ],
  base: './',
  build: {
    outDir: 'dist/renderer',
    emptyOutDir: true,
    sourcemap: process.env.NODE_ENV !== 'production',
    rollupOptions: {
      input: 'index.html',
    },
  },
  resolve: {
    alias: { '@': path.resolve(__dirname, 'src') },
  },
});
