import { getAuthorStyleSettings, type AuthorId } from './authorStyles';
import type { DraftTargetLength } from './openaiDraft';

/** Keep in sync with `server/openaiModels.ts` TARGET_LENGTH_GUIDANCE char ranges. */
const LENGTH_BANDS: Record<DraftTargetLength, { min: number; max: number }> = {
  short: { min: 550, max: 850 },
  medium: { min: 850, max: 1200 },
  long: { min: 1200, max: 1600 },
};

/** Phrases the draft system prompt forbids (LinkedIn fluff). */
export const LINKEDIN_FLUFF_BANNED = [
  "i'm excited to share",
  'thrilled to announce',
  'in today\'s fast-paced world',
  'game-changer',
  'leverage synergies',
] as const;

export function parseCharRange(charRange: string): { min: number; max: number } {
  const normalized = charRange.replace(/,/g, '').trim();
  const match = normalized.match(/(\d+)\s*[–-]\s*(\d+)/);
  if (!match) {
    throw new Error(`Invalid character range: ${charRange}`);
  }
  return { min: Number(match[1]), max: Number(match[2]) };
}

export function getLengthBand(targetLength: DraftTargetLength): { min: number; max: number } {
  return LENGTH_BANDS[targetLength];
}

/**
 * Whether draft text falls within the target length band (± tolerance chars).
 * Used in tests and optional client-side warnings — not enforced on OpenAI responses in prod.
 */
export function isWithinLengthBand(
  content: string,
  targetLength: DraftTargetLength,
  tolerance = 150
): boolean {
  const { min, max } = getLengthBand(targetLength);
  const len = content.trim().length;
  return len >= min - tolerance && len <= max + tolerance;
}

export function findBannedPhrasesInText(
  content: string,
  bannedWords: string[],
  options?: { includeLinkedInFluff?: boolean }
): string[] {
  const lower = content.toLowerCase();
  const phrases = [...bannedWords];
  if (options?.includeLinkedInFluff !== false) {
    phrases.push(...LINKEDIN_FLUFF_BANNED);
  }
  return phrases.filter((phrase) => {
    const p = phrase.trim().toLowerCase();
    return p.length > 0 && lower.includes(p);
  });
}

/** Craig (and other authors) should end with their preferred hashtag set when applicable. */
export function hasAuthorPreferredHashtags(content: string, authorId: AuthorId): boolean {
  const { preferredHashtags } = getAuthorStyleSettings(authorId);
  if (!preferredHashtags.length) return true;
  const first = preferredHashtags[0];
  const last = preferredHashtags[preferredHashtags.length - 1];
  return content.includes(first) && content.includes(last);
}

export function countParagraphs(content: string): number {
  return content
    .trim()
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean).length;
}
