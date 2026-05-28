/**
 * OpenAI Vision proxy for grounded context image uploads.
 * Dev: Vite middleware at /api/openai/grounded-image. Prod: Vercel serverless route.
 */

import { diagnoseOpenAIKey, normalizeApiKey, openAIKeyErrorMessage } from './openaiEnv.js';

export interface GroundedImageBody {
  fileName: string;
  mimeType: string;
  /** data URL or raw base64 with optional data: prefix */
  imageBase64: string;
}

export interface GroundedImageResult {
  textContent: string;
  model: string;
}

const OPENAI_CHAT_URL = 'https://api.openai.com/v1/chat/completions';

const VISION_PROMPT =
  'Describe this image for use as grounded context in workplace safety communications. ' +
  'Extract all visible text (signage, labels, documents). Describe people, equipment, hazards, ' +
  'and the environment factually and concisely. If there is no readable content, say so briefly.';

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

function toDataUrl(mimeType: string, imageBase64: string): string {
  const trimmed = imageBase64.trim();
  if (trimmed.startsWith('data:')) return trimmed;
  const mime = mimeType.trim().toLowerCase() || 'image/jpeg';
  return `data:${mime};base64,${trimmed}`;
}

export async function handleGroundedImageBody(
  body: GroundedImageBody,
  apiKey: string,
  model: string
): Promise<{ status: number; body: GroundedImageResult | { error: string } }> {
  const key = normalizeApiKey(apiKey);
  if (!key) {
    const diag = diagnoseOpenAIKey(apiKey);
    return {
      status: 503,
      body: {
        error: openAIKeyErrorMessage(
          diag,
          'Grounded image extraction requires a server-side OpenAI API key.'
        ),
      },
    };
  }

  if (!body?.imageBase64?.trim()) {
    return { status: 400, body: { error: 'Missing imageBase64' } };
  }

  const dataUrl = toDataUrl(body.mimeType ?? 'image/jpeg', body.imageBase64);
  const fileLabel = body.fileName?.trim() || 'uploaded image';

  const response = await fetch(OPENAI_CHAT_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      max_tokens: 2000,
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: `${VISION_PROMPT}\n\nFile name: ${fileLabel}` },
            { type: 'image_url', image_url: { url: dataUrl } },
          ],
        },
      ],
    }),
  });

  const payload = (await response.json()) as {
    error?: { message?: string };
    choices?: Array<{ message?: { content?: string } }>;
  };

  if (!response.ok) {
    return {
      status: response.status,
      body: { error: payload.error?.message ?? `OpenAI API error (${response.status})` },
    };
  }

  const textContent = payload.choices?.[0]?.message?.content?.trim();
  if (!textContent) {
    return { status: 502, body: { error: 'No description returned from OpenAI' } };
  }

  return {
    status: 200,
    body: {
      textContent: `[Image: ${fileLabel}]\n\n${textContent}`,
      model,
    },
  };
}

export async function handleGroundedImageRequest(
  req: import('node:http').IncomingMessage,
  apiKey: string,
  model: string
): Promise<{ status: number; body: GroundedImageResult | { error: string } }> {
  let parsed: GroundedImageBody;
  try {
    parsed = (await readJsonBody(req)) as GroundedImageBody;
  } catch {
    return { status: 400, body: { error: 'Invalid JSON body' } };
  }
  return handleGroundedImageBody(parsed, apiKey, model);
}

export function createGroundedImageMiddleware(
  getApiKey: () => string | undefined,
  getModel: () => string
): (
  req: import('node:http').IncomingMessage,
  res: import('node:http').ServerResponse,
  next: () => void
) => void {
  return (req, res, next) => {
    const path = req.url?.split('?')[0];
    if (path !== '/api/openai/grounded-image' || req.method !== 'POST') {
      next();
      return;
    }

    void (async () => {
      try {
        const result = await handleGroundedImageRequest(req, getApiKey() ?? '', getModel());
        res.statusCode = result.status;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify(result.body));
      } catch (err) {
        res.statusCode = 500;
        res.setHeader('Content-Type', 'application/json');
        res.end(
          JSON.stringify({
            error: err instanceof Error ? err.message : 'Grounded image extraction failed',
          })
        );
      }
    })();
  };
}
