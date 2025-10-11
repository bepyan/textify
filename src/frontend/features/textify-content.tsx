import { Link } from '@tanstack/react-router';
import { Suspense } from 'react';

import { CopyButton } from '@fe/components/copy-button';
import { ErrorBoundary } from '@fe/components/error-boundary';
import { LogoIcon, Button } from '@fe/components/ui';
import { useSuspenseExtract } from '@fe/lib/extractor';

import { TextifyPromptMessage } from './textify-prompt-message';

export type TextifyContentProps = {
  url: string;
};

export function TextifyContent(props: TextifyContentProps) {
  return (
    <ErrorBoundary>
      <Suspense fallback={<TextifyLoading />}>
        <TextifyContentDetail {...props} />
      </Suspense>
    </ErrorBoundary>
  );
}

function TextifyContentDetail({ url }: TextifyContentProps) {
  const { data: content } = useSuspenseExtract(url);

  return (
    <>
      <div className="absolute inset-0 w-full overflow-y-auto">
        <div className="pt-header pb-footer container">
          <TextifyPromptMessage content={content} />
        </div>
      </div>
      <div className="absolute inset-x-0 bottom-0 z-10">
        <div className="container">
          <div className="w-full">
            <div className="to-background h-10 bg-gradient-to-b from-transparent" />
            <div className="bg-background flex w-full items-center justify-between px-2 pb-3">
              <div>
                <CopyButton text={content} />
              </div>
              <div>
                <Button variant="mono" size="lg" render={<Link to="/" />}>
                  새로운 콘텐츠
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function TextifyLoading() {
  return (
    <div className="absolute inset-0 w-full overflow-y-auto">
      <div className="container h-full">
        <div className="flex h-full flex-col items-center gap-3 pt-[calc(max(20vh,2.5rem))]">
          <LogoIcon className="size-8 animate-bounce" />
          <h2 className="text-2xl font-bold">잡아오는 중...</h2>
        </div>
      </div>
    </div>
  );
}
