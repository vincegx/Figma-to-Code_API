import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  // Note: @vitejs/plugin-react removed to fix Next.js TypeScript compilation conflicts
  // The plugin caused TS errors when Next.js tried to type-check vitest.config.ts
  // Vitest works correctly without the plugin for our test setup
  plugins: [],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
    },
  },
})
