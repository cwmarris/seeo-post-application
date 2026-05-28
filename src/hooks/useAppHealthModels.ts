import { useEffect, useState } from 'react';
import {
  fetchAppHealth,
  modelsFromHealth,
  type AppHealthModels,
} from '../utils/appHealth';

export function useAppHealthModels(intervalMs = 20_000): {
  models: AppHealthModels;
  loading: boolean;
} {
  const [models, setModels] = useState<AppHealthModels>(modelsFromHealth(null));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      const payload = await fetchAppHealth();
      if (cancelled) return;
      setModels(modelsFromHealth(payload));
      setLoading(false);
    };

    void load();
    const id = window.setInterval(() => void load(), intervalMs);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [intervalMs]);

  return { models, loading };
}
