export interface DraftRLContext {
  bannedWords: string[];
  steepWeights: Record<string, number>;
  emojiDensity: string;
  hookStyle: string;
  averageRating: number;
  aspectFeedback?: string[];
}

export interface ImproveDraftApiParams {
  mode: 'generate' | 'improve';
  authorId: string;
  authorName: string;
  authorBio: string;
  tone: string;
  steepFocus: string[];
  groundedText?: string;
  topic?: string;
  draft?: string;
  rlContext: DraftRLContext;
}

export interface ImproveDraftApiResult {
  content: string;
  model: string;
}

function draftApiUrl(): string {
  const base = (import.meta.env.VITE_DRAFT_API_BASE_URL as string | undefined)?.replace(
    /\/$/,
    ''
  );
  return `${base ?? ''}/api/generate/draft`;
}

export function isOpenAIDraftConfigured(): boolean {
  return import.meta.env.DEV || Boolean(import.meta.env.VITE_DRAFT_API_BASE_URL);
}

export async function improveDraftViaApi(
  params: ImproveDraftApiParams
): Promise<ImproveDraftApiResult> {
  const response = await fetch(draftApiUrl(), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });

  const payload = (await response.json()) as ImproveDraftApiResult | { error?: string };

  if (!response.ok) {
    const message =
      'error' in payload && payload.error ?
        payload.error
      : `Draft API failed (${response.status})`;
    throw new Error(message);
  }

  if (!('content' in payload) || !payload.content) {
    throw new Error('No draft returned from server');
  }

  return payload;
}
