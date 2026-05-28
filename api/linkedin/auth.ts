import type { VercelRequest, VercelResponse } from '@vercel/node';
import { handleLinkedInAuth } from '../../server/linkedinHandlers.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  await handleLinkedInAuth(req, res);
}
