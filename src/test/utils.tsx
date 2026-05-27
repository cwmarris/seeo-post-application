import React, { type ReactElement } from 'react';
import { render, type RenderOptions } from '@testing-library/react';

type WrapperProps = { children: React.ReactNode };

function Wrapper({ children }: WrapperProps) {
  return <>{children}</>;
}

export function renderApp(ui: ReactElement, options?: Omit<RenderOptions, 'wrapper'>) {
  return render(ui, { wrapper: Wrapper, ...options });
}

