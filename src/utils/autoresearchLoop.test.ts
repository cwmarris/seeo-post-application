import { describe, expect, it, beforeEach } from 'vitest';
import {
  scoreDraft,
  runImproveDraftIteration,
  getExperiments,
} from './autoresearchLoop';
import { getRLState } from './rlEngine';

describe('autoresearchLoop', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('scores higher when banned phrases are absent', () => {
    const rl = getRLState();
    const steep = ['Technological'];
    const withBanned = scoreDraft('We must delve into safety today.', rl, steep);
    const clean = scoreDraft('We must explore safety telemetry today.', rl, steep);
    expect(clean).toBeGreaterThan(withBanned);
  });

  it('keeps or discards based on metric change', async () => {
    const rl = getRLState();
    const draft = 'delve into our transformative paradigm for safety.';
    const result = await runImproveDraftIteration({
      draft,
      authorId: 'craig',
      tone: 'Thought Leader',
      steepFocus: ['Social'],
      rlState: rl,
      preferOpenAI: false,
    });
    expect(['keep', 'discard']).toContain(result.status);
    expect(getExperiments().length).toBeGreaterThan(0);
  });
});
