/**
 * Server-side OpenAI Images API proxy handler.
 * Used by the Vite dev middleware; deploy the same contract behind /api/openai/images in production.
 */

import { diagnoseOpenAIKey, normalizeApiKey, openAIKeyErrorMessage } from './openaiEnv.js';

export interface OpenAIImageGenerateBody {
  prompt: string;
  style?: string;
  guidance?: string;
}

export interface OpenAIImageGenerateResult {
  imageDataUrl: string;
  model: string;
  revisedPrompt?: string;
}

const OPENAI_IMAGES_URL = 'https://api.openai.com/v1/images/generations';

const STYLE_PREFIX: Record<string, string> = {
  editorial:
    'Professional industrial editorial photograph for LinkedIn, realistic lighting, seeo.ai workplace safety brand (safety green accents on obsidian): ',
  vector:
    'Minimalist flat vector graphic for B2B SaaS, clean lines, safety green and obsidian palette, seeo.ai branding: ',
  gradient:
    'Abstract neon gradient hero graphic, geometric nodes, safety green and deep obsidian, modern seeo.ai aesthetic: ',
};

export function buildImagePrompt(
  corePrompt: string,
  styleId: string,
  guidance?: string
): string {
  const prefix = STYLE_PREFIX[styleId] ?? STYLE_PREFIX.editorial;
  const base = `${prefix}${corePrompt.trim()}`;
  if (!guidance?.trim()) return base;
  return `${base}\n\nRefinement instructions: ${guidance.trim()}`;
}

function readJsonBody(req: import('node:http').IncomingMessage): Promise<unknown> {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', (chunk: Buffer | string) => {
      data += chunk.toString();
    });
    req.on('end', () => {
      try {
        resolve(data ? JSON.parse(data) : {});
      } catch {
        reject(new Error('Invalid JSON body'));
      }
    });
    req.on('error', reject);
  });
}

export async function handleOpenAIImageGenerate(
  req: import('node:http').IncomingMessage,
  apiKey: string,
  model: string
): Promise<{ status: number; body: OpenAIImageGenerateResult | { error: string } }> {
  const key = normalizeApiKey(apiKey);
  if (!key) {
    const diag = diagnoseOpenAIKey(apiKey);
    return {
      status: 503,
      body: {
        error: openAIKeyErrorMessage(
          diag,
          'Image generation requires a server-side key.'
        ),
      },
    };
  }

  let parsed: OpenAIImageGenerateBody;
  try {
    const raw = (await readJsonBody(req)) as OpenAIImageGenerateBody;
    if (!raw?.prompt || typeof raw.prompt !== 'string') {
      return { status: 400, body: { error: 'Missing prompt' } };
    }
    parsed = raw;
  } catch {
    return { status: 400, body: { error: 'Invalid request body' } };
  }

  const fullPrompt = buildImagePrompt(
    parsed.prompt,
    parsed.style ?? 'editorial',
    parsed.guidance
  );

  const response = await fetch(OPENAI_IMAGES_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      prompt: fullPrompt,
      n: 1,
      size: '1536x1024',
      quality: 'medium',
    }),
  });

  const payload = (await response.json()) as {
    error?: { message?: string };
    data?: Array<{ b64_json?: string; url?: string; revised_prompt?: string }>;
  };

  if (!response.ok) {
    return {
      status: response.status,
      body: {
        error: payload.error?.message ?? `OpenAI Images API error (${response.status})`,
      },
    };
  }

  const first = payload.data?.[0];
  let imageDataUrl: string | undefined;

  if (first?.b64_json) {
    imageDataUrl = `data:image/png;base64,${first.b64_json}`;
  } else if (first?.url) {
    imageDataUrl = first.url;
  }

  if (!imageDataUrl) {
    return { status: 502, body: { error: 'No image data returned from OpenAI' } };
  }

  return {
    status: 200,
    body: {
      imageDataUrl,
      model,
      revisedPrompt: first?.revised_prompt,
    },
  };
}

export function createOpenAIImageMiddleware(
  getApiKey: () => string | undefined,
  getModel: () => string
): (
  req: import('node:http').IncomingMessage,
  res: import('node:http').ServerResponse,
  next: () => void
) => void {
  return (req, res, next) => {
    const path = req.url?.split('?')[0];
    if (path !== '/api/openai/images' || req.method !== 'POST') {
      next();
      return;
    }

    void (async () => {
      try {
        const result = await handleOpenAIImageGenerate(
          req,
          getApiKey() ?? '',
          getModel()
        );
        res.statusCode = result.status;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify(result.body));
      } catch (err) {
        res.statusCode = 500;
        res.setHeader('Content-Type', 'application/json');
        res.end(
          JSON.stringify({
            error: err instanceof Error ? err.message : 'Image generation failed',
          })
        );
      }
    })();
  };
}
