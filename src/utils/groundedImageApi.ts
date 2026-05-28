export interface ExtractGroundedImageParams {
  fileName: string;
  mimeType: string;
  imageBase64: string;
}

export interface ExtractGroundedImageResult {
  textContent: string;
  model: string;
}

/** Dev: Vite middleware. Prod: optional VITE_GROUNDED_IMAGE_API_BASE_URL or same origin. */
function groundedImageApiUrl(): string {
  const base = (import.meta.env.VITE_GROUNDED_IMAGE_API_BASE_URL as string | undefined)?.replace(
    /\/$/,
    ''
  );
  return `${base ?? ''}/api/openai/grounded-image`;
}

export async function extractGroundedImageText(
  params: ExtractGroundedImageParams
): Promise<ExtractGroundedImageResult> {
  const response = await fetch(groundedImageApiUrl(), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });

  const payload = (await response.json()) as ExtractGroundedImageResult | { error?: string };

  if (!response.ok) {
    const message =
      'error' in payload && payload.error
        ? payload.error
        : `Image extraction failed (${response.status})`;
    throw new Error(message);
  }

  if (!('textContent' in payload) || !payload.textContent?.trim()) {
    throw new Error('No text returned from image extraction');
  }

  return payload;
}

export async function fileToBase64DataUrl(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.length; i += 1) {
    binary += String.fromCharCode(bytes[i]!);
  }
  const base64 = btoa(binary);
  const mime = file.type.trim().toLowerCase() || 'image/jpeg';
  return `data:${mime};base64,${base64}`;
}
