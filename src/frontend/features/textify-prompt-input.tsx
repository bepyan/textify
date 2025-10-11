'use client';

import { ArrowUp } from 'lucide-react';

import {
  Button,
  PromptInput,
  PromptInputActions,
  PromptInputTextarea,
} from '@fe/components/ui';
import { cn } from '@fe/lib/utils';

export function TextifyPromptInput({
  ref,
  isLoading,
  value,
  onValueChange,
  onSubmit,
}: {
  ref?: React.RefObject<HTMLTextAreaElement | null>;
  isLoading?: boolean;
  value?: string;
  onValueChange?: (value: string) => void;
  onSubmit?: () => void;
}) {
  const disabled = isLoading || value?.trim() === '';

  return (
    <PromptInput
      value={value}
      onValueChange={onValueChange}
      isLoading={isLoading}
      onSubmit={() => onSubmit?.()}
      className="rounded-b-none border-8 border-b-0 pb-4"
    >
      <PromptInputTextarea ref={ref} placeholder="링크를 입력해주세요..." />
      <PromptInputActions>
        <div></div>
        <div className="flex items-center gap-2">
          <Button
            variant="mono"
            mode="icon"
            shape="circle"
            onClick={() => onSubmit?.()}
            disabled={disabled}
          >
            <ArrowUp
              className={cn(
                'transition-all duration-400 ease-in-out',
                isLoading && 'rotate-180',
              )}
            />
          </Button>
        </div>
      </PromptInputActions>
    </PromptInput>
  );
}
