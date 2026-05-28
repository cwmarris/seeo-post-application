import type { VercelRequest, VercelResponse } from '@vercel/node';
import {
  generateOpenAIImageFromBody,
  type OpenAIImageGenerateBody,
} from '../../server/openaiImages.js';
import { normalizeApiKey } from '../../server/openaiEnv.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const parsed = req.body as OpenAIImageGenerateBody;
  const result = await generateOpenAIImageFromBody(
    parsed,
    normalizeApiKey(process.env.OPENAI_API_KEY),
    process.env.OPENAI_IMAGE_MODEL
  );

  res.status(result.status).json(result.body);
}
