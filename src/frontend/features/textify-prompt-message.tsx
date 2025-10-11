'use client';

import { Message, MessageContent } from '@fe/components/ui';

export function TextifyPromptMessage({ content }: { content: string }) {
  return (
    <Message className="flex-col justify-start gap-2">
      <MessageContent markdown>{content}</MessageContent>
    </Message>
  );
}
