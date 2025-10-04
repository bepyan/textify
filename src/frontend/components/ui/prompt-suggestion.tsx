import { type VariantProps } from 'class-variance-authority';

import { Button, type buttonVariants } from '@fe/components/ui';
import { cn } from '@fe/lib/utils';

export type PromptSuggestionProps = {
  children: React.ReactNode;
  variant?: VariantProps<typeof buttonVariants>['variant'];
  size?: VariantProps<typeof buttonVariants>['size'];
  className?: string;
  highlight?: string;
} & React.ButtonHTMLAttributes<HTMLButtonElement>;

function PromptSuggestion({
  children,
  variant,
  size,
  className,
  ...props
}: PromptSuggestionProps) {
  return (
    <Button
      variant={variant || 'ghost'}
      size={size || 'sm'}
      className={cn('justify-start rounded-xl py-2', className)}
      {...props}
    >
      <span className="text-muted-foreground whitespace-pre-wrap">
        {children}
      </span>
    </Button>
  );
}

export { PromptSuggestion };
