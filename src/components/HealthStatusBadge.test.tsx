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
    render(<HealthStatusBadge intervalMs={10_000} label="Christchurch Hub Connected" />);

    expect(await screen.findByText(/Connected/)).toBeInTheDocument();
    expect(screen.getByTestId('health-status-badge')).toHaveAttribute('title', '');
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
    render(<HealthStatusBadge intervalMs={10_000} />);

    expect(screen.getByText(/Disconnected/)).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByTestId('health-status-badge')).toHaveAttribute('title', 'Network down');
    });
  });
});

