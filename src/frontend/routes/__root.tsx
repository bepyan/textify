import { createRootRoute, Outlet } from '@tanstack/react-router';

import { Gnb } from '@fe/components/gnb';
import { Providers } from '@fe/components/providers';

const RootLayout = () => (
  <Providers>
    <div className="text-foreground bg-background isolate font-sans antialiased">
      <Gnb />
      <div className="grid min-h-dvh">
        <div className="pt-header relative container mx-auto">
          <Outlet />
        </div>
      </div>
    </div>
  </Providers>
);

export const Route = createRootRoute({ component: RootLayout });
