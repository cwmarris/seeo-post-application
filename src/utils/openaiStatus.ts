export type OpenAIKeyStatus =
  | 'configured'
  | 'empty'
  | 'missing_key'
  | 'missing_env_file';

export type OpenAIHealth = {
  configured: boolean;
  status: OpenAIKeyStatus;
  message: string;
};

type HealthPayload = {
  ok: boolean;
  openai?: OpenAIHealth;
};

let cached: OpenAIHealth | null = null;
let inflight: Promise<OpenAIHealth> | null = null;

const FALLBACK: OpenAIHealth = {
  configured: false,
  status: 'missing_env_file',
  message:
    'Could not reach /api/health. Start npm run dev, or set VITE_DRAFT_API_BASE_URL / VITE_IMAGE_API_BASE_URL in production.',
};

export async function fetchOpenAIHealth(force = false): Promise<OpenAIHealth> {
  if (!force && cached) return cached;
  if (!force && inflight) return inflight;

  inflight = (async () => {
    try {
      const res = await fetch('/api/health', { method: 'GET', cache: 'no-store' });
      if (!res.ok) return FALLBACK;
      const payload = (await res.json()) as HealthPayload;
      const openai = payload.openai ?? FALLBACK;
      cached = openai;
      return openai;
    } catch {
      return FALLBACK;
    } finally {
      inflight = null;
    }
  })();

  return inflight;
}
