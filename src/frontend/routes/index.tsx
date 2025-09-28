import { createFileRoute } from '@tanstack/react-router';

import { LogoIcon } from '@fe/components/icons';
import { TextifyPromptInput } from '@fe/components/textify-prompt-input';
import { Skeleton } from '@fe/components/ui/skeleton';
import { client } from '@fe/lib/api';

export const Route = createFileRoute('/')({
  component: Page,
});

function Page() {
  const handleSubmit = async (value: string) => {
    const res = await client.api.extract.$get({
      query: {
        name: value,
      },
    });
    const data = await res.json();
    console.log(data);
  };

  return (
    <main className="h-full w-full">
      <div className="flex h-full max-h-[920px] min-h-[400px] w-full flex-col items-center justify-center">
        <LogoIcon className="size-8 fill-current" />
        <h2 className="mt-2 mb-6 text-2xl font-bold">무엇을 잡아올까요?</h2>
        <TextifyPromptInput onSubmit={handleSubmit} />
      </div>
      <Skeleton className="size-full" />
    </main>
  );
}
