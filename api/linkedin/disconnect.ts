import type { VercelRequest, VercelResponse } from '@vercel/node';
import { handleLinkedInDisconnect } from '../../server/linkedinHandlers.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  await handleLinkedInDisconnect(req, res);
}
