/// <reference types="vitest/config" />
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { createOpenAIImageMiddleware } from './server/openaiImages'
import { createOpenAIDraftMiddleware } from './server/openaiDraft'
import { createHealthMiddleware } from './server/health'
import { normalizeApiKey } from './server/openaiEnv'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  return {
    plugins: [
      react(),
      {
        name: 'openai-images-dev-proxy',
        configureServer(server) {
          const env = loadEnv(mode, server.config.envDir || process.cwd(), '')
          const getApiKey = () =>
            normalizeApiKey(env.OPENAI_API_KEY ?? process.env.OPENAI_API_KEY)
          const getImageModel = () =>
            env.OPENAI_IMAGE_MODEL || process.env.OPENAI_IMAGE_MODEL || 'gpt-image-1'
          const getDraftModel = () =>
            env.OPENAI_DRAFT_MODEL || process.env.OPENAI_DRAFT_MODEL || 'gpt-4o-mini'

          server.middlewares.use(createHealthMiddleware(getApiKey))
          server.middlewares.use(createOpenAIImageMiddleware(getApiKey, getImageModel))
          server.middlewares.use(createOpenAIDraftMiddleware(getApiKey, getDraftModel))
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
