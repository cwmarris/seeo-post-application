import type { VercelRequest, VercelResponse } from '@vercel/node';
import { handleLinkedInMode } from '../../server/linkedinHandlers.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  await handleLinkedInMode(req, res);
}
