import { ConvexReactClient } from 'convex/react';

export function getConvexUrl(): string | undefined {
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
