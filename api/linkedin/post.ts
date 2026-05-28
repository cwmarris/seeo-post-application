import type { VercelRequest, VercelResponse } from '@vercel/node';
import { handleLinkedInPost } from '../../server/linkedinHandlers.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  await handleLinkedInPost(req, res);
}
