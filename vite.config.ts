/// <reference types="vitest/config" />
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { createOpenAIImageMiddleware } from './server/openaiImages'
import { createGroundedImageMiddleware } from './server/openaiGroundedImage'
import { createOpenAIDraftMiddleware } from './server/openaiDraft'
import { createHealthMiddleware } from './server/health'
import { createLinkedInMiddleware } from './server/linkedinHandlers'
import { normalizeApiKey } from './server/openaiEnv'
import {
  DEFAULT_GROUNDED_IMAGE_MODEL,
  resolveGroundedImageModel,
} from './server/openaiModels'

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
            env.OPENAI_IMAGE_MODEL || process.env.OPENAI_IMAGE_MODEL || 'gpt-image-2'
          const getEnvDraftModel = () =>
            env.OPENAI_DRAFT_MODEL || process.env.OPENAI_DRAFT_MODEL
          const getEnvGroundedImageModel = () =>
            env.OPENAI_GROUNDED_IMAGE_MODEL || process.env.OPENAI_GROUNDED_IMAGE_MODEL

          server.middlewares.use(
            createHealthMiddleware({
              getApiKey,
              getDraftModelEnv: getEnvDraftModel,
              getImageModelEnv: getImageModel,
              getGroundedImageModelEnv: getEnvGroundedImageModel,
            })
          )
          server.middlewares.use(createOpenAIImageMiddleware(getApiKey, getImageModel))
          server.middlewares.use(
            createGroundedImageMiddleware(getApiKey, () =>
              resolveGroundedImageModel(
                getEnvGroundedImageModel(),
                getEnvDraftModel(),
                undefined
              ) || DEFAULT_GROUNDED_IMAGE_MODEL
            )
          )
          server.middlewares.use(createOpenAIDraftMiddleware(getApiKey, getEnvDraftModel))
          server.middlewares.use(createLinkedInMiddleware())
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
