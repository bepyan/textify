import { createFileRoute } from '@tanstack/react-router';
import { useState } from 'react';

import { LogoIcon } from '@fe/components/icons';
import { TextifyPromptInput } from '@fe/components/textify-prompt-input';
import { Button, Skeleton } from '@fe/components/ui';
import { copyToClipboard } from '@fe/lib/copy';
import { useExtractMutation } from '@fe/lib/extractor';

export const Route = createFileRoute('/')({
  component: Page,
});

function Page() {
  const [content, setContent] = useState<string | null>(null);
  const extractMutation = useExtractMutation();

  const handleSubmit = async (value: string) => {
    const result = await extractMutation.mutateAsync(value);
    setContent(result);
  };

  return (
    <main className="h-full w-full">
      <div className="flex h-full max-h-[600px] min-h-[500px] w-full flex-col items-center justify-end">
        <LogoIcon className="size-8 fill-current" />
        <h2 className="mt-2 mb-6 text-2xl font-bold">무엇을 잡아올까요?</h2>
        <TextifyPromptInput onSubmit={handleSubmit} />
      </div>
      <div className="mt-20 space-y-2">
        {content ? (
          <>
            <Button variant="mono" onClick={() => copyToClipboard(content)}>
              Copy
            </Button>
            <pre className="rounded-2xl border p-4 text-sm whitespace-pre-wrap">
              {content}
            </pre>
          </>
        ) : (
          <Skeleton className="h-[400px] w-full" />
        )}
      </div>
    </main>
  );
}
