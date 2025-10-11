import { Link } from '@tanstack/react-router';
import { PanelLeftDashedIcon, PanelLeftIcon } from 'lucide-react';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { Button, LogoIcon } from '@fe/components/ui';
import { cn } from '@fe/lib/utils';

// ============================================================================
// LNB Store
// ============================================================================

export const useLnbStore = create<{
  isOpen: boolean;
  historyList: string[];
  open: () => void;
  close: () => void;
  toggle: () => void;
}>()(
  persist(
    (set) => ({
      isOpen: false,
      historyList: [],
      open: () => set({ isOpen: true }),
      close: () => set({ isOpen: false }),
      toggle: () => set((v) => ({ isOpen: !v.isOpen })),
    }),
    {
      name: 'lnb-store',
    },
  ),
);

// ============================================================================
// LNB Components
// ============================================================================

export function LnbContainer({ children }: { children: React.ReactNode }) {
  const isLnbOpen = useLnbStore((v) => v.isOpen);
  const closeLnb = useLnbStore((v) => v.close);

  // TODO: Focus Guard
  return (
    <div className="overflow-x-hidden">
      <div
        className={cn(
          'relative h-dvh transition-transform duration-500 ease-[cubic-bezier(.22,1,.36,1)]',
          isLnbOpen && 'translate-x-lnb',
        )}
      >
        <div className="fixed top-0 left-0 h-dvh" aria-hidden={!isLnbOpen}>
          <LnbNav />
        </div>
        {isLnbOpen && (
          <div
            className="fixed inset-0"
            onClick={() => closeLnb()}
            aria-hidden
          />
        )}
        <div
          className={cn(
            'pt-header relative h-full transition-all duration-200 ease-out',
            isLnbOpen && 'pointer-events-none opacity-50 blur-[3px]',
          )}
          aria-hidden={isLnbOpen}
        >
          {children}
        </div>
      </div>
    </div>
  );
}

function LnbNav() {
  const historyList = useLnbStore((v) => v.historyList);
  const closeLnb = useLnbStore((v) => v.close);

  return (
    <nav className="w-lnb pt-safe-offset-top pb-safe-offset-5 absolute top-0 right-0 h-full space-y-1 px-5">
      <div className="flex items-center gap-1">
        <LogoIcon className="size-6" />
        <h2 className="text-lg font-black">TEXTIFY</h2>
      </div>
      <Button
        size="lg"
        variant="mono"
        className="w-full"
        render={<Link to="/" />}
        onClick={() => closeLnb()}
      >
        새로운 콘텐츠
      </Button>
      <ul className="mt-1 space-y-1 overflow-x-hidden overflow-y-auto pb-10 text-sm">
        {historyList.length === 0 ? (
          <li className="text-muted-foreground">
            <span>아직 사용한 내역이 없어요.</span>
          </li>
        ) : (
          historyList.map((item, index) => (
            <li key={`${index}-${item}`}>{item}</li>
          ))
        )}
      </ul>
    </nav>
  );
}

export function LnbButton() {
  const { isOpen, toggle } = useLnbStore();

  return (
    <Button mode="icon" variant="secondary" onClick={toggle}>
      {isOpen ? <PanelLeftDashedIcon /> : <PanelLeftIcon />}
    </Button>
  );
}
