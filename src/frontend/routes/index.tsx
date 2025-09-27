import { createFileRoute } from '@tanstack/react-router';

import { LogoIcon } from '@fe/components/icons';
import { TextifyPromptInput } from '@fe/components/textify-prompt-input';
import { Skeleton } from '@fe/components/ui/skeleton';

export const Route = createFileRoute('/')({
  component: Page,
});

function Page() {
  return (
    <main className="h-full w-full">
      <div className="flex h-full max-h-[920px] min-h-[400px] w-full flex-col items-center justify-center">
        <LogoIcon className="size-8 fill-current" />
        <h2 className="mt-2 mb-6 text-2xl font-bold">무엇을 잡아올까요?</h2>
        <TextifyPromptInput />
      </div>
      <Skeleton className="size-full" />
    </main>
  );
}
