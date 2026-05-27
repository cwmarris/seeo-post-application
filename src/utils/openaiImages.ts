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

/** Dev: Vite middleware at /api/openai/images. Prod: set VITE_IMAGE_API_BASE_URL to your proxy origin. */
function imagesApiUrl(): string {
  const base = (import.meta.env.VITE_IMAGE_API_BASE_URL as string | undefined)?.replace(
    /\/$/,
    ''
  );
  return `${base ?? ''}/api/openai/images`;
}

export async function generateVisualAsset(
  params: GenerateVisualAssetParams
): Promise<GenerateVisualAssetResult> {
  const response = await fetch(imagesApiUrl(), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      prompt: params.prompt,
      style: params.style,
      guidance: params.guidance?.trim() || undefined,
    }),
  });

  const payload = (await response.json()) as
    | GenerateVisualAssetResult
    | { error?: string };

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
