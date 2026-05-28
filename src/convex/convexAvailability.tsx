import { createContext, useContext, type ReactNode } from 'react';

const ConvexProviderReadyContext = createContext(false);

export function ConvexProviderReady({ ready, children }: { ready: boolean; children: ReactNode }) {
  return (
    <ConvexProviderReadyContext.Provider value={ready}>{children}</ConvexProviderReadyContext.Provider>
  );
}

export function useConvexProviderReady(): boolean {
  return useContext(ConvexProviderReadyContext);
}
