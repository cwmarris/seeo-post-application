import { describe, expect, it, beforeEach } from 'vitest';
import { buildSidebarTelemetry, computeRlLearningIndex } from './sidebarTelemetry';
import { getRLState, type RLState } from './rlEngine';
import { runImproveDraftIteration } from './autoresearchLoop';

describe('sidebarTelemetry', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('computes RL learning index as mean STEEP weight', () => {
    const rl: RLState = {
      ...getRLState(),
      steepWeights: {
        Social: 60,
        Technological: 80,
        Economic: 40,
        Environmental: 50,
        Political: 70,
      },
    };
    expect(computeRlLearningIndex(rl)).toBe(60);
  });

  it('builds live telemetry from RL state, experiments, and posts', async () => {
    await runImproveDraftIteration({
      draft: 'delve into safety.',
      authorId: 'craig',
      tone: 'Thought Leader',
      steepFocus: ['Social'],
      rlState: getRLState(),
      preferOpenAI: false,
    });

    const telemetry = buildSidebarTelemetry({
      rlState: getRLState(),
      openaiConfigured: true,
      scheduledCount: 2,
      publishedCount: 5,
    });

    expect(telemetry.experimentCount).toBe(1);
    expect(telemetry.openaiStatusLabel).toBe('OpenAI configured');
    expect(telemetry.scheduledCount).toBe(2);
    expect(telemetry.publishedCount).toBe(5);
    expect(telemetry.rewardHint).toContain('Last keep');
  });
});
