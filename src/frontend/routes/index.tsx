import { createFileRoute } from '@tanstack/react-router';

import { TextifyApp } from '@fe/components/textify-app';

export const Route = createFileRoute('/')({
  component: TextifyApp,
});
