import { useEffect, useRef } from 'react';
import {
  isAutoImproveEnabled,
  runImproveDraftIteration,
  type ImproveDraftInput,
} from '../utils/autoresearchLoop';

const INTERVAL_MS = 30 * 60 * 1000;

interface UseAutoresearchAutoImproveOptions {
  enabled: boolean;
  hasDraft: boolean;
  input: ImproveDraftInput | null;
  onImproved: (content: string, message: string) => void;
}

/**
 * Optional background loop: re-run improve iteration on an interval while composer has a draft.
 * Runs only while the tab is open (browser timer — not a server cron).
 */
export function useAutoresearchAutoImprove({
  enabled,
  hasDraft,
  input,
  onImproved,
}: UseAutoresearchAutoImproveOptions): void {
  const onImprovedRef = useRef(onImproved);
  onImprovedRef.current = onImproved;

  useEffect(() => {
    if (!enabled || !isAutoImproveEnabled() || !hasDraft || !input?.draft?.trim()) {
      return;
    }

    const tick = async () => {
      if (!input.draft.trim()) return;
      try {
        const result = await runImproveDraftIteration(input);
        if (result.status === 'keep') {
          onImprovedRef.current(
            result.content,
            `Auto-improve kept (${result.source}): metric ${result.previousMetric} → ${result.metric}`
          );
        }
      } catch {
        /* silent — user can run manual improve */
      }
    };

    const id = window.setInterval(() => {
      void tick();
    }, INTERVAL_MS);

    return () => window.clearInterval(id);
  }, [enabled, hasDraft, input]);
}
