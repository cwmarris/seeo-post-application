import type { IncomingMessage } from 'node:http';
import type { ServerResponse } from 'node:http';
import { diagnoseOpenAIKey, normalizeApiKey, type OpenAIKeyStatus } from './openaiEnv.js';
import {
  resolveDraftModel,
  resolveGroundedImageModel,
  resolveImageModel,
} from './openaiModels.js';

export type HealthResponse = {
  ok: boolean;
  timestamp: string;
  version: string;
  /** Resolved Chat model for draft generate/improve (env or default). */
  draftModel: string;
  /** Resolved OpenAI Images API model slug. */
  imageModel: string;
  /** Resolved vision model for grounded image extraction. */
  groundedImageModel: string;
  warnings?: string[];
  openai: {
    configured: boolean;
    status: OpenAIKeyStatus;
    message: string;
  };
};

function resolveVersion(): string {
  const sha =
    process.env.VERCEL_GIT_COMMIT_SHA ??
    process.env.VERCEL_GIT_COMMIT_REF ??
    process.env.VERCEL_DEPLOYMENT_ID;
  if (sha) return sha;
  return process.env.npm_package_version ?? 'dev';
}

export type BuildHealthResponseOptions = {
  /** Vite dev middleware: use loadEnv key and allow .env-file hints. */
  localDev?: boolean;
  draftModelEnv?: string;
  imageModelEnv?: string;
  groundedImageModelEnv?: string;
};

export function buildHealthResponse(
  apiKeyRaw?: string,
  options?: BuildHealthResponseOptions
): HealthResponse {
  const openai = diagnoseOpenAIKey(apiKeyRaw ?? process.env.OPENAI_API_KEY, options);
  const warnings: string[] = [];
  if (!openai.configured) warnings.push(openai.message);

  const draftModelEnv = options?.draftModelEnv ?? process.env.OPENAI_DRAFT_MODEL;
  const imageModelEnv = options?.imageModelEnv ?? process.env.OPENAI_IMAGE_MODEL;
  const groundedImageModelEnv =
    options?.groundedImageModelEnv ?? process.env.OPENAI_GROUNDED_IMAGE_MODEL;

  return {
    ok: true,
    timestamp: new Date().toISOString(),
    version: resolveVersion(),
    draftModel: resolveDraftModel(draftModelEnv),
    imageModel: resolveImageModel(imageModelEnv),
    groundedImageModel: resolveGroundedImageModel(
      groundedImageModelEnv,
      draftModelEnv
    ),
    openai,
    ...(warnings.length ? { warnings } : {}),
  };
}

export type HealthEnvReaders = {
  getApiKey?: () => string;
  getDraftModelEnv?: () => string | undefined;
  getImageModelEnv?: () => string | undefined;
  getGroundedImageModelEnv?: () => string | undefined;
};

export function createHealthMiddleware(
  readers: HealthEnvReaders | (() => string) = {}
): (
  req: IncomingMessage,
  res: ServerResponse,
  next: () => void
) => void {
  const resolved: HealthEnvReaders =
    typeof readers === 'function' ? { getApiKey: readers } : readers;

  return (req, res, next) => {
    const path = req.url?.split('?')[0];
    if (path !== '/api/health' || req.method !== 'GET') {
      next();
      return;
    }

    const payload = buildHealthResponse(
      resolved.getApiKey?.() ?? normalizeApiKey(process.env.OPENAI_API_KEY),
      {
        localDev: true,
        draftModelEnv: resolved.getDraftModelEnv?.(),
        imageModelEnv: resolved.getImageModelEnv?.(),
        groundedImageModelEnv: resolved.getGroundedImageModelEnv?.(),
      }
    );
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(payload));
  };
}
