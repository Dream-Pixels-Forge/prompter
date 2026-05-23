import { defineConfig } from 'vite';
import { builtinModules } from 'module';

export default defineConfig({
  build: {
    outDir: 'dist/main',
    lib: { entry: 'src/main/main.ts', formats: ['es'], fileName: () => 'main.js' },
    rollupOptions: { external: ['electron', ...builtinModules] },
    minify: false,
    sourcemap: true,
    emptyOutDir: true,
  },
  resolve: {
    alias: { '@': '/src' },
  },
});
