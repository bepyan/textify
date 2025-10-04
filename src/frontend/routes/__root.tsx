import { createRootRoute, Outlet } from '@tanstack/react-router';

import { Gnb } from '@fe/components/gnb';
import { Providers } from '@fe/components/providers';

const RootLayout = () => (
  <Providers>
    <div className="text-foreground bg-background isolate font-sans antialiased">
      <Gnb />
      <main className="flex h-dvh w-full flex-col">
        <Outlet />
      </main>
    </div>
  </Providers>
);

export const Route = createRootRoute({ component: RootLayout });
