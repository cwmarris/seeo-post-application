import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { PostComposerView } from './PostComposerView';
import { getRLState } from '../utils/rlEngine';
import * as draftGeneration from '../utils/draftGeneration';

vi.mock('../utils/draftGeneration', () => ({
  generateDraftWithFallback: vi.fn(),
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

describe('PostComposerView', () => {
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  function renderComposer(onGoToOptimizer?: () => void) {
    return render(
      <PostComposerView
        onAddPost={vi.fn()}
        rlState={getRLState()}
        updateRlState={vi.fn()}
        onGoToOptimizer={onGoToOptimizer}
      />
    );
  }

  it('shows generation hint before a draft exists', () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => healthPayload,
      })
    );

    renderComposer();

    expect(screen.getByTestId('composer-generation-hint')).toBeInTheDocument();
    expect(screen.queryByTestId('composer-context-guide')).not.toBeInTheDocument();
    expect(screen.queryByTestId('model-indicator-banner')).not.toBeInTheDocument();
  });

  it('shows model banner, refinement context, and rate & train after generate', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => healthPayload,
      })
    );

    vi.mocked(draftGeneration.generateDraftWithFallback).mockResolvedValue({
      content: 'Draft body for testing.',
      replacedPhrases: [],
      wasFiltered: false,
      source: 'openai',
      model: 'gpt-4.1-mini',
    });

    renderComposer();

    fireEvent.click(screen.getByRole('button', { name: /generate draft/i }));

    await waitFor(() => {
      expect(screen.getByLabelText('Draft Content Editor')).toHaveValue('Draft body for testing.');
    });

    expect(screen.getByTestId('model-indicator-banner')).toHaveTextContent('gpt-5.5');
    expect(screen.getByTestId('model-indicator-banner')).toHaveTextContent('gpt-4.1-mini');
    expect(screen.getByTestId('composer-context-guide')).toBeInTheDocument();
    expect(screen.getByTestId('composer-refinement-section')).toBeInTheDocument();
    expect(screen.getByLabelText('Refinement context')).toBeInTheDocument();
    expect(screen.getByTestId('composer-rate-train-section')).toHaveTextContent(/Rate & train the post generator/i);
    expect(screen.getByRole('group', { name: /draft quality rating/i })).toBeInTheDocument();
  });

  it('links to RL optimizer when handler provided', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => healthPayload,
      })
    );

    vi.mocked(draftGeneration.generateDraftWithFallback).mockResolvedValue({
      content: 'Draft body.',
      replacedPhrases: [],
      wasFiltered: false,
      source: 'local',
    });

    const onGoToOptimizer = vi.fn();
    renderComposer(onGoToOptimizer);

    fireEvent.click(screen.getByRole('button', { name: /generate draft/i }));
    await screen.findByLabelText('Draft Content Editor');

    fireEvent.click(
      screen.getByRole('button', { name: /open rl engine & tuning for banned phrases/i })
    );
    expect(onGoToOptimizer).toHaveBeenCalledTimes(1);
  });
});
