import type { VercelRequest, VercelResponse } from '@vercel/node';
import { handleLinkedInMetrics } from '../../server/linkedinHandlers.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  await handleLinkedInMetrics(req, res);
}
