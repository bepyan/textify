import { createRootRoute, Outlet } from '@tanstack/react-router';
import { Toaster } from 'sonner';

import { ErrorBoundary } from '@fe/components/error-boundary';
import { Gnb } from '@fe/features/gnb';
import { LnbContainer } from '@fe/features/lnb';
import { Providers } from '@fe/features/providers';

const RootLayout = () => (
  <Providers>
    <div className="text-foreground bg-background isolate font-sans antialiased">
      <Gnb />
      <LnbContainer>
        <ErrorBoundary>
          <Outlet />
        </ErrorBoundary>
      </LnbContainer>
    </div>
    <Toaster position="top-center" richColors />
  </Providers>
);

export const Route = createRootRoute({ component: RootLayout });
