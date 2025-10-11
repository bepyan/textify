import { useNavigate, useRouter } from '@tanstack/react-router';
import { useState } from 'react';
import { toast } from 'sonner';

import { PromptSuggestion, LogoIcon } from '@fe/components/ui';
import { detectPlatform } from '@fe/lib/extractor/detect-platform';

import { TextifyPromptInput } from './textify-prompt-input';

const howToPrompts = [
  'https://youtube.com/watch?v=utImgpthqoo',
  'https://blog.naver.com/ranto28/224023632772',
];

export function TextifyIntro() {
  const navigate = useNavigate({ from: '/' });
  const [inputValue, setInputValue] = useState('');

  // ----------------------------------------------------------------------------
  // handlers
  // ----------------------------------------------------------------------------

  const handleSubmit = async (value = inputValue) => {
    const platform = detectPlatform(value);

    if (platform === 'unknown') {
      toast.error('지원되지 않는 플랫폼입니다', {
        description: '다른 링크를 입력해주세요.',
      });
      return;
    }

    await navigate({
      to: '/content',
      search: { url: value },
    });
  };

  const handleClickSuggestion = (prompt: string) => {
    setInputValue(prompt);
    void handleSubmit(prompt);
  };

  return (
    <>
      <div className="absolute inset-0 w-full overflow-y-auto">
        <div className="container h-full">
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
        </div>
      </div>
      <div className="absolute inset-x-0 bottom-0 z-10">
        <div className="container">
          <TextifyPromptInput
            value={inputValue}
            onValueChange={setInputValue}
            onSubmit={() => handleSubmit()}
          />
        </div>
      </div>
    </>
  );
}
