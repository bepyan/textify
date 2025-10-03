import { createFileRoute } from '@tanstack/react-router';

import { LogoIcon } from '@fe/components/icons';
import { Button, Skeleton } from '@fe/components/ui';
import { client } from '@fe/lib/api';

export const Route = createFileRoute('/sample')({
  component: Page,
});

function Page() {
  const handleSubmit = async () => {
    const res = await client.api.sample.users[':id'].$get({
      param: {
        id: Math.random().toString(36).substring(2, 15),
      },
    });
    const data = await res.json();
    console.log(data);
  };

  return (
    <main className="h-full w-full">
      <div className="flex h-full max-h-[920px] min-h-[400px] w-full flex-col items-center justify-center gap-4">
        <LogoIcon className="size-8 fill-current" />
        <Button variant="mono" onClick={handleSubmit}>
          Submit
        </Button>
      </div>
      <Skeleton className="size-full" />
    </main>
  );
}
