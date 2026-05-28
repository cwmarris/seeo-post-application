import type { VercelRequest, VercelResponse } from '@vercel/node';
import { handleGenerateDraftBody, type GenerateDraftBody } from '../../server/openaiDraft.js';
import { resolveDraftModel } from '../../server/openaiModels.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const body = req.body as GenerateDraftBody;
  const model = resolveDraftModel(process.env.OPENAI_DRAFT_MODEL, body.model);

  const result = await handleGenerateDraftBody(body, process.env.OPENAI_API_KEY ?? '', model);
  res.status(result.status).json(result.body);
}
