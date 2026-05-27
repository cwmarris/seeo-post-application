import type { VercelRequest, VercelResponse } from '@vercel/node';
import { handleGenerateDraftBody, type GenerateDraftBody } from '../../server/openaiDraft.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const result = await handleGenerateDraftBody(
    req.body as GenerateDraftBody,
    process.env.OPENAI_API_KEY ?? '',
    process.env.OPENAI_DRAFT_MODEL ?? 'gpt-4o-mini'
  );
  res.status(result.status).json(result.body);
}
