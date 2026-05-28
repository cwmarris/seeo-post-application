export type AppHealthModels = {
  draftModel: string;
  imageModel: string;
  groundedImageModel: string;
};

export type AppHealthPayload = {
  ok: boolean;
  timestamp: string;
  version: string;
  draftModel: string;
  imageModel: string;
  groundedImageModel: string;
  warnings?: string[];
  openai?: {
    configured: boolean;
    message: string;
  };
};

const DEFAULT_MODELS: AppHealthModels = {
  draftModel: 'gpt-5.5',
  imageModel: 'gpt-image-2',
  groundedImageModel: 'gpt-5.5',
};

let cachedPayload: AppHealthPayload | null = null;
let inflight: Promise<AppHealthPayload | null> | null = null;

export async function fetchAppHealth(force = false): Promise<AppHealthPayload | null> {
  if (!force && cachedPayload) return cachedPayload;
  if (!force && inflight) return inflight;

  inflight = (async () => {
    try {
      const res = await fetch('/api/health', { method: 'GET', cache: 'no-store' });
      if (!res.ok) return null;
      const payload = (await res.json()) as AppHealthPayload;
      if (!payload?.ok) return null;
      cachedPayload = payload;
      return payload;
    } catch {
      return null;
    } finally {
      inflight = null;
    }
  })();

  return inflight;
}

export function modelsFromHealth(payload: AppHealthPayload | null): AppHealthModels {
  if (!payload) return DEFAULT_MODELS;
  return {
    draftModel: payload.draftModel || DEFAULT_MODELS.draftModel,
    imageModel: payload.imageModel || DEFAULT_MODELS.imageModel,
    groundedImageModel: payload.groundedImageModel || DEFAULT_MODELS.groundedImageModel,
  };
}
