// Production-specific build script for Netlify
import { build } from 'vite';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// Netlify-optimized Vite config
const netlifyConfig = defineConfig({
  plugins: [react()], // Only essential plugins for production
  resolve: {
    alias: {
      "@": path.resolve(process.cwd(), "client", "src"),
      "@shared": path.resolve(process.cwd(), "shared"),
      "@assets": path.resolve(process.cwd(), "attached_assets"),
    },
  },
  root: path.resolve(process.cwd(), "client"),
  build: {
    outDir: path.resolve(process.cwd(), "dist"),
    emptyOutDir: true,
    sourcemap: false,
    minify: true,
    target: 'es2020',
  },
});

// Build for production
await build(netlifyConfig);
console.log('✅ Build completed for Netlify deployment');