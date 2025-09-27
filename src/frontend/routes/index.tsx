import { createFileRoute } from '@tanstack/react-router';
import { ContentExtractor } from '../components/content-extractor/extractor';

export const Route = createFileRoute('/')({
  component: HomePage,
});

function HomePage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <ContentExtractor />
    </div>
  );
}
