import { ConvexReactClient } from 'convex/react';

function isLocalConvexUrl(url: string): boolean {
  try {
    const host = new URL(url).hostname;
    return host === 'localhost' || host === '127.0.0.1' || host === '::1';
  } catch {
    return false;
  }
}

export function getConvexUrl(): string | undefined {
  // In unit tests we default to "local grounded context" mode.
  // This avoids requiring a running Convex backend or a ConvexProvider.
  if (import.meta.env.MODE === 'test') return undefined;

  const url = import.meta.env.VITE_CONVEX_URL as string | undefined;
  const trimmed = url?.trim();
  if (!trimmed) return undefined;

  // A production bundle must never talk to loopback — that happens when
  // `.env.local` leaks into a deploy artifact or Vercel env is mis-set.
  if (import.meta.env.PROD && isLocalConvexUrl(trimmed)) {
    return undefined;
  }

  return trimmed;
}

export function getConvexDisplayHost(): string | null {
  const url = getConvexUrl();
  if (!url) return null;
  try {
    return new URL(url).host;
  } catch {
    return url;
  }
}

export function isConvexConfigured(): boolean {
  return Boolean(getConvexUrl());
}

let client: ConvexReactClient | null = null;

export function getConvexClient(): ConvexReactClient | null {
  const url = getConvexUrl();
  if (!url) return null;

  if (!client) {
    client = new ConvexReactClient(url);
  }
  return client;
}
