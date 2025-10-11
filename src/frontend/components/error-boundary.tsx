import { QueryErrorResetBoundary } from '@tanstack/react-query';
import {
  ErrorBoundary as ReactErrorBoundary,
  type FallbackProps,
} from 'react-error-boundary';

import { Button } from './ui';

export function ErrorBoundary({
  children,
  Fallback = DefaultFallback,
}: {
  children: React.ReactNode;
  Fallback?: typeof DefaultFallback;
}) {
  return (
    <QueryErrorResetBoundary>
      {({ reset }) => (
        <ReactErrorBoundary onReset={reset} fallbackRender={Fallback}>
          {children}
        </ReactErrorBoundary>
      )}
    </QueryErrorResetBoundary>
  );
}

function DefaultFallback({ error, resetErrorBoundary }: FallbackProps) {
  console.error(error);

  return (
    <div className="pt-safe-offset-top flex flex-col items-center gap-2">
      <h2 className="text-lg font-bold">오류가 발생되었습니다.</h2>
      <p>잠시 후 다시 시도해주세요.</p>
      {resetErrorBoundary && (
        <Button
          variant="mono"
          size="lg"
          className="mt-3"
          onClick={() => resetErrorBoundary()}
        >
          다시 시도
        </Button>
      )}
    </div>
  );
}
