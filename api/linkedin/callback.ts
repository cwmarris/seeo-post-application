import type { VercelRequest, VercelResponse } from '@vercel/node';
import { handleLinkedInCallback } from '../../server/linkedinHandlers.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  await handleLinkedInCallback(req, res);
}
