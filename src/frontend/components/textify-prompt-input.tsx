'use client';

import { useForm } from '@tanstack/react-form';
import { ArrowUp } from 'lucide-react';
import { Drawer } from 'vaul';
import { z } from 'zod';

import {
  Button,
  buttonVariants,
  Field,
  FieldError,
  Textarea,
} from '@fe/components/ui';
import { cn } from '@fe/lib/utils';

const formSchema = z.object({
  url: z.url('유효한 링크를 입력해주세요.'),
});

export function TextifyPromptInput({
  onSubmit,
}: {
  onSubmit: (value: string) => void;
}) {
  const form = useForm({
    defaultValues: {
      url: '',
    },
    validators: {
      onSubmit: formSchema,
    },
    onSubmit: ({ value }) => {
      onSubmit(value.url);
    },
  });

  const handlePaste = async () => {
    const text = await navigator.clipboard.readText();
    form.setFieldValue('url', text);
    void form.handleSubmit();
  };

  return (
    <Drawer.Root>
      <Drawer.Trigger asChild>
        <Button
          autoHeight
          variant="outline"
          mode="input"
          placeholder
          className="w-full rounded-3xl p-2 pl-5 shadow"
        >
          <span className="text-sm">링크를 입력해주세요...</span>
          <div
            className={cn(
              'ml-auto',
              buttonVariants({ mode: 'icon', variant: 'mono' }),
            )}
          >
            <ArrowUp role="img" />
          </div>
        </Button>
      </Drawer.Trigger>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 bg-black/40" />
        <Drawer.Content
          className="fixed inset-x-2 bottom-2 flex max-h-[82vh] flex-col"
          style={
            {
              '--initial-transform': 'calc(100% + 1rem)',
            } as React.CSSProperties
          }
        >
          <div className="bg-background container overflow-auto rounded-[10px] p-4">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                void form.handleSubmit();
              }}
            >
              <Drawer.Handle />
              <form.Field
                name="url"
                children={(field) => {
                  const isInvalid =
                    field.state.meta.isTouched && !field.state.meta.isValid;
                  return (
                    <Field data-invalid={isInvalid} className="mt-4">
                      <Textarea
                        autoFocus
                        rows={6}
                        name={field.name}
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(e.target.value)}
                        aria-invalid={isInvalid}
                        className="resize-none text-base"
                        placeholder="링크를 입력해주세요..."
                      />
                      {isInvalid && (
                        <FieldError errors={field.state.meta.errors} />
                      )}
                    </Field>
                  );
                }}
              />
              <Field orientation="horizontal" className="mt-2">
                <Button
                  type="button"
                  variant="secondary"
                  size="lg"
                  onClick={() => handlePaste()}
                >
                  클립보드 붙여넣기
                </Button>
                <Button
                  type="submit"
                  variant="mono"
                  size="lg"
                  className="flex-1"
                >
                  링크 제출하기
                </Button>
              </Field>
            </form>
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
