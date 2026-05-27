import type { VercelRequest, VercelResponse } from '@vercel/node';
import {
  buildImagePrompt,
  type OpenAIImageGenerateBody,
  type OpenAIImageGenerateResult,
} from '../../server/openaiImages';
import { diagnoseOpenAIKey, normalizeApiKey, openAIKeyErrorMessage } from '../../server/openaiEnv';

const OPENAI_IMAGES_URL = 'https://api.openai.com/v1/images/generations';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const apiKey = normalizeApiKey(process.env.OPENAI_API_KEY);
  if (!apiKey) {
    const diag = diagnoseOpenAIKey(process.env.OPENAI_API_KEY);
    res.status(503).json({
      error: openAIKeyErrorMessage(
        diag,
        'Image generation requires OPENAI_API_KEY in Vercel Environment Variables.'
      ),
    });
    return;
  }

  const parsed = req.body as OpenAIImageGenerateBody;
  if (!parsed?.prompt) {
    res.status(400).json({ error: 'Missing prompt' });
    return;
  }

  const model = process.env.OPENAI_IMAGE_MODEL ?? 'gpt-image-1';
  const fullPrompt = buildImagePrompt(parsed.prompt, parsed.style ?? 'editorial', parsed.guidance);

  const response = await fetch(OPENAI_IMAGES_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
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
    res.status(response.status).json({
      error: payload.error?.message ?? `OpenAI Images API error (${response.status})`,
    });
    return;
  }

  const first = payload.data?.[0];
  let imageDataUrl: string | undefined;
  if (first?.b64_json) imageDataUrl = `data:image/png;base64,${first.b64_json}`;
  else if (first?.url) imageDataUrl = first.url;

  if (!imageDataUrl) {
    res.status(502).json({ error: 'No image data returned from OpenAI' });
    return;
  }

  const body: OpenAIImageGenerateResult = {
    imageDataUrl,
    model,
    revisedPrompt: first?.revised_prompt,
  };
  res.status(200).json(body);
}
