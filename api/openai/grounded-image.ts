import type { VercelRequest, VercelResponse } from '@vercel/node';
import {
  handleGroundedImageBody,
  type GroundedImageBody,
} from '../../server/openaiGroundedImage.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const result = await handleGroundedImageBody(
    req.body as GroundedImageBody,
    process.env.OPENAI_API_KEY ?? '',
    process.env.OPENAI_GROUNDED_IMAGE_MODEL ?? process.env.OPENAI_DRAFT_MODEL ?? 'gpt-4o-mini'
  );
  res.status(result.status).json(result.body);
}
