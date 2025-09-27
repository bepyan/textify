import { createFileRoute } from '@tanstack/react-router';

import { LogoIcon } from '~/components/icons';
import { Skeleton } from '~/components/ui/skeleton';
import { Textarea } from '~/components/ui/textarea';

export const Route = createFileRoute('/')({
  component: Page,
});

function Page() {
  return (
    <main className="h-full w-full">
      <div className="flex h-full max-h-[920px] min-h-[400px] w-full flex-col items-center justify-center">
        <LogoIcon className="size-8 fill-current" />
        <h2 className="mt-2 mb-6 text-2xl font-bold">무엇을 잡아올까요?</h2>
        <Textarea variant="lg" className="max-w-[700px]" />
      </div>
      <Skeleton className="size-full" />
    </main>
  );
}
