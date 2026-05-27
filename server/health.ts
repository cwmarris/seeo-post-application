import type { IncomingMessage } from 'node:http';
import type { ServerResponse } from 'node:http';
import { diagnoseOpenAIKey, normalizeApiKey, type OpenAIKeyStatus } from './openaiEnv.js';

export type HealthResponse = {
  ok: boolean;
  timestamp: string;
  version: string;
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
};

export function buildHealthResponse(
  apiKeyRaw?: string,
  options?: BuildHealthResponseOptions
): HealthResponse {
  const openai = diagnoseOpenAIKey(apiKeyRaw ?? process.env.OPENAI_API_KEY, options);
  const warnings: string[] = [];
  if (!openai.configured) warnings.push(openai.message);

  return {
    ok: true,
    timestamp: new Date().toISOString(),
    version: resolveVersion(),
    openai,
    ...(warnings.length ? { warnings } : {}),
  };
}

export function createHealthMiddleware(
  getApiKey: () => string = () => normalizeApiKey(process.env.OPENAI_API_KEY)
): (
  req: IncomingMessage,
  res: ServerResponse,
  next: () => void
) => void {
  return (req, res, next) => {
    const path = req.url?.split('?')[0];
    if (path !== '/api/health' || req.method !== 'GET') {
      next();
      return;
    }

    const payload = buildHealthResponse(getApiKey(), { localDev: true });
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(payload));
  };
}
