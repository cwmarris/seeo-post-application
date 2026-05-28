import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import {
  buildImagePrompt,
  formatOpenAIImageError,
  generateOpenAIImageFromBody,
} from './openaiImages.js';

describe('buildImagePrompt', () => {
  it('applies style prefix and optional guidance', () => {
    const prompt = buildImagePrompt('Warehouse safety zone', 'vector', 'Warmer lighting');
    expect(prompt).toContain('Minimalist flat vector');
    expect(prompt).toContain('Warehouse safety zone');
    expect(prompt).toContain('Warmer lighting');
  });
});

describe('formatOpenAIImageError', () => {
  it('maps billing hard limit to actionable copy', () => {
    expect(formatOpenAIImageError('Billing hard limit has been reached.')).toContain(
      'billing limit'
    );
  });

  it('passes through unknown errors', () => {
    expect(formatOpenAIImageError('Something else')).toBe('Something else');
  });
});

describe('generateOpenAIImageFromBody', () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: true,
        status: 200,
        json: async () => ({
          data: [{ b64_json: 'aGVsbG8=', revised_prompt: 'refined' }],
        }),
      }))
    );
  });

  afterEach(() => {
    vi.stubGlobal('fetch', originalFetch);
    vi.restoreAllMocks();
  });

  it('returns 503 when API key is missing', async () => {
    const result = await generateOpenAIImageFromBody(
      { prompt: 'A red circle' },
      '',
      'gpt-image-1'
    );
    expect(result.status).toBe(503);
    expect('error' in result.body).toBe(true);
  });

  it('returns 400 when prompt is empty', async () => {
    const result = await generateOpenAIImageFromBody({ prompt: '   ' }, 'sk-test', 'gpt-image-1');
    expect(result.status).toBe(400);
  });

  it('returns image data URL when OpenAI succeeds', async () => {
    const result = await generateOpenAIImageFromBody(
      { prompt: 'A red circle', style: 'editorial' },
      'sk-test',
      'gpt-image-1'
    );

    expect(result.status).toBe(200);
    expect(result.body).toMatchObject({
      imageDataUrl: 'data:image/png;base64,aGVsbG8=',
      model: 'gpt-image-1',
      revisedPrompt: 'refined',
    });
  });

  it('formats OpenAI billing errors', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: false,
        status: 400,
        json: async () => ({
          error: { message: 'Billing hard limit has been reached.' },
        }),
      }))
    );

    const result = await generateOpenAIImageFromBody(
      { prompt: 'A red circle' },
      'sk-test',
      'gpt-image-1'
    );

    expect(result.status).toBe(400);
    expect('error' in result.body && result.body.error).toContain('billing limit');
  });
});
