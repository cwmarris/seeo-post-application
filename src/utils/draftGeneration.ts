import { FOUNDER_PROFILES } from './mockData';
import { generateLinkedInPost } from './postGenerator';
import { filterBannedPhrases, type RLState } from './rlEngine';
import { improveDraftViaApi } from './openaiDraft';
import { fetchOpenAIHealth } from './openaiStatus';

export type DraftTargetLength = 'short' | 'medium' | 'long';

export interface GenerateDraftInput {
  authorId: string;
  tone: string;
  steepFocus: string[];
  groundedText: string;
  rlState: RLState;
  topic?: string;
  generationInstructions?: string;
  targetLength?: DraftTargetLength;
}

export interface GenerateDraftResult {
  content: string;
  replacedPhrases: string[];
  wasFiltered: boolean;
  source: 'openai' | 'local';
  /** OpenAI API slug when source is openai. */
  model?: string;
}

function buildTopic(steepFocus: string[], groundedText: string): string {
  const steep = steepFocus.length ? steepFocus.join(', ') : 'workplace safety';
  const grounded = groundedText.trim();
  if (grounded) {
    const firstLine = grounded.split('\n')[0]?.slice(0, 120) ?? '';
    return `${steep} — ${firstLine}`;
  }
  return `seeo.ai ${steep} lenses: AI video analytics on existing CCTV for warehouse and manufacturing safety`;
}

export async function generateDraftWithFallback(
  input: GenerateDraftInput
): Promise<GenerateDraftResult> {
  const profile = FOUNDER_PROFILES.find((p) => p.id === input.authorId) ?? FOUNDER_PROFILES[0];
  const health = await fetchOpenAIHealth();
  const topic = input.topic?.trim() || buildTopic(input.steepFocus, input.groundedText);

  if (health.configured) {
    try {
      const apiResult = await improveDraftViaApi({
        mode: 'generate',
        authorId: input.authorId,
        authorName: profile.name,
        authorBio: profile.bio,
        tone: input.tone,
        steepFocus: input.steepFocus,
        groundedText: input.groundedText,
        topic,
        generationInstructions: input.generationInstructions,
        targetLength: input.targetLength,
        rlContext: {
          bannedWords: input.rlState.bannedWords,
          steepWeights: input.rlState.steepWeights,
          emojiDensity: input.rlState.emojiDensity,
          hookStyle: input.rlState.hookStyle,
          averageRating: input.rlState.averageRating,
        },
      });
      const filtered = filterBannedPhrases(apiResult.content);
      return {
        content: filtered.cleanText,
        replacedPhrases: filtered.replacements,
        wasFiltered: filtered.replacedCount > 0,
        source: 'openai',
        model: apiResult.model,
      };
    } catch {
      // fall through to local template
    }
  }

  const local = generateLinkedInPost(
    input.authorId,
    input.tone,
    input.steepFocus,
    input.groundedText,
    input.rlState,
    { variationSeed: Date.now(), topic }
  );

  return {
    content: local.content,
    replacedPhrases: local.replacedPhrases,
    wasFiltered: local.wasFiltered,
    source: 'local',
  };
}
