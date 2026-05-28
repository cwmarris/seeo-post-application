import { FOUNDER_PROFILES } from './mockData';
import { filterBannedPhrases, type RLState } from './rlEngine';
import { generateLinkedInPost } from './postGenerator';
import { improveDraftViaApi } from './openaiDraft';
import { fetchOpenAIHealth } from './openaiStatus';

export type ExperimentStatus = 'keep' | 'discard' | 'pending' | 'crash';

export interface AutoresearchExperiment {
  id: string;
  timestamp: string;
  metric: number;
  status: ExperimentStatus;
  description: string;
  source: 'local' | 'openai';
  replacedCount: number;
}

const EXPERIMENTS_KEY = 'seeo_autoresearch_experiments';
const AUTO_IMPROVE_KEY = 'seeo_autoresearch_auto_improve';

export type DraftTargetLength = 'short' | 'medium' | 'long';

export interface ImproveDraftInput {
  draft: string;
  authorId: string;
  tone: string;
  steepFocus: string[];
  groundedText?: string;
  rlState: RLState;
  aspectFeedback?: string[];
  preferOpenAI?: boolean;
  generationInstructions?: string;
  targetLength?: DraftTargetLength;
}

export interface ImproveDraftResult {
  content: string;
  metric: number;
  previousMetric: number;
  status: ExperimentStatus;
  replacedPhrases: string[];
  source: 'local' | 'openai';
  experiment: AutoresearchExperiment;
}

/** Composite quality score (higher = better). Analogous to lower val_bpb in karpathy/autoresearch. */
export function scoreDraft(
  text: string,
  rlState: RLState,
  steepFocus: string[]
): number {
  let score = 50;

  const lower = text.toLowerCase();
  let bannedHits = 0;
  rlState.bannedWords.forEach((banned) => {
    if (lower.includes(banned.toLowerCase())) bannedHits += 1;
  });
  score -= bannedHits * 8;

  steepFocus.forEach((factor) => {
    const w = rlState.steepWeights[factor] ?? 50;
    score += (w - 50) * 0.15;
  });

  score += (rlState.averageRating - 3) * 5;

  const len = text.length;
  if (len >= 800 && len <= 2200) score += 8;
  else if (len < 400) score -= 10;

  if (text.includes('#')) score += 3;

  return Math.max(0, Math.min(100, Math.round(score * 10) / 10));
}

export function getExperiments(): AutoresearchExperiment[] {
  const raw = localStorage.getItem(EXPERIMENTS_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as AutoresearchExperiment[];
  } catch {
    return [];
  }
}

export function saveExperiment(exp: AutoresearchExperiment): void {
  const list = getExperiments();
  list.unshift(exp);
  localStorage.setItem(EXPERIMENTS_KEY, JSON.stringify(list.slice(0, 50)));
}

export function isAutoImproveEnabled(): boolean {
  return localStorage.getItem(AUTO_IMPROVE_KEY) === 'true';
}

export function setAutoImproveEnabled(enabled: boolean): void {
  localStorage.setItem(AUTO_IMPROVE_KEY, enabled ? 'true' : 'false');
}

function applyLocalImprovements(
  draft: string,
  authorId: string,
  tone: string,
  steepFocus: string[],
  groundedText: string | undefined,
  rlState: RLState
): { content: string; replacedPhrases: string[] } {
  const filtered = filterBannedPhrases(draft);
  let content = filtered.cleanText;

  if (scoreDraft(content, rlState, steepFocus) < 45 && !groundedText?.trim()) {
    const regen = generateLinkedInPost(authorId, tone, steepFocus, '', rlState);
    content = regen.content;
    return {
      content,
      replacedPhrases: [...filtered.replacements, ...regen.replacedPhrases],
    };
  }

  if (rlState.hookStyle === 'empirical' && !content.match(/\d+%|\d+\s*(year|minute|hour)/i)) {
    content = content.replace(
      /^([^\n]+)/,
      (hook) => `${hook}\n\n(Operators with empirical telemetry see 30–40% fewer near-misses when visibility is continuous.)`
    );
  }

  if (rlState.emojiDensity === 'none') {
    content = content.replace(/[\u{1F300}-\u{1F9FF}]/gu, '');
  }

  const secondPass = filterBannedPhrases(content);
  return {
    content: secondPass.cleanText,
    replacedPhrases: [...filtered.replacements, ...secondPass.replacements],
  };
}

/**
 * One autoresearch iteration: propose improvement, score, keep if metric improved else discard.
 */
export async function runImproveDraftIteration(
  input: ImproveDraftInput
): Promise<ImproveDraftResult> {
  const {
    draft,
    authorId,
    tone,
    steepFocus,
    groundedText,
    rlState,
    aspectFeedback,
    generationInstructions,
    targetLength,
  } = input;
  const profile = FOUNDER_PROFILES.find((p) => p.id === authorId) ?? FOUNDER_PROFILES[0];
  const previousMetric = scoreDraft(draft, rlState, steepFocus);

  let candidate: string;
  let replacedPhrases: string[];
  let source: 'local' | 'openai';

  const health = await fetchOpenAIHealth();
  const tryOpenAI =
    input.preferOpenAI === true ||
    (input.preferOpenAI !== false && health.configured);

  if (tryOpenAI) {
    try {
      const apiResult = await improveDraftViaApi({
        mode: 'improve',
        authorId,
        authorName: profile.name,
        authorBio: profile.bio,
        tone,
        steepFocus,
        groundedText,
        draft,
        generationInstructions,
        targetLength,
        rlContext: {
          bannedWords: rlState.bannedWords,
          steepWeights: rlState.steepWeights,
          emojiDensity: rlState.emojiDensity,
          hookStyle: rlState.hookStyle,
          averageRating: rlState.averageRating,
          aspectFeedback,
        },
      });
      const filtered = filterBannedPhrases(apiResult.content);
      candidate = filtered.cleanText;
      replacedPhrases = filtered.replacements;
      source = 'openai';
    } catch {
      const local = applyLocalImprovements(
        draft,
        authorId,
        tone,
        steepFocus,
        groundedText,
        rlState
      );
      candidate = local.content;
      replacedPhrases = local.replacedPhrases;
      source = 'local';
    }
  } else {
    const local = applyLocalImprovements(
      draft,
      authorId,
      tone,
      steepFocus,
      groundedText,
      rlState
    );
    candidate = local.content;
    replacedPhrases = local.replacedPhrases;
    source = 'local';
  }

  const metric = scoreDraft(candidate, rlState, steepFocus);
  const improved = metric > previousMetric;
  const status: ExperimentStatus = improved ? 'keep' : 'discard';

  const experiment: AutoresearchExperiment = {
    id: `exp-${Date.now()}`,
    timestamp: new Date().toISOString(),
    metric,
    status,
    description:
      improved ?
        `Metric ${previousMetric} → ${metric} (${source}); kept draft`
      : `Metric ${previousMetric} → ${metric} (${source}); reverted`,
    source,
    replacedCount: replacedPhrases.length,
  };
  saveExperiment(experiment);

  return {
    content: improved ? candidate : draft,
    metric: improved ? metric : previousMetric,
    previousMetric,
    status,
    replacedPhrases,
    source,
    experiment,
  };
}
