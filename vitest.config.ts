import { defineConfig } from 'vitest/config'
import { fileURLToPath, URL } from 'url'
import viteTsConfigPaths from 'vite-tsconfig-paths'

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  plugins: [
    viteTsConfigPaths({
      projects: ['./tsconfig.json'],
    }),
  ],
})
