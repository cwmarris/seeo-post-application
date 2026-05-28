import type { VercelRequest, VercelResponse } from '@vercel/node';
import { handleLinkedInStatus } from '../../server/linkedinHandlers.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  await handleLinkedInStatus(req, res);
}
