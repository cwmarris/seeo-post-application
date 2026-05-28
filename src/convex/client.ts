import { ConvexReactClient } from 'convex/react';

export function getConvexUrl(): string | undefined {
  // In unit tests we default to "local grounded context" mode.
  // This avoids requiring a running Convex backend or a ConvexProvider.
  if (import.meta.env.MODE === 'test') return undefined;
  const url = import.meta.env.VITE_CONVEX_URL as string | undefined;
  return url?.trim() || undefined;
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
