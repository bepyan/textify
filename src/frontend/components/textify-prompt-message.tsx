'use client';

import { CheckIcon, CopyIcon } from 'lucide-react';
import { useState } from 'react';

import {
  Button,
  Message,
  MessageActions,
  MessageContent,
} from '@fe/components/ui';

export function TextifyPromptMessage({ content }: { content: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <Message className="flex-col justify-start gap-2">
      <MessageContent markdown className="bg-transparent">
        {content}
      </MessageContent>
      <MessageActions className="self-end">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 rounded-full"
          onClick={handleCopy}
        >
          {copied ? (
            <CheckIcon className="size-4" />
          ) : (
            <CopyIcon className="size-4" />
          )}
        </Button>
      </MessageActions>
    </Message>
  );
}
