import { createRootRoute, Outlet } from '@tanstack/react-router';

import { Gnb } from '@fe/components/gnb';
import { LnbContainer } from '@fe/components/lnb';
import { Providers } from '@fe/components/providers';

const RootLayout = () => (
  <Providers>
    <div className="text-foreground bg-background isolate font-sans antialiased">
      <Gnb />
      <LnbContainer>
        <Outlet />
      </LnbContainer>
    </div>
  </Providers>
);

export const Route = createRootRoute({ component: RootLayout });
