import { CheckIcon, CopyIcon } from 'lucide-react';
import { useRef, useState } from 'react';

import { Button } from '@fe/components/ui';

export function useCopy({
  text,
  duration = 1500,
}: {
  text: string;
  duration?: number;
}) {
  const [copied, setCopied] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      setCopied(false);
      timeoutRef.current = null;
    }, duration);
  };

  return { copied, handleCopy };
}

export function CopyButton({
  text,
  duration = 1500,
}: {
  text: string;
  duration?: number;
}) {
  const { copied, handleCopy } = useCopy({ text, duration });
  return (
    <Button
      variant="secondary"
      size="lg"
      className="justify-start"
      onClick={handleCopy}
    >
      {copied ? <CheckIcon /> : <CopyIcon />}
      <span>{copied ? '콘텐츠 복사완료' : '콘텐츠 복사하기'}</span>
    </Button>
  );
}
