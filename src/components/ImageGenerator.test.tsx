import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ImageGenerator } from './ImageGenerator';
import * as openaiImages from '../utils/openaiImages';

vi.mock('../utils/openaiImages', () => ({
  generateVisualAsset: vi.fn(),
}));

const healthPayload = {
  ok: true,
  timestamp: new Date().toISOString(),
  version: 'test',
  draftModel: 'gpt-5.5',
  imageModel: 'gpt-image-2',
  groundedImageModel: 'gpt-5.5',
  openai: { configured: true, message: 'OpenAI API key configured.' },
};

describe('ImageGenerator', () => {
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  function renderGenerator() {
    return render(
      <ImageGenerator
        postContent="Warehouse safety post"
        selectedImage={undefined}
        setSelectedImage={vi.fn()}
      />
    );
  }

  it('shows image model from /api/health in connecting log', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => healthPayload,
      })
    );

    vi.mocked(openaiImages.generateVisualAsset).mockImplementation(
      () =>
        new Promise((resolve) => {
          window.setTimeout(
            () =>
              resolve({
                imageDataUrl: 'data:image/png;base64,abc',
                model: 'gpt-image-2',
              }),
            2000
          );
        })
    );

    renderGenerator();

    fireEvent.click(screen.getByRole('button', { name: /generate visual asset/i }));

    await waitFor(() => {
      expect(screen.getByText(/Connecting to OpenAI Images API \(gpt-image-2\)/)).toBeInTheDocument();
    });
    expect(screen.getByText('gpt-image-2')).toBeInTheDocument();
  });

  it('uses model returned from image API in success log', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          ...healthPayload,
          imageModel: 'gpt-image-2',
        }),
      })
    );

    vi.mocked(openaiImages.generateVisualAsset).mockResolvedValue({
      imageDataUrl: 'data:image/png;base64,abc',
      model: 'gpt-image-2',
      revisedPrompt: 'Refined warehouse scene',
    });

    renderGenerator();

    fireEvent.click(screen.getByRole('button', { name: /generate visual asset/i }));

    await waitFor(
      () => {
        expect(screen.getByText(/Model refined prompt:/)).toBeInTheDocument();
      },
      { timeout: 3000 }
    );
  });
});
