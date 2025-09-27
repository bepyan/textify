import { type VariantProps } from 'class-variance-authority';

import { Button, type buttonVariants } from '~/components/ui/button';
import { cn } from '~/lib/utils';

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
      className={cn(
        'w-full cursor-pointer justify-start gap-0 rounded-xl py-2',
        'hover:bg-accent',
        className,
      )}
      {...props}
    >
      <span className="text-muted-foreground whitespace-pre-wrap">
        {children}
      </span>
    </Button>
  );
}

export { PromptSuggestion };
