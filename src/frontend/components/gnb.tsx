import { SidebarIcon } from 'lucide-react';

import { Button } from '@fe/components/ui';

export function Gnb() {
  return (
    <header className="top-safe-offset-2 fixed left-2 z-50 flex flex-row gap-0.5 p-1">
      <div className="bg-accent/50 blur-fallback:bg-accent pointer-events-none absolute inset-0 right-auto -z-10 w-[42px] rounded-md backdrop-blur-xs transition-[background-color,width] delay-125 duration-125" />
      <Button size="icon" variant="ghost">
        <SidebarIcon />
      </Button>
    </header>
  );
}
