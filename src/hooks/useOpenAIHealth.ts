import { useEffect, useState } from 'react';
import { fetchOpenAIHealth, type OpenAIHealth } from '../utils/openaiStatus';

export function useOpenAIHealth(intervalMs = 20_000): {
  openai: OpenAIHealth | null;
  loading: boolean;
  refresh: () => void;
} {
  const [openai, setOpenai] = useState<OpenAIHealth | null>(null);
  const [loading, setLoading] = useState(true);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      const health = await fetchOpenAIHealth(tick > 0);
      if (cancelled) return;
      setOpenai(health);
      setLoading(false);
    };

    void load();
    const id = window.setInterval(() => setTick((t) => t + 1), intervalMs);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [intervalMs, tick]);

  return {
    openai,
    loading,
    refresh: () => setTick((t) => t + 1),
  };
}
