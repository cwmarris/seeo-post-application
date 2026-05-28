/**
 * Server-side OpenAI Chat Completions for LinkedIn draft generate / improve.
 * Dev: Vite middleware at /api/generate/draft. Prod: Vercel serverless route.
 */

import type { IncomingMessage } from 'node:http';
import { diagnoseOpenAIKey, normalizeApiKey, openAIKeyErrorMessage } from './openaiEnv.js';
import { getAuthorStyleGuide } from '../src/utils/authorStyles.js';
import {
  type DraftTargetLength,
  resolveDraftModel,
  TARGET_LENGTH_GUIDANCE,
} from './openaiModels.js';

const OPENAI_CHAT_URL = 'https://api.openai.com/v1/chat/completions';

export interface DraftRLContext {
  bannedWords: string[];
  steepWeights: Record<string, number>;
  emojiDensity: string;
  hookStyle: string;
  averageRating: number;
  aspectFeedback?: string[];
}

export interface GenerateDraftBody {
  mode: 'generate' | 'improve';
  authorId: string;
  authorName: string;
  authorBio: string;
  tone: string;
  steepFocus: string[];
  groundedText?: string;
  topic?: string;
  draft?: string;
  /** User-authored angle, CTA, facts, or constraints for this draft. */
  generationInstructions?: string;
  targetLength?: DraftTargetLength;
  /** Optional; only applied if on server allowlist (see openaiModels.ts). */
  model?: string;
  rlContext: DraftRLContext;
}

export interface GenerateDraftResult {
  content: string;
  model: string;
  revisedPrompt?: string;
}

export interface DraftPromptMessages {
  system: string;
  user: string;
}

function readJsonBody(req: IncomingMessage): Promise<unknown> {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', (chunk: Buffer | string) => {
      data += chunk.toString();
    });
    req.on('end', () => {
      try {
        resolve(data ? JSON.parse(data) : {});
      } catch {
        reject(new Error('Invalid JSON body'));
      }
    });
    req.on('error', reject);
  });
}

function resolveTargetLength(body: GenerateDraftBody): DraftTargetLength {
  const len = body.targetLength;
  if (len === 'short' || len === 'medium' || len === 'long') return len;
  return 'medium';
}

function buildSystemPrompt(body: GenerateDraftBody): string {
  const { rlContext, steepFocus, tone } = body;
  const targetLength = resolveTargetLength(body);
  const lengthGuide = TARGET_LENGTH_GUIDANCE[targetLength];
  const topSteep = Object.entries(rlContext.steepWeights)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([k]) => k)
    .join(', ');

  const craigMilestoneStructure =
    body.authorId === 'craig'
      ? `\nCraig milestone / announcement structure (when the topic implies a transition, milestone, or announcement):\n- Origin story → Growth → Transition → Announcement → Mission → Tagline → Thanks → Upbeat close\n- Include the exact sentence: "Same drive, new frontier."\n- Include the phrase: "onwards and upwards"\n- Generous paragraph breaks (1–2 sentences each)\n- No emojis\n`
      : '';

  const customInstructions = body.generationInstructions?.trim()
    ? `\nAuthor generation instructions (follow closely for angle, emphasis, and must-include points):\n${body.generationInstructions.trim()}\n`
    : '';

  return `You write sharp LinkedIn posts for seeo.ai founders (workplace safety, AI video analytics on CCTV).

Voice: ${body.authorName}. Bio: ${body.authorBio}
Tone: ${tone}. Active STEEP lenses: ${steepFocus.join(', ')}. Prioritize STEEP weights: ${topSteep}.
Hook style preference: ${rlContext.hookStyle}. Emoji density: ${rlContext.emojiDensity}.
Average human draft rating so far: ${rlContext.averageRating}/5.

Style guide (follow closely):
${getAuthorStyleGuide(body.authorId)}
${craigMilestoneStructure}
${customInstructions}

LinkedIn rules (strict):
- Open with a hook in the first 1–2 lines (specific, concrete, no throat-clearing).
- No fluff: ban "I'm excited to share", "thrilled to announce", "in today's fast-paced world", "game-changer", "leverage synergies".
- Short paragraphs (1–3 sentences). Scannable on mobile.
- Target length: ${lengthGuide.charRange} characters (${lengthGuide.label}); max ~${lengthGuide.maxParagraphs} short paragraphs.
- End with 1–3 relevant hashtags only.
- Write like a seasoned operator, not generic AI marketing.

NEVER use these banned phrases/words: ${rlContext.bannedWords.join('; ')}.
New Zealand / industrial safety context when relevant.`;
}

