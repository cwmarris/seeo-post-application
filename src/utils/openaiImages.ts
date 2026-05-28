export interface GenerateVisualAssetParams {
  prompt: string;
  style: string;
  guidance?: string;
}

export interface GenerateVisualAssetResult {
  imageDataUrl: string;
  model: string;
  revisedPrompt?: string;
}

type ImageApiErrorPayload = { error?: string };
type ImageApiSuccessPayload = GenerateVisualAssetResult;

/** Dev: Vite middleware at /api/openai/images. Prod: set VITE_IMAGE_API_BASE_URL to your proxy origin. */
export function imagesApiUrl(): string {
  const base = (import.meta.env.VITE_IMAGE_API_BASE_URL as string | undefined)?.replace(
    /\/$/,
    ''
  );
  return `${base ?? ''}/api/openai/images`;
}

function imageApiMisconfigHint(status: number, bodyText: string): string | null {
  const looksLikeHtml =
    bodyText.trimStart().startsWith('<!') || bodyText.toLowerCase().includes('<html');
  if (status === 404 || (looksLikeHtml && status >= 400)) {
    const base = import.meta.env.VITE_IMAGE_API_BASE_URL as string | undefined;
    if (base) {
      return `Image API not found at ${imagesApiUrl()}. Check VITE_IMAGE_API_BASE_URL or deploy POST /api/openai/images.`;
    }
    return 'Image API route not found. Deploy api/openai/images.ts (Vercel) or run npm run dev for the Vite proxy.';
  }
  return null;
}

async function parseImageApiPayload(
  response: Response
): Promise<ImageApiSuccessPayload | ImageApiErrorPayload> {
  const text = await response.text();
  if (!text.trim()) {
    return { error: `Image API returned empty body (${response.status})` };
  }
  try {
    return JSON.parse(text) as ImageApiSuccessPayload | ImageApiErrorPayload;
  } catch {
    const misconfig = imageApiMisconfigHint(response.status, text);
    if (misconfig) return { error: misconfig };
    const snippet = text.replace(/\s+/g, ' ').slice(0, 120);
    return {
      error: `Image API returned non-JSON (${response.status}): ${snippet}`,
    };
  }
}

export async function generateVisualAsset(
  params: GenerateVisualAssetParams
): Promise<GenerateVisualAssetResult> {
  const prompt = params.prompt.trim();
  if (!prompt) {
    throw new Error('Enter a visual prompt before generating.');
  }

  let response: Response;
  try {
    response = await fetch(imagesApiUrl(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt,
        style: params.style,
        guidance: params.guidance?.trim() || undefined,
      }),
    });
  } catch (err) {
    const detail = err instanceof Error ? err.message : 'network error';
    throw new Error(
      `Could not reach image API at ${imagesApiUrl()} (${detail}). Check your connection or VITE_IMAGE_API_BASE_URL.`
    );
  }

  const payload = await parseImageApiPayload(response);

  if (!response.ok) {
    const message =
      'error' in payload && payload.error
        ? payload.error
        : `Image generation failed (${response.status})`;
    throw new Error(message);
  }

  if (!('imageDataUrl' in payload) || !payload.imageDataUrl) {
    throw new Error('No image returned from server');
  }

  return payload;
}

/** @deprecated Use fetchOpenAIHealth() */
export function isOpenAIImagesConfigured(): boolean {
  return Boolean(import.meta.env.VITE_IMAGE_API_BASE_URL);
}
