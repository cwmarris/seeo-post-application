import type { VercelRequest, VercelResponse } from '@vercel/node';
import {
  handleGroundedImageBody,
  type GroundedImageBody,
} from '../../server/openaiGroundedImage.js';
import { resolveGroundedImageModel } from '../../server/openaiModels.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const body = req.body as GroundedImageBody & { model?: string };
  const model = resolveGroundedImageModel(
    process.env.OPENAI_GROUNDED_IMAGE_MODEL,
    process.env.OPENAI_DRAFT_MODEL,
    body.model
  );

  const result = await handleGroundedImageBody(body, process.env.OPENAI_API_KEY ?? '', model);
  res.status(result.status).json(result.body);
}
