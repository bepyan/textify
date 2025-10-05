import { SidebarIcon } from 'lucide-react';

import { Button } from '@fe/components/ui';

export function Gnb() {
  return (
    <header className="top-safe-offset-2 absolute left-2 z-50 flex flex-row gap-0.5 p-1">
      <Button mode="icon" variant="secondary">
        <SidebarIcon />
      </Button>
    </header>
  );
}
