import { existsSync as fsExistsSync, readFileSync as fsReadFileSync } from 'node:fs';
import { resolve } from 'node:path';

/** File I/O used for local .env hints (mockable in tests). */
export const envIo = {
  existsSync: fsExistsSync,
  readFileSync: fsReadFileSync,
};

export type OpenAIKeyStatus = 'configured' | 'missing_key' | 'missing_env_file';

export type OpenAIKeyDiagnostics = {
  status: OpenAIKeyStatus;
  configured: boolean;
  message: string;
};

export type DiagnoseOpenAIKeyOptions = {
  /** Local Vite dev: allow .env-file hints. Defaults to !isPlatformManagedRuntime(). */
  localDev?: boolean;
};

const ENV_CANDIDATES = ['.env.local', '.env'];

function projectRoot(): string {
  return process.cwd();
}

/** Vercel / production: env vars come from the platform, not repo .env files. */
export function isPlatformManagedRuntime(): boolean {
  return (
    process.env.VERCEL === '1' ||
    Boolean(process.env.VERCEL_ENV) ||
    process.env.NODE_ENV === 'production'
  );
}

export function hasEnvFile(): boolean {
  const root = projectRoot();
  return ENV_CANDIDATES.some((name) => envIo.existsSync(resolve(root, name)));
}

export function normalizeApiKey(raw: string | undefined): string {
  return (raw ?? '').trim();
}

export function diagnoseOpenAIKey(
  raw?: string,
  options?: DiagnoseOpenAIKeyOptions
): OpenAIKeyDiagnostics {
  const key = normalizeApiKey(raw);

  if (key.length > 0) {
    return {
      status: 'configured',
      configured: true,
      message: 'OPENAI_API_KEY is loaded on the server.',
    };
  }

  const localDev = options?.localDev ?? !isPlatformManagedRuntime();

  if (!localDev) {
    return {
      status: 'missing_key',
      configured: false,
      message:
        'OPENAI_API_KEY is not set. Add it in Vercel Project Settings → Environment Variables, then redeploy.',
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
      const text = envIo.readFileSync(resolve(projectRoot(), name), 'utf8');
      return /^\s*OPENAI_API_KEY\s*=/m.test(text);
    } catch {
      return false;
    }
  });

  if (hasKeyLine) {
    return {
      status: 'missing_key',
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
    : diagnostics.status === 'missing_key' ? 'OPENAI_API_KEY not configured.'
    : 'OPENAI_API_KEY not available.';

  return `${prefix} ${context} ${diagnostics.message}`;
}
