import type { ReactNode } from 'react';
import { ConvexProvider } from 'convex/react';
import { getConvexClient } from './client';
import { ConvexProviderReady } from './convexAvailability';

interface ConvexAppProviderProps {
  children: ReactNode;
}

export function ConvexAppProvider({ children }: ConvexAppProviderProps) {
  const client = getConvexClient();
  if (!client) {
    return <ConvexProviderReady ready={false}>{children}</ConvexProviderReady>;
  }
  return (
    <ConvexProviderReady ready={true}>
      <ConvexProvider client={client}>{children}</ConvexProvider>
    </ConvexProviderReady>
  );
}
