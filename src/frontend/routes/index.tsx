import { createFileRoute } from '@tanstack/react-router';

import { TextifyIntro } from '@fe/features/textify-intro';

export const Route = createFileRoute('/')({
  component: TextifyIntro,
});
