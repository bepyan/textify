'use client';

import { ArrowUp } from 'lucide-react';
import { useState } from 'react';

import {
  Button,
  PromptInput,
  PromptInputAction,
  PromptInputActions,
  PromptInputTextarea,
  PromptSuggestion,
} from '@fe/components/ui';
import { cn } from '@fe/lib/utils';

const howToPrompts = [
  'https://youtube.com/watch?v=utImgpthqoo',
  'https://blog.naver.com/ranto28/224023632772',
];

export function TextifyPromptInput({
  onSubmit,
}: {
  onSubmit?: (inputValue: string) => Promise<void>;
}) {
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleValueChange = (value: string) => {
    setInputValue(value);
  };

  const handleSubmit = async () => {
    if (!inputValue.trim()) return;

    setIsLoading(true);
    await Promise.all([
      onSubmit?.(inputValue),
      new Promise((resolve) => setTimeout(resolve, 2000)),
    ]);
    setIsLoading(false);
  };

  return (
    <div className="flex w-full flex-col items-center space-y-4">
      <PromptInput
        value={inputValue}
        onValueChange={handleValueChange}
        isLoading={isLoading}
        onSubmit={() => handleSubmit()}
        className="w-full max-w-(--breakpoint-md)"
      >
        <PromptInputTextarea autoFocus placeholder="링크를 입력해주세요..." />
        <PromptInputActions className="justify-end pt-2">
          <PromptInputAction tooltip={'정보 추출하기'}>
            <Button
              variant="mono"
              size="icon"
              className="h-8 w-8 rounded-full"
              onClick={() => handleSubmit()}
              disabled={isLoading}
            >
              <ArrowUp
                className={cn(
                  'size-5 transition-all duration-400 ease-in-out',
                  isLoading && 'rotate-180',
                )}
              />
            </Button>
          </PromptInputAction>
        </PromptInputActions>
      </PromptInput>
      <div className="w-full max-w-(--breakpoint-md) space-y-1">
        {howToPrompts.map((prompt) => (
          <PromptSuggestion
            key={prompt}
            className="text-left"
            onClick={() => setInputValue(prompt)}
          >
            {prompt}
          </PromptSuggestion>
        ))}
      </div>
    </div>
  );
}
