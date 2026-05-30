import { getAuthorStyleSettings, type AuthorId } from './authorStyles';

export type DraftTargetLength = 'short' | 'medium' | 'long';

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

export function stripDraftWrappers(content: string): string {
  return content
    .trim()
    .replace(/^```(?:\w+)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .replace(/^\s*(?:title|post|linkedin post)\s*:\s*/i, '')
    .split('\n')
    .map((line) => line.trimEnd())
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function splitTrailingHashtags(content: string): { body: string; hashtags: string } {
  const paragraphs = stripDraftWrappers(content)
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);
  const last = paragraphs[paragraphs.length - 1] ?? '';
  const isHashtagLine = /^(?:#[A-Za-z0-9_-]+)(?:\s+#[A-Za-z0-9_-]+){0,4}$/.test(last);
  if (!isHashtagLine) {
    return { body: paragraphs.join('\n\n'), hashtags: '' };
  }
  return {
    body: paragraphs.slice(0, -1).join('\n\n'),
    hashtags: last,
  };
}

function trimParagraphToMax(paragraph: string, max: number): string {
  const clean = paragraph.replace(/\s+/g, ' ').trim();
  if (clean.length <= max) return clean;

  const sentences = clean.match(/[^.!?]+[.!?]+(?:["')\]]+)?|[^.!?]+$/g) ?? [];
  let out = '';
  for (const sentence of sentences) {
    const next = sentence.trim();
    if (!next) continue;
    const candidate = out ? `${out} ${next}` : next;
    if (candidate.length > max) break;
    out = candidate;
  }

  if (out.length >= Math.min(120, Math.floor(max * 0.45))) {
    return out.trim();
  }

  const hardCut = clean.slice(0, max + 1);
  const lastSpace = hardCut.lastIndexOf(' ');
  const end = lastSpace >= Math.max(40, Math.floor(max * 0.6)) ? lastSpace : max;
  return clean.slice(0, end).replace(/[,\s:;-]+$/, '').trim();
}

function trimBodyToMax(body: string, max: number): string {
  const paragraphs = stripDraftWrappers(body)
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);

  const output: string[] = [];
  for (const paragraph of paragraphs) {
    const candidate = [...output, paragraph].join('\n\n');
    if (candidate.length <= max) {
      output.push(paragraph);
      continue;
    }

    const used = output.join('\n\n').length;
    const separator = output.length ? 2 : 0;
    const remaining = max - used - separator;
    if (remaining > 80) {
      const trimmed = trimParagraphToMax(paragraph, remaining);
      if (trimmed) output.push(trimmed);
    }
    break;
  }

  return output.join('\n\n').trim() || trimParagraphToMax(paragraphs.join(' '), max);
}

export function enforceDraftLength(
  content: string,
  targetLength: DraftTargetLength = 'medium'
): { content: string; wasTrimmed: boolean; originalLength: number; finalLength: number } {
  const normalized = stripDraftWrappers(content);
  const { max } = getLengthBand(targetLength);
  const originalLength = normalized.length;
  if (originalLength <= max) {
    return {
      content: normalized,
      wasTrimmed: false,
      originalLength,
      finalLength: originalLength,
    };
  }

  const { body, hashtags } = splitTrailingHashtags(normalized);
  const reserve = hashtags ? hashtags.length + 2 : 0;
  const bodyMax = Math.max(120, max - reserve);
  const trimmedBody = trimBodyToMax(body, bodyMax);
  let next = hashtags ? `${trimmedBody}\n\n${hashtags}`.trim() : trimmedBody;

  if (next.length > max) {
    next = trimBodyToMax(next, max);
  }

  return {
    content: next,
    wasTrimmed: true,
    originalLength,
    finalLength: next.length,
  };
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
