import { fetchAppHealth } from './appHealth';

export type OpenAIKeyStatus = 'configured' | 'missing_key' | 'missing_env_file';

export type OpenAIHealth = {
  configured: boolean;
  status: OpenAIKeyStatus;
  message: string;
};

const FALLBACK: OpenAIHealth = {
  configured: false,
  status: 'missing_env_file',
  message:
    'Could not reach /api/health. Start npm run dev, or set VITE_DRAFT_API_BASE_URL / VITE_IMAGE_API_BASE_URL in production.',
};

function openaiFromPayload(
  openai: { configured: boolean; status?: OpenAIKeyStatus; message: string } | undefined
): OpenAIHealth {
  if (!openai) return FALLBACK;
  return {
    configured: openai.configured,
    status: openai.status ?? (openai.configured ? 'configured' : 'missing_key'),
    message: openai.message,
  };
}

export async function fetchOpenAIHealth(force = false): Promise<OpenAIHealth> {
  const payload = await fetchAppHealth(force);
  if (!payload?.openai) return FALLBACK;
  return openaiFromPayload(payload.openai as OpenAIHealth);
}
