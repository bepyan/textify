import { createFileRoute } from '@tanstack/react-router';
import { useState } from 'react';

export const Route = createFileRoute('/')({
  component: Page,
});

function Page() {
  const [name, setName] = useState('');

  return (
    <div>
      <button
        onClick={() => {
          fetch('/api/')
            .then((res) => res.json() as Promise<{ name: string }>)
            .then((data) => setName(data.name));
        }}
        aria-label="get name"
      >
        Name from API is: {name}
      </button>
    </div>
  );
}
