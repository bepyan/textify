import { cva, type VariantProps } from 'class-variance-authority';
import { X } from 'lucide-react';

import { cn } from '~/lib/utils';

const alertVariants = cva(
  'flex w-full items-stretch gap-2 group-[.toaster]:w-(--width)',
  {
    variants: {
      variant: {
        secondary: '',
        primary: '',
        destructive: '',
        success: '',
        info: '',
        mono: '',
        warning: '',
      },
      icon: {
        primary: '',
        destructive: '',
        success: '',
        info: '',
        warning: '',
      },
      appearance: {
        solid: '',
        outline: '',
        light: '',
        stroke: 'text-foreground',
      },
      size: {
        lg: 'gap-3 rounded-lg p-4 text-base *:data-slot=alert-icon:mt-0.5 [&_[data-slot=alert-close]]:mt-1 [&>[data-slot=alert-icon]>svg]:size-6',
        md: 'gap-2.5 rounded-lg p-3.5 text-sm *:data-slot=alert-icon:mt-0 [&_[data-slot=alert-close]]:mt-0.5 [&>[data-slot=alert-icon]>svg]:size-5',
        sm: 'gap-2 rounded-md px-3 py-2.5 text-xs *:data-alert-icon:mt-0.5 [&_[data-slot=alert-close]]:mt-0.25 [&_[data-slot=alert-close]_svg]:size-3.5 [&>[data-slot=alert-icon]>svg]:size-4',
      },
    },
    compoundVariants: [
      /* Solid */
      {
        variant: 'secondary',
        appearance: 'solid',
        className: 'bg-muted text-foreground',
      },
      {
        variant: 'primary',
        appearance: 'solid',
        className: 'bg-primary text-primary-foreground',
      },
      {
        variant: 'destructive',
        appearance: 'solid',
        className: 'bg-destructive text-destructive-foreground',
      },
      {
        variant: 'success',
        appearance: 'solid',
        className:
          'bg-[var(--color-success,var(--color-green-500))] text-[var(--color-success-foreground,var(--color-white))]',
      },
      {
        variant: 'info',
        appearance: 'solid',
        className:
          'bg-[var(--color-info,var(--color-violet-600))] text-[var(--color-info-foreground,var(--color-white))]',
      },
      {
        variant: 'warning',
        appearance: 'solid',
        className:
          'bg-[var(--color-warning,var(--color-yellow-500))] text-[var(--color-warning-foreground,var(--color-white))]',
      },
      {
        variant: 'mono',
        appearance: 'solid',
        className:
          '*:data-slot-[alert=close]:text-white bg-zinc-950 text-white dark:bg-zinc-300 dark:text-black',
      },

      /* Outline */
      {
        variant: 'secondary',
        appearance: 'outline',
        className:
          'border-border bg-background text-foreground [&_[data-slot=alert-close]]:text-foreground border',
      },
      {
        variant: 'primary',
        appearance: 'outline',
        className:
          'border-border bg-background text-primary [&_[data-slot=alert-close]]:text-foreground border',
      },
      {
        variant: 'destructive',
        appearance: 'outline',
        className:
          'border-border bg-background text-destructive [&_[data-slot=alert-close]]:text-foreground border',
      },
      {
        variant: 'success',
        appearance: 'outline',
        className:
          'border-border bg-background [&_[data-slot=alert-close]]:text-foreground border text-[var(--color-success,var(--color-green-500))]',
      },
      {
        variant: 'info',
        appearance: 'outline',
        className:
          'border-border bg-background [&_[data-slot=alert-close]]:text-foreground border text-[var(--color-info,var(--color-violet-600))]',
      },
      {
        variant: 'warning',
        appearance: 'outline',
        className:
          'border-border bg-background [&_[data-slot=alert-close]]:text-foreground border text-[var(--color-warning,var(--color-yellow-500))]',
      },
      {
        variant: 'mono',
        appearance: 'outline',
        className:
          'border-border bg-background text-foreground [&_[data-slot=alert-close]]:text-foreground border',
      },

      /* Light */
      {
        variant: 'secondary',
        appearance: 'light',
        className: 'bg-muted border-border text-foreground border',
      },
      {
        variant: 'primary',
        appearance: 'light',
        className:
          'text-foreground [&_[data-slot=alert-icon]]:text-primary border border-[var(--color-primary-alpha,var(--color-blue-100))] bg-[var(--color-primary-soft,var(--color-blue-50))] dark:border-[var(--color-primary-alpha,var(--color-blue-900))] dark:bg-[var(--color-primary-soft,var(--color-blue-950))]',
      },
      {
        variant: 'destructive',
        appearance: 'light',
        className:
          'text-foreground [&_[data-slot=alert-icon]]:text-destructive border border-[var(--color-destructive-alpha,var(--color-red-100))] bg-[var(--color-destructive-soft,var(--color-red-50))] dark:border-[var(--color-destructive-alpha,var(--color-red-900))] dark:bg-[var(--color-destructive-soft,var(--color-red-950))]',
      },
      {
        variant: 'success',
        appearance: 'light',
        className:
          'text-foreground border border-[var(--color-success-alpha,var(--color-green-200))] bg-[var(--color-success-soft,var(--color-green-50))] dark:border-[var(--color-success-alpha,var(--color-green-900))] dark:bg-[var(--color-success-soft,var(--color-green-950))] [&_[data-slot=alert-icon]]:text-[var(--color-success-foreground,var(--color-green-600))]',
      },
      {
        variant: 'info',
        appearance: 'light',
        className:
          'text-foreground border border-[var(--color-info-alpha,var(--color-violet-100))] bg-[var(--color-info-soft,var(--color-violet-50))] dark:border-[var(--color-info-alpha,var(--color-violet-900))] dark:bg-[var(--color-info-soft,var(--color-violet-950))] [&_[data-slot=alert-icon]]:text-[var(--color-info-foreground,var(--color-violet-600))]',
      },
      {
        variant: 'warning',
        appearance: 'light',
        className:
          'text-foreground border border-[var(--color-warning-alpha,var(--color-yellow-200))] bg-[var(--color-warning-soft,var(--color-yellow-50))] dark:border-[var(--color-warning-alpha,var(--color-yellow-900))] dark:bg-[var(--color-warning-soft,var(--color-yellow-950))] [&_[data-slot=alert-icon]]:text-[var(--color-warning-foreground,var(--color-yellow-600))]',
      },

      /* Mono */
      {
        variant: 'mono',
        icon: 'primary',
        className: '[&_[data-slot=alert-icon]]:text-primary',
      },
      {
        variant: 'mono',
        icon: 'warning',
        className:
          '[&_[data-slot=alert-icon]]:text-[var(--color-warning-foreground,var(--color-yellow-600))]',
      },
      {
        variant: 'mono',
        icon: 'success',
        className:
          '[&_[data-slot=alert-icon]]:text-[var(--color-success-foreground,var(--color-green-600))]',
      },
      {
        variant: 'mono',
        icon: 'destructive',
        className: '[&_[data-slot=alert-icon]]:text-destructive',
      },
      {
        variant: 'mono',
        icon: 'info',
        className:
          '[&_[data-slot=alert-icon]]:text-[var(--color-info-foreground,var(--color-violet-600))]',
      },
    ],
    defaultVariants: {
      variant: 'secondary',
      appearance: 'solid',
      size: 'md',
    },
  },
);

