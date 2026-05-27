import type { IncomingMessage } from 'node:http';
import type { ServerResponse } from 'node:http';

export type HealthResponse = {
  ok: boolean;
  timestamp: string;
  version: string;
  warnings?: string[];
};

function resolveVersion(): string {
  const sha =
    process.env.VERCEL_GIT_COMMIT_SHA ??
    process.env.VERCEL_GIT_COMMIT_REF ??
    process.env.VERCEL_DEPLOYMENT_ID;
  if (sha) return sha;
  return process.env.npm_package_version ?? 'dev';
}

export function buildHealthResponse(): HealthResponse {
  const warnings: string[] = [];
  if (!process.env.OPENAI_API_KEY) warnings.push('OPENAI_API_KEY is not set');

  return {
    ok: true,
    timestamp: new Date().toISOString(),
    version: resolveVersion(),
    ...(warnings.length ? { warnings } : {}),
  };
}

export function createHealthMiddleware(): (
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

    const payload = buildHealthResponse();
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(payload));
  };
}

