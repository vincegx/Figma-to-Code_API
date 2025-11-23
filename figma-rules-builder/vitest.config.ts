import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './__tests__/setup.ts',
    exclude: ['**/*.e2e.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}', '**/__tests__/e2e/**', 'node_modules/**'],
  },
});
