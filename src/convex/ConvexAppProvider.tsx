import type { ReactNode } from 'react';
import { ConvexProvider } from 'convex/react';
import { getConvexClient } from './client';

interface ConvexAppProviderProps {
  children: ReactNode;
}

export function ConvexAppProvider({ children }: ConvexAppProviderProps) {
  const client = getConvexClient();
  if (!client) {
    return <>{children}</>;
  }
  return <ConvexProvider client={client}>{children}</ConvexProvider>;
}
