/**
 * Defaults and allowlist for OpenAI Chat models used by draft + vision routes.
 *
 * ChatGPT product names (e.g. "GPT-5.5 Thinking") differ from API model slugs
 * (e.g. `gpt-5.5`). There is no API slug `gpt-5.6` as of 2026-05; use env
 * `OPENAI_DRAFT_MODEL` to pick any slug your key can call.
 *
 * @see https://developers.openai.com/api/docs/models
 */

export const DEFAULT_DRAFT_MODEL = 'gpt-5.5';
export const DEFAULT_IMAGE_MODEL = 'gpt-image-2';
export const DEFAULT_GROUNDED_IMAGE_MODEL = 'gpt-5.5';

export function resolveImageModel(envModel: string | undefined): string {
  const base = (envModel ?? DEFAULT_IMAGE_MODEL).trim() || DEFAULT_IMAGE_MODEL;
  return base;
}

/** Models clients may request via API body (abuse prevention). Env override is not restricted. */
export const ALLOWED_REQUEST_DRAFT_MODELS = [
  'gpt-5.5',
  'gpt-5.4-mini',
  'gpt-5.4-nano',
  'gpt-5',
  'gpt-5-mini',
  'gpt-4.1',
  'gpt-4.1-mini',
  'gpt-4.1-nano',
  'gpt-4o',
  'gpt-4o-mini',
] as const;

export type AllowedRequestDraftModel = (typeof ALLOWED_REQUEST_DRAFT_MODELS)[number];

export type DraftTargetLength = 'short' | 'medium' | 'long';

export const TARGET_LENGTH_GUIDANCE: Record<
  DraftTargetLength,
  { label: string; charRange: string; maxParagraphs: string }
> = {
  short: {
    label: 'Short',
    charRange: '550–850',
    maxParagraphs: '3–5',
  },
  medium: {
    label: 'Medium',
    charRange: '850–1,200',
    maxParagraphs: '4–6',
  },
  long: {
    label: 'Long',
    charRange: '1,200–1,600',
    maxParagraphs: '6–8',
  },
};

export function isAllowedRequestDraftModel(model: string): model is AllowedRequestDraftModel {
  return (ALLOWED_REQUEST_DRAFT_MODELS as readonly string[]).includes(model);
}

/** Env/default first; optional request model only if allowlisted. */
export function resolveDraftModel(
  envModel: string | undefined,
  requestedModel?: string
): string {
  const base = (envModel ?? DEFAULT_DRAFT_MODEL).trim() || DEFAULT_DRAFT_MODEL;
  const req = requestedModel?.trim();
  if (req && isAllowedRequestDraftModel(req)) return req;
  return base;
}

export function resolveGroundedImageModel(
  envGrounded: string | undefined,
  envDraft: string | undefined,
  requestedModel?: string
): string {
  const base =
    (envGrounded ?? envDraft ?? DEFAULT_GROUNDED_IMAGE_MODEL).trim() ||
    DEFAULT_GROUNDED_IMAGE_MODEL;
  const req = requestedModel?.trim();
  if (req && isAllowedRequestDraftModel(req)) return req;
  return base;
}
