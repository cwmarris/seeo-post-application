import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

export type OpenAIKeyStatus =
  | 'configured'
  | 'empty'
  | 'missing_key'
  | 'missing_env_file';

export type OpenAIKeyDiagnostics = {
  status: OpenAIKeyStatus;
  configured: boolean;
  message: string;
};

const ENV_CANDIDATES = ['.env.local', '.env'];

function projectRoot(): string {
  return process.cwd();
}

export function hasEnvFile(): boolean {
  const root = projectRoot();
  return ENV_CANDIDATES.some((name) => existsSync(resolve(root, name)));
}

export function normalizeApiKey(raw: string | undefined): string {
  return (raw ?? '').trim();
}

export function diagnoseOpenAIKey(raw: string | undefined): OpenAIKeyDiagnostics {
  const key = normalizeApiKey(raw);

  if (key.length > 0) {
    return {
      status: 'configured',
      configured: true,
      message: 'OPENAI_API_KEY is loaded on the server.',
    };
  }

  if (!hasEnvFile()) {
    return {
      status: 'missing_env_file',
      configured: false,
      message:
        'No .env file found. Copy .env.example to .env in the project root, set OPENAI_API_KEY=sk-..., then restart the dev server (npm run dev).',
    };
  }

  const hasKeyLine = ENV_CANDIDATES.some((name) => {
    try {
      const text = readFileSync(resolve(projectRoot(), name), 'utf8');
      return /^\s*OPENAI_API_KEY\s*=/m.test(text);
    } catch {
      return false;
    }
  });

  if (hasKeyLine) {
    return {
      status: 'empty',
      configured: false,
      message:
        'OPENAI_API_KEY is present in .env but empty. Paste your key after the equals sign, save, and restart npm run dev.',
    };
  }

  return {
    status: 'missing_key',
    configured: false,
    message:
      'OPENAI_API_KEY is not in .env. Add OPENAI_API_KEY=sk-... to .env (see .env.example), save, and restart npm run dev.',
  };
}

export function openAIKeyErrorMessage(diagnostics: OpenAIKeyDiagnostics, context: string): string {
  const prefix =
    diagnostics.status === 'missing_env_file' ? 'Missing .env file.'
    : diagnostics.status === 'empty' ? 'Empty OPENAI_API_KEY.'
    : diagnostics.status === 'missing_key' ? 'OPENAI_API_KEY not in .env.'
    : 'OPENAI_API_KEY not available.';

  return `${prefix} ${context} ${diagnostics.message}`;
}
