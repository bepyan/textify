import { Link, useLocation } from '@tanstack/react-router';
import { PanelLeftDashedIcon, PanelLeftIcon, TrashIcon } from 'lucide-react';
import { create } from 'zustand';

import {
  Button,
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  LogoIcon,
} from '@fe/components/ui';
import { cn } from '@fe/lib/utils';

import {
  categorizeHistory,
  type HistoryItem,
  useHistoryStore,
} from './history-store';

// ============================================================================
// LNB Store
// ============================================================================

export const useLnbStore = create<{
  isOpen: boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;
}>((set) => ({
  isOpen: false,
  open: () => set({ isOpen: true }),
  close: () => set({ isOpen: false }),
  toggle: () => set((v) => ({ isOpen: !v.isOpen })),
}));

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
  const historyList = useHistoryStore((v) => v.list);
  const closeLnb = useLnbStore((v) => v.close);

  const categorizedHistoryList = categorizeHistory(historyList);

  return (
    <nav className="w-lnb pt-safe-offset-top absolute top-0 right-0 flex h-full flex-col gap-4 pb-10">
      <div className="px-4">
        <h2 className="inline-flex items-center gap-1 text-lg font-black">
          <LogoIcon className="size-6" />
          TEXTIFY
        </h2>
        <Button
          size="lg"
          variant="mono"
          className="w-full"
          render={<Link to="/" />}
          onClick={closeLnb}
        >
          새로운 콘텐츠
        </Button>
      </div>
      <div className="flex-1 space-y-4 overflow-x-hidden overflow-y-auto pb-10 text-sm">
        <LnbNavSection title="오늘" items={categorizedHistoryList.today} />
        <LnbNavSection
          title="최근 7일"
          items={categorizedHistoryList.last7Days}
        />
        <LnbNavSection title="이전" items={categorizedHistoryList.older} />
      </div>
      <div className="px-4">
        <LnbFooter />
      </div>
    </nav>
  );
}

function LnbNavSection({
  title,
  items,
}: {
  title: string;
  items: Array<{ id: string; url: string; createdAt: string }>;
}) {
  if (items.length === 0) return null;

  return (
    <div>
      <h3 className="text-muted-foreground mb-1 px-4 text-xs font-semibold">
        {title}
      </h3>
      <ul className="px-2">
        {items.map((item) => (
          <li key={item.id}>
            <LnbNavItem item={item} />
          </li>
        ))}
      </ul>
    </div>
  );
}

function LnbNavItem({ item }: { item: HistoryItem }) {
  const closeLnb = useLnbStore((v) => v.close);
  const location = useLocation();

  const isSelected = location.search.url === item.url;

  return (
    <Button
      variant={isSelected ? 'secondary' : 'ghost'}
      className="w-full max-w-full truncate"
      render={<Link to="/content" search={{ url: item.url }} />}
      onClick={closeLnb}
    >
      <span className="truncate">{item.url}</span>
    </Button>
  );
}

function LnbFooter() {
  const handleClearHistory = useHistoryStore((v) => v.clear);

  return (
    <div>
      <Dialog>
        <DialogTrigger render={<Button variant="secondary" mode="icon" />}>
          <TrashIcon />
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>기록 삭제</DialogTitle>
            <DialogDescription>
              모든 검색 기록이 삭제되며 되돌릴 수 없습니다.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose
              render={<Button variant="secondary" className="flex-1" />}
            >
              취소
            </DialogClose>
            <DialogClose
              render={<Button className="flex-1" />}
              onClick={handleClearHistory}
            >
              확인
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ----------------------------------------------------------------------------
// External Components
// ----------------------------------------------------------------------------

export function LnbButton() {
  const { isOpen, toggle } = useLnbStore();

  return (
    <Button mode="icon" variant="secondary" onClick={toggle}>
      {isOpen ? <PanelLeftDashedIcon /> : <PanelLeftIcon />}
    </Button>
  );
}
