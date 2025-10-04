import { useRef, useState } from 'react';

import { Skeleton, PromptSuggestion, LogoIcon } from '@fe/components/ui';
import { useExtractMutation } from '@fe/lib/extractor';

import { TextifyPromptInput } from './textify-prompt-input';
import { TextifyPromptMessage } from './textify-prompt-message';

const howToPrompts = [
  'https://youtube.com/watch?v=utImgpthqoo',
  'https://blog.naver.com/ranto28/224023632772',
];

export function TextifyApp() {
  const inputRef = useRef<HTMLTextAreaElement | null>(null);
  const [inputValue, setInputValue] = useState('');
  const [content, setContent] = useState<string | null>(null);

  const extractMutation = useExtractMutation();

  // ----------------------------------------------------------------------------
  // handlers
  // ----------------------------------------------------------------------------

  const handleSubmit = async () => {
    const result = await extractMutation.mutateAsync(inputValue);
    setContent(JSON.stringify(result, null, 2));
  };

  const handleClickSuggestion = (prompt: string) => {
    setInputValue(prompt);
    inputRef.current?.focus();
  };

  return (
    <>
      <div className="absolute inset-0 w-full overflow-y-auto">
        <div className="pt-header pb-footer container h-full">
          {extractMutation.isPending ? (
            <>
              <Skeleton className="h-full w-full" />
            </>
          ) : (
            <>
              {content === null ? (
                <div className="flex h-full flex-col items-center gap-3 pt-[calc(max(20vh,2.5rem))]">
                  <LogoIcon className="size-8" />
                  <h2 className="text-2xl font-bold">무엇을 잡아올까요?</h2>
                  <div className="flex flex-col gap-1">
                    {howToPrompts.map((prompt) => (
                      <PromptSuggestion
                        key={prompt}
                        className="justify-center"
                        onClick={() => handleClickSuggestion(prompt)}
                      >
                        {prompt}
                      </PromptSuggestion>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="pb-footer">
                  <TextifyPromptMessage content={content} />
                </div>
              )}
            </>
          )}
        </div>
      </div>
      <div className="absolute inset-x-0 bottom-0 z-10">
        <div className="container flex flex-col items-center space-y-4">
          <TextifyPromptInput
            ref={inputRef}
            isLoading={extractMutation.isPending}
            value={inputValue}
            onValueChange={setInputValue}
            onSubmit={handleSubmit}
          />
        </div>
      </div>
    </>
  );
}
