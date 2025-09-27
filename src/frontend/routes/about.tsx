import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/about')({
  component: Page,
});

function Page() {
  return <div className="p-2">Hello from About!</div>;
}
