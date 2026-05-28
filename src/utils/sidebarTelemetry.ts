import type { RLState } from './rlEngine';
import { getExperiments } from './autoresearchLoop';

/** Mean STEEP weight (0–100) from persisted RL state. */
export function computeRlLearningIndex(rlState: RLState): number {
  const weights = Object.values(rlState.steepWeights);
  if (weights.length === 0) return 50;
  const sum = weights.reduce((acc, w) => acc + w, 0);
  return Math.round(sum / weights.length);
}

export function getExperimentCount(): number {
  return getExperiments().length;
}

export interface SidebarTelemetry {
  rlLearningIndex: number;
  experimentCount: number;
  openaiConfigured: boolean;
  openaiStatusLabel: string;
  scheduledCount: number;
  publishedCount: number;
  rewardHint: string;
}

export function buildSidebarTelemetry(input: {
  rlState: RLState;
  openaiConfigured: boolean;
  openaiLoading?: boolean;
  scheduledCount: number;
  publishedCount: number;
}): SidebarTelemetry {
  const rlLearningIndex = computeRlLearningIndex(input.rlState);
  const experimentCount = getExperimentCount();
  const experiments = getExperiments();
  const lastKeep = experiments.find((e) => e.status === 'keep');

  let rewardHint = `Avg rating ${input.rlState.averageRating}/5`;
  if (lastKeep) {
    rewardHint = `Last keep: ${lastKeep.metric}/100`;
  } else if (experimentCount > 0) {
    rewardHint = `${experimentCount} experiment${experimentCount === 1 ? '' : 's'} logged`;
  }

  const openaiStatusLabel =
    input.openaiLoading ? 'Checking OpenAI…'
    : input.openaiConfigured ? 'OpenAI configured'
    : 'OpenAI not configured';

  return {
    rlLearningIndex,
    experimentCount,
    openaiConfigured: input.openaiConfigured,
    openaiStatusLabel,
    scheduledCount: input.scheduledCount,
    publishedCount: input.publishedCount,
    rewardHint,
  };
}
