'use client';

import { SessionProvider } from 'next-auth/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { useState } from 'react';

// This component will wrap our entire application and provide all the necessary contexts.
export function AppProviders({ children }: { children: ReactNode }) {
  // We use useState to ensure the QueryClient is only created once per component lifecycle.
  // This is important to prevent re-creating the client on every render.
  const [queryClient] = useState(() => new QueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <SessionProvider>{children}</SessionProvider>
    </QueryClientProvider>
  );
}
