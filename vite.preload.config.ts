import { defineConfig } from 'vite';
import { builtinModules } from 'module';

export default defineConfig({
  build: {
    outDir: 'dist/preload',
    lib: { entry: 'src/preload/index.ts', formats: ['cjs'], fileName: () => 'index.js' },
    rollupOptions: { external: ['electron', ...builtinModules] },
    minify: false,
    sourcemap: true,
    emptyOutDir: true,
  },
  resolve: {
    alias: { '@': '/src' },
  },
});
