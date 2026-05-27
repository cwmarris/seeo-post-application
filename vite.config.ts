/// <reference types="vitest/config" />
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { createOpenAIImageMiddleware } from './server/openaiImages'
import { createOpenAIDraftMiddleware } from './server/openaiDraft'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [
      react(),
      {
        name: 'openai-images-dev-proxy',
        configureServer(server) {
          const middleware = createOpenAIImageMiddleware(
            () => env.OPENAI_API_KEY || process.env.OPENAI_API_KEY,
            () => env.OPENAI_IMAGE_MODEL || process.env.OPENAI_IMAGE_MODEL || 'gpt-image-1'
          )
          server.middlewares.use(middleware)
          server.middlewares.use(
            createOpenAIDraftMiddleware(
              () => env.OPENAI_API_KEY || process.env.OPENAI_API_KEY,
              () => env.OPENAI_DRAFT_MODEL || process.env.OPENAI_DRAFT_MODEL || 'gpt-4o-mini'
            )
          )
        },
      },
    ],
    test: {
      environment: 'jsdom',
      setupFiles: ['./src/test/setup.ts'],
      css: true,
      restoreMocks: true,
      clearMocks: true,
    },
  }
})