interface AlertProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof alertVariants> {
  close?: boolean;
  onClose?: () => void;
}

interface AlertIconProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof alertVariants> {}

function Alert({
  className,
  variant,
  size,
  icon,
  appearance,
  close = false,
  onClose,
  children,
  ...props
}: AlertProps) {
  return (
    <div
      data-slot="alert"
      role="alert"
      className={cn(
        alertVariants({ variant, size, icon, appearance }),
        className,
      )}
      {...props}
    >
      {children}
      {close && (
        <button
          onClick={onClose}
          aria-label="Dismiss"
          data-slot="alert-close"
          className={cn('group size-4 shrink-0 cursor-pointer')}
        >
          <X className="size-4 opacity-60 group-hover:opacity-100" />
        </button>
      )}
    </div>
  );
}

function AlertTitle({
  className,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <div
      data-slot="alert-title"
      className={cn('grow tracking-tight', className)}
      {...props}
    />
  );
}

function AlertIcon({ children, className, ...props }: AlertIconProps) {
  return (
    <div
      data-slot="alert-icon"
      className={cn('shrink-0', className)}
      {...props}
    >
      {children}
    </div>
  );
}

function AlertToolbar({ children, className, ...props }: AlertIconProps) {
  return (
    <div data-slot="alert-toolbar" className={cn(className)} {...props}>
      {children}
    </div>
  );
}

function AlertDescription({
  className,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <div
      data-slot="alert-description"
      className={cn('text-sm [&_p]:mb-2 [&_p]:leading-relaxed', className)}
      {...props}
    />
  );
}

function AlertContent({
  className,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <div
      data-slot="alert-content"
      className={cn(
        'space-y-2 [&_[data-slot=alert-title]]:font-semibold',
        className,
      )}
      {...props}
    />
  );
}

export {
  Alert,
  AlertContent,
  AlertDescription,
  AlertIcon,
  AlertTitle,
  AlertToolbar,
};
