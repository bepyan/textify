import { useRef, useState } from 'react';

import { PromptSuggestion, LogoIcon, Button } from '@fe/components/ui';
import { useExtractMutation } from '@fe/lib/extractor';
import { cn } from '@fe/lib/utils';

import { CopyButton } from './copy-button';
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
  const hasContent = content !== null;

  const extractMutation = useExtractMutation();

  // ----------------------------------------------------------------------------
  // handlers
  // ----------------------------------------------------------------------------

  const handleSubmit = async () => {
    const result = await extractMutation.mutateAsync(inputValue);
    setContent(result);
  };

  const handleClickSuggestion = (prompt: string) => {
    setInputValue(prompt);
    inputRef.current?.focus();
  };

  const handleReset = () => {
    setContent(null);
    setInputValue('');
  };

  return (
    <>
      <div className="absolute inset-0 w-full overflow-y-auto">
        <div className="container h-full">
          <>
            {hasContent ? (
              <div className="pt-header pb-footer">
                <TextifyPromptMessage content={content} />
              </div>
            ) : (
              <div className="flex h-full flex-col items-center gap-3 pt-[calc(max(20vh,2.5rem))]">
                <LogoIcon
                  className={cn(
                    'size-8',
                    extractMutation.isPending && 'animate-bounce',
                  )}
                />
                <h2 className="text-2xl font-bold">
                  {extractMutation.isPending
                    ? '잡아오는 중...'
                    : '무엇을 잡아올까요?'}
                </h2>
                {!extractMutation.isPending && (
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
                )}
              </div>
            )}
          </>
        </div>
      </div>
      <div className="absolute inset-x-0 bottom-0 z-10">
        <div className="container">
          {hasContent && (
            <div className="w-full">
              <div className="to-background h-10 bg-gradient-to-b from-transparent" />
              <div className="bg-background flex w-full items-center justify-between px-2 pb-3">
                <div>
                  <CopyButton text={content} />
                </div>
                <div>
                  <Button variant="mono" size="lg" onClick={handleReset}>
                    새로운 콘텐츠
                  </Button>
                </div>
              </div>
            </div>
          )}
          {!hasContent && (
            <TextifyPromptInput
              ref={inputRef}
              isLoading={extractMutation.isPending}
              value={inputValue}
              onValueChange={setInputValue}
              onSubmit={handleSubmit}
            />
          )}
        </div>
      </div>
    </>
  );
}
