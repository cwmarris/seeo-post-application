import { cleanup, render, screen } from '@testing-library/react';
import { describe, expect, it, vi, afterEach } from 'vitest';
import { ModelIndicator } from './ModelIndicator';

describe('ModelIndicator', () => {
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it('renders draft model from /api/health', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          ok: true,
          timestamp: new Date().toISOString(),
          version: 'test',
          draftModel: 'gpt-5.5',
          imageModel: 'gpt-image-1',
          groundedImageModel: 'gpt-5.5',
          openai: { configured: true, message: 'OpenAI API key configured.' },
        }),
      })
    );

    render(<ModelIndicator lastGeneratedModel="gpt-4.1-mini" />);

    expect(await screen.findByTestId('model-indicator')).toHaveTextContent('Draft model: gpt-5.5');
    expect(screen.getByText(/Last generated with:/)).toHaveTextContent('gpt-4.1-mini');
  });
});