function buildUserPrompt(body: GenerateDraftBody): string {
  const targetLength = resolveTargetLength(body);
  const lengthNote = `Stay within ${TARGET_LENGTH_GUIDANCE[targetLength].charRange} characters.`;

  if (body.mode === 'improve' && body.draft) {
    const feedback =
      body.rlContext.aspectFeedback?.length ?
        `Recent feedback tags: ${body.rlContext.aspectFeedback.join(', ')}.`
      : '';
    const custom = body.generationInstructions?.trim()
      ? `\nWhile improving, honor these instructions:\n${body.generationInstructions.trim()}\n`
      : '';
    return `Improve this LinkedIn draft. Keep the author's voice. Strengthen the hook (first 2 lines), cut filler, align with STEEP focus. ${lengthNote}
${feedback}${custom}

--- DRAFT ---
${body.draft}
--- END ---

Return ONLY the improved post text (no markdown fences, no commentary).`;
  }

  const grounded = body.groundedText?.trim()
    ? `\nGrounded facts to weave in:\n${body.groundedText.trim()}`
    : '';
  const topic = body.topic?.trim() || 'workplace safety and AI video analytics';
  const custom = body.generationInstructions?.trim()
    ? `\nAdditional instructions from the author:\n${body.generationInstructions.trim()}`
    : '';

  return `Write a new LinkedIn post about: ${topic}.${grounded}${custom}

${lengthNote}
Return ONLY the post text (no title, no markdown fences).`;
}

/** Exported for unit tests (prompt injection / length guidance). */
export function buildDraftPromptMessages(body: GenerateDraftBody): DraftPromptMessages {
  return {
    system: buildSystemPrompt(body),
    user: buildUserPrompt(body),
  };
}

export async function handleGenerateDraftBody(
  parsed: GenerateDraftBody,
  apiKey: string,
  model: string
): Promise<{ status: number; body: GenerateDraftResult | { error: string } }> {
  const key = normalizeApiKey(apiKey);
  if (!key) {
    const diag = diagnoseOpenAIKey(apiKey);
    return {
      status: 503,
      body: {
        error: openAIKeyErrorMessage(
          diag,
          'LLM draft generate/improve requires a server-side key.'
        ),
      },
    };
  }

  if (!parsed?.mode || !parsed.authorId || !parsed.rlContext) {
    return { status: 400, body: { error: 'Missing mode, authorId, or rlContext' } };
  }
  if (parsed.mode === 'improve' && !parsed.draft?.trim()) {
    return { status: 400, body: { error: 'Improve mode requires draft text' } };
  }

  const prompts = buildDraftPromptMessages(parsed);

  const response = await fetch(OPENAI_CHAT_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      temperature: parsed.mode === 'generate' ? 0.82 : 0.65,
      messages: [
        { role: 'system', content: prompts.system },
        { role: 'user', content: prompts.user },
      ],
    }),
  });

  const payload = (await response.json()) as {
    error?: { message?: string };
    choices?: Array<{ message?: { content?: string } }>;
  };

  if (!response.ok) {
    return {
      status: response.status,
      body: {
        error: payload.error?.message ?? `OpenAI Chat API error (${response.status})`,
      },
    };
  }

  const content = payload.choices?.[0]?.message?.content?.trim();
  if (!content) {
    return { status: 502, body: { error: 'No draft text returned from OpenAI' } };
  }

  return {
    status: 200,
    body: { content, model },
  };
}

export async function handleGenerateDraft(
  req: IncomingMessage,
  apiKey: string,
  envDraftModel?: string
): Promise<{ status: number; body: GenerateDraftResult | { error: string } }> {
  try {
    const raw = (await readJsonBody(req)) as GenerateDraftBody;
    const model = resolveDraftModel(envDraftModel, raw.model);
    return handleGenerateDraftBody(raw, apiKey, model);
  } catch {
    return { status: 400, body: { error: 'Invalid request body' } };
  }
}

export function createOpenAIDraftMiddleware(
  getApiKey: () => string | undefined,
  getEnvDraftModel: () => string | undefined
): (
  req: IncomingMessage,
  res: import('node:http').ServerResponse,
  next: () => void
) => void {
  return (req, res, next) => {
    const path = req.url?.split('?')[0];
    if (path !== '/api/generate/draft' || req.method !== 'POST') {
      next();
      return;
    }

    void (async () => {
      try {
        const result = await handleGenerateDraft(req, getApiKey() ?? '', getEnvDraftModel());
        res.statusCode = result.status;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify(result.body));
      } catch (err) {
        res.statusCode = 500;
        res.setHeader('Content-Type', 'application/json');
        res.end(
          JSON.stringify({
            error: err instanceof Error ? err.message : 'Draft generation failed',
          })
        );
      }
    })();
  };
}
