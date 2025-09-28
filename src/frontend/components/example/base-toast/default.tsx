'use client';

import { Button } from '@fe/components/ui/base-button';
import { useToast } from '@fe/hooks/use-toast';

export default function ToastDemo() {
  const toast = useToast();

  return (
    <div className="space-y-4">
      <Button
        variant="outline"
        onClick={() =>
          toast.add({
            title: 'Your request has been sent',
            description: "We'll get back to you as soon as possible",
          })
        }
      >
        Show Toast
      </Button>
    </div>
  );
}
