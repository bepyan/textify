import { createRootRoute, Outlet } from '@tanstack/react-router';

import { Gnb } from '~/components/gnb';

const RootLayout = () => (
  <div className="text-foreground bg-background isolate font-sans antialiased">
    <Gnb />
    <div className="grid min-h-dvh">
      <div className="pt-header relative container mx-auto">
        <Outlet />
      </div>
    </div>
  </div>
);

export const Route = createRootRoute({ component: RootLayout });
