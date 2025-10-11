import { createFileRoute, Navigate, useSearch } from '@tanstack/react-router';
import { toast } from 'sonner';
import z from 'zod';

import { TextifyContent } from '@fe/features/textify-content';

export const Route = createFileRoute('/content')({
  validateSearch: z.object({
    url: z.string(),
  }),
  component: RouteComponent,
});

function RouteComponent() {
  const { url } = useSearch({ from: '/content' });

  if (!url) {
    toast.error('유효한 링크를 입력해주세요.');
    return <Navigate to="/" />;
  }

  return <TextifyContent url={url} />;
}
