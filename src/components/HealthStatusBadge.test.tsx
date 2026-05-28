import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { HealthStatusBadge } from './HealthStatusBadge';

function mockFetchOk() {
  return vi.fn().mockResolvedValue({
    ok: true,
    status: 200,
    json: vi.fn().mockResolvedValue({
      ok: true,
      timestamp: new Date().toISOString(),
      version: 'test',
      draftModel: 'gpt-5.5',
      imageModel: 'gpt-image-1',
      groundedImageModel: 'gpt-5.5',
      openai: { configured: true, message: 'OpenAI API key configured.' },
    }),
  });
}

describe('HealthStatusBadge', () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
  });

  afterEach(() => {
    cleanup();
  });

  it('shows Connected after successful /api/health fetch', async () => {
    vi.stubGlobal('fetch', mockFetchOk());
    render(<HealthStatusBadge intervalMs={10_000} label="seeo Post Application" />);

    expect(await screen.findByText(/Connected/)).toBeInTheDocument();
    expect(screen.getByTestId('health-status-badge')).toHaveAttribute(
      'title',
      'Draft model: gpt-5.5'
    );
  });

  it('polls /api/health on an interval', async () => {
    vi.useFakeTimers();
    const fetchMock = mockFetchOk();
    vi.stubGlobal('fetch', fetchMock);
    render(<HealthStatusBadge intervalMs={5_000} />);

    await Promise.resolve();
    await Promise.resolve();
    expect(fetchMock).toHaveBeenCalledTimes(1);

    await vi.advanceTimersByTimeAsync(5_000);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    vi.useRealTimers();
  });

  it('shows Disconnected and tooltip on error', async () => {
    const fetchMock = vi.fn().mockRejectedValue(new Error('Network down'));
    vi.stubGlobal('fetch', fetchMock);
    render(<HealthStatusBadge intervalMs={10_000} label="seeo Post Application" />);

    expect(screen.getByText(/Disconnected/)).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByTestId('health-status-badge')).toHaveAttribute('title', 'Network down');
    });
  });

  it('does not imply connectedness in the label', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Down')));
    render(<HealthStatusBadge intervalMs={10_000} label="seeo Post Application" />);

    expect(screen.getByTestId('health-status-badge').textContent).toMatch(/seeo Post Application — Disconnected/);
    expect(screen.getByTestId('health-status-badge').textContent).not.toMatch(/seeo Post Application Connected/);
  });
});

