import { resolveLinkedInPostMode, type LinkedInPostMode } from './linkedinEnv.js';

export type SwitchableLinkedInPostMode = Extract<LinkedInPostMode, 'dry_run' | 'live'>;

export function isSwitchableLinkedInPostMode(raw?: string): raw is SwitchableLinkedInPostMode {
  return raw === 'dry_run' || raw === 'live';
}

export function getEffectiveLinkedInPostMode(
  storedMode?: LinkedInPostMode | null,
  env: NodeJS.ProcessEnv = process.env
): LinkedInPostMode {
  return storedMode ?? resolveLinkedInPostMode(env.LINKEDIN_POST_MODE);
}
